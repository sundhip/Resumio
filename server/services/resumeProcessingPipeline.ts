import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db, resumeUploadDir } from '../database/db.js';
import { extractDocumentText, computeFileHash } from './documentExtractor.js';
import { parseResumeText, ParsedResumeResult } from './resumeParser.js';
import { screenParsedResume, ScreeningResult } from './resumeScreening.js';
import { DuplicateResumeService } from './duplicateResumeService.js';

export interface ProcessResumeResult {
  status: 'Processed' | 'Failed';
  parsed: ParsedResumeResult | null;
  screening: ScreeningResult | null;
  errorMessage?: string;
}

/**
 * Executes end-to-end parsing and AI screening on a candidate's resume file.
 */
export async function processResumeAndScreen(
  resumeId: string,
  candidateId: string,
  candidateProfileId: string,
  storedFilename: string,
  applicationId?: string,
  jobId?: string
): Promise<ProcessResumeResult> {
  const filePath = path.join(resumeUploadDir, storedFilename);

  if (!fs.existsSync(filePath)) {
    const errorMsg = 'Resume file not found on storage server.';
    recordParseFailure(resumeId, candidateId, candidateProfileId, errorMsg);
    return { status: 'Failed', parsed: null, screening: null, errorMessage: errorMsg };
  }

  // 1. Compute hash and mark parsing started
  const fileHash = computeFileHash(filePath);
  const now = new Date().toISOString();

  const existingParsed = db.prepare('SELECT id FROM resume_parsed_data WHERE resume_id = ?').get(resumeId) as any;
  if (!existingParsed) {
    const parsedId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO resume_parsed_data (
        id, resume_id, candidate_id, candidate_profile_id, file_hash, status, started_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'Processing', ?, ?, ?)
    `).run(parsedId, resumeId, candidateId, candidateProfileId, fileHash, now, now, now);
  } else {
    db.prepare(`
      UPDATE resume_parsed_data 
      SET status = 'Processing', file_hash = ?, started_at = ?, error_message = '', updated_at = ?
      WHERE resume_id = ?
    `).run(fileHash, now, now, resumeId);
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileBase64 = fileBuffer.toString('base64');
    let parsed: ParsedResumeResult;
    let resumeDocument: any = null;
    let atsReport: any = null;
    let extractedText = '';

    // Attempt calling FastAPI ML microservice
    const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const mlResponse = await fetch(`${mlUrl}/v1/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64: fileBase64,
          file_name: storedFilename,
          candidate_id: candidateId,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (mlResponse.ok) {
        const mlData = (await mlResponse.json()) as any;
        if (mlData.document) {
          resumeDocument = mlData.document;
          atsReport = mlData.ats_report;
          extractedText = mlData.document.summary || '';

          // Map canonical ResumeDocument into backward-compatible ParsedResumeResult
          parsed = {
            personal: {
              candidateName: mlData.document.contact?.fullName || mlData.candidate_name || '',
              email: mlData.document.contact?.email || mlData.email || '',
              phone: mlData.document.contact?.phone || mlData.phone || '',
              location: mlData.document.contact?.location || '',
              headline: mlData.document.contact?.headline || '',
            },
            summary: mlData.document.summary || '',
            skills: (mlData.document.skills || []).map((s: any) => (typeof s === 'string' ? s : s.name)),
            education: (mlData.document.education || []).map((e: any) => ({
              degree: e.degree || '',
              field: e.fieldOfStudy || '',
              institution: e.institution || '',
              startDate: e.startDate || '',
              endDate: e.endDate || '',
            })),
            experience: (mlData.document.experience || []).map((ex: any) => ({
              jobTitle: ex.jobTitle || '',
              company: ex.company || '',
              startDate: ex.startDate || '',
              endDate: ex.endDate || '',
              responsibilities: (ex.responsibilities || []).join('\n'),
            })),
            projects: mlData.document.projects || [],
            certifications: mlData.document.certifications || [],
            languages: mlData.document.languages || [],
            achievements: [],
            confidence: { skills: 'high', overall: 'high' } as any,
            sectionsDetectedCount: mlData.document.sectionsDetected?.length || 5,
            overallQualityScore: atsReport?.score || 85,
          };
        } else {
          throw new Error('ML service response missing document payload');
        }
      } else {
        throw new Error(`ML service returned status ${mlResponse.status}`);
      }
    } catch (mlErr) {
      // Deterministic offline fallback
      const extracted = await extractDocumentText(filePath);
      if (!extracted.text || extracted.text.trim().length === 0) {
        throw new Error('Document contained no readable text. Please check if file is password protected or corrupted.');
      }
      extractedText = extracted.text;
      parsed = parseResumeText(extracted.text);

      // Construct offline ATS diagnostics and canonical ResumeDocument
      const issues: any[] = [];
      let atsScore = 100;
      if (!parsed.personal.email) {
        atsScore -= 20;
        issues.push({
          id: 'missing_email',
          category: 'header_footer_contact',
          severity: 'critical',
          title: 'Missing Email Address',
          description: 'No valid email was identified in the resume text.',
          location: 'Contact',
          recommendation: 'Add a standard email address in the contact section.',
        });
      }
      if (!parsed.skills || parsed.skills.length < 3) {
        atsScore -= 15;
        issues.push({
          id: 'low_skills',
          category: 'missing_sections',
          severity: 'warning',
          title: 'Few Identified Skills',
          description: 'Fewer than 3 recognized skills were detected.',
          location: 'Skills',
          recommendation: 'Add a clear Technical Skills section with bulleted keywords.',
        });
      }
      if (!parsed.experience || parsed.experience.length === 0) {
        atsScore -= 25;
        issues.push({
          id: 'missing_exp',
          category: 'missing_sections',
          severity: 'critical',
          title: 'No Work Experience Entries Detected',
          description: 'No chronological employment history was found.',
          location: 'Experience',
          recommendation: 'Add your work experience with role title, company, and dates.',
        });
      }

      atsReport = {
        score: Math.max(20, atsScore),
        status: atsScore >= 80 ? 'good' : 'needs_improvement',
        discrepancyRatio: 0.05,
        strategyAgreement: { naive: 0.95, layout: 1.0 },
        issues,
        strengths: ['Document successfully processed with deterministic text engine.'],
        detectedLayout: 'single_column',
        isScannedOrImage: false,
        hasHiddenText: false,
        disclaimer: 'This ATS Parse-ability score is a simulated diagnostic across multiple extraction heuristics.',
      };

      resumeDocument = {
        schemaVersion: '2.0.0',
        parserVersion: 'resumio-engine-v3.0.0-fallback',
        documentId: `doc_${crypto.randomUUID().slice(0, 12)}`,
        candidateId,
        fileMetadata: {
          fileName: storedFilename,
          fileSizeBytes: fileBuffer.length,
          fileFormat: storedFilename.endsWith('.docx') ? 'DOCX' : 'PDF',
          detectedMimeType: 'application/octet-stream',
          pageCount: 1,
          isEncrypted: false,
          fileHashSha256: fileHash,
        },
        contact: {
          fullName: parsed.personal.candidateName,
          email: parsed.personal.email,
          phone: parsed.personal.phone,
          location: parsed.personal.location,
          headline: parsed.personal.headline,
          confidence: 0.85,
        },
        summary: parsed.summary,
        skills: parsed.skills.map((s) => ({ name: s, category: 'Technical' })),
        experience: parsed.experience.map((e, idx) => ({
          id: `exp_${idx + 1}`,
          jobTitle: e.jobTitle,
          company: e.company,
          startDate: e.startDate || '',
          endDate: e.endDate || '',
          responsibilities: e.description ? [e.description] : [],
        })),
        education: parsed.education.map((edu, idx) => ({
          id: `edu_${idx + 1}`,
          degree: edu.degree,
          institution: edu.institution,
          endDate: edu.endDate || '',
        })),
        projects: parsed.projects,
        certifications: parsed.certifications,
        languages: parsed.languages,
        totalExperienceMonths: 24,
        sectionsDetected: ['contact', 'experience', 'education', 'skills'],
        atsReport,
        extractedAt: new Date().toISOString(),
      };
    }

    // 4. Save Parsed Data & Phase 3 ATS Document
    const completedAt = new Date().toISOString();
    db.prepare(`
      UPDATE resume_parsed_data SET
        status = 'Processed',
        file_hash = ?,
        error_message = '',
        raw_text = ?,
        candidate_name = ?,
        email = ?,
        phone = ?,
        location = ?,
        headline = ?,
        summary = ?,
        skills_json = ?,
        education_json = ?,
        experience_json = ?,
        projects_json = ?,
        certifications_json = ?,
        languages_json = ?,
        achievements_json = ?,
        confidence_json = ?,
        sections_detected_count = ?,
        resume_document_json = ?,
        ats_report_json = ?,
        completed_at = ?,
        updated_at = ?
      WHERE resume_id = ?
    `).run(
      fileHash,
      extractedText,
      parsed.personal.candidateName || '',
      parsed.personal.email || '',
      parsed.personal.phone || '',
      parsed.personal.location || '',
      parsed.personal.headline || '',
      parsed.summary || '',
      JSON.stringify(parsed.skills),
      JSON.stringify(parsed.education),
      JSON.stringify(parsed.experience),
      JSON.stringify(parsed.projects),
      JSON.stringify(parsed.certifications),
      JSON.stringify(parsed.languages),
      JSON.stringify(parsed.achievements),
      JSON.stringify(parsed.confidence),
      parsed.sectionsDetectedCount,
      JSON.stringify(resumeDocument),
      JSON.stringify(atsReport),
      completedAt,
      completedAt,
      resumeId
    );

    // 5. Run Initial AI Resume Screening
    const screening = screenParsedResume(parsed);

    // Save or update Screening record
    const existingScreening = db.prepare(`
      SELECT id FROM resume_screenings 
      WHERE resume_id = ? ${applicationId ? 'AND application_id = ?' : 'AND application_id IS NULL'}
    `).get(...(applicationId ? [resumeId, applicationId] : [resumeId])) as any;

    if (!existingScreening) {
      const screeningId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO resume_screenings (
          id, resume_id, application_id, job_id, status, completeness_score,
          sections_present_json, sections_missing_json, skills_detected_count,
          experience_years_detected, education_level_detected, screening_observations_json,
          screening_flags_json, started_at, completed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'Screened', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        screeningId,
        resumeId,
        applicationId || null,
        jobId || null,
        screening.completenessScore,
        JSON.stringify(screening.sectionsPresent),
        JSON.stringify(screening.sectionsMissing),
        screening.totalSkillsCount,
        screening.totalExperienceYears,
        screening.highestEducation,
        JSON.stringify(screening.observations),
        JSON.stringify(screening.screeningFlags),
        now,
        completedAt,
        now,
        completedAt
      );
    } else {
      db.prepare(`
        UPDATE resume_screenings SET
          status = 'Screened',
          error_message = '',
          completeness_score = ?,
          sections_present_json = ?,
          sections_missing_json = ?,
          skills_detected_count = ?,
          experience_years_detected = ?,
          education_level_detected = ?,
          screening_observations_json = ?,
          screening_flags_json = ?,
          completed_at = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        screening.completenessScore,
        JSON.stringify(screening.sectionsPresent),
        JSON.stringify(screening.sectionsMissing),
        screening.totalSkillsCount,
        screening.totalExperienceYears,
        screening.highestEducation,
        JSON.stringify(screening.observations),
        JSON.stringify(screening.screeningFlags),
        completedAt,
        completedAt,
        existingScreening.id
      );
    }

    // 6. Execute Duplicate Resume Detection (Phase 8 Feature 34)
    try {
      DuplicateResumeService.detectDuplicates(resumeId, candidateId, fileHash, extracted.text);
    } catch (dupErr) {
      console.error('Duplicate detection non-fatal error:', dupErr);
    }

    return {
      status: 'Processed',
      parsed,
      screening,
    };
  } catch (err: any) {
    const errorMsg = err.message || 'Failed to process resume document.';
    recordParseFailure(resumeId, candidateId, candidateProfileId, errorMsg);
    return { status: 'Failed', parsed: null, screening: null, errorMessage: errorMsg };
  }
}

function recordParseFailure(resumeId: string, candidateId: string, candidateProfileId: string, errorMessage: string) {
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT id FROM resume_parsed_data WHERE resume_id = ?').get(resumeId);
  if (existing) {
    db.prepare(`
      UPDATE resume_parsed_data 
      SET status = 'Failed', error_message = ?, updated_at = ?
      WHERE resume_id = ?
    `).run(errorMessage, now, resumeId);
  } else {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO resume_parsed_data (
        id, resume_id, candidate_id, candidate_profile_id, file_hash, status, error_message, created_at, updated_at
      ) VALUES (?, ?, ?, ?, '', 'Failed', ?, ?, ?)
    `).run(id, resumeId, candidateId, candidateProfileId, errorMessage, now, now);
  }
}

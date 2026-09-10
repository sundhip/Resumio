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
    // 2. Extract text
    const extracted = await extractDocumentText(filePath);
    if (!extracted.text || extracted.text.trim().length === 0) {
      throw new Error('Document contained no readable text. Please check if file is password protected or corrupted.');
    }

    // 3. Parse text
    const parsed = parseResumeText(extracted.text);

    // 4. Save Parsed Data
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
        completed_at = ?,
        updated_at = ?
      WHERE resume_id = ?
    `).run(
      fileHash,
      extracted.text,
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

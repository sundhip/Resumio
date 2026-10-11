import crypto from 'crypto';
import { db } from '../database/db.js';
import { mongoDb } from '../database/mongoAdapter.js';
import { SkillNormalizationService } from './skillNormalizer.js';
import { MATCHING_MODEL_CONFIG, computeLexicalCosineSimilarity } from './matchingConfig.js';

export interface EvidenceItem {
  requirement: string;
  type: 'required_skill' | 'preferred_skill' | 'experience' | 'qualification' | 'semantic_relevance';
  status: 'matched' | 'partially_matched' | 'not_demonstrated' | 'uncertain';
  evidenceSource: 'resume_skills' | 'candidate_profile' | 'experience_history' | 'education_history' | 'none';
  evidenceText: string;
}

export interface MatchingScoreBreakdown {
  requiredSkillsScore: number;  // Max 45
  preferredSkillsScore: number; // Max 15
  experienceScore: number;      // Max 20
  qualificationScore: number;   // Max 10
  relevanceScore: number;       // Max 10 (TF-IDF semantic cosine)
  total: number;                // Max 100
}

export interface ResumeJobMatchResult {
  id: string;
  resumeId: string;
  jobId: string;
  applicationId: string | null;
  candidateId: string;
  candidateProfileId: string;
  algorithmVersion: string;
  status: 'Not Processed' | 'Processing' | 'Completed' | 'Failed';
  errorMessage?: string;
  matchScore: number;
  category: 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Low Match';
  categoryLabel: string;
  requiredSkillsMatched: string[];
  requiredSkillsMissing: string[];
  preferredSkillsMatched: string[];
  preferredSkillsMissing: string[];
  evidenceList: EvidenceItem[];
  scoreBreakdown: MatchingScoreBreakdown;
  weights: typeof MATCHING_MODEL_CONFIG.weights;
  experienceAssessment: string;
  qualificationAssessment: string;
  semanticAssessment: string;
  candidateExperienceYears: number;
  jobMinExperienceYears: number;
  candidateHighestEducation: string;
  jobQualificationRequired: string;
  completedAt?: string;
}

/**
 * Calculates deterministic degree level hierarchy
 */
function getDegreeLevel(degreeStr: string): number {
  if (!degreeStr) return 0;
  const lower = degreeStr.toLowerCase();
  if (lower.includes('phd') || lower.includes('doctor') || lower.includes('d.phil')) return 5;
  if (lower.includes('master') || lower.includes('m.tech') || lower.includes('ms') || lower.includes('mca') || lower.includes('mba') || lower.includes('m.s')) return 4;
  if (lower.includes('bachelor') || lower.includes('b.tech') || lower.includes('b.e') || lower.includes('bs') || lower.includes('b.s') || lower.includes('bca') || lower.includes('b.sc')) return 3;
  if (lower.includes('diploma') || lower.includes('associate')) return 2;
  if (lower.includes('high school') || lower.includes('secondary') || lower.includes('12th')) return 1;
  return 2;
}

/**
 * Estimates candidate total experience in years from profile & parsed history
 */
function calculateCandidateExperienceYears(profileId: string, parsedData?: any, screeningData?: any): number {
  if (screeningData && typeof screeningData.experience_years_detected === 'number' && screeningData.experience_years_detected > 0) {
    return screeningData.experience_years_detected;
  }

  const expRows = db.prepare('SELECT start_date, end_date, currently_working FROM candidate_experience WHERE candidate_profile_id = ?').all(profileId) as any[];
  if (expRows.length > 0) {
    let totalMonths = 0;
    const now = new Date();
    for (const exp of expRows) {
      if (!exp.start_date) continue;
      const start = new Date(exp.start_date);
      const end = exp.currently_working ? now : (exp.end_date ? new Date(exp.end_date) : now);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
        totalMonths += months;
      }
    }
    if (totalMonths > 0) {
      return Math.round((totalMonths / 12) * 10) / 10;
    }
  }

  if (parsedData && Array.isArray(parsedData.experience) && parsedData.experience.length > 0) {
    return Math.min(15, Math.max(1, parsedData.experience.length * 2));
  }

  return 0;
}

/**
 * Gets candidate's highest education string
 */
function getCandidateHighestEducation(profileId: string, parsedData?: any): string {
  const eduRows = db.prepare('SELECT degree, field_of_study FROM candidate_education WHERE candidate_profile_id = ?').all(profileId) as any[];
  if (eduRows.length > 0) {
    let bestLevel = 0;
    let bestDegree = '';
    for (const edu of eduRows) {
      const lvl = getDegreeLevel(edu.degree);
      if (lvl >= bestLevel) {
        bestLevel = lvl;
        bestDegree = edu.field_of_study ? `${edu.degree} in ${edu.field_of_study}` : edu.degree;
      }
    }
    if (bestDegree) return bestDegree;
  }

  if (parsedData && Array.isArray(parsedData.education) && parsedData.education.length > 0) {
    const first = parsedData.education[0];
    return first.field ? `${first.degree} in ${first.field}` : first.degree;
  }

  return 'Not Specified';
}

/**
 * Production-Grade Advanced Resume-Job Matching Engine (Phase 6)
 */
export class ResumeJobMatchingService {
  public static readonly ALGORITHM_VERSION = MATCHING_MODEL_CONFIG.version;
  public static readonly WEIGHTS = MATCHING_MODEL_CONFIG.weights;

  /**
   * Computes matching score, evidence items, component breakdown, and persists dual-store records.
   */
  public static async computeMatch(
    resumeId: string,
    jobId: string,
    candidateId: string,
    candidateProfileId: string,
    applicationId?: string | null,
    options?: { weights?: typeof MATCHING_MODEL_CONFIG.weights }
  ): Promise<ResumeJobMatchResult> {
    const activeWeights = options?.weights || this.WEIGHTS;
    // 1. Fetch Job and its required/preferred skills
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
    if (!job) {
      throw new Error(`Job not found with ID: ${jobId}`);
    }

    const reqSkillRows = db.prepare('SELECT name FROM job_required_skills WHERE job_id = ?').all(jobId) as any[];
    const prefSkillRows = db.prepare('SELECT name FROM job_preferred_skills WHERE job_id = ?').all(jobId) as any[];

    const jobRequiredSkills = reqSkillRows.map((r) => r.name);
    const jobPreferredSkills = prefSkillRows.map((r) => r.name);

    // 2. Fetch Candidate Information (Profile + Parsed Resume)
    const profile = db.prepare('SELECT * FROM candidate_profiles WHERE id = ?').get(candidateProfileId) as any;
    const candSkillRows = db.prepare('SELECT name FROM candidate_skills WHERE candidate_profile_id = ?').all(candidateProfileId) as any[];
    const candProfileSkills = candSkillRows.map((s) => s.name);

    const parsedRecord = db.prepare('SELECT * FROM resume_parsed_data WHERE resume_id = ?').get(resumeId) as any;
    const screeningRecord = db.prepare('SELECT * FROM resume_screenings WHERE resume_id = ?').get(resumeId) as any;

    let parsedSkills: string[] = [];
    let parsedEducation: any[] = [];
    let parsedExperience: any[] = [];
    let rawResumeText = '';

    if (parsedRecord) {
      rawResumeText = parsedRecord.raw_text || '';
      try { parsedSkills = JSON.parse(parsedRecord.skills_json || '[]'); } catch {}
      try { parsedEducation = JSON.parse(parsedRecord.education_json || '[]'); } catch {}
      try { parsedExperience = JSON.parse(parsedRecord.experience_json || '[]'); } catch {}
    }

    const allCandidateSkills = Array.from(new Set([...candProfileSkills, ...parsedSkills]));
    const evidenceList: EvidenceItem[] = [];

    // 3. Match Required Skills (Weight: 45%)
    const { matched: reqMatched, missing: reqMissing } = SkillNormalizationService.compareSkillSets(
      jobRequiredSkills,
      allCandidateSkills,
      rawResumeText
    );

    let requiredSkillsScore = this.WEIGHTS.requiredSkills;
    if (jobRequiredSkills.length > 0) {
      const matchRatio = reqMatched.length / jobRequiredSkills.length;
      requiredSkillsScore = Math.round(matchRatio * this.WEIGHTS.requiredSkills * 10) / 10;
    }

    // Populate required skill evidence
    for (const skill of jobRequiredSkills) {
      const isMatched = reqMatched.includes(skill);
      evidenceList.push({
        requirement: skill,
        type: 'required_skill',
        status: isMatched ? 'matched' : 'not_demonstrated',
        evidenceSource: isMatched ? (candProfileSkills.includes(skill) ? 'candidate_profile' : 'resume_skills') : 'none',
        evidenceText: isMatched ? `Demonstrated proficiency in ${skill}` : `Not demonstrated in candidate profile or parsed resume`,
      });
    }

    // 4. Match Preferred Skills (Weight: 15%)
    const { matched: prefMatched, missing: prefMissing } = SkillNormalizationService.compareSkillSets(
      jobPreferredSkills,
      allCandidateSkills,
      rawResumeText
    );

    let preferredSkillsScore = this.WEIGHTS.preferredSkills;
    if (jobPreferredSkills.length > 0) {
      const matchRatio = prefMatched.length / jobPreferredSkills.length;
      preferredSkillsScore = Math.round(matchRatio * this.WEIGHTS.preferredSkills * 10) / 10;
    }

    for (const skill of jobPreferredSkills) {
      const isMatched = prefMatched.includes(skill);
      evidenceList.push({
        requirement: skill,
        type: 'preferred_skill',
        status: isMatched ? 'matched' : 'not_demonstrated',
        evidenceSource: isMatched ? 'resume_skills' : 'none',
        evidenceText: isMatched ? `Satisfies nice-to-have capability: ${skill}` : 'Preferred skill not evidenced (non-mandatory)',
      });
    }

    // 5. Experience Evaluation (Weight: 20%)
    const candExpYears = calculateCandidateExperienceYears(
      candidateProfileId,
      { experience: parsedExperience },
      screeningRecord
    );
    const minReqExpYears = job.min_experience || 0;

    let experienceScore = this.WEIGHTS.experience;
    let experienceAssessment = 'Meets or exceeds required experience level';

    if (minReqExpYears > 0) {
      if (candExpYears >= minReqExpYears) {
        experienceScore = this.WEIGHTS.experience;
        experienceAssessment = `Strong alignment: ${candExpYears} yrs experience (Min ${minReqExpYears} yrs required)`;
      } else if (candExpYears > 0) {
        const expRatio = Math.min(1, candExpYears / minReqExpYears);
        experienceScore = Math.round(expRatio * this.WEIGHTS.experience * 10) / 10;
        experienceAssessment = `Partial alignment: ${candExpYears} yrs documented (Job prefers ${minReqExpYears}+ yrs)`;
      } else {
        experienceScore = 4;
        experienceAssessment = `Limited documented experience (${minReqExpYears} yrs required)`;
      }
    } else {
      experienceScore = this.WEIGHTS.experience;
      experienceAssessment = candExpYears > 0 ? `${candExpYears} yrs relevant experience` : 'Entry level / Open experience role';
    }

    evidenceList.push({
      requirement: `Minimum ${minReqExpYears} Years Experience`,
      type: 'experience',
      status: candExpYears >= minReqExpYears ? 'matched' : candExpYears > 0 ? 'partially_matched' : 'not_demonstrated',
      evidenceSource: 'experience_history',
      evidenceText: experienceAssessment,
    });

    // 6. Qualification / Education Evaluation (Weight: 10%)
    const jobQual = (job.qualification || '').trim();
    const candHighestEdu = getCandidateHighestEducation(
      candidateProfileId,
      { education: parsedEducation }
    );

    let qualificationScore = this.WEIGHTS.qualification;
    let qualificationAssessment = 'Qualification requirement satisfied';

    if (jobQual) {
      const jobLevel = getDegreeLevel(jobQual);
      const candLevel = getDegreeLevel(candHighestEdu);

      if (candLevel >= jobLevel && candLevel > 0) {
        qualificationScore = this.WEIGHTS.qualification;
        qualificationAssessment = `Meets degree requirement: ${candHighestEdu}`;
      } else if (candLevel > 0) {
        qualificationScore = 6;
        qualificationAssessment = `Related qualification: ${candHighestEdu} (Job requested: ${jobQual})`;
      } else {
        qualificationScore = 3;
        qualificationAssessment = `Degree details pending: ${candHighestEdu}`;
      }
    } else {
      qualificationScore = this.WEIGHTS.qualification;
      qualificationAssessment = candHighestEdu !== 'Not Specified' ? candHighestEdu : 'Standard educational eligibility';
    }

    evidenceList.push({
      requirement: jobQual || 'General Educational Eligibility',
      type: 'qualification',
      status: qualificationScore === this.WEIGHTS.qualification ? 'matched' : 'partially_matched',
      evidenceSource: 'education_history',
      evidenceText: qualificationAssessment,
    });

    // 7. Lexical Semantic Relevance via TF-IDF Cosine Similarity (Weight: 10%)
    const jobDescriptionFull = `${job.title} ${job.description || ''} ${job.responsibilities || ''}`;
    const cosineSim = computeLexicalCosineSimilarity(rawResumeText, jobDescriptionFull);
    const relevanceScore = Math.round((cosineSim / 100) * this.WEIGHTS.semanticRelevance * 10) / 10;
    const semanticAssessment = `TF-IDF text alignment score: ${cosineSim}% between resume narrative and job specifications.`;

    evidenceList.push({
      requirement: 'Job Narrative Semantic Relevance',
      type: 'semantic_relevance',
      status: cosineSim >= 50 ? 'matched' : 'partially_matched',
      evidenceSource: 'resume_skills',
      evidenceText: semanticAssessment,
    });

    // 8. Total Score Calculation & Categorization
    const totalRaw = requiredSkillsScore + preferredSkillsScore + experienceScore + qualificationScore + relevanceScore;
    const finalScore = Math.min(100, Math.max(0, Math.round(totalRaw)));

    let category: ResumeJobMatchResult['category'] = 'Moderate Match';
    let categoryLabel = 'Moderate Match';

    if (finalScore >= 80) {
      category = 'Strong Match';
      categoryLabel = 'Strong Match';
    } else if (finalScore >= 60) {
      category = 'Good Match';
      categoryLabel = 'Good Match';
    } else if (finalScore >= 40) {
      category = 'Moderate Match';
      categoryLabel = 'Moderate Match';
    } else {
      category = 'Low Match';
      categoryLabel = 'Low Match';
    }

    const matchId = crypto.randomUUID();
    const now = new Date().toISOString();

    const scoreBreakdown: MatchingScoreBreakdown = {
      requiredSkillsScore,
      preferredSkillsScore,
      experienceScore,
      qualificationScore,
      relevanceScore,
      total: finalScore,
    };

    const matchingDetails = {
      totalRequiredCount: jobRequiredSkills.length,
      matchedRequiredCount: reqMatched.length,
      totalPreferredCount: jobPreferredSkills.length,
      matchedPreferredCount: prefMatched.length,
      candExpYears,
      minReqExpYears,
      candHighestEdu,
      jobQual,
      category,
      categoryLabel,
      weights: this.WEIGHTS,
      evidenceList,
    };

    // 9. Persist to SQLite (UPSERT)
    const existing = db.prepare(`
      SELECT id FROM resume_job_matches 
      WHERE resume_id = ? AND job_id = ? AND algorithm_version = ?
    `).get(resumeId, jobId, this.ALGORITHM_VERSION) as any;

    if (existing) {
      db.prepare(`
        UPDATE resume_job_matches SET
          application_id = ?,
          candidate_id = ?,
          candidate_profile_id = ?,
          status = 'Completed',
          error_message = '',
          match_score = ?,
          required_skills_matched_json = ?,
          required_skills_missing_json = ?,
          preferred_skills_matched_json = ?,
          preferred_skills_missing_json = ?,
          required_skills_score = ?,
          preferred_skills_score = ?,
          experience_score = ?,
          qualification_score = ?,
          relevance_score = ?,
          experience_assessment = ?,
          qualification_assessment = ?,
          matching_details_json = ?,
          completed_at = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        applicationId || null,
        candidateId,
        candidateProfileId,
        finalScore,
        JSON.stringify(reqMatched),
        JSON.stringify(reqMissing),
        JSON.stringify(prefMatched),
        JSON.stringify(prefMissing),
        requiredSkillsScore,
        preferredSkillsScore,
        experienceScore,
        qualificationScore,
        relevanceScore,
        experienceAssessment,
        qualificationAssessment,
        JSON.stringify(matchingDetails),
        now,
        now,
        existing.id
      );
    } else {
      db.prepare(`
        INSERT INTO resume_job_matches (
          id, resume_id, job_id, application_id, candidate_id, candidate_profile_id,
          algorithm_version, status, error_message, match_score,
          required_skills_matched_json, required_skills_missing_json,
          preferred_skills_matched_json, preferred_skills_missing_json,
          required_skills_score, preferred_skills_score, experience_score,
          qualification_score, relevance_score, experience_assessment,
          qualification_assessment, matching_details_json, started_at, completed_at,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, 'Completed', '', ?,
          ?, ?,
          ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?
        )
      `).run(
        matchId,
        resumeId,
        jobId,
        applicationId || null,
        candidateId,
        candidateProfileId,
        this.ALGORITHM_VERSION,
        finalScore,
        JSON.stringify(reqMatched),
        JSON.stringify(reqMissing),
        JSON.stringify(prefMatched),
        JSON.stringify(prefMissing),
        requiredSkillsScore,
        preferredSkillsScore,
        experienceScore,
        qualificationScore,
        relevanceScore,
        experienceAssessment,
        qualificationAssessment,
        JSON.stringify(matchingDetails),
        now,
        now,
        now,
        now
      );
    }

    // 10. Persist to MongoDB dual-store
    try {
      await mongoDb.resume_job_matches.updateOne(
        { resume_id: resumeId, job_id: jobId, algorithm_version: this.ALGORITHM_VERSION },
        {
          $set: {
            id: existing ? existing.id : matchId,
            resume_id: resumeId,
            job_id: jobId,
            application_id: applicationId || null,
            candidate_id: candidateId,
            candidate_profile_id: candidateProfileId,
            algorithm_version: this.ALGORITHM_VERSION,
            status: 'Completed',
            match_score: finalScore,
            required_skills_matched_json: JSON.stringify(reqMatched),
            required_skills_missing_json: JSON.stringify(reqMissing),
            preferred_skills_matched_json: JSON.stringify(prefMatched),
            preferred_skills_missing_json: JSON.stringify(prefMissing),
            required_skills_score: requiredSkillsScore,
            preferred_skills_score: preferredSkillsScore,
            experience_score: experienceScore,
            qualification_score: qualificationScore,
            relevance_score: relevanceScore,
            experience_assessment: experienceAssessment,
            qualification_assessment: qualificationAssessment,
            matching_details_json: JSON.stringify(matchingDetails),
            completed_at: now,
            updated_at: now,
          },
        },
        { upsert: true }
      );
    } catch (e) {
      // Non-fatal if Mongo is unavailable
    }

    const savedId = existing ? existing.id : matchId;

    return {
      id: savedId,
      resumeId,
      jobId,
      applicationId: applicationId || null,
      candidateId,
      candidateProfileId,
      algorithmVersion: this.ALGORITHM_VERSION,
      status: 'Completed',
      matchScore: finalScore,
      category,
      categoryLabel,
      requiredSkillsMatched: reqMatched,
      requiredSkillsMissing: reqMissing,
      preferredSkillsMatched: prefMatched,
      preferredSkillsMissing: prefMissing,
      evidenceList,
      scoreBreakdown,
      weights: this.WEIGHTS,
      experienceAssessment,
      qualificationAssessment,
      semanticAssessment,
      candidateExperienceYears: candExpYears,
      jobMinExperienceYears: minReqExpYears,
      candidateHighestEducation: candHighestEdu,
      jobQualificationRequired: jobQual,
      completedAt: now,
    };
  }
}

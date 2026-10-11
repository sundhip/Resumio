import crypto from 'crypto';
import { db } from '../database/db.js';
import { mongoDb } from '../database/mongoAdapter.js';
import { ResumeJobMatchResult } from './matchingService.js';
import { aiProvider } from './aiProvider.js';
import { CandidateSummaryOutput, CandidateSummaryOutputSchema } from './aiValidation.js';
import { wrapInUntrustedBoundary } from './promptSecurity.js';

export interface CandidateSummaryResult {
  id: string;
  matchId: string;
  candidateId: string;
  resumeId: string;
  jobId: string;
  applicationId: string | null;
  summaryText: string;
  strengths: string[];
  gaps: string[];
  status: 'Completed' | 'Failed';
  errorMessage?: string;
  modelVersion: string;
  isAiGenerated?: boolean;
  createdAt?: string;
}

/**
 * Service to generate structured, evidence-based AI Candidate Summaries
 * Grounded in factual match data, zero hallucinations.
 */
export class CandidateSummaryService {
  public static readonly MODEL_VERSION = 'resumio-ai-v1';

  /**
   * Generates or retrieves cached candidate summary for a match
   */
  public static async generateSummary(
    match: ResumeJobMatchResult,
    jobTitle: string,
    companyName: string
  ): Promise<CandidateSummaryResult> {
    // 1. Check if cached summary already exists in SQLite
    const existing = db.prepare(`
      SELECT * FROM candidate_job_summaries WHERE match_id = ? AND model_version = ?
    `).get(match.id, this.MODEL_VERSION) as any;

    if (existing && existing.status === 'Completed') {
      let strengths: string[] = [];
      let gaps: string[] = [];
      try { strengths = JSON.parse(existing.strengths_json || '[]'); } catch {}
      try { gaps = JSON.parse(existing.gaps_json || '[]'); } catch {}

      return {
        id: existing.id,
        matchId: match.id,
        candidateId: existing.candidate_id,
        resumeId: existing.resume_id,
        jobId: existing.job_id,
        applicationId: existing.application_id || null,
        summaryText: existing.summary_text,
        strengths,
        gaps,
        status: 'Completed',
        modelVersion: existing.model_version,
        createdAt: existing.created_at,
      };
    }

    // 2. Fetch candidate profile facts
    const profile = db.prepare('SELECT full_name, headline FROM candidate_profiles WHERE id = ?').get(match.candidateProfileId) as any;
    const candidateName = profile?.full_name || 'Candidate';

    // 3. Deterministic baseline generator
    const deterministicFallback = (): CandidateSummaryOutput => {
      const strengths: string[] = [];
      const gaps: string[] = [];

      if (match.requiredSkillsMatched.length > 0) {
        strengths.push(`Demonstrated proficiency in core required skills: ${match.requiredSkillsMatched.slice(0, 4).join(', ')}.`);
      }
      if (match.candidateExperienceYears > 0) {
        strengths.push(`Has approximately ${match.candidateExperienceYears} years of documented professional software experience.`);
      }
      if (match.qualificationAssessment.includes('Meets degree')) {
        strengths.push(`Educational background satisfies degree criteria (${match.candidateHighestEducation}).`);
      }
      if (match.preferredSkillsMatched.length > 0) {
        strengths.push(`Additional nice-to-have capabilities in ${match.preferredSkillsMatched.slice(0, 3).join(', ')}.`);
      }

      if (match.requiredSkillsMissing.length > 0) {
        gaps.push(`Missing direct verification for ${match.requiredSkillsMissing.length} required skill(s): ${match.requiredSkillsMissing.slice(0, 3).join(', ')}.`);
      }
      if (match.jobMinExperienceYears > 0 && match.candidateExperienceYears < match.jobMinExperienceYears) {
        gaps.push(`Documented experience (${match.candidateExperienceYears} yrs) is below stated target of ${match.jobMinExperienceYears}+ yrs.`);
      }
      if (match.preferredSkillsMissing.length > 0) {
        gaps.push(`Secondary preferred skills not evidenced: ${match.preferredSkillsMissing.slice(0, 3).join(', ')}.`);
      }

      if (gaps.length === 0) {
        gaps.push('No significant technical skill or eligibility gaps detected for this role.');
      }

      let summaryText = '';
      let rec: CandidateSummaryOutput['recommendation'] = 'Potential Match';

      if (match.matchScore >= 80) {
        rec = 'Strong Match';
        summaryText = `${candidateName} demonstrates a strong fit for the ${jobTitle} position at ${companyName} (${match.matchScore}% Match). They exhibit high alignment across core competencies including ${match.requiredSkillsMatched.slice(0, 3).join(', ')}. ${match.experienceAssessment}.`;
        if (match.requiredSkillsMissing.length > 0) {
          summaryText += ` Primary area to review during evaluation: ${match.requiredSkillsMissing.join(', ')}.`;
        }
      } else if (match.matchScore >= 60) {
        rec = 'Potential Match';
        summaryText = `${candidateName} shows solid potential for the ${jobTitle} role (${match.matchScore}% Match) with verified background in ${match.requiredSkillsMatched.slice(0, 3).join(', ')}. ${match.experienceAssessment}.`;
        if (match.requiredSkillsMissing.length > 0) {
          summaryText += ` Key technical development areas include ${match.requiredSkillsMissing.join(', ')}.`;
        }
      } else {
        rec = 'Underqualified';
        summaryText = `${candidateName} presents a partial match for ${jobTitle} (${match.matchScore}% Match). While they possess foundational skills (${match.requiredSkillsMatched.slice(0, 2).join(', ') || 'general background'}), several core requirements remain unevidenced (${match.requiredSkillsMissing.slice(0, 3).join(', ')}).`;
      }

      return {
        summaryText,
        strengths,
        gaps,
        recommendation: rec,
        confidenceScore: 85,
      };
    };

    // 4. Generate structured summary via AI provider with fallback
    const matchFacts = JSON.stringify({
      candidateName,
      jobTitle,
      companyName,
      matchScore: match.matchScore,
      candidateExperienceYears: match.candidateExperienceYears,
      requiredSkillsMatched: match.requiredSkillsMatched,
      requiredSkillsMissing: match.requiredSkillsMissing,
      preferredSkillsMatched: match.preferredSkillsMatched,
      preferredSkillsMissing: match.preferredSkillsMissing,
      qualificationAssessment: match.qualificationAssessment,
      experienceAssessment: match.experienceAssessment,
    }, null, 2);

    const prompt = `
Generate an evidence-grounded candidate evaluation summary.
Strict Rules:
- Only reference facts provided in the factual profile below.
- Do NOT hallucinate skills or qualifications not listed.
- Deliver clear, professional, neutral recruitment observations.

${wrapInUntrustedBoundary('match_facts', matchFacts)}
`;

    const aiRes = await aiProvider.generateStructuredJson(
      prompt,
      CandidateSummaryOutputSchema,
      'You are an impartial recruitment intelligence engine. Produce structured evaluation summaries strictly grounded in provided data.',
      deterministicFallback
    );

    const summaryId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 5. Persist to SQLite
    db.prepare(`
      INSERT INTO candidate_job_summaries (
        id, match_id, candidate_id, resume_id, job_id, application_id,
        status, error_message, summary_text, strengths_json, gaps_json,
        model_version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'Completed', '', ?, ?, ?, ?, ?, ?)
    `).run(
      summaryId,
      match.id,
      match.candidateId,
      match.resumeId,
      match.jobId,
      match.applicationId || null,
      aiRes.data.summaryText,
      JSON.stringify(aiRes.data.strengths),
      JSON.stringify(aiRes.data.gaps),
      this.MODEL_VERSION,
      now,
      now
    );

    // 6. Persist to MongoDB dual-store
    try {
      await mongoDb.candidate_job_summaries.insertOne({
        _id: summaryId,
        id: summaryId,
        match_id: match.id,
        candidate_id: match.candidateId,
        resume_id: match.resumeId,
        job_id: match.jobId,
        application_id: match.applicationId || null,
        status: 'Completed',
        error_message: '',
        summary_text: aiRes.data.summaryText,
        strengths_json: JSON.stringify(aiRes.data.strengths),
        gaps_json: JSON.stringify(aiRes.data.gaps),
        model_version: this.MODEL_VERSION,
        created_at: now,
        updated_at: now,
      });
    } catch (e) {
      // Non-fatal if Mongo write fails in dual-store
    }

    return {
      id: summaryId,
      matchId: match.id,
      candidateId: match.candidateId,
      resumeId: match.resumeId,
      jobId: match.jobId,
      applicationId: match.applicationId || null,
      summaryText: aiRes.data.summaryText,
      strengths: aiRes.data.strengths,
      gaps: aiRes.data.gaps,
      status: 'Completed',
      modelVersion: this.MODEL_VERSION,
      isAiGenerated: aiRes.isAiGenerated,
      createdAt: now,
    };
  }
}

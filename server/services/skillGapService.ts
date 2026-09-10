import crypto from 'crypto';
import { db } from '../database/db.js';
import { ResumeJobMatchResult } from './matchingService.js';

export interface SkillGapAnalysisResult {
  id: string;
  matchId: string;
  candidateId: string;
  resumeId: string;
  jobId: string;
  applicationId: string | null;
  matchScore: number;
  overview: string;
  matchedAreas: string[];
  priorityGaps: string[];
  preferredGaps: string[];
  recommendationsOverview: string;
  status: 'Completed' | 'Failed';
  errorMessage?: string;
  modelVersion: string;
  createdAt?: string;
}

/**
 * Service to generate structured candidate skill gap analyses
 */
export class SkillGapAnalysisService {
  public static readonly MODEL_VERSION = 'resumio-ai-v1';

  /**
   * Generates or retrieves cached skill gap analysis for a candidate & match
   */
  public static async generateSkillGap(
    match: ResumeJobMatchResult,
    jobTitle: string,
    companyName: string
  ): Promise<SkillGapAnalysisResult> {
    // 1. Check if cached analysis exists
    const existing = db.prepare(`
      SELECT * FROM skill_gap_analyses WHERE match_id = ? AND model_version = ?
    `).get(match.id, this.MODEL_VERSION) as any;

    if (existing && existing.status === 'Completed') {
      let priorityGaps: string[] = [];
      let matchedAreas: string[] = [];
      try { priorityGaps = JSON.parse(existing.priority_gaps_json || '[]'); } catch {}
      try { matchedAreas = JSON.parse(existing.matched_areas_json || '[]'); } catch {}

      return {
        id: existing.id,
        matchId: match.id,
        candidateId: existing.candidate_id,
        resumeId: existing.resume_id,
        jobId: existing.job_id,
        applicationId: existing.application_id || null,
        matchScore: match.matchScore,
        overview: existing.overview,
        matchedAreas,
        priorityGaps,
        preferredGaps: match.preferredSkillsMissing,
        recommendationsOverview: existing.recommendations_overview,
        status: 'Completed',
        modelVersion: existing.model_version,
        createdAt: existing.created_at,
      };
    }

    // 2. Synthesize structured analysis
    const matchedAreas: string[] = [...match.requiredSkillsMatched, ...match.preferredSkillsMatched];
    const priorityGaps: string[] = [...match.requiredSkillsMissing];
    const preferredGaps: string[] = [...match.preferredSkillsMissing];

    let overview = '';
    if (priorityGaps.length === 0 && preferredGaps.length === 0) {
      overview = `Outstanding alignment! You satisfy 100% of the required and preferred technical skill requirements for the ${jobTitle} role at ${companyName}.`;
    } else if (priorityGaps.length === 0) {
      overview = `Strong core coverage! You match all mandatory technical skills (${matchedAreas.join(', ')}). The only missing areas are nice-to-have secondary skills (${preferredGaps.join(', ')}).`;
    } else {
      overview = `Your strongest technical alignment is in ${match.requiredSkillsMatched.slice(0, 3).join(', ') || 'your profile foundation'}. Focus on developing ${priorityGaps.slice(0, 2).join(' and ')} as high-priority competencies for this position.`;
    }

    let recommendationsOverview = '';
    if (priorityGaps.length > 0) {
      recommendationsOverview = `To maximize your candidate competitiveness for ${jobTitle}, prioritize acquiring hands-on project experience with ${priorityGaps.join(', ')}.`;
    } else if (preferredGaps.length > 0) {
      recommendationsOverview = `Deepening your exposure to ${preferredGaps.join(', ')} will further elevate your profile above peer candidates.`;
    } else {
      recommendationsOverview = 'Your technical skill portfolio is fully comprehensive for this position.';
    }

    // 3. Persist in skill_gap_analyses
    const gapId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO skill_gap_analyses (
        id, match_id, candidate_id, resume_id, job_id, application_id,
        status, error_message, overview, priority_gaps_json, matched_areas_json,
        recommendations_overview, model_version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'Completed', '', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      gapId,
      match.id,
      match.candidateId,
      match.resumeId,
      match.jobId,
      match.applicationId || null,
      overview,
      JSON.stringify(priorityGaps),
      JSON.stringify(matchedAreas),
      recommendationsOverview,
      this.MODEL_VERSION,
      now,
      now
    );

    return {
      id: gapId,
      matchId: match.id,
      candidateId: match.candidateId,
      resumeId: match.resumeId,
      jobId: match.jobId,
      applicationId: match.applicationId || null,
      matchScore: match.matchScore,
      overview,
      matchedAreas,
      priorityGaps,
      preferredGaps,
      recommendationsOverview,
      status: 'Completed',
      modelVersion: this.MODEL_VERSION,
      createdAt: now,
    };
  }
}

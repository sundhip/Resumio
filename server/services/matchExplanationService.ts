import { db } from '../database/db.js';
import { ResumeJobMatchingService, ResumeJobMatchResult } from './matchingService.js';

export interface ScoreComponentExplanation {
  name: string;
  score: number;
  maxScore: number;
  weightPercentage: number;
  summary: string;
  details: string[];
}

export interface ExplainableMatchScoreResult {
  matchId: string;
  resumeId: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  finalScore: number;
  category: 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Low Match';
  categoryLabel: string;
  algorithmVersion: string;
  isConsistent: boolean;
  components: {
    requiredSkills: ScoreComponentExplanation;
    preferredSkills: ScoreComponentExplanation;
    experience: ScoreComponentExplanation;
    qualification: ScoreComponentExplanation;
    relevance: ScoreComponentExplanation;
  };
  matchedSkills: {
    required: string[];
    preferred: string[];
  };
  missingSkills: {
    required: string[];
    preferred: string[];
  };
  factualSummary: string;
  naturalLanguageExplanation: string;
}

/**
 * Service to provide deterministic, transparent, explainable breakdowns of Phase 6 match scores.
 */
export class MatchExplanationService {
  public static readonly ALGORITHM_VERSION = '1.0.0';

  /**
   * Retrieves or computes explainable score details for an application or resume-job pair.
   */
  public static async getExplanation(
    applicationIdOrMatchId: string,
    requesterUserId: string,
    requesterRole: string
  ): Promise<ExplainableMatchScoreResult> {
    // 1. Locate the match record from either application_id, match_id, or direct lookup
    let matchRecord = db.prepare(`
      SELECT rjm.*, j.title as job_title, j.company_name, j.recruiter_id, j.min_experience, j.qualification,
             cp.full_name as candidate_name, cp.user_id as cand_user_id
      FROM resume_job_matches rjm
      JOIN jobs j ON rjm.job_id = j.id
      JOIN candidate_profiles cp ON rjm.candidate_profile_id = cp.id
      WHERE rjm.application_id = ? OR rjm.id = ?
    `).get(applicationIdOrMatchId, applicationIdOrMatchId) as any;

    if (!matchRecord) {
      // Check if application exists
      const app = db.prepare('SELECT id, candidate_id, candidate_profile_id, job_id, resume_id FROM applications WHERE id = ?').get(applicationIdOrMatchId) as any;
      if (app) {
        const computed = await ResumeJobMatchingService.computeMatch(
          app.resume_id,
          app.job_id,
          app.candidate_id,
          app.candidate_profile_id,
          app.id
        );
        matchRecord = db.prepare(`
          SELECT rjm.*, j.title as job_title, j.company_name, j.recruiter_id, j.min_experience, j.qualification,
                 cp.full_name as candidate_name, cp.user_id as cand_user_id
          FROM resume_job_matches rjm
          JOIN jobs j ON rjm.job_id = j.id
          JOIN candidate_profiles cp ON rjm.candidate_profile_id = cp.id
          WHERE rjm.id = ?
        `).get(computed.id) as any;
      }
    }

    if (!matchRecord) {
      throw new Error(`Match analysis not found for reference: ${applicationIdOrMatchId}`);
    }

    // 2. Enforce Authorization Boundary
    if (requesterRole === 'candidate' && matchRecord.cand_user_id !== requesterUserId) {
      throw new Error('Forbidden: You can only inspect your own match score explanations.');
    }
    if (requesterRole === 'recruiter' && matchRecord.recruiter_id !== requesterUserId) {
      throw new Error('Forbidden: You do not own the job posting associated with this application.');
    }

    // 3. Extract verified structured components
    let reqMatched: string[] = [];
    let reqMissing: string[] = [];
    let prefMatched: string[] = [];
    let prefMissing: string[] = [];
    let details: any = {};

    try { reqMatched = JSON.parse(matchRecord.required_skills_matched_json || '[]'); } catch {}
    try { reqMissing = JSON.parse(matchRecord.required_skills_missing_json || '[]'); } catch {}
    try { prefMatched = JSON.parse(matchRecord.preferred_skills_matched_json || '[]'); } catch {}
    try { prefMissing = JSON.parse(matchRecord.preferred_skills_missing_json || '[]'); } catch {}
    try { details = JSON.parse(matchRecord.matching_details_json || '{}'); } catch {}

    const reqScore = Number(matchRecord.required_skills_score || 0);
    const prefScore = Number(matchRecord.preferred_skills_score || 0);
    const expScore = Number(matchRecord.experience_score || 0);
    const qualScore = Number(matchRecord.qualification_score || 0);
    const relScore = Number(matchRecord.relevance_score || 0);
    const finalScore = Number(matchRecord.match_score || 0);

    const totalCalculated = Math.round(reqScore + prefScore + expScore + qualScore + relScore);
    const isConsistent = Math.abs(totalCalculated - finalScore) <= 1;

    const totalReqCount = reqMatched.length + reqMissing.length;
    const totalPrefCount = prefMatched.length + prefMissing.length;

    // Build Component Breakdowns
    const requiredSkillsComp: ScoreComponentExplanation = {
      name: 'Required Skills Alignment',
      score: reqScore,
      maxScore: 50,
      weightPercentage: 50,
      summary: totalReqCount > 0
        ? `${reqMatched.length} of ${totalReqCount} required skills verified (${Math.round((reqMatched.length / totalReqCount) * 100)}%)`
        : 'No mandatory skills specified by employer',
      details: reqMatched.length > 0
        ? [`Matched: ${reqMatched.join(', ')}`, ...(reqMissing.length > 0 ? [`Missing: ${reqMissing.join(', ')}`] : ['All required skills verified'])]
        : ['General skillset aligned'],
    };

    const preferredSkillsComp: ScoreComponentExplanation = {
      name: 'Preferred Skills (Nice-to-Have)',
      score: prefScore,
      maxScore: 15,
      weightPercentage: 15,
      summary: totalPrefCount > 0
        ? `${prefMatched.length} of ${totalPrefCount} preferred skills matched`
        : 'No additional preferred skills listed',
      details: prefMatched.length > 0
        ? [`Matched: ${prefMatched.join(', ')}`]
        : [totalPrefCount > 0 ? `Unmatched: ${prefMissing.slice(0, 3).join(', ')}` : 'Full base preferred score awarded'],
    };

    const candExpYrs = details.candExpYears || 0;
    const reqMinExpYrs = matchRecord.min_experience || 0;
    const experienceComp: ScoreComponentExplanation = {
      name: 'Professional Experience Length',
      score: expScore,
      maxScore: 20,
      weightPercentage: 20,
      summary: matchRecord.experience_assessment || `${candExpYrs} years documented`,
      details: reqMinExpYrs > 0
        ? [
            `Candidate Documented: ~${candExpYrs} years`,
            `Role Minimum Target: ${reqMinExpYrs} years`,
            candExpYrs >= reqMinExpYrs
              ? 'Exceeds minimum requirement (Full 20/20 pts awarded)'
              : `Proportional score based on documented tenure (${expScore}/20 pts)`,
          ]
        : [`Open experience criteria (${expScore}/20 pts awarded)`],
    };

    const candEdu = details.candHighestEdu || 'Not Specified';
    const reqQual = matchRecord.qualification || 'Standard';
    const qualificationComp: ScoreComponentExplanation = {
      name: 'Educational Qualification',
      score: qualScore,
      maxScore: 10,
      weightPercentage: 10,
      summary: matchRecord.qualification_assessment || candEdu,
      details: [
        `Candidate Education: ${candEdu}`,
        `Job Target Requirement: ${reqQual || 'Any standard degree'}`,
      ],
    };

    const relevanceComp: ScoreComponentExplanation = {
      name: 'Profile Completeness & Project Depth',
      score: relScore,
      maxScore: 5,
      weightPercentage: 5,
      summary: 'Portfolio, certifications & profile integrity',
      details: [
        `Score: ${relScore} / 5 based on verified profile sections, portfolio projects, and certifications.`,
      ],
    };

    // Synthesize transparent natural-language explanation derived ONLY from verified facts
    const factualSummary = `${matchRecord.candidate_name} achieved a ${finalScore}% match for "${matchRecord.job_title}". ` +
      `Required skills contributed ${reqScore}/50 pts (${reqMatched.length}/${totalReqCount} matched), ` +
      `preferred skills added ${prefScore}/15 pts, ` +
      `experience evaluation contributed ${expScore}/20 pts (~${candExpYrs} yrs vs ${reqMinExpYrs} yrs required), ` +
      `and education qualification added ${qualScore}/10 pts.`;

    let naturalLanguageExplanation = '';
    if (finalScore >= 80) {
      naturalLanguageExplanation = `Strong overall match (${finalScore}%). The candidate demonstrates high alignment across required skills (${reqMatched.slice(0, 3).join(', ') || 'core stack'}) and satisfies key experience and degree criteria.`;
    } else if (finalScore >= 60) {
      naturalLanguageExplanation = `Good alignment (${finalScore}%). The candidate possesses solid background in ${reqMatched.slice(0, 3).join(', ') || 'essential areas'} but could benefit from further evaluation on ${reqMissing.slice(0, 2).join(', ') || 'specific requirements'}.`;
    } else {
      naturalLanguageExplanation = `Moderate to entry alignment (${finalScore}%). The candidate meets foundational elements but has several missing required skills (${reqMissing.slice(0, 3).join(', ')}) or lower documented tenure relative to the job target.`;
    }

    return {
      matchId: matchRecord.id,
      resumeId: matchRecord.resume_id,
      jobId: matchRecord.job_id,
      candidateId: matchRecord.cand_user_id,
      candidateName: matchRecord.candidate_name,
      jobTitle: matchRecord.job_title,
      companyName: matchRecord.company_name,
      finalScore,
      category: finalScore >= 80 ? 'Strong Match' : (finalScore >= 60 ? 'Good Match' : (finalScore >= 40 ? 'Moderate Match' : 'Low Match')),
      categoryLabel: finalScore >= 80 ? 'Strong Match' : (finalScore >= 60 ? 'Good Match' : (finalScore >= 40 ? 'Moderate Match' : 'Low Match')),
      algorithmVersion: matchRecord.algorithm_version || this.ALGORITHM_VERSION,
      isConsistent,
      components: {
        requiredSkills: requiredSkillsComp,
        preferredSkills: preferredSkillsComp,
        experience: experienceComp,
        qualification: qualificationComp,
        relevance: relevanceComp,
      },
      matchedSkills: {
        required: reqMatched,
        preferred: prefMatched,
      },
      missingSkills: {
        required: reqMissing,
        preferred: prefMissing,
      },
      factualSummary,
      naturalLanguageExplanation,
    };
  }
}

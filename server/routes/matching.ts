import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { ResumeJobMatchingService } from '../services/matchingService.js';
import { CandidateSummaryService } from '../services/candidateSummaryService.js';
import { SkillGapAnalysisService } from '../services/skillGapService.js';
import { processResumeAndScreen } from '../services/resumeProcessingPipeline.js';
import {
  calculateScoreV2,
  generateScoreExplanations,
  detectRedFlagsAndGaps,
  CandidateScoringInputV2,
  JobScoringInputV2,
  PresetProfileName,
  ScoringWeightsV2,
} from '../../packages/shared/src/index.js';
import { BlindScreeningService } from '../services/blindScreeningService.js';
import { ExplanationValidatorService } from '../services/explanationValidator.js';

export const matchingRouter = Router();

// ============================================================
// CANDIDATE ENDPOINTS
// ============================================================

/**
 * GET /api/candidate/jobs/:jobId/fit
 * Calculates or retrieves candidate fit, matching score, and breakdown for a job
 */
matchingRouter.get('/candidate/jobs/:jobId/fit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Only candidates can access their job match analysis.' });
    }

    const { jobId } = req.params;
    const job = db.prepare('SELECT id, title, company_name, status, min_experience, qualification FROM jobs WHERE id = ?').get(jobId) as any;
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const profile = db.prepare('SELECT id, full_name, profile_completion FROM candidate_profiles WHERE user_id = ?').get(user.id) as any;
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Candidate profile not found.' });
    }

    // Get candidate's active resume
    const resume = db.prepare('SELECT * FROM candidate_resumes WHERE candidate_profile_id = ? AND is_active = 1').get(profile.id) as any;
    if (!resume) {
      return res.json({
        success: true,
        hasResume: false,
        message: 'Upload your resume to see your personalized AI Match Score and Skill Gap Analysis.',
        match: null,
        skillGap: null,
      });
    }

    // Ensure resume is parsed
    let parsed = db.prepare('SELECT * FROM resume_parsed_data WHERE resume_id = ?').get(resume.id) as any;
    if (!parsed || parsed.status === 'Not Processed') {
      await processResumeAndScreen(resume.id, user.id, profile.id, resume.stored_filename);
      parsed = db.prepare('SELECT * FROM resume_parsed_data WHERE resume_id = ?').get(resume.id) as any;
    }

    // Check if user has an active application for this job
    const app = db.prepare('SELECT id, resume_id FROM applications WHERE candidate_id = ? AND job_id = ?').get(user.id, job.id) as any;
    const matchResumeId = app ? app.resume_id : resume.id;

    // Compute or fetch match
    const matchResult = await ResumeJobMatchingService.computeMatch(
      matchResumeId,
      job.id,
      user.id,
      profile.id,
      app ? app.id : null
    );

    // Generate or fetch candidate summary & skill gap
    const summaryResult = await CandidateSummaryService.generateSummary(matchResult, job.title, job.company_name);
    const skillGapResult = await SkillGapAnalysisService.generateSkillGap(matchResult, job.title, job.company_name);

    return res.json({
      success: true,
      hasResume: true,
      match: matchResult,
      summary: summaryResult,
      skillGap: skillGapResult,
    });
  } catch (err: any) {
    console.error('Candidate job fit error:', err);
    return res.status(500).json({ success: false, message: 'Failed to compute match analysis.', error: err.message });
  }
});

/**
 * GET /api/candidate/jobs/:jobId/skill-gap
 * Returns detailed skill gap analysis for current candidate on a target job
 */
matchingRouter.get('/candidate/jobs/:jobId/skill-gap', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Only candidates can view their skill gap analysis.' });
    }

    const { jobId } = req.params;
    const job = db.prepare('SELECT id, title, company_name FROM jobs WHERE id = ?').get(jobId) as any;
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(user.id) as any;
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Candidate profile not found.' });
    }

    const resume = db.prepare('SELECT id, stored_filename FROM candidate_resumes WHERE candidate_profile_id = ? AND is_active = 1').get(profile.id) as any;
    if (!resume) {
      return res.status(400).json({ success: false, message: 'Please upload a resume first to view skill gap analysis.' });
    }

    const app = db.prepare('SELECT id, resume_id FROM applications WHERE candidate_id = ? AND job_id = ?').get(user.id, job.id) as any;
    const matchResumeId = app ? app.resume_id : resume.id;

    const matchResult = await ResumeJobMatchingService.computeMatch(
      matchResumeId,
      job.id,
      user.id,
      profile.id,
      app ? app.id : null
    );

    const skillGapResult = await SkillGapAnalysisService.generateSkillGap(matchResult, job.title, job.company_name);

    return res.json({
      success: true,
      job: { id: job.id, title: job.title, companyName: job.company_name },
      skillGap: skillGapResult,
      match: matchResult,
    });
  } catch (err: any) {
    console.error('Candidate skill gap error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve skill gap analysis.', error: err.message });
  }
});

// ============================================================
// RECRUITER ENDPOINTS
// ============================================================

/**
 * GET /api/recruiter/jobs/:jobId/applicants/ranked
 * Retrieves automatically ranked applicants with match scores and tie-breaking
 */
matchingRouter.get('/recruiter/jobs/:jobId/applicants/ranked', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only recruiters can access applicant rankings.' });
    }

    const { jobId } = req.params;
    const { sortBy = 'match_score_desc', minScore, status, search } = req.query as any;

    // Security: Check job ownership
    const job = db.prepare('SELECT id, title, company_name, recruiter_id, status FROM jobs WHERE id = ?').get(jobId) as any;
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (user.role === 'recruiter' && job.recruiter_id !== user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view applicants for this job.' });
    }

    // Fetch all applications for this job
    const appRows = db.prepare(`
      SELECT 
        a.id as application_id,
        a.candidate_id,
        a.candidate_profile_id,
        a.job_id,
        a.resume_id,
        a.cover_letter,
        a.status as application_status,
        a.applied_at,
        cp.full_name as candidate_name,
        cp.phone as candidate_phone,
        cp.location as candidate_location,
        cp.headline as candidate_headline,
        cp.photo_url as candidate_photo,
        u.email as candidate_email,
        cr.original_filename as resume_filename,
        cr.stored_filename as resume_stored_filename,
        cr.file_size as resume_file_size,
        cr.file_type as resume_file_type
      FROM applications a
      JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
      JOIN users u ON a.candidate_id = u.id
      JOIN candidate_resumes cr ON a.resume_id = cr.id
      WHERE a.job_id = ?
    `).all(jobId) as any[];

    // Ensure matching results exist for every applicant
    const rankedApplicants: any[] = [];

    for (const app of appRows) {
      let match = db.prepare(`
        SELECT * FROM resume_job_matches WHERE resume_id = ? AND job_id = ? AND algorithm_version = ?
      `).get(app.resume_id, jobId, ResumeJobMatchingService.ALGORITHM_VERSION) as any;

      if (!match || match.status !== 'Completed') {
        // Compute match on the fly
        try {
          const computed = await ResumeJobMatchingService.computeMatch(
            app.resume_id,
            jobId,
            app.candidate_id,
            app.candidate_profile_id,
            app.application_id
          );
          match = db.prepare('SELECT * FROM resume_job_matches WHERE id = ?').get(computed.id) as any;
          await CandidateSummaryService.generateSummary(computed, job.title, job.company_name);
        } catch (matchErr) {
          console.error(`Matching computation error for app ${app.application_id}:`, matchErr);
        }
      }

      // Fetch summary if available
      let summaryText = '';
      let strengths: string[] = [];
      let gaps: string[] = [];
      if (match) {
        const summaryRow = db.prepare('SELECT * FROM candidate_job_summaries WHERE match_id = ?').get(match.id) as any;
        if (summaryRow) {
          summaryText = summaryRow.summary_text;
          try { strengths = JSON.parse(summaryRow.strengths_json || '[]'); } catch {}
          try { gaps = JSON.parse(summaryRow.gaps_json || '[]'); } catch {}
        }
      }

      let reqMatched: string[] = [];
      let reqMissing: string[] = [];
      let prefMatched: string[] = [];
      let prefMissing: string[] = [];

      if (match) {
        try { reqMatched = JSON.parse(match.required_skills_matched_json || '[]'); } catch {}
        try { reqMissing = JSON.parse(match.required_skills_missing_json || '[]'); } catch {}
        try { prefMatched = JSON.parse(match.preferred_skills_matched_json || '[]'); } catch {}
        try { prefMissing = JSON.parse(match.preferred_skills_missing_json || '[]'); } catch {}
      }

      // Fetch candidate skills
      const candSkills = db.prepare('SELECT name, proficiency FROM candidate_skills WHERE candidate_profile_id = ?').all(app.candidate_profile_id) as any[];

      rankedApplicants.push({
        id: app.application_id,
        applicationId: app.application_id,
        candidateId: app.candidate_id,
        candidateProfileId: app.candidate_profile_id,
        candidateName: app.candidate_name,
        candidateEmail: app.candidate_email,
        candidatePhone: app.candidate_phone,
        candidateLocation: app.candidate_location,
        candidateHeadline: app.candidate_headline,
        candidatePhoto: app.candidate_photo,
        status: app.application_status,
        appliedAt: app.applied_at,
        coverLetter: app.cover_letter,
        resumeId: app.resume_id,
        resumeFilename: app.resume_filename,
        resumeFileSize: app.resume_file_size,
        resumeFileType: app.resume_file_type,
        resumeUrl: `/api/candidate/resume/preview`,
        skills: candSkills,
        matchScore: match ? match.match_score : 0,
        requiredSkillsScore: match ? match.required_skills_score : 0,
        preferredSkillsScore: match ? match.preferred_skills_score : 0,
        experienceScore: match ? match.experience_score : 0,
        qualificationScore: match ? match.qualification_score : 0,
        requiredSkillsMatched: reqMatched,
        requiredSkillsMissing: reqMissing,
        preferredSkillsMatched: prefMatched,
        preferredSkillsMissing: prefMissing,
        experienceAssessment: match ? match.experience_assessment : '',
        qualificationAssessment: match ? match.qualification_assessment : '',
        summaryText,
        strengths,
        gaps,
        category: match ? (match.match_score >= 80 ? 'Strong Match' : match.match_score >= 60 ? 'Good Match' : match.match_score >= 40 ? 'Moderate Match' : 'Low Match') : 'Not Screened',
      });
    }

    // Apply filtering
    let filtered = rankedApplicants.filter((cand) => {
      if (status && status !== 'All' && cand.status !== status) return false;
      if (minScore && cand.matchScore < Number(minScore)) return false;
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = cand.candidateName.toLowerCase().includes(q);
        const matchEmail = cand.candidateEmail.toLowerCase().includes(q);
        const matchHeadline = (cand.candidateHeadline || '').toLowerCase().includes(q);
        const matchSkill = cand.skills.some((s: any) => s.name.toLowerCase().includes(q));
        if (!matchName && !matchEmail && !matchHeadline && !matchSkill) return false;
      }
      return true;
    });

    // Apply Sorting with deterministic tie-breaking
    filtered.sort((a, b) => {
      if (sortBy === 'match_score_desc') {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        if (b.requiredSkillsScore !== a.requiredSkillsScore) return b.requiredSkillsScore - a.requiredSkillsScore;
        if (b.experienceScore !== a.experienceScore) return b.experienceScore - a.experienceScore;
        return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime(); // Earlier applicant wins tie
      }
      if (sortBy === 'match_score_asc') {
        if (a.matchScore !== b.matchScore) return a.matchScore - b.matchScore;
        return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
      }
      if (sortBy === 'applied_at_desc') {
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
      }
      if (sortBy === 'applied_at_asc') {
        return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
      }
      if (sortBy === 'name_asc') {
        return a.candidateName.localeCompare(b.candidateName);
      }
      return 0;
    });

    // Assign ranking position numbers
    const rankedList = filtered.map((applicant, index) => ({
      ...applicant,
      rank: index + 1,
    }));

    // Pipeline status counters
    const stats = {
      total: appRows.length,
      applied: appRows.filter((r) => r.application_status === 'Applied').length,
      under_review: appRows.filter((r) => r.application_status === 'Under Review').length,
      shortlisted: appRows.filter((r) => r.application_status === 'Shortlisted').length,
      rejected: appRows.filter((r) => r.application_status === 'Rejected').length,
      withdrawn: appRows.filter((r) => r.application_status === 'Withdrawn').length,
    };

    return res.json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
        companyName: job.company_name,
        status: job.status,
      },
      applicants: rankedList,
      stats,
    });
  } catch (err: any) {
    console.error('Recruiter ranked applicants error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve ranked applicants.', error: err.message });
  }
});

/**
 * GET /api/recruiter/applications/:id/matching
 * Fetches comprehensive match analysis, AI summary, and score factors for an applicant
 */
matchingRouter.get('/recruiter/applications/:id/matching', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only recruiters can access applicant match details.' });
    }

    const { id } = req.params;
    const app = db.prepare(`
      SELECT a.*, j.title as job_title, j.company_name, j.recruiter_id
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `).get(id) as any;

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (user.role === 'recruiter' && app.recruiter_id !== user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this applicant match.' });
    }

    // Compute or fetch match
    const matchResult = await ResumeJobMatchingService.computeMatch(
      app.resume_id,
      app.job_id,
      app.candidate_id,
      app.candidate_profile_id,
      app.id
    );

    const summaryResult = await CandidateSummaryService.generateSummary(matchResult, app.job_title, app.company_name);

    return res.json({
      success: true,
      applicationId: app.id,
      jobId: app.job_id,
      resumeId: app.resume_id,
      match: matchResult,
      summary: summaryResult,
    });
  } catch (err: any) {
    console.error('Recruiter application matching error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve match details.', error: err.message });
  }
});

/**
 * POST /api/recruiter/applications/:id/recompute-matching
 * Forces recomputation of matching score and AI summary
 */
matchingRouter.post('/recruiter/applications/:id/recompute-matching', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only recruiters can recompute applicant matching.' });
    }

    const { id } = req.params;
    const app = db.prepare(`
      SELECT a.*, j.title as job_title, j.company_name, j.recruiter_id, cr.stored_filename
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN candidate_resumes cr ON a.resume_id = cr.id
      WHERE a.id = ?
    `).get(id) as any;

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (user.role === 'recruiter' && app.recruiter_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // Delete old match and summary
    db.prepare('DELETE FROM resume_job_matches WHERE resume_id = ? AND job_id = ?').run(app.resume_id, app.job_id);

    // Re-run parsing if needed
    await processResumeAndScreen(app.resume_id, app.candidate_id, app.candidate_profile_id, app.stored_filename, app.id, app.job_id);

    // Recompute
    const matchResult = await ResumeJobMatchingService.computeMatch(
      app.resume_id,
      app.job_id,
      app.candidate_id,
      app.candidate_profile_id,
      app.id
    );

    const summaryResult = await CandidateSummaryService.generateSummary(matchResult, app.job_title, app.company_name);

    return res.json({
      success: true,
      message: 'Match analysis recomputed successfully.',
      match: matchResult,
      summary: summaryResult,
    });
  } catch (err: any) {
    console.error('Recompute matching error:', err);
    return res.status(500).json({ success: false, message: 'Failed to recompute match.', error: err.message });
  }
});

// ============================================================
// PHASE 6: SCORING ENGINE V2, EXPLAINABILITY, & BLIND SCREENING
// ============================================================

/**
 * POST /api/matching/score-v2
 * Pure TypeScript Score V2 evaluation engine with explainability, waterfall,
 * counterfactuals, and fairness guarantees.
 */
matchingRouter.post('/matching/score-v2', async (req: Request, res: Response) => {
  try {
    const {
      candidate,
      job,
      customWeights,
      preset,
      rulesOnly,
      blendAlpha,
      isBlind,
    } = req.body;

    if (!candidate || !job) {
      return res.status(400).json({
        success: false,
        message: 'Both candidate and job objects are required for Score V2 evaluation.',
      });
    }

    // Server-side blind screening redaction if requested
    const effectiveCandidate: CandidateScoringInputV2 = isBlind
      ? BlindScreeningService.redactCandidate(candidate)
      : candidate;

    // 1. Calculate Score V2
    const scoreResult = calculateScoreV2(effectiveCandidate, job, {
      customWeights,
      preset: preset as PresetProfileName,
      rulesOnly: Boolean(rulesOnly),
      blendAlpha: blendAlpha !== undefined ? Number(blendAlpha) : undefined,
    });

    // 2. Generate Explainability Report V2
    const explanations = generateScoreExplanations(effectiveCandidate, job, scoreResult);

    // 3. Detect Red Flags and Neutral Gaps
    const redFlags = detectRedFlagsAndGaps(effectiveCandidate, req.body.workExperiences, Boolean(req.body.hiddenTextDetected));

    // 4. Grounded Summary & Cryptographic Audit Hash
    const evidenceLedger = ExplanationValidatorService.buildEvidenceLedger(explanations, redFlags);
    const deterministicSummary = ExplanationValidatorService.generateDeterministicSummary(
      evidenceLedger,
      scoreResult.finalScore,
      scoreResult.confidenceBand
    );
    const auditHash = ExplanationValidatorService.computeAuditHash(
      effectiveCandidate.candidateId,
      job.jobId,
      scoreResult,
      evidenceLedger
    );

    // 5. Save Score V2 Provenance Record
    const provenanceId = `prov_${crypto.randomUUID()}`;
    try {
      db.prepare(`
        INSERT INTO match_score_v2_provenance (
          id, candidate_id, job_id, algorithm_version, final_score, confidence_band,
          weights_applied, is_rules_only, blend_alpha, contributions_json,
          must_have_flags_json, shap_json, counterfactuals_json, ats_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        provenanceId,
        effectiveCandidate.candidateId,
        job.jobId,
        scoreResult.algorithmVersion,
        scoreResult.finalScore,
        scoreResult.confidenceBand,
        JSON.stringify(scoreResult.weightsApplied),
        scoreResult.isRulesOnly ? 1 : 0,
        scoreResult.blendAlpha,
        JSON.stringify(scoreResult.contributions),
        JSON.stringify(scoreResult.mustHaveFlags),
        JSON.stringify(explanations.shapExplanations),
        JSON.stringify(explanations.counterfactuals),
        scoreResult.atsReadinessDiagnostic.atsScore
      );
    } catch {
      // Non-fatal if table doesn't exist yet before migration runner
    }

    return res.json({
      success: true,
      provenanceId,
      auditHash,
      isBlind: Boolean(isBlind),
      scoreResult,
      explanations,
      redFlags,
      groundedSummary: {
        text: deterministicSummary,
        evidenceItems: evidenceLedger,
      },
    });
  } catch (err: any) {
    console.error('Score V2 evaluation error:', err);
    return res.status(500).json({ success: false, message: 'Score V2 evaluation failed.', error: err.message });
  }
});

/**
 * GET /api/matching/provenance/:id
 * Fetches an immutable audit record of a prior Score V2 computation.
 */
matchingRouter.get('/matching/provenance/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const row = db.prepare('SELECT * FROM match_score_v2_provenance WHERE id = ? OR candidate_id = ?').get(id, id) as any;
    if (!row) {
      return res.status(404).json({ success: false, message: 'Score provenance record not found.' });
    }

    return res.json({
      success: true,
      provenance: {
        ...row,
        weights_applied: JSON.parse(row.weights_applied || '{}'),
        contributions: JSON.parse(row.contributions_json || '[]'),
        must_have_flags: JSON.parse(row.must_have_flags_json || '[]'),
        shap_explanations: JSON.parse(row.shap_json || '[]'),
        counterfactuals: JSON.parse(row.counterfactuals_json || '[]'),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch score provenance.', error: err.message });
  }
});

/**
 * GET /api/matching/rationale-export/:id
 * Generates an auditable recruiter rationale export in JSON or printable self-contained HTML.
 */
matchingRouter.get('/matching/rationale-export/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const format = req.query.format === 'html' ? 'html' : 'json';

    const row = db.prepare('SELECT * FROM match_score_v2_provenance WHERE id = ? OR candidate_id = ?').get(id, id) as any;
    if (!row) {
      return res.status(404).json({ success: false, message: 'Provenance record not found for export.' });
    }

    const weights = JSON.parse(row.weights_applied || '{}');
    const contributions = JSON.parse(row.contributions_json || '[]');
    const mustHaves = JSON.parse(row.must_have_flags_json || '[]');
    const shap = JSON.parse(row.shap_json || '[]');
    const counterfactuals = JSON.parse(row.counterfactuals_json || '[]');

    const scoreResult: ScoreV2Result = {
      candidateId: row.candidate_id,
      jobId: row.job_id,
      algorithmVersion: row.algorithm_version,
      finalScore: row.final_score,
      confidenceBand: row.confidence_band,
      contributions,
      mustHaveFlags: mustHaves,
      allMustHavesMet: mustHaves.every((m: any) => m.met),
      isRulesOnly: Boolean(row.is_rules_only),
      blendAlpha: row.blend_alpha,
      weightsApplied: weights,
      atsReadinessDiagnostic: {
        atsScore: row.ats_score,
        isFactorInScore: false,
        note: 'ATS-readiness evaluated separately from candidate qualification score.',
      },
    };

    const dummyCand: CandidateScoringInputV2 = {
      candidateId: row.candidate_id,
      skills: [],
      experienceYears: 0,
      projects: [],
      achievements: [],
      certifications: [],
    };

    const dummyJob: JobScoringInputV2 = {
      jobId: row.job_id,
      title: 'Target Position',
      requiredSkills: [],
      minExperienceYears: 0,
    };

    const explanations = generateScoreExplanations(dummyCand, dummyJob, scoreResult);
    explanations.waterfall = contributions.map((c: any) => ({
      component: c.component,
      label: c.displayName,
      weight: c.weight,
      rawScore: c.rawScore,
      pointsContributed: c.contribution,
      maxPossiblePoints: c.weight,
      percentageOfMax: c.rawScore,
      details: c.details || [],
    }));
    explanations.shapExplanations = shap;
    explanations.counterfactuals = counterfactuals;

    const redFlags = detectRedFlagsAndGaps(dummyCand);
    const auditHash = crypto.createHash('sha256').update(row.id + row.final_score + row.created_at).digest('hex');

    if (format === 'html') {
      const html = ExplanationValidatorService.generatePrintableRationaleHtml({
        candidateName: `Candidate #${row.candidate_id.slice(-4).toUpperCase()}`,
        jobTitle: 'Position Match',
        companyName: 'Resumio Verified Hiring',
        scoreResult,
        report: explanations,
        redFlags,
        isBlind: true,
        auditHash,
      });
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    return res.json({
      success: true,
      auditHash,
      scoreResult,
      explanations,
      redFlags,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to export rationale.', error: err.message });
  }
});

/**
 * POST /api/matching/reveal-identity
 * Logs an explicit recruiter identity reveal action into the audit trail.
 */
matchingRouter.post('/matching/reveal-identity', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only recruiters and administrators can reveal candidate identities.' });
    }

    const { candidateId, jobId, reason } = req.body;
    if (!candidateId || !reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A candidate ID and a substantive reason (minimum 5 characters) are required for identity reveal.',
      });
    }

    const result = await BlindScreeningService.recordIdentityReveal({
      recruiterId: user.id,
      candidateId,
      jobId,
      reason,
      ipAddress: req.ip || '',
    });

    return res.json({
      success: true,
      message: 'Candidate identity revealed and recorded in immutable compliance audit trail.',
      revealId: result.revealId,
      revealedAt: result.revealedAt,
    });
  } catch (err: any) {
    console.error('Identity reveal error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

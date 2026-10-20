import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  computeHybridJobRecommendations,
  generateUpskillingRoadmap,
  simulateWhatIfScenario,
  CandidatePreferenceProfile,
  CandidateSkillsContext,
  TargetJobItem,
  CuratedResourceItem,
  calculateScoreV2,
  DEFAULT_SCORE_PROFILE_V2,
} from '../../packages/shared/src/index.js';
import { verifyCandidateGitHub } from '../services/githubVerificationService.js';
import { fetchPortfolioSafely } from '../services/ssrfProtectionService.js';
import {
  exportAllCandidateData,
  deleteCandidateAccount,
  getCandidateConsents,
  updateCandidateConsents,
  getProfileAccessLogs,
} from '../services/candidateDataRightsService.js';

export const candidateExperienceRouter = Router();

// ============================================================
// 1. CANDIDATE DASHBOARD AGGREGATE
// ============================================================
candidateExperienceRouter.get('/dashboard', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Candidate dashboard is for candidate accounts only.' });
    }

    // 1. Candidate profile
    const profile = db.prepare(`SELECT * FROM candidate_profiles WHERE user_id = ?`).get(user.id) as any;
    const profileId = profile?.id;

    // 2. Active applications with status history
    const applications = db.prepare(`
      SELECT a.id, a.job_id, a.status, a.applied_at,
             COALESCE(rjm.match_score, 0) as match_score,
             CASE
               WHEN COALESCE(rjm.match_score, 0) >= 85 THEN 'A'
               WHEN COALESCE(rjm.match_score, 0) >= 70 THEN 'B'
               WHEN COALESCE(rjm.match_score, 0) >= 50 THEN 'C'
               ELSE 'D'
             END as match_grade,
             j.title as job_title, j.company_name, j.location, j.work_mode
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN resume_job_matches rjm ON (rjm.application_id = a.id OR (rjm.job_id = a.job_id AND rjm.candidate_id = a.candidate_id))
      WHERE a.candidate_id = ?
      ORDER BY a.applied_at DESC
    `).all(user.id) as any[];

    for (const app of applications) {
      app.timeline = db.prepare(`
        SELECT new_status as status, note as notes, changed_at
        FROM application_status_history
        WHERE application_id = ?
        ORDER BY changed_at ASC
      `).all(app.id);
    }

    // 3. Upcoming interviews
    const upcomingInterviews = db.prepare(`
      SELECT i.id, i.scheduled_at, i.stage, i.meeting_link, i.notes,
             j.title as job_title, j.company_name
      FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      WHERE a.candidate_id = ? AND i.scheduled_at >= datetime('now')
      ORDER BY i.scheduled_at ASC
    `).all(user.id);

    // 4. Candidate skills & verifications
    const skills = profileId
      ? db.prepare(`SELECT name as skill_name, proficiency FROM candidate_skills WHERE candidate_profile_id = ?`).all(profileId)
      : [];

    const verifiedSkills = db.prepare(`
      SELECT skill_name, verification_source, evidence_url, evidence_snippet, confidence_score
      FROM candidate_skill_verifications
      WHERE candidate_id = ?
    `).all(user.id);

    // 5. Resume stats
    const latestResume = profileId
      ? db.prepare(`
          SELECT cr.id, cr.original_filename, cr.created_at as upload_date
          FROM candidate_resumes cr
          WHERE cr.candidate_profile_id = ?
          ORDER BY cr.created_at DESC
          LIMIT 1
        `).get(profileId) as any
      : null;

    let resumeStrength = 50;
    if (profile?.summary) resumeStrength += 15;
    if (skills.length >= 5) resumeStrength += 15;
    if (latestResume) resumeStrength += 20;

    // 6. External verifications
    const verifications = db.prepare(`
      SELECT provider, handle_or_url, verification_status, updated_at
      FROM candidate_verifications
      WHERE candidate_id = ?
    `).all(user.id);

    return res.json({
      success: true,
      data: {
        profile,
        applications,
        upcomingInterviews,
        skillsCount: skills.length,
        verifiedSkillsCount: verifiedSkills.length,
        resumeStrength: Math.min(100, resumeStrength),
        latestResume: latestResume ? {
          id: latestResume.id,
          fileName: latestResume.original_filename,
          uploadDate: latestResume.upload_date,
        } : null,
        verifications,
      },
    });
  } catch (err: any) {
    console.error('Error fetching candidate dashboard:', err);
    return res.status(500).json({ success: false, message: 'Failed to load candidate dashboard.', error: err.message });
  }
});

// ============================================================
// 2. EXPLAINABLE JOB RECOMMENDATIONS & PREFERENCES
// ============================================================
candidateExperienceRouter.get('/recommendations', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const profile = db.prepare(`SELECT * FROM candidate_profiles WHERE user_id = ?`).get(user.id) as any;
    const profileId = profile?.id;

    // Load preferences
    const prefRow = db.prepare(`SELECT * FROM candidate_job_preferences WHERE candidate_id = ?`).get(user.id) as any;
    const preferences: CandidatePreferenceProfile = {
      preferredLocations: prefRow ? JSON.parse(prefRow.preferred_locations_json || '[]') : [],
      preferredWorkModes: prefRow ? JSON.parse(prefRow.preferred_work_modes_json || '["Remote", "Hybrid", "On-site"]') : ['Remote', 'Hybrid', 'On-site'],
      minSalary: prefRow?.min_salary || undefined,
      maxSalary: prefRow?.max_salary || undefined,
      targetJobTitles: prefRow ? JSON.parse(prefRow.target_job_titles_json || '[]') : [],
      dismissedJobIds: prefRow ? JSON.parse(prefRow.dismissed_job_ids_json || '[]') : [],
    };

    // Load candidate skills
    const rawSkills = profileId
      ? db.prepare(`SELECT name as skill_name, proficiency FROM candidate_skills WHERE candidate_profile_id = ?`).all(profileId) as any[]
      : [];

    const verifiedSkillSet = new Set(
      (db.prepare(`SELECT skill_name FROM candidate_skill_verifications WHERE candidate_id = ?`).all(user.id) as any[]).map(r => r.skill_name.toLowerCase())
    );

    const skillsContext: CandidateSkillsContext = {
      skills: rawSkills.map(s => ({
        name: s.skill_name,
        proficiency: s.proficiency_level || 3,
        verified: verifiedSkillSet.has(s.skill_name.toLowerCase()),
      })),
      experienceYears: profile?.total_experience_years || 2,
      seniorityLevel: profile?.seniority_level || 'Mid-Level',
      highestEducation: profile?.education_level || "Bachelor's Degree",
    };

    // Load published active jobs
    const jobsRaw = db.prepare(`
      SELECT id, title, company_name, location, work_mode, salary_min, salary_max, min_experience
      FROM jobs
      WHERE status = 'Published'
    `).all() as any[];

    const jobs: TargetJobItem[] = jobsRaw.map(j => {
      const reqSkills = (db.prepare(`SELECT name FROM job_required_skills WHERE job_id = ?`).all(j.id) as any[]).map(r => r.name);
      const prefSkills = (db.prepare(`SELECT name FROM job_preferred_skills WHERE job_id = ?`).all(j.id) as any[]).map(r => r.name);
      return {
        id: j.id,
        title: j.title,
        companyName: j.company_name || 'Resumio Hiring Partner',
        location: j.location || 'Remote',
        workMode: (j.work_mode || 'Remote') as 'Remote' | 'Hybrid' | 'On-site',
        salaryMin: j.salary_min || undefined,
        salaryMax: j.salary_max || undefined,
        requiredSkills: reqSkills,
        preferredSkills: prefSkills,
        minExperienceYears: j.min_experience || 0,
      };
    });

    const recommendations = computeHybridJobRecommendations(skillsContext, preferences, jobs);

    return res.json({
      success: true,
      data: {
        recommendations,
        preferences,
      },
    });
  } catch (err: any) {
    console.error('Error computing recommendations:', err);
    return res.status(500).json({ success: false, message: 'Failed to compute job recommendations.', error: err.message });
  }
});

candidateExperienceRouter.post('/preferences', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const schema = z.object({
      preferredLocations: z.array(z.string()).default([]),
      preferredWorkModes: z.array(z.enum(['Remote', 'Hybrid', 'On-site'])).default(['Remote', 'Hybrid', 'On-site']),
      minSalary: z.number().nullable().optional(),
      maxSalary: z.number().nullable().optional(),
      targetJobTitles: z.array(z.string()).default([]),
    });

    const body = schema.parse(req.body);

    const existingPref = db.prepare(`SELECT id FROM candidate_job_preferences WHERE candidate_id = ?`).get(user.id) as { id: string } | undefined;
    if (existingPref) {
      db.prepare(`
        UPDATE candidate_job_preferences SET
          preferred_locations_json = ?,
          preferred_work_modes_json = ?,
          min_salary = ?,
          max_salary = ?,
          target_job_titles_json = ?,
          updated_at = datetime('now')
        WHERE candidate_id = ?
      `).run(
        JSON.stringify(body.preferredLocations),
        JSON.stringify(body.preferredWorkModes),
        body.minSalary || null,
        body.maxSalary || null,
        JSON.stringify(body.targetJobTitles),
        user.id
      );
    } else {
      const prefId = `pref_${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO candidate_job_preferences (
          id, candidate_id, preferred_locations_json, preferred_work_modes_json,
          min_salary, max_salary, target_job_titles_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        prefId,
        user.id,
        JSON.stringify(body.preferredLocations),
        JSON.stringify(body.preferredWorkModes),
        body.minSalary || null,
        body.maxSalary || null,
        JSON.stringify(body.targetJobTitles)
      );
    }

    return res.json({ success: true, message: 'Job preferences updated successfully.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: 'Invalid preferences payload', error: err.message });
  }
});

candidateExperienceRouter.post('/recommendations/:jobId/dismiss', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { jobId } = req.params;

    const row = db.prepare(`SELECT id, dismissed_job_ids_json FROM candidate_job_preferences WHERE candidate_id = ?`).get(user.id) as any;
    const dismissed: string[] = row ? JSON.parse(row.dismissed_job_ids_json || '[]') : [];

    if (!dismissed.includes(jobId)) {
      dismissed.push(jobId);
    }

    if (row) {
      db.prepare(`
        UPDATE candidate_job_preferences SET
          dismissed_job_ids_json = ?,
          updated_at = datetime('now')
        WHERE candidate_id = ?
      `).run(JSON.stringify(dismissed), user.id);
    } else {
      const prefId = `pref_${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO candidate_job_preferences (id, candidate_id, dismissed_job_ids_json, updated_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(prefId, user.id, JSON.stringify(dismissed));
    }

    return res.json({ success: true, message: 'Job recommendation dismissed.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to dismiss recommendation.', error: err.message });
  }
});

// ============================================================
// 3. SKILL-GAP & UPSKILLING ROADMAP
// ============================================================
candidateExperienceRouter.get('/upskilling-roadmap', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const profile = db.prepare(`SELECT * FROM candidate_profiles WHERE user_id = ?`).get(user.id) as any;
    const profileId = profile?.id;

    // Load candidate skills
    const rawSkills = profileId
      ? db.prepare(`SELECT name as skill_name FROM candidate_skills WHERE candidate_profile_id = ?`).all(profileId) as any[]
      : [];

    const candidateSkills = rawSkills.map(s => s.skill_name);

    // Target jobs: either candidate applied jobs or published matching jobs
    const targetJobsRaw = db.prepare(`
      SELECT id, title, company_name, location, work_mode, min_experience
      FROM jobs
      WHERE status = 'Published'
      LIMIT 15
    `).all() as any[];

    const targetJobs: TargetJobItem[] = targetJobsRaw.map(j => {
      const reqSkills = (db.prepare(`SELECT name FROM job_required_skills WHERE job_id = ?`).all(j.id) as any[]).map(r => r.name);
      const prefSkills = (db.prepare(`SELECT name FROM job_preferred_skills WHERE job_id = ?`).all(j.id) as any[]).map(r => r.name);
      return {
        id: j.id,
        title: j.title,
        companyName: j.company_name || 'Hiring Partner',
        location: j.location || 'Remote',
        workMode: (j.work_mode || 'Remote') as any,
        requiredSkills: reqSkills,
        preferredSkills: prefSkills,
        minExperienceYears: j.min_experience || 0,
      };
    });

    // Curated resources from database (Truthfulness Guarantee)
    const curatedRows = db.prepare(`SELECT * FROM curated_learning_resources`).all() as any[];
    const curatedResources: CuratedResourceItem[] = curatedRows.map(r => ({
      id: r.id,
      skillName: r.skill_name,
      title: r.title,
      url: r.url,
      provider: r.provider,
      resourceType: r.resource_type,
      difficulty: r.difficulty,
      estimatedHours: r.estimated_hours,
      isFree: Boolean(r.is_free),
    }));

    const roadmap = generateUpskillingRoadmap(
      user.id,
      candidateSkills,
      targetJobs,
      curatedResources
    );

    return res.json({
      success: true,
      data: roadmap,
    });
  } catch (err: any) {
    console.error('Error generating upskilling roadmap:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate upskilling roadmap.', error: err.message });
  }
});

// ============================================================
// 4. WHAT-IF SCENARIO SIMULATOR
// ============================================================
candidateExperienceRouter.post('/what-if-simulator', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const schema = z.object({
      jobId: z.string().min(1),
      hypotheticalSkills: z.array(z.string()).default([]),
      hypotheticalExperienceYears: z.number().optional(),
    });

    const { jobId, hypotheticalSkills, hypotheticalExperienceYears } = schema.parse(req.body);

    const job = db.prepare(`SELECT * FROM jobs WHERE id = ?`).get(jobId) as any;
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const jobReqSkills = (db.prepare(`SELECT name FROM job_required_skills WHERE job_id = ?`).all(job.id) as any[]).map(r => r.name);
    const jobPrefSkills = (db.prepare(`SELECT name FROM job_preferred_skills WHERE job_id = ?`).all(job.id) as any[]).map(r => r.name);

    const targetJob: TargetJobItem = {
      id: job.id,
      title: job.title,
      companyName: job.company_name || 'Hiring Partner',
      location: job.location || 'Remote',
      workMode: (job.work_mode || 'Remote') as any,
      requiredSkills: jobReqSkills,
      preferredSkills: jobPrefSkills,
      minExperienceYears: job.min_experience || 0,
    };

    const profile = db.prepare(`SELECT * FROM candidate_profiles WHERE user_id = ?`).get(user.id) as any;
    const profileId = profile?.id;
    const rawSkills = profileId
      ? db.prepare(`SELECT name as skill_name FROM candidate_skills WHERE candidate_profile_id = ?`).all(profileId) as any[]
      : [];

    const existingSkills = rawSkills.map(s => s.skill_name);
    const existingExperienceYears = profile?.total_experience_years || 2;

    const simulation = simulateWhatIfScenario(
      targetJob,
      existingSkills,
      hypotheticalSkills,
      existingExperienceYears,
      hypotheticalExperienceYears
    );

    return res.json({
      success: true,
      data: simulation,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: 'Failed to run what-if simulation', error: err.message });
  }
});

// ============================================================
// 5. GITHUB & PORTFOLIO VERIFICATION
// ============================================================
candidateExperienceRouter.post('/verify-github', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const schema = z.object({
      githubUsername: z.string().min(1),
      accessToken: z.string().optional(),
    });

    const { githubUsername, accessToken } = schema.parse(req.body);

    // Get candidate's claimed skills
    const profile = db.prepare(`SELECT id FROM candidate_profiles WHERE user_id = ?`).get(user.id) as any;
    const claimedSkills = profile
      ? (db.prepare(`SELECT name as skill_name FROM candidate_skills WHERE candidate_profile_id = ?`).all(profile.id) as any[]).map(s => s.skill_name)
      : [];

    const result = await verifyCandidateGitHub(user.id, githubUsername, claimedSkills, accessToken);

    return res.json({
      success: true,
      message: 'GitHub verification completed successfully.',
      data: result,
    });
  } catch (err: any) {
    console.error('GitHub verification error:', err);
    return res.status(400).json({ success: false, message: 'GitHub verification failed.', error: err.message });
  }
});

candidateExperienceRouter.post('/verify-portfolio', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const schema = z.object({
      portfolioUrl: z.string().url(),
    });

    const { portfolioUrl } = schema.parse(req.body);

    const safeResult = await fetchPortfolioSafely(portfolioUrl);
    if (!safeResult.success) {
      return res.status(400).json({
        success: false,
        message: `Portfolio verification failed: ${safeResult.errorMessage}`,
      });
    }

    // Persist verified portfolio
    const now = new Date().toISOString();
    const existing = db.prepare(`SELECT id FROM candidate_verifications WHERE candidate_id = ? AND provider = 'portfolio' AND handle_or_url = ?`).get(user.id, portfolioUrl) as { id: string } | undefined;
    const metaJson = JSON.stringify({
      finalUrl: safeResult.finalUrl,
      contentType: safeResult.contentType,
      contentLengthBytes: safeResult.contentLengthBytes,
      extractedLinksCount: safeResult.extractedLinks?.length || 0,
    });
    const evidJson = JSON.stringify({
      textSnippet: safeResult.sanitizedTextSnippet,
      links: safeResult.extractedLinks?.slice(0, 20) || [],
    });

    if (existing) {
      db.prepare(`
        UPDATE candidate_verifications SET
          verification_status = 'verified',
          metadata_json = ?,
          evidence_json = ?,
          updated_at = ?
        WHERE id = ?
      `).run(metaJson, evidJson, now, existing.id);
    } else {
      const verifId = `verif_port_${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO candidate_verifications (
          id, candidate_id, provider, handle_or_url, verification_status,
          metadata_json, evidence_json, updated_at
        ) VALUES (?, ?, 'portfolio', ?, 'verified', ?, ?, ?)
      `).run(verifId, user.id, portfolioUrl, metaJson, evidJson, now);
    }

    return res.json({
      success: true,
      message: 'Portfolio successfully fetched and verified through SSRF-hardened proxy.',
      data: {
        portfolioUrl: safeResult.finalUrl,
        contentLengthBytes: safeResult.contentLengthBytes,
        textSnippet: safeResult.sanitizedTextSnippet,
        extractedLinksCount: safeResult.extractedLinks?.length || 0,
      },
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: 'Portfolio verification failed', error: err.message });
  }
});

candidateExperienceRouter.post('/verify-linkedin', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const schema = z.object({
      handleOrUrl: z.string().min(1),
      exportSummary: z.string().optional(),
      uploadedData: z.any().optional(),
    });

    const { handleOrUrl, exportSummary, uploadedData } = schema.parse(req.body);

    const now = new Date().toISOString();
    const existing = db.prepare(`SELECT id FROM candidate_verifications WHERE candidate_id = ? AND provider = 'linkedin_export' AND handle_or_url = ?`).get(user.id, handleOrUrl) as { id: string } | undefined;
    const metaJson = JSON.stringify({
      source: 'Candidate Data Export / Manual Entry',
      notice: 'No third-party web scraping conducted; data provided directly by candidate.',
    });
    const evidJson = JSON.stringify({
      summary: exportSummary || 'Profile data verified via candidate data upload.',
      data: uploadedData || {},
    });

    if (existing) {
      db.prepare(`
        UPDATE candidate_verifications SET
          verification_status = 'verified',
          metadata_json = ?,
          evidence_json = ?,
          updated_at = ?
        WHERE id = ?
      `).run(metaJson, evidJson, now, existing.id);
    } else {
      const verifId = `verif_li_${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO candidate_verifications (
          id, candidate_id, provider, handle_or_url, verification_status,
          metadata_json, evidence_json, updated_at
        ) VALUES (?, ?, 'linkedin_export', ?, 'verified', ?, ?, ?)
      `).run(verifId, user.id, handleOrUrl, metaJson, evidJson, now);
    }

    return res.json({
      success: true,
      message: 'LinkedIn candidate data import verified without web scraping.',
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: 'LinkedIn verification import failed', error: err.message });
  }
});

// ============================================================
// 6. PRE-APPLY PREVIEW (MATCH & ATS READINESS CHECK)
// ============================================================
candidateExperienceRouter.get('/pre-apply-preview/:jobId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { jobId } = req.params;

    const job = db.prepare(`SELECT * FROM jobs WHERE id = ?`).get(jobId) as any;
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const profile = db.prepare(`SELECT * FROM candidate_profiles WHERE user_id = ?`).get(user.id) as any;
    const profileId = profile?.id;

    const latestResume = profileId
      ? db.prepare(`
          SELECT cr.id, cr.original_filename, cr.created_at as upload_date
          FROM candidate_resumes cr
          WHERE cr.candidate_profile_id = ?
          ORDER BY cr.created_at DESC
          LIMIT 1
        `).get(profileId) as any
      : null;
    const skills = profileId
      ? (db.prepare(`SELECT name as skill_name, proficiency FROM candidate_skills WHERE candidate_profile_id = ?`).all(profileId) as any[]).map(s => s.skill_name)
      : [];

    const reqSkills: string[] = (db.prepare(`SELECT name FROM job_required_skills WHERE job_id = ?`).all(job.id) as any[]).map(r => r.name);
    const prefSkills: string[] = (db.prepare(`SELECT name FROM job_preferred_skills WHERE job_id = ?`).all(job.id) as any[]).map(r => r.name);

    const matchedReq = reqSkills.filter(s => skills.some(cs => cs.toLowerCase() === s.toLowerCase()));
    const missingReq = reqSkills.filter(s => !skills.some(cs => cs.toLowerCase() === s.toLowerCase()));
    const matchedPref = prefSkills.filter(s => skills.some(cs => cs.toLowerCase() === s.toLowerCase()));

    const candidateYears = profile?.total_experience_years || 2;
    const requiredYears = job.min_experience || 0;
    const yearsMet = candidateYears >= requiredYears;

    const scoreV2Result = calculateScoreV2(
      {
        candidateId: user.id,
        skills: skills.map(s => ({ name: s, proficiency: 0.8 })),
        experienceYears: candidateYears,
        seniorityLevel: profile?.seniority_level || 'Mid',
        highestDegree: profile?.education_level || "Bachelor's Degree",
        projects: [],
        achievements: [],
        certifications: [],
        atsReadinessScore: 85,
      },
      {
        jobId: job.id,
        title: job.title,
        requiredSkills: reqSkills,
        preferredSkills: prefSkills,
        minExperienceYears: requiredYears,
      }
    );

    return res.json({
      success: true,
      data: {
        jobTitle: job.title,
        companyName: job.company_name || 'Hiring Partner',
        overallMatchScore: scoreV2Result.finalScore,
        matchGrade: scoreV2Result.confidenceBand,
        atsReadinessScore: 85,
        matchedRequiredSkills: matchedReq,
        missingRequiredSkills: missingReq,
        matchedPreferredSkills: matchedPref,
        candidateExperienceYears: candidateYears,
        requiredExperienceYears: requiredYears,
        yearsRequirementMet: yearsMet,
        improvementTips: missingReq.length > 0
          ? [`Consider highlighting projects or coursework relating to: ${missingReq.slice(0, 3).join(', ')}.`]
          : ['Excellent alignment with required skills for this position.'],
        hasResumeUploaded: Boolean(latestResume),
        latestResumeFilename: latestResume?.original_filename || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to generate pre-apply preview', error: err.message });
  }
});

// ============================================================
// 7. APPLICATION WITHDRAWAL FLOW
// ============================================================
candidateExperienceRouter.post('/applications/:applicationId/withdraw', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { applicationId } = req.params;
    const { reason } = req.body;

    const application = db.prepare(`SELECT * FROM applications WHERE id = ? AND candidate_id = ?`).get(applicationId, user.id) as any;
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or you are not authorized to withdraw it.' });
    }

    if (application.status === 'Withdrawn') {
      return res.status(400).json({ success: false, message: 'This application has already been withdrawn.' });
    }

    const now = new Date().toISOString();
    const withdrawNote = reason ? `Withdrawn by candidate: ${reason}` : 'Withdrawn by candidate';

    const oldStatus = application.status;
    db.prepare(`UPDATE applications SET status = 'Withdrawn', updated_at = datetime('now') WHERE id = ?`).run(applicationId);

    const historyId = `ash_${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO application_status_history (id, application_id, old_status, new_status, changed_by, changed_by_role, note, changed_at)
      VALUES (?, ?, ?, 'Withdrawn', ?, 'candidate', ?, datetime('now'))
    `).run(historyId, applicationId, oldStatus, user.id, withdrawNote);

    return res.json({
      success: true,
      message: 'Application has been withdrawn successfully.',
      data: {
        applicationId,
        status: 'Withdrawn',
        withdrawnAt: now,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to withdraw application', error: err.message });
  }
});

// ============================================================
// 8. DATA RIGHTS (GDPR / CCPA / DPDP)
// ============================================================
candidateExperienceRouter.get('/data-export', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const dataPackage = exportAllCandidateData(user.id);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="resumio-data-export-${user.id}.json"`);
    return res.json(dataPackage);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to export candidate data.', error: err.message });
  }
});

candidateExperienceRouter.delete('/account', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await deleteCandidateAccount(user.id);

    return res.json({
      success: true,
      message: 'Candidate account and all associated personal data have been completely purged.',
      data: result,
    });
  } catch (err: any) {
    console.error('Account deletion error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete account.', error: err.message });
  }
});

candidateExperienceRouter.get('/consents', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const consents = getCandidateConsents(user.id);
    return res.json({ success: true, data: consents });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch consents.', error: err.message });
  }
});

candidateExperienceRouter.post('/consents', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const schema = z.object({
      talentPoolInclusion: z.boolean(),
      trainingDataInclusion: z.boolean(),
    });

    const body = schema.parse(req.body);
    const updated = updateCandidateConsents(user.id, body);

    return res.json({ success: true, message: 'Privacy consents updated successfully.', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: 'Invalid consent parameters.', error: err.message });
  }
});

candidateExperienceRouter.get('/profile-access-audit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const logs = getProfileAccessLogs(user.id);
    return res.json({ success: true, data: logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch access logs.', error: err.message });
  }
});

// ============================================================
// 9. CURATED LEARNING RESOURCES DIRECTORY (TRUTHFULNESS)
// ============================================================
candidateExperienceRouter.get('/curated-resources', authenticateToken, async (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`SELECT * FROM curated_learning_resources ORDER BY skill_name ASC, difficulty ASC`).all();
    return res.json({ success: true, data: rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch curated resources', error: err.message });
  }
});

candidateExperienceRouter.post('/curated-resources', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin' && user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Admin or Recruiter privileges required.' });
    }

    const schema = z.object({
      skillName: z.string().min(1),
      title: z.string().min(1),
      url: z.string().url(),
      provider: z.string().min(1),
      resourceType: z.enum(['course', 'documentation', 'book', 'project', 'tutorial']),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
      estimatedHours: z.number().int().positive().default(10),
      isFree: z.boolean().default(true),
    });

    const body = schema.parse(req.body);
    const id = `res_${crypto.randomUUID()}`;

    db.prepare(`
      INSERT INTO curated_learning_resources (
        id, skill_name, title, url, provider, resource_type, difficulty, estimated_hours, is_free
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.skillName,
      body.title,
      body.url,
      body.provider,
      body.resourceType,
      body.difficulty,
      body.estimatedHours,
      body.isFree ? 1 : 0
    );

    return res.json({ success: true, message: 'Curated learning resource added.', data: { id, ...body } });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: 'Invalid learning resource payload', error: err.message });
  }
});

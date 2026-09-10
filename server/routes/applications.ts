import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../database/db';
import { authenticateToken } from '../middleware/auth';
import { processResumeAndScreen } from '../services/resumeProcessingPipeline';
import { ResumeJobMatchingService } from '../services/matchingService';
import { CandidateSummaryService } from '../services/candidateSummaryService';
import { NotificationService } from '../services/notificationService';

export const applicationsRouter = Router();

// ============================================================
// CANDIDATE ENDPOINTS
// ============================================================

/**
 * POST /api/candidate/applications
 * Candidate applies to a published active job
 */
applicationsRouter.post('/candidate/applications', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Only candidates can submit job applications.' });
    }

    const { jobId, resumeId, coverLetter } = req.body;
    if (!jobId || !jobId.trim()) {
      return res.status(400).json({ success: false, message: 'Job ID is required.' });
    }
    if (!resumeId || !resumeId.trim()) {
      return res.status(400).json({ success: false, message: 'Please select a resume for this application.' });
    }

    // 1. Get candidate profile
    const candidateProfile = db.prepare('SELECT id, full_name FROM candidate_profiles WHERE user_id = ?').get(user.id) as any;
    if (!candidateProfile) {
      return res.status(404).json({ success: false, message: 'Candidate profile not found. Please complete your profile.' });
    }

    // 2. Validate job exists and is Published
    const job = db.prepare('SELECT id, title, status, recruiter_id FROM jobs WHERE id = ?').get(jobId.trim()) as any;
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found.' });
    }
    if (job.status !== 'Published') {
      return res.status(400).json({ success: false, message: `Applications cannot be submitted to ${job.status.toLowerCase()} jobs.` });
    }

    // 3. Validate resume belongs to candidate
    const resume = db.prepare('SELECT id, original_filename FROM candidate_resumes WHERE id = ? AND candidate_profile_id = ?').get(resumeId.trim(), candidateProfile.id) as any;
    if (!resume) {
      return res.status(400).json({ success: false, message: 'Selected resume not found or does not belong to your account.' });
    }

    // 4. Duplicate prevention check
    const existingApp = db.prepare('SELECT id, status FROM applications WHERE candidate_id = ? AND job_id = ?').get(user.id, job.id) as any;
    if (existingApp) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this job position.',
        applicationId: existingApp.id,
        currentStatus: existingApp.status,
      });
    }

    const applicationId = crypto.randomUUID();
    const historyId = crypto.randomUUID();
    const sanitizedCoverLetter = (coverLetter || '').trim();

    // 5. Insert application record
    db.prepare(`
      INSERT INTO applications (id, candidate_id, candidate_profile_id, job_id, resume_id, cover_letter, status, applied_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'Applied', datetime('now'), datetime('now'))
    `).run(applicationId, user.id, candidateProfile.id, job.id, resume.id, sanitizedCoverLetter);

    // 6. Insert initial status history record
    db.prepare(`
      INSERT INTO application_status_history (id, application_id, old_status, new_status, changed_by, changed_by_role, note, changed_at)
      VALUES (?, ?, NULL, 'Applied', ?, 'candidate', 'Application submitted with resume: ' || ?, datetime('now'))
    `).run(historyId, applicationId, user.id, resume.original_filename);

    // 7. Background AI Matching & Parsing Pipeline
    (async () => {
      try {
        await processResumeAndScreen(resume.id, user.id, candidateProfile.id, resume.stored_filename, applicationId, job.id);
        const matchRes = await ResumeJobMatchingService.computeMatch(resume.id, job.id, user.id, candidateProfile.id, applicationId);
        await CandidateSummaryService.generateSummary(matchRes, job.title, job.company_name || '');
      } catch (pipelineErr) {
        console.warn('Background application matching pipeline notice:', pipelineErr);
      }
    })();

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      applicationId,
    });
  } catch (err: any) {
    console.error('Submit application error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit application.', error: err.message });
  }
});

/**
 * GET /api/candidate/applications/check/:jobId
 * Check if current candidate has applied to a given job
 */
applicationsRouter.get('/candidate/applications/check/:jobId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'candidate') {
      return res.json({ success: true, hasApplied: false });
    }

    const { jobId } = req.params;
    const app = db.prepare(`
      SELECT id, status, applied_at, updated_at
      FROM applications
      WHERE candidate_id = ? AND job_id = ?
    `).get(user.id, jobId) as any;

    return res.json({
      success: true,
      hasApplied: Boolean(app),
      application: app || null,
    });
  } catch (err: any) {
    console.error('Check application error:', err);
    return res.status(500).json({ success: false, message: 'Failed to check application status.', error: err.message });
  }
});

/**
 * GET /api/candidate/applications
 * List all applications submitted by authenticated candidate
 */
applicationsRouter.get('/candidate/applications', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Only candidates can view candidate applications.' });
    }

    const { status, search } = req.query as { status?: string; search?: string };

    let query = `
      SELECT 
        a.id, a.job_id, a.resume_id, a.cover_letter, a.status, a.rejection_reason, a.applied_at, a.updated_at,
        j.title as job_title, j.company_name, j.location as job_location, j.work_mode, j.employment_type,
        j.salary_min, j.salary_max, j.currency, j.salary_period, j.salary_disclosed, j.status as job_status,
        r.original_filename as resume_filename, r.stored_filename as resume_stored_filename, r.file_type as resume_file_type, r.file_size as resume_file_size
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN candidate_resumes r ON a.resume_id = r.id
      WHERE a.candidate_id = ?
    `;
    const params: any[] = [user.id];

    if (status && status !== 'All') {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      query += ` AND (j.title LIKE ? OR j.company_name LIKE ? OR j.location LIKE ?)`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY a.applied_at DESC`;

    const rawApplications = db.prepare(query).all(...params) as any[];

    // Calculate real stats across all candidate applications
    const allApps = db.prepare('SELECT status FROM applications WHERE candidate_id = ?').all(user.id) as any[];
    const stats = {
      total: allApps.length,
      applied: allApps.filter((a) => a.status === 'Applied').length,
      under_review: allApps.filter((a) => a.status === 'Under Review').length,
      shortlisted: allApps.filter((a) => a.status === 'Shortlisted').length,
      rejected: allApps.filter((a) => a.status === 'Rejected').length,
      withdrawn: allApps.filter((a) => a.status === 'Withdrawn').length,
    };

    const applications = rawApplications.map((app) => ({
      id: app.id,
      jobId: app.job_id,
      jobTitle: app.job_title,
      company: app.company_name,
      location: app.job_location,
      workMode: app.work_mode,
      employmentType: app.employment_type,
      salaryMin: app.salary_min,
      salaryMax: app.salary_max,
      currency: app.currency,
      salaryPeriod: app.salary_period,
      salaryDisclosed: Boolean(app.salary_disclosed),
      jobStatus: app.job_status,
      resumeId: app.resume_id,
      resumeFilename: app.resume_filename,
      resumeStoredFilename: app.resume_stored_filename,
      resumeFileType: app.resume_file_type,
      resumeFileSize: app.resume_file_size,
      resumeUrl: `/api/candidate/resumes/${app.resume_id}/preview`,
      coverLetter: app.cover_letter,
      status: app.status,
      rejectionReason: app.rejection_reason,
      appliedAt: app.applied_at,
      updatedAt: app.updated_at,
    }));

    return res.json({
      success: true,
      applications,
      stats,
    });
  } catch (err: any) {
    console.error('Fetch candidate applications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch applications.', error: err.message });
  }
});

/**
 * GET /api/candidate/applications/:id
 * Get single application details with status timeline
 */
applicationsRouter.get('/candidate/applications/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Only candidates can view their application details.' });
    }

    const { id } = req.params;
    const rawApp = db.prepare(`
      SELECT 
        a.id, a.job_id, a.resume_id, a.cover_letter, a.status, a.rejection_reason, a.applied_at, a.updated_at,
        j.title as job_title, j.description as job_description, j.responsibilities as job_responsibilities,
        j.company_name, j.location as job_location, j.work_mode, j.employment_type,
        j.salary_min, j.salary_max, j.currency, j.salary_period, j.salary_disclosed, j.status as job_status,
        j.min_experience, j.max_experience, j.qualification, j.deadline,
        r.original_filename as resume_filename, r.stored_filename as resume_stored_filename, r.file_type as resume_file_type, r.file_size as resume_file_size
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN candidate_resumes r ON a.resume_id = r.id
      WHERE a.id = ? AND a.candidate_id = ?
    `).get(id, user.id) as any;

    if (!rawApp) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Fetch required and preferred skills for the job
    const reqSkills = db.prepare('SELECT name FROM job_required_skills WHERE job_id = ?').all(rawApp.job_id) as any[];
    const prefSkills = db.prepare('SELECT name FROM job_preferred_skills WHERE job_id = ?').all(rawApp.job_id) as any[];

    // Fetch status history timeline
    const rawTimeline = db.prepare(`
      SELECT id, old_status, new_status, changed_by_role, note, changed_at
      FROM application_status_history
      WHERE application_id = ?
      ORDER BY changed_at ASC
    `).all(id) as any[];

    const application = {
      id: rawApp.id,
      jobId: rawApp.job_id,
      jobTitle: rawApp.job_title,
      company: rawApp.company_name,
      location: rawApp.job_location,
      workMode: rawApp.work_mode,
      employmentType: rawApp.employment_type,
      description: rawApp.job_description,
      responsibilities: rawApp.job_responsibilities,
      salaryMin: rawApp.salary_min,
      salaryMax: rawApp.salary_max,
      currency: rawApp.currency,
      salaryPeriod: rawApp.salary_period,
      salaryDisclosed: Boolean(rawApp.salary_disclosed),
      minExperience: rawApp.min_experience,
      maxExperience: rawApp.max_experience,
      qualification: rawApp.qualification,
      deadline: rawApp.deadline,
      jobStatus: rawApp.job_status,
      requiredSkills: reqSkills.map((s) => s.name),
      preferredSkills: prefSkills.map((s) => s.name),
      resumeId: rawApp.resume_id,
      resumeFilename: rawApp.resume_filename,
      resumeStoredFilename: rawApp.resume_stored_filename,
      resumeFileType: rawApp.resume_file_type,
      resumeFileSize: rawApp.resume_file_size,
      resumeUrl: `/api/candidate/resumes/${rawApp.resume_id}/preview`,
      coverLetter: rawApp.cover_letter,
      status: rawApp.status,
      rejectionReason: rawApp.rejection_reason,
      appliedAt: rawApp.applied_at,
      updatedAt: rawApp.updated_at,
    };

    const timeline = rawTimeline.map((item) => ({
      id: item.id,
      oldStatus: item.old_status,
      newStatus: item.new_status,
      changedByRole: item.changed_by_role,
      note: item.note,
      changedAt: item.changed_at,
    }));

    return res.json({
      success: true,
      application,
      timeline,
    });
  } catch (err: any) {
    console.error('Fetch candidate application detail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch application detail.', error: err.message });
  }
});

/**
 * PATCH /api/candidate/applications/:id/withdraw
 * Candidate withdraws their active application
 */
applicationsRouter.patch('/candidate/applications/:id/withdraw', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Only candidates can withdraw their applications.' });
    }

    const { id } = req.params;
    const app = db.prepare('SELECT id, status FROM applications WHERE id = ? AND candidate_id = ?').get(id, user.id) as any;

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (app.status === 'Withdrawn') {
      return res.status(400).json({ success: false, message: 'This application has already been withdrawn.' });
    }

    if (app.status === 'Rejected') {
      return res.status(400).json({ success: false, message: 'Cannot withdraw an application that has already been rejected.' });
    }

    const oldStatus = app.status;
    db.prepare(`
      UPDATE applications
      SET status = 'Withdrawn', updated_at = datetime('now')
      WHERE id = ?
    `).run(id);

    // Insert history record
    const historyId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO application_status_history (id, application_id, old_status, new_status, changed_by, changed_by_role, note, changed_at)
      VALUES (?, ?, ?, 'Withdrawn', ?, 'candidate', 'Application withdrawn by candidate', datetime('now'))
    `).run(historyId, id, oldStatus, user.id);

    return res.json({
      success: true,
      message: 'Application successfully withdrawn.',
      status: 'Withdrawn',
    });
  } catch (err: any) {
    console.error('Withdraw application error:', err);
    return res.status(500).json({ success: false, message: 'Failed to withdraw application.', error: err.message });
  }
});

// ============================================================
// RECRUITER ENDPOINTS
// ============================================================

/**
 * GET /api/recruiter/jobs/:jobId/applicants
 * Recruiter lists applicants for a specific job posting
 */
applicationsRouter.get('/recruiter/jobs/:jobId/applicants', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can view job applicants.' });
    }

    const { jobId } = req.params;
    const { status, search } = req.query as { status?: string; search?: string };

    // 1. Verify recruiter owns the job
    const job = db.prepare('SELECT id, title, company_name, recruiter_id, status FROM jobs WHERE id = ?').get(jobId) as any;
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found.' });
    }
    if (job.recruiter_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this job posting.' });
    }

    let query = `
      SELECT 
        a.id, a.job_id, a.candidate_id, a.candidate_profile_id, a.resume_id, a.cover_letter, a.status, a.rejection_reason, a.applied_at, a.updated_at,
        cp.full_name as candidate_name, cp.phone as candidate_phone, cp.location as candidate_location, cp.headline as candidate_headline, cp.photo_url as candidate_photo,
        u.email as candidate_email,
        r.original_filename as resume_filename, r.stored_filename as resume_stored_filename, r.file_type as resume_file_type, r.file_size as resume_file_size
      FROM applications a
      JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
      JOIN users u ON a.candidate_id = u.id
      JOIN candidate_resumes r ON a.resume_id = r.id
      WHERE a.job_id = ?
    `;
    const params: any[] = [jobId];

    if (status && status !== 'All') {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      query += ` AND (cp.full_name LIKE ? OR u.email LIKE ? OR cp.headline LIKE ? OR cp.location LIKE ?)`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY a.applied_at DESC`;

    const rawApplicants = db.prepare(query).all(...params) as any[];

    // Calculate job-specific pipeline stats
    const allJobApps = db.prepare('SELECT status FROM applications WHERE job_id = ?').all(jobId) as any[];
    const stats = {
      total: allJobApps.length,
      applied: allJobApps.filter((a) => a.status === 'Applied').length,
      under_review: allJobApps.filter((a) => a.status === 'Under Review').length,
      shortlisted: allJobApps.filter((a) => a.status === 'Shortlisted').length,
      rejected: allJobApps.filter((a) => a.status === 'Rejected').length,
      withdrawn: allJobApps.filter((a) => a.status === 'Withdrawn').length,
    };

    // Enrich applicants with skills and experience count
    const applicants = rawApplicants.map((app) => {
      const skills = db.prepare('SELECT name, proficiency FROM candidate_skills WHERE candidate_profile_id = ?').all(app.candidate_profile_id) as any[];
      const experienceCount = (db.prepare('SELECT COUNT(*) as count FROM candidate_experience WHERE candidate_profile_id = ?').get(app.candidate_profile_id) as any)?.count || 0;

      return {
        id: app.id,
        jobId: app.job_id,
        candidateId: app.candidate_id,
        candidateProfileId: app.candidate_profile_id,
        candidateName: app.candidate_name,
        candidateEmail: app.candidate_email,
        candidatePhone: app.candidate_phone,
        candidateLocation: app.candidate_location,
        candidateHeadline: app.candidate_headline,
        candidatePhoto: app.candidate_photo,
        skills: skills.map((s) => ({ name: s.name, proficiency: s.proficiency })),
        experienceCount,
        resumeId: app.resume_id,
        resumeFilename: app.resume_filename,
        resumeStoredFilename: app.resume_stored_filename,
        resumeFileType: app.resume_file_type,
        resumeFileSize: app.resume_file_size,
        resumeUrl: `/api/candidate/resumes/${app.resume_id}/preview`,
        coverLetter: app.cover_letter,
        status: app.status,
        rejectionReason: app.rejection_reason,
        appliedAt: app.applied_at,
        updatedAt: app.updated_at,
      };
    });

    return res.json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
        companyName: job.company_name,
        status: job.status,
      },
      applicants,
      stats,
    });
  } catch (err: any) {
    console.error('Fetch job applicants error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch applicants.', error: err.message });
  }
});

/**
 * GET /api/recruiter/applicants
 * Recruiter lists applicants across all jobs they own
 */
applicationsRouter.get('/recruiter/applicants', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can view applicant pipeline.' });
    }

    const { status, search, jobId } = req.query as { status?: string; search?: string; jobId?: string };

    let query = `
      SELECT 
        a.id, a.job_id, a.candidate_id, a.candidate_profile_id, a.resume_id, a.cover_letter, a.status, a.rejection_reason, a.applied_at, a.updated_at,
        j.title as job_title, j.location as job_location, j.employment_type as job_employment_type,
        cp.full_name as candidate_name, cp.phone as candidate_phone, cp.location as candidate_location, cp.headline as candidate_headline, cp.photo_url as candidate_photo,
        u.email as candidate_email,
        r.original_filename as resume_filename, r.stored_filename as resume_stored_filename, r.file_type as resume_file_type, r.file_size as resume_file_size
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
      JOIN users u ON a.candidate_id = u.id
      JOIN candidate_resumes r ON a.resume_id = r.id
      WHERE j.recruiter_id = ?
    `;
    const params: any[] = [user.id];

    if (jobId && jobId.trim() && jobId !== 'All') {
      query += ` AND a.job_id = ?`;
      params.push(jobId.trim());
    }

    if (status && status !== 'All') {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      query += ` AND (cp.full_name LIKE ? OR u.email LIKE ? OR j.title LIKE ? OR cp.headline LIKE ?)`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY a.applied_at DESC`;

    const rawApplicants = db.prepare(query).all(...params) as any[];

    // Calculate pipeline stats across all jobs owned by this recruiter
    const allRecruiterApps = db.prepare(`
      SELECT a.status 
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.recruiter_id = ?
    `).all(user.id) as any[];

    const stats = {
      total: allRecruiterApps.length,
      applied: allRecruiterApps.filter((a) => a.status === 'Applied').length,
      under_review: allRecruiterApps.filter((a) => a.status === 'Under Review').length,
      shortlisted: allRecruiterApps.filter((a) => a.status === 'Shortlisted').length,
      rejected: allRecruiterApps.filter((a) => a.status === 'Rejected').length,
      withdrawn: allRecruiterApps.filter((a) => a.status === 'Withdrawn').length,
    };

    const applicants = rawApplicants.map((app) => {
      const skills = db.prepare('SELECT name, proficiency FROM candidate_skills WHERE candidate_profile_id = ?').all(app.candidate_profile_id) as any[];
      return {
        id: app.id,
        jobId: app.job_id,
        jobTitle: app.job_title,
        jobLocation: app.job_location,
        candidateId: app.candidate_id,
        candidateProfileId: app.candidate_profile_id,
        candidateName: app.candidate_name,
        candidateEmail: app.candidate_email,
        candidatePhone: app.candidate_phone,
        candidateLocation: app.candidate_location,
        candidateHeadline: app.candidate_headline,
        candidatePhoto: app.candidate_photo,
        skills: skills.map((s) => ({ name: s.name, proficiency: s.proficiency })),
        resumeId: app.resume_id,
        resumeFilename: app.resume_filename,
        resumeStoredFilename: app.resume_stored_filename,
        resumeFileType: app.resume_file_type,
        resumeFileSize: app.resume_file_size,
        resumeUrl: `/api/candidate/resumes/${app.resume_id}/preview`,
        coverLetter: app.cover_letter,
        status: app.status,
        rejectionReason: app.rejection_reason,
        appliedAt: app.applied_at,
        updatedAt: app.updated_at,
      };
    });

    return res.json({
      success: true,
      applicants,
      stats,
    });
  } catch (err: any) {
    console.error('Fetch all recruiter applicants error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch applicants.', error: err.message });
  }
});

/**
 * GET /api/recruiter/applications/:id
 * Recruiter gets full application details, full candidate profile, submitted resume, and status timeline
 */
applicationsRouter.get('/recruiter/applications/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can view applicant profile details.' });
    }

    const { id } = req.params;

    const rawApp = db.prepare(`
      SELECT 
        a.id, a.job_id, a.candidate_id, a.candidate_profile_id, a.resume_id, a.cover_letter, a.status, a.rejection_reason, a.applied_at, a.updated_at,
        j.title as job_title, j.recruiter_id, j.company_name, j.location as job_location, j.work_mode, j.employment_type,
        cp.full_name as candidate_name, cp.phone as candidate_phone, cp.location as candidate_location,
        cp.headline as candidate_headline, cp.bio as candidate_bio, cp.photo_url as candidate_photo,
        cp.profile_completion,
        u.email as candidate_email,
        r.original_filename as resume_filename, r.stored_filename as resume_stored_filename, r.file_type as resume_file_type, r.file_size as resume_file_size
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
      JOIN users u ON a.candidate_id = u.id
      JOIN candidate_resumes r ON a.resume_id = r.id
      WHERE a.id = ?
    `).get(id) as any;

    if (!rawApp) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (rawApp.recruiter_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own the job for this application.' });
    }

    // Fetch candidate's deep profile data
    const education = db.prepare('SELECT * FROM candidate_education WHERE candidate_profile_id = ? ORDER BY start_date DESC').all(rawApp.candidate_profile_id) as any[];
    const skills = db.prepare('SELECT * FROM candidate_skills WHERE candidate_profile_id = ? ORDER BY name ASC').all(rawApp.candidate_profile_id) as any[];
    const experience = db.prepare('SELECT * FROM candidate_experience WHERE candidate_profile_id = ? ORDER BY start_date DESC').all(rawApp.candidate_profile_id) as any[];
    const projects = db.prepare('SELECT * FROM candidate_projects WHERE candidate_profile_id = ? ORDER BY created_at DESC').all(rawApp.candidate_profile_id) as any[];
    const certifications = db.prepare('SELECT * FROM candidate_certifications WHERE candidate_profile_id = ? ORDER BY issue_date DESC').all(rawApp.candidate_profile_id) as any[];

    // Fetch status history timeline
    const rawTimeline = db.prepare(`
      SELECT id, old_status, new_status, changed_by_role, note, changed_at
      FROM application_status_history
      WHERE application_id = ?
      ORDER BY changed_at ASC
    `).all(id) as any[];

    const application = {
      id: rawApp.id,
      jobId: rawApp.job_id,
      jobTitle: rawApp.job_title,
      company: rawApp.company_name,
      jobLocation: rawApp.job_location,
      workMode: rawApp.work_mode,
      employmentType: rawApp.employment_type,
      candidateId: rawApp.candidate_id,
      candidateProfileId: rawApp.candidate_profile_id,
      coverLetter: rawApp.cover_letter,
      status: rawApp.status,
      rejectionReason: rawApp.rejection_reason,
      appliedAt: rawApp.applied_at,
      updatedAt: rawApp.updated_at,
      resume: {
        id: rawApp.resume_id,
        originalFilename: rawApp.resume_filename,
        storedFilename: rawApp.resume_stored_filename,
        fileType: rawApp.resume_file_type,
        fileSize: rawApp.resume_file_size,
        previewUrl: `/api/candidate/resumes/${rawApp.resume_id}/preview`,
      },
      candidate: {
        name: rawApp.candidate_name,
        email: rawApp.candidate_email,
        phone: rawApp.candidate_phone,
        location: rawApp.candidate_location,
        headline: rawApp.candidate_headline,
        bio: rawApp.candidate_bio,
        photoUrl: rawApp.candidate_photo,
        profileCompletion: rawApp.profile_completion,
        education,
        skills,
        experience,
        projects,
        certifications,
      },
    };

    const timeline = rawTimeline.map((item) => ({
      id: item.id,
      oldStatus: item.old_status,
      newStatus: item.new_status,
      changedByRole: item.changed_by_role,
      note: item.note,
      changedAt: item.changed_at,
    }));

    return res.json({
      success: true,
      application,
      timeline,
    });
  } catch (err: any) {
    console.error('Fetch recruiter application detail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch application detail.', error: err.message });
  }
});

/**
 * PATCH /api/recruiter/applications/:id/status
 * Recruiter updates applicant status: 'Under Review' | 'Shortlisted' | 'Rejected'
 */
applicationsRouter.patch('/recruiter/applications/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can update applicant status.' });
    }

    const { id } = req.params;
    const { status, note, rejectionReason } = req.body;

    const allowedStatuses = ['Under Review', 'Shortlisted', 'Rejected', 'Applied'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    // Verify application and ownership
    const rawApp = db.prepare(`
      SELECT a.id, a.status, a.candidate_id, j.recruiter_id, j.title as job_title
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `).get(id) as any;

    if (!rawApp) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (rawApp.recruiter_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own the job for this application.' });
    }

    const oldStatus = rawApp.status;
    const reasonText = (rejectionReason || '').trim();
    const noteText = (note || '').trim() || (status === 'Rejected' && reasonText ? reasonText : `Status changed to ${status}`);

    db.prepare(`
      UPDATE applications
      SET status = ?, rejection_reason = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, status === 'Rejected' ? reasonText : '', id);

    // Insert history record
    const historyId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO application_status_history (id, application_id, old_status, new_status, changed_by, changed_by_role, note, changed_at)
      VALUES (?, ?, ?, ?, ?, 'recruiter', ?, datetime('now'))
    `).run(historyId, id, oldStatus, status, user.id, noteText);

    // Trigger In-App Notification for Candidate
    try {
      NotificationService.notifyApplicationStatus(
        rawApp.candidate_id,
        rawApp.job_title,
        oldStatus,
        status,
        id,
        status === 'Rejected' ? reasonText : undefined
      );
    } catch (notifErr) {
      console.warn('Failed to send in-app notification for status update:', notifErr);
    }

    return res.json({
      success: true,
      message: `Applicant status successfully updated to ${status}.`,
      status,
      oldStatus,
    });
  } catch (err: any) {
    console.error('Update applicant status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update applicant status.', error: err.message });
  }
});

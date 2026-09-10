import { Router, Request, Response } from 'express';
import { db } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { processResumeAndScreen } from '../services/resumeProcessingPipeline.js';

export const resumeProcessingRouter = Router();

// ============================================================
// CANDIDATE ENDPOINTS
// ============================================================

/**
 * GET /api/candidate/resume/parsed
 * Retrieves parsed resume data and screening analysis for current candidate's active resume.
 */
resumeProcessingRouter.get('/candidate/resume/parsed', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Only candidates can view their parsed resume.' });
    }

    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(user.id) as any;
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Candidate profile not found.' });
    }

    const resume = db.prepare(`
      SELECT * FROM candidate_resumes 
      WHERE candidate_profile_id = ? AND is_active = 1
    `).get(profile.id) as any;

    if (!resume) {
      return res.json({
        success: true,
        hasResume: false,
        parsed: null,
        screening: null,
        message: 'No active resume uploaded.',
      });
    }

    // Check if parsed record already exists
    let parsedRecord = db.prepare('SELECT * FROM resume_parsed_data WHERE resume_id = ?').get(resume.id) as any;
    let screeningRecord = db.prepare('SELECT * FROM resume_screenings WHERE resume_id = ? AND application_id IS NULL').get(resume.id) as any;

    // If not processed or pending, execute process pipeline
    if (!parsedRecord || parsedRecord.status === 'Not Processed' || parsedRecord.status === 'Processing') {
      const processResult = await processResumeAndScreen(resume.id, user.id, profile.id, resume.stored_filename);
      if (processResult.status === 'Failed') {
        return res.json({
          success: true,
          hasResume: true,
          resumeId: resume.id,
          filename: resume.original_filename,
          status: 'Failed',
          errorMessage: processResult.errorMessage,
          parsed: null,
          screening: null,
        });
      }
      parsedRecord = db.prepare('SELECT * FROM resume_parsed_data WHERE resume_id = ?').get(resume.id) as any;
      screeningRecord = db.prepare('SELECT * FROM resume_screenings WHERE resume_id = ? AND application_id IS NULL').get(resume.id) as any;
    }

    const parsedData = formatParsedRecord(parsedRecord);
    const screeningData = formatScreeningRecord(screeningRecord);

    return res.json({
      success: true,
      hasResume: true,
      resumeId: resume.id,
      filename: resume.original_filename,
      status: parsedRecord.status,
      errorMessage: parsedRecord.error_message || '',
      parsed: parsedData,
      screening: screeningData,
      parsedAt: parsedRecord.completed_at || parsedRecord.created_at,
    });
  } catch (err: any) {
    console.error('Fetch candidate parsed resume error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch parsed resume data.', error: err.message });
  }
});

/**
 * POST /api/candidate/resume/parse
 * Explicitly triggers or retries parsing on the active resume.
 */
resumeProcessingRouter.post('/candidate/resume/parse', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Only candidates can parse their resume.' });
    }

    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(user.id) as any;
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Candidate profile not found.' });
    }

    const resume = db.prepare(`
      SELECT * FROM candidate_resumes 
      WHERE candidate_profile_id = ? AND is_active = 1
    `).get(profile.id) as any;

    if (!resume) {
      return res.status(404).json({ success: false, message: 'No active resume found to parse. Please upload a resume first.' });
    }

    const processResult = await processResumeAndScreen(resume.id, user.id, profile.id, resume.stored_filename);

    if (processResult.status === 'Failed') {
      return res.status(422).json({
        success: false,
        status: 'Failed',
        message: processResult.errorMessage || 'Failed to extract and parse resume text.',
        errorMessage: processResult.errorMessage,
      });
    }

    return res.json({
      success: true,
      message: 'Resume parsed and screened successfully.',
      status: 'Processed',
      parsed: processResult.parsed,
      screening: processResult.screening,
    });
  } catch (err: any) {
    console.error('Trigger parse resume error:', err);
    return res.status(500).json({ success: false, message: 'Resume parsing failed.', error: err.message });
  }
});

/**
 * POST /api/candidate/resume/reparse
 * Forces re-parsing and re-screening.
 */
resumeProcessingRouter.post('/candidate/resume/reparse', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(user.id) as any;
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Candidate profile not found.' });
    }

    const resume = db.prepare('SELECT * FROM candidate_resumes WHERE candidate_profile_id = ? AND is_active = 1').get(profile.id) as any;
    if (!resume) {
      return res.status(404).json({ success: false, message: 'No active resume to re-parse.' });
    }

    const processResult = await processResumeAndScreen(resume.id, user.id, profile.id, resume.stored_filename);

    return res.json({
      success: processResult.status === 'Processed',
      message: processResult.status === 'Processed' ? 'Resume re-parsed successfully.' : processResult.errorMessage,
      status: processResult.status,
      parsed: processResult.parsed,
      screening: processResult.screening,
      errorMessage: processResult.errorMessage,
    });
  } catch (err: any) {
    console.error('Reparse error:', err);
    return res.status(500).json({ success: false, message: 'Failed to re-parse resume.', error: err.message });
  }
});

/**
 * GET /api/candidate/resumes/:id/parsed
 * Retrieves parsed data for a specific historical resume version.
 */
resumeProcessingRouter.get('/candidate/resumes/:id/parsed', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Only candidates can view their resume data.' });
    }

    const { id } = req.params;
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(user.id) as any;
    const resume = db.prepare('SELECT * FROM candidate_resumes WHERE id = ? AND candidate_profile_id = ?').get(id, profile.id) as any;

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume record not found.' });
    }

    let parsedRecord = db.prepare('SELECT * FROM resume_parsed_data WHERE resume_id = ?').get(resume.id) as any;
    if (!parsedRecord || parsedRecord.status !== 'Processed') {
      await processResumeAndScreen(resume.id, user.id, profile.id, resume.stored_filename);
      parsedRecord = db.prepare('SELECT * FROM resume_parsed_data WHERE resume_id = ?').get(resume.id) as any;
    }

    const screeningRecord = db.prepare('SELECT * FROM resume_screenings WHERE resume_id = ?').get(resume.id) as any;

    return res.json({
      success: true,
      resumeId: resume.id,
      filename: resume.original_filename,
      status: parsedRecord?.status || 'Not Processed',
      parsed: parsedRecord ? formatParsedRecord(parsedRecord) : null,
      screening: screeningRecord ? formatScreeningRecord(screeningRecord) : null,
    });
  } catch (err: any) {
    console.error('Fetch specific parsed resume error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch parsed resume.', error: err.message });
  }
});

// ============================================================
// RECRUITER ENDPOINTS
// ============================================================

/**
 * GET /api/recruiter/applications/:id/parsed-resume
 * Recruiter accesses the structured parsed resume of an applicant.
 */
resumeProcessingRouter.get('/recruiter/applications/:id/parsed-resume', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can view applicant parsed resumes.' });
    }

    const { id } = req.params;

    // Verify application and job ownership
    const app = db.prepare(`
      SELECT a.id, a.candidate_id, a.candidate_profile_id, a.resume_id, a.job_id,
             j.recruiter_id, r.stored_filename, r.original_filename
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN candidate_resumes r ON a.resume_id = r.id
      WHERE a.id = ?
    `).get(id) as any;

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application or submitted resume not found.' });
    }

    if (app.recruiter_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own the job for this applicant.' });
    }

    let parsedRecord = db.prepare('SELECT * FROM resume_parsed_data WHERE resume_id = ?').get(app.resume_id) as any;

    if (!parsedRecord || parsedRecord.status !== 'Processed') {
      // Auto parse if needed
      await processResumeAndScreen(app.resume_id, app.candidate_id, app.candidate_profile_id, app.stored_filename, app.id, app.job_id);
      parsedRecord = db.prepare('SELECT * FROM resume_parsed_data WHERE resume_id = ?').get(app.resume_id) as any;
    }

    return res.json({
      success: true,
      applicationId: app.id,
      resumeId: app.resume_id,
      filename: app.original_filename,
      status: parsedRecord?.status || 'Failed',
      errorMessage: parsedRecord?.error_message || '',
      parsed: parsedRecord ? formatParsedRecord(parsedRecord) : null,
    });
  } catch (err: any) {
    console.error('Fetch recruiter parsed resume error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load parsed resume data.', error: err.message });
  }
});

/**
 * GET /api/recruiter/applications/:id/screening
 * Recruiter accesses initial AI screening analysis for an applicant.
 */
resumeProcessingRouter.get('/recruiter/applications/:id/screening', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can view AI resume screening results.' });
    }

    const { id } = req.params;

    // Verify application and job ownership
    const app = db.prepare(`
      SELECT a.id, a.candidate_id, a.candidate_profile_id, a.resume_id, a.job_id,
             j.recruiter_id, r.stored_filename, r.original_filename
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN candidate_resumes r ON a.resume_id = r.id
      WHERE a.id = ?
    `).get(id) as any;

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (app.recruiter_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own the job for this applicant.' });
    }

    let screeningRecord = db.prepare(`
      SELECT * FROM resume_screenings 
      WHERE application_id = ? OR (resume_id = ? AND application_id IS NULL)
      ORDER BY application_id DESC, created_at DESC
    `).get(app.id, app.resume_id) as any;

    if (!screeningRecord || screeningRecord.status !== 'Screened') {
      const processResult = await processResumeAndScreen(app.resume_id, app.candidate_id, app.candidate_profile_id, app.stored_filename, app.id, app.job_id);
      if (processResult.status === 'Failed') {
        return res.json({
          success: true,
          status: 'Failed',
          errorMessage: processResult.errorMessage,
          screening: null,
        });
      }
      screeningRecord = db.prepare(`
        SELECT * FROM resume_screenings 
        WHERE application_id = ? OR (resume_id = ? AND application_id IS NULL)
        ORDER BY application_id DESC, created_at DESC
      `).get(app.id, app.resume_id) as any;
    }

    return res.json({
      success: true,
      applicationId: app.id,
      resumeId: app.resume_id,
      status: screeningRecord?.status || 'Screened',
      screening: screeningRecord ? formatScreeningRecord(screeningRecord) : null,
    });
  } catch (err: any) {
    console.error('Fetch recruiter screening error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load screening analysis.', error: err.message });
  }
});

/**
 * POST /api/recruiter/applications/:id/screening/retry
 * Recruiter retries or refreshes screening for an application.
 */
resumeProcessingRouter.post('/api/recruiter/applications/:id/screening/retry', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const app = db.prepare(`
      SELECT a.id, a.candidate_id, a.candidate_profile_id, a.resume_id, a.job_id,
             j.recruiter_id, r.stored_filename
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN candidate_resumes r ON a.resume_id = r.id
      WHERE a.id = ?
    `).get(id) as any;

    if (!app || app.recruiter_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const processResult = await processResumeAndScreen(app.resume_id, app.candidate_id, app.candidate_profile_id, app.stored_filename, app.id, app.job_id);

    return res.json({
      success: processResult.status === 'Processed',
      status: processResult.status,
      screening: processResult.screening,
      errorMessage: processResult.errorMessage,
    });
  } catch (err: any) {
    console.error('Retry screening error:', err);
    return res.status(500).json({ success: false, message: 'Screening retry failed.', error: err.message });
  }
});

// ============================================================
// FORMATTING HELPERS
// ============================================================

function safeJsonParse<T>(jsonStr: string | null | undefined, fallback: T): T {
  if (!jsonStr) return fallback;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return fallback;
  }
}

function formatParsedRecord(r: any) {
  if (!r) return null;
  return {
    id: r.id,
    resumeId: r.resume_id,
    status: r.status,
    errorMessage: r.error_message,
    personal: {
      candidateName: r.candidate_name || '',
      email: r.email || '',
      phone: r.phone || '',
      location: r.location || '',
      headline: r.headline || '',
    },
    summary: r.summary || '',
    skills: safeJsonParse<string[]>(r.skills_json, []),
    education: safeJsonParse<any[]>(r.education_json, []),
    experience: safeJsonParse<any[]>(r.experience_json, []),
    projects: safeJsonParse<any[]>(r.projects_json, []),
    certifications: safeJsonParse<any[]>(r.certifications_json, []),
    languages: safeJsonParse<any[]>(r.languages_json, []),
    achievements: safeJsonParse<string[]>(r.achievements_json, []),
    confidence: safeJsonParse<Record<string, string>>(r.confidence_json, {}),
    sectionsDetectedCount: r.sections_detected_count || 0,
    parsedAt: r.completed_at || r.created_at,
  };
}

function formatScreeningRecord(s: any) {
  if (!s) return null;
  return {
    id: s.id,
    resumeId: s.resume_id,
    applicationId: s.application_id,
    status: s.status,
    completenessScore: s.completeness_score,
    sectionsPresent: safeJsonParse<string[]>(s.sections_present_json, []),
    sectionsMissing: safeJsonParse<string[]>(s.sections_missing_json, []),
    skillsDetectedCount: s.skills_detected_count,
    experienceYearsDetected: s.experience_years_detected,
    educationLevelDetected: s.education_level_detected || 'None Detected',
    observations: safeJsonParse<string[]>(s.screening_observations_json, []),
    screeningFlags: safeJsonParse<any[]>(s.screening_flags_json, []),
    screenedAt: s.completed_at || s.created_at,
  };
}

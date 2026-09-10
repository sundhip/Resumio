import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { InterviewService } from '../services/interviewService';

export const interviewsRouter = Router();

/**
 * POST /api/interviews
 * Recruiter schedules an interview for an applicant
 */
interviewsRouter.post('/interviews', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can schedule interviews.' });
    }

    const { applicationId, title, interviewType, scheduledAt, durationMinutes, location, meetingUrl, description } = req.body;

    const result = InterviewService.scheduleInterview(user.id, {
      applicationId,
      title,
      interviewType,
      scheduledAt,
      durationMinutes,
      location,
      meetingUrl,
      description,
    });

    return res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully!',
      ...result,
    });
  } catch (err: any) {
    const isValidationError = err.message?.includes('required') ||
      err.message?.includes('Invalid') ||
      err.message?.includes('positive');
    const isForbidden = err.message?.includes('Forbidden');
    const status = isForbidden ? 403 : isValidationError ? 400 : 500;

    return res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/interviews/:id
 * Candidate or Recruiter views interview details
 */
interviewsRouter.get('/interviews/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const result = InterviewService.getInterviewById(user.id, user.role, id);

    return res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    const isNotFound = err.message?.includes('not found');
    const isForbidden = err.message?.includes('Forbidden');
    const status = isNotFound ? 404 : isForbidden ? 403 : 500;

    return res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/interviews/:id/reschedule
 * Recruiter reschedules an interview
 */
interviewsRouter.patch('/interviews/:id/reschedule', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can reschedule interviews.' });
    }

    const { id } = req.params;
    const { scheduledAt, durationMinutes, location, meetingUrl, reason } = req.body;

    const result = InterviewService.rescheduleInterview(user.id, id, {
      scheduledAt,
      durationMinutes,
      location,
      meetingUrl,
      reason,
    });

    return res.json({
      success: true,
      message: 'Interview rescheduled successfully.',
      ...result,
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes('Forbidden');
    const isNotFound = err.message?.includes('not found');
    const status = isNotFound ? 404 : isForbidden ? 403 : 400;

    return res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/interviews/:id/cancel
 * Recruiter cancels an interview
 */
interviewsRouter.patch('/interviews/:id/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can cancel interviews.' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const result = InterviewService.cancelInterview(user.id, id, reason);

    return res.json({
      success: true,
      message: 'Interview cancelled successfully.',
      ...result,
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes('Forbidden');
    const isNotFound = err.message?.includes('not found');
    const status = isNotFound ? 404 : isForbidden ? 403 : 400;

    return res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/interviews/:id/status
 * Recruiter marks interview status (Completed or No Show)
 */
interviewsRouter.patch('/interviews/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can update interview status.' });
    }

    const { id } = req.params;
    const { status, note } = req.body;

    const result = InterviewService.updateInterviewStatus(user.id, id, status, note);

    return res.json({
      success: true,
      message: `Interview status updated to ${status}.`,
      ...result,
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes('Forbidden');
    const isNotFound = err.message?.includes('not found');
    const status = isNotFound ? 404 : isForbidden ? 403 : 400;

    return res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/candidate/interviews
 * Candidate retrieves upcoming and past interviews
 */
interviewsRouter.get('/candidate/interviews', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Only candidates can access candidate interviews.' });
    }

    const result = InterviewService.getCandidateInterviews(user.id);

    return res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch interviews.', error: err.message });
  }
});

/**
 * GET /api/recruiter/interviews
 * Recruiter retrieves all scheduled interviews across owned jobs
 */
interviewsRouter.get('/recruiter/interviews', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can access recruiter interviews.' });
    }

    const { status, jobId, search } = req.query as { status?: string; jobId?: string; search?: string };

    const result = InterviewService.getRecruiterInterviews(user.id, { status, jobId, search });

    return res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch recruiter interviews.', error: err.message });
  }
});

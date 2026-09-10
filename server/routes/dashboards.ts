import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { DashboardService } from '../services/dashboardService';

export const dashboardsRouter = Router();

/**
 * GET /api/candidate/dashboard
 * Consolidated Candidate Home Dashboard
 */
dashboardsRouter.get('/candidate/dashboard', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Only candidates can access candidate dashboard.' });
    }

    const data = DashboardService.getCandidateDashboard(user.id);

    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('Candidate dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load candidate dashboard.', error: err.message });
  }
});

/**
 * GET /api/recruiter/dashboard
 * Consolidated Recruiter Home Dashboard
 */
dashboardsRouter.get('/recruiter/dashboard', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can access recruiter dashboard.' });
    }

    const data = DashboardService.getRecruiterDashboard(user.id);

    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('Recruiter dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load recruiter dashboard.', error: err.message });
  }
});

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { RecruitmentAnalyticsService } from '../services/analyticsService';

export const analyticsRouter = Router();

/**
 * GET /api/recruiter/analytics
 * Recruiter recruitment analytics and statistics
 */
analyticsRouter.get('/recruiter/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can access recruitment analytics.' });
    }

    const { dateRange, jobId } = req.query as { dateRange?: '7d' | '30d' | '90d' | 'all'; jobId?: string };

    const data = RecruitmentAnalyticsService.getRecruiterAnalytics(user.id, { dateRange, jobId });

    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('Recruitment analytics error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate recruitment analytics.', error: err.message });
  }
});

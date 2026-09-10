import { Router, Response } from 'express';
import { db } from '../database/db';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// 1. Get Real Admin Statistics (Real Database Counts)
router.get('/stats', authenticateToken, requireRole(['admin']), (_req, res: Response): void => {
  try {
    const totalUsersRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const candidatesRow = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'candidate'").get() as { count: number };
    const recruitersRow = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'recruiter'").get() as { count: number };
    const activeUsersRow = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get() as { count: number };

    res.json({
      success: true,
      stats: {
        totalUsers: totalUsersRow.count,
        candidatesCount: candidatesRow.count,
        recruitersCount: recruitersRow.count,
        activeUsersCount: activeUsersRow.count,
      },
    });
  } catch (err: any) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Unable to retrieve admin statistics.' });
  }
});

// 2. Get Real User List
router.get('/users', authenticateToken, requireRole(['admin']), (_req, res: Response): void => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id, 
        u.email, 
        u.role, 
        u.status, 
        u.created_at,
        cp.full_name as candidate_name,
        rp.full_name as recruiter_name,
        rp.company_name
      FROM users u
      LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
      LEFT JOIN recruiter_profiles rp ON u.id = rp.user_id
      ORDER BY u.created_at DESC
    `).all();

    const formattedUsers = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.created_at,
      name: u.role === 'candidate' ? u.candidate_name : u.role === 'recruiter' ? u.recruiter_name : 'Platform Admin',
      company: u.company_name || null,
    }));

    res.json({
      success: true,
      users: formattedUsers,
    });
  } catch (err: any) {
    console.error('Admin users fetch error:', err);
    res.status(500).json({ success: false, message: 'Unable to retrieve users list.' });
  }
});

export default router;

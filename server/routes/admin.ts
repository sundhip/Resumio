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
    const totalJobsRow = db.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number };
    const totalApplicationsRow = db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number };
    const totalInterviewsRow = db.prepare('SELECT COUNT(*) as count FROM interviews').get() as { count: number };

    res.json({
      success: true,
      stats: {
        totalUsers: totalUsersRow.count,
        candidatesCount: candidatesRow.count,
        recruitersCount: recruitersRow.count,
        activeUsersCount: activeUsersRow.count,
        jobsCount: totalJobsRow.count,
        applicationsCount: totalApplicationsRow.count,
        interviewsCount: totalInterviewsRow.count,
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
      status: u.status || 'active',
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

// 3. Toggle User Status (Active / Suspended)
router.patch('/users/:id/status', authenticateToken, requireRole(['admin']), (req: any, res: Response): void => {
  try {
    const userId = req.params.id;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status specified.' });
      return;
    }

    const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (user.role === 'admin') {
      res.status(400).json({ success: false, message: 'Root Admin accounts cannot be suspended.' });
      return;
    }

    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, userId);

    res.json({
      success: true,
      message: `User status updated to ${status}.`,
      userId,
      status,
    });
  } catch (err: any) {
    console.error('Admin update user status error:', err);
    res.status(500).json({ success: false, message: 'Unable to update user status.' });
  }
});

// 4. Get Real All Jobs List across companies
router.get('/jobs', authenticateToken, requireRole(['admin']), (_req, res: Response): void => {
  try {
    const jobs = db.prepare(`
      SELECT 
        j.id,
        j.title,
        j.location,
        j.work_mode,
        j.employment_type,
        j.status,
        j.created_at,
        rp.company_name,
        rp.full_name as recruiter_name,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicants_count
      FROM jobs j
      LEFT JOIN recruiter_profiles rp ON j.recruiter_id = rp.user_id
      ORDER BY j.created_at DESC
    `).all();

    const formattedJobs = jobs.map((j: any) => ({
      id: j.id,
      title: j.title,
      company: j.company_name || 'Organization',
      recruiterName: j.recruiter_name || 'Recruiter',
      location: j.location || 'Remote',
      workMode: j.work_mode || 'Hybrid',
      employmentType: j.employment_type || 'Full-time',
      status: j.status || 'Active',
      applicantsCount: j.applicants_count || 0,
      createdAt: j.created_at,
    }));

    res.json({
      success: true,
      jobs: formattedJobs,
    });
  } catch (err: any) {
    console.error('Admin jobs fetch error:', err);
    res.status(500).json({ success: false, message: 'Unable to retrieve jobs list.' });
  }
});

// 5. Toggle Job Status (Active / Closed)
router.patch('/jobs/:id/status', authenticateToken, requireRole(['admin']), (req: any, res: Response): void => {
  try {
    const jobId = req.params.id;
    const { status } = req.body;

    if (!['Active', 'Closed'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid job status specified.' });
      return;
    }

    const job = db.prepare('SELECT id FROM jobs WHERE id = ?').get(jobId);
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found.' });
      return;
    }

    db.prepare('UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, jobId);

    res.json({
      success: true,
      message: `Job status updated to ${status}.`,
      jobId,
      status,
    });
  } catch (err: any) {
    console.error('Admin update job status error:', err);
    res.status(500).json({ success: false, message: 'Unable to update job status.' });
  }
});

// 6. Get Real All Applications List across candidates and jobs
router.get('/applications', authenticateToken, requireRole(['admin']), (_req, res: Response): void => {
  try {
    const apps = db.prepare(`
      SELECT 
        a.id,
        a.status,
        a.created_at,
        cp.full_name as candidate_name,
        u.email as candidate_email,
        j.title as job_title,
        rp.company_name,
        m.overall_score
      FROM applications a
      LEFT JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
      LEFT JOIN users u ON cp.user_id = u.id
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN recruiter_profiles rp ON j.recruiter_id = rp.user_id
      LEFT JOIN match_scores m ON a.candidate_profile_id = m.candidate_profile_id AND a.job_id = m.job_id
      ORDER BY a.created_at DESC
    `).all();

    const formattedApps = apps.map((a: any) => ({
      id: a.id,
      candidateName: a.candidate_name || a.candidate_email || 'Candidate',
      candidateEmail: a.candidate_email || '',
      jobTitle: a.job_title || 'Position',
      company: a.company_name || 'Company',
      status: a.status || 'Applied',
      matchScore: a.overall_score != null ? Math.round(a.overall_score) : 75,
      createdAt: a.created_at,
    }));

    res.json({
      success: true,
      applications: formattedApps,
    });
  } catch (err: any) {
    console.error('Admin applications fetch error:', err);
    res.status(500).json({ success: false, message: 'Unable to retrieve applications list.' });
  }
});

// 7. Get System Record Health
router.get('/system', authenticateToken, requireRole(['admin']), (_req, res: Response): void => {
  try {
    const usersCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
    const candidateProfilesCount = (db.prepare('SELECT COUNT(*) as count FROM candidate_profiles').get() as any).count;
    const recruiterProfilesCount = (db.prepare('SELECT COUNT(*) as count FROM recruiter_profiles').get() as any).count;
    const jobsCount = (db.prepare('SELECT COUNT(*) as count FROM jobs').get() as any).count;
    const applicationsCount = (db.prepare('SELECT COUNT(*) as count FROM applications').get() as any).count;
    const interviewsCount = (db.prepare('SELECT COUNT(*) as count FROM interviews').get() as any).count;
    const matchScoresCount = (db.prepare('SELECT COUNT(*) as count FROM match_scores').get() as any).count;

    res.json({
      success: true,
      health: {
        status: 'healthy',
        databaseEngine: 'SQLite (better-sqlite3)',
        tables: {
          users: usersCount,
          candidate_profiles: candidateProfilesCount,
          recruiter_profiles: recruiterProfilesCount,
          jobs: jobsCount,
          applications: applicationsCount,
          interviews: interviewsCount,
          match_scores: matchScoresCount,
        },
      },
    });
  } catch (err: any) {
    console.error('Admin system health error:', err);
    res.status(500).json({ success: false, message: 'Unable to retrieve system health.' });
  }
});

export default router;

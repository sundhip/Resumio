import { db, initDatabase } from '../database/db.js';
import bcrypt from 'bcryptjs';

async function testSeededData() {
  await initDatabase();
  console.log('🔍 Testing seeded database accounts and workflow metrics...');

  // 1. Check Accounts
  const candUser = db.prepare("SELECT * FROM users WHERE email = 'candidate@resumio.demo'").get() as any;
  const recUser = db.prepare("SELECT * FROM users WHERE email = 'recruiter@resumio.demo'").get() as any;
  const adminUser = db.prepare("SELECT * FROM users WHERE email = 'admin@resumio.demo'").get() as any;

  console.log('1. Candidate Account:', candUser ? `Found (${candUser.id})` : 'NOT FOUND');
  console.log('   Password Match:', candUser ? bcrypt.compareSync('Candidate@123', candUser.password_hash) : false);

  console.log('2. Recruiter Account:', recUser ? `Found (${recUser.id})` : 'NOT FOUND');
  console.log('   Password Match:', recUser ? bcrypt.compareSync('Recruiter@123', recUser.password_hash) : false);

  console.log('3. Admin Account:', adminUser ? `Found (${adminUser.id})` : 'NOT FOUND');
  console.log('   Password Match:', adminUser ? bcrypt.compareSync('Admin@123', adminUser.password_hash) : false);

  // 2. Metric Counts
  const companiesCount = (db.prepare('SELECT COUNT(DISTINCT company_name) as c FROM recruiter_profiles').get() as any).c;
  const jobsCount = (db.prepare('SELECT COUNT(*) as c FROM jobs').get() as any).c;
  const candCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'candidate'").get() as any).c;
  const appCount = (db.prepare('SELECT COUNT(*) as c FROM applications').get() as any).c;
  const matchCount = (db.prepare('SELECT COUNT(*) as c FROM resume_job_matches').get() as any).c;
  const intCount = (db.prepare('SELECT COUNT(*) as c FROM interviews').get() as any).c;
  const notifCount = (db.prepare('SELECT COUNT(*) as c FROM notifications').get() as any).c;

  console.log('--------------------------------------------------');
  console.log('📊 DATABASE SEEDED STATS:');
  console.log('  Companies:', companiesCount);
  console.log('  Jobs:', jobsCount);
  console.log('  Candidates:', candCount);
  console.log('  Applications:', appCount);
  console.log('  AI Matches Calculated:', matchCount);
  console.log('  Interviews Scheduled:', intCount);
  console.log('  Notifications Created:', notifCount);
  console.log('--------------------------------------------------');

  // 3. Test Rahul Sharma Applications
  if (candUser) {
    const rahulApps = db.prepare(`
      SELECT a.id, a.status, j.title, j.company_name, m.match_score 
      FROM applications a 
      JOIN jobs j ON a.job_id = j.id 
      LEFT JOIN resume_job_matches m ON a.id = m.application_id 
      WHERE a.candidate_id = ?
    `).all(candUser.id) as any[];

    console.log('👤 Rahul Sharma Applications:');
    for (const app of rahulApps) {
      console.log(`  • [${app.status}] ${app.title} @ ${app.company_name} (Match Score: ${app.match_score || 0}%)`);
    }
  }

  // 4. Test Recruiter Python Developer Applicants
  if (recUser) {
    const pythonJob = db.prepare("SELECT id FROM jobs WHERE title = 'Python Developer' AND recruiter_id = ?").get(recUser.id) as any;
    if (pythonJob) {
      const pythonApps = db.prepare(`
        SELECT cp.full_name, a.status, m.match_score
        FROM applications a
        JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
        LEFT JOIN resume_job_matches m ON a.id = m.application_id
        WHERE a.job_id = ?
        ORDER BY m.match_score DESC
      `).all(pythonJob.id) as any[];

      console.log('🏢 Nexora Tech - Python Developer Applicants (Ranked by AI Match):');
      for (const app of pythonApps) {
        console.log(`  • ${app.full_name} -> Status: ${app.status} (AI Match: ${app.match_score || 0}%)`);
      }
    }
  }
}

testSeededData();

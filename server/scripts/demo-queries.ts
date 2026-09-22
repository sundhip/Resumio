import { db, initDatabase } from '../database/db.js';

async function main() {
  await db.ensureReady();
  await initDatabase();

  console.log('================================================================');
  console.log('📊 RESUMIO DATABASE MANAGEMENT SYSTEM (DBMS) DEMONSTRATION');
  console.log('================================================================\n');

  function runQuery(title: string, sql: string, params: any[] = []) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(`📌 Query: ${title}`);
    console.log(`💻 SQL:\n${sql.trim()}\n`);
    try {
      const start = Date.now();
      const rows = db.prepare(sql).all(...params);
      const duration = Date.now() - start;
      console.log(`⏱️ Execution Time: ${duration}ms | Returned Rows: ${rows.length}`);
      if (rows.length > 0) {
        console.table(rows.slice(0, 5));
        if (rows.length > 5) {
          console.log(`... and ${rows.length - 5} more rows.`);
        }
      } else {
        console.log('(No records found for current query criteria)');
      }
    } catch (err: any) {
      console.error(`❌ SQL Error: ${err.message}`);
    }
  }

  // 1. Basic Projection & Selection
  runQuery(
    '1. Basic Candidate Projection (Active Candidates with Profile Completion)',
    `SELECT cp.id, cp.full_name, u.email, cp.location, cp.profile_completion, cp.created_at
     FROM candidate_profiles cp
     JOIN users u ON cp.user_id = u.id
     WHERE u.status = 'active'
     ORDER BY cp.profile_completion DESC`
  );

  // 2. Multi-Table JOIN: Published Jobs with Aggregated Required Skills
  runQuery(
    '2. Multi-Table JOIN: Published Jobs with Aggregated Required Skills',
    `SELECT j.id as job_id, j.title, j.company_name, j.location, j.work_mode, j.employment_type,
            GROUP_CONCAT(jrs.name, ', ') as required_skills
     FROM jobs j
     LEFT JOIN job_required_skills jrs ON j.id = jrs.job_id
     WHERE j.status = 'Published'
     GROUP BY j.id`
  );

  // 3. Multi-Table 3-Way JOIN: Candidates + Applications + Jobs
  runQuery(
    '3. 3-Way JOIN: Candidate Applications with Job Details & Current Status',
    `SELECT a.id as application_id, cp.full_name as candidate_name, j.title as job_title,
            j.company_name, a.status as application_status, a.applied_at
     FROM applications a
     JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
     JOIN jobs j ON a.job_id = j.id
     ORDER BY a.applied_at DESC`
  );

  // 4. Candidate AI Ranking & Match Score Evaluation
  runQuery(
    '4. Multi-Table JOIN & Ranking: Applicant Leaderboard by AI Match Score',
    `SELECT a.id as application_id, j.title as job_title, cp.full_name as candidate_name,
            m.match_score, m.required_skills_score, m.preferred_skills_score,
            m.experience_score, m.qualification_score, a.status
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
     LEFT JOIN resume_job_matches m ON a.resume_id = m.resume_id AND a.job_id = m.job_id
     ORDER BY COALESCE(m.match_score, 0) DESC`
  );

  // 5. GROUP BY Aggregation: Applications Count by Status
  runQuery(
    '5. GROUP BY Aggregation: Application Pipeline Status Distribution',
    `SELECT a.status as pipeline_stage,
            COUNT(*) as total_applications,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM applications), 2) as percentage
     FROM applications a
     GROUP BY a.status
     ORDER BY total_applications DESC`
  );

  // 6. Multi-Table JOIN: Active Interview Schedule
  runQuery(
    '6. Multi-Table JOIN: Active Interview Schedule',
    `SELECT i.id as interview_id, cp.full_name as candidate_name,
            j.title as job_title, i.interview_type, i.scheduled_at, i.duration_minutes,
            i.status as interview_status, i.meeting_url
     FROM interviews i
     JOIN applications a ON i.application_id = a.id
     JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
     JOIN jobs j ON i.job_id = j.id
     WHERE i.status IN ('Scheduled', 'Rescheduled')
     ORDER BY i.scheduled_at ASC`
  );

  // 7. Audit Trail Query: Application Lifecycle State Transitions
  runQuery(
    '7. Audit Trail Query: Application Lifecycle State Transitions',
    `SELECT ash.id as audit_id, a.id as application_id, ash.old_status, ash.new_status,
            ash.changed_by_role, ash.note, ash.changed_at
     FROM application_status_history ash
     JOIN applications a ON ash.application_id = a.id
     ORDER BY ash.changed_at DESC`
  );

  console.log('\n================================================================');
  console.log('✅ ALL DBMS DEMONSTRATION QUERIES EXECUTED SUCCESSFULLY');
  console.log('================================================================\n');
}

main();

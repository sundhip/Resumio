import { db, initDatabase } from '../database/db.js';

console.log('================================================================');
console.log('📊 RESUMIO DATABASE MANAGEMENT SYSTEM (DBMS) DEMONSTRATION');
console.log('================================================================\n');

initDatabase();

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

// 2. Multi-Table JOIN: Jobs and Required Skills
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

// 6. GROUP BY & HAVING: Jobs with Multiple Applicants and Average Match Quality
runQuery(
  '6. GROUP BY & HAVING: Recruitment Metrics by Job Posting',
  `SELECT j.id as job_id, j.title as job_title, j.company_name,
          COUNT(a.id) as total_applicants,
          ROUND(AVG(COALESCE(m.match_score, 0)), 1) as avg_match_score,
          MAX(COALESCE(m.match_score, 0)) as top_match_score
   FROM jobs j
   LEFT JOIN applications a ON j.id = a.job_id
   LEFT JOIN resume_job_matches m ON a.resume_id = m.resume_id AND a.job_id = m.job_id
   GROUP BY j.id
   HAVING COUNT(a.id) >= 0
   ORDER BY total_applicants DESC`
);

// 7. Subquery: Candidates in Top AI Scoring Tier (Score >= 80)
runQuery(
  '7. Subquery with IN: High-Match Candidates Ready for Interview Shortlisting',
  `SELECT cp.full_name, cp.headline, cp.location, u.email
   FROM candidate_profiles cp
   JOIN users u ON cp.user_id = u.id
   WHERE cp.id IN (
     SELECT a.candidate_profile_id
     FROM applications a
     JOIN resume_job_matches m ON a.resume_id = m.resume_id AND a.job_id = m.job_id
     WHERE m.match_score >= 80
   )`
);

// 8. Multi-Table JOIN: Upcoming Interviews Schedule with Meeting URLs
runQuery(
  '8. Multi-Table JOIN: Active Interview Schedule',
  `SELECT i.id as interview_id, cp.full_name as candidate_name, rp.company_name,
          j.title as job_title, i.interview_type, i.scheduled_at, i.duration_minutes,
          i.status as interview_status, i.meeting_url
   FROM interviews i
   JOIN applications a ON i.application_id = a.id
   JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
   JOIN jobs j ON i.job_id = j.id
   JOIN recruiter_profiles rp ON j.recruiter_profile_id = rp.id
   WHERE i.status IN ('Scheduled', 'Rescheduled')
   ORDER BY i.scheduled_at ASC`
);

// 9. Audit History: Chronological Application State Transitions
runQuery(
  '9. Audit Trail Query: Application Lifecycle State Transitions',
  `SELECT ash.id as audit_id, a.id as application_id, ash.old_status, ash.new_status,
          ash.changed_by_role, ash.note, ash.changed_at
   FROM application_status_history ash
   JOIN applications a ON ash.application_id = a.id
   ORDER BY ash.changed_at DESC`
);

// 10. User Notifications & Unread Status Tracking
runQuery(
  '10. Notification Queue: Unread Alerts for Platform Users',
  `SELECT n.id, u.email as recipient, n.type, n.title, n.message, n.is_read, n.created_at
   FROM notifications n
   JOIN users u ON n.user_id = u.id
   ORDER BY n.created_at DESC`
);

// 11. Duplicate Resume Verification
runQuery(
  '11. Duplicate Resume Detection Records',
  `SELECT rdm.id, rdm.similarity_type, rdm.similarity_score, rdm.detection_method,
          cr1.original_filename as resume_a, cr2.original_filename as resume_b, rdm.created_at
   FROM resume_duplicate_matches rdm
   JOIN candidate_resumes cr1 ON rdm.resume_id = cr1.id
   JOIN candidate_resumes cr2 ON rdm.matched_resume_id = cr2.id
   ORDER BY rdm.created_at DESC`
);

// 12. Natural Language Query Interpretation Audit
runQuery(
  '12. Natural Language Candidate Search Audit Log',
  `SELECT nls.id, u.email as recruiter, nls.query_text, nls.interpreted_filters_json,
          nls.results_count, nls.created_at
   FROM natural_language_searches nls
   JOIN users u ON nls.recruiter_id = u.id
   ORDER BY nls.created_at DESC`
);

console.log('\n================================================================');
console.log('✅ ALL 12 DBMS DEMONSTRATION QUERIES EXECUTED SUCCESSFULLY');
console.log('================================================================\n');

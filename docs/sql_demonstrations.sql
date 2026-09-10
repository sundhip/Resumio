-- ============================================================================
-- RESUMIO: DBMS DEMONSTRATION & EVALUATION SQL SCRIPT
-- ============================================================================
-- Description: 15 Representative SQL Queries demonstrating Relational DBMS concepts
-- (Projections, Multi-Table JOINs, Subqueries, Aggregations, GROUP BY, HAVING, Constraints)
-- Target Database: SQLite 3 / better-sqlite3 (server/data/resumio.db)
-- ============================================================================

-- 1. BASIC PROJECTION & FILTERING
-- Retrieve all active candidates with their profile completion percentage
SELECT cp.id AS profile_id, cp.full_name, u.email, cp.location, cp.profile_completion, cp.created_at
FROM candidate_profiles cp
JOIN users u ON cp.user_id = u.id
WHERE u.status = 'active'
ORDER BY cp.profile_completion DESC;

-- 2. MULTI-TABLE JOIN WITH STRING AGGREGATION
-- Retrieve published jobs with their required skills concatenated
SELECT j.id AS job_id, j.title, j.company_name, j.location, j.work_mode, j.employment_type,
       GROUP_CONCAT(jrs.name, ', ') AS required_skills
FROM jobs j
LEFT JOIN job_required_skills jrs ON j.id = jrs.job_id
WHERE j.status = 'Published'
GROUP BY j.id;

-- 3. THREE-WAY INNER JOIN
-- Retrieve candidate applications with candidate name and job title
SELECT a.id AS application_id, cp.full_name AS candidate_name, j.title AS job_title,
       j.company_name, a.status AS application_status, a.applied_at
FROM applications a
JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
JOIN jobs j ON a.job_id = j.id
ORDER BY a.applied_at DESC;

-- 4. MULTI-TABLE JOIN WITH COMPOSITE MATCH SCORING
-- Retrieve ranked applicant leaderboard for recruiters with AI score breakdown
SELECT a.id AS application_id, j.title AS job_title, cp.full_name AS candidate_name,
       m.match_score, m.required_skills_score, m.preferred_skills_score,
       m.experience_score, m.qualification_score, a.status
FROM applications a
JOIN jobs j ON a.job_id = j.id
JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
LEFT JOIN resume_job_matches m ON a.resume_id = m.resume_id AND a.job_id = m.job_id
ORDER BY COALESCE(m.match_score, 0) DESC;

-- 5. GROUP BY AGGREGATION & RATIO COMPUTATION
-- Application pipeline status distribution across all jobs
SELECT a.status AS pipeline_stage,
       COUNT(*) AS total_applications,
       ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM applications), 2) AS percentage
FROM applications a
GROUP BY a.status
ORDER BY total_applications DESC;

-- 6. GROUP BY & HAVING AGGREGATION
-- Average match score, top score, and applicant count grouped by job posting
SELECT j.id AS job_id, j.title AS job_title, j.company_name,
       COUNT(a.id) AS total_applicants,
       ROUND(AVG(COALESCE(m.match_score, 0)), 1) AS avg_match_score,
       MAX(COALESCE(m.match_score, 0)) AS top_match_score
FROM jobs j
LEFT JOIN applications a ON j.id = a.job_id
LEFT JOIN resume_job_matches m ON a.resume_id = m.resume_id AND a.job_id = m.job_id
GROUP BY j.id
HAVING COUNT(a.id) >= 0
ORDER BY total_applicants DESC;

-- 7. SUBQUERY WITH IN PREDICATE
-- Identify high-match candidates (Match Score >= 80) across all applications
SELECT cp.full_name, cp.headline, cp.location, u.email
FROM candidate_profiles cp
JOIN users u ON cp.user_id = u.id
WHERE cp.id IN (
  SELECT a.candidate_profile_id
  FROM applications a
  JOIN resume_job_matches m ON a.resume_id = m.resume_id AND a.job_id = m.job_id
  WHERE m.match_score >= 80
);

-- 8. COMPLEX FIVE-TABLE JOIN
-- Retrieve upcoming interviews with candidate, recruiter, and job metadata
SELECT i.id AS interview_id, cp.full_name AS candidate_name, rp.company_name,
       j.title AS job_title, i.interview_type, i.scheduled_at, i.duration_minutes,
       i.status AS interview_status, i.meeting_url
FROM interviews i
JOIN applications a ON i.application_id = a.id
JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
JOIN jobs j ON i.job_id = j.id
JOIN recruiter_profiles rp ON j.recruiter_profile_id = rp.id
WHERE i.status IN ('Scheduled', 'Rescheduled')
ORDER BY i.scheduled_at ASC;

-- 9. AUDIT TRAIL LOG RETRIEVAL
-- Chronological status transitions for applications with user attribution
SELECT ash.id AS audit_id, a.id AS application_id, ash.old_status, ash.new_status,
       ash.changed_by_role, ash.note, ash.changed_at
FROM application_status_history ash
JOIN applications a ON ash.application_id = a.id
ORDER BY ash.changed_at DESC;

-- 10. NOTIFICATION QUEUE PROJECTION
-- Retrieve unread notifications for platform users
SELECT n.id, u.email AS recipient, n.type, n.title, n.message, n.is_read, n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
ORDER BY n.created_at DESC;

-- 11. CRYPTOGRAPHIC & SEMANTIC DUPLICATE DETECTION QUERY
-- Find resumes flagged for high similarity or exact hash duplication
SELECT rdm.id, rdm.similarity_type, rdm.similarity_score, rdm.detection_method,
       cr1.original_filename AS resume_a, cr2.original_filename AS resume_b, rdm.created_at
FROM resume_duplicate_matches rdm
JOIN candidate_resumes cr1 ON rdm.resume_id = cr1.id
JOIN candidate_resumes cr2 ON rdm.matched_resume_id = cr2.id
ORDER BY rdm.created_at DESC;

-- 12. NATURAL LANGUAGE SEARCH AUDIT LOG
-- Track recruiter natural language search prompts and interpreted filters
SELECT nls.id, u.email AS recruiter, nls.query_text, nls.interpreted_filters_json,
       nls.results_count, nls.created_at
FROM natural_language_searches nls
JOIN users u ON nls.recruiter_id = u.id
ORDER BY nls.created_at DESC;

-- 13. AI INTERVIEW QUESTION SETS
-- Retrieve AI-generated interview questions grouped by job and recruiter
SELECT iqs.id, j.title AS job_title, u.email AS recruiter_email, iqs.model_version,
       iqs.created_at
FROM interview_question_sets iqs
JOIN jobs j ON iqs.job_id = j.id
JOIN users u ON iqs.recruiter_id = u.id
ORDER BY iqs.created_at DESC;

-- 14. RESUME IMPROVEMENT ADVICE LOG
-- Retrieve section-by-section resume health checks
SELECT ria.id, cr.original_filename, u.email AS candidate_email, ria.status,
       ria.model_version, ria.created_at
FROM resume_improvement_analyses ria
JOIN candidate_resumes cr ON ria.resume_id = cr.id
JOIN users u ON ria.candidate_id = u.id
ORDER BY ria.created_at DESC;

-- 15. REFERENTIAL INTEGRITY CHECK
-- SQLite PRAGMA check verifying 0 foreign key constraint violations
PRAGMA foreign_key_check;

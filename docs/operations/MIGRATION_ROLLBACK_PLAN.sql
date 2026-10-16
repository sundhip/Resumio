-- ============================================================
-- RESUMIO POSTGRESQL MIGRATION ROLLBACK SCRIPT
-- Generated: 2026-10-16T13:45:55.940Z
-- Restores database to pre-migration clean state
-- ============================================================
BEGIN;
TRUNCATE TABLE active_learning_queue CASCADE;
TRUNCATE TABLE model_shadow_evaluations CASCADE;
TRUNCATE TABLE model_deployments CASCADE;
TRUNCATE TABLE webhook_deliveries CASCADE;
TRUNCATE TABLE webhook_subscriptions CASCADE;
TRUNCATE TABLE api_key_usage CASCADE;
TRUNCATE TABLE api_keys CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE resume_screenings CASCADE;
TRUNCATE TABLE applications CASCADE;
TRUNCATE TABLE candidate_certifications CASCADE;
TRUNCATE TABLE candidate_projects CASCADE;
TRUNCATE TABLE candidate_education CASCADE;
TRUNCATE TABLE candidate_experience CASCADE;
TRUNCATE TABLE candidate_skills CASCADE;
TRUNCATE TABLE candidate_resumes CASCADE;
TRUNCATE TABLE job_required_skills CASCADE;
TRUNCATE TABLE jobs CASCADE;
TRUNCATE TABLE organization_members CASCADE;
TRUNCATE TABLE organizations CASCADE;
TRUNCATE TABLE recruiter_profiles CASCADE;
TRUNCATE TABLE candidate_profiles CASCADE;
TRUNCATE TABLE users CASCADE;
COMMIT;
-- ROLLBACK SCRIPT COMPLETE
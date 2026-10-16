-- ============================================================================
-- RESUMIO PRODUCTION POSTGRESQL + PGVECTOR INITIAL SCHEMA
-- Phase 11: Production Hardening & Security
-- Supports vector similarity matching via HNSW cosine indexing
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Core Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
  status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
  google_id VARCHAR(128) UNIQUE DEFAULT NULL,
  two_factor_secret VARCHAR(128) DEFAULT NULL,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_scratch_codes TEXT DEFAULT NULL,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  lockout_until TIMESTAMPTZ DEFAULT NULL,
  password_changed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. Candidate Profiles Table (with encrypted PII columns)
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  headline VARCHAR(500) DEFAULT '',
  phone_encrypted TEXT DEFAULT NULL,
  address_encrypted TEXT DEFAULT NULL,
  location VARCHAR(255) DEFAULT '',
  bio TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  portfolio_url TEXT DEFAULT '',
  github_username VARCHAR(128) DEFAULT NULL,
  linkedin_url_encrypted TEXT DEFAULT NULL,
  profile_completion INTEGER NOT NULL DEFAULT 0,
  preferred_work_modes VARCHAR(128) DEFAULT 'remote,hybrid,onsite',
  preferred_locations TEXT DEFAULT '',
  min_expected_salary NUMERIC(12, 2) DEFAULT NULL,
  data_retention_days INTEGER NOT NULL DEFAULT 365,
  consent_talent_pool BOOLEAN NOT NULL DEFAULT TRUE,
  consent_ai_training BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cand_profiles_user ON candidate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_cand_profiles_location ON candidate_profiles(location);

-- 4. Recruiter Profiles Table
CREATE TABLE IF NOT EXISTS recruiter_profiles (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  company_logo TEXT DEFAULT '',
  company_website TEXT DEFAULT '',
  headline VARCHAR(500) DEFAULT '',
  profile_completion INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_user ON recruiter_profiles(user_id);

-- 5. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(128) UNIQUE NOT NULL,
  domain VARCHAR(255) DEFAULT '',
  allow_external_ai BOOLEAN NOT NULL DEFAULT TRUE,
  tier VARCHAR(32) NOT NULL DEFAULT 'enterprise',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orgs_slug ON organizations(slug);

-- 6. Organization Members
CREATE TABLE IF NOT EXISTS organization_members (
  id VARCHAR(64) PRIMARY KEY,
  org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL DEFAULT 'recruiter' CHECK (role IN ('admin', 'recruiter', 'hiring_manager', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);

-- 7. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id VARCHAR(64) PRIMARY KEY,
  org_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
  recruiter_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recruiter_profile_id VARCHAR(64) REFERENCES recruiter_profiles(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  employment_type VARCHAR(64) NOT NULL DEFAULT 'Full-time',
  work_mode VARCHAR(64) NOT NULL DEFAULT 'Hybrid',
  description TEXT NOT NULL,
  responsibilities TEXT DEFAULT '',
  min_experience NUMERIC(4, 1) NOT NULL DEFAULT 0,
  max_experience NUMERIC(4, 1) NOT NULL DEFAULT 10,
  qualification VARCHAR(255) DEFAULT '',
  salary_min NUMERIC(12, 2) DEFAULT NULL,
  salary_max NUMERIC(12, 2) DEFAULT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  jd_quality_score NUMERIC(5, 2) DEFAULT NULL,
  inclusive_language_flags TEXT DEFAULT '[]',
  embedding vector(384) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_org ON jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
-- HNSW Vector Index for High-Performance Semantic Job Search
CREATE INDEX IF NOT EXISTS idx_jobs_embedding_hnsw ON jobs USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 8. Candidate Resumes Table (S3 Storage metadata)
CREATE TABLE IF NOT EXISTS candidate_resumes (
  id VARCHAR(64) PRIMARY KEY,
  candidate_profile_id VARCHAR(64) NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL, -- S3 object key or URI
  s3_bucket VARCHAR(128) DEFAULT NULL,
  s3_key VARCHAR(512) DEFAULT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  checksum_sha256 VARCHAR(64) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  parsed_text TEXT DEFAULT '',
  embedding vector(384) DEFAULT NULL,
  malware_scan_status VARCHAR(32) NOT NULL DEFAULT 'clean' CHECK (malware_scan_status IN ('pending', 'clean', 'infected', 'quarantined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resumes_profile ON candidate_resumes(candidate_profile_id);
CREATE INDEX IF NOT EXISTS idx_resumes_checksum ON candidate_resumes(checksum_sha256);
-- HNSW Vector Index for Semantic Resume Matching
CREATE INDEX IF NOT EXISTS idx_resumes_embedding_hnsw ON candidate_resumes USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 9. Candidate Skills Table
CREATE TABLE IF NOT EXISTS candidate_skills (
  id VARCHAR(64) PRIMARY KEY,
  candidate_profile_id VARCHAR(64) NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  proficiency VARCHAR(32) NOT NULL DEFAULT 'Intermediate' CHECK (proficiency IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  years_experience NUMERIC(4, 1) DEFAULT 1.0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_source VARCHAR(64) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cand_skills_profile ON candidate_skills(candidate_profile_id);
CREATE INDEX IF NOT EXISTS idx_cand_skills_name ON candidate_skills(name);

-- 10. Job Required Skills Table
CREATE TABLE IF NOT EXISTS job_required_skills (
  id VARCHAR(64) PRIMARY KEY,
  job_id VARCHAR(64) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  skill_name VARCHAR(128) NOT NULL,
  min_experience_years NUMERIC(4, 1) DEFAULT 0,
  importance_weight NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_req_skills ON job_required_skills(job_id);

-- 11. Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(64) PRIMARY KEY,
  job_id VARCHAR(64) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidate_profile_id VARCHAR(64) NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  resume_id VARCHAR(64) NOT NULL REFERENCES candidate_resumes(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'Applied' CHECK (status IN ('Applied', 'Screening', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected', 'Withdrawn')),
  stage_id VARCHAR(64) DEFAULT NULL,
  match_score NUMERIC(5, 2) DEFAULT NULL,
  counterfactual_delta NUMERIC(5, 2) DEFAULT 0.0,
  notes TEXT DEFAULT '',
  withdrawn_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apps_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_apps_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(status);

-- 12. Resume Screenings & Match Explanations Table
CREATE TABLE IF NOT EXISTS resume_screenings (
  id VARCHAR(64) PRIMARY KEY,
  resume_id VARCHAR(64) NOT NULL REFERENCES candidate_resumes(id) ON DELETE CASCADE,
  job_id VARCHAR(64) REFERENCES jobs(id) ON DELETE CASCADE,
  overall_score NUMERIC(5, 2) NOT NULL,
  skills_score NUMERIC(5, 2) NOT NULL,
  experience_score NUMERIC(5, 2) NOT NULL,
  education_score NUMERIC(5, 2) NOT NULL,
  matched_skills_json TEXT NOT NULL DEFAULT '[]',
  missing_skills_json TEXT NOT NULL DEFAULT '[]',
  strengths_json TEXT NOT NULL DEFAULT '[]',
  gaps_json TEXT NOT NULL DEFAULT '[]',
  evidence_spans_json TEXT NOT NULL DEFAULT '[]',
  scoring_engine_version VARCHAR(32) NOT NULL DEFAULT 'v2',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_screenings_resume ON resume_screenings(resume_id);
CREATE INDEX IF NOT EXISTS idx_screenings_job ON resume_screenings(job_id);

-- 13. Audit Logs Table (Immutable Security Ledger)
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  actor_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(128) NOT NULL,
  resource_type VARCHAR(64) NOT NULL,
  resource_id VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
  user_agent TEXT DEFAULT '',
  payload_hash VARCHAR(64) NOT NULL,
  metadata_json TEXT DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- 14. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(64) PRIMARY KEY,
  org_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  key_hash VARCHAR(64) UNIQUE NOT NULL,
  key_prefix VARCHAR(16) NOT NULL,
  scopes_json TEXT NOT NULL DEFAULT '["parse","match"]',
  rate_limit_per_min INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(org_id);

-- 15. API Key Usage Table
CREATE TABLE IF NOT EXISTS api_key_usage (
  id VARCHAR(64) PRIMARY KEY,
  api_key_id VARCHAR(64) NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(128) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms NUMERIC(8, 2) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_usage_key ON api_key_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_time ON api_key_usage(timestamp);

-- 16. Webhook Subscriptions Table
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  org_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret VARCHAR(128) NOT NULL,
  events_json TEXT NOT NULL DEFAULT '["application.created","score.completed","stage.changed"]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 17. Webhook Deliveries Table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id VARCHAR(64) PRIMARY KEY,
  webhook_id VARCHAR(64) NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_type VARCHAR(64) NOT NULL,
  payload_json TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  http_status INTEGER DEFAULT NULL,
  error_message TEXT DEFAULT '',
  next_retry_at TIMESTAMPTZ DEFAULT NULL,
  delivered_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wh_deliv_sub ON webhook_deliveries(webhook_id);

-- 18. Model Deployments & Governance Table
CREATE TABLE IF NOT EXISTS model_deployments (
  id VARCHAR(64) PRIMARY KEY,
  model_name VARCHAR(128) NOT NULL,
  version VARCHAR(64) NOT NULL,
  stage VARCHAR(32) NOT NULL DEFAULT 'candidate' CHECK (stage IN ('shadow', 'production', 'archived')),
  f1_score NUMERIC(5, 4) NOT NULL,
  ndcg_at_10 NUMERIC(5, 4) NOT NULL,
  promoted_at TIMESTAMPTZ DEFAULT NULL,
  promoted_by VARCHAR(64) DEFAULT NULL,
  rollback_version VARCHAR(64) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 19. Model Shadow Evaluations Table
CREATE TABLE IF NOT EXISTS model_shadow_evaluations (
  id VARCHAR(64) PRIMARY KEY,
  deployment_id VARCHAR(64) NOT NULL REFERENCES model_deployments(id) ON DELETE CASCADE,
  resume_id VARCHAR(64) NOT NULL,
  job_id VARCHAR(64) NOT NULL,
  production_score NUMERIC(5, 2) NOT NULL,
  shadow_score NUMERIC(5, 2) NOT NULL,
  score_delta NUMERIC(5, 2) NOT NULL,
  latency_ms NUMERIC(8, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shadow_eval_dep ON model_shadow_evaluations(deployment_id);

-- 20. Active Learning Queue Table
CREATE TABLE IF NOT EXISTS active_learning_queue (
  id VARCHAR(64) PRIMARY KEY,
  item_type VARCHAR(64) NOT NULL CHECK (item_type IN ('resume_parse', 'skill_match', 'extraction')),
  source_id VARCHAR(64) NOT NULL,
  confidence_score NUMERIC(4, 3) NOT NULL,
  raw_text TEXT NOT NULL,
  predicted_label VARCHAR(255) NOT NULL,
  ground_truth_label VARCHAR(255) DEFAULT NULL,
  review_status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  reviewed_by VARCHAR(64) DEFAULT NULL,
  reviewed_at TIMESTAMPTZ DEFAULT NULL,
  consent_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_act_lrn_status ON active_learning_queue(review_status);

-- 21. User Security Sessions Table (Rotating Refresh Tokens)
CREATE TABLE IF NOT EXISTS security_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT DEFAULT '',
  csrf_token VARCHAR(64) NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sec_sessions_user ON security_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sec_sessions_hash ON security_sessions(refresh_token_hash);

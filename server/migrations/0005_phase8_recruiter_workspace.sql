-- ============================================================
-- Migration 0005: Phase 8 Recruiter Workspace, Multi-Tenancy & Pipeline
-- ============================================================

-- 1. Multi-Tenant Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'enterprise' CHECK (plan IN ('starter', 'growth', 'enterprise')),
  max_monthly_resumes INTEGER NOT NULL DEFAULT 5000,
  data_retention_days INTEGER NOT NULL DEFAULT 365,
  eeoc_monitoring_enabled INTEGER NOT NULL DEFAULT 1 CHECK (eeoc_monitoring_enabled IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_org_slug ON organizations(slug);

-- 2. Organization Memberships & Role-Based Access Control
CREATE TABLE IF NOT EXISTS organization_members (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Recruiter', 'Hiring Manager', 'Viewer')),
  team TEXT NOT NULL DEFAULT 'General',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);

-- 3. Per-Job Access Control
CREATE TABLE IF NOT EXISTS job_access_control (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('Owner', 'Editor', 'Reviewer', 'Viewer')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(job_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_job_access_user ON job_access_control(user_id, job_id);

-- 4. Custom Pipeline Stages
CREATE TABLE IF NOT EXISTS custom_pipeline_stages (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  job_id TEXT DEFAULT NULL,
  name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  stage_type TEXT NOT NULL CHECK (stage_type IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'custom')),
  is_terminal INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stages_org_order ON custom_pipeline_stages(organization_id, stage_order);
CREATE INDEX IF NOT EXISTS idx_stages_job ON custom_pipeline_stages(job_id);

-- 5. Candidate Collaborative Notes with @mentions
CREATE TABLE IF NOT EXISTS candidate_notes (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  mentions_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_app ON candidate_notes(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_cand ON candidate_notes(candidate_id);

-- 6. Candidate Tags
CREATE TABLE IF NOT EXISTS candidate_tags (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE(candidate_id, organization_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_cand_tags_org ON candidate_tags(organization_id, tag);

-- 7. Saved Searches with Alerts
CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  query_text TEXT DEFAULT '',
  filters_json TEXT NOT NULL DEFAULT '{}',
  alerts_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id, organization_id);

-- 8. Grounded Outreach Campaigns
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  recruiter_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  application_id TEXT DEFAULT NULL,
  template_name TEXT DEFAULT 'initial_reachout',
  tone TEXT NOT NULL DEFAULT 'professional' CHECK (tone IN ('professional', 'enthusiastic', 'casual')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  grounded_facts_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent', 'cancelled')),
  approved_by TEXT DEFAULT NULL,
  approved_at TEXT DEFAULT NULL,
  sent_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_outreach_recruiter ON outreach_campaigns(recruiter_id, status);
CREATE INDEX IF NOT EXISTS idx_outreach_candidate ON outreach_campaigns(candidate_id);

-- 9. Candidate Constructive Rejection Feedback (Opt-in & Human-Approved)
CREATE TABLE IF NOT EXISTS candidate_rejection_feedback (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  recruiter_id TEXT NOT NULL,
  missing_skills_json TEXT NOT NULL DEFAULT '[]',
  improvement_advice TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent')),
  approved_at TEXT DEFAULT NULL,
  sent_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rejection_feedback_app ON candidate_rejection_feedback(application_id);

-- 10. Bulk Upload Batches
CREATE TABLE IF NOT EXISTS bulk_upload_batches (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  recruiter_id TEXT NOT NULL,
  job_id TEXT DEFAULT NULL,
  batch_name TEXT NOT NULL,
  total_files INTEGER NOT NULL,
  processed_files INTEGER NOT NULL DEFAULT 0,
  successful_files INTEGER NOT NULL DEFAULT 0,
  duplicate_files INTEGER NOT NULL DEFAULT 0,
  failed_files INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  summary_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bulk_batches_org ON bulk_upload_batches(organization_id, created_at DESC);

-- 11. Candidate Consent & Data Retention
CREATE TABLE IF NOT EXISTS candidate_consents (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  talent_pool_consented INTEGER NOT NULL DEFAULT 1,
  consent_date TEXT NOT NULL DEFAULT (datetime('now')),
  retention_expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE(candidate_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_consents_lookup ON candidate_consents(organization_id, candidate_id);

-- 12. Voluntary Demographic Monitoring (Separately Stored, Strictly Decoupled from Screening/Scoring)
CREATE TABLE IF NOT EXISTS voluntary_demographics (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL UNIQUE,
  organization_id TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'Unspecified',
  race_ethnicity TEXT NOT NULL DEFAULT 'Unspecified',
  veteran_status TEXT NOT NULL DEFAULT 'Unspecified',
  disability_status TEXT NOT NULL DEFAULT 'Unspecified',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_demo_org ON voluntary_demographics(organization_id);

-- ============================================================
-- Seed Default Organizations & Default Pipeline Stages
-- ============================================================
INSERT OR IGNORE INTO organizations (id, name, slug, plan, max_monthly_resumes, data_retention_days, eeoc_monitoring_enabled)
VALUES 
  ('org_resumio_demo', 'Acme Global Technologies', 'acme-global', 'enterprise', 5000, 365, 1),
  ('org_tenant_beta', 'BetaCorp Engineering', 'betacorp', 'growth', 2000, 180, 1);

-- Default Pipeline Stages for Demo Organization
INSERT OR IGNORE INTO custom_pipeline_stages (id, organization_id, job_id, name, stage_order, color, stage_type, is_terminal)
VALUES
  ('stg_applied_default', 'org_resumio_demo', NULL, 'Applied', 1, '#3b82f6', 'applied', 0),
  ('stg_screen_default', 'org_resumio_demo', NULL, 'Screening', 2, '#8b5cf6', 'screening', 0),
  ('stg_tech_default', 'org_resumio_demo', NULL, 'Technical Interview', 3, '#06b6d4', 'interview', 0),
  ('stg_final_default', 'org_resumio_demo', NULL, 'Final Round', 4, '#f59e0b', 'interview', 0),
  ('stg_offer_default', 'org_resumio_demo', NULL, 'Offer', 5, '#10b981', 'offer', 0),
  ('stg_hired_default', 'org_resumio_demo', NULL, 'Hired', 6, '#059669', 'hired', 1),
  ('stg_rejected_default', 'org_resumio_demo', NULL, 'Rejected', 7, '#ef4444', 'rejected', 1);

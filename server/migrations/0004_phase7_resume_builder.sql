-- ============================================================
-- Phase 7 Migration: ATS Resume Builder, Tailoring & Version History
-- ============================================================

CREATE TABLE IF NOT EXISTS resume_builder_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  candidate_profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  target_job_id TEXT DEFAULT NULL,
  template_id TEXT NOT NULL DEFAULT 'classic_ats',
  resume_data_json TEXT NOT NULL,
  ats_health_score REAL DEFAULT 85,
  is_tailored INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_builder_user ON resume_builder_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_builder_target_job ON resume_builder_documents(target_job_id);
CREATE INDEX IF NOT EXISTS idx_builder_updated_at ON resume_builder_documents(updated_at);

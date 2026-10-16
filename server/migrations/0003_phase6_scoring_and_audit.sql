-- ============================================================
-- Phase 6 Migration: Score V2 Provenance, Audit Trails & Blind Screening
-- ============================================================

-- 1. Candidate Identity Reveal Audit Log (EEOC / Blind Screening Compliance)
CREATE TABLE IF NOT EXISTS candidate_identity_reveal_logs (
  id TEXT PRIMARY KEY,
  recruiter_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  job_id TEXT DEFAULT NULL,
  reason TEXT NOT NULL,
  revealed_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip_address TEXT DEFAULT '',
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reveal_logs_recruiter ON candidate_identity_reveal_logs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_reveal_logs_candidate ON candidate_identity_reveal_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_reveal_logs_revealed_at ON candidate_identity_reveal_logs(revealed_at);

-- 2. Match Score V2 Provenance & Audit Ledger
CREATE TABLE IF NOT EXISTS match_score_v2_provenance (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  algorithm_version TEXT NOT NULL DEFAULT '2.0.0-v2',
  final_score REAL NOT NULL,
  confidence_band TEXT NOT NULL,
  weights_applied TEXT NOT NULL,
  is_rules_only INTEGER NOT NULL DEFAULT 0,
  blend_alpha REAL NOT NULL DEFAULT 0.25,
  contributions_json TEXT NOT NULL,
  must_have_flags_json TEXT NOT NULL,
  shap_json TEXT DEFAULT '[]',
  counterfactuals_json TEXT DEFAULT '[]',
  ats_score REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_provenance_candidate_job ON match_score_v2_provenance(candidate_id, job_id);
CREATE INDEX IF NOT EXISTS idx_provenance_created_at ON match_score_v2_provenance(created_at);

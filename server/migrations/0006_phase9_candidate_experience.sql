-- ============================================================
-- Migration 0006: Phase 9 Candidate Experience & Evidence Verification
-- ============================================================

-- 1. Curated Learning Resources Table (Truthful, non-hallucinated resources)
CREATE TABLE IF NOT EXISTS curated_learning_resources (
  id TEXT PRIMARY KEY,
  skill_name TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  provider TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('course', 'documentation', 'book', 'project', 'tutorial')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours INTEGER NOT NULL DEFAULT 10,
  is_free INTEGER NOT NULL DEFAULT 1 CHECK (is_free IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_curated_skill ON curated_learning_resources(skill_name);

-- Seed Initial Curated, Real, Permanent Learning Resources (Never Invented Links)
INSERT OR IGNORE INTO curated_learning_resources (id, skill_name, title, url, provider, resource_type, difficulty, estimated_hours, is_free)
VALUES
  ('res_ts_handbook', 'TypeScript', 'The TypeScript Handbook', 'https://www.typescriptlang.org/docs/handbook/', 'Official TypeScript Documentation', 'documentation', 'intermediate', 15, 1),
  ('res_react_docs', 'React', 'React Documentation: Learn React', 'https://react.dev/learn', 'Meta / React Core Team', 'documentation', 'beginner', 20, 1),
  ('res_node_guides', 'Node.js', 'Node.js Official Guides and Best Practices', 'https://nodejs.org/en/learn', 'OpenJS Foundation', 'documentation', 'intermediate', 18, 1),
  ('res_python_tutorial', 'Python', 'The Official Python 3 Tutorial', 'https://docs.python.org/3/tutorial/', 'Python Software Foundation', 'documentation', 'beginner', 25, 1),
  ('res_postgres_docs', 'PostgreSQL', 'PostgreSQL Official Documentation', 'https://www.postgresql.org/docs/', 'The PostgreSQL Global Development Group', 'documentation', 'intermediate', 22, 1),
  ('res_docker_getstarted', 'Docker', 'Docker Get Started Orientation and Lab', 'https://docs.docker.com/get-started/', 'Docker Inc.', 'tutorial', 'beginner', 12, 1),
  ('res_k8s_basics', 'Kubernetes', 'Kubernetes Basics & Interactive Tutorials', 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', 'Cloud Native Computing Foundation (CNCF)', 'tutorial', 'intermediate', 25, 1),
  ('res_go_tour', 'Go', 'A Tour of Go: Interactive Tour', 'https://go.dev/tour/', 'The Go Authors', 'tutorial', 'beginner', 10, 1),
  ('res_aws_fundamentals', 'AWS Cloud', 'AWS Cloud Practitioner Essentials', 'https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/', 'Amazon Web Services', 'course', 'beginner', 15, 1),
  ('res_graphql_intro', 'GraphQL', 'Introduction to GraphQL and Schemas', 'https://graphql.org/learn/', 'GraphQL Foundation', 'documentation', 'intermediate', 8, 1),
  ('res_fastapi_tutorial', 'FastAPI', 'FastAPI Tutorial - User Guide', 'https://fastapi.tiangolo.com/tutorial/', 'Tiangolo / FastAPI', 'documentation', 'beginner', 14, 1),
  ('res_redis_university', 'Redis', 'Redis University: RU101 Introduction to Redis Data Structures', 'https://university.redis.com/', 'Redis Ltd.', 'course', 'intermediate', 12, 1);

-- 2. Candidate Job Preferences & Dismissed Recommendations Table
CREATE TABLE IF NOT EXISTS candidate_job_preferences (
  id TEXT PRIMARY KEY,
  candidate_id TEXT UNIQUE NOT NULL,
  preferred_locations_json TEXT NOT NULL DEFAULT '[]',
  preferred_work_modes_json TEXT NOT NULL DEFAULT '["Remote", "Hybrid", "On-site"]',
  min_salary INTEGER DEFAULT NULL,
  max_salary INTEGER DEFAULT NULL,
  target_job_titles_json TEXT NOT NULL DEFAULT '[]',
  dismissed_job_ids_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cand_pref_user ON candidate_job_preferences(candidate_id);

-- 3. Candidate External Verifications Table (GitHub, Portfolio, LinkedIn Data Download)
CREATE TABLE IF NOT EXISTS candidate_verifications (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'portfolio', 'linkedin_export')),
  handle_or_url TEXT NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('verified', 'unverified', 'failed')),
  metadata_json TEXT NOT NULL DEFAULT '{}',
  evidence_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(candidate_id, provider, handle_or_url)
);

CREATE INDEX IF NOT EXISTS idx_cand_verif_user ON candidate_verifications(candidate_id, provider);

-- 4. Candidate Skill Verifications Table (Linked to Repositories & Evidence Spans)
CREATE TABLE IF NOT EXISTS candidate_skill_verifications (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  verification_source TEXT NOT NULL CHECK (verification_source IN ('github_repo', 'portfolio_project', 'assessment', 'none')),
  evidence_url TEXT DEFAULT NULL,
  evidence_snippet TEXT DEFAULT NULL,
  confidence_score REAL NOT NULL DEFAULT 1.0,
  verified_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(candidate_id, skill_name, verification_source)
);

CREATE INDEX IF NOT EXISTS idx_skill_verif_cand ON candidate_skill_verifications(candidate_id, skill_name);

-- 5. Profile Access Audit Logs Table (GDPR / DPDP Compliance - Candidate visibility into profile views)
CREATE TABLE IF NOT EXISTS profile_access_logs (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  viewer_id TEXT NOT NULL,
  viewer_name TEXT NOT NULL,
  viewer_role TEXT NOT NULL,
  organization_id TEXT DEFAULT NULL,
  organization_name TEXT DEFAULT NULL,
  purpose TEXT NOT NULL DEFAULT 'Application Review',
  accessed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_profile_access_cand ON profile_access_logs(candidate_id, accessed_at DESC);

-- 6. Candidate Data Retention & Privacy Consents Table
CREATE TABLE IF NOT EXISTS candidate_data_retention_consents (
  id TEXT PRIMARY KEY,
  candidate_id TEXT UNIQUE NOT NULL,
  talent_pool_inclusion INTEGER NOT NULL DEFAULT 1 CHECK (talent_pool_inclusion IN (0, 1)),
  training_data_inclusion INTEGER NOT NULL DEFAULT 0 CHECK (training_data_inclusion IN (0, 1)),
  consent_version TEXT NOT NULL DEFAULT '1.0',
  consent_updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_retention_cand ON candidate_data_retention_consents(candidate_id);

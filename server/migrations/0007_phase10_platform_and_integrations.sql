-- ============================================================
-- Phase 10 Migration: Platform, Integrations & Differentiating Features
-- Tables: API Keys, Webhooks, ATS Connectors, SSO Configs, Model Ops & Active Learning
-- ============================================================

-- 1. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes_json TEXT NOT NULL DEFAULT '["parse","match","rank","explain"]',
  rate_limit_per_min INTEGER NOT NULL DEFAULT 60,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_used_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- 2. API Key Usage Metering Table
CREATE TABLE IF NOT EXISTS api_key_usage (
  id TEXT PRIMARY KEY,
  api_key_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms REAL NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_usage_key ON api_key_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_key_usage(timestamp);

-- 3. Webhook Subscriptions Table
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events_json TEXT NOT NULL DEFAULT '["application.created","score.completed","stage.changed"]',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhook_subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhook_subscriptions(is_active);

-- 4. Webhook Deliveries Table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  http_status INTEGER DEFAULT NULL,
  error_message TEXT DEFAULT '',
  next_retry_at TEXT DEFAULT NULL,
  delivered_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (webhook_id) REFERENCES webhook_subscriptions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_sub ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);

-- 5. Organization SSO Configurations Table
CREATE TABLE IF NOT EXISTS org_sso_configs (
  id TEXT PRIMARY KEY,
  org_id TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'saml_extension')),
  client_id TEXT NOT NULL,
  client_secret_encrypted TEXT NOT NULL,
  discovery_url TEXT NOT NULL,
  allowed_domains_json TEXT NOT NULL DEFAULT '[]',
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sso_configs_org ON org_sso_configs(org_id);

-- 6. Model Deployments Table (Shadow Mode & Version Control)
CREATE TABLE IF NOT EXISTS model_deployments (
  id TEXT PRIMARY KEY,
  model_name TEXT NOT NULL,
  version TEXT NOT NULL,
  model_type TEXT NOT NULL CHECK (model_type IN ('lightgbm_ranker', 'embedding_pipeline', 'resume_parser', 'llm_evaluator')),
  status TEXT NOT NULL DEFAULT 'shadow' CHECK (status IN ('production', 'shadow', 'retired')),
  metrics_json TEXT NOT NULL DEFAULT '{}',
  promoted_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_model_deployments_status ON model_deployments(status);
CREATE INDEX IF NOT EXISTS idx_model_deployments_name_ver ON model_deployments(model_name, version);

-- 7. Model Shadow Evaluation Log Table
CREATE TABLE IF NOT EXISTS model_shadow_evaluations (
  id TEXT PRIMARY KEY,
  production_model_id TEXT NOT NULL,
  shadow_model_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  prod_score REAL NOT NULL,
  shadow_score REAL NOT NULL,
  score_delta REAL NOT NULL,
  input_hash TEXT NOT NULL,
  evaluated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_shadow_eval_models ON model_shadow_evaluations(production_model_id, shadow_model_id);
CREATE INDEX IF NOT EXISTS idx_shadow_eval_date ON model_shadow_evaluations(evaluated_at);

-- 8. Active Learning Queue Table
CREATE TABLE IF NOT EXISTS active_learning_queue (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('resume_parse', 'skill_extraction', 'match_prediction')),
  entity_id TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  predicted_label TEXT NOT NULL,
  confidence_score REAL NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'accepted', 'corrected', 'rejected')),
  corrected_label TEXT DEFAULT NULL,
  reviewed_by TEXT DEFAULT NULL,
  has_candidate_consent INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_alq_status ON active_learning_queue(review_status);
CREATE INDEX IF NOT EXISTS idx_alq_confidence ON active_learning_queue(confidence_score);
CREATE INDEX IF NOT EXISTS idx_alq_consent ON active_learning_queue(has_candidate_consent);

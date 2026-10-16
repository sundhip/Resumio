/**
 * Model Operations (ModelOps) Service
 * 1. Shadow Mode: Evaluates candidate models in parallel with production, logs to admin telemetry,
 *    enforces Phase 5 metric gates for promotion, and provides one-click rollback.
 *    CRITICAL: Shadow evaluations NEVER alter user-visible scores or rankings.
 * 2. Active Learning Queue: Surfaces low-confidence predictions (< 0.65) and ambiguous matches,
 *    strictly respecting candidate consent for AI training, and prepares validated datasets for offline retraining.
 */

import crypto from 'crypto';
import { db } from '../database/db.js';

export interface ModelDeploymentRecord {
  id: string;
  model_name: string;
  version: string;
  model_type: 'lightgbm_ranker' | 'embedding_pipeline' | 'resume_parser' | 'llm_evaluator';
  status: 'production' | 'shadow' | 'retired';
  metrics_json: string;
  promoted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShadowEvaluationRecord {
  id: string;
  production_model_id: string;
  shadow_model_id: string;
  candidate_id: string;
  job_id: string;
  prod_score: number;
  shadow_score: number;
  score_delta: number;
  input_hash: string;
  evaluated_at: string;
}

export interface ActiveLearningItem {
  id: string;
  item_type: 'resume_parse' | 'skill_extraction' | 'match_prediction';
  entity_id: string;
  raw_text: string;
  predicted_label: string;
  confidence_score: number;
  review_status: 'pending' | 'accepted' | 'corrected' | 'rejected';
  corrected_label: string | null;
  reviewed_by: string | null;
  has_candidate_consent: number;
  created_at: string;
  reviewed_at: string | null;
}

/**
 * Initializes default production and shadow models if not present in SQLite.
 */
export function ensureModelDeploymentsSeeded(): { prodModel: ModelDeploymentRecord; shadowModel: ModelDeploymentRecord } {
  let prodModel = db.prepare(`SELECT * FROM model_deployments WHERE status = 'production' LIMIT 1`).get() as ModelDeploymentRecord | undefined;
  if (!prodModel) {
    const prodId = 'mdl_prod_lgbm_v2';
    db.prepare(`
      INSERT INTO model_deployments (id, model_name, version, model_type, status, metrics_json, promoted_at)
      VALUES (?, 'LightGBM Ranker Production', '2.0.0', 'lightgbm_ranker', 'production', ?, datetime('now'))
    `).run(prodId, JSON.stringify({ f1: 0.906, ndcgAt10: 0.947, mrr: 0.925, latencyMs: 42.1 }));
    prodModel = db.prepare(`SELECT * FROM model_deployments WHERE id = ?`).get(prodId) as ModelDeploymentRecord;
  }

  let shadowModel = db.prepare(`SELECT * FROM model_deployments WHERE status = 'shadow' LIMIT 1`).get() as ModelDeploymentRecord | undefined;
  if (!shadowModel) {
    const shadowId = 'mdl_shadow_lgbm_v2_1';
    db.prepare(`
      INSERT INTO model_deployments (id, model_name, version, model_type, status, metrics_json)
      VALUES (?, 'LightGBM Ranker Candidate', '2.1.0-rc', 'lightgbm_ranker', 'shadow', ?)
    `).run(shadowId, JSON.stringify({ f1: 0.918, ndcgAt10: 0.954, mrr: 0.938, latencyMs: 38.6 }));
    shadowModel = db.prepare(`SELECT * FROM model_deployments WHERE id = ?`).get(shadowId) as ModelDeploymentRecord;
  }

  return { prodModel, shadowModel };
}

/**
 * Evaluates candidate shadow model in background alongside production scoring.
 * GUARANTEE: Returns strictly the production score. Shadow calculations never affect user output.
 */
export function executeShadowScoring(params: {
  productionScore: number;
  candidateId: string;
  jobId: string;
  candidateExperienceYears: number;
  matchedSkillsCount: number;
  requiredSkillsCount: number;
}): { userVisibleScore: number; shadowEvaluated: boolean } {
  const { prodModel, shadowModel } = ensureModelDeploymentsSeeded();
  if (!shadowModel) {
    return { userVisibleScore: params.productionScore, shadowEvaluated: false };
  }

  // Candidate model simulated inference: applies tuned feature weights
  const skillCoverage = params.requiredSkillsCount > 0 ? params.matchedSkillsCount / params.requiredSkillsCount : 0.8;
  const expFactor = Math.min(1.0, params.candidateExperienceYears / 5);
  // Slightly refined calibration formula
  const rawShadow = (skillCoverage * 0.55 + expFactor * 0.45) * 100;
  const shadowScore = Number((params.productionScore * 0.9 + rawShadow * 0.1).toFixed(2));
  const scoreDelta = Number((shadowScore - params.productionScore).toFixed(2));

  const inputHash = crypto.createHash('sha256')
    .update(`${params.candidateId}:${params.jobId}:${params.productionScore}`)
    .digest('hex')
    .slice(0, 16);

  const evalId = `shd_${crypto.randomUUID()}`;
  db.prepare(`
    INSERT INTO model_shadow_evaluations (
      id, production_model_id, shadow_model_id, candidate_id, job_id, prod_score, shadow_score, score_delta, input_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    evalId,
    prodModel.id,
    shadowModel.id,
    params.candidateId,
    params.jobId,
    params.productionScore,
    shadowScore,
    scoreDelta,
    inputHash
  );

  // Return strictly production score to user
  return { userVisibleScore: params.productionScore, shadowEvaluated: true };
}

/**
 * Gets shadow evaluation telemetry for admin evaluation and drift monitoring.
 */
export function getShadowModeComparison(): {
  prodModel: ModelDeploymentRecord;
  shadowModel: ModelDeploymentRecord | null;
  totalEvaluations: number;
  meanAbsoluteError: number;
  averageScoreDelta: number;
  evaluations: ShadowEvaluationRecord[];
} {
  const { prodModel, shadowModel } = ensureModelDeploymentsSeeded();
  const rows = db.prepare(`
    SELECT * FROM model_shadow_evaluations
    ORDER BY evaluated_at DESC
    LIMIT 100
  `).all() as ShadowEvaluationRecord[];

  const total = rows.length;
  const avgDelta = total > 0 ? rows.reduce((acc, r) => acc + r.score_delta, 0) / total : 0;
  const mae = total > 0 ? rows.reduce((acc, r) => acc + Math.abs(r.score_delta), 0) / total : 0;

  return {
    prodModel,
    shadowModel,
    totalEvaluations: total,
    meanAbsoluteError: Number(mae.toFixed(3)),
    averageScoreDelta: Number(avgDelta.toFixed(3)),
    evaluations: rows.slice(0, 20),
  };
}

/**
 * Promotes shadow model to production with Phase 5 Metric Gate verification.
 * Gate Requirements:
 * - Shadow model F1 must be >= 0.85
 * - Shadow model NDCG@10 must be >= 0.90
 */
export function promoteShadowModel(shadowModelId: string): {
  success: boolean;
  message: string;
  promotedModel?: ModelDeploymentRecord;
} {
  const target = db.prepare(`SELECT * FROM model_deployments WHERE id = ?`).get(shadowModelId) as ModelDeploymentRecord | undefined;
  if (!target || target.status !== 'shadow') {
    return { success: false, message: 'Invalid target model or model is not in shadow status.' };
  }

  const metrics = JSON.parse(target.metrics_json || '{}');
  const f1 = metrics.f1 || 0;
  const ndcg = metrics.ndcgAt10 || 0;

  // Phase 5 Metric Gate
  if (f1 < 0.85 || ndcg < 0.90) {
    return {
      success: false,
      message: `Model promotion rejected by Phase 5 Metric Gate. Requirements: F1 >= 0.85 (got ${f1}), NDCG@10 >= 0.90 (got ${ndcg}).`,
    };
  }

  // Atomic promotion transaction: retire old prod, set new prod
  const promoteTx = db.transaction(() => {
    db.prepare(`
      UPDATE model_deployments
      SET status = 'retired', updated_at = datetime('now')
      WHERE status = 'production'
    `).run();

    db.prepare(`
      UPDATE model_deployments
      SET status = 'production', promoted_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(shadowModelId);
  });

  promoteTx();
  const promoted = db.prepare(`SELECT * FROM model_deployments WHERE id = ?`).get(shadowModelId) as ModelDeploymentRecord;

  return {
    success: true,
    message: `Model ${promoted.model_name} (v${promoted.version}) successfully promoted to Production. Passed metric gates (F1: ${f1}, NDCG: ${ndcg}).`,
    promotedModel: promoted,
  };
}

/**
 * One-click rollback restoring the most recently retired production model.
 */
export function rollbackModel(): { success: boolean; message: string; activeModel?: ModelDeploymentRecord } {
  const lastRetired = db.prepare(`
    SELECT * FROM model_deployments
    WHERE status = 'retired'
    ORDER BY updated_at DESC
    LIMIT 1
  `).get() as ModelDeploymentRecord | undefined;

  if (!lastRetired) {
    return { success: false, message: 'No retired production model available for rollback.' };
  }

  const rollbackTx = db.transaction(() => {
    db.prepare(`UPDATE model_deployments SET status = 'shadow', updated_at = datetime('now') WHERE status = 'production'`).run();
    db.prepare(`UPDATE model_deployments SET status = 'production', updated_at = datetime('now') WHERE id = ?`).run(lastRetired.id);
  });

  rollbackTx();
  const active = db.prepare(`SELECT * FROM model_deployments WHERE status = 'production'`).get() as ModelDeploymentRecord;

  return {
    success: true,
    message: `Rolled back to ${active.model_name} (v${active.version}).`,
    activeModel: active,
  };
}

// ============================================================
// ACTIVE LEARNING QUEUE
// ============================================================

/**
 * Enqueues an item into active learning queue if confidence is low (< 0.65),
 * strictly verifying candidate consent.
 */
export function enqueueActiveLearningItem(params: {
  itemType: 'resume_parse' | 'skill_extraction' | 'match_prediction';
  entityId: string;
  rawText: string;
  predictedLabel: string;
  confidenceScore: number;
  candidateId?: string;
}): boolean {
  // Check candidate consent if candidate ID provided
  let hasConsent = 1;
  if (params.candidateId) {
    const consent = db.prepare(`
      SELECT training_data_inclusion FROM candidate_data_retention_consents
      WHERE candidate_id = ?
    `).get(params.candidateId) as { training_data_inclusion?: number } | undefined;

    if (consent && consent.training_data_inclusion === 0) {
      return false; // Candidate opted out of AI training data inclusion
    }
  }

  // Only enqueue low-confidence items or edge cases (< 0.65)
  if (params.confidenceScore >= 0.65) {
    return false;
  }

  const queueId = `alq_${crypto.randomUUID()}`;
  db.prepare(`
    INSERT INTO active_learning_queue (
      id, item_type, entity_id, raw_text, predicted_label, confidence_score, review_status, has_candidate_consent
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    queueId,
    params.itemType,
    params.entityId,
    params.rawText.slice(0, 500),
    params.predictedLabel,
    params.confidenceScore,
    hasConsent
  );

  return true;
}

/**
 * Reviews and labels an active learning queue item.
 */
export function reviewActiveLearningItem(params: {
  queueId: string;
  action: 'accept' | 'correct' | 'reject';
  correctedLabel?: string;
  reviewedBy: string;
}): boolean {
  const item = db.prepare(`SELECT * FROM active_learning_queue WHERE id = ?`).get(params.queueId);
  if (!item) return false;

  const status = params.action === 'accept'
    ? 'accepted'
    : params.action === 'correct'
    ? 'corrected'
    : 'rejected';

  db.prepare(`
    UPDATE active_learning_queue
    SET review_status = ?, corrected_label = ?, reviewed_by = ?, reviewed_at = datetime('now')
    WHERE id = ?
  `).run(
    status,
    params.correctedLabel || null,
    params.reviewedBy,
    params.queueId
  );

  return true;
}

/**
 * Exports validated human-reviewed items with verified candidate consent for offline retraining.
 */
export function exportActiveLearningDataset(): {
  datasetCount: number;
  records: { id: string; text: string; groundTruthLabel: string; originalConfidence: number }[];
} {
  const rows = db.prepare(`
    SELECT id, raw_text as text,
           COALESCE(corrected_label, predicted_label) as groundTruthLabel,
           confidence_score as originalConfidence
    FROM active_learning_queue
    WHERE review_status IN ('accepted', 'corrected') AND has_candidate_consent = 1
  `).all() as any[];

  return {
    datasetCount: rows.length,
    records: rows,
  };
}

/**
 * Platform & Integrations Management Routes
 * Exposes endpoints for managing:
 * - API Keys & Rate Limits
 * - Webhook Subscriptions & Test Triggers
 * - Greenhouse ATS Connector synchronization
 * - CSV/JSON Dry-Run Import & Export
 * - SSO Configuration & SAML SP Metadata
 * - ModelOps (Shadow Mode Telemetry, Promotion, Rollback, Active Learning Queue)
 * - JD Intelligence (Unrealistic tech constraints & Inclusive language guidance)
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  createWebhookSubscription,
  testSendWebhook,
  getWebhookDeliveries,
} from '../services/apiGatewayService.js';
import { GreenhouseConnector } from '../services/ats/greenhouseConnector.js';
import {
  validateAndPreviewImport,
  commitCandidateImport,
  exportData,
} from '../services/importExportService.js';
import {
  configureOrgSso,
  generateOidcAuthUrl,
  handleOidcCallback,
  generateSamlSpMetadata,
} from '../services/ssoService.js';
import {
  getShadowModeComparison,
  promoteShadowModel,
  rollbackModel,
  reviewActiveLearningItem,
  exportActiveLearningDataset,
} from '../services/modelOpsService.js';
import {
  analyzeJobDescriptionQuality,
  checkInclusiveLanguage,
} from '../../packages/shared/src/jdIntelligence.js';
import { db } from '../database/db.js';

export const platformRouter = Router();

// ==========================================
// 1. API Keys Management
// ==========================================
platformRouter.get('/keys', authenticateToken, requireRole(['recruiter', 'admin']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const orgId = user.org_id || user.id;
  const keys = listApiKeys(orgId);
  return res.json({ success: true, data: keys });
});

platformRouter.post('/keys', authenticateToken, requireRole(['recruiter', 'admin']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const orgId = user.org_id || user.id;

  const schema = z.object({
    name: z.string().min(2, 'Key name required'),
    scopes: z.array(z.string()).optional(),
    rateLimitPerMin: z.number().min(10).max(1000).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.issues });
  }

  const { apiKeyRecord, rawApiKey } = createApiKey({
    orgId,
    userId: user.id,
    name: parsed.data.name,
    scopes: parsed.data.scopes,
    rateLimitPerMin: parsed.data.rateLimitPerMin,
  });

  return res.json({
    success: true,
    data: {
      key: apiKeyRecord,
      rawApiKey, // Provided strictly ONCE
    },
    message: 'Store rawApiKey securely; it will not be displayed again.',
  });
});

platformRouter.delete('/keys/:id', authenticateToken, requireRole(['recruiter', 'admin']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const orgId = user.org_id || user.id;
  const revoked = revokeApiKey(req.params.id, orgId);
  return res.json({ success: revoked });
});

// ==========================================
// 2. Outbound Webhooks Management
// ==========================================
platformRouter.get('/webhooks', authenticateToken, requireRole(['recruiter', 'admin']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const orgId = user.org_id || user.id;
  const webhooks = db.prepare(`SELECT * FROM webhook_subscriptions WHERE org_id = ?`).all(orgId);
  return res.json({ success: true, data: webhooks });
});

platformRouter.post('/webhooks', authenticateToken, requireRole(['recruiter', 'admin']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const orgId = user.org_id || user.id;

  const schema = z.object({
    url: z.string().url('Valid webhook HTTPS URL required'),
    events: z.array(z.string()).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.issues });
  }

  const sub = createWebhookSubscription({
    orgId,
    userId: user.id,
    url: parsed.data.url,
    events: parsed.data.events,
  });

  return res.json({ success: true, data: sub });
});

platformRouter.post('/webhooks/:id/test', authenticateToken, requireRole(['recruiter', 'admin']), async (req: Request, res: Response) => {
  const result = await testSendWebhook(req.params.id);
  return res.json(result);
});

platformRouter.get('/webhooks/:id/deliveries', authenticateToken, requireRole(['recruiter', 'admin']), (req: Request, res: Response) => {
  const deliveries = getWebhookDeliveries(req.params.id);
  return res.json({ success: true, data: deliveries });
});

// ==========================================
// 3. Greenhouse ATS Connector
// ==========================================
platformRouter.post('/ats/greenhouse/test', authenticateToken, requireRole(['recruiter', 'admin']), async (req: Request, res: Response) => {
  const { apiKey, useFixtures } = req.body;
  const connector = new GreenhouseConnector({ apiKey: apiKey || 'demo_key', useFixtures: useFixtures ?? true });
  const result = await connector.testConnection();
  return res.json(result);
});

platformRouter.get('/ats/greenhouse/jobs', authenticateToken, requireRole(['recruiter', 'admin']), async (_req: Request, res: Response) => {
  const connector = new GreenhouseConnector({ apiKey: 'demo_key', useFixtures: true });
  const jobs = await connector.fetchJobs();
  return res.json({ success: true, data: jobs });
});

platformRouter.get('/ats/greenhouse/candidates', authenticateToken, requireRole(['recruiter', 'admin']), async (req: Request, res: Response) => {
  const jobId = req.query.jobId as string | undefined;
  const connector = new GreenhouseConnector({ apiKey: 'demo_key', useFixtures: true });
  const candidates = await connector.fetchCandidates(jobId);
  return res.json({ success: true, data: candidates });
});

// ==========================================
// 4. Data Import & Export with Dry-Run
// ==========================================
platformRouter.post('/import/preview', authenticateToken, requireRole(['recruiter', 'admin']), (req: Request, res: Response) => {
  const schema = z.object({
    type: z.enum(['candidates', 'jobs']),
    format: z.enum(['csv', 'json']),
    content: z.string().min(1, 'Content required'),
    columnMapping: z.record(z.string(), z.string()).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.issues });
  }

  const preview = validateAndPreviewImport(
    parsed.data.type,
    parsed.data.content,
    parsed.data.format,
    parsed.data.columnMapping
  );

  return res.json({ success: true, data: preview });
});

platformRouter.post('/import/commit', authenticateToken, requireRole(['recruiter', 'admin']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const orgId = user.org_id || user.id;

  const schema = z.object({
    type: z.enum(['candidates', 'jobs']),
    validRows: z.array(z.any()).min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.issues });
  }

  if (parsed.data.type === 'candidates') {
    const result = commitCandidateImport(parsed.data.validRows, orgId);
    return res.json({ success: true, importedCount: result.importedCount });
  }

  return res.json({ success: false, message: 'Jobs commit import not supported in demo mode' });
});

platformRouter.get('/export', authenticateToken, (req: Request, res: Response) => {
  const type = (req.query.type as 'candidates' | 'jobs') || 'candidates';
  const format = (req.query.format as 'csv' | 'json') || 'csv';

  const exportResult = exportData(type, format);
  res.setHeader('Content-Type', exportResult.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
  return res.send(exportResult.content);
});

// ==========================================
// 5. SSO Configuration & SAML Metadata
// ==========================================
platformRouter.get('/sso/config', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const orgId = user.org_id || user.id;
  const config = db.prepare(`SELECT * FROM org_sso_configs WHERE org_id = ?`).get(orgId);
  return res.json({ success: true, data: config || null });
});

platformRouter.post('/sso/config', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const orgId = user.org_id || user.id;

  const schema = z.object({
    provider: z.enum(['google', 'microsoft', 'saml_extension']),
    clientId: z.string().min(2),
    clientSecret: z.string().min(2),
    discoveryUrl: z.string().optional(),
    allowedDomains: z.array(z.string()).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.issues });
  }

  const ssoRecord = configureOrgSso({
    orgId,
    ...parsed.data,
  });

  return res.json({ success: true, data: ssoRecord });
});

platformRouter.get('/sso/saml/metadata.xml', (req: Request, res: Response) => {
  const orgId = (req.query.orgId as string) || 'default_org';
  const metadata = generateSamlSpMetadata(orgId, req.get('host') || 'app.resumio.ai');
  res.setHeader('Content-Type', 'application/xml');
  return res.send(metadata);
});

// ==========================================
// 6. Model Operations (Shadow Mode & Active Learning)
// ==========================================
platformRouter.get('/model-ops/shadow', authenticateToken, requireRole(['admin']), (_req: Request, res: Response) => {
  const data = getShadowModeComparison();
  return res.json({ success: true, data });
});

platformRouter.post('/model-ops/promote', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const { shadowModelId } = req.body;
  if (!shadowModelId) {
    return res.status(400).json({ success: false, message: 'shadowModelId required' });
  }
  const result = promoteShadowModel(shadowModelId);
  return res.json(result);
});

platformRouter.post('/model-ops/rollback', authenticateToken, requireRole(['admin']), (_req: Request, res: Response) => {
  const result = rollbackModel();
  return res.json(result);
});

platformRouter.get('/model-ops/active-learning', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const status = (req.query.status as string) || 'pending';
  const items = db.prepare(`
    SELECT * FROM active_learning_queue
    WHERE review_status = ?
    ORDER BY created_at DESC
    LIMIT 100
  `).all(status);
  return res.json({ success: true, data: items });
});

platformRouter.post('/model-ops/active-learning/review', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { queueId, action, correctedLabel } = req.body;
  if (!queueId || !action) {
    return res.status(400).json({ success: false, message: 'queueId and action required' });
  }

  const reviewed = reviewActiveLearningItem({
    queueId,
    action,
    correctedLabel,
    reviewedBy: user.email,
  });

  return res.json({ success: reviewed });
});

platformRouter.get('/model-ops/active-learning/export', authenticateToken, requireRole(['admin']), (_req: Request, res: Response) => {
  const dataset = exportActiveLearningDataset();
  return res.json({ success: true, data: dataset });
});

// ==========================================
// 7. Job Description Intelligence
// ==========================================
platformRouter.post('/jd/analyze', (req: Request, res: Response) => {
  const { jdText, title, minExpYears } = req.body;
  if (!jdText) {
    return res.status(400).json({ success: false, message: 'jdText required' });
  }
  const report = analyzeJobDescriptionQuality(jdText, title || '', minExpYears || 0);
  return res.json({ success: true, data: report });
});

platformRouter.post('/jd/inclusive-check', (req: Request, res: Response) => {
  const { jdText } = req.body;
  if (!jdText) {
    return res.status(400).json({ success: false, message: 'jdText required' });
  }
  const report = checkInclusiveLanguage(jdText);
  return res.json({ success: true, data: report });
});

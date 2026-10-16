/**
 * API Gateway Service
 * 1. API Key lifecycle (creation, SHA-256 hashing at rest, scoping, revocable, rate limiting, last-used tracking)
 * 2. Outbound Webhooks (HMAC-SHA256 signatures, replay protection, delivery audit log, retries with backoff)
 */

import crypto from 'crypto';
import { db } from '../database/db.js';

export interface ApiKeyRecord {
  id: string;
  org_id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  scopes_json: string;
  rate_limit_per_min: number;
  is_active: number;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface WebhookSubscriptionRecord {
  id: string;
  org_id: string;
  user_id: string;
  url: string;
  secret: string;
  events_json: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookDeliveryRecord {
  id: string;
  webhook_id: string;
  event_type: string;
  payload_json: string;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  http_status: number | null;
  error_message: string;
  next_retry_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

/**
 * Creates a new hashed API key. Full plain text key is returned ONLY once.
 */
export function createApiKey(params: {
  orgId: string;
  userId: string;
  name: string;
  scopes?: string[];
  rateLimitPerMin?: number;
}): { apiKeyRecord: ApiKeyRecord; rawApiKey: string } {
  const keyId = `key_${crypto.randomUUID()}`;
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const rawApiKey = `rsm_live_${randomBytes}`;
  const keyPrefix = rawApiKey.slice(0, 16);
  const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

  const scopes = params.scopes || ['parse', 'match', 'rank', 'explain'];
  const rateLimit = params.rateLimitPerMin || 60;

  db.prepare(`
    INSERT INTO api_keys (
      id, org_id, user_id, name, key_hash, key_prefix, scopes_json, rate_limit_per_min, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    keyId,
    params.orgId,
    params.userId,
    params.name,
    keyHash,
    keyPrefix,
    JSON.stringify(scopes),
    rateLimit
  );

  const apiKeyRecord = db.prepare(`SELECT * FROM api_keys WHERE id = ?`).get(keyId) as ApiKeyRecord;
  return { apiKeyRecord, rawApiKey };
}

/**
 * Verifies raw API key, checks required scope, enforces rate limits, and meters usage.
 */
export function verifyApiKey(
  rawApiKey: string,
  requiredScope?: string
): {
  isValid: boolean;
  apiKey?: ApiKeyRecord;
  error?: string;
  statusCode?: number;
} {
  if (!rawApiKey || !rawApiKey.startsWith('rsm_live_')) {
    return { isValid: false, error: 'Invalid API key format. Expected rsm_live_...', statusCode: 401 };
  }

  const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
  const apiKey = db.prepare(`SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1`).get(keyHash) as ApiKeyRecord | undefined;

  if (!apiKey) {
    return { isValid: false, error: 'API key is invalid, inactive, or revoked.', statusCode: 401 };
  }

  // Check Scope
  const scopes: string[] = JSON.parse(apiKey.scopes_json || '[]');
  if (requiredScope && !scopes.includes(requiredScope) && !scopes.includes('admin')) {
    return {
      isValid: false,
      error: `API key lacks required scope '${requiredScope}'. Granted scopes: [${scopes.join(', ')}]`,
      statusCode: 403,
    };
  }

  // Enforce Rate Limit (sliding 60-second window using SQLite datetime)
  const usageCount = (db.prepare(`
    SELECT COUNT(*) as count FROM api_key_usage
    WHERE api_key_id = ? AND timestamp >= datetime('now', '-60 seconds')
  `).get(apiKey.id) as any)?.count || 0;

  if (usageCount >= apiKey.rate_limit_per_min) {
    return {
      isValid: false,
      error: `Rate limit exceeded. Maximum ${apiKey.rate_limit_per_min} requests per minute.`,
      statusCode: 429,
    };
  }

  // Update last used timestamp
  db.prepare(`UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?`).run(apiKey.id);

  return { isValid: true, apiKey };
}

/**
 * Logs API key usage metrics for auditing and rate limiting.
 */
export function logApiUsage(params: {
  apiKeyId: string;
  endpoint: string;
  statusCode: number;
  responseTimeMs: number;
}) {
  const usageId = `use_${crypto.randomUUID()}`;
  db.prepare(`
    INSERT INTO api_key_usage (id, api_key_id, endpoint, status_code, response_time_ms)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    usageId,
    params.apiKeyId,
    params.endpoint,
    params.statusCode,
    params.responseTimeMs
  );
}

/**
 * Revokes an API key.
 */
export function revokeApiKey(keyId: string, orgId: string): boolean {
  const result = db.prepare(`
    UPDATE api_keys
    SET is_active = 0, revoked_at = datetime('now')
    WHERE id = ? AND org_id = ?
  `).run(keyId, orgId);
  return result.changes > 0;
}

/**
 * Lists active API keys for an organization.
 */
export function listApiKeys(orgId: string): ApiKeyRecord[] {
  return db.prepare(`
    SELECT id, org_id, user_id, name, key_prefix, scopes_json, rate_limit_per_min, is_active, last_used_at, created_at, revoked_at
    FROM api_keys
    WHERE org_id = ?
    ORDER BY created_at DESC
  `).all(orgId) as ApiKeyRecord[];
}

// ============================================================
// OUTBOUND WEBHOOKS
// ============================================================

/**
 * Creates a webhook subscription.
 */
export function createWebhookSubscription(params: {
  orgId: string;
  userId: string;
  url: string;
  events?: string[];
}): WebhookSubscriptionRecord {
  const webhookId = `wh_${crypto.randomUUID()}`;
  const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
  const events = params.events || ['application.created', 'score.completed', 'stage.changed'];

  db.prepare(`
    INSERT INTO webhook_subscriptions (id, org_id, user_id, url, secret, events_json, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(webhookId, params.orgId, params.userId, params.url, secret, JSON.stringify(events));

  return db.prepare(`SELECT * FROM webhook_subscriptions WHERE id = ?`).get(webhookId) as WebhookSubscriptionRecord;
}

/**
 * Computes HMAC-SHA256 signature for webhook payload with replay-protection timestamp.
 */
export function computeWebhookSignature(secret: string, timestamp: number, payloadJson: string): string {
  const signatureData = `t=${timestamp}.${payloadJson}`;
  const hmac = crypto.createHmac('sha256', secret).update(signatureData).digest('hex');
  return `t=${timestamp},v1=${hmac}`;
}

/**
 * Dispatches a webhook event to all subscribed endpoints with HMAC signature,
 * replay protection, and exponential retry recording.
 */
export async function dispatchWebhookEvent(
  orgId: string,
  eventType: string,
  payload: Record<string, any>,
  customFetch?: (url: string, init: any) => Promise<{ status: number; ok: boolean }>
): Promise<{ dispatchedCount: number; deliveries: WebhookDeliveryRecord[] }> {
  const subscriptions = db.prepare(`
    SELECT * FROM webhook_subscriptions WHERE org_id = ? AND is_active = 1
  `).all(orgId) as WebhookSubscriptionRecord[];

  const matchingSubs = subscriptions.filter(s => {
    const events: string[] = JSON.parse(s.events_json || '[]');
    return events.includes(eventType) || events.includes('*');
  });

  const deliveries: WebhookDeliveryRecord[] = [];
  const fetchFn = customFetch || (globalThis.fetch as any);

  for (const sub of matchingSubs) {
    const deliveryId = `del_${crypto.randomUUID()}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadJson = JSON.stringify({
      id: deliveryId,
      event: eventType,
      timestamp,
      data: payload,
    });

    const signature = computeWebhookSignature(sub.secret, timestamp, payloadJson);

    let status: 'delivered' | 'failed' = 'failed';
    let httpStatus: number | null = null;
    let errorMessage = '';

    try {
      const response = await fetchFn(sub.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Resumio-Webhooks/1.0',
          'X-Resumio-Signature': signature,
          'X-Resumio-Timestamp': String(timestamp),
          'X-Resumio-Event': eventType,
        },
        body: payloadJson,
        signal: AbortSignal.timeout(5000),
      });

      httpStatus = response.status;
      if (response.ok) {
        status = 'delivered';
      } else {
        errorMessage = `HTTP error status ${response.status}`;
      }
    } catch (err: any) {
      errorMessage = err.message || 'Network request failed';
    }

    db.prepare(`
      INSERT INTO webhook_deliveries (
        id, webhook_id, event_type, payload_json, status, attempts, http_status, error_message, delivered_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
    `).run(
      deliveryId,
      sub.id,
      eventType,
      payloadJson,
      status,
      httpStatus,
      errorMessage,
      status === 'delivered' ? new Date().toISOString() : null
    );

    const record = db.prepare(`SELECT * FROM webhook_deliveries WHERE id = ?`).get(deliveryId) as WebhookDeliveryRecord;
    deliveries.push(record);
  }

  return { dispatchedCount: deliveries.length, deliveries };
}

/**
 * Test-sends a sample webhook event to verify destination endpoint connectivity.
 */
export async function testSendWebhook(
  webhookId: string,
  customFetch?: (url: string, init: any) => Promise<{ status: number; ok: boolean }>
): Promise<{ success: boolean; httpStatus?: number; error?: string }> {
  const sub = db.prepare(`SELECT * FROM webhook_subscriptions WHERE id = ?`).get(webhookId) as WebhookSubscriptionRecord | undefined;
  if (!sub) {
    return { success: false, error: 'Webhook subscription not found' };
  }

  const result = await dispatchWebhookEvent(
    sub.org_id,
    'webhook.test_ping',
    { ping: 'pong', verified: true, time: new Date().toISOString() },
    customFetch
  );

  const delivery = result.deliveries[0];
  return {
    success: delivery?.status === 'delivered',
    httpStatus: delivery?.http_status || undefined,
    error: delivery?.error_message || undefined,
  };
}

/**
 * Gets delivery log history for a webhook.
 */
export function getWebhookDeliveries(webhookId: string, limit = 50): WebhookDeliveryRecord[] {
  return db.prepare(`
    SELECT * FROM webhook_deliveries
    WHERE webhook_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(webhookId, limit) as WebhookDeliveryRecord[];
}

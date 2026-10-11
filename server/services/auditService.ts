import crypto from 'crypto';
import { db } from '../database/db.js';
import { mongoDb } from '../database/mongoAdapter.js';

export interface AuditLogEntry {
  id?: string;
  actorId: string;
  actorRole: 'candidate' | 'recruiter' | 'admin' | 'system';
  action: string;
  targetType: 'application' | 'interview' | 'job' | 'user' | 'notification' | 'match';
  targetId: string;
  previousState?: string | Record<string, any> | null;
  newState?: string | Record<string, any> | null;
  reason?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt?: string;
}

/**
 * Service to record and query immutable security and recruitment audit logs.
 * Dual-persists into SQLite (table `audit_logs`) and MongoDB collection (`audit_logs`).
 */
export class AuditService {
  /**
   * Log an audited action safely (never throws to avoid breaking main transactional flows)
   */
  public static async logAction(entry: AuditLogEntry): Promise<string> {
    const id = entry.id || crypto.randomUUID();
    const now = entry.createdAt || new Date().toISOString();

    const prevStateStr = entry.previousState
      ? typeof entry.previousState === 'string'
        ? entry.previousState
        : JSON.stringify(entry.previousState)
      : null;

    const newStateStr = entry.newState
      ? typeof entry.newState === 'string'
        ? entry.newState
        : JSON.stringify(entry.newState)
      : null;

    const metaStr = entry.metadata ? JSON.stringify(entry.metadata) : '{}';
    const reason = (entry.reason || '').trim();

    // 1. Persist to SQLite
    try {
      db.prepare(`
        INSERT INTO audit_logs (
          id, actor_id, actor_role, action, target_type, target_id,
          previous_state, new_state, reason, metadata_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        entry.actorId,
        entry.actorRole,
        entry.action,
        entry.targetType,
        entry.targetId,
        prevStateStr,
        newStateStr,
        reason,
        metaStr,
        now
      );
    } catch (sqlErr) {
      console.warn('[AuditService] SQLite audit log write warning:', sqlErr);
    }

    // 2. Dual-persist to MongoDB
    try {
      await mongoDb.audit_logs.insertOne({
        id,
        actor_id: entry.actorId,
        actor_role: entry.actorRole,
        action: entry.action,
        target_type: entry.targetType,
        target_id: entry.targetId,
        previous_state: entry.previousState || null,
        new_state: entry.newState || null,
        reason,
        metadata: entry.metadata || {},
        created_at: now,
      });
    } catch (mongoErr) {
      console.warn('[AuditService] MongoDB audit log write warning:', mongoErr);
    }

    return id;
  }

  /**
   * Query audit logs for a specific entity or actor
   */
  public static getLogs(filter: { targetId?: string; actorId?: string; action?: string; limit?: number }) {
    const limit = filter.limit || 50;
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (filter.targetId) {
      query += ' AND target_id = ?';
      params.push(filter.targetId);
    }
    if (filter.actorId) {
      query += ' AND actor_id = ?';
      params.push(filter.actorId);
    }
    if (filter.action) {
      query += ' AND action = ?';
      params.push(filter.action);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    try {
      return db.prepare(query).all(...params);
    } catch {
      return [];
    }
  }
}

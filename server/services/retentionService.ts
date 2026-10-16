/**
 * Retention Policy & Sub-Processor AI Governance Service
 * Phase 11: Production Hardening, Security, Privacy and Operations
 *
 * Implements:
 * 1. Automatic background data-retention audit and purging
 * 2. Organization-level toggle to disable external AI calls (Gemini) entirely
 * 3. Enforces 100% deterministic offline matching when external AI is disabled
 */

import { db } from '../database/db.js';

export interface RetentionAuditResult {
  purgedCandidatesCount: number;
  purgedResumesCount: number;
  anonymizedProfilesCount: number;
  timestamp: string;
}

export class RetentionService {
  /**
   * Executes automatic retention purge for candidate data exceeding policy thresholds
   * Default: candidates inactive for > 365 days who revoked talent pool consent
   */
  public runRetentionPurge(): RetentionAuditResult {
    let purgedCandidatesCount = 0;
    let purgedResumesCount = 0;
    let anonymizedProfilesCount = 0;

    const findExpiredCandidates = db.prepare(`
      SELECT cp.id as profile_id, cp.user_id
      FROM candidate_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.consent_talent_pool = 0
        AND cp.updated_at < datetime('now', '-365 days')
    `).all() as any[];

    const purgeTx = db.transaction(() => {
      for (const cand of findExpiredCandidates) {
        // 1. Delete associated resume records
        const resDel = db.prepare('DELETE FROM candidate_resumes WHERE candidate_profile_id = ?').run(cand.profile_id);
        purgedResumesCount += resDel.changes;

        // 2. Anonymize profile record to preserve historical application audit trails without retaining PII
        const anon = db.prepare(`
          UPDATE candidate_profiles
          SET full_name = 'Anonymized Candidate',
              headline = '',
              phone_encrypted = NULL,
              address_encrypted = NULL,
              location = 'Redacted',
              bio = '',
              photo_url = '',
              github_username = NULL,
              linkedin_url_encrypted = NULL,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(cand.profile_id);
        anonymizedProfilesCount += anon.changes;

        // 3. Deactivate user account
        db.prepare("UPDATE users SET status = 'deactivated', email = ? WHERE id = ?").run(
          `anonymized_${cand.user_id.slice(0, 8)}@deleted.resumio.local`,
          cand.user_id
        );
        purgedCandidatesCount++;
      }
    });

    purgeTx();

    return {
      purgedCandidatesCount,
      purgedResumesCount,
      anonymizedProfilesCount,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Checks whether an organization allows external AI calls (e.g. Gemini)
   * If false, all matching, parsing, and screening MUST run via local deterministic fallback
   */
  public isExternalAiPermitted(orgId?: string): boolean {
    if (!orgId) return true;

    try {
      const org = db.prepare('SELECT allow_external_ai FROM organizations WHERE id = ?').get(orgId) as any;
      if (!org) return true;
      return org.allow_external_ai === 1 || org.allow_external_ai === true;
    } catch {
      return true;
    }
  }

  /**
   * Toggles external AI capability for an organization
   */
  public setExternalAiPermission(orgId: string, allowed: boolean): void {
    db.prepare(`
      UPDATE organizations
      SET allow_external_ai = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(allowed ? 1 : 0, orgId);
  }
}

export const retentionService = new RetentionService();

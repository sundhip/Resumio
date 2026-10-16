import crypto from 'crypto';
import { db } from '../database/db.js';
import { AuditService } from './auditService.js';
import { NotificationService } from './notificationService.js';

export interface PipelineStageConfig {
  id: string;
  organizationId: string;
  jobId?: string | null;
  name: string;
  stageOrder: number;
  color: string;
  stageType: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'custom';
  isTerminal: boolean;
}

export interface CandidateNoteItem {
  id: string;
  applicationId: string;
  candidateId: string;
  authorId: string;
  authorName: string;
  content: string;
  mentions: string[];
  createdAt: string;
}

export class PipelineService {
  /**
   * Retrieves active pipeline stages for an organization or specific job
   */
  public static getStages(organizationId: string, jobId?: string): PipelineStageConfig[] {
    let rows: any[];
    if (jobId) {
      rows = db.prepare(`
        SELECT * FROM custom_pipeline_stages
        WHERE organization_id = ? AND (job_id = ? OR job_id IS NULL)
        ORDER BY stage_order ASC
      `).all(organizationId, jobId);
    } else {
      rows = db.prepare(`
        SELECT * FROM custom_pipeline_stages
        WHERE organization_id = ? AND job_id IS NULL
        ORDER BY stage_order ASC
      `).all(organizationId);
    }

    if (rows.length === 0) {
      // Fallback default stages
      return [
        { id: 'stg_1', organizationId, name: 'Applied', stageOrder: 1, color: '#3b82f6', stageType: 'applied', isTerminal: false },
        { id: 'stg_2', organizationId, name: 'Screening', stageOrder: 2, color: '#8b5cf6', stageType: 'screening', isTerminal: false },
        { id: 'stg_3', organizationId, name: 'Technical Interview', stageOrder: 3, color: '#06b6d4', stageType: 'interview', isTerminal: false },
        { id: 'stg_4', organizationId, name: 'Final Round', stageOrder: 4, color: '#f59e0b', stageType: 'interview', isTerminal: false },
        { id: 'stg_5', organizationId, name: 'Offer', stageOrder: 5, color: '#10b981', stageType: 'offer', isTerminal: false },
        { id: 'stg_6', organizationId, name: 'Hired', stageOrder: 6, color: '#059669', stageType: 'hired', isTerminal: true },
        { id: 'stg_7', organizationId, name: 'Rejected', stageOrder: 7, color: '#ef4444', stageType: 'rejected', isTerminal: true },
      ];
    }

    return rows.map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      jobId: r.job_id,
      name: r.name,
      stageOrder: r.stage_order,
      color: r.color,
      stageType: r.stage_type,
      isTerminal: Boolean(r.is_terminal),
    }));
  }

  /**
   * Moves a candidate application to a new stage.
   * STRICT FAIRNESS RULE: Must be executed by an authenticated human actor. AI auto-moves are blocked.
   */
  public static async moveApplicationStage(
    applicationId: string,
    newStatus: string,
    actorUserId: string,
    actorRole: 'recruiter' | 'admin',
    note: string = ''
  ): Promise<{ previousStatus: string; newStatus: string }> {
    const app = db.prepare('SELECT id, status, candidate_id, job_id FROM applications WHERE id = ?').get(applicationId) as any;
    if (!app) {
      throw new Error(`Application not found: ${applicationId}`);
    }

    const previousStatus = app.status;
    if (previousStatus === newStatus) {
      return { previousStatus, newStatus };
    }

    // Update application
    db.prepare(`
      UPDATE applications
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newStatus, applicationId);

    // Record in application status history
    const historyId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO application_status_history (id, application_id, old_status, new_status, changed_by, changed_by_role, note, changed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(historyId, applicationId, previousStatus, newStatus, actorUserId, actorRole, note);

    // Audit log
    await AuditService.logAction({
      actorId: actorUserId,
      actorRole,
      action: 'stage_transition',
      targetType: 'application',
      targetId: applicationId,
      previousState: previousStatus,
      newState: newStatus,
      reason: note || `Stage moved to ${newStatus} by ${actorRole}`,
    });

    return { previousStatus, newStatus };
  }

  /**
   * Bulk move multiple applications to a new stage
   */
  public static async bulkMoveStages(
    applicationIds: string[],
    newStatus: string,
    actorUserId: string,
    actorRole: 'recruiter' | 'admin',
    note: string = ''
  ): Promise<{ updatedCount: number; applicationIds: string[] }> {
    let count = 0;
    for (const appId of applicationIds) {
      try {
        await this.moveApplicationStage(appId, newStatus, actorUserId, actorRole, note);
        count++;
      } catch {
        // Continue processing others
      }
    }
    return { updatedCount: count, applicationIds };
  }

  /**
   * Adds a collaborative note with @mentions
   */
  public static addCandidateNote(
    applicationId: string,
    candidateId: string,
    authorId: string,
    content: string
  ): CandidateNoteItem {
    const noteId = `note_${crypto.randomUUID().slice(0, 8)}`;

    // Parse @mentions
    const mentionRegex = /@([A-Za-z0-9_.-]+)/g;
    const mentions: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    db.prepare(`
      INSERT INTO candidate_notes (id, application_id, candidate_id, author_id, content, mentions_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(noteId, applicationId, candidateId, authorId, content, JSON.stringify(mentions));

    // Notify mentioned users if found
    for (const username of mentions) {
      const mentionedUser = db.prepare('SELECT id, email FROM users WHERE email LIKE ?').get(`%${username}%`) as any;
      if (mentionedUser) {
        NotificationService.createNotification(
          mentionedUser.id,
          'system',
          'You were mentioned in a candidate note',
          `You were mentioned by a colleague regarding candidate application ${applicationId}`,
          'application',
          applicationId
        );
      }
    }

    const author = db.prepare('SELECT email FROM users WHERE id = ?').get(authorId) as any;

    return {
      id: noteId,
      applicationId,
      candidateId,
      authorId,
      authorName: author?.email || 'Recruiter Colleague',
      content,
      mentions,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Adds or removes a tag on a candidate
   */
  public static setCandidateTag(
    candidateId: string,
    organizationId: string,
    tag: string,
    action: 'add' | 'remove'
  ): { candidateId: string; tags: string[] } {
    const cleanTag = tag.trim().toLowerCase();
    if (action === 'add') {
      const id = `tag_${crypto.randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT OR IGNORE INTO candidate_tags (id, candidate_id, organization_id, tag, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).run(id, candidateId, organizationId, cleanTag);
    } else {
      db.prepare(`
        DELETE FROM candidate_tags
        WHERE candidate_id = ? AND organization_id = ? AND tag = ?
      `).run(candidateId, organizationId, cleanTag);
    }

    const currentTags = db.prepare(`
      SELECT tag FROM candidate_tags WHERE candidate_id = ? AND organization_id = ?
    `).all(candidateId, organizationId) as { tag: string }[];

    return {
      candidateId,
      tags: currentTags.map((t) => t.tag),
    };
  }
}

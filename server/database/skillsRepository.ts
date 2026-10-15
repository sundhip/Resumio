import { db } from './db.js';
import crypto from 'crypto';

export interface SkillRecord {
  id: string;
  canonical_name: string;
  category: string;
  description?: string;
  aliases_json: string;
  aliases?: string[];
  role_family?: string;
  source_taxonomy: string;
  status: 'approved' | 'pending_review' | 'rejected';
  is_deprecated: number;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface SkillRelationshipRecord {
  id: string;
  source_skill_id: string;
  target_skill_id: string;
  target_name?: string;
  relation_type: string;
  weight: number;
  created_at: string;
}

export interface SkillReviewQueueRecord {
  id: string;
  extracted_phrase: string;
  suggested_skill_id?: string;
  suggested_name?: string;
  similarity_score?: number;
  source_document_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface SkillAuditLogRecord {
  id: string;
  skill_id: string;
  action: string;
  details_json: string;
  actor_id?: string;
  created_at: string;
}

export class SkillsRepository {
  public static listSkills(params: {
    search?: string;
    category?: string;
    role_family?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): { skills: SkillRecord[]; total: number } {
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;

    let query = 'SELECT * FROM skills WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM skills WHERE 1=1';
    const queryParams: any[] = [];
    const countParams: any[] = [];

    if (params.search && params.search.trim()) {
      const term = `%${params.search.trim().toLowerCase()}%`;
      const searchClause = ' AND (lower(canonical_name) LIKE ? OR lower(aliases_json) LIKE ?)';
      query += searchClause;
      countQuery += searchClause;
      queryParams.push(term, term);
      countParams.push(term, term);
    }

    if (params.category && params.category !== 'all') {
      const catClause = ' AND lower(category) = lower(?)';
      query += catClause;
      countQuery += catClause;
      queryParams.push(params.category);
      countParams.push(params.category);
    }

    if (params.role_family && params.role_family !== 'all') {
      const roleClause = ' AND lower(role_family) = lower(?)';
      query += roleClause;
      countQuery += roleClause;
      queryParams.push(params.role_family);
      countParams.push(params.role_family);
    }

    if (params.status && params.status !== 'all') {
      const statClause = ' AND status = ?';
      query += statClause;
      countQuery += statClause;
      queryParams.push(params.status);
      countParams.push(params.status);
    }

    query += ' ORDER BY canonical_name ASC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const rows = db.prepare(query).all(...queryParams) as SkillRecord[];
    const totalRow = db.prepare(countQuery).get(...countParams) as { total: number };

    const formatted = rows.map((r) => {
      let parsedAliases: string[] = [];
      try {
        parsedAliases = JSON.parse(r.aliases_json || '[]');
      } catch {
        parsedAliases = [];
      }
      return {
        ...r,
        aliases: parsedAliases,
      };
    });

    return { skills: formatted, total: totalRow ? totalRow.total : 0 };
  }

  public static getSkillById(id: string): (SkillRecord & { implies: SkillRelationshipRecord[] }) | null {
    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as SkillRecord | undefined;
    if (!skill) return null;

    let parsedAliases: string[] = [];
    try {
      parsedAliases = JSON.parse(skill.aliases_json || '[]');
    } catch {
      parsedAliases = [];
    }

    const implies = db.prepare(`
      SELECT sr.*, s.canonical_name as target_name
      FROM skill_relationships sr
      JOIN skills s ON sr.target_skill_id = s.id
      WHERE sr.source_skill_id = ?
    `).all(id) as SkillRelationshipRecord[];

    return {
      ...skill,
      aliases: parsedAliases,
      implies,
    };
  }

  public static createSkill(data: {
    id?: string;
    canonical_name: string;
    category: string;
    description?: string;
    aliases: string[];
    role_family?: string;
    source_taxonomy?: string;
    actor_id?: string;
  }): SkillRecord {
    const slug = data.id || `skill_${data.canonical_name.toLowerCase().replace(/[^\w]/g, '_')}`;
    const aliasesJson = JSON.stringify(data.aliases.map((a) => a.trim().toLowerCase()));

    db.prepare(`
      INSERT INTO skills (id, canonical_name, category, description, aliases_json, role_family, source_taxonomy, status, is_deprecated, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', 0, '1.0.0')
    `).run(
      slug,
      data.canonical_name.trim(),
      data.category.trim(),
      data.description || '',
      aliasesJson,
      data.role_family || 'General',
      data.source_taxonomy || 'Custom/User'
    );

    this.logAudit(slug, 'created', { canonical_name: data.canonical_name, category: data.category }, data.actor_id);
    return this.getSkillById(slug)!;
  }

  public static updateSkill(
    id: string,
    data: Partial<{
      canonical_name: string;
      category: string;
      description: string;
      aliases: string[];
      role_family: string;
      is_deprecated: boolean;
      status: 'approved' | 'pending_review' | 'rejected';
      actor_id: string;
    }>
  ): SkillRecord | null {
    const existing = db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as SkillRecord | undefined;
    if (!existing) return null;

    const newName = data.canonical_name !== undefined ? data.canonical_name.trim() : existing.canonical_name;
    const newCat = data.category !== undefined ? data.category.trim() : existing.category;
    const newDesc = data.description !== undefined ? data.description : existing.description;
    const newAliasesJson = data.aliases !== undefined
      ? JSON.stringify(data.aliases.map((a) => a.trim().toLowerCase()))
      : existing.aliases_json;
    const newRole = data.role_family !== undefined ? data.role_family : existing.role_family;
    const newDep = data.is_deprecated !== undefined ? (data.is_deprecated ? 1 : 0) : existing.is_deprecated;
    const newStatus = data.status !== undefined ? data.status : existing.status;

    db.prepare(`
      UPDATE skills
      SET canonical_name = ?, category = ?, description = ?, aliases_json = ?, role_family = ?, is_deprecated = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newName, newCat, newDesc, newAliasesJson, newRole, newDep, newStatus, id);

    this.logAudit(id, 'updated', data, data.actor_id);
    return this.getSkillById(id)!;
  }

  public static deleteSkill(id: string, actorId?: string): boolean {
    const existing = db.prepare('SELECT canonical_name FROM skills WHERE id = ?').get(id) as { canonical_name: string } | undefined;
    if (!existing) return false;

    db.prepare('DELETE FROM skills WHERE id = ?').run(id);
    this.logAudit(id, 'deleted', { canonical_name: existing.canonical_name }, actorId);
    return true;
  }

  public static mergeSkills(targetSkillId: string, sourceSkillId: string, actorId?: string): SkillRecord {
    const target = this.getSkillById(targetSkillId);
    const source = this.getSkillById(sourceSkillId);
    if (!target || !source) {
      throw new Error(`Cannot merge: target (${targetSkillId}) or source (${sourceSkillId}) skill not found.`);
    }

    // Merge aliases
    const combinedAliases = new Set<string>([
      ...(target.aliases || []),
      ...(source.aliases || []),
      source.canonical_name.toLowerCase(),
    ]);

    // Update target with combined aliases
    this.updateSkill(targetSkillId, {
      aliases: Array.from(combinedAliases),
      actor_id: actorId,
    });

    // Re-point relationships
    db.prepare(`
      UPDATE skill_relationships SET source_skill_id = ? WHERE source_skill_id = ?
    `).run(targetSkillId, sourceSkillId);

    db.prepare(`
      UPDATE skill_relationships SET target_skill_id = ? WHERE target_skill_id = ?
    `).run(targetSkillId, sourceSkillId);

    // Delete or mark source skill
    db.prepare('DELETE FROM skills WHERE id = ?').run(sourceSkillId);

    this.logAudit(targetSkillId, 'merged', { mergedFromId: sourceSkillId, mergedFromName: source.canonical_name }, actorId);
    return this.getSkillById(targetSkillId)!;
  }

  public static addRelationship(
    sourceSkillId: string,
    targetSkillId: string,
    relationType: string = 'implies',
    weight: number = 1.0
  ): SkillRelationshipRecord {
    const relId = `rel_${sourceSkillId}_${targetSkillId}_${Date.now()}`;
    db.prepare(`
      INSERT OR REPLACE INTO skill_relationships (id, source_skill_id, target_skill_id, relation_type, weight)
      VALUES (?, ?, ?, ?, ?)
    `).run(relId, sourceSkillId, targetSkillId, relationType, weight);

    return db.prepare('SELECT * FROM skill_relationships WHERE id = ?').get(relId) as SkillRelationshipRecord;
  }

  public static removeRelationship(relationshipId: string): boolean {
    const res = db.prepare('DELETE FROM skill_relationships WHERE id = ?').run(relationshipId);
    return res.changes > 0;
  }

  public static getReviewQueue(params: { status?: string; limit?: number; offset?: number } = {}): {
    items: SkillReviewQueueRecord[];
    total: number;
  } {
    const status = params.status || 'pending';
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;

    const rows = db.prepare(`
      SELECT rq.*, s.canonical_name as suggested_name
      FROM skill_extraction_review_queue rq
      LEFT JOIN skills s ON rq.suggested_skill_id = s.id
      WHERE rq.status = ?
      ORDER BY rq.created_at DESC
      LIMIT ? OFFSET ?
    `).all(status, limit, offset) as SkillReviewQueueRecord[];

    const totalRow = db.prepare(
      'SELECT COUNT(*) as total FROM skill_extraction_review_queue WHERE status = ?'
    ).get(status) as { total: number };

    return { items: rows, total: totalRow ? totalRow.total : 0 };
  }

  public static addToReviewQueue(
    extractedPhrase: string,
    suggestedSkillId?: string,
    similarityScore?: number,
    sourceDocId?: string
  ): SkillReviewQueueRecord {
    const id = `rq_${crypto.randomUUID().slice(0, 12)}`;
    db.prepare(`
      INSERT INTO skill_extraction_review_queue (id, extracted_phrase, suggested_skill_id, similarity_score, source_document_id, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(id, extractedPhrase.trim(), suggestedSkillId || null, similarityScore || null, sourceDocId || null);

    return db.prepare('SELECT * FROM skill_extraction_review_queue WHERE id = ?').get(id) as SkillReviewQueueRecord;
  }

  public static decideReviewQueueItem(
    id: string,
    decision: 'approved' | 'rejected',
    mappedSkillId?: string,
    actorId?: string
  ): boolean {
    const item = db.prepare('SELECT * FROM skill_extraction_review_queue WHERE id = ?').get(id) as SkillReviewQueueRecord | undefined;
    if (!item) return false;

    db.prepare('UPDATE skill_extraction_review_queue SET status = ? WHERE id = ?').run(decision, id);

    if (decision === 'approved') {
      if (mappedSkillId) {
        // Map as an alias to existing skill
        const target = this.getSkillById(mappedSkillId);
        if (target) {
          const updatedAliases = new Set([...(target.aliases || []), item.extracted_phrase.toLowerCase()]);
          this.updateSkill(mappedSkillId, { aliases: Array.from(updatedAliases), actor_id: actorId });
        }
      } else {
        // Create new skill from extracted phrase if not already existing
        const existingSkill = db.prepare('SELECT id FROM skills WHERE lower(canonical_name) = lower(?)').get(item.extracted_phrase) as { id: string } | undefined;
        if (!existingSkill) {
          this.createSkill({
            canonical_name: item.extracted_phrase,
            category: 'tool',
            aliases: [item.extracted_phrase.toLowerCase()],
            role_family: 'General',
            source_taxonomy: 'ResumeReviewQueue',
            actor_id: actorId,
          });
        }
      }
    }

    this.logAudit(item.suggested_skill_id || id, `queue_${decision}`, { phrase: item.extracted_phrase, mappedSkillId }, actorId);
    return true;
  }

  public static logAudit(skillId: string, action: string, details: Record<string, any>, actorId?: string): void {
    const id = `aud_${crypto.randomUUID().slice(0, 12)}`;
    try {
      db.prepare(`
        INSERT INTO skill_audit_logs (id, skill_id, action, details_json, actor_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, skillId, action, JSON.stringify(details), actorId || 'system');
    } catch (e) {
      console.error('Failed to write skill audit log:', e);
    }
  }

  public static getAuditLogs(skillId?: string, limit: number = 50): SkillAuditLogRecord[] {
    if (skillId) {
      return db.prepare('SELECT * FROM skill_audit_logs WHERE skill_id = ? ORDER BY created_at DESC LIMIT ?').all(skillId, limit) as SkillAuditLogRecord[];
    }
    return db.prepare('SELECT * FROM skill_audit_logs ORDER BY created_at DESC LIMIT ?').all(limit) as SkillAuditLogRecord[];
  }

  public static getTaxonomyStats(): {
    totalSkills: number;
    categories: Record<string, number>;
    totalRelationships: number;
    pendingQueueCount: number;
  } {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM skills').get() as { count: number };
    const catRows = db.prepare('SELECT category, COUNT(*) as count FROM skills GROUP BY category').all() as { category: string; count: number }[];
    const relRow = db.prepare('SELECT COUNT(*) as count FROM skill_relationships').get() as { count: number };
    const queueRow = db.prepare("SELECT COUNT(*) as count FROM skill_extraction_review_queue WHERE status = 'pending'").get() as { count: number };

    const categories: Record<string, number> = {};
    for (const r of catRows) {
      categories[r.category] = r.count;
    }

    return {
      totalSkills: totalRow ? totalRow.count : 0,
      categories,
      totalRelationships: relRow ? relRow.count : 0,
      pendingQueueCount: queueRow ? queueRow.count : 0,
    };
  }
}

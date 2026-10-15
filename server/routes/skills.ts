import { Router, Request, Response } from 'express';
import { SkillsRepository } from '../database/skillsRepository.js';
import { authenticateToken } from '../middleware/auth.js';

export const skillsRouter = Router();

// GET /api/skills/stats - Public / authenticated stats
skillsRouter.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = SkillsRepository.getTaxonomyStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch taxonomy stats', details: err.message });
  }
});

// GET /api/skills - Searchable, paginated list of skills
skillsRouter.get('/', (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const role_family = req.query.role_family as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = SkillsRepository.listSkills({
      search,
      category,
      role_family,
      status,
      limit,
      offset,
    });

    res.json({
      success: true,
      skills: result.skills,
      total: result.total,
      limit,
      offset,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list skills', details: err.message });
  }
});

// GET /api/skills/:id - Single skill detail with relationships
skillsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const skill = SkillsRepository.getSkillById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    res.json({ success: true, skill });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch skill', details: err.message });
  }
});

// POST /api/skills - Create new skill
skillsRouter.post('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const { canonical_name, category, description, aliases, role_family, source_taxonomy } = req.body;
    if (!canonical_name || !category) {
      return res.status(400).json({ error: 'canonical_name and category are required' });
    }

    const actorId = (req as any).user?.id || 'admin';
    const skill = SkillsRepository.createSkill({
      canonical_name,
      category,
      description,
      aliases: Array.isArray(aliases) ? aliases : [],
      role_family,
      source_taxonomy,
      actor_id: actorId,
    });

    res.status(201).json({ success: true, skill });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create skill', details: err.message });
  }
});

// PUT /api/skills/:id - Update skill metadata
skillsRouter.put('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const actorId = (req as any).user?.id || 'admin';
    const updated = SkillsRepository.updateSkill(req.params.id, {
      ...req.body,
      actor_id: actorId,
    });
    if (!updated) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    res.json({ success: true, skill: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update skill', details: err.message });
  }
});

// DELETE /api/skills/:id - Delete skill
skillsRouter.delete('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const actorId = (req as any).user?.id || 'admin';
    const ok = SkillsRepository.deleteSkill(req.params.id, actorId);
    if (!ok) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    res.json({ success: true, message: 'Skill deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete skill', details: err.message });
  }
});

// POST /api/skills/merge - Merge duplicate skill into canonical target
skillsRouter.post('/merge', authenticateToken, (req: Request, res: Response) => {
  try {
    const { targetSkillId, sourceSkillId } = req.body;
    if (!targetSkillId || !sourceSkillId) {
      return res.status(400).json({ error: 'targetSkillId and sourceSkillId are required' });
    }
    const actorId = (req as any).user?.id || 'admin';
    const merged = SkillsRepository.mergeSkills(targetSkillId, sourceSkillId, actorId);
    res.json({ success: true, skill: merged });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to merge skills', details: err.message });
  }
});

// GET /api/skills/review-queue - Admin review queue
skillsRouter.get('/review/queue', authenticateToken, (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = SkillsRepository.getReviewQueue({ status, limit, offset });
    res.json({ success: true, items: result.items, total: result.total });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch review queue', details: err.message });
  }
});

// POST /api/skills/review/queue/:id/decision - Approve/Reject review item
skillsRouter.post('/review/queue/:id/decision', authenticateToken, (req: Request, res: Response) => {
  try {
    const { decision, mappedSkillId } = req.body;
    if (!decision || (decision !== 'approved' && decision !== 'rejected')) {
      return res.status(400).json({ error: "decision must be 'approved' or 'rejected'" });
    }
    const actorId = (req as any).user?.id || 'admin';
    const ok = SkillsRepository.decideReviewQueueItem(req.params.id, decision, mappedSkillId, actorId);
    if (!ok) {
      return res.status(404).json({ error: 'Review queue item not found' });
    }
    res.json({ success: true, message: `Review item ${decision}` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record decision', details: err.message });
  }
});

// GET /api/skills/audit/logs - Audit history
skillsRouter.get('/audit/logs', authenticateToken, (req: Request, res: Response) => {
  try {
    const skillId = req.query.skillId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logs = SkillsRepository.getAuditLogs(skillId, limit);
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs', details: err.message });
  }
});

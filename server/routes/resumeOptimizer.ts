import { Router, Request, Response } from 'express';
import { db } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  analyzeResumeTailoring,
  calculateResumeHealth,
  simulateAtsParsing,
  rewriteBulletDeterministic,
  NoFabricationValidator,
  type AtsSimulationPack
} from '../../packages/shared/src/index.js';
import { ResumeBuilderService, type BuilderResumeData, type AtsTemplateId } from '../services/resumeBuilderService.js';
import { GroundedGenerationService } from '../services/groundedGenerationService.js';
import crypto from 'crypto';

export const resumeOptimizerRouter = Router();
const groundedService = new GroundedGenerationService();

/**
 * POST /api/optimizer/tailor
 * Performs ATS tailor-to-job analysis with skill gap, stuffing warning, and score preview.
 */
resumeOptimizerRouter.post('/tailor', async (req: Request, res: Response) => {
  try {
    const { resumeData, jobData } = req.body;
    if (!resumeData || !jobData) {
      return res.status(400).json({ success: false, message: 'Missing resumeData or jobData payload.' });
    }

    const report = analyzeResumeTailoring(resumeData, jobData);
    return res.json({ success: true, report });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to tailor resume.' });
  }
});

/**
 * POST /api/optimizer/rewrite-bullet
 * Rewrites a weak bullet point into Google XYZ impact structure with strict NoFabrication check.
 */
resumeOptimizerRouter.post('/rewrite-bullet', async (req: Request, res: Response) => {
  try {
    const { bullet, userMetric, targetRole } = req.body;
    if (!bullet || typeof bullet !== 'string') {
      return res.status(400).json({ success: false, message: 'Bullet text is required.' });
    }

    const rewriteResult = rewriteBulletDeterministic(bullet, userMetric);

    // Validate using NoFabricationValidator
    const validation = NoFabricationValidator.validateNumbers(
      `${bullet} ${userMetric || ''}`,
      rewriteResult.rewrittenBullet
    );

    return res.json({
      success: true,
      ...rewriteResult,
      validationPassed: validation.isValid,
      unsupportedMetrics: validation.unsupportedNumbers,
      targetRole: targetRole || null
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to rewrite bullet.' });
  }
});

/**
 * POST /api/optimizer/health
 * Calculates comprehensive 0-100 Resume Health Score across 8 diagnostic dimensions.
 */
resumeOptimizerRouter.post('/health', async (req: Request, res: Response) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) {
      return res.status(400).json({ success: false, message: 'Resume data required.' });
    }

    const health = calculateResumeHealth(resumeData);
    return res.json({ success: true, health });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to evaluate resume health.' });
  }
});

/**
 * POST /api/optimizer/simulate-ats
 * Simulates parsing behavior across 4 heuristic rule packs.
 */
resumeOptimizerRouter.post('/simulate-ats', async (req: Request, res: Response) => {
  try {
    const { rawText, pack } = req.body;
    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({ success: false, message: 'Raw text is required for ATS simulation.' });
    }

    const simulation = simulateAtsParsing(rawText, (pack as AtsSimulationPack) || 'semantic_ats');
    return res.json({ success: true, simulation });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to simulate ATS parsing.' });
  }
});

/**
 * POST /api/optimizer/builder/save
 * Saves or updates candidate's ATS resume document in database.
 */
resumeOptimizerRouter.post('/builder/save', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { templateId, resumeData, title } = req.body;

    if (!resumeData) {
      return res.status(400).json({ success: false, message: 'Resume data is required.' });
    }

    // Check candidate profile
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(user.id) as any;
    const candidateProfileId = profile?.id || null;

    const existing = db.prepare('SELECT id FROM resume_builder_documents WHERE user_id = ?').get(user.id) as any;
    const id = existing?.id || crypto.randomUUID();

    if (existing) {
      db.prepare(`
        UPDATE resume_builder_documents
        SET template_id = ?, title = ?, resume_data_json = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(templateId || 'modern_clean', title || 'My ATS Resume', JSON.stringify(resumeData), id);
    } else {
      db.prepare(`
        INSERT INTO resume_builder_documents (id, user_id, candidate_profile_id, template_id, title, resume_data_json)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, user.id, candidateProfileId, templateId || 'modern_clean', title || 'My ATS Resume', JSON.stringify(resumeData));
    }

    return res.json({ success: true, id, message: 'Resume document saved successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to save resume document.' });
  }
});

/**
 * GET /api/optimizer/builder/load
 * Loads candidate's saved ATS resume document.
 */
resumeOptimizerRouter.get('/builder/load', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const doc = db.prepare('SELECT * FROM resume_builder_documents WHERE user_id = ?').get(user.id) as any;

    if (!doc) {
      return res.json({ success: true, document: null });
    }

    return res.json({
      success: true,
      document: {
        id: doc.id,
        templateId: doc.template_id,
        title: doc.title,
        resumeData: JSON.parse(doc.resume_data_json),
        updatedAt: doc.updated_at
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to load resume document.' });
  }
});

/**
 * POST /api/optimizer/builder/export
 * Exports ATS resume document as true text-layer PDF, DOCX, or clean HTML.
 */
resumeOptimizerRouter.post('/builder/export', async (req: Request, res: Response) => {
  try {
    const { templateId, resumeData, format } = req.body as {
      templateId: AtsTemplateId;
      resumeData: BuilderResumeData;
      format: 'html' | 'pdf' | 'docx';
    };

    if (!resumeData) {
      return res.status(400).json({ success: false, message: 'Resume data is required.' });
    }

    const tId = templateId || 'modern_clean';
    const candidateName = (resumeData.personal?.fullName || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'html') {
      const html = ResumeBuilderService.renderHtml(resumeData, tId);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${candidateName}_ATS_Resume.html"`);
      return res.send(html);
    }

    if (format === 'docx') {
      const docxBuffer = await ResumeBuilderService.exportDocx(resumeData, tId);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${candidateName}_ATS_Resume.docx"`);
      return res.send(docxBuffer);
    }

    // Default to PDF
    const pdfBuffer = await ResumeBuilderService.exportPdf(resumeData, tId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${candidateName}_ATS_Resume.pdf"`);
    return res.send(pdfBuffer);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Export failed.' });
  }
});

/**
 * POST /api/optimizer/builder/round-trip
 * Executes an automated parse fidelity test on an ATS template.
 */
resumeOptimizerRouter.post('/builder/round-trip', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.body;
    const testResult = await ResumeBuilderService.runRoundTripTest(templateId || 'classic_ats');
    return res.json({ success: true, result: testResult });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Round trip test failed.' });
  }
});

/**
 * POST /api/optimizer/grounded/summary
 * Generates a grounded 3-sentence professional summary.
 */
resumeOptimizerRouter.post('/grounded/summary', async (req: Request, res: Response) => {
  try {
    const { candidateFacts, targetJob } = req.body;
    if (!candidateFacts || !targetJob) {
      return res.status(400).json({ success: false, message: 'Candidate facts and target job required.' });
    }

    const result = await groundedService.generateProfessionalSummary(candidateFacts, targetJob);
    return res.json({ success: true, result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Summary generation failed.' });
  }
});

/**
 * POST /api/optimizer/grounded/cover-letter
 * Generates a grounded cover letter.
 */
resumeOptimizerRouter.post('/grounded/cover-letter', async (req: Request, res: Response) => {
  try {
    const { candidateFacts, targetJob } = req.body;
    if (!candidateFacts || !targetJob) {
      return res.status(400).json({ success: false, message: 'Candidate facts and target job required.' });
    }

    const result = await groundedService.generateCoverLetter(candidateFacts, targetJob);
    return res.json({ success: true, result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Cover letter generation failed.' });
  }
});

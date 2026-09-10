import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { NaturalLanguageSearchService } from '../services/nlSearchService.js';
import { InterviewQuestionService } from '../services/interviewQuestionService.js';
import { ResumeImprovementService } from '../services/resumeImprovementService.js';
import { DuplicateResumeService } from '../services/duplicateResumeService.js';
import { MatchExplanationService } from '../services/matchExplanationService.js';

const router = express.Router();

// ============================================================
// 1. Feature 31: Natural-Language Candidate Search
// ============================================================

router.post('/recruiter/candidate-search', authenticateToken, requireRole('recruiter', 'admin'), async (req, res) => {
  try {
    const { query, targetJobId } = req.body;
    const recruiterUserId = (req as any).user.userId;

    const result = await NaturalLanguageSearchService.searchCandidates(
      recruiterUserId,
      query || '',
      targetJobId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('Candidate search error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error during search' });
  }
});

// ============================================================
// 2. Feature 32: AI Interview Questions
// ============================================================

// Get or generate job interview questions
router.get('/jobs/:jobId/interview-questions', authenticateToken, requireRole('recruiter', 'admin'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const recruiterUserId = (req as any).user.userId;

    const result = await InterviewQuestionService.generateJobQuestions(recruiterUserId, jobId, false);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Get job questions error:', err);
    res.status(err.message.includes('Forbidden') ? 403 : 500).json({ success: false, message: err.message });
  }
});

router.post('/jobs/:jobId/interview-questions', authenticateToken, requireRole('recruiter', 'admin'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { forceRegenerate } = req.body;
    const recruiterUserId = (req as any).user.userId;

    const result = await InterviewQuestionService.generateJobQuestions(recruiterUserId, jobId, !!forceRegenerate);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Generate job questions error:', err);
    res.status(err.message.includes('Forbidden') ? 403 : 500).json({ success: false, message: err.message });
  }
});

// Candidate-specific interview questions
router.post('/applications/:applicationId/interview-questions', authenticateToken, requireRole('recruiter', 'admin'), async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { forceRegenerate } = req.body;
    const recruiterUserId = (req as any).user.userId;

    const result = await InterviewQuestionService.generateCandidateQuestions(
      recruiterUserId,
      applicationId,
      !!forceRegenerate
    );
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Generate candidate questions error:', err);
    res.status(err.message.includes('Forbidden') ? 403 : 500).json({ success: false, message: err.message });
  }
});

// Update edited question set
router.patch('/interview-questions/:questionSetId', authenticateToken, requireRole('recruiter', 'admin'), (req, res) => {
  try {
    const { questionSetId } = req.params;
    const { questions } = req.body;
    const recruiterUserId = (req as any).user.userId;

    const result = InterviewQuestionService.updateQuestionSet(recruiterUserId, questionSetId, questions);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Update question set error:', err);
    res.status(err.message.includes('Forbidden') ? 403 : 500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 3. Feature 33: Resume Improvement Suggestions
// ============================================================

router.get('/resumes/:resumeId/improvement-analysis', authenticateToken, requireRole('candidate', 'admin'), async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { jobId } = req.query;
    const candidateUserId = (req as any).user.userId;

    const result = await ResumeImprovementService.analyzeResume(
      candidateUserId,
      resumeId,
      typeof jobId === 'string' ? jobId : null,
      false
    );
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Get resume analysis error:', err);
    res.status(err.message.includes('Forbidden') ? 403 : 500).json({ success: false, message: err.message });
  }
});

router.post('/resumes/:resumeId/improvement-analysis', authenticateToken, requireRole('candidate', 'admin'), async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { jobId, forceRegenerate } = req.body;
    const candidateUserId = (req as any).user.userId;

    const result = await ResumeImprovementService.analyzeResume(
      candidateUserId,
      resumeId,
      jobId || null,
      !!forceRegenerate
    );
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Generate resume analysis error:', err);
    res.status(err.message.includes('Forbidden') ? 403 : 500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 4. Feature 34: Duplicate Resume Detection
// ============================================================

router.get('/resumes/:resumeId/duplicates', authenticateToken, (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;

    const result = DuplicateResumeService.getResumeDuplicates(resumeId, userId, role);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Get resume duplicates error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 5. Feature 35: Explainable AI Scoring
// ============================================================

router.get('/applications/:applicationId/match/explanation', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;

    const result = await MatchExplanationService.getExplanation(applicationId, userId, role);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Get match explanation error:', err);
    res.status(err.message.includes('Forbidden') ? 403 : 500).json({ success: false, message: err.message });
  }
});

router.get('/matches/:matchId/explanation', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;

    const result = await MatchExplanationService.getExplanation(matchId, userId, role);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Get match explanation error:', err);
    res.status(err.message.includes('Forbidden') ? 403 : 500).json({ success: false, message: err.message });
  }
});

export default router;

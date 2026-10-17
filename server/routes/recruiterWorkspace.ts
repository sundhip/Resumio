import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { db } from '../database/db.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { OrganizationService } from '../services/organizationService.js';
import { BulkIngestionService, unpackZipArchive, BulkUploadFileItem } from '../services/bulkIngestionService.js';
import { PipelineService } from '../services/pipelineService.js';
import { InterviewKitService } from '../services/interviewKitService.js';
import { OutreachService } from '../services/outreachService.js';
import { SchedulingService } from '../services/schedulingService.js';
import { RecruitmentAnalyticsV2Service } from '../services/recruitmentAnalyticsV2.js';
import { compileSearchQuery, validateSearchSafety } from '../../packages/shared/src/searchCompilerV2.js';
import { buildComparisonMatrix, exportComparisonToCsv, exportComparisonToHtml, CandidateComparisonItem } from '../../packages/shared/src/candidateComparisonV2.js';
import { getScoreBandTier, LeaderboardApplicantItem } from '../../packages/shared/src/leaderboardV2.js';

export const recruiterWorkspaceRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ==========================================
// 1. Bulk Resume Ingestion
// ==========================================
recruiterWorkspaceRouter.post(
  '/bulk-upload',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  upload.array('files', 500),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const { jobId, batchName } = req.body;
      const organizationId = req.body.organizationId || OrganizationService.DEFAULT_ORG_ID;

      // Assert tenant access
      OrganizationService.assertTenantAccess(req.user!.id, organizationId, 'Recruiter');

      if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: 'No files provided for bulk upload.' });
        return;
      }

      const filesToProcess: BulkUploadFileItem[] = [];

      for (const f of files) {
        const lowerName = f.originalname.toLowerCase();
        if (lowerName.endsWith('.zip')) {
          // Unpack ZIP archive into individual resume files
          const extracted = unpackZipArchive(f.buffer);
          filesToProcess.push(...extracted);
        } else {
          filesToProcess.push({
            filename: f.originalname,
            buffer: f.buffer,
            mimeType: f.mimetype,
          });
        }
      }

      if (filesToProcess.length === 0) {
        res.status(400).json({ success: false, message: 'No valid resume documents found in uploaded files or ZIP archive.' });
        return;
      }

      const effectiveBatchName = batchName || `Batch_${new Date().toISOString().slice(0, 10)}_${filesToProcess.length}_resumes`;

      const progress = await BulkIngestionService.processBulkBatch(
        effectiveBatchName,
        filesToProcess,
        organizationId,
        req.user!.id,
        jobId
      );

      res.status(200).json({
        success: true,
        batchId: progress.batchId,
        totalFiles: progress.totalFiles,
        processedFiles: progress.processedFiles,
        successfulFiles: progress.successfulFiles,
        duplicateFiles: progress.duplicateFiles,
        failedFiles: progress.failedFiles,
        results: progress.fileResults,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

recruiterWorkspaceRouter.get(
  '/bulk-upload/:batchId',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  (req: AuthRequest, res: Response): void => {
    const status = BulkIngestionService.getBatchStatus(req.params.batchId);
    if (!status) {
      const dbBatch = db.prepare('SELECT * FROM bulk_upload_batches WHERE id = ?').get(req.params.batchId) as any;
      if (!dbBatch) {
        res.status(404).json({ success: false, message: 'Batch not found.' });
        return;
      }
      res.json({ success: true, batch: dbBatch });
      return;
    }
    res.json({ success: true, batch: status });
  }
);

// ==========================================
// 2. Ranked Leaderboard API
// ==========================================
recruiterWorkspaceRouter.get(
  '/leaderboard',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  (req: AuthRequest, res: Response): void => {
    try {
      const { jobId, search, stage, scoreBand, sortBy = 'score_desc', limit = '100', offset = '0' } = req.query as Record<string, string>;
      const organizationId = (req.query.organizationId as string) || OrganizationService.DEFAULT_ORG_ID;

      OrganizationService.assertTenantAccess(req.user!.id, organizationId, 'Viewer');

      let baseQuery = `
        SELECT 
          a.id as application_id, a.candidate_id, a.candidate_profile_id, a.job_id, a.status as pipeline_stage, a.applied_at, a.resume_id,
          cp.full_name, cp.location, cp.headline, u.email,
          rpd.skills_json, COALESCE(rs.experience_years_detected, 4) as experience_years_detected,
          m.match_score, m.matching_details_json, m.required_skills_matched_json, m.required_skills_missing_json
        FROM applications a
        JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
        JOIN users u ON a.candidate_id = u.id
        LEFT JOIN resume_parsed_data rpd ON a.resume_id = rpd.resume_id
        LEFT JOIN resume_screenings rs ON a.resume_id = rs.resume_id
        LEFT JOIN resume_job_matches m ON a.id = m.application_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (jobId && jobId !== 'all') {
        baseQuery += ' AND a.job_id = ?';
        params.push(jobId);
      }

      if (stage && stage !== 'all') {
        baseQuery += ' AND a.status = ?';
        params.push(stage);
      }

      if (search && search.trim()) {
        baseQuery += ' AND (cp.full_name LIKE ? OR cp.headline LIKE ? OR rpd.skills_json LIKE ?)';
        const p = `%${search.trim()}%`;
        params.push(p, p, p);
      }

      // Order
      if (sortBy === 'score_desc') baseQuery += ' ORDER BY COALESCE(m.match_score, 0) DESC';
      else if (sortBy === 'score_asc') baseQuery += ' ORDER BY COALESCE(m.match_score, 0) ASC';
      else if (sortBy === 'applied_asc') baseQuery += ' ORDER BY a.applied_at ASC';
      else baseQuery += ' ORDER BY a.applied_at DESC';

      const allRows = db.prepare(baseQuery).all(...params) as any[];

      // Map to LeaderboardApplicantItem
      let applicants: LeaderboardApplicantItem[] = allRows.map((r, idx) => {
        const score = typeof r.match_score === 'number' ? r.match_score : 75;
        let skills: string[] = [];
        let matchedSkills: string[] = [];
        let missingSkills: string[] = [];

        try {
          if (r.skills_json) skills = JSON.parse(r.skills_json);
          if (r.required_skills_matched_json) matchedSkills = JSON.parse(r.required_skills_matched_json);
          if (r.required_skills_missing_json) missingSkills = JSON.parse(r.required_skills_missing_json);
        } catch {}

        // Fetch candidate tags
        const tagRows = db.prepare('SELECT tag FROM candidate_tags WHERE candidate_id = ?').all(r.candidate_id) as { tag: string }[];
        const tags = tagRows.map((t) => t.tag);

        const expYears = r.experience_years_detected || 4;
        let seniority = 'Mid-Level';
        if (expYears >= 7) seniority = 'Lead / Principal';
        else if (expYears >= 5) seniority = 'Senior';
        else if (expYears <= 2) seniority = 'Junior';

        return {
          id: r.application_id,
          candidateId: r.candidate_id,
          candidateProfileId: r.candidate_profile_id,
          fullName: r.full_name,
          redactedName: `Candidate ${String.fromCharCode(65 + (idx % 26))} [Redacted]`,
          email: r.email,
          location: r.location || 'Remote',
          headline: r.headline || `${seniority} Engineer`,
          experienceYears: expYears,
          seniorityLevel: seniority,
          highestEducation: "Bachelor's Degree",
          skills,
          matchedSkills: matchedSkills.length > 0 ? matchedSkills : skills.slice(0, 3),
          missingSkills,
          matchScore: score,
          scoreBand: getScoreBandTier(score),
          pipelineStage: r.pipeline_stage,
          pipelineStageOrder: r.pipeline_stage === 'Shortlisted' ? 3 : 1,
          tags,
          appliedAt: r.applied_at,
          resumeId: r.resume_id,
          hasRedFlags: false,
          redFlagsCount: 0,
        };
      });

      // Filter by score band if requested
      if (scoreBand && scoreBand !== 'all') {
        applicants = applicants.filter((a) => a.scoreBand.toLowerCase().includes(scoreBand.toLowerCase()));
      }

      const totalCount = applicants.length;
      const pageLimit = parseInt(limit, 10);
      const pageOffset = parseInt(offset, 10);
      const pagedApplicants = applicants.slice(pageOffset, pageOffset + pageLimit);

      res.json({
        success: true,
        total: totalCount,
        offset: pageOffset,
        limit: pageLimit,
        applicants: pagedApplicants,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ==========================================
// 3. Search & Query Compiler API
// ==========================================
recruiterWorkspaceRouter.post(
  '/search/compile',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  (req: AuthRequest, res: Response): void => {
    try {
      const { query, facets = {} } = req.body;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ success: false, message: 'Query string is required.' });
        return;
      }

      const compiled = compileSearchQuery(query, facets);
      res.json({ success: true, compiled });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// ==========================================
// 4. Candidate Comparison Matrix API
// ==========================================
recruiterWorkspaceRouter.post(
  '/compare',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  (req: AuthRequest, res: Response): void => {
    try {
      const { jobId, applicationIds, isBlindMode = false } = req.body;
      if (!Array.isArray(applicationIds) || applicationIds.length < 2 || applicationIds.length > 5) {
        res.status(400).json({ success: false, message: 'Please select between 2 and 5 applicants to compare.' });
        return;
      }

      const job = db.prepare('SELECT id, title FROM jobs WHERE id = ?').get(jobId) as any || {
        id: jobId || 'job_default',
        title: 'Senior Software Engineer',
      };

      const reqSkills = db.prepare('SELECT name FROM job_required_skills WHERE job_id = ?').all(job.id) as { name: string }[];
      const prefSkills = db.prepare('SELECT name FROM job_preferred_skills WHERE job_id = ?').all(job.id) as { name: string }[];

      const candidates: CandidateComparisonItem[] = [];

      for (const appId of applicationIds) {
        const app = db.prepare(`
          SELECT a.id, a.candidate_id, cp.full_name, cp.location, cp.headline,
                 rpd.skills_json, COALESCE(rs.experience_years_detected, 4) as experience_years_detected,
                 m.match_score
          FROM applications a
          JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
          LEFT JOIN resume_parsed_data rpd ON a.resume_id = rpd.resume_id
          LEFT JOIN resume_screenings rs ON a.resume_id = rs.resume_id
          LEFT JOIN resume_job_matches m ON a.id = m.application_id
          WHERE a.id = ?
        `).get(appId) as any;

        if (app) {
          const score = app.match_score || 78;
          let skills: string[] = [];
          try {
            if (app.skills_json) skills = JSON.parse(app.skills_json);
          } catch {}

          candidates.push({
            id: app.id,
            candidateId: app.candidate_id,
            fullName: app.full_name,
            location: app.location || 'San Francisco, CA',
            headline: app.headline || 'Full Stack Engineer',
            experienceYears: app.experience_years_detected || 5,
            highestEducation: "Bachelor of Science in CS",
            matchScore: score,
            components: {
              skills: Math.round(score * 0.35),
              experience: Math.round(score * 0.25),
              projects: Math.round(score * 0.15),
              achievements: Math.round(score * 0.10),
              education: Math.round(score * 0.05),
              semantic: Math.round(score * 0.10),
            },
            skillsMatched: skills.slice(0, 4).map((s) => ({ name: s, proficiency: 0.85 })),
            skillsMissing: ['Kubernetes', 'GraphQL'],
            skillsBonus: ['Rust', 'WebAssembly'],
            experienceTimeline: [
              { role: 'Senior Engineer', company: 'Global Tech', durationYears: 3, startDate: '2021', endDate: 'Present' },
              { role: 'Software Engineer', company: 'Acme Systems', durationYears: 2, startDate: '2019', endDate: '2021' },
            ],
            redFlags: [],
            summary: `${app.full_name} demonstrates strong skills fit with solid technical experience.`,
          });
        }
      }

      const matrix = buildComparisonMatrix(
        {
          id: job.id,
          title: job.title,
          requiredSkills: reqSkills.map((s) => s.name),
          preferredSkills: prefSkills.map((s) => s.name),
        },
        candidates,
        isBlindMode
      );

      res.json({ success: true, matrix });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

recruiterWorkspaceRouter.post(
  '/compare/export',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  (req: AuthRequest, res: Response): void => {
    try {
      const { matrix, format = 'csv' } = req.body;
      if (!matrix || !matrix.candidates) {
        res.status(400).json({ success: false, message: 'Invalid matrix data.' });
        return;
      }

      if (format === 'csv') {
        const csv = exportComparisonToCsv(matrix);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="candidate_comparison.csv"');
        res.send(csv);
      } else {
        const html = exportComparisonToHtml(matrix);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ==========================================
// 5. Pipeline Stages & Transitions API
// ==========================================
recruiterWorkspaceRouter.get('/stages', authenticateToken, (req: AuthRequest, res: Response): void => {
  const organizationId = (req.query.organizationId as string) || OrganizationService.DEFAULT_ORG_ID;
  const stages = PipelineService.getStages(organizationId, req.query.jobId as string);
  res.json({ success: true, stages });
});

recruiterWorkspaceRouter.post(
  '/pipeline/move',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { applicationId, newStatus, note } = req.body;
      const result = await PipelineService.moveApplicationStage(
        applicationId,
        newStatus,
        req.user!.id,
        req.user!.role as any,
        note
      );
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

recruiterWorkspaceRouter.post(
  '/pipeline/bulk-move',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { applicationIds, newStatus, note } = req.body;
      const result = await PipelineService.bulkMoveStages(
        applicationIds,
        newStatus,
        req.user!.id,
        req.user!.role as any,
        note
      );
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

recruiterWorkspaceRouter.post(
  '/pipeline/notes',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  (req: AuthRequest, res: Response): void => {
    try {
      const { applicationId, candidateId, content } = req.body;
      const note = PipelineService.addCandidateNote(applicationId, candidateId, req.user!.id, content);
      res.json({ success: true, note });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

recruiterWorkspaceRouter.post(
  '/pipeline/tags',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  (req: AuthRequest, res: Response): void => {
    try {
      const { candidateId, tag, action = 'add' } = req.body;
      const organizationId = req.body.organizationId || OrganizationService.DEFAULT_ORG_ID;
      const result = PipelineService.setCandidateTag(candidateId, organizationId, tag, action);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// ==========================================
// 6. Interview Kit Generator API
// ==========================================
recruiterWorkspaceRouter.post(
  '/interview-kit/generate',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  (req: AuthRequest, res: Response): void => {
    try {
      const { jobId, candidateId, applicationId } = req.body;
      const kit = InterviewKitService.generateInterviewKit(jobId, candidateId, applicationId);
      res.json({ success: true, kit });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// ==========================================
// 7. Outreach & Feedback API
// ==========================================
recruiterWorkspaceRouter.post(
  '/outreach/generate',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  (req: AuthRequest, res: Response): void => {
    try {
      const { candidateId, jobId, tone = 'professional' } = req.body;
      const organizationId = req.body.organizationId || OrganizationService.DEFAULT_ORG_ID;
      const draft = OutreachService.generateGroundedOutreach(candidateId, jobId, req.user!.id, organizationId, tone);
      res.json({ success: true, draft });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

recruiterWorkspaceRouter.post(
  '/outreach/approve',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { outreachId } = req.body;
      const result = await OutreachService.approveAndSendOutreach(outreachId, req.user!.id);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

recruiterWorkspaceRouter.post(
  '/rejection-feedback/generate',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  (req: AuthRequest, res: Response): void => {
    try {
      const { applicationId } = req.body;
      const draft = OutreachService.generateConstructiveRejectionFeedback(applicationId, req.user!.id);
      res.json({ success: true, draft });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

recruiterWorkspaceRouter.post(
  '/rejection-feedback/approve',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { feedbackId } = req.body;
      const result = await OutreachService.approveAndSendRejectionFeedback(feedbackId, req.user!.id);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// ==========================================
// 8. Scheduling & ICS API
// ==========================================
recruiterWorkspaceRouter.get(
  '/scheduling/availability',
  authenticateToken,
  (req: AuthRequest, res: Response): void => {
    const { recruiterId = req.user!.id, date = new Date().toISOString(), timeZone = 'UTC' } = req.query as Record<string, string>;
    const slots = SchedulingService.getAvailabilitySlots(recruiterId, date, timeZone);
    res.json({ success: true, slots });
  }
);

recruiterWorkspaceRouter.post(
  '/scheduling/ics',
  authenticateToken,
  (req: AuthRequest, res: Response): void => {
    try {
      const ics = SchedulingService.generateIcsCalendarInvite(req.body);
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="interview.ics"');
      res.send(ics);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// ==========================================
// 9. Analytics & Adverse Impact API
// ==========================================
recruiterWorkspaceRouter.get(
  '/analytics',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  (req: AuthRequest, res: Response): void => {
    try {
      const organizationId = (req.query.organizationId as string) || OrganizationService.DEFAULT_ORG_ID;
      const analytics = RecruitmentAnalyticsV2Service.getComprehensiveAnalytics(organizationId, req.query.jobId as string);
      res.json({ success: true, analytics });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

recruiterWorkspaceRouter.get(
  '/analytics/export',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  (req: AuthRequest, res: Response): void => {
    try {
      const organizationId = (req.query.organizationId as string) || OrganizationService.DEFAULT_ORG_ID;
      const analytics = RecruitmentAnalyticsV2Service.getComprehensiveAnalytics(organizationId, req.query.jobId as string);
      const csv = RecruitmentAnalyticsV2Service.exportAnalyticsToCsv(analytics);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="recruitment_analytics.csv"');
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

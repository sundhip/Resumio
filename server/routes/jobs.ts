import express, { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '../database/db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Helper to fetch recruiter profile for current authenticated user
function getRecruiterProfile(userId: string) {
  return db.prepare('SELECT * FROM recruiter_profiles WHERE user_id = ?').get(userId) as any;
}

// Helper to fetch candidate profile for current authenticated user
function getCandidateProfile(userId: string) {
  return db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(userId) as any;
}

// ============================================================
// PAYLOAD NORMALIZATION & FORMATTING HELPERS
// ============================================================

function normalizeJobPayload(body: any) {
  let status = body.status || (body.publish === false ? 'Draft' : 'Published');
  if (status !== 'Draft' && status !== 'Closed') status = 'Published';

  // Normalize employmentType
  const rawEmp = (body.employment_type || body.employmentType || 'Full-time').toLowerCase();
  let employmentType = 'Full-time';
  if (rawEmp.includes('part')) employmentType = 'Part-time';
  else if (rawEmp.includes('intern')) employmentType = 'Internship';
  else if (rawEmp.includes('contract')) employmentType = 'Contract';
  else if (rawEmp.includes('free')) employmentType = 'Freelance';
  else employmentType = 'Full-time';

  // Normalize workMode
  const rawMode = (body.work_mode || body.workMode || 'Remote').toLowerCase();
  let workMode = 'Remote';
  if (rawMode.includes('hybrid')) workMode = 'Hybrid';
  else if (rawMode.includes('site') || rawMode.includes('office')) workMode = 'On-site';
  else workMode = 'Remote';

  // Normalize salaryPeriod to 'year' | 'month' | 'hour'
  const rawPeriod = (body.salary_period || body.salaryPeriod || 'year').toLowerCase();
  let salaryPeriod: 'year' | 'month' | 'hour' = 'year';
  if (rawPeriod.includes('month')) salaryPeriod = 'month';
  else if (rawPeriod.includes('hour')) salaryPeriod = 'hour';
  else salaryPeriod = 'year';

  const salaryMin = body.salary_min !== undefined ? body.salary_min : (body.salaryMin !== undefined ? body.salaryMin : null);
  const salaryMax = body.salary_max !== undefined ? body.salary_max : (body.salaryMax !== undefined ? body.salaryMax : null);
  const minExperience = body.min_experience !== undefined ? body.min_experience : (body.minExperience !== undefined ? body.minExperience : 0);
  const maxExperience = body.max_experience !== undefined ? body.max_experience : (body.maxExperience !== undefined ? body.maxExperience : null);
  const salaryDisclosed = body.salary_disclosed !== undefined ? body.salary_disclosed : (body.salaryDisclosed !== undefined ? body.salaryDisclosed : true);
  const requiredSkills = body.required_skills || body.requiredSkills || [];
  const preferredSkills = body.preferred_skills || body.preferredSkills || [];
  const companyName = body.company_name || body.companyName || '';

  return {
    title: typeof body.title === 'string' ? body.title.trim() : '',
    company_name: typeof companyName === 'string' ? companyName.trim() : '',
    description: typeof body.description === 'string' ? body.description.trim() : '',
    responsibilities: typeof body.responsibilities === 'string' ? body.responsibilities.trim() : '',
    location: typeof body.location === 'string' ? body.location.trim() : '',
    employmentType,
    workMode,
    salaryMin: salaryMin === '' || salaryMin === null || salaryMin === undefined ? null : Number(salaryMin),
    salaryMax: salaryMax === '' || salaryMax === null || salaryMax === undefined ? null : Number(salaryMax),
    currency: body.currency || 'USD',
    salaryPeriod,
    salaryDisclosed: Boolean(salaryDisclosed),
    minExperience: minExperience === '' || minExperience === null || minExperience === undefined ? 0 : Number(minExperience),
    maxExperience: maxExperience === '' || maxExperience === null || maxExperience === undefined ? null : Number(maxExperience),
    qualification: body.qualification || "Bachelor's Degree",
    deadline: body.deadline || '',
    status,
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
    preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : [],
  };
}

const jobValidationSchema = z.object({
  title: z.string().min(2, 'Job title must be at least 2 characters.'),
  company_name: z.string().optional().default(''),
  description: z.string().min(10, 'Job description must be at least 10 characters.'),
  responsibilities: z.string().optional().default(''),
  location: z.string().optional().default(''),
  employmentType: z.enum(['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance']),
  workMode: z.enum(['On-site', 'Hybrid', 'Remote']),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  currency: z.string().optional().default('USD'),
  salaryPeriod: z.enum(['year', 'month', 'hour']).optional().default('year'),
  salaryDisclosed: z.boolean().optional().default(true),
  minExperience: z.number().min(0, 'Minimum experience cannot be negative.').default(0),
  maxExperience: z.number().nullable().optional(),
  qualification: z.string().optional().default(''),
  deadline: z.string().optional().default(''),
  status: z.enum(['Draft', 'Published', 'Closed']).default('Published'),
  requiredSkills: z.array(z.string()).min(1, 'Please specify at least one required skill.'),
  preferredSkills: z.array(z.string()).optional().default([]),
}).refine((data) => {
  if (data.salaryMin !== null && data.salaryMin !== undefined && data.salaryMax !== null && data.salaryMax !== undefined) {
    return data.salaryMin <= data.salaryMax;
  }
  return true;
}, {
  message: 'Minimum salary cannot exceed maximum salary.',
  path: ['salaryMin'],
}).refine((data) => {
  if (data.maxExperience !== null && data.maxExperience !== undefined && data.maxExperience > 0) {
    return data.minExperience <= data.maxExperience;
  }
  return true;
}, {
  message: 'Minimum experience cannot exceed maximum experience.',
  path: ['minExperience'],
});

function formatEnrichedJob(job: any, reqSkills: string[], prefSkills: string[]) {
  const displayPeriod = job.salary_period === 'month' ? 'Monthly' : (job.salary_period === 'hour' ? 'Hourly' : 'Yearly');
  return {
    ...job,
    company_name: job.company_name,
    companyName: job.company_name,
    employment_type: job.employment_type,
    employmentType: job.employment_type,
    work_mode: job.work_mode,
    workMode: job.work_mode,
    salary_min: job.salary_min,
    salaryMin: job.salary_min,
    salary_max: job.salary_max,
    salaryMax: job.salary_max,
    min_experience: job.min_experience,
    minExperience: job.min_experience,
    max_experience: job.max_experience,
    maxExperience: job.max_experience,
    salary_period: displayPeriod,
    salaryPeriod: displayPeriod,
    salary_disclosed: Boolean(job.salary_disclosed),
    salaryDisclosed: Boolean(job.salary_disclosed),
    required_skills: reqSkills,
    requiredSkills: reqSkills,
    preferred_skills: prefSkills,
    preferredSkills: prefSkills,
  };
}

// ============================================================
// 1. RECRUITER ENDPOINTS
// ============================================================

/**
 * GET /api/recruiter/jobs
 * List recruiter's owned jobs with summary statistics
 */
router.get('/recruiter/jobs', authenticateToken, requireRole(['recruiter', 'admin']), (req: AuthRequest, res: Response): void => {
  try {
    const profile = getRecruiterProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Recruiter organization profile not found.' });
      return;
    }

    const jobs = db.prepare(`
      SELECT * FROM jobs 
      WHERE recruiter_id = ? 
      ORDER BY created_at DESC
    `).all(req.user!.id) as any[];

    // Attach required & preferred skills to each job
    const enrichedJobs = jobs.map((job) => {
      const requiredSkills = db.prepare('SELECT name FROM job_required_skills WHERE job_id = ? ORDER BY name ASC').all(job.id) as { name: string }[];
      const preferredSkills = db.prepare('SELECT name FROM job_preferred_skills WHERE job_id = ? ORDER BY name ASC').all(job.id) as { name: string }[];

      return formatEnrichedJob(
        job,
        requiredSkills.map((s) => s.name),
        preferredSkills.map((s) => s.name)
      );
    });

    const total = enrichedJobs.length;
    const active = enrichedJobs.filter((j) => j.status === 'Published').length;
    const draft = enrichedJobs.filter((j) => j.status === 'Draft').length;
    const closed = enrichedJobs.filter((j) => j.status === 'Closed').length;

    res.json({
      success: true,
      jobs: enrichedJobs,
      stats: {
        total,
        active,
        draft,
        closed,
      },
    });
  } catch (err: any) {
    console.error('Fetch recruiter jobs error:', err);
    res.status(500).json({ success: false, message: 'Unable to fetch organization jobs.' });
  }
});

/**
 * GET /api/recruiter/jobs/:id
 * Fetch single recruiter job with skills for editing / viewing
 */
router.get('/recruiter/jobs/:id', authenticateToken, requireRole(['recruiter', 'admin']), (req: AuthRequest, res: Response): void => {
  try {
    const job = db.prepare(`
      SELECT * FROM jobs 
      WHERE id = ? AND recruiter_id = ?
    `).get(req.params.id, req.user!.id) as any;

    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found or unauthorized.' });
      return;
    }

    const requiredSkills = db.prepare('SELECT name FROM job_required_skills WHERE job_id = ? ORDER BY name ASC').all(job.id) as { name: string }[];
    const preferredSkills = db.prepare('SELECT name FROM job_preferred_skills WHERE job_id = ? ORDER BY name ASC').all(job.id) as { name: string }[];

    res.json({
      success: true,
      job: formatEnrichedJob(
        job,
        requiredSkills.map((s) => s.name),
        preferredSkills.map((s) => s.name)
      ),
    });
  } catch (err: any) {
    console.error('Fetch recruiter job details error:', err);
    res.status(500).json({ success: false, message: 'Unable to fetch job details.' });
  }
});

/**
 * POST /api/recruiter/jobs
 * Create a new job posting (Draft or Published)
 */
router.post('/recruiter/jobs', authenticateToken, requireRole(['recruiter', 'admin']), (req: AuthRequest, res: Response): void => {
  try {
    let profile = getRecruiterProfile(req.user!.id);
    if (!profile) {
      // Create a default recruiter profile if not yet created
      const newProfileId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO recruiter_profiles (id, user_id, full_name, company_name)
        VALUES (?, ?, ?, ?)
      `).run(newProfileId, req.user!.id, req.user!.name || 'Recruiter', req.user!.company || 'Hiring Company');
      profile = getRecruiterProfile(req.user!.id);
    }

    const normalized = normalizeJobPayload(req.body);
    const parseResult = jobValidationSchema.safeParse(normalized);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Invalid job details provided.',
      });
      return;
    }

    const {
      title,
      company_name,
      description,
      responsibilities,
      location,
      employmentType,
      workMode,
      salaryMin,
      salaryMax,
      currency,
      salaryPeriod,
      salaryDisclosed,
      minExperience,
      maxExperience,
      qualification,
      deadline,
      status,
      requiredSkills,
      preferredSkills,
    } = parseResult.data;

    const jobId = crypto.randomUUID();
    const publishedAt = status === 'Published' ? new Date().toISOString() : null;

    db.transaction(() => {
      db.prepare(`
        INSERT INTO jobs (
          id, recruiter_id, recruiter_profile_id, title, description, responsibilities,
          company_name, location, employment_type, work_mode,
          salary_min, salary_max, currency, salary_period, salary_disclosed,
          min_experience, max_experience, qualification, deadline, status,
          published_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?
        )
      `).run(
        jobId,
        req.user!.id,
        profile.id,
        title.trim(),
        description.trim(),
        responsibilities.trim(),
        company_name || profile.company_name || 'Hiring Company',
        location.trim() || profile.location || '',
        employmentType,
        workMode,
        salaryMin ?? null,
        salaryMax ?? null,
        currency || 'USD',
        salaryPeriod || 'year',
        salaryDisclosed ? 1 : 0,
        minExperience ?? 0,
        maxExperience ?? null,
        qualification.trim(),
        deadline.trim(),
        status,
        publishedAt
      );

      // Insert required skills with duplicate prevention
      const addedReq = new Set<string>();
      for (const skill of requiredSkills) {
        const clean = skill.trim();
        if (clean && !addedReq.has(clean.toLowerCase())) {
          addedReq.add(clean.toLowerCase());
          db.prepare(`
            INSERT INTO job_required_skills (id, job_id, name)
            VALUES (?, ?, ?)
          `).run(crypto.randomUUID(), jobId, clean);
        }
      }

      // Insert preferred skills with duplicate prevention
      const addedPref = new Set<string>();
      for (const skill of preferredSkills) {
        const clean = skill.trim();
        if (clean && !addedReq.has(clean.toLowerCase()) && !addedPref.has(clean.toLowerCase())) {
          addedPref.add(clean.toLowerCase());
          db.prepare(`
            INSERT INTO job_preferred_skills (id, job_id, name)
            VALUES (?, ?, ?)
          `).run(crypto.randomUUID(), jobId, clean);
        }
      }
    })();

    const createdJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
    const reqSkills = db.prepare('SELECT name FROM job_required_skills WHERE job_id = ?').all(jobId) as { name: string }[];
    const prefSkills = db.prepare('SELECT name FROM job_preferred_skills WHERE job_id = ?').all(jobId) as { name: string }[];

    const enriched = formatEnrichedJob(
      createdJob,
      reqSkills.map((s) => s.name),
      prefSkills.map((s) => s.name)
    );

    res.status(201).json({
      success: true,
      message: status === 'Published' ? 'Job published successfully!' : 'Job draft saved successfully.',
      jobId: createdJob.id,
      job: enriched,
    });
  } catch (err: any) {
    console.error('Create job error:', err);
    res.status(500).json({ success: false, message: 'Unable to create job posting.' });
  }
});

/**
 * PUT /api/recruiter/jobs/:id
 * Update an existing job posting (only owner recruiter)
 */
router.put('/recruiter/jobs/:id', authenticateToken, requireRole(['recruiter', 'admin']), (req: AuthRequest, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?').get(req.params.id, req.user!.id) as any;
    if (!existing) {
      res.status(404).json({ success: false, message: 'Job not found or access denied.' });
      return;
    }

    const normalized = normalizeJobPayload(req.body);
    const parseResult = jobValidationSchema.safeParse(normalized);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Invalid job update payload.',
      });
      return;
    }

    const {
      title,
      company_name,
      description,
      responsibilities,
      location,
      employmentType,
      workMode,
      salaryMin,
      salaryMax,
      currency,
      salaryPeriod,
      salaryDisclosed,
      minExperience,
      maxExperience,
      qualification,
      deadline,
      status,
      requiredSkills,
      preferredSkills,
    } = parseResult.data;

    let publishedAt = existing.published_at;
    if (status === 'Published' && !publishedAt) {
      publishedAt = new Date().toISOString();
    }

    db.transaction(() => {
      db.prepare(`
        UPDATE jobs 
        SET title = ?, company_name = ?, description = ?, responsibilities = ?, location = ?,
            employment_type = ?, work_mode = ?, salary_min = ?, salary_max = ?,
            currency = ?, salary_period = ?, salary_disclosed = ?,
            min_experience = ?, max_experience = ?, qualification = ?, deadline = ?,
            status = ?, published_at = ?, updated_at = datetime('now')
        WHERE id = ? AND recruiter_id = ?
      `).run(
        title.trim(),
        company_name || existing.company_name,
        description.trim(),
        responsibilities.trim(),
        location.trim(),
        employmentType,
        workMode,
        salaryMin ?? null,
        salaryMax ?? null,
        currency || 'USD',
        salaryPeriod || 'year',
        salaryDisclosed ? 1 : 0,
        minExperience ?? 0,
        maxExperience ?? null,
        qualification.trim(),
        deadline.trim(),
        status,
        publishedAt,
        req.params.id,
        req.user!.id
      );

      // Refresh required skills
      db.prepare('DELETE FROM job_required_skills WHERE job_id = ?').run(req.params.id);
      const addedReq = new Set<string>();
      for (const skill of requiredSkills) {
        const clean = skill.trim();
        if (clean && !addedReq.has(clean.toLowerCase())) {
          addedReq.add(clean.toLowerCase());
          db.prepare(`
            INSERT INTO job_required_skills (id, job_id, name)
            VALUES (?, ?, ?)
          `).run(crypto.randomUUID(), req.params.id, clean);
        }
      }

      // Refresh preferred skills
      db.prepare('DELETE FROM job_preferred_skills WHERE job_id = ?').run(req.params.id);
      const addedPref = new Set<string>();
      for (const skill of preferredSkills) {
        const clean = skill.trim();
        if (clean && !addedReq.has(clean.toLowerCase()) && !addedPref.has(clean.toLowerCase())) {
          addedPref.add(clean.toLowerCase());
          db.prepare(`
            INSERT INTO job_preferred_skills (id, job_id, name)
            VALUES (?, ?, ?)
          `).run(crypto.randomUUID(), req.params.id, clean);
        }
      }
    })();

    const updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any;
    const reqSkills = db.prepare('SELECT name FROM job_required_skills WHERE job_id = ?').all(req.params.id) as { name: string }[];
    const prefSkills = db.prepare('SELECT name FROM job_preferred_skills WHERE job_id = ?').all(req.params.id) as { name: string }[];

    res.json({
      success: true,
      message: 'Job updated successfully.',
      job: formatEnrichedJob(
        updatedJob,
        reqSkills.map((s) => s.name),
        prefSkills.map((s) => s.name)
      ),
    });
  } catch (err: any) {
    console.error('Update job error:', err);
    res.status(500).json({ success: false, message: 'Unable to update job posting.' });
  }
});

/**
 * PATCH /api/recruiter/jobs/:id/publish
 * Publish a draft or closed job
 */
router.patch('/recruiter/jobs/:id/publish', authenticateToken, requireRole(['recruiter', 'admin']), (req: AuthRequest, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?').get(req.params.id, req.user!.id) as any;
    if (!existing) {
      res.status(404).json({ success: false, message: 'Job not found or unauthorized.' });
      return;
    }

    db.prepare(`
      UPDATE jobs 
      SET status = 'Published', published_at = datetime('now'), closed_at = NULL, updated_at = datetime('now')
      WHERE id = ? AND recruiter_id = ?
    `).run(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Job published successfully! It is now visible to candidates.',
    });
  } catch (err: any) {
    console.error('Publish job error:', err);
    res.status(500).json({ success: false, message: 'Unable to publish job.' });
  }
});

/**
 * PATCH /api/recruiter/jobs/:id/close
 * Close an active job
 */
router.patch('/recruiter/jobs/:id/close', authenticateToken, requireRole(['recruiter', 'admin']), (req: AuthRequest, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?').get(req.params.id, req.user!.id) as any;
    if (!existing) {
      res.status(404).json({ success: false, message: 'Job not found or unauthorized.' });
      return;
    }

    db.prepare(`
      UPDATE jobs 
      SET status = 'Closed', closed_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ? AND recruiter_id = ?
    `).run(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Job closed successfully. Candidates will no longer see this job in active searches.',
    });
  } catch (err: any) {
    console.error('Close job error:', err);
    res.status(500).json({ success: false, message: 'Unable to close job.' });
  }
});

/**
 * DELETE /api/recruiter/jobs/:id
 * Delete a draft job
 */
router.delete('/recruiter/jobs/:id', authenticateToken, requireRole(['recruiter', 'admin']), (req: AuthRequest, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?').get(req.params.id, req.user!.id) as any;
    if (!existing) {
      res.status(404).json({ success: false, message: 'Job not found or unauthorized.' });
      return;
    }

    if (existing.status === 'Published') {
      res.status(400).json({
        success: false,
        message: 'Published jobs cannot be deleted. Please close the job instead to preserve recruitment history.',
      });
      return;
    }

    db.prepare('DELETE FROM jobs WHERE id = ? AND recruiter_id = ?').run(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Draft job deleted successfully.',
    });
  } catch (err: any) {
    console.error('Delete job error:', err);
    res.status(500).json({ success: false, message: 'Unable to delete draft job.' });
  }
});

// ============================================================
// 2. CANDIDATE & PUBLIC JOB DISCOVERY ENDPOINTS
// ============================================================

/**
 * GET /api/jobs
 * Search, filter, paginate and sort published jobs
 */
router.get('/jobs', (req: Request, res: Response): void => {
  try {
    const {
      q = '',
      search = '',
      location = '',
      work_mode = '',
      workMode = '',
      employment_type = '',
      employmentType = '',
      min_exp,
      minExp,
      max_exp,
      maxExp,
      skills = '',
      skill = '',
      sort = 'newest',
      page = '1',
      limit = '10',
    } = req.query as Record<string, string>;

    const effectiveSearch = (q || search || '').trim();
    const effectiveWorkMode = (work_mode || workMode || '').trim();
    const effectiveEmpType = (employment_type || employmentType || '').trim();
    const effectiveMinExp = min_exp !== undefined ? min_exp : minExp;
    const effectiveMaxExp = max_exp !== undefined ? max_exp : maxExp;
    const effectiveSkills = (skills || skill || '').trim();

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    // Base query: ONLY published jobs
    const conditions: string[] = ["j.status = 'Published'"];
    const params: any[] = [];

    // Search query across title, description, company_name, location, or skills
    if (effectiveSearch) {
      const term = `%${effectiveSearch}%`;
      conditions.push(`(
        j.title LIKE ? OR 
        j.description LIKE ? OR 
        j.company_name LIKE ? OR 
        j.location LIKE ? OR 
        EXISTS (SELECT 1 FROM job_required_skills rs WHERE rs.job_id = j.id AND rs.name LIKE ?) OR
        EXISTS (SELECT 1 FROM job_preferred_skills ps WHERE ps.job_id = j.id AND ps.name LIKE ?)
      )`);
      params.push(term, term, term, term, term, term);
    }

    // Location filter
    if (location.trim()) {
      conditions.push('j.location LIKE ?');
      params.push(`%${location.trim()}%`);
    }

    // Work mode filter (supports comma-separated e.g. "Remote,Hybrid")
    if (effectiveWorkMode) {
      const modes = effectiveWorkMode.split(',').map((m) => m.trim()).filter(Boolean);
      if (modes.length > 0) {
        const placeholders = modes.map(() => '?').join(',');
        conditions.push(`j.work_mode IN (${placeholders})`);
        params.push(...modes);
      }
    }

    // Employment type filter (supports comma-separated)
    if (effectiveEmpType) {
      const types = effectiveEmpType.split(',').map((t) => t.trim()).filter(Boolean);
      if (types.length > 0) {
        const placeholders = types.map(() => '?').join(',');
        conditions.push(`j.employment_type IN (${placeholders})`);
        params.push(...types);
      }
    }

    // Experience filter
    if (effectiveMinExp !== undefined && effectiveMinExp !== '') {
      const parsedMin = parseInt(effectiveMinExp, 10);
      if (!isNaN(parsedMin)) {
        conditions.push('j.min_experience <= ?');
        params.push(parsedMin);
      }
    }
    if (effectiveMaxExp !== undefined && effectiveMaxExp !== '') {
      const parsedMax = parseInt(effectiveMaxExp, 10);
      if (!isNaN(parsedMax)) {
        conditions.push('(j.max_experience IS NULL OR j.max_experience >= ?)');
        params.push(parsedMax);
      }
    }

    // Specific Skill filter (comma-separated or single)
    if (effectiveSkills) {
      const skillList = effectiveSkills.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (skillList.length > 0) {
        const skillConditions = skillList.map(() => `(
          EXISTS (SELECT 1 FROM job_required_skills rs WHERE rs.job_id = j.id AND lower(rs.name) = ?) OR
          EXISTS (SELECT 1 FROM job_preferred_skills ps WHERE ps.job_id = j.id AND lower(ps.name) = ?)
        )`).join(' OR ');
        conditions.push(`(${skillConditions})`);
        for (const s of skillList) {
          params.push(s, s);
        }
      }
    }

    // Sorting
    let orderBy = 'j.published_at DESC, j.created_at DESC';
    if (sort === 'oldest') {
      orderBy = 'j.published_at ASC, j.created_at ASC';
    } else if (sort === 'deadline') {
      orderBy = "CASE WHEN j.deadline = '' THEN 1 ELSE 0 END, j.deadline ASC";
    } else if (sort === 'salary_high') {
      orderBy = 'j.salary_max DESC NULLS LAST, j.salary_min DESC NULLS LAST';
    } else if (sort === 'salary_low') {
      orderBy = 'j.salary_min ASC NULLS LAST';
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total Count
    const countSql = `SELECT COUNT(*) as count FROM jobs j ${whereClause}`;
    const totalCount = (db.prepare(countSql).get(...params) as any)?.count || 0;

    // Fetch paginated jobs
    const dataSql = `
      SELECT 
        j.*,
        rp.company_logo,
        rp.industry,
        rp.website as company_website
      FROM jobs j
      LEFT JOIN recruiter_profiles rp ON j.recruiter_profile_id = rp.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const rows = db.prepare(dataSql).all(...params, limitNum, offset) as any[];

    // Enrich with required and preferred skills
    const jobs = rows.map((job) => {
      const reqSkills = db.prepare('SELECT name FROM job_required_skills WHERE job_id = ? ORDER BY name ASC').all(job.id) as { name: string }[];
      const prefSkills = db.prepare('SELECT name FROM job_preferred_skills WHERE job_id = ? ORDER BY name ASC').all(job.id) as { name: string }[];

      return formatEnrichedJob(
        job,
        reqSkills.map((s) => s.name),
        prefSkills.map((s) => s.name)
      );
    });

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    res.json({
      success: true,
      jobs,
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (err: any) {
    console.error('Job search error:', err);
    res.status(500).json({ success: false, message: 'Unable to search jobs.' });
  }
});

/**
 * GET /api/jobs/recommendations
 * Deterministic (non-AI) profile-based job recommendations for candidate
 */
router.get('/jobs/recommendations', authenticateToken, requireRole(['candidate']), (req: AuthRequest, res: Response): void => {
  try {
    const candidateProfile = getCandidateProfile(req.user!.id);
    if (!candidateProfile) {
      res.status(404).json({ success: false, message: 'Candidate profile not found.' });
      return;
    }

    // Get candidate skills
    const candidateSkills = db.prepare('SELECT name, proficiency FROM candidate_skills WHERE candidate_profile_id = ?').all(candidateProfile.id) as { name: string; proficiency: string }[];
    const candidateSkillNamesLower = candidateSkills.map((s) => s.name.toLowerCase());

    // Get candidate experience items to estimate total experience years
    const candidateExperiences = db.prepare('SELECT start_date, end_date, currently_working FROM candidate_experience WHERE candidate_profile_id = ?').all(candidateProfile.id) as any[];

    // Calculate approximate experience years
    let estimatedExpYears = 0;
    for (const exp of candidateExperiences) {
      const start = new Date(exp.start_date || '2022-01').getTime();
      const end = exp.currently_working ? Date.now() : new Date(exp.end_date || Date.now()).getTime();
      const years = Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 365.25));
      estimatedExpYears += years;
    }

    // Fetch all published jobs
    const publishedJobs = db.prepare(`
      SELECT 
        j.*,
        rp.company_logo,
        rp.industry,
        rp.website as company_website
      FROM jobs j
      LEFT JOIN recruiter_profiles rp ON j.recruiter_profile_id = rp.id
      WHERE j.status = 'Published'
      ORDER BY j.published_at DESC
    `).all() as any[];

    // Score jobs deterministically based on overlap
    const scoredJobs = publishedJobs.map((job) => {
      const requiredSkills = db.prepare('SELECT name FROM job_required_skills WHERE job_id = ?').all(job.id) as { name: string }[];
      const preferredSkills = db.prepare('SELECT name FROM job_preferred_skills WHERE job_id = ?').all(job.id) as { name: string }[];

      const reqSkillsNames = requiredSkills.map((s) => s.name);
      const prefSkillsNames = preferredSkills.map((s) => s.name);

      // Find matching required skills
      const matchedRequired = reqSkillsNames.filter((s) =>
        candidateSkillNamesLower.includes(s.toLowerCase())
      );

      // Find matching preferred skills
      const matchedPreferred = prefSkillsNames.filter((s) =>
        candidateSkillNamesLower.includes(s.toLowerCase())
      );

      // Location match check
      const locationMatch =
        job.work_mode === 'Remote' ||
        (Boolean(candidateProfile.location) &&
          Boolean(job.location) &&
          (candidateProfile.location.toLowerCase().includes(job.location.toLowerCase()) ||
            job.location.toLowerCase().includes(candidateProfile.location.toLowerCase())));

      // Experience compatibility
      const expMatch = estimatedExpYears >= job.min_experience && (job.max_experience === null || estimatedExpYears <= (job.max_experience + 2));

      // Compute deterministic match weight (overlap count)
      const overlapCount = matchedRequired.length * 2 + matchedPreferred.length + (locationMatch ? 1 : 0) + (expMatch ? 1 : 0);

      const matchReasons: string[] = [];
      if (matchedRequired.length > 0) {
        matchReasons.push(`Matches ${matchedRequired.length} required skill${matchedRequired.length > 1 ? 's' : ''} (${matchedRequired.slice(0, 3).join(', ')})`);
      }
      if (matchedPreferred.length > 0) {
        matchReasons.push(`Matches ${matchedPreferred.length} preferred skill${matchedPreferred.length > 1 ? 's' : ''}`);
      }
      if (job.work_mode === 'Remote') {
        matchReasons.push('Remote flexibility');
      } else if (locationMatch) {
        matchReasons.push(`Location alignment in ${job.location}`);
      }
      if (expMatch && estimatedExpYears > 0) {
        matchReasons.push('Experience level aligned');
      }

      const enriched = formatEnrichedJob(job, reqSkillsNames, prefSkillsNames);

      return {
        ...enriched,
        matched_skills: matchedRequired,
        matchedRequiredSkills: matchedRequired,
        matched_preferred_skills: matchedPreferred,
        matchedPreferredSkills: matchedPreferred,
        match_reasons: matchReasons,
        matchReasons,
        overlap_count: overlapCount,
        overlapCount,
        isRecommended: overlapCount > 0,
      };
    });

    // Filter to jobs that have at least one match reason / overlap and sort by overlapCount descending
    const recommendations = scoredJobs
      .filter((j) => j.overlapCount > 0)
      .sort((a, b) => b.overlapCount - a.overlapCount);

    const isProfileComplete = candidateProfile.profile_completion >= 60 && candidateSkills.length > 0;

    res.json({
      success: true,
      recommendations,
      candidateProfileComplete: isProfileComplete,
      candidateSkillsCount: candidateSkills.length,
      completionScore: candidateProfile.profile_completion,
    });
  } catch (err: any) {
    console.error('Job recommendations error:', err);
    res.status(500).json({ success: false, message: 'Unable to calculate job recommendations.' });
  }
});

/**
 * GET /api/jobs/:id
 * Get full job posting details + recruiter organization overview
 */
router.get('/jobs/:id', (req: Request, res: Response): void => {
  try {
    const job = db.prepare(`
      SELECT 
        j.*,
        rp.full_name as recruiter_name,
        rp.company_name,
        rp.company_logo,
        rp.industry,
        rp.location as company_location,
        rp.website as company_website,
        rp.description as company_description
      FROM jobs j
      LEFT JOIN recruiter_profiles rp ON j.recruiter_profile_id = rp.id
      WHERE j.id = ?
    `).get(req.params.id) as any;

    if (!job) {
      res.status(404).json({ success: false, message: 'Job posting not found.' });
      return;
    }

    const reqSkills = db.prepare('SELECT name FROM job_required_skills WHERE job_id = ? ORDER BY name ASC').all(job.id) as { name: string }[];
    const prefSkills = db.prepare('SELECT name FROM job_preferred_skills WHERE job_id = ? ORDER BY name ASC').all(job.id) as { name: string }[];

    const enriched = formatEnrichedJob(
      job,
      reqSkills.map((s) => s.name),
      prefSkills.map((s) => s.name)
    );

    const companyProfile = {
      company_name: job.company_name,
      company_logo: job.company_logo,
      industry: job.industry,
      location: job.company_location,
      website: job.company_website,
      description: job.company_description,
    };

    res.json({
      success: true,
      job: enriched,
      companyProfile,
    });
  } catch (err: any) {
    console.error('Fetch job details error:', err);
    res.status(500).json({ success: false, message: 'Unable to fetch job details.' });
  }
});

export default router;

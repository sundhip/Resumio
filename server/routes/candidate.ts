import { Router, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { db, resumeUploadDir, avatarUploadDir, recalculateCandidateCompletion } from '../database/db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Public avatar image serving for <img> tags
router.get('/photo/:filename', (req, res: Response): void => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(avatarUploadDir, filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Image not found');
  }
});

// Apply auth & candidate role guard to all operational routes below
router.use(authenticateToken);
router.use(requireRole(['candidate']));

// Helper to get candidate profile
function getCandidateProfile(userId: string): any {
  return db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(userId);
}

// Multer Storage for Resumes
const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, resumeUploadDir);
  },
  filename: (req: AuthRequest, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const profile = getCandidateProfile(req.user!.id);
    const unique = crypto.randomBytes(6).toString('hex');
    cb(null, `resume_${profile.id}_${Date.now()}_${unique}${ext}`);
  },
});

const resumeUpload = multer({
  storage: resumeStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (
      ext === '.pdf' ||
      ext === '.docx' ||
      ext === '.doc' ||
      mime === 'application/pdf' ||
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/msword'
    ) {
      cb(null, true);
    } else {
      cb(new Error("This file type isn't supported. Please upload a PDF or DOCX resume."));
    }
  },
});

// Multer Storage for Avatars
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarUploadDir);
  },
  filename: (req: AuthRequest, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const profile = getCandidateProfile(req.user!.id);
    cb(null, `avatar_${profile.id}_${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (
      ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ||
      ['image/jpeg', 'image/png', 'image/webp'].includes(mime)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Please upload an image file in JPG, PNG, or WEBP format (max 5MB).'));
    }
  },
});

// ============================================================
// 1. FULL CANDIDATE PROFILE READ
// ============================================================
router.get('/full-profile', (req: AuthRequest, res: Response): void => {
  try {
    const profile = getCandidateProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Candidate profile not found.' });
      return;
    }

    const education = db.prepare(`
      SELECT * FROM candidate_education 
      WHERE candidate_profile_id = ? 
      ORDER BY currently_studying DESC, start_date DESC
    `).all(profile.id);

    const skills = db.prepare(`
      SELECT * FROM candidate_skills 
      WHERE candidate_profile_id = ? 
      ORDER BY 
        CASE proficiency 
          WHEN 'Expert' THEN 1 
          WHEN 'Advanced' THEN 2 
          WHEN 'Intermediate' THEN 3 
          WHEN 'Beginner' THEN 4 
          ELSE 5 
        END, name ASC
    `).all(profile.id);

    const experience = db.prepare(`
      SELECT * FROM candidate_experience 
      WHERE candidate_profile_id = ? 
      ORDER BY currently_working DESC, start_date DESC
    `).all(profile.id);

    const projects = db.prepare(`
      SELECT * FROM candidate_projects 
      WHERE candidate_profile_id = ? 
      ORDER BY start_date DESC, created_at DESC
    `).all(profile.id);

    const certifications = db.prepare(`
      SELECT * FROM candidate_certifications 
      WHERE candidate_profile_id = ? 
      ORDER BY issue_date DESC
    `).all(profile.id);

    const resume = db.prepare(`
      SELECT id, original_filename, file_type, file_size, is_active, created_at, updated_at 
      FROM candidate_resumes 
      WHERE candidate_profile_id = ? AND is_active = 1
    `).get(profile.id);

    const completion = recalculateCandidateCompletion(profile.id);

    res.json({
      success: true,
      data: {
        profile: {
          ...profile,
          email: req.user!.email,
          profile_completion: completion,
        },
        education,
        skills,
        experience,
        projects,
        certifications,
        resume: resume || null,
        completion,
      },
    });
  } catch (err: any) {
    console.error('Fetch full profile error:', err);
    res.status(500).json({ success: false, message: 'Unable to load candidate profile.' });
  }
});

// ============================================================
// 2. BASIC PROFILE & PHOTO UPDATES
// ============================================================
const basicProfileSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name.'),
  phone: z.string().optional().default(''),
  location: z.string().optional().default(''),
  headline: z.string().optional().default(''),
  bio: z.string().optional().default(''),
  photoUrl: z.string().optional().default(''),
});

router.put('/profile', (req: AuthRequest, res: Response): void => {
  try {
    const parseResult = basicProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: parseResult.error.errors[0]?.message || 'Validation error' });
      return;
    }

    const profile = getCandidateProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Candidate profile not found.' });
      return;
    }

    const { fullName, phone, location, headline, bio, photoUrl } = parseResult.data;

    db.prepare(`
      UPDATE candidate_profiles 
      SET full_name = ?, phone = ?, location = ?, headline = ?, bio = ?, photo_url = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      fullName.trim(),
      phone.trim(),
      location.trim(),
      headline.trim(),
      bio.trim(),
      photoUrl.trim() || profile.photo_url,
      profile.id
    );

    const completion = recalculateCandidateCompletion(profile.id);
    const updated = db.prepare('SELECT * FROM candidate_profiles WHERE id = ?').get(profile.id);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: { ...updated, email: req.user!.email, profile_completion: completion },
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Unable to update profile. Please try again.' });
  }
});

router.post('/photo', (req: AuthRequest, res: Response): void => {
  avatarUpload.single('photo')(req as any, res as any, (err: any) => {
    if (err) {
      res.status(400).json({ success: false, message: err.message || 'Photo upload failed.' });
      return;
    }

    try {
      const file = (req as any).file;
      if (!file) {
        res.status(400).json({ success: false, message: 'No photo file provided.' });
        return;
      }

      const profile = getCandidateProfile(req.user!.id);
      if (!profile) {
        res.status(404).json({ success: false, message: 'Candidate profile not found.' });
        return;
      }

      // Delete previous custom avatar if stored locally
      if (profile.photo_url && profile.photo_url.includes('/api/candidate/photo/')) {
        const oldFilename = profile.photo_url.split('/api/candidate/photo/')[1];
        if (oldFilename) {
          const oldPath = path.join(avatarUploadDir, oldFilename);
          if (fs.existsSync(oldPath)) {
            try { fs.unlinkSync(oldPath); } catch {}
          }
        }
      }

      const photoUrl = `/api/candidate/photo/${file.filename}`;

      db.prepare(`
        UPDATE candidate_profiles 
        SET photo_url = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(photoUrl, profile.id);

      const completion = recalculateCandidateCompletion(profile.id);

      res.json({
        success: true,
        message: 'Profile photo updated successfully.',
        photoUrl,
        completion,
      });
    } catch (dbErr: any) {
      console.error('Save photo error:', dbErr);
      res.status(500).json({ success: false, message: 'Failed to update photo record.' });
    }
  });
});

router.delete('/photo', (req: AuthRequest, res: Response): void => {
  try {
    const profile = getCandidateProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Candidate profile not found.' });
      return;
    }

    if (profile.photo_url && profile.photo_url.includes('/api/candidate/photo/')) {
      const oldFilename = profile.photo_url.split('/api/candidate/photo/')[1];
      if (oldFilename) {
        const oldPath = path.join(avatarUploadDir, oldFilename);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch {}
        }
      }
    }

    db.prepare(`
      UPDATE candidate_profiles 
      SET photo_url = '', updated_at = datetime('now')
      WHERE id = ?
    `).run(profile.id);

    const completion = recalculateCandidateCompletion(profile.id);

    res.json({
      success: true,
      message: 'Profile photo removed successfully.',
      completion,
    });
  } catch (err: any) {
    console.error('Delete photo error:', err);
    res.status(500).json({ success: false, message: 'Unable to remove profile photo.' });
  }
});

// ============================================================
// 3. EDUCATION CRUD
// ============================================================
const educationSchema = z.object({
  degree: z.string().min(1, 'Degree is required.'),
  fieldOfStudy: z.string().optional(),
  field_of_study: z.string().optional(),
  institution: z.string().min(1, 'Institution is required.'),
  location: z.string().optional().default(''),
  startDate: z.string().optional(),
  start_date: z.string().optional(),
  endDate: z.string().optional(),
  end_date: z.string().optional(),
  currentlyStudying: z.union([z.boolean(), z.number()]).optional(),
  currently_studying: z.union([z.boolean(), z.number()]).optional(),
  gradeOrGpa: z.string().optional(),
  grade_or_gpa: z.string().optional(),
  description: z.string().optional().default(''),
}).transform((data) => ({
  degree: data.degree,
  fieldOfStudy: (data.fieldOfStudy || data.field_of_study || '').trim(),
  institution: data.institution,
  location: (data.location || '').trim(),
  startDate: (data.startDate || data.start_date || '').trim(),
  endDate: (data.endDate || data.end_date || '').trim(),
  currentlyStudying: Boolean(data.currentlyStudying ?? data.currently_studying ?? false),
  gradeOrGpa: (data.gradeOrGpa || data.grade_or_gpa || '').trim(),
  description: (data.description || '').trim(),
}));

router.post('/education', (req: AuthRequest, res: Response): void => {
  try {
    const parseResult = educationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: parseResult.error.errors[0]?.message || 'Validation error' });
      return;
    }

    const profile = getCandidateProfile(req.user!.id);
    const { degree, fieldOfStudy, institution, location, startDate, endDate, currentlyStudying, gradeOrGpa, description } = parseResult.data;

    // Validate date logic
    if (!currentlyStudying && endDate && endDate < startDate) {
      res.status(400).json({ success: false, message: 'End date must be on or after start date.' });
      return;
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO candidate_education (
        id, candidate_profile_id, degree, field_of_study, institution, location,
        start_date, end_date, currently_studying, grade_or_gpa, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      profile.id,
      degree.trim(),
      fieldOfStudy.trim(),
      institution.trim(),
      location.trim(),
      startDate.trim(),
      currentlyStudying ? '' : endDate.trim(),
      currentlyStudying ? 1 : 0,
      gradeOrGpa.trim(),
      description.trim()
    );

    const record = db.prepare('SELECT * FROM candidate_education WHERE id = ?').get(id);
    const completion = recalculateCandidateCompletion(profile.id);

    res.status(201).json({
      success: true,
      message: 'Education added successfully.',
      education: record,
      completion,
    });
  } catch (err: any) {
    console.error('Add education error:', err);
    res.status(500).json({ success: false, message: 'Unable to save education. Please try again.' });
  }
});

router.put('/education/:id', (req: AuthRequest, res: Response): void => {
  try {
    const parseResult = educationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: parseResult.error.errors[0]?.message || 'Validation error' });
      return;
    }

    const profile = getCandidateProfile(req.user!.id);
    const { degree, fieldOfStudy, institution, location, startDate, endDate, currentlyStudying, gradeOrGpa, description } = parseResult.data;

    if (!currentlyStudying && endDate && endDate < startDate) {
      res.status(400).json({ success: false, message: 'End date must be on or after start date.' });
      return;
    }

    const existing = db.prepare('SELECT id FROM candidate_education WHERE id = ? AND candidate_profile_id = ?').get(req.params.id, profile.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Education record not found.' });
      return;
    }

    db.prepare(`
      UPDATE candidate_education 
      SET degree = ?, field_of_study = ?, institution = ?, location = ?,
          start_date = ?, end_date = ?, currently_studying = ?, grade_or_gpa = ?, description = ?, updated_at = datetime('now')
      WHERE id = ? AND candidate_profile_id = ?
    `).run(
      degree.trim(),
      fieldOfStudy.trim(),
      institution.trim(),
      location.trim(),
      startDate.trim(),
      currentlyStudying ? '' : endDate.trim(),
      currentlyStudying ? 1 : 0,
      gradeOrGpa.trim(),
      description.trim(),
      req.params.id,
      profile.id
    );

    const record = db.prepare('SELECT * FROM candidate_education WHERE id = ?').get(req.params.id);
    const completion = recalculateCandidateCompletion(profile.id);

    res.json({
      success: true,
      message: 'Education updated successfully.',
      education: record,
      completion,
    });
  } catch (err: any) {
    console.error('Update education error:', err);
    res.status(500).json({ success: false, message: 'Unable to update education. Please try again.' });
  }
});

router.delete('/education/:id', (req: AuthRequest, res: Response): void => {
  try {
    const profile = getCandidateProfile(req.user!.id);
    const existing = db.prepare('SELECT id FROM candidate_education WHERE id = ? AND candidate_profile_id = ?').get(req.params.id, profile.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Education record not found.' });
      return;
    }

    db.prepare('DELETE FROM candidate_education WHERE id = ? AND candidate_profile_id = ?').run(req.params.id, profile.id);
    const completion = recalculateCandidateCompletion(profile.id);

    res.json({
      success: true,
      message: 'Education record deleted successfully.',
      completion,
    });
  } catch (err: any) {
    console.error('Delete education error:', err);
    res.status(500).json({ success: false, message: 'Unable to delete education record.' });
  }
});

// ============================================================
// 4. SKILLS CRUD
// ============================================================
const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required.'),
  proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert'], {
    errorMap: () => ({ message: 'Proficiency must be Beginner, Intermediate, Advanced, or Expert.' }),
  }),
});

router.post('/skills', (req: AuthRequest, res: Response): void => {
  try {
    const parseResult = skillSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: parseResult.error.errors[0]?.message || 'Validation error' });
      return;
    }

    const profile = getCandidateProfile(req.user!.id);
    const { name, proficiency } = parseResult.data;
    const cleanName = name.trim();

    // Check duplicate (case-insensitive)
    const existing = db.prepare('SELECT id FROM candidate_skills WHERE candidate_profile_id = ? AND lower(name) = lower(?)').get(profile.id, cleanName);
    if (existing) {
      res.status(409).json({ success: false, message: `You have already added "${cleanName}" to your skills.` });
      return;
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO candidate_skills (id, candidate_profile_id, name, proficiency)
      VALUES (?, ?, ?, ?)
    `).run(id, profile.id, cleanName, proficiency);

    const record = db.prepare('SELECT * FROM candidate_skills WHERE id = ?').get(id);
    const completion = recalculateCandidateCompletion(profile.id);

    res.status(201).json({
      success: true,
      message: 'Skill added successfully.',
      skill: record,
      completion,
    });
  } catch (err: any) {
    console.error('Add skill error:', err);
    res.status(500).json({ success: false, message: 'Unable to add skill. Please try again.' });
  }
});

router.put('/skills/:id', (req: AuthRequest, res: Response): void => {
  try {
    const parseResult = skillSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: parseResult.error.errors[0]?.message || 'Validation error' });
      return;
    }

    const profile = getCandidateProfile(req.user!.id);
    const { name, proficiency } = parseResult.data;
    const cleanName = name.trim();

    const existing = db.prepare('SELECT id FROM candidate_skills WHERE id = ? AND candidate_profile_id = ?').get(req.params.id, profile.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Skill not found.' });
      return;
    }

    // Check if renaming causes collision
    const collision = db.prepare('SELECT id FROM candidate_skills WHERE candidate_profile_id = ? AND lower(name) = lower(?) AND id != ?').get(profile.id, cleanName, req.params.id);
    if (collision) {
      res.status(409).json({ success: false, message: `A skill named "${cleanName}" already exists.` });
      return;
    }

    db.prepare(`
      UPDATE candidate_skills 
      SET name = ?, proficiency = ?, updated_at = datetime('now')
      WHERE id = ? AND candidate_profile_id = ?
    `).run(cleanName, proficiency, req.params.id, profile.id);

    const record = db.prepare('SELECT * FROM candidate_skills WHERE id = ?').get(req.params.id);
    const completion = recalculateCandidateCompletion(profile.id);

    res.json({
      success: true,
      message: 'Skill updated successfully.',
      skill: record,
      completion,
    });
  } catch (err: any) {
    console.error('Update skill error:', err);
    res.status(500).json({ success: false, message: 'Unable to update skill.' });
  }
});

router.delete('/skills/:id', (req: AuthRequest, res: Response): void => {
  try {
    const profile = getCandidateProfile(req.user!.id);
    const existing = db.prepare('SELECT id FROM candidate_skills WHERE id = ? AND candidate_profile_id = ?').get(req.params.id, profile.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Skill not found.' });
      return;
    }

    db.prepare('DELETE FROM candidate_skills WHERE id = ? AND candidate_profile_id = ?').run(req.params.id, profile.id);
    const completion = recalculateCandidateCompletion(profile.id);

    res.json({
      success: true,
      message: 'Skill removed successfully.',
      completion,
    });
  } catch (err: any) {
    console.error('Delete skill error:', err);
    res.status(500).json({ success: false, message: 'Unable to remove skill.' });
  }
});

// ============================================================
// 5. EXPERIENCE CRUD
// ============================================================
const experienceSchema = z.object({
  jobTitle: z.string().optional(),
  job_title: z.string().optional(),
  company: z.string().min(1, 'Company name is required.'),
  employmentType: z.enum(['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance', 'Other']).optional(),
  employment_type: z.enum(['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance', 'Other']).optional(),
  location: z.string().optional().default(''),
  startDate: z.string().optional(),
  start_date: z.string().optional(),
  endDate: z.string().optional(),
  end_date: z.string().optional(),
  currentlyWorking: z.union([z.boolean(), z.number()]).optional(),
  currently_working: z.union([z.boolean(), z.number()]).optional(),
  description: z.string().optional().default(''),
}).transform((data) => ({
  jobTitle: (data.jobTitle || data.job_title || '').trim(),
  company: data.company.trim(),
  employmentType: data.employmentType || data.employment_type || 'Full-time',
  location: (data.location || '').trim(),
  startDate: (data.startDate || data.start_date || '').trim(),
  endDate: (data.endDate || data.end_date || '').trim(),
  currentlyWorking: Boolean(data.currentlyWorking ?? data.currently_working ?? false),
  description: (data.description || '').trim(),
}));

router.post('/experience', (req: AuthRequest, res: Response): void => {
  try {
    const parseResult = experienceSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: parseResult.error.errors[0]?.message || 'Validation error' });
      return;
    }

    const profile = getCandidateProfile(req.user!.id);
    const { jobTitle, company, employmentType, location, startDate, endDate, currentlyWorking, description } = parseResult.data;

    if (!currentlyWorking && endDate && endDate < startDate) {
      res.status(400).json({ success: false, message: 'End date must be on or after start date.' });
      return;
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO candidate_experience (
        id, candidate_profile_id, job_title, company, employment_type, location,
        start_date, end_date, currently_working, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      profile.id,
      jobTitle.trim(),
      company.trim(),
      employmentType,
      location.trim(),
      startDate.trim(),
      currentlyWorking ? '' : endDate.trim(),
      currentlyWorking ? 1 : 0,
      description.trim()
    );

    const record = db.prepare('SELECT * FROM candidate_experience WHERE id = ?').get(id);
    const completion = recalculateCandidateCompletion(profile.id);

    res.status(201).json({
      success: true,
      message: 'Experience added successfully.',
      experience: record,
      completion,
    });
  } catch (err: any) {
    console.error('Add experience error:', err);
    res.status(500).json({ success: false, message: 'Unable to save experience. Please try again.' });
  }
});

router.put('/experience/:id', (req: AuthRequest, res: Response): void => {
  try {
    const parseResult = experienceSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: parseResult.error.errors[0]?.message || 'Validation error' });
      return;
    }

    const profile = getCandidateProfile(req.user!.id);
    const { jobTitle, company, employmentType, location, startDate, endDate, currentlyWorking, description } = parseResult.data;

    if (!currentlyWorking && endDate && endDate < startDate) {
      res.status(400).json({ success: false, message: 'End date must be on or after start date.' });
      return;
    }

    const existing = db.prepare('SELECT id FROM candidate_experience WHERE id = ? AND candidate_profile_id = ?').get(req.params.id, profile.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Experience record not found.' });
      return;
    }

    db.prepare(`
      UPDATE candidate_experience 
      SET job_title = ?, company = ?, employment_type = ?, location = ?,
          start_date = ?, end_date = ?, currently_working = ?, description = ?, updated_at = datetime('now')
      WHERE id = ? AND candidate_profile_id = ?
    `).run(
      jobTitle.trim(),
      company.trim(),
      employmentType,
      location.trim(),
      startDate.trim(),
      currentlyWorking ? '' : endDate.trim(),
      currentlyWorking ? 1 : 0,
      description.trim(),
      req.params.id,
      profile.id
    );

    const record = db.prepare('SELECT * FROM candidate_experience WHERE id = ?').get(req.params.id);
    const completion = recalculateCandidateCompletion(profile.id);

    res.json({
      success: true,
      message: 'Experience updated successfully.',
      experience: record,
      completion,
    });
  } catch (err: any) {
    console.error('Update experience error:', err);
    res.status(500).json({ success: false, message: 'Unable to update experience.' });
  }
});

router.delete('/experience/:id', (req: AuthRequest, res: Response): void => {
  try {
    const profile = getCandidateProfile(req.user!.id);
    const existing = db.prepare('SELECT id FROM candidate_experience WHERE id = ? AND candidate_profile_id = ?').get(req.params.id, profile.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Experience record not found.' });
      return;
    }

    db.prepare('DELETE FROM candidate_experience WHERE id = ? AND candidate_profile_id = ?').run(req.params.id, profile.id);
    const completion = recalculateCandidateCompletion(profile.id);

    res.json({
      success: true,
      message: 'Experience deleted successfully.',
      completion,
    });
  } catch (err: any) {
    console.error('Delete experience error:', err);
    res.status(500).json({ success: false, message: 'Unable to delete experience record.' });
  }
});

// ============================================================
// 6. PROJECTS CRUD
// ============================================================
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  role: z.string().optional().default(''),
  technologies: z.string().optional().default(''),
  description: z.string().optional().default(''),
  projectUrl: z.string().optional(),
  project_url: z.string().optional(),
  githubUrl: z.string().optional(),
  github_url: z.string().optional(),
  startDate: z.string().optional(),
  start_date: z.string().optional(),
  endDate: z.string().optional(),
  end_date: z.string().optional(),
}).transform((data) => ({
  name: data.name.trim(),
  role: (data.role || '').trim(),
  technologies: (data.technologies || '').trim(),
  description: (data.description || '').trim(),
  projectUrl: (data.projectUrl || data.project_url || '').trim(),
  githubUrl: (data.githubUrl || data.github_url || '').trim(),
  startDate: (data.startDate || data.start_date || '').trim(),
  endDate: (data.endDate || data.end_date || '').trim(),
}));

router.post('/projects', (req: AuthRequest, res: Response): void => {
  try {
    const parseResult = projectSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: parseResult.error.errors[0]?.message || 'Validation error' });
      return;
    }

    const profile = getCandidateProfile(req.user!.id);
    const { name, role, technologies, description, projectUrl, githubUrl, startDate, endDate } = parseResult.data;

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO candidate_projects (
        id, candidate_profile_id, name, role, technologies, description,
        project_url, github_url, start_date, end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      profile.id,
      name.trim(),
      role.trim(),
      technologies.trim(),
      description.trim(),
      projectUrl.trim(),
      githubUrl.trim(),
      startDate.trim(),
      endDate.trim()
    );

    const record = db.prepare('SELECT * FROM candidate_projects WHERE id = ?').get(id);
    const completion = recalculateCandidateCompletion(profile.id);

    res.status(201).json({
      success: true,
      message: 'Project added successfully.',
      project: record,
      completion,
    });
  } catch (err: any) {
    console.error('Add project error:', err);
    res.status(500).json({ success: false, message: 'Unable to save project.' });
  }
});

router.put('/projects/:id', (req: AuthRequest, res: Response): void => {
  try {
    const parseResult = projectSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: parseResult.error.errors[0]?.message || 'Validation error' });
      return;
    }

    const profile = getCandidateProfile(req.user!.id);
    const { name, role, technologies, description, projectUrl, githubUrl, startDate, endDate } = parseResult.data;

    const existing = db.prepare('SELECT id FROM candidate_projects WHERE id = ? AND candidate_profile_id = ?').get(req.params.id, profile.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    db.prepare(`
      UPDATE candidate_projects 
      SET name = ?, role = ?, technologies = ?, description = ?,
          project_url = ?, github_url = ?, start_date = ?, end_date = ?, updated_at = datetime('now')
      WHERE id = ? AND candidate_profile_id = ?
    `).run(
      name.trim(),
      role.trim(),
      technologies.trim(),
      description.trim(),
      projectUrl.trim(),
      githubUrl.trim(),
      startDate.trim(),
      endDate.trim(),
      req.params.id,
      profile.id
    );

    const record = db.prepare('SELECT * FROM candidate_projects WHERE id = ?').get(req.params.id);
    const completion = recalculateCandidateCompletion(profile.id);

    res.json({
      success: true,
      message: 'Project updated successfully.',
      project: record,
      completion,
    });
  } catch (err: any) {
    console.error('Update project error:', err);
    res.status(500).json({ success: false, message: 'Unable to update project.' });
  }
});

router.delete('/projects/:id', (req: AuthRequest, res: Response): void => {
  try {
    const profile = getCandidateProfile(req.user!.id);
    const existing = db.prepare('SELECT id FROM candidate_projects WHERE id = ? AND candidate_profile_id = ?').get(req.params.id, profile.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    db.prepare('DELETE FROM candidate_projects WHERE id = ? AND candidate_profile_id = ?').run(req.params.id, profile.id);
    const completion = recalculateCandidateCompletion(profile.id);

    res.json({
      success: true,
      message: 'Project deleted successfully.',
      completion,
    });
  } catch (err: any) {
    console.error('Delete project error:', err);
    res.status(500).json({ success: false, message: 'Unable to delete project.' });
  }
});

// ============================================================
// 7. CERTIFICATIONS CRUD
// ============================================================
const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required.'),
  issuingOrganization: z.string().optional(),
  issuing_organization: z.string().optional(),
  issueDate: z.string().optional(),
  issue_date: z.string().optional(),
  expirationDate: z.string().optional(),
  expiration_date: z.string().optional(),
  doesNotExpire: z.union([z.boolean(), z.number()]).optional(),
  does_not_expire: z.union([z.boolean(), z.number()]).optional(),
  credentialId: z.string().optional(),
  credential_id: z.string().optional(),
  credentialUrl: z.string().optional(),
  credential_url: z.string().optional(),
}).transform((data) => ({
  name: data.name.trim(),
  issuingOrganization: (data.issuingOrganization || data.issuing_organization || '').trim(),
  issueDate: (data.issueDate || data.issue_date || '').trim(),
  expirationDate: (data.expirationDate || data.expiration_date || '').trim(),
  doesNotExpire: Boolean(data.doesNotExpire ?? data.does_not_expire ?? false),
  credentialId: (data.credentialId || data.credential_id || '').trim(),
  credentialUrl: (data.credentialUrl || data.credential_url || '').trim(),
}));

router.post('/certifications', (req: AuthRequest, res: Response): void => {
  try {
    const parseResult = certificationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: parseResult.error.errors[0]?.message || 'Validation error' });
      return;
    }

    const profile = getCandidateProfile(req.user!.id);
    const { name, issuingOrganization, issueDate, expirationDate, doesNotExpire, credentialId, credentialUrl } = parseResult.data;

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO candidate_certifications (
        id, candidate_profile_id, name, issuing_organization, issue_date,
        expiration_date, does_not_expire, credential_id, credential_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      profile.id,
      name.trim(),
      issuingOrganization.trim(),
      issueDate.trim(),
      doesNotExpire ? '' : expirationDate.trim(),
      doesNotExpire ? 1 : 0,
      credentialId.trim(),
      credentialUrl.trim()
    );

    const record = db.prepare('SELECT * FROM candidate_certifications WHERE id = ?').get(id);
    const completion = recalculateCandidateCompletion(profile.id);

    res.status(201).json({
      success: true,
      message: 'Certification added successfully.',
      certification: record,
      completion,
    });
  } catch (err: any) {
    console.error('Add certification error:', err);
    res.status(500).json({ success: false, message: 'Unable to save certification.' });
  }
});

router.put('/certifications/:id', (req: AuthRequest, res: Response): void => {
  try {
    const parseResult = certificationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: parseResult.error.errors[0]?.message || 'Validation error' });
      return;
    }

    const profile = getCandidateProfile(req.user!.id);
    const { name, issuingOrganization, issueDate, expirationDate, doesNotExpire, credentialId, credentialUrl } = parseResult.data;

    const existing = db.prepare('SELECT id FROM candidate_certifications WHERE id = ? AND candidate_profile_id = ?').get(req.params.id, profile.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Certification not found.' });
      return;
    }

    db.prepare(`
      UPDATE candidate_certifications 
      SET name = ?, issuing_organization = ?, issue_date = ?, expiration_date = ?,
          does_not_expire = ?, credential_id = ?, credential_url = ?, updated_at = datetime('now')
      WHERE id = ? AND candidate_profile_id = ?
    `).run(
      name.trim(),
      issuingOrganization.trim(),
      issueDate.trim(),
      doesNotExpire ? '' : expirationDate.trim(),
      doesNotExpire ? 1 : 0,
      credentialId.trim(),
      credentialUrl.trim(),
      req.params.id,
      profile.id
    );

    const record = db.prepare('SELECT * FROM candidate_certifications WHERE id = ?').get(req.params.id);
    const completion = recalculateCandidateCompletion(profile.id);

    res.json({
      success: true,
      message: 'Certification updated successfully.',
      certification: record,
      completion,
    });
  } catch (err: any) {
    console.error('Update certification error:', err);
    res.status(500).json({ success: false, message: 'Unable to update certification.' });
  }
});

router.delete('/certifications/:id', (req: AuthRequest, res: Response): void => {
  try {
    const profile = getCandidateProfile(req.user!.id);
    const existing = db.prepare('SELECT id FROM candidate_certifications WHERE id = ? AND candidate_profile_id = ?').get(req.params.id, profile.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Certification not found.' });
      return;
    }

    db.prepare('DELETE FROM candidate_certifications WHERE id = ? AND candidate_profile_id = ?').run(req.params.id, profile.id);
    const completion = recalculateCandidateCompletion(profile.id);

    res.json({
      success: true,
      message: 'Certification deleted successfully.',
      completion,
    });
  } catch (err: any) {
    console.error('Delete certification error:', err);
    res.status(500).json({ success: false, message: 'Unable to delete certification.' });
  }
});

import { processResumeAndScreen } from '../services/resumeProcessingPipeline.js';

// ============================================================
// 8. RESUME UPLOAD, DOWNLOAD, PREVIEW, REPLACE, DELETE
// ============================================================

// Get Active Resume
router.get('/resume', (req: AuthRequest, res: Response): void => {
  try {
    const profile = getCandidateProfile(req.user!.id);
    const resume = db.prepare(`
      SELECT id, original_filename, file_type, file_size, is_active, created_at, updated_at 
      FROM candidate_resumes 
      WHERE candidate_profile_id = ? AND is_active = 1
    `).get(profile.id) as any;

    let parsedStatus = null;
    let completenessScore = null;
    if (resume) {
      const parsed = db.prepare('SELECT status FROM resume_parsed_data WHERE resume_id = ?').get(resume.id) as any;
      const screening = db.prepare('SELECT completeness_score FROM resume_screenings WHERE resume_id = ? AND application_id IS NULL').get(resume.id) as any;
      parsedStatus = parsed?.status || 'Not Processed';
      completenessScore = screening?.completeness_score ?? null;
    }

    res.json({
      success: true,
      resume: resume ? { ...resume, parsedStatus, completenessScore } : null,
    });
  } catch (err: any) {
    console.error('Fetch resume error:', err);
    res.status(500).json({ success: false, message: 'Unable to fetch resume.' });
  }
});

// Upload or Replace Resume (PDF/DOCX)
const handleResumeUpload = (req: AuthRequest, res: Response): void => {
  resumeUpload.single('resume')(req as any, res as any, async (err: any) => {
    if (err) {
      res.status(400).json({ success: false, message: err.message || 'Resume upload failed.' });
      return;
    }

    try {
      const file = (req as any).file;
      if (!file) {
        res.status(400).json({ success: false, message: 'No resume file uploaded.' });
        return;
      }

      const profile = getCandidateProfile(req.user!.id);
      if (!profile) {
        res.status(404).json({ success: false, message: 'Candidate profile not found.' });
        return;
      }

      // Preserve resume history for past applications: Mark previous resumes as inactive
      db.prepare('UPDATE candidate_resumes SET is_active = 0, updated_at = datetime(\'now\') WHERE candidate_profile_id = ?').run(profile.id);

      // Insert new active resume
      const resumeId = crypto.randomUUID();
      const ext = path.extname(file.originalname).toLowerCase();
      const fileType = ext === '.pdf' ? 'PDF' : ext === '.docx' ? 'DOCX' : 'DOC';

      db.prepare(`
        INSERT INTO candidate_resumes (
          id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(
        resumeId,
        profile.id,
        file.originalname,
        file.filename,
        fileType,
        file.size
      );

      const completion = recalculateCandidateCompletion(profile.id);
      const newResume = db.prepare(`
        SELECT id, original_filename, file_type, file_size, is_active, created_at, updated_at 
        FROM candidate_resumes WHERE id = ?
      `).get(resumeId);

      // Trigger automatic background parsing & screening immediately
      processResumeAndScreen(resumeId, req.user!.id, profile.id, file.filename).catch((parseErr) => {
        console.error('Background auto-parse error on upload:', parseErr);
      });

      res.status(201).json({
        success: true,
        message: 'Resume uploaded successfully. Automatic text parsing has started.',
        resume: newResume,
        completion,
      });
    } catch (dbErr: any) {
      console.error('Save resume error:', dbErr);
      res.status(500).json({ success: false, message: 'Failed to record resume metadata.' });
    }
  });
};

router.post('/resume', handleResumeUpload);
router.post('/resume/upload', handleResumeUpload);

// Download Active Resume
router.get('/resume/download', (req: AuthRequest, res: Response): void => {
  try {
    const profile = getCandidateProfile(req.user!.id);
    const resume = db.prepare(`
      SELECT * FROM candidate_resumes 
      WHERE candidate_profile_id = ? AND is_active = 1
    `).get(profile.id) as any;

    if (!resume) {
      res.status(404).json({ success: false, message: 'No active resume found to download.' });
      return;
    }

    const filePath = path.join(resumeUploadDir, resume.stored_filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'Resume file not found on storage server.' });
      return;
    }

    res.download(filePath, resume.original_filename);
  } catch (err: any) {
    console.error('Download resume error:', err);
    res.status(500).json({ success: false, message: 'Unable to download resume.' });
  }
});

// Preview Active Resume (In-browser streaming for PDF)
router.get('/resume/preview', (req: AuthRequest, res: Response): void => {
  try {
    const profile = getCandidateProfile(req.user!.id);
    const resume = db.prepare(`
      SELECT * FROM candidate_resumes 
      WHERE candidate_profile_id = ? AND is_active = 1
    `).get(profile.id) as any;

    if (!resume) {
      res.status(404).json({ success: false, message: 'No active resume found.' });
      return;
    }

    const filePath = path.join(resumeUploadDir, resume.stored_filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'Resume file not found on storage server.' });
      return;
    }

    if (resume.file_type === 'PDF') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(resume.original_filename)}"`);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } else {
      res.status(400).json({
        success: false,
        message: 'In-browser preview is available for PDF documents. Please use download for DOCX files.',
        canDownload: true,
      });
    }
  } catch (err: any) {
    console.error('Preview resume error:', err);
    res.status(500).json({ success: false, message: 'Unable to stream resume preview.' });
  }
});

// Preview Specific Resume by ID (For candidates or recruiters)
router.get('/resumes/:id/preview', (req: AuthRequest, res: Response): void => {
  try {
    const resume = db.prepare('SELECT * FROM candidate_resumes WHERE id = ?').get(req.params.id) as any;
    if (!resume) {
      res.status(404).json({ success: false, message: 'Resume not found.' });
      return;
    }

    const filePath = path.join(resumeUploadDir, resume.stored_filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'Resume file not found on storage server.' });
      return;
    }

    if (resume.file_type === 'PDF') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(resume.original_filename)}"`);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } else {
      res.download(filePath, resume.original_filename);
    }
  } catch (err: any) {
    console.error('Preview specific resume error:', err);
    res.status(500).json({ success: false, message: 'Unable to load resume preview.' });
  }
});

// Delete Active Resume
router.delete('/resume', (req: AuthRequest, res: Response): void => {
  try {
    const profile = getCandidateProfile(req.user!.id);
    const resume = db.prepare(`
      SELECT * FROM candidate_resumes 
      WHERE candidate_profile_id = ? AND is_active = 1
    `).get(profile.id) as any;

    if (!resume) {
      res.status(404).json({ success: false, message: 'No active resume to delete.' });
      return;
    }

    // Check if referenced by applications
    const refCount = (db.prepare('SELECT COUNT(*) as count FROM applications WHERE resume_id = ?').get(resume.id) as any)?.count || 0;

    if (refCount > 0) {
      // Soft-delete / deactivate to preserve historical application references
      db.prepare('UPDATE candidate_resumes SET is_active = 0, updated_at = datetime(\'now\') WHERE id = ?').run(resume.id);
    } else {
      // Hard delete file and record if unreferenced
      const filePath = path.join(resumeUploadDir, resume.stored_filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
      db.prepare('DELETE FROM candidate_resumes WHERE id = ?').run(resume.id);
    }

    const completion = recalculateCandidateCompletion(profile.id);

    res.json({
      success: true,
      message: 'Resume removed successfully.',
      completion,
    });
  } catch (err: any) {
    console.error('Delete resume error:', err);
    res.status(500).json({ success: false, message: 'Unable to delete resume.' });
  }
});

export default router;

import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../database/db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas for basic profile
const candidateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional().default(''),
  location: z.string().optional().default(''),
  headline: z.string().optional().default(''),
  bio: z.string().optional().default(''),
  photoUrl: z.string().optional().default(''),
});

const recruiterProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional().default(''),
  companyName: z.string().min(2, 'Company name is required'),
  companyLogo: z.string().optional().default(''),
  industry: z.string().optional().default(''),
  location: z.string().optional().default(''),
  website: z.string().optional().default(''),
  description: z.string().optional().default(''),
});

// Helper to calculate candidate profile completion %
function calculateCandidateCompletion(profile: any): number {
  let score = 20; // baseline for created account
  if (profile.full_name && profile.full_name.trim().length > 0) score += 15;
  if (profile.phone && profile.phone.trim().length > 0) score += 15;
  if (profile.location && profile.location.trim().length > 0) score += 15;
  if (profile.headline && profile.headline.trim().length > 0) score += 15;
  if (profile.bio && profile.bio.trim().length > 0) score += 10;
  if (profile.photo_url && profile.photo_url.trim().length > 0) score += 10;
  return Math.min(100, score);
}

// Helper to calculate recruiter profile completion %
function calculateRecruiterCompletion(profile: any): number {
  let score = 20;
  if (profile.full_name && profile.full_name.trim().length > 0) score += 10;
  if (profile.company_name && profile.company_name.trim().length > 0) score += 20;
  if (profile.industry && profile.industry.trim().length > 0) score += 15;
  if (profile.location && profile.location.trim().length > 0) score += 15;
  if (profile.website && profile.website.trim().length > 0) score += 10;
  if (profile.description && profile.description.trim().length > 0) score += 10;
  return Math.min(100, score);
}

// 1. Get Candidate Profile
router.get('/candidate', authenticateToken, requireRole(['candidate']), (req: AuthRequest, res: Response): void => {
  try {
    const profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(req.user!.id);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Candidate profile not found.' });
      return;
    }

    res.json({
      success: true,
      profile,
      email: req.user!.email,
    });
  } catch (err: any) {
    console.error('Fetch candidate profile error:', err);
    res.status(500).json({ success: false, message: 'Unable to retrieve candidate profile.' });
  }
});

// 2. Update Candidate Profile
router.put('/candidate', authenticateToken, requireRole(['candidate']), (req: AuthRequest, res: Response): void => {
  try {
    const parseResult = candidateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Validation error';
      res.status(400).json({ success: false, message: errorMsg });
      return;
    }

    const { fullName, phone, location, headline, bio, photoUrl } = parseResult.data;

    const existing = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(req.user!.id) as any;
    if (!existing) {
      res.status(404).json({ success: false, message: 'Candidate profile not found.' });
      return;
    }

    const updatedData = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      location: location.trim(),
      headline: headline.trim(),
      bio: bio.trim(),
      photo_url: photoUrl.trim(),
    };

    const completion = calculateCandidateCompletion(updatedData);

    db.prepare(`
      UPDATE candidate_profiles
      SET full_name = ?, phone = ?, location = ?, headline = ?, bio = ?, photo_url = ?, profile_completion = ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(
      updatedData.full_name,
      updatedData.phone,
      updatedData.location,
      updatedData.headline,
      updatedData.bio,
      updatedData.photo_url,
      completion,
      req.user!.id
    );

    const updatedProfile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(req.user!.id);

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      profile: updatedProfile,
    });
  } catch (err: any) {
    console.error('Update candidate profile error:', err);
    res.status(500).json({ success: false, message: 'Unable to update candidate profile.' });
  }
});

// 3. Get Recruiter / Company Profile
router.get('/recruiter', authenticateToken, requireRole(['recruiter']), (req: AuthRequest, res: Response): void => {
  try {
    const profile = db.prepare('SELECT * FROM recruiter_profiles WHERE user_id = ?').get(req.user!.id);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Recruiter profile not found.' });
      return;
    }

    res.json({
      success: true,
      profile,
      email: req.user!.email,
    });
  } catch (err: any) {
    console.error('Fetch recruiter profile error:', err);
    res.status(500).json({ success: false, message: 'Unable to retrieve recruiter profile.' });
  }
});

// 4. Update Recruiter / Company Profile
router.put('/recruiter', authenticateToken, requireRole(['recruiter']), (req: AuthRequest, res: Response): void => {
  try {
    const parseResult = recruiterProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Validation error';
      res.status(400).json({ success: false, message: errorMsg });
      return;
    }

    const { fullName, phone, companyName, companyLogo, industry, location, website, description } = parseResult.data;

    const existing = db.prepare('SELECT * FROM recruiter_profiles WHERE user_id = ?').get(req.user!.id) as any;
    if (!existing) {
      res.status(404).json({ success: false, message: 'Recruiter profile not found.' });
      return;
    }

    const updatedData = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      company_name: companyName.trim(),
      company_logo: companyLogo.trim(),
      industry: industry.trim(),
      location: location.trim(),
      website: website.trim(),
      description: description.trim(),
    };

    const completion = calculateRecruiterCompletion(updatedData);

    db.prepare(`
      UPDATE recruiter_profiles
      SET full_name = ?, phone = ?, company_name = ?, company_logo = ?, industry = ?, location = ?, website = ?, description = ?, profile_completion = ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(
      updatedData.full_name,
      updatedData.phone,
      updatedData.company_name,
      updatedData.company_logo,
      updatedData.industry,
      updatedData.location,
      updatedData.website,
      updatedData.description,
      completion,
      req.user!.id
    );

    const updatedProfile = db.prepare('SELECT * FROM recruiter_profiles WHERE user_id = ?').get(req.user!.id);

    res.json({
      success: true,
      message: 'Company profile updated successfully!',
      profile: updatedProfile,
    });
  } catch (err: any) {
    console.error('Update recruiter profile error:', err);
    res.status(500).json({ success: false, message: 'Unable to update company profile.' });
  }
});

export default router;

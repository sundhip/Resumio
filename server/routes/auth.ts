import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../database/db';
import { authenticateToken, AuthRequest, JWT_SECRET } from '../middleware/auth';

const router = Router();

// Zod Validation Schemas
const candidateRegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const recruiterRegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match",
  path: ["confirmNewPassword"],
});

// 1. Candidate Registration
router.post('/register/candidate', async (req, res: Response): Promise<void> => {
  try {
    const parseResult = candidateRegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Validation error';
      res.status(400).json({ success: false, message: errorMsg });
      return;
    }

    const { fullName, email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existingUser = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(normalizedEmail);
    if (existingUser) {
      res.status(409).json({ success: false, message: 'An account with this email address already exists. Please sign in.' });
      return;
    }

    const userId = crypto.randomUUID();
    const profileId = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);

    const insertTransaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, status)
        VALUES (?, ?, ?, 'candidate', 'active')
      `).run(userId, normalizedEmail, passwordHash);

      db.prepare(`
        INSERT INTO candidate_profiles (id, user_id, full_name, profile_completion)
        VALUES (?, ?, ?, 30)
      `).run(profileId, userId, fullName.trim());
    });

    insertTransaction();

    const token = jwt.sign({ userId, role: 'candidate' }, JWT_SECRET, { expiresIn: '7d' });
    const profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(userId);

    res.status(201).json({
      success: true,
      message: 'Candidate account created successfully!',
      token,
      user: {
        id: userId,
        email: normalizedEmail,
        role: 'candidate',
        name: fullName.trim(),
        profileCompletion: 30,
      },
      profile,
    });
  } catch (err: any) {
    console.error('Candidate registration error:', err);
    res.status(500).json({ success: false, message: 'Unable to complete registration. Please try again.' });
  }
});

// 2. Recruiter Registration
router.post('/register/recruiter', async (req, res: Response): Promise<void> => {
  try {
    const parseResult = recruiterRegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Validation error';
      res.status(400).json({ success: false, message: errorMsg });
      return;
    }

    const { fullName, email, companyName, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existingUser = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(normalizedEmail);
    if (existingUser) {
      res.status(409).json({ success: false, message: 'An account with this email address already exists. Please sign in.' });
      return;
    }

    const userId = crypto.randomUUID();
    const profileId = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);

    const insertTransaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, status)
        VALUES (?, ?, ?, 'recruiter', 'active')
      `).run(userId, normalizedEmail, passwordHash);

      db.prepare(`
        INSERT INTO recruiter_profiles (id, user_id, full_name, company_name, profile_completion)
        VALUES (?, ?, ?, ?, 40)
      `).run(profileId, userId, fullName.trim(), companyName.trim());
    });

    insertTransaction();

    const token = jwt.sign({ userId, role: 'recruiter' }, JWT_SECRET, { expiresIn: '7d' });
    const profile = db.prepare('SELECT * FROM recruiter_profiles WHERE user_id = ?').get(userId);

    res.status(201).json({
      success: true,
      message: 'Recruiter account created successfully!',
      token,
      user: {
        id: userId,
        email: normalizedEmail,
        role: 'recruiter',
        name: fullName.trim(),
        company: companyName.trim(),
        profileCompletion: 40,
      },
      profile,
    });
  } catch (err: any) {
    console.error('Recruiter registration error:', err);
    res.status(500).json({ success: false, message: 'Unable to complete registration. Please try again.' });
  }
});

// 2b. Google OAuth Authentication (Candidate & Recruiter)
router.post('/google', async (req, res: Response): Promise<void> => {
  try {
    let googleId = '';
    let email = '';
    let name = '';
    let picture = '';

    if (req.body.credential && typeof req.body.credential === 'string') {
      try {
        const parts = req.body.credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          googleId = payload.sub || payload.id || '';
          email = payload.email || '';
          name = payload.name || payload.given_name || '';
          picture = payload.picture || '';
        }
      } catch (e) {
        // Fallthrough if parsing failed
      }
    }

    if (!email && req.body.userInfo) {
      googleId = req.body.userInfo.sub || req.body.userInfo.id || googleId || `google_${Date.now()}`;
      email = req.body.userInfo.email || email;
      name = req.body.userInfo.name || name;
      picture = req.body.userInfo.picture || picture;
    }

    if (!email) {
      res.status(400).json({ success: false, message: 'Google authentication failed: Email address not provided.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const targetRole = req.body.role === 'recruiter' ? 'recruiter' : 'candidate';
    const companyName = req.body.companyName || 'Company';

    let user = (googleId ? db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId) : null) as any;
    if (!user) {
      user = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(normalizedEmail) as any;
      if (user) {
        if (googleId && !user.google_id) {
          db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(googleId, user.id);
          user.google_id = googleId;
        }
      } else {
        // Create new persistent user account via Google
        const userId = crypto.randomUUID();
        const profileId = crypto.randomUUID();

        const insertTransaction = db.transaction(() => {
          db.prepare(`
            INSERT INTO users (id, email, password_hash, google_id, role, status)
            VALUES (?, ?, '', ?, ?, 'active')
          `).run(userId, normalizedEmail, googleId || `google_${userId}`, targetRole);

          if (targetRole === 'candidate') {
            db.prepare(`
              INSERT INTO candidate_profiles (id, user_id, full_name, photo_url, profile_completion)
              VALUES (?, ?, ?, ?, 30)
            `).run(profileId, userId, name.trim() || normalizedEmail.split('@')[0], picture);
          } else {
            db.prepare(`
              INSERT INTO recruiter_profiles (id, user_id, full_name, company_name, company_logo, profile_completion)
              VALUES (?, ?, ?, ?, ?, 40)
            `).run(profileId, userId, name.trim() || normalizedEmail.split('@')[0], companyName.trim(), picture);
          }
        });

        insertTransaction();
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
      }
    }

    if (user.status !== 'active') {
      res.status(403).json({ success: false, message: 'Your account is inactive. Please contact administrator.' });
      return;
    }

    let profile: any = null;
    let displayName = user.email.split('@')[0];
    let company: string | undefined = undefined;
    let profileCompletion = 100;

    if (user.role === 'candidate') {
      profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(user.id);
      if (profile) {
        displayName = profile.full_name;
        profileCompletion = profile.profile_completion;
      }
    } else if (user.role === 'recruiter') {
      profile = db.prepare('SELECT * FROM recruiter_profiles WHERE user_id = ?').get(user.id);
      if (profile) {
        displayName = profile.full_name;
        company = profile.company_name;
        profileCompletion = profile.profile_completion;
      }
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Google authentication successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: displayName,
        company,
        profileCompletion,
      },
      profile,
    });
  } catch (err: any) {
    console.error('Google Auth error:', err);
    res.status(500).json({ success: false, message: 'Google authentication failed. Please try again.' });
  }
});

// 3. User Login (Candidate, Recruiter, Admin)
router.post('/login', async (req, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Validation error';
      res.status(400).json({ success: false, message: errorMsg });
      return;
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = db.prepare('SELECT id, email, password_hash, role, status FROM users WHERE lower(email) = ?').get(normalizedEmail) as any;
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ success: false, message: 'Your account is inactive. Please contact administrator.' });
      return;
    }

    let profile: any = null;
    let name = user.email.split('@')[0];
    let company: string | undefined = undefined;
    let profileCompletion = 100;

    if (user.role === 'candidate') {
      profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(user.id);
      if (profile) {
        name = profile.full_name;
        profileCompletion = profile.profile_completion;
      }
    } else if (user.role === 'recruiter') {
      profile = db.prepare('SELECT * FROM recruiter_profiles WHERE user_id = ?').get(user.id);
      if (profile) {
        name = profile.full_name;
        company = profile.company_name;
        profileCompletion = profile.profile_completion;
      }
    } else if (user.role === 'admin') {
      name = 'System Administrator';
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name,
        company,
        profileCompletion,
      },
      profile,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'An error occurred during login. Please try again.' });
  }
});

// 4. Admin Dedicated Login
router.post('/admin-login', async (req, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Validation error';
      res.status(400).json({ success: false, message: errorMsg });
      return;
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = db.prepare("SELECT id, email, password_hash, role, status FROM users WHERE lower(email) = ? AND role = 'admin'").get(normalizedEmail) as any;
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Admin authentication successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: 'admin',
        name: 'Platform Administrator',
        profileCompletion: 100,
      },
    });
  } catch (err: any) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Admin authentication failed.' });
  }
});

// 5. Get Current Authenticated User (GET /api/auth/me)
router.get('/me', authenticateToken, (req: AuthRequest, res: Response): void => {
  const user = req.user!;
  let profile: any = null;
  let name = user.email.split('@')[0];
  let company: string | undefined = undefined;
  let profileCompletion = 100;

  if (user.role === 'candidate') {
    profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(user.id);
    if (profile) {
      name = profile.full_name;
      profileCompletion = profile.profile_completion;
    }
  } else if (user.role === 'recruiter') {
    profile = db.prepare('SELECT * FROM recruiter_profiles WHERE user_id = ?').get(user.id);
    if (profile) {
      name = profile.full_name;
      company = profile.company_name;
      profileCompletion = profile.profile_completion;
    }
  } else if (user.role === 'admin') {
    name = 'System Administrator';
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name,
      company,
      profileCompletion,
    },
    profile,
  });
});

// 6. Change Password
router.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Validation error';
      res.status(400).json({ success: false, message: errorMsg });
      return;
    }

    const { currentPassword, newPassword } = parseResult.data;
    const userRow = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as any;

    const isMatch = await bcrypt.compare(currentPassword, userRow.password_hash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password does not match our records.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(newHash, req.user!.id);

    res.json({
      success: true,
      message: 'Password changed successfully! Please use your new password next time you sign in.',
    });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Unable to update password. Please try again.' });
  }
});

export default router;

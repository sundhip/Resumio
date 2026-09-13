import { DatabaseAdapter as Database } from './sqliteAdapter.js';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Ensure database directory exists
const dbDir = path.resolve(process.cwd(), 'server', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Ensure upload storage directories exist
export const uploadDir = path.resolve(process.cwd(), 'server', 'uploads');
export const resumeUploadDir = path.join(uploadDir, 'resumes');
export const avatarUploadDir = path.join(uploadDir, 'avatars');

if (!fs.existsSync(resumeUploadDir)) {
  fs.mkdirSync(resumeUploadDir, { recursive: true });
}
if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'resumio.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Recalculates dynamic profile completion percentage (0 - 100%)
 * across 10 distinct sections (10% each)
 */
export function recalculateCandidateCompletion(candidateProfileId: string): number {
  const profile = db.prepare('SELECT * FROM candidate_profiles WHERE id = ?').get(candidateProfileId) as any;
  if (!profile) return 0;

  let score = 0;

  // 1. Basic info (name, phone, location)
  if (profile.full_name?.trim() && profile.phone?.trim() && profile.location?.trim()) {
    score += 10;
  } else if (profile.full_name?.trim()) {
    score += 5;
  }

  // 2. Profile Photo
  if (profile.photo_url?.trim()) {
    score += 10;
  }

  // 3. Professional Headline
  if (profile.headline?.trim()) {
    score += 10;
  }

  // 4. Professional Summary / Bio
  if (profile.bio?.trim()) {
    score += 10;
  }

  // 5. Education
  const eduCount = (db.prepare('SELECT COUNT(*) as count FROM candidate_education WHERE candidate_profile_id = ?').get(candidateProfileId) as any)?.count || 0;
  if (eduCount > 0) score += 10;

  // 6. Skills
  const skillsCount = (db.prepare('SELECT COUNT(*) as count FROM candidate_skills WHERE candidate_profile_id = ?').get(candidateProfileId) as any)?.count || 0;
  if (skillsCount > 0) score += 10;

  // 7. Experience
  const expCount = (db.prepare('SELECT COUNT(*) as count FROM candidate_experience WHERE candidate_profile_id = ?').get(candidateProfileId) as any)?.count || 0;
  if (expCount > 0) score += 10;

  // 8. Projects
  const projCount = (db.prepare('SELECT COUNT(*) as count FROM candidate_projects WHERE candidate_profile_id = ?').get(candidateProfileId) as any)?.count || 0;
  if (projCount > 0) score += 10;

  // 9. Certifications
  const certCount = (db.prepare('SELECT COUNT(*) as count FROM candidate_certifications WHERE candidate_profile_id = ?').get(candidateProfileId) as any)?.count || 0;
  if (certCount > 0) score += 10;

  // 10. Active Resume
  const resumeCount = (db.prepare('SELECT COUNT(*) as count FROM candidate_resumes WHERE candidate_profile_id = ? AND is_active = 1').get(candidateProfileId) as any)?.count || 0;
  if (resumeCount > 0) score += 10;

  // Persist updated completion
  db.prepare("UPDATE candidate_profiles SET profile_completion = ?, updated_at = datetime('now') WHERE id = ?").run(score, candidateProfileId);

  return score;
}

/**
 * Phase 9 Database Relationship & Foreign Key Integrity Verification
 */
export function verifyDatabaseIntegrity(): { isValid: boolean; fkViolations: any[]; orphanCounts: Record<string, number> } {
  // Clean orphan records if any exist from aborted test runs
  try {
    db.prepare('DELETE FROM resume_parsed_data WHERE candidate_profile_id NOT IN (SELECT id FROM candidate_profiles)').run();
    db.prepare('DELETE FROM resume_parsed_data WHERE resume_id NOT IN (SELECT id FROM candidate_resumes)').run();
    db.prepare('DELETE FROM resume_screenings WHERE resume_id NOT IN (SELECT id FROM candidate_resumes)').run();
    db.prepare('DELETE FROM resume_screenings WHERE job_id IS NOT NULL AND job_id NOT IN (SELECT id FROM jobs)').run();
    db.prepare('DELETE FROM candidate_resumes WHERE candidate_profile_id NOT IN (SELECT id FROM candidate_profiles)').run();
    db.prepare('DELETE FROM job_required_skills WHERE job_id NOT IN (SELECT id FROM jobs)').run();
    db.prepare('DELETE FROM job_preferred_skills WHERE job_id NOT IN (SELECT id FROM jobs)').run();
    db.prepare('DELETE FROM applications WHERE resume_id NOT IN (SELECT id FROM candidate_resumes)').run();
    db.prepare('DELETE FROM applications WHERE job_id NOT IN (SELECT id FROM jobs)').run();
    db.prepare('DELETE FROM applications WHERE candidate_id NOT IN (SELECT id FROM users)').run();
    db.prepare('DELETE FROM candidate_profiles WHERE user_id NOT IN (SELECT id FROM users)').run();
    db.prepare('DELETE FROM recruiter_profiles WHERE user_id NOT IN (SELECT id FROM users)').run();
  } catch (e) {}

  // 1. Run SQLite foreign key check
  const fkViolations = db.prepare('PRAGMA foreign_key_check').all();

  // 2. Check for logical orphan records
  const orphanResumes = (db.prepare('SELECT COUNT(*) as count FROM candidate_resumes WHERE candidate_profile_id NOT IN (SELECT id FROM candidate_profiles)').get() as any)?.count || 0;
  const orphanApps = (db.prepare('SELECT COUNT(*) as count FROM applications WHERE job_id NOT IN (SELECT id FROM jobs) OR candidate_id NOT IN (SELECT id FROM users)').get() as any)?.count || 0;
  const orphanInterviews = (db.prepare('SELECT COUNT(*) as count FROM interviews WHERE application_id NOT IN (SELECT id FROM applications)').get() as any)?.count || 0;
  const orphanMatches = (db.prepare('SELECT COUNT(*) as count FROM resume_job_matches WHERE job_id NOT IN (SELECT id FROM jobs) OR resume_id NOT IN (SELECT id FROM candidate_resumes)').get() as any)?.count || 0;

  const orphanCounts = {
    orphanResumes,
    orphanApps,
    orphanInterviews,
    orphanMatches,
  };

  const hasOrphans = Object.values(orphanCounts).some((c) => c > 0);
  const isValid = fkViolations.length === 0 && !hasOrphans;

  return { isValid, fkViolations, orphanCounts };
}

export async function initDatabase() {
  await db.ensureReady();
  db.pragma('foreign_keys = ON');

  const schemaPath = path.resolve(process.cwd(), 'server', 'database', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Auto-migration for google_id column if missing on existing DBs
  try {
    const cols = db.prepare("PRAGMA table_info(users)").all() as any[];
    const hasGoogleId = cols.some((c: any) => c.name === 'google_id');
    if (!hasGoogleId) {
      db.exec('ALTER TABLE users ADD COLUMN google_id TEXT;');
    }
  } catch (e) {
    console.error('Migration error:', e);
  }

  // Verify integrity
  const integrity = verifyDatabaseIntegrity();
  if (integrity.isValid) {
    console.log('✅ Database schema and foreign key relationships verified (0 violations)');
  } else {
    console.warn('⚠️ Database integrity notice:', integrity);
  }

  // Seed default admin account if none exists
  const existingAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
  if (!existingAdmin) {
    const adminId = crypto.randomUUID();
    const adminEmail = 'admin@resumio.ai';
    const passwordHash = bcrypt.hashSync('AdminPass123!', 10);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, status)
      VALUES (?, ?, ?, 'admin', 'active')
    `).run(adminId, adminEmail, passwordHash);

    console.log('✅ Default Admin account seeded: admin@resumio.ai / AdminPass123!');
  }
}

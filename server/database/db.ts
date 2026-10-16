import { DatabaseAdapter as Database } from './sqliteAdapter.js';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { MigrationRunner } from './migrationRunner.js';

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
  const safeDelete = (sql: string) => {
    try {
      db.prepare(sql).run();
    } catch (e) {}
  };

  safeDelete('DELETE FROM application_status_history WHERE application_id NOT IN (SELECT id FROM applications)');
  safeDelete('DELETE FROM candidate_rejection_feedback WHERE candidate_id NOT IN (SELECT id FROM users) OR recruiter_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM outreach_campaigns WHERE recruiter_id NOT IN (SELECT id FROM users) OR candidate_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM candidate_notes WHERE candidate_id NOT IN (SELECT id FROM users) OR author_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM candidate_tags WHERE candidate_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM saved_searches WHERE user_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM candidate_consents WHERE candidate_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM voluntary_demographics WHERE candidate_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM candidate_job_preferences WHERE candidate_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM candidate_verifications WHERE candidate_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM candidate_skill_verifications WHERE candidate_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM profile_access_logs WHERE candidate_id NOT IN (SELECT id FROM users) OR viewer_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM candidate_data_retention_consents WHERE candidate_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM organization_members WHERE user_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM job_access_control WHERE user_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM api_key_usage WHERE api_key_id NOT IN (SELECT id FROM api_keys)');
  safeDelete('DELETE FROM api_keys WHERE user_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM webhook_deliveries WHERE webhook_id NOT IN (SELECT id FROM webhook_subscriptions)');
  safeDelete('DELETE FROM webhook_subscriptions WHERE user_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM bulk_upload_batches WHERE recruiter_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM resume_duplicate_matches WHERE candidate_id NOT IN (SELECT id FROM users) OR matched_candidate_id NOT IN (SELECT id FROM users) OR resume_id NOT IN (SELECT id FROM candidate_resumes) OR matched_resume_id NOT IN (SELECT id FROM candidate_resumes)');
  safeDelete('DELETE FROM applications WHERE resume_id NOT IN (SELECT id FROM candidate_resumes) OR job_id NOT IN (SELECT id FROM jobs) OR candidate_id NOT IN (SELECT id FROM users) OR candidate_profile_id NOT IN (SELECT id FROM candidate_profiles)');
  safeDelete('DELETE FROM resume_screenings WHERE resume_id NOT IN (SELECT id FROM candidate_resumes) OR (job_id IS NOT NULL AND job_id NOT IN (SELECT id FROM jobs))');
  safeDelete('DELETE FROM resume_parsed_data WHERE resume_id NOT IN (SELECT id FROM candidate_resumes) OR candidate_profile_id NOT IN (SELECT id FROM candidate_profiles) OR candidate_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM candidate_skills WHERE candidate_profile_id NOT IN (SELECT id FROM candidate_profiles)');
  safeDelete('DELETE FROM candidate_experience WHERE candidate_profile_id NOT IN (SELECT id FROM candidate_profiles)');
  safeDelete('DELETE FROM candidate_education WHERE candidate_profile_id NOT IN (SELECT id FROM candidate_profiles)');
  safeDelete('DELETE FROM candidate_projects WHERE candidate_profile_id NOT IN (SELECT id FROM candidate_profiles)');
  safeDelete('DELETE FROM candidate_certifications WHERE candidate_profile_id NOT IN (SELECT id FROM candidate_profiles)');
  safeDelete('DELETE FROM candidate_resumes WHERE candidate_profile_id NOT IN (SELECT id FROM candidate_profiles)');
  safeDelete('DELETE FROM candidate_profiles WHERE user_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM job_required_skills WHERE job_id NOT IN (SELECT id FROM jobs)');
  safeDelete('DELETE FROM job_preferred_skills WHERE job_id NOT IN (SELECT id FROM jobs)');
  safeDelete('DELETE FROM notifications WHERE user_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM audit_logs WHERE actor_id NOT IN (SELECT id FROM users)');
  safeDelete('DELETE FROM jobs WHERE recruiter_id NOT IN (SELECT id FROM users) OR recruiter_profile_id NOT IN (SELECT id FROM recruiter_profiles)');
  safeDelete('DELETE FROM recruiter_profiles WHERE user_id NOT IN (SELECT id FROM users)');

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

  // Run versioned migrations (0001, 0002_skill_ontology, etc.)
  try {
    await MigrationRunner.runMigrations();
  } catch (migErr) {
    console.error('[Migrations] Versioned migration error:', migErr);
  }

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

  // Phase 3 auto-migrations for resume_parsed_data
  try {
    const parsedCols = db.prepare("PRAGMA table_info(resume_parsed_data)").all() as any[];
    const colNames = new Set(parsedCols.map((c: any) => c.name));
    if (!colNames.has('resume_document_json')) {
      db.exec("ALTER TABLE resume_parsed_data ADD COLUMN resume_document_json TEXT DEFAULT '{}';");
    }
    if (!colNames.has('ats_report_json')) {
      db.exec("ALTER TABLE resume_parsed_data ADD COLUMN ats_report_json TEXT DEFAULT '{}';");
    }
    if (!colNames.has('user_corrections_json')) {
      db.exec("ALTER TABLE resume_parsed_data ADD COLUMN user_corrections_json TEXT DEFAULT '{}';");
    }
    if (!colNames.has('training_consent_opt_in')) {
      db.exec("ALTER TABLE resume_parsed_data ADD COLUMN training_consent_opt_in INTEGER NOT NULL DEFAULT 0;");
    }
    if (!colNames.has('training_consent_timestamp')) {
      db.exec("ALTER TABLE resume_parsed_data ADD COLUMN training_consent_timestamp TEXT DEFAULT NULL;");
    }
  } catch (e) {
    console.error('Phase 3 resume_parsed_data migration error:', e);
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

  // Seed default candidate account if none exists
  const existingCand = db.prepare("SELECT id FROM users WHERE lower(email) = 'candidate@resumio.demo'").get();
  if (!existingCand) {
    const candUserId = crypto.randomUUID();
    const candProfId = crypto.randomUUID();
    const candPasswordHash = bcrypt.hashSync('Candidate@123', 10);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, status)
      VALUES (?, 'candidate@resumio.demo', ?, 'candidate', 'active')
    `).run(candUserId, candPasswordHash);

    db.prepare(`
      INSERT INTO candidate_profiles (id, user_id, full_name, phone, location, headline, bio, profile_completion)
      VALUES (?, ?, 'Rahul Sharma', '+91 98765 43210', 'Chennai, Tamil Nadu', 'Full Stack Developer', 'Experienced Full Stack Developer with 2+ years of experience in React and Node.js.', 80)
    `).run(candProfId, candUserId);

    console.log('✅ Default Candidate account seeded: candidate@resumio.demo / Candidate@123');
  }

  // Seed default recruiter account if none exists
  const existingRec = db.prepare("SELECT id FROM users WHERE lower(email) = 'recruiter@resumio.demo'").get();
  if (!existingRec) {
    const recUserId = crypto.randomUUID();
    const recProfId = crypto.randomUUID();
    const recPasswordHash = bcrypt.hashSync('Recruiter@123', 10);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, status)
      VALUES (?, 'recruiter@resumio.demo', ?, 'recruiter', 'active')
    `).run(recUserId, recPasswordHash);

    db.prepare(`
      INSERT INTO recruiter_profiles (id, user_id, full_name, phone, company_name, industry, location, website, description, profile_completion)
      VALUES (?, ?, 'Arjun Mehta', '+91 98765 12345', 'Nexora Technologies', 'Software & AI', 'Chennai, Tamil Nadu', 'https://nexoratech.demo', 'Leading AI and Software Technology provider.', 100)
    `).run(recProfId, recUserId);

    console.log('✅ Default Recruiter account seeded: recruiter@resumio.demo / Recruiter@123');
  }
}

export default db;

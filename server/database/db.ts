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

export function initDatabase() {
  const schemaPath = path.resolve(process.cwd(), 'server', 'database', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

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

  // Seed starter demo accounts for instant testing if database is new
  const existingCandidate = db.prepare('SELECT id FROM users WHERE email = ?').get('rahul.kumar@resumio.ai') as any;
  if (!existingCandidate) {
    const candUserId = crypto.randomUUID();
    const candProfileId = crypto.randomUUID();
    const candHash = bcrypt.hashSync('Candidate123!', 10);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, status)
      VALUES (?, 'rahul.kumar@resumio.ai', ?, 'candidate', 'active')
    `).run(candUserId, candHash);

    db.prepare(`
      INSERT INTO candidate_profiles (id, user_id, full_name, phone, location, headline, bio, photo_url, profile_completion)
      VALUES (?, ?, 'Rahul Kumar', '+91 98765 43210', 'Chennai, India', 'Senior Full Stack Developer', 'Full Stack Developer with 6+ years specializing in TypeScript, React, Node.js, and high-throughput cloud systems.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 80)
    `).run(candProfileId, candUserId);

    // Seed sample Education
    db.prepare(`
      INSERT INTO candidate_education (id, candidate_profile_id, degree, field_of_study, institution, location, start_date, end_date, currently_studying, grade_or_gpa, description)
      VALUES (?, ?, 'B.Tech', 'Computer Science and Engineering', 'Anna University', 'Chennai, India', '2018-08', '2022-05', 0, 'CGPA: 8.7 / 10', 'Focused on Distributed Systems, Algorithms, and Software Engineering Principles.')
    `).run(crypto.randomUUID(), candProfileId);

    // Seed sample Skills
    const initialSkills = [
      { name: 'TypeScript', proficiency: 'Expert' },
      { name: 'React', proficiency: 'Expert' },
      { name: 'Node.js', proficiency: 'Advanced' },
      { name: 'PostgreSQL', proficiency: 'Advanced' },
      { name: 'Tailwind CSS', proficiency: 'Expert' },
      { name: 'Docker', proficiency: 'Intermediate' },
      { name: 'AWS Cloud', proficiency: 'Intermediate' },
    ];
    for (const s of initialSkills) {
      db.prepare(`
        INSERT INTO candidate_skills (id, candidate_profile_id, name, proficiency)
        VALUES (?, ?, ?, ?)
      `).run(crypto.randomUUID(), candProfileId, s.name, s.proficiency);
    }

    // Seed sample Experience
    db.prepare(`
      INSERT INTO candidate_experience (id, candidate_profile_id, job_title, company, employment_type, location, start_date, end_date, currently_working, description)
      VALUES (?, ?, 'Senior Full Stack Engineer', 'CloudScale Technologies', 'Full-time', 'Chennai, India (Hybrid)', '2022-06', '', 1, 'Architected real-time collaboration tools and resilient microservices serving 200k+ daily users. Optimized API response times by 35%.')
    `).run(crypto.randomUUID(), candProfileId);

    // Seed sample Project
    db.prepare(`
      INSERT INTO candidate_projects (id, candidate_profile_id, name, role, technologies, description, project_url, github_url, start_date, end_date)
      VALUES (?, ?, 'Resumio Platform', 'Lead Full Stack Architect', 'React, TypeScript, SQLite, Tailwind CSS', 'Modern recruitment management portal with role-based security and candidate profile management.', 'https://resumio.ai', 'https://github.com/example/resumio', '2025-01', '2026-03')
    `).run(crypto.randomUUID(), candProfileId);

    // Seed sample Certification
    db.prepare(`
      INSERT INTO candidate_certifications (id, candidate_profile_id, name, issuing_organization, issue_date, expiration_date, does_not_expire, credential_id, credential_url)
      VALUES (?, ?, 'AWS Certified Solutions Architect', 'Amazon Web Services (AWS)', '2024-04', '2027-04', 0, 'AWS-SA-994821', 'https://aws.amazon.com/verification')
    `).run(crypto.randomUUID(), candProfileId);

    recalculateCandidateCompletion(candProfileId);
    console.log('✅ Starter Candidate seeded with Phase 2 data: rahul.kumar@resumio.ai / Candidate123!');
  }

  const existingRecruiter = db.prepare('SELECT id FROM users WHERE email = ?').get('sarah.j@talentcorp.io');
  if (!existingRecruiter) {
    const recUserId = crypto.randomUUID();
    const recProfileId = crypto.randomUUID();
    const recHash = bcrypt.hashSync('Recruiter123!', 10);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, status)
      VALUES (?, 'sarah.j@talentcorp.io', ?, 'recruiter', 'active')
    `).run(recUserId, recHash);

    db.prepare(`
      INSERT INTO recruiter_profiles (id, user_id, full_name, phone, company_name, company_logo, industry, location, website, description, profile_completion)
      VALUES (?, ?, 'Sarah Jenkins', '+1 (415) 555-0192', 'Nexus AI Technologies', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80', 'Artificial Intelligence & SaaS', 'San Francisco, CA', 'https://nexusai.tech', 'Nexus AI builds enterprise-grade machine learning workflows and automated data intelligence platforms.', 80)
    `).run(recProfileId, recUserId);

    console.log('✅ Starter Recruiter seeded: sarah.j@talentcorp.io / Recruiter123!');
  }
}

/**
 * SAFE SYNTHETIC DEMO SEED DATASET
 * Phase 12: Final QA, Documentation and Launch Readiness
 *
 * STRICT SAFETY RULES:
 * 1. 100% Fully Synthetic Data: Zero real people, zero PII, zero scraped records.
 * 2. Every single entity is clearly marked with [SYNTHETIC DEMO].
 * 3. Seed accounts for all 4 roles (Candidate, Recruiter, Hiring Manager, Admin).
 * 4. Rich applications, resume screenings, and match fit evaluations ready in 1 command.
 */

import { db, initDatabase } from '../database/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const DEMO_CREDENTIALS = {
  candidate: { email: 'candidate.demo@resumio.local', password: 'DemoPass123!', role: 'candidate', name: 'Synthetic Candidate Demo' },
  recruiter: { email: 'recruiter.demo@resumio.local', password: 'DemoPass123!', role: 'recruiter', name: 'Synthetic Recruiter Demo' },
  manager: { email: 'manager.demo@resumio.local', password: 'DemoPass123!', role: 'recruiter', name: 'Synthetic Hiring Manager Demo' },
  admin: { email: 'admin.demo@resumio.local', password: 'DemoPass123!', role: 'admin', name: 'Synthetic Platform Administrator' },
};

export async function seedSyntheticDemoDataset() {
  await initDatabase();

  console.log(`\n============================================================`);
  console.log(`🌱 SEEDING SAFE SYNTHETIC DEMO DATASET`);
  console.log(`Notice: All profiles, companies, and jobs are 100% synthetic.`);
  console.log(`============================================================\n`);

  const passwordHash = bcrypt.hashSync('DemoPass123!', 10);
  const orgId = 'org_synthetic_cloudscale_demo';

  // 1. Clean previous synthetic demo entries
  console.log('🧹 Purging previous synthetic demo data...');
  const existingUsers = db.prepare("SELECT id FROM users WHERE email LIKE '%.demo@resumio.local'").all() as { id: string }[];
  for (const u of existingUsers) {
    db.prepare('DELETE FROM resume_job_matches WHERE candidate_id = ?').run(u.id);
    db.prepare('DELETE FROM resume_screenings WHERE resume_id IN (SELECT id FROM candidate_resumes WHERE candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = ?))').run(u.id);
    db.prepare('DELETE FROM candidate_skills WHERE candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = ?)').run(u.id);
    db.prepare('DELETE FROM candidate_experience WHERE candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = ?)').run(u.id);
    db.prepare('DELETE FROM candidate_education WHERE candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = ?)').run(u.id);
    db.prepare('DELETE FROM candidate_resumes WHERE candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = ?)').run(u.id);
    db.prepare('DELETE FROM applications WHERE candidate_id = ?').run(u.id);
    db.prepare('DELETE FROM candidate_profiles WHERE user_id = ?').run(u.id);
    db.prepare('DELETE FROM recruiter_profiles WHERE user_id = ?').run(u.id);
    db.prepare('DELETE FROM organization_members WHERE user_id = ?').run(u.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(u.id);
  }

  // 2. Create Organization
  const orgCheck = db.prepare('SELECT id FROM organizations WHERE id = ?').get(orgId);
  if (!orgCheck) {
    db.prepare(`
      INSERT INTO organizations (id, name, slug, plan)
      VALUES (?, 'Synthetic CloudScale Systems [DEMO]', 'cloudscale-demo', 'enterprise')
    `).run(orgId);
  }

  // 3. Create Demo Accounts
  console.log('👤 Provisioning role demo accounts...');
  const userIds: Record<string, string> = {};

  for (const [key, creds] of Object.entries(DEMO_CREDENTIALS)) {
    const userId = `usr_demo_${key}`;
    userIds[key] = userId;

    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, status)
      VALUES (?, ?, ?, ?, 'active')
    `).run(userId, creds.email, passwordHash, creds.role);

    if (creds.role === 'candidate') {
      const profId = `prof_cand_demo_${crypto.randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO candidate_profiles (
          id, user_id, full_name, headline, bio, location, profile_completion
        ) VALUES (?, ?, ?, ?, ?, ?, 90)
      `).run(
        profId,
        userId,
        creds.name,
        'Synthetic Senior Full-Stack Engineer [DEMO]',
        'SYNTHETIC PROFILE - FOR DEMONSTRATION PURPOSES ONLY - NOT A REAL PERSON',
        'San Francisco, CA / Remote'
      );
    } else {
      const recId = `prof_rec_demo_${crypto.randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO recruiter_profiles (
          id, user_id, full_name, company_name, profile_completion
        ) VALUES (?, ?, ?, ?, 100)
      `).run(recId, userId, creds.name, 'Synthetic CloudScale Systems [DEMO]');

      const roleInOrg = key === 'admin' ? 'Admin' : key === 'manager' ? 'Hiring Manager' : 'Recruiter';
      db.prepare(`
        INSERT INTO organization_members (id, organization_id, user_id, role)
        VALUES (?, ?, ?, ?)
      `).run(`mem_${crypto.randomUUID().slice(0, 8)}`, orgId, userId, roleInOrg);
    }
  }

  // 4. Create Synthetic Job Openings
  console.log('💼 Publishing synthetic job openings...');
  const recruiterId = userIds.recruiter;
  const recruiterProfile = db.prepare('SELECT id FROM recruiter_profiles WHERE user_id = ?').get(recruiterId) as { id: string };

  const jobsData = [
    {
      id: `job_demo_k8s_${crypto.randomUUID().slice(0, 8)}`,
      title: 'Senior Distributed Systems Engineer (Go / Kubernetes) [SYNTHETIC DEMO]',
      location: 'Remote, US',
      workMode: 'Remote' as const,
      description: 'Lead engineering of distributed microservices handling 50k+ QPS with 99.99% reliability. Build resilient consensus protocols and autoscaling controllers in Kubernetes.',
      responsibilities: 'Architect event-driven pipelines, maintain high-availability Kubernetes workloads, optimize throughput.',
      minExp: 5,
      maxExp: 10,
      salaryMin: 140000,
      salaryMax: 185000,
      skills: ['Go', 'Kubernetes', 'PostgreSQL', 'Docker', 'Distributed Systems', 'gRPC'],
    },
    {
      id: `job_demo_frontend_${crypto.randomUUID().slice(0, 8)}`,
      title: 'Lead Full-Stack TypeScript Engineer (React 19 / Node) [SYNTHETIC DEMO]',
      location: 'New York, NY / Hybrid',
      workMode: 'Hybrid' as const,
      description: 'Architect modern enterprise web applications using React 19, Vite, TailwindCSS, and Node.js microservices with accessibility and sub-100ms response targets.',
      responsibilities: 'Develop performant React 19 UIs, maintain Node/Express APIs, lead frontend architecture.',
      minExp: 4,
      maxExp: 8,
      salaryMin: 130000,
      salaryMax: 170000,
      skills: ['TypeScript', 'React', 'Node.js', 'TailwindCSS', 'PostgreSQL', 'GraphQL'],
    },
    {
      id: `job_demo_ml_${crypto.randomUUID().slice(0, 8)}`,
      title: 'Staff Machine Learning Engineer (PyTorch / NLP) [SYNTHETIC DEMO]',
      location: 'San Francisco, CA',
      workMode: 'On-site' as const,
      description: 'Design and deploy state-of-the-art NLP transformers and dense retrieval models for semantic search and explainable matching pipelines.',
      responsibilities: 'Train transformer models, build vector search indexes, prevent score drift and demographic bias.',
      minExp: 6,
      maxExp: 12,
      salaryMin: 160000,
      salaryMax: 220000,
      skills: ['Python', 'PyTorch', 'Transformers', 'NLP', 'FastAPI', 'Docker'],
    },
  ];

  for (const job of jobsData) {
    db.prepare(`
      INSERT INTO jobs (
        id, recruiter_id, recruiter_profile_id, title, company_name, location, employment_type, work_mode,
        salary_min, salary_max, currency, salary_period, salary_disclosed, min_experience, max_experience,
        qualification, description, responsibilities, status, published_at
      ) VALUES (
        ?, ?, ?, ?, 'Synthetic CloudScale Systems [DEMO]', ?, 'Full-time', ?,
        ?, ?, 'USD', 'year', 1, ?, ?,
        'Bachelor or Master of Science in Computer Science or equivalent experience', ?, ?, 'Published', datetime('now')
      )
    `).run(
      job.id,
      recruiterId,
      recruiterProfile.id,
      job.title,
      job.location,
      job.workMode,
      job.salaryMin,
      job.salaryMax,
      job.minExp,
      job.maxExp,
      job.description,
      job.responsibilities
    );

    for (const skill of job.skills) {
      db.prepare(`
        INSERT INTO job_required_skills (id, job_id, name)
        VALUES (?, ?, ?)
      `).run(`jreq_${crypto.randomUUID().slice(0, 8)}`, job.id, skill);
    }
  }

  // 5. Create Synthetic Candidates with Resumes & Applications
  console.log('📄 Populating synthetic candidates and match screenings...');
  const syntheticCandidates = [
    {
      name: 'Synthetic Alex Rivera [DEMO]',
      email: 'alex.rivera.demo@resumio.local',
      title: 'Senior Backend Engineer (Go & Kubernetes)',
      skills: ['Go', 'Kubernetes', 'Docker', 'PostgreSQL', 'gRPC', 'Distributed Systems'],
      score: 94,
      stage: 'Shortlisted',
    },
    {
      name: 'Synthetic Priya Patel [DEMO]',
      email: 'priya.patel.demo@resumio.local',
      title: 'Full-Stack Software Engineer (TypeScript & React)',
      skills: ['TypeScript', 'React', 'Node.js', 'TailwindCSS', 'PostgreSQL'],
      score: 89,
      stage: 'Under Review',
    },
    {
      name: 'Synthetic Marcus Chen [DEMO]',
      email: 'marcus.chen.demo@resumio.local',
      title: 'Machine Learning Research Engineer (PyTorch)',
      skills: ['Python', 'PyTorch', 'Transformers', 'NLP', 'Docker'],
      score: 91,
      stage: 'Shortlisted',
    },
    {
      name: 'Synthetic Elena Rostova [DEMO]',
      email: 'elena.rostova.demo@resumio.local',
      title: 'Cloud DevOps & Platform Architect',
      skills: ['Kubernetes', 'Terraform', 'AWS', 'Go', 'Docker'],
      score: 85,
      stage: 'Applied',
    },
  ];

  const primaryJob = jobsData[0];

  for (const c of syntheticCandidates) {
    const candUserId = `cand_synth_${crypto.randomUUID().slice(0, 8)}`;
    const candProfId = `prof_synth_${crypto.randomUUID().slice(0, 8)}`;
    const resumeId = `res_synth_${crypto.randomUUID().slice(0, 8)}`;
    const appId = `app_synth_${crypto.randomUUID().slice(0, 8)}`;
    const screeningId = `scr_synth_${crypto.randomUUID().slice(0, 8)}`;
    const matchId = `mat_synth_${crypto.randomUUID().slice(0, 8)}`;

    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, status)
      VALUES (?, ?, ?, 'candidate', 'active')
    `).run(candUserId, c.email, passwordHash);

    db.prepare(`
      INSERT INTO candidate_profiles (
        id, user_id, full_name, headline, bio, location, profile_completion
      ) VALUES (?, ?, ?, ?, 'SYNTHETIC PROFILE - FOR DEMONSTRATION PURPOSES ONLY - NOT A REAL PERSON', 'San Francisco, CA', 95)
    `).run(candProfId, candUserId, c.name, `${c.title} [SYNTHETIC DEMO]`);

    // Add skills
    for (const sk of c.skills) {
      db.prepare(`
        INSERT INTO candidate_skills (id, candidate_profile_id, name, proficiency)
        VALUES (?, ?, ?, 'Advanced')
      `).run(`csk_${crypto.randomUUID().slice(0, 8)}`, candProfId, sk);
    }

    // Add resume
    db.prepare(`
      INSERT INTO candidate_resumes (
        id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active
      ) VALUES (?, ?, ?, ?, 'application/pdf', 102400, 1)
    `).run(
      resumeId,
      candProfId,
      `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_resume.pdf`,
      `resumes/demo/${resumeId}.pdf`
    );

    // Add application
    db.prepare(`
      INSERT INTO applications (
        id, job_id, candidate_id, candidate_profile_id, resume_id, cover_letter, status, applied_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'Excited to apply for the Senior Distributed Systems Engineer role at CloudScale Systems.', ?, datetime('now'), datetime('now'))
    `).run(appId, primaryJob.id, candUserId, candProfId, resumeId, c.stage);

    // Add screening evaluation
    db.prepare(`
      INSERT INTO resume_screenings (
        id, resume_id, job_id, screening_version, status, completeness_score, skills_detected_count, overall_notes
      ) VALUES (?, ?, ?, '1.0.0', 'Screened', 95, ?, 'Strong synthetic technical background with proven distributed systems and cloud primitives.')
    `).run(screeningId, resumeId, primaryJob.id, c.skills.length);

    // Add resume-job match
    db.prepare(`
      INSERT INTO resume_job_matches (
        id, resume_id, job_id, application_id, candidate_id, candidate_profile_id,
        algorithm_version, status, match_score, required_skills_matched_json,
        required_skills_missing_json, preferred_skills_matched_json, preferred_skills_missing_json,
        required_skills_score, preferred_skills_score, experience_score, qualification_score, relevance_score
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        '2.0.0', 'Completed', ?, ?,
        '[]', '[]', '[]',
        95.0, 90.0, 90.0, 92.0, 94.0
      )
    `).run(
      matchId,
      resumeId,
      primaryJob.id,
      appId,
      candUserId,
      candProfId,
      c.score,
      JSON.stringify(c.skills)
    );
  }

  console.log(`\n============================================================`);
  console.log(`🎉 SYNTHETIC DEMO DATASET SEEDED SUCCESSFULLY!`);
  console.log(`------------------------------------------------------------`);
  console.log(`Demo Login Credentials (Password for all: DemoPass123!):`);
  console.log(`  Candidate      : ${DEMO_CREDENTIALS.candidate.email}`);
  console.log(`  Recruiter      : ${DEMO_CREDENTIALS.recruiter.email}`);
  console.log(`  Hiring Manager : ${DEMO_CREDENTIALS.manager.email}`);
  console.log(`  Administrator  : ${DEMO_CREDENTIALS.admin.email}`);
  console.log(`============================================================\n`);
}

if (process.argv[1]?.includes('seed-synthetic-demo')) {
  seedSyntheticDemoDataset().catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}

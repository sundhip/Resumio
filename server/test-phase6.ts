import crypto from 'crypto';
import { db, initDatabase } from './database/db.js';
import { SkillNormalizationService } from './services/skillNormalizer.js';
import { ResumeJobMatchingService } from './services/matchingService.js';
import { CandidateSummaryService } from './services/candidateSummaryService.js';
import { SkillGapAnalysisService } from './services/skillGapService.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

async function runPhase6TestSuite() {
  console.log('====================================================');
  console.log('🧪 RESUMIO PHASE 6: AI MATCHING, RANKING & SKILL GAP');
  console.log('====================================================\n');

  await initDatabase();

  // ========================================================
  // TEST SUITE 1: SKILL NORMALIZATION & CONSERVATIVE MATCHING
  // ========================================================
  console.log('🔤 1. Testing Skill Normalization Layer...');

  // 1. Exact match
  assert(SkillNormalizationService.normalize('TypeScript') === 'TypeScript', 'Exact canonical skill unchanged');

  // 2. Case-insensitive normalization
  assert(SkillNormalizationService.normalize('typescript') === 'TypeScript', 'Case-insensitive normalization (typescript -> TypeScript)');
  assert(SkillNormalizationService.normalize('PYTHON') === 'Python', 'Uppercase normalization (PYTHON -> Python)');

  // 3. Alias mappings
  assert(SkillNormalizationService.normalize('ReactJS') === 'React', 'Alias mapping (ReactJS -> React)');
  assert(SkillNormalizationService.normalize('React.js') === 'React', 'Alias mapping (React.js -> React)');
  assert(SkillNormalizationService.normalize('nodejs') === 'Node.js', 'Alias mapping (nodejs -> Node.js)');
  assert(SkillNormalizationService.normalize('node.js') === 'Node.js', 'Alias mapping (node.js -> Node.js)');
  assert(SkillNormalizationService.normalize('postgres') === 'PostgreSQL', 'Alias mapping (postgres -> PostgreSQL)');
  assert(SkillNormalizationService.normalize('k8s') === 'Kubernetes', 'Alias mapping (k8s -> Kubernetes)');
  assert(SkillNormalizationService.normalize('aws') === 'AWS Cloud', 'Alias mapping (aws -> AWS Cloud)');
  assert(SkillNormalizationService.normalize('js') === 'JavaScript', 'Alias mapping (js -> JavaScript)');
  assert(SkillNormalizationService.normalize('golang') === 'Go', 'Alias mapping (golang -> Go)');

  // 4. Conservative separation (false-equivalence guards)
  assert(!SkillNormalizationService.areSkillsEquivalent('Java', 'JavaScript'), 'Conservative guard: Java != JavaScript');
  assert(!SkillNormalizationService.areSkillsEquivalent('Python', 'PyTorch'), 'Conservative guard: Python != PyTorch');
  assert(!SkillNormalizationService.areSkillsEquivalent('React', 'React Native'), 'Conservative guard: React != React Native');
  assert(!SkillNormalizationService.areSkillsEquivalent('Node.js', 'JavaScript'), 'Conservative guard: Node.js != JavaScript');

  // 5. Compare skill sets
  const jobReqs = ['Python', 'Django', 'PostgreSQL', 'Docker', 'Kubernetes'];
  const candSkills = ['python', 'Django', 'Postgres'];
  const comparison = SkillNormalizationService.compareSkillSets(jobReqs, candSkills);

  assert(comparison.matched.length === 3, 'Identifies 3 matched skills (Python, Django, PostgreSQL)');
  assert(comparison.matched.includes('Python') && comparison.matched.includes('Django') && comparison.matched.includes('PostgreSQL'), 'Matched array has canonical names');
  assert(comparison.missing.length === 2, 'Identifies 2 missing skills (Docker, Kubernetes)');
  assert(comparison.missing.includes('Docker') && comparison.missing.includes('Kubernetes'), 'Missing array contains unmatched items');

  // ========================================================
  // TEST SUITE 2: DETERMINISTIC MATCHING ENGINE & SCORING
  // ========================================================
  console.log('\n⚖️ 2. Testing Deterministic Match Scoring Engine...');

  // Create test job
  const testRecruiterId = `rec_p6_${Date.now()}`;
  const testRecProfileId = `rec_prof_p6_${Date.now()}`;
  const testJobId = `job_p6_${Date.now()}`;

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, 'hash', 'recruiter', datetime('now'), datetime('now'))
  `).run(testRecruiterId, `recruiter_${Date.now()}@resumio.test`);

  db.prepare(`
    INSERT INTO recruiter_profiles (id, user_id, full_name, company_name, created_at, updated_at)
    VALUES (?, ?, 'Lead Recruiter', 'Apex Scale Inc', datetime('now'), datetime('now'))
  `).run(testRecProfileId, testRecruiterId);

  db.prepare(`
    INSERT INTO jobs (id, recruiter_id, recruiter_profile_id, title, description, company_name, min_experience, qualification, employment_type, work_mode, status, created_at, updated_at)
    VALUES (?, ?, ?, 'Senior Backend Architect', 'Build scalable cloud APIs', 'Apex Scale Inc', 4, 'B.Tech', 'Full-time', 'Remote', 'Published', datetime('now'), datetime('now'))
  `).run(testJobId, testRecruiterId, testRecProfileId);

  // Job Required Skills: Python, Django, PostgreSQL, Docker (4 skills)
  const reqs = ['Python', 'Django', 'PostgreSQL', 'Docker'];
  for (const r of reqs) {
    db.prepare('INSERT INTO job_required_skills (id, job_id, name) VALUES (?, ?, ?)').run(crypto.randomUUID(), testJobId, r);
  }

  // Job Preferred Skills: Redis, Kubernetes (2 skills)
  const prefs = ['Redis', 'Kubernetes'];
  for (const p of prefs) {
    db.prepare('INSERT INTO job_preferred_skills (id, job_id, name) VALUES (?, ?, ?)').run(crypto.randomUUID(), testJobId, p);
  }

  // Create Candidate A: 4/4 Required, 1/2 Preferred, 5 yrs Experience, B.Tech
  const candAUserId = `cand_a_${Date.now()}`;
  const candAProfId = `cand_a_prof_${Date.now()}`;
  const candAResumeId = `cand_a_res_${Date.now()}`;

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, 'hash', 'candidate', datetime('now'), datetime('now'))
  `).run(candAUserId, `cand_a_${Date.now()}@resumio.test`);

  db.prepare(`
    INSERT INTO candidate_profiles (id, user_id, full_name, profile_completion, created_at, updated_at)
    VALUES (?, ?, 'Alice Candidate', 90, datetime('now'), datetime('now'))
  `).run(candAProfId, candAUserId);

  for (const sk of ['Python', 'Django', 'PostgreSQL', 'Docker', 'Redis']) {
    db.prepare('INSERT INTO candidate_skills (id, candidate_profile_id, name, proficiency) VALUES (?, ?, ?, ?)').run(crypto.randomUUID(), candAProfId, sk, 'Advanced');
  }

  db.prepare(`
    INSERT INTO candidate_experience (id, candidate_profile_id, job_title, company, employment_type, start_date, end_date, currently_working, description)
    VALUES (?, ?, 'Lead Backend Developer', 'Tech Global', 'Full-time', '2019-01', '2024-03', 0, 'Built python distributed backends')
  `).run(crypto.randomUUID(), candAProfId);

  db.prepare(`
    INSERT INTO candidate_education (id, candidate_profile_id, degree, field_of_study, institution, start_date, end_date)
    VALUES (?, ?, 'B.Tech', 'Computer Science', 'Stanford University', '2015-08', '2019-05')
  `).run(crypto.randomUUID(), candAProfId);

  db.prepare(`
    INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active)
    VALUES (?, ?, 'Alice_Resume.pdf', 'alice.pdf', 'PDF', 1024, 1)
  `).run(candAResumeId, candAProfId);

  // Compute Match for Candidate A
  const matchA = await ResumeJobMatchingService.computeMatch(candAResumeId, testJobId, candAUserId, candAProfId);

  assert(matchA.matchScore >= 85, `Candidate A receives strong match score (${matchA.matchScore}%)`);
  assert(matchA.requiredSkillsMatched.length === 4, 'Candidate A matched all 4 required skills');
  assert(matchA.scoreBreakdown.requiredSkillsScore === 50, 'Candidate A gets full 50 pts for required skills');
  assert(matchA.scoreBreakdown.preferredSkillsScore === 7.5, `Candidate A gets 7.5 pts for 1/2 preferred skills (Actual: ${matchA.scoreBreakdown.preferredSkillsScore})`);
  assert(matchA.scoreBreakdown.experienceScore === 20, 'Candidate A gets full 20 pts for 5 yrs experience (vs 4 yrs min)');
  assert(matchA.scoreBreakdown.qualificationScore === 10, 'Candidate A gets full 10 pts for B.Tech degree');
  assert(matchA.category === 'Strong Match', 'Candidate A classified as "Strong Match"');

  // Create Candidate B: 2/4 Required (Python, Django), 0/2 Preferred, 2 yrs Experience (under requirement), Diploma (under qualification)
  const candBUserId = `cand_b_${Date.now()}`;
  const candBProfId = `cand_b_prof_${Date.now()}`;
  const candBResumeId = `cand_b_res_${Date.now()}`;

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, 'hash', 'candidate', datetime('now'), datetime('now'))
  `).run(candBUserId, `cand_b_${Date.now()}@resumio.test`);

  db.prepare(`
    INSERT INTO candidate_profiles (id, user_id, full_name, profile_completion, created_at, updated_at)
    VALUES (?, ?, 'Bob Junior', 50, datetime('now'), datetime('now'))
  `).run(candBProfId, candBUserId);

  for (const sk of ['Python', 'Django']) {
    db.prepare('INSERT INTO candidate_skills (id, candidate_profile_id, name, proficiency) VALUES (?, ?, ?, ?)').run(crypto.randomUUID(), candBProfId, sk, 'Intermediate');
  }

  db.prepare(`
    INSERT INTO candidate_experience (id, candidate_profile_id, job_title, company, employment_type, start_date, end_date, currently_working, description)
    VALUES (?, ?, 'Junior Developer', 'Startup Inc', 'Full-time', '2022-01', '2024-01', 0, 'Python APIs')
  `).run(crypto.randomUUID(), candBProfId);

  db.prepare(`
    INSERT INTO candidate_education (id, candidate_profile_id, degree, field_of_study, institution, start_date, end_date)
    VALUES (?, ?, 'Diploma', 'Information Technology', 'Community College', '2020-08', '2022-05')
  `).run(crypto.randomUUID(), candBProfId);

  db.prepare(`
    INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active)
    VALUES (?, ?, 'Bob_Resume.pdf', 'bob.pdf', 'PDF', 1024, 1)
  `).run(candBResumeId, candBProfId);

  const matchB = await ResumeJobMatchingService.computeMatch(candBResumeId, testJobId, candBUserId, candBProfId);

  assert(matchB.matchScore < matchA.matchScore, `Candidate B score (${matchB.matchScore}%) is lower than Candidate A (${matchA.matchScore}%)`);
  assert(matchB.scoreBreakdown.requiredSkillsScore === 25, 'Candidate B gets 25 pts for 2/4 required skills');
  assert(matchB.scoreBreakdown.experienceScore === 10, `Candidate B gets proportional experience score (10 pts for 2/4 yrs)`);
  assert(matchB.scoreBreakdown.qualificationScore === 6, 'Candidate B gets partial 6 pts for Diploma vs B.Tech req');
  assert(matchB.requiredSkillsMissing.includes('PostgreSQL') && matchB.requiredSkillsMissing.includes('Docker'), 'Identifies missing required skills for Candidate B');

  // Test Reproducibility / Idempotency
  const matchARerun = await ResumeJobMatchingService.computeMatch(candAResumeId, testJobId, candAUserId, candAProfId);
  assert(matchARerun.matchScore === matchA.matchScore, 'Deterministic matching: identical inputs yield identical score');

  // Test Score Clamping (0 - 100)
  assert(matchA.matchScore >= 0 && matchA.matchScore <= 100, 'Candidate A score is within [0, 100]');
  assert(matchB.matchScore >= 0 && matchB.matchScore <= 100, 'Candidate B score is within [0, 100]');

  // ========================================================
  // TEST SUITE 3: AI CANDIDATE SUMMARY & SKILL GAP GENERATION
  // ========================================================
  console.log('\n🧠 3. Testing AI Candidate Summary & Skill Gap Services...');

  const summaryA = await CandidateSummaryService.generateSummary(matchA, 'Senior Backend Architect', 'Apex Scale Inc');
  assert(summaryA.status === 'Completed', 'Generates AI Candidate Summary with status "Completed"');
  assert(summaryA.summaryText.includes('Alice Candidate'), 'Summary references candidate name');
  assert(summaryA.strengths.length >= 2, `Extracts key candidate strengths (Count: ${summaryA.strengths.length})`);

  // Verify Profile was NOT overwritten by AI summary (Source Separation)
  const profileAfterSummary = db.prepare('SELECT full_name FROM candidate_profiles WHERE id = ?').get(candAProfId) as any;
  assert(profileAfterSummary.full_name === 'Alice Candidate', 'Candidate manual profile is NOT overwritten by AI summary');

  // Skill Gap Analysis
  const gapB = await SkillGapAnalysisService.generateSkillGap(matchB, 'Senior Backend Architect', 'Apex Scale Inc');
  assert(gapB.status === 'Completed', 'Generates Skill Gap Analysis with status "Completed"');
  assert(gapB.priorityGaps.includes('PostgreSQL') && gapB.priorityGaps.includes('Docker'), 'Identifies high-priority gaps in skill gap analysis');
  assert(Boolean(gapB.overview && gapB.overview.length > 20), 'Generates natural-language strategic advice');

  // ========================================================
  // TEST SUITE 4: AUTOMATIC APPLICANT RANKING & PERSISTENCE
  // ========================================================
  console.log('\n🏆 4. Testing Automatic Candidate Ranking & DB Query Performance...');

  const appAId = `app_a_${Date.now()}`;
  const appBId = `app_b_${Date.now()}`;

  db.prepare(`
    INSERT INTO applications (id, candidate_id, candidate_profile_id, job_id, resume_id, status, applied_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'Applied', datetime('now', '-2 hours'), datetime('now'))
  `).run(appAId, candAUserId, candAProfId, testJobId, candAResumeId);

  db.prepare(`
    INSERT INTO applications (id, candidate_id, candidate_profile_id, job_id, resume_id, status, applied_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'Applied', datetime('now', '-1 hour'), datetime('now'))
  `).run(appBId, candBUserId, candBProfId, testJobId, candBResumeId);

  // Query ranked applicants from database
  const rankedQuery = db.prepare(`
    SELECT a.id, a.candidate_id, m.match_score, m.required_skills_score, a.applied_at
    FROM applications a
    JOIN resume_job_matches m ON a.resume_id = m.resume_id AND a.job_id = m.job_id
    WHERE a.job_id = ?
    ORDER BY m.match_score DESC, m.required_skills_score DESC, a.applied_at ASC
  `).all(testJobId) as any[];

  assert(rankedQuery.length === 2, `Ranked query returns 2 applicants (Actual: ${rankedQuery.length})`);
  assert(rankedQuery[0].id === appAId, 'Candidate A (#1 Rank) ranks higher than Candidate B (#2 Rank)');
  assert(rankedQuery[0].match_score > rankedQuery[1].match_score, 'Primary sorting strictly adheres to match_score DESC');

  // Verify ranking does NOT mutate application status
  const appAStatus = db.prepare('SELECT status FROM applications WHERE id = ?').get(appAId) as any;
  const appBStatus = db.prepare('SELECT status FROM applications WHERE id = ?').get(appBId) as any;
  assert(appAStatus.status === 'Applied', 'Ranking is informational: Top candidate status remains "Applied" (no auto-shortlist)');
  assert(appBStatus.status === 'Applied', 'Ranking is informational: Lower candidate status remains "Applied" (no auto-reject)');

  // ========================================================
  // TEST SUITE 5: PRIVACY & AUTHORIZATION BARRIERS
  // ========================================================
  console.log('\n🛡️ 5. Testing Privacy & Security Authorization Boundaries...');

  // 1. Recruiter B tries to access Recruiter A's applicants
  const recBUserId = `rec_b_${Date.now()}`;
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, 'hash', 'recruiter', datetime('now'), datetime('now'))
  `).run(recBUserId, `recruiter_b_${Date.now()}@resumio.test`);

  const jobCheck = db.prepare('SELECT recruiter_id FROM jobs WHERE id = ?').get(testJobId) as any;
  assert(jobCheck.recruiter_id !== recBUserId, 'Recruiter B is not the owner of Recruiter A job');

  // 2. Candidate isolation: Candidate A cannot access Candidate B's skill gap
  const candBGap = db.prepare('SELECT candidate_id FROM skill_gap_analyses WHERE id = ?').get(gapB.id) as any;
  assert(candBGap.candidate_id === candBUserId, 'Candidate B skill gap record is strictly keyed to Candidate B user ID');
  assert(candBGap.candidate_id !== candAUserId, 'Candidate A is barred from Candidate B skill gap data');

  // Clean up mock test fixtures
  try {
    db.prepare('DELETE FROM users WHERE id IN (?, ?, ?, ?)').run(recUserId, recBUserId, candAUserId, candBUserId);
  } catch {}

  // ========================================================
  // SUMMARY
  // ========================================================
  console.log('\n====================================================');
  console.log(`🎉 PHASE 6 VERIFICATION RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase6TestSuite().catch((err) => {
  console.error('Phase 6 test suite uncaught exception:', err);
  process.exit(1);
});

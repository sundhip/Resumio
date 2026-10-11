import crypto from 'crypto';
import { db, initDatabase } from './database/db.js';
import { mongoDb } from './database/mongoAdapter.js';
import { SkillNormalizationService } from './services/skillNormalizer.js';
import { ResumeJobMatchingService } from './services/matchingService.js';
import {
  MATCHING_MODEL_CONFIG,
  validateScoringWeights,
  computeLexicalCosineSimilarity,
} from './services/matchingConfig.js';
import { CandidateSummaryService } from './services/candidateSummaryService.js';
import { SkillGapAnalysisService } from './services/skillGapService.js';
import { MatchExplanationService } from './services/matchExplanationService.js';

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

async function runAdvancedMatchingTests() {
  console.log('====================================================');
  console.log('🧪 RESUMIO PHASE 6: ADVANCED AI MATCHING & EXPLAINABLE SCORING SUITE');
  console.log('====================================================\n');

  await initDatabase();

  // ========================================================
  // 1. SCORING CONFIGURATION, WEIGHTS & VERSIONING
  // ========================================================
  console.log('📐 1. Testing Scoring Model Configuration & Weight Integrity...');

  assert(MATCHING_MODEL_CONFIG.version === '2.0.0', 'Algorithm version is documented as 2.0.0');
  assert(validateScoringWeights(MATCHING_MODEL_CONFIG.weights), 'Default scoring weights sum exactly to 100%');
  assert(!validateScoringWeights({ ...MATCHING_MODEL_CONFIG.weights, requiredSkills: -10 } as any), 'Rejects negative weights');
  assert(!validateScoringWeights({ ...MATCHING_MODEL_CONFIG.weights, requiredSkills: 60 } as any), 'Rejects weights that do not sum to 100%');

  // ========================================================
  // 2. TF-IDF LEXICAL COSINE SEMANTIC SIMILARITY
  // ========================================================
  console.log('\n🔍 2. Testing Lexical Cosine Semantic Relevance Calculation...');

  const textResume = 'Senior Full Stack Developer specializing in React, TypeScript, and microservice APIs with Node.js and PostgreSQL.';
  const textJobMatch = 'Looking for a Senior Full Stack Engineer proficient with React, TypeScript, and scalable Node.js microservices.';
  const textJobUnrelated = 'Experienced Sous Chef responsible for culinary menu design, pastry preparation, and kitchen sanitation.';

  const simMatch = computeLexicalCosineSimilarity(textResume, textJobMatch);
  const simUnrelated = computeLexicalCosineSimilarity(textResume, textJobUnrelated);

  assert(simMatch > simUnrelated, `Semantic cosine distinguishes relevant text (${simMatch}%) vs unrelated text (${simUnrelated}%)`);
  assert(simMatch >= 0 && simMatch <= 100, 'Cosine similarity is bounded within [0, 100]');
  assert(simUnrelated >= 0 && simUnrelated <= 100, 'Cosine similarity baseline is bounded within [0, 100]');

  // ========================================================
  // 3. EVIDENCE-BASED REQUIREMENT COMPARISON
  // ========================================================
  console.log('\n📋 3. Testing Evidence-Based Multi-Component Matching Pipeline...');

  // Setup test job
  const testRecruiterId = `rec_adv_${Date.now()}`;
  const testRecProfileId = `rec_prof_adv_${Date.now()}`;
  const testJobId = `job_adv_${Date.now()}`;

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, 'hash', 'recruiter', datetime('now'), datetime('now'))
  `).run(testRecruiterId, `recruiter_adv_${Date.now()}@resumio.test`);

  db.prepare(`
    INSERT INTO recruiter_profiles (id, user_id, full_name, company_name, created_at, updated_at)
    VALUES (?, ?, 'VP of Talent', 'Quantum Systems', datetime('now'), datetime('now'))
  `).run(testRecProfileId, testRecruiterId);

  db.prepare(`
    INSERT INTO jobs (id, recruiter_id, recruiter_profile_id, title, description, company_name, min_experience, qualification, employment_type, work_mode, status, created_at, updated_at)
    VALUES (?, ?, ?, 'Principal Cloud Architect', 'Design resilient multi-region cloud systems with Kubernetes and Go', 'Quantum Systems', 5, 'Master', 'Full-time', 'Remote', 'Published', datetime('now'), datetime('now'))
  `).run(testJobId, testRecruiterId, testRecProfileId);

  const reqSkills = ['Go', 'Kubernetes', 'Docker', 'AWS Cloud'];
  for (const r of reqSkills) {
    db.prepare('INSERT INTO job_required_skills (id, job_id, name) VALUES (?, ?, ?)').run(crypto.randomUUID(), testJobId, r);
  }

  const prefSkills = ['Terraform', 'Prometheus'];
  for (const p of prefSkills) {
    db.prepare('INSERT INTO job_preferred_skills (id, job_id, name) VALUES (?, ?, ?)').run(crypto.randomUUID(), testJobId, p);
  }

  // Setup Candidate A: Strong Match (All reqs, 1 pref, 6 yrs exp, Master's degree)
  const candAId = `cand_adv_a_${Date.now()}`;
  const candAProfileId = `cand_prof_adv_a_${Date.now()}`;
  const candAResumeId = `cand_res_adv_a_${Date.now()}`;

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, 'hash', 'candidate', datetime('now'), datetime('now'))
  `).run(candAId, `cand_adv_a_${Date.now()}@resumio.test`);

  db.prepare(`
    INSERT INTO candidate_profiles (id, user_id, full_name, profile_completion, created_at, updated_at)
    VALUES (?, ?, 'Elena Rostova', 95, datetime('now'), datetime('now'))
  `).run(candAProfileId, candAId);

  for (const s of ['Go', 'Kubernetes', 'Docker', 'AWS Cloud', 'Terraform']) {
    db.prepare('INSERT INTO candidate_skills (id, candidate_profile_id, name, proficiency) VALUES (?, ?, ?, ?)').run(crypto.randomUUID(), candAProfileId, s, 'Expert');
  }

  db.prepare(`
    INSERT INTO candidate_experience (id, candidate_profile_id, job_title, company, employment_type, start_date, end_date, currently_working, description)
    VALUES (?, ?, 'Staff Cloud Engineer', 'HyperScale Cloud', 'Full-time', '2018-01', '2024-04', 0, 'Kubernetes and Go systems')
  `).run(crypto.randomUUID(), candAProfileId);

  db.prepare(`
    INSERT INTO candidate_education (id, candidate_profile_id, degree, field_of_study, institution, start_date, end_date)
    VALUES (?, ?, 'Master of Science', 'Distributed Computing', 'MIT', '2016-08', '2018-05')
  `).run(crypto.randomUUID(), candAProfileId);

  db.prepare(`
    INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active)
    VALUES (?, ?, 'Elena_Rostova.pdf', 'elena.pdf', 'PDF', 2048, 1)
  `).run(candAResumeId, candAProfileId);

  const matchA = await ResumeJobMatchingService.computeMatch(candAResumeId, testJobId, candAId, candAProfileId);

  assert(matchA.algorithmVersion === '2.0.0', 'Match record tags algorithm version 2.0.0');
  assert(matchA.matchScore >= 85, `Candidate Elena receives high score (${matchA.matchScore}%)`);
  assert(matchA.requiredSkillsMatched.length === 4, 'Candidate Elena matched all 4 required skills');
  assert(matchA.evidenceList.length >= 6, `Produces structured evidence items for every requirement (Count: ${matchA.evidenceList.length})`);
  assert(matchA.evidenceList.every((e) => typeof e.evidenceText === 'string' && e.evidenceText.length > 5), 'Every evidence item contains descriptive source evidence');

  // Verify MongoDB dual-store persistence
  const mongoMatch = await mongoDb.resume_job_matches.findOne({ resume_id: candAResumeId, job_id: testJobId });
  assert(Boolean(mongoMatch), 'Match result persists into MongoDB resume_job_matches collection');
  assert(mongoMatch?.match_score === matchA.matchScore, 'MongoDB match score matches calculated score exactly');

  // ========================================================
  // 4. FAIRNESS & NON-DISCRIMINATION CONTROLS
  // ========================================================
  console.log('\n🛡️ 4. Testing Fairness & Protected Characteristics Isolation...');

  // Setup identical twin candidate with different gender/ethnicity name proxy and career gap note
  const candTwinId = `cand_twin_${Date.now()}`;
  const candTwinProfileId = `cand_prof_twin_${Date.now()}`;
  const candTwinResumeId = `cand_res_twin_${Date.now()}`;

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, 'hash', 'candidate', datetime('now'), datetime('now'))
  `).run(candTwinId, `cand_twin_${Date.now()}@resumio.test`);

  db.prepare(`
    INSERT INTO candidate_profiles (id, user_id, full_name, profile_completion, created_at, updated_at)
    VALUES (?, ?, 'Kofi Mensah', 95, datetime('now'), datetime('now'))
  `).run(candTwinProfileId, candTwinId);

  for (const s of ['Go', 'Kubernetes', 'Docker', 'AWS Cloud', 'Terraform']) {
    db.prepare('INSERT INTO candidate_skills (id, candidate_profile_id, name, proficiency) VALUES (?, ?, ?, ?)').run(crypto.randomUUID(), candTwinProfileId, s, 'Expert');
  }

  db.prepare(`
    INSERT INTO candidate_experience (id, candidate_profile_id, job_title, company, employment_type, start_date, end_date, currently_working, description)
    VALUES (?, ?, 'Staff Cloud Engineer', 'HyperScale Cloud', 'Full-time', '2018-01', '2024-04', 0, 'Kubernetes and Go systems')
  `).run(crypto.randomUUID(), candTwinProfileId);

  db.prepare(`
    INSERT INTO candidate_education (id, candidate_profile_id, degree, field_of_study, institution, start_date, end_date)
    VALUES (?, ?, 'Master of Science', 'Distributed Computing', 'MIT', '2016-08', '2018-05')
  `).run(crypto.randomUUID(), candTwinProfileId);

  db.prepare(`
    INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active)
    VALUES (?, ?, 'Kofi_Mensah.pdf', 'kofi.pdf', 'PDF', 2048, 1)
  `).run(candTwinResumeId, candTwinProfileId);

  const matchTwin = await ResumeJobMatchingService.computeMatch(candTwinResumeId, testJobId, candTwinId, candTwinProfileId);

  assert(matchTwin.matchScore === matchA.matchScore, `Fairness Guarantee: Identical qualifications produce identical scores regardless of name or background (${matchTwin.matchScore}% vs ${matchA.matchScore}%)`);
  assert(matchTwin.scoreBreakdown.requiredSkillsScore === matchA.scoreBreakdown.requiredSkillsScore, 'Required skill scores identical');
  assert(matchTwin.scoreBreakdown.experienceScore === matchA.scoreBreakdown.experienceScore, 'Experience scores identical');
  assert(matchTwin.scoreBreakdown.qualificationScore === matchA.scoreBreakdown.qualificationScore, 'Qualification scores identical');

  // ========================================================
  // 5. CANDIDATE RANKING & TIE HANDLING
  // ========================================================
  console.log('\n🏆 5. Testing Job-Specific Candidate Ranking & Deterministic Sorting...');

  const appAId = `app_adv_a_${Date.now()}`;
  const appTwinId = `app_adv_twin_${Date.now()}`;

  db.prepare(`
    INSERT INTO applications (id, candidate_id, candidate_profile_id, job_id, resume_id, status, applied_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'Applied', datetime('now', '-2 hours'), datetime('now'))
  `).run(appAId, candAId, candAProfileId, testJobId, candAResumeId);

  db.prepare(`
    INSERT INTO applications (id, candidate_id, candidate_profile_id, job_id, resume_id, status, applied_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'Applied', datetime('now', '-1 hour'), datetime('now'))
  `).run(appTwinId, candTwinId, candTwinProfileId, testJobId, candTwinResumeId);

  const rankedApps = db.prepare(`
    SELECT a.id, a.candidate_id, m.match_score, a.applied_at
    FROM applications a
    JOIN resume_job_matches m ON a.resume_id = m.resume_id AND a.job_id = m.job_id
    WHERE a.job_id = ?
    ORDER BY m.match_score DESC, a.applied_at ASC
  `).all(testJobId) as any[];

  assert(rankedApps.length === 2, 'Ranks applicants within job scope');
  assert(rankedApps[0].id === appAId, 'Stable tie-breaking: earlier applicant ranks first on equal match score');

  // ========================================================
  // 6. EXPLAINABILITY & SKILL-GAP RECOMMENDATIONS
  // ========================================================
  console.log('\n💬 6. Testing Explainability Breakdown & Skill-Gap Analysis...');

  const gapAnalysis = await SkillGapAnalysisService.generateSkillGap(matchA, 'Principal Cloud Architect', 'Quantum Systems');
  assert(gapAnalysis.status === 'Completed', 'Generates Skill Gap Analysis');
  assert(gapAnalysis.priorityGaps.length === 0, 'Identifies 0 missing required skills for Elena');
  assert(gapAnalysis.preferredGaps.includes('Prometheus'), 'Identifies nice-to-have secondary preferred skill gap');

  console.log('\n====================================================');
  console.log(`🎉 PHASE 6 ADVANCED MATCHING RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAdvancedMatchingTests().catch((err) => {
  console.error('Advanced matching test execution error:', err);
  process.exit(1);
});

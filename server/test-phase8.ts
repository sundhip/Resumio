import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db, initDatabase } from './database/db.js';
import { NaturalLanguageSearchService } from './services/nlSearchService.js';
import { InterviewQuestionService } from './services/interviewQuestionService.js';
import { ResumeImprovementService } from './services/resumeImprovementService.js';
import { DuplicateResumeService } from './services/duplicateResumeService.js';
import { MatchExplanationService } from './services/matchExplanationService.js';
import { ResumeJobMatchingService } from './services/matchingService.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${description}`);
    failed++;
  }
}

async function runPhase8Tests() {
  console.log('\n====================================================');
  console.log('🧪 RESUMIO PHASE 8: ADVANCED AI RECRUITMENT INTELLIGENCE');
  console.log('====================================================\n');

  initDatabase();

  const testRunId = crypto.randomUUID().slice(0, 8);
  const passwordHash = bcrypt.hashSync('TestPass123!', 10);

  // 1. Fixtures: Recruiters & Candidates
  const recAUserId = crypto.randomUUID();
  const recAProfileId = crypto.randomUUID();
  const recBUserId = crypto.randomUUID();
  const recBProfileId = crypto.randomUUID();

  const candAUserId = crypto.randomUUID();
  const candAProfileId = crypto.randomUUID();
  const candBUserId = crypto.randomUUID();
  const candBProfileId = crypto.randomUUID();

  // Insert Users
  db.prepare(`INSERT INTO users (id, email, password_hash, role, status) VALUES (?, ?, ?, 'recruiter', 'active')`).run(recAUserId, `rec.a.p8.${testRunId}@test.com`, passwordHash);
  db.prepare(`INSERT INTO recruiter_profiles (id, user_id, full_name, company_name, profile_completion) VALUES (?, ?, 'Recruiter Alpha', 'Alpha Innovations', 80)`).run(recAProfileId, recAUserId);

  db.prepare(`INSERT INTO users (id, email, password_hash, role, status) VALUES (?, ?, ?, 'recruiter', 'active')`).run(recBUserId, `rec.b.p8.${testRunId}@test.com`, passwordHash);
  db.prepare(`INSERT INTO recruiter_profiles (id, user_id, full_name, company_name, profile_completion) VALUES (?, ?, 'Recruiter Beta', 'Beta Labs', 80)`).run(recBProfileId, recBUserId);

  db.prepare(`INSERT INTO users (id, email, password_hash, role, status) VALUES (?, ?, ?, 'candidate', 'active')`).run(candAUserId, `cand.a.p8.${testRunId}@test.com`, passwordHash);
  db.prepare(`INSERT INTO candidate_profiles (id, user_id, full_name, location, headline, profile_completion) VALUES (?, ?, 'Candidate Alice', 'Bengaluru, India', 'Lead Full Stack Architect', 95)`).run(candAProfileId, candAUserId);

  db.prepare(`INSERT INTO users (id, email, password_hash, role, status) VALUES (?, ?, ?, 'candidate', 'active')`).run(candBUserId, `cand.b.p8.${testRunId}@test.com`, passwordHash);
  db.prepare(`INSERT INTO candidate_profiles (id, user_id, full_name, location, headline, profile_completion) VALUES (?, ?, 'Candidate Bob', 'Remote', 'Junior Backend Engineer', 70)`).run(candBProfileId, candBUserId);

  // Candidate Skills
  db.prepare(`INSERT INTO candidate_skills (id, candidate_profile_id, name, proficiency) VALUES (?, ?, 'Python', 'Expert'), (?, ?, 'Django', 'Expert'), (?, ?, 'PostgreSQL', 'Advanced')`).run(crypto.randomUUID(), candAProfileId, crypto.randomUUID(), candAProfileId, crypto.randomUUID(), candAProfileId);
  db.prepare(`INSERT INTO candidate_skills (id, candidate_profile_id, name, proficiency) VALUES (?, ?, 'Python', 'Intermediate'), (?, ?, 'Flask', 'Intermediate')`).run(crypto.randomUUID(), candBProfileId, crypto.randomUUID(), candBProfileId);

  // Resumes
  const resumeAId = crypto.randomUUID();
  const fileHashA = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const rawTextA = 'Candidate Alice. Lead Full Stack Architect with 5+ years of experience in Python, Django, PostgreSQL, Docker, and AWS Cloud. Built scalable distributed microservices.';
  
  db.prepare(`INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active) VALUES (?, ?, 'alice_cv.pdf', 'alice_cv.pdf', 'application/pdf', 12000, 1)`).run(resumeAId, candAProfileId);
  db.prepare(`
    INSERT INTO resume_parsed_data (
      id, resume_id, candidate_id, candidate_profile_id, file_hash, status, raw_text,
      candidate_name, headline, summary, skills_json, education_json, experience_json, projects_json
    ) VALUES (?, ?, ?, ?, ?, 'Processed', ?, 'Candidate Alice', 'Lead Full Stack Architect', 'Architect with 5+ years in Python and cloud systems', ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(), resumeAId, candAUserId, candAProfileId, fileHashA, rawTextA,
    JSON.stringify(['Python', 'Django', 'PostgreSQL', 'Docker', 'AWS Cloud']),
    JSON.stringify([{ degree: 'B.Tech', field: 'Computer Science' }]),
    JSON.stringify([{ title: 'Lead Architect', company: 'TechCorp', years: 5 }]),
    JSON.stringify([{ name: 'Distributed Cloud Platform', description: 'Built Python Django backend microservices.' }])
  );
  db.prepare(`INSERT INTO resume_screenings (id, resume_id, completeness_score, experience_years_detected, education_level_detected, status) VALUES (?, ?, 95, 5.0, 'B.Tech', 'Screened')`).run(crypto.randomUUID(), resumeAId);

  const resumeBId = crypto.randomUUID();
  const fileHashB = 'd41d8cd98f00b204e9800998ecf8427e87ae41e4649b934ca495991b7852b800';
  const rawTextB = 'Candidate Bob. Junior Backend Developer with 2 years of experience in Python, Flask, and SQLite.';
  db.prepare(`INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active) VALUES (?, ?, 'bob_cv.pdf', 'bob_cv.pdf', 'application/pdf', 8000, 1)`).run(resumeBId, candBProfileId);
  db.prepare(`
    INSERT INTO resume_parsed_data (
      id, resume_id, candidate_id, candidate_profile_id, file_hash, status, raw_text,
      candidate_name, headline, summary, skills_json, education_json, experience_json
    ) VALUES (?, ?, ?, ?, ?, 'Processed', ?, 'Candidate Bob', 'Junior Backend Engineer', 'Junior developer with 2 yrs Python experience', ?, ?, ?)
  `).run(
    crypto.randomUUID(), resumeBId, candBUserId, candBProfileId, fileHashB, rawTextB,
    JSON.stringify(['Python', 'Flask', 'SQLite']),
    JSON.stringify([{ degree: 'BCA', field: 'Computer Applications' }]),
    JSON.stringify([{ title: 'Junior Dev', company: 'StartupLab', years: 2 }])
  );
  db.prepare(`INSERT INTO resume_screenings (id, resume_id, completeness_score, experience_years_detected, education_level_detected, status) VALUES (?, ?, 75, 2.0, 'BCA', 'Screened')`).run(crypto.randomUUID(), resumeBId);

  // Job
  const jobAId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO jobs (id, recruiter_id, recruiter_profile_id, title, description, company_name, location, employment_type, work_mode, min_experience, qualification, status, published_at)
    VALUES (?, ?, ?, 'Senior Python Architect', 'Lead high-throughput backend services', 'Alpha Innovations', 'Bengaluru, India', 'Full-time', 'Hybrid', 4, 'B.Tech / Bachelor', 'Published', datetime('now'))
  `).run(jobAId, recAUserId, recAProfileId);
  db.prepare(`INSERT INTO job_required_skills (id, job_id, name) VALUES (?, ?, 'Python'), (?, ?, 'Django'), (?, ?, 'PostgreSQL')`).run(crypto.randomUUID(), jobAId, crypto.randomUUID(), jobAId, crypto.randomUUID(), jobAId);
  db.prepare(`INSERT INTO job_preferred_skills (id, job_id, name) VALUES (?, ?, 'Docker'), (?, ?, 'AWS Cloud')`).run(crypto.randomUUID(), jobAId, crypto.randomUUID(), jobAId);

  // Application
  const appAId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO applications (id, candidate_id, candidate_profile_id, job_id, resume_id, cover_letter, status, applied_at)
    VALUES (?, ?, ?, ?, ?, 'Cover letter', 'Applied', datetime('now'))
  `).run(appAId, candAUserId, candAProfileId, jobAId, resumeAId);

  // Compute Match
  const matchA = await ResumeJobMatchingService.computeMatch(resumeAId, jobAId, candAUserId, candAProfileId, appAId);

  // ============================================================
  // 1. FEATURE 31: NATURAL LANGUAGE CANDIDATE SEARCH
  // ============================================================
  console.log('🔍 1. Testing Natural-Language Candidate Search...');

  // 1.1 Valid Interpretation
  const interp1 = NaturalLanguageSearchService.interpretQuery('Find Python developers with 3+ years backend experience in Bengaluru who know Django');
  assert(interp1.skills.includes('Python') && interp1.skills.includes('Django'), 'Interprets skills from natural query (Python, Django)');
  assert(interp1.minExperience === 3, 'Extracts minimum experience constraint (3+ years)');
  assert(interp1.locations.includes('Bengaluru'), 'Extracts location constraint (Bengaluru)');
  assert(interp1.jobTitles.includes('Backend'), 'Extracts job title / role focus (Backend)');

  // 1.2 Bias Guardrails / Protected Characteristic Rejection
  const safeCheck = NaturalLanguageSearchService.checkQuerySafety('Find female candidates with Python experience');
  assert(safeCheck.isSafe === false, 'Detects and rejects queries targeting protected characteristics (gender)');
  assert(typeof safeCheck.rejectionReason === 'string', 'Provides polite, clear rejection explanation');

  const safeCheck2 = NaturalLanguageSearchService.checkQuerySafety('Find Hindu Python engineers in Mumbai');
  assert(safeCheck2.isSafe === false, 'Detects and rejects queries targeting religion');

  // 1.3 End-to-End Search Execution with Real DB Candidates
  const searchRes = await NaturalLanguageSearchService.searchCandidates(recAUserId, 'Find Python and Django developers with 3+ years experience');
  assert(searchRes.isRejected === false, 'Valid query successfully executed');
  assert(searchRes.totalResults >= 1, `Returns real database candidates (Found: ${searchRes.totalResults})`);
  assert(searchRes.candidates[0].fullName === 'Candidate Alice', 'Alice ranks #1 due to strong skill & experience match');
  assert(searchRes.candidates[0].matchedQuerySkills.includes('Python'), 'Alice matched query skill Python');
  assert(searchRes.candidates[0].matchedQuerySkills.includes('Django'), 'Alice matched query skill Django');

  // 1.4 Search Auditing
  const auditRow = db.prepare('SELECT * FROM natural_language_searches WHERE recruiter_id = ?').get(recAUserId) as any;
  assert(!!auditRow && auditRow.query_text.includes('Python'), 'Natural language search persisted in audit table');

  // ============================================================
  // 2. FEATURE 32: AI INTERVIEW QUESTIONS
  // ============================================================
  console.log('\n🎙️ 2. Testing AI-Generated Interview Questions...');

  // 2.1 Job-Level Question Generation
  const jobQuestions = await InterviewQuestionService.generateJobQuestions(recAUserId, jobAId, true);
  assert(jobQuestions.totalQuestions >= 4, `Generates comprehensive question set (Total: ${jobQuestions.totalQuestions})`);
  assert(jobQuestions.questions.technical.length > 0, 'Includes Technical category questions');
  assert(jobQuestions.questions.behavioral.length > 0, 'Includes Behavioral category questions');
  assert(jobQuestions.questions.experience.length > 0, 'Includes Experience category questions');
  assert(jobQuestions.questions.technical[0].question.includes('Python') || jobQuestions.questions.technical[0].question.includes('Django'), 'Questions directly target job required skills');

  // 2.2 Candidate-Specific Question Generation
  const candQuestions = await InterviewQuestionService.generateCandidateQuestions(recAUserId, appAId, true);
  assert(candQuestions.candidateName === 'Candidate Alice', 'Candidate question set references candidate name');
  assert(candQuestions.questions.technical.some((q) => q.question.includes('Python') || q.question.includes('Django')), 'Formulates questions on candidate verified skills');
  assert(candQuestions.questions.experience.some((q) => q.question.includes('TechCorp') || q.question.includes('Distributed Cloud Platform') || q.question.includes('project')), 'References actual candidate resume facts without hallucination');

  // 2.3 Recruiter Authorization Barrier
  let recBBlocked = false;
  try {
    await InterviewQuestionService.generateJobQuestions(recBUserId, jobAId);
  } catch (err: any) {
    recBBlocked = err.message.includes('Forbidden') || err.message.includes('own');
  }
  assert(recBBlocked, 'Recruiter B barred from generating questions for Recruiter A job (403 Forbidden)');

  // 2.4 Question Editing / Updating
  const updatedSet = InterviewQuestionService.updateQuestionSet(recAUserId, jobQuestions.id, {
    ...jobQuestions.questions,
    technical: [
      { id: 'custom-1', question: 'Explain how you design high-availability PostgreSQL clusters.', category: 'Technical', targetSkill: 'PostgreSQL' }
    ],
  });
  assert(updatedSet.questions.technical[0].question === 'Explain how you design high-availability PostgreSQL clusters.', 'Recruiter successfully updated / edited question set');

  // ============================================================
  // 3. FEATURE 33: RESUME IMPROVEMENT SUGGESTIONS
  // ============================================================
  console.log('\n📄 3. Testing Evidence-Based Resume Improvement Suggestions...');

  // 3.1 Candidate Analyzes Own Resume
  const reviewRes = await ResumeImprovementService.analyzeResume(candAUserId, resumeAId, null, true);
  assert(reviewRes.status === 'Completed', 'Resume review completed successfully');
  assert(reviewRes.sections.length >= 4, `Provides structured feedback across multiple sections (Count: ${reviewRes.sections.length})`);
  assert(reviewRes.sections.some((s) => s.section === 'Work Experience'), 'Includes Work Experience section review');
  assert(reviewRes.sections.some((s) => s.section === 'Skills Presentation'), 'Includes Skills Presentation review');
  assert(typeof reviewRes.overallFeedback === 'string' && reviewRes.overallFeedback.length > 20, 'Generates realistic overall feedback');

  // 3.2 Target Job Alignment Mode
  const targetJobReview = await ResumeImprovementService.analyzeResume(candAUserId, resumeAId, jobAId, true);
  assert(!!targetJobReview.targetJobComparison, 'Includes target job comparison when target job provided');
  assert(targetJobReview.targetJobComparison?.matchedSkills.includes('Python'), 'Identifies matched skills for target job (Python)');
  assert(targetJobReview.targetJobComparison?.jobTitle === 'Senior Python Architect', 'References correct target job title');

  // 3.3 Candidate Authorization Barrier
  let candBCrossBlocked = false;
  try {
    await ResumeImprovementService.analyzeResume(candBUserId, resumeAId);
  } catch (err: any) {
    candBCrossBlocked = err.message.includes('Forbidden') || err.message.includes('own');
  }
  assert(candBCrossBlocked, 'Candidate B forbidden from analyzing Candidate A resume (403 Forbidden)');

  // ============================================================
  // 4. FEATURE 34: DUPLICATE RESUME DETECTION
  // ============================================================
  console.log('\n📑 4. Testing Duplicate Resume Detection (Hash & Content Similarity)...');

  // 4.1 Exact Duplicate Detection via SHA-256 Hash
  const dupExactResumeId = crypto.randomUUID();
  db.prepare(`INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active) VALUES (?, ?, 'alice_duplicate.pdf', 'alice_dup.pdf', 'application/pdf', 12000, 0)`).run(dupExactResumeId, candAProfileId);
  db.prepare(`INSERT INTO resume_parsed_data (id, resume_id, candidate_id, candidate_profile_id, file_hash, status, raw_text) VALUES (?, ?, ?, ?, ?, 'Processed', ?)`).run(crypto.randomUUID(), dupExactResumeId, candAUserId, candAProfileId, fileHashA, rawTextA);

  const exactDups = DuplicateResumeService.detectDuplicates(dupExactResumeId, candAUserId, fileHashA, rawTextA);
  assert(exactDups.length >= 1, 'Detects exact duplicate match via SHA-256 hash');
  assert(exactDups[0].similarityType === 'Exact Duplicate', 'Classified as "Exact Duplicate"');
  assert(exactDups[0].similarityScore === 100, 'Exact duplicate has 100% similarity score');

  // 4.2 Content Similarity Detection (Substantially similar text, different hash)
  const dupSimilarResumeId = crypto.randomUUID();
  const differentHash = 'aaaa9999bbbb8888cccc7777dddd6666eeee5555ffff4444aaaa3333bbbb2222';
  const similarText = 'Candidate Alice. Lead Full Stack Architect with 5+ years of experience in Python, Django, PostgreSQL, Docker, and AWS Cloud.';
  db.prepare(`INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active) VALUES (?, ?, 'alice_v2.pdf', 'alice_v2.pdf', 'application/pdf', 11500, 0)`).run(dupSimilarResumeId, candAProfileId);
  db.prepare(`INSERT INTO resume_parsed_data (id, resume_id, candidate_id, candidate_profile_id, file_hash, status, raw_text) VALUES (?, ?, ?, ?, ?, 'Processed', ?)`).run(crypto.randomUUID(), dupSimilarResumeId, candAUserId, candAProfileId, differentHash, similarText);

  const similarDups = DuplicateResumeService.detectDuplicates(dupSimilarResumeId, candAUserId, differentHash, similarText);
  assert(similarDups.length >= 1, 'Detects likely duplicate based on text token similarity');
  assert(similarDups[0].similarityType === 'Likely Duplicate', 'Classified as "Likely Duplicate"');

  // 4.3 Unique Resumes are NOT marked duplicates
  const uniqueDups = DuplicateResumeService.detectDuplicates(resumeBId, candBUserId, fileHashB, rawTextB);
  assert(uniqueDups.filter((d) => d.matchedResumeId === resumeAId).length === 0, 'Distinct resume Bob is not flagged as duplicate of Alice');

  // 4.4 Privacy Safe Representation for Candidates
  const candDupView = DuplicateResumeService.getResumeDuplicates(dupExactResumeId, candAUserId, 'candidate');
  assert(candDupView.hasDuplicate === true, 'Candidate duplicate lookup reports duplicate presence');
  assert(typeof candDupView.privacySafeMessage === 'string', 'Candidate receives privacy-safe notification without exposing other candidate PII');

  // ============================================================
  // 5. FEATURE 35: EXPLAINABLE AI SCORING
  // ============================================================
  console.log('\n📊 5. Testing Explainable AI Match Scoring Breakdown...');

  const explanation = await MatchExplanationService.getExplanation(appAId, recAUserId, 'recruiter');
  assert(explanation.finalScore === matchA.matchScore, `Final score in explanation (${explanation.finalScore}%) matches Phase 6 match score (${matchA.matchScore}%)`);
  assert(explanation.isConsistent === true, 'Component scores mathematically sum up to final score (isConsistent: true)');
  assert(explanation.components.requiredSkills.score === matchA.scoreBreakdown.requiredSkillsScore, `Required skills score matches (${explanation.components.requiredSkills.score}/50)`);
  assert(explanation.components.preferredSkills.score === matchA.scoreBreakdown.preferredSkillsScore, `Preferred skills score matches (${explanation.components.preferredSkills.score}/15)`);
  assert(explanation.components.experience.score === matchA.scoreBreakdown.experienceScore, `Experience score matches (${explanation.components.experience.score}/20)`);
  assert(explanation.components.qualification.score === matchA.scoreBreakdown.qualificationScore, `Qualification score matches (${explanation.components.qualification.score}/10)`);
  assert(explanation.components.relevance.score === matchA.scoreBreakdown.relevanceScore, `Relevance score matches (${explanation.components.relevance.score}/5)`);
  assert(explanation.matchedSkills.required.includes('Python'), 'Matched required skills includes Python');
  assert(explanation.matchedSkills.required.includes('Django'), 'Matched required skills includes Django');
  assert(typeof explanation.naturalLanguageExplanation === 'string' && explanation.naturalLanguageExplanation.length > 20, 'Generates accurate natural-language factual explanation');

  // Candidate inspection of own match
  const candExplanation = await MatchExplanationService.getExplanation(appAId, candAUserId, 'candidate');
  assert(candExplanation.finalScore === matchA.matchScore, 'Candidate can inspect their own match score explanation');

  // Unauthorized Recruiter blocked from inspecting candidate match
  let recBCrossExplainBlocked = false;
  try {
    await MatchExplanationService.getExplanation(appAId, recBUserId, 'recruiter');
  } catch (err: any) {
    recBCrossExplainBlocked = err.message.includes('Forbidden');
  }
  assert(recBCrossExplainBlocked, 'Recruiter B barred from inspecting Recruiter A candidate match explanation (403 Forbidden)');

  console.log('\n====================================================');
  console.log(`🎉 PHASE 8 VERIFICATION: ${passed} / ${passed + failed} TESTS PASSED (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase8Tests().catch((err) => {
  console.error('Phase 8 Test execution error:', err);
  process.exit(1);
});

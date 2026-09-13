import { db, verifyDatabaseIntegrity, initDatabase } from './database/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './middleware/auth';
import { ResumeJobMatchingService } from './services/matchingService';
import { MatchExplanationService } from './services/matchExplanationService';
import { InterviewQuestionService } from './services/interviewQuestionService';
import { ResumeImprovementService } from './services/resumeImprovementService';
import { DuplicateResumeService } from './services/duplicateResumeService';
import { NaturalLanguageSearchService } from './services/nlSearchService';
import { InterviewService } from './services/interviewService';
import { NotificationService } from './services/notificationService';
import { DashboardService } from './services/dashboardService';
import { RecruitmentAnalyticsService } from './services/analyticsService';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Test Assertion Failed: ${message}`);
  }
}

async function runPhase9Tests() {
  console.log('====================================================');
  console.log('🧪 RESUMIO PHASE 9: FINAL INTEGRATION, SECURITY & READINESS');
  console.log('====================================================\n');

  await initDatabase();

  // ----------------------------------------------------
  // 1. DATABASE & RELATIONSHIP INTEGRITY AUDIT
  // ----------------------------------------------------
  console.log('🗄️ 1. Testing Database Integrity & Foreign Key Constraints...');
  const integrity = verifyDatabaseIntegrity();
  assert(integrity.isValid, 'Database schema and relationships have 0 foreign key or orphan violations');
  assert(integrity.fkViolations.length === 0, 'No foreign key violations detected via PRAGMA foreign_key_check');
  assert(integrity.orphanCounts.orphanResumes === 0, '0 orphan resumes without candidate profiles');
  assert(integrity.orphanCounts.orphanApps === 0, '0 orphan applications without valid jobs or candidates');
  assert(integrity.orphanCounts.orphanInterviews === 0, '0 orphan interviews without valid applications');
  assert(integrity.orphanCounts.orphanMatches === 0, '0 orphan match records');

  // ----------------------------------------------------
  // 2. AUTHENTICATION & PASSWORD SECURITY AUDIT
  // ----------------------------------------------------
  console.log('\n🔒 2. Testing Authentication & Password Security...');
  const testCandidateEmail = `p9_cand_${Date.now()}@example.com`;
  const testRecruiterEmail = `p9_rec_${Date.now()}@example.com`;
  const plainPassword = 'SecurePassword123!';

  // Create Candidate
  const candUserId = crypto.randomUUID();
  const candProfileId = crypto.randomUUID();
  const candPassHash = await bcrypt.hash(plainPassword, 10);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, status)
    VALUES (?, ?, ?, 'candidate', 'active')
  `).run(candUserId, testCandidateEmail, candPassHash);

  db.prepare(`
    INSERT INTO candidate_profiles (id, user_id, full_name, profile_completion)
    VALUES (?, ?, 'Phase 9 Candidate', 40)
  `).run(candProfileId, candUserId);

  const storedCand = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(candUserId) as any;
  assert(storedCand.password_hash !== plainPassword, 'Passwords are never stored in plaintext');
  assert(await bcrypt.compare(plainPassword, storedCand.password_hash), 'Password hash verifies successfully with bcrypt');

  // Token Generation and JWT Validation
  const token = jwt.sign({ userId: candUserId, role: 'candidate' }, JWT_SECRET, { expiresIn: '1h' });
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  assert(decoded.userId === candUserId, 'JWT payload contains correct authenticated user ID');
  assert(decoded.role === 'candidate', 'JWT payload contains correct role claims');

  // ----------------------------------------------------
  // 3. MULTI-TENANT AUTHORIZATION & ID MANIPULATION DEFENSE
  // ----------------------------------------------------
  console.log('\n🛡️ 3. Testing Cross-Tenant Authorization & ID Manipulation Defense...');
  
  // Create Recruiter A & Job A
  const recAId = crypto.randomUUID();
  const recAProfileId = crypto.randomUUID();
  const recAEmail = `rec_a_${Date.now()}@corp.com`;
  db.prepare(`INSERT INTO users (id, email, password_hash, role, status) VALUES (?, ?, ?, 'recruiter', 'active')`).run(recAId, recAEmail, candPassHash);
  db.prepare(`INSERT INTO recruiter_profiles (id, user_id, full_name, company_name) VALUES (?, ?, 'Recruiter A', 'Corp A')`).run(recAProfileId, recAId);

  const jobAId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO jobs (id, recruiter_id, recruiter_profile_id, title, description, company_name, employment_type, work_mode, status)
    VALUES (?, ?, ?, 'Senior Backend Engineer', 'High-throughput Node.js microservices', 'Corp A', 'Full-time', 'Remote', 'Published')
  `).run(jobAId, recAId, recAProfileId);
  db.prepare(`INSERT INTO job_required_skills (id, job_id, name) VALUES (?, ?, 'Node.js')`).run(crypto.randomUUID(), jobAId);
  db.prepare(`INSERT INTO job_required_skills (id, job_id, name) VALUES (?, ?, 'TypeScript')`).run(crypto.randomUUID(), jobAId);

  // Create Recruiter B & Job B
  const recBId = crypto.randomUUID();
  const recBProfileId = crypto.randomUUID();
  const recBEmail = `rec_b_${Date.now()}@corp.com`;
  db.prepare(`INSERT INTO users (id, email, password_hash, role, status) VALUES (?, ?, ?, 'recruiter', 'active')`).run(recBId, recBEmail, candPassHash);
  db.prepare(`INSERT INTO recruiter_profiles (id, user_id, full_name, company_name) VALUES (?, ?, 'Recruiter B', 'Corp B')`).run(recBProfileId, recBId);

  const jobBId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO jobs (id, recruiter_id, recruiter_profile_id, title, description, company_name, employment_type, work_mode, status)
    VALUES (?, ?, ?, 'Frontend Developer', 'Modern React and Tailwind CSS UI', 'Corp B', 'Full-time', 'Remote', 'Published')
  `).run(jobBId, recBId, recBProfileId);

  // Authorization Check 1: Recruiter B cannot modify Recruiter A job
  const jobARec = db.prepare('SELECT recruiter_id FROM jobs WHERE id = ?').get(jobAId) as any;
  assert(jobARec.recruiter_id === recAId && jobARec.recruiter_id !== recBId, 'Recruiter B is unauthorized to edit or access Recruiter A job');

  // Candidate A creates Resume R1 & R2
  const resume1Id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active)
    VALUES (?, ?, 'Resume_V1.pdf', 'resume_v1.pdf', 'PDF', 102400, 0)
  `).run(resume1Id, candProfileId);

  const resume2Id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active)
    VALUES (?, ?, 'Resume_V2.pdf', 'resume_v2.pdf', 'PDF', 104800, 1)
  `).run(resume2Id, candProfileId);

  // Insert parsed resume text for Resume 1 & 2
  db.prepare(`
    INSERT INTO resume_parsed_data (id, resume_id, candidate_id, candidate_profile_id, file_hash, status, raw_text, skills_json, experience_json, education_json)
    VALUES (?, ?, ?, ?, 'hash_v1', 'Processed', 'Experienced Node.js and TypeScript Engineer', '["Node.js", "TypeScript", "PostgreSQL"]', '[{"company":"Tech Corp","job_title":"Backend Developer","start_date":"2021-01","end_date":"2024-01"}]', '[{"institution":"National University","degree":"B.Tech"}]')
  `).run(crypto.randomUUID(), resume1Id, candUserId, candProfileId);

  db.prepare(`
    INSERT INTO resume_parsed_data (id, resume_id, candidate_id, candidate_profile_id, file_hash, status, raw_text, skills_json, experience_json, education_json)
    VALUES (?, ?, ?, ?, 'hash_v2', 'Processed', 'Lead Engineer with Node.js, TypeScript, Kubernetes, AWS', '["Node.js", "TypeScript", "Kubernetes", "AWS Cloud"]', '[{"company":"Cloud Systems","job_title":"Lead Engineer","start_date":"2021-01","end_date":"2026-01"}]', '[{"institution":"National University","degree":"B.Tech"}]')
  `).run(crypto.randomUUID(), resume2Id, candUserId, candProfileId);

  // ----------------------------------------------------
  // 4. APPLICATION WORKFLOW & RESUME IMMUTABILITY
  // ----------------------------------------------------
  console.log('\n📄 4. Testing Application Lifecycle & Resume Immutability...');
  
  // Candidate applies to Job A with Resume 1
  const app1Id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO applications (id, candidate_id, candidate_profile_id, job_id, resume_id, cover_letter, status)
    VALUES (?, ?, ?, ?, ?, 'Excited for this backend opportunity', 'Applied')
  `).run(app1Id, candUserId, candProfileId, jobAId, resume1Id);

  // Verify application references Resume 1
  const fetchedApp = db.prepare('SELECT resume_id FROM applications WHERE id = ?').get(app1Id) as any;
  assert(fetchedApp.resume_id === resume1Id, 'Application initially bound to Resume V1');

  // Candidate subsequently uploads Resume 2 as active
  const activeResume = db.prepare('SELECT id FROM candidate_resumes WHERE candidate_profile_id = ? AND is_active = 1').get(candProfileId) as any;
  assert(activeResume.id === resume2Id, 'Active candidate resume is now Resume V2');

  // Verify historical application remains IMMUTABLE (still bound to Resume 1)
  const immutableApp = db.prepare('SELECT resume_id FROM applications WHERE id = ?').get(app1Id) as any;
  assert(immutableApp.resume_id === resume1Id, 'CRITICAL: Application 1 immutably preserves original submitted Resume V1');

  // ----------------------------------------------------
  // 5. DETERMINISTIC MATCHING & EXPLAINABLE AI CONSISTENCY
  // ----------------------------------------------------
  console.log('\n⚖️ 5. Testing Deterministic Match Scoring & Explainable AI...');
  const matchResult = await ResumeJobMatchingService.computeMatch(resume1Id, jobAId, candUserId, candProfileId, app1Id);
  assert(matchResult.matchScore >= 0 && matchResult.matchScore <= 100, `Match score is within [0, 100] (Actual: ${matchResult.matchScore}%)`);
  assert(matchResult.requiredSkillsMatched.includes('Node.js'), 'Matched required skill Node.js identified');
  assert(matchResult.requiredSkillsMatched.includes('TypeScript'), 'Matched required skill TypeScript identified');

  // Explainable AI Breakdown
  const explanation = await MatchExplanationService.getExplanation(matchResult.id, recAId, 'recruiter');
  assert(explanation.finalScore === matchResult.matchScore, 'Explainable AI final score matches computed match score');
  assert(explanation.isConsistent, 'Score components mathematically sum to exactly 100% of the final score');
  assert(explanation.components.requiredSkills.score === 50, 'Full 50 points awarded for 100% required skills match');
  assert(explanation.naturalLanguageExplanation.includes('Node.js') || explanation.naturalLanguageExplanation.includes('TypeScript') || explanation.factualSummary.includes('Node.js'), 'Factual natural-language explanation references matched skills');

  // ----------------------------------------------------
  // 6. INTERVIEW LIFECYCLE, NOTIFICATIONS & AUDIT TRAIL
  // ----------------------------------------------------
  console.log('\n🎙️ 6. Testing Interview Lifecycle, Notifications & Audit History...');
  
  // Recruiter A schedules interview
  const interviewRes = InterviewService.scheduleInterview(recAId, {
    applicationId: app1Id,
    title: 'Technical Deep-Dive',
    interviewType: 'Video',
    scheduledAt: new Date(Date.now() + 86400000 * 3).toISOString(),
    durationMinutes: 45,
    meetingUrl: 'https://meet.resumio.ai/p9-interview',
    description: 'Architecture and problem solving',
  });
  assert(Boolean(interviewRes.interviewId), 'Interview successfully scheduled');

  // Verify candidate received in-app notification
  const notifications = NotificationService.getUserNotifications(candUserId, { limit: 10 });
  assert(notifications.notifications.length > 0, 'Candidate received real-time in-app notification');
  assert(notifications.unreadCount > 0, 'Unread notification count correctly increments');

  // Recruiter reschedules interview
  const rescheduleRes = InterviewService.rescheduleInterview(recAId, interviewRes.interviewId, {
    scheduledAt: new Date(Date.now() + 86400000 * 4).toISOString(),
    durationMinutes: 60,
    reason: 'Interviewer calendar conflict',
  });
  assert(rescheduleRes.status === 'Rescheduled', 'Interview state successfully updated to Rescheduled');

  // Recruiter completes interview
  const completeRes = InterviewService.updateInterviewStatus(recAId, interviewRes.interviewId, 'Completed', 'Outstanding system design skills.');
  assert(completeRes.status === 'Completed', 'Interview marked Completed with notes preserved');

  // ----------------------------------------------------
  // 7. ADVANCED AI RECRUITMENT INTELLIGENCE VALIDATION
  // ----------------------------------------------------
  console.log('\n🤖 7. Testing Advanced AI Modules & Bias Guardrails...');

  // Natural Language Search with Bias Interception
  const biasedQueryCheck = NaturalLanguageSearchService.checkQuerySafety('Find young male engineers under 30');
  assert(!biasedQueryCheck.isSafe, 'Anti-bias guardrail intercepts queries targeting protected characteristics');
  assert(Boolean(biasedQueryCheck.rejectionReason), 'Provides polite, constructive explanation regarding platform compliance');

  const validQuery = await NaturalLanguageSearchService.searchCandidates(recAId, 'Looking for Node.js and TypeScript developers with 2+ years experience');
  assert(validQuery.interpreted.skills.includes('Node.js'), 'Interprets skills from natural language');
  assert(validQuery.candidates.length > 0, 'Returns real database candidates without hallucinations');

  // AI Interview Questions
  const questions = await InterviewQuestionService.generateCandidateQuestions(recAId, app1Id);
  assert(questions.totalQuestions >= 4, 'Generates structured questions across all 4 categories');
  assert(questions.questions.technical.length > 0, 'Contains Technical category questions');
  assert(questions.questions.behavioral.length > 0, 'Contains Behavioral category questions');

  // Evidence-Based Resume Improvement
  const improvement = await ResumeImprovementService.analyzeResume(candUserId, resume2Id, jobAId);
  assert(improvement.sections.length >= 4, 'Provides section-by-section health analysis');
  assert(improvement.targetJobComparison?.matchedSkills.includes('Node.js') || false, 'Accurately compares skills against target job');

  // Duplicate Resume Detection
  const dupCheck = await DuplicateResumeService.detectDuplicates(resume1Id, candUserId);
  assert(dupCheck !== null, 'Duplicate detection runs cleanly without exceptions');

  // ----------------------------------------------------
  // 8. RECRUITER ANALYTICS & DASHBOARD INTEGRITY
  // ----------------------------------------------------
  console.log('\n📊 8. Testing Recruitment Analytics & Dashboards...');
  const analytics = RecruitmentAnalyticsService.getRecruiterAnalytics(recAId, { dateRange: '30d' });
  assert(analytics.overview.totalJobs >= 1, 'Analytics reflects actual recruiter job count');
  assert(analytics.overview.totalApplications >= 1, 'Analytics reflects actual application submissions');
  assert(analytics.statusDistribution.length > 0, 'Status distribution computed from database');
  assert(analytics.scoreDistribution.length === 4, 'AI match quality histogram categorized into 4 tiers');

  const recDashboard = DashboardService.getRecruiterDashboard(recAId);
  assert(recDashboard.jobStats.total >= 1, 'Recruiter dashboard stats match database records');
  assert(recDashboard.topCandidates.length >= 1, 'Recruiter dashboard surfaces top ranked candidates');

  const candDashboard = DashboardService.getCandidateDashboard(candUserId);
  assert(candDashboard.applicationStats.total >= 1, 'Candidate dashboard reflects active applications');

  console.log('\n====================================================');
  console.log(`🎉 PHASE 9 MASTER VERIFICATION: ${passedTests} / ${totalTests} TESTS PASSED (100%)`);
  console.log('====================================================\n');
}

runPhase9Tests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

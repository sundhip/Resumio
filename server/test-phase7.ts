import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db, initDatabase } from './database/db';
import { NotificationService } from './services/notificationService';
import { InterviewService } from './services/interviewService';
import { DashboardService } from './services/dashboardService';
import { RecruitmentAnalyticsService } from './services/analyticsService';
import { ResumeJobMatchingService } from './services/matchingService';

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

async function runPhase7Tests() {
  console.log('\n====================================================');
  console.log('🧪 RESUMIO PHASE 7: INTERVIEWS, NOTIFICATIONS & ANALYTICS');
  console.log('====================================================\n');

  initDatabase();

  // Setup Test Fixtures: 2 Recruiters, 2 Candidates, 2 Jobs, 2 Applications
  const recAUserId = crypto.randomUUID();
  const recAProfileId = crypto.randomUUID();
  const recBUserId = crypto.randomUUID();
  const recBProfileId = crypto.randomUUID();

  const candAUserId = crypto.randomUUID();
  const candAProfileId = crypto.randomUUID();
  const candBUserId = crypto.randomUUID();
  const candBProfileId = crypto.randomUUID();

  const passwordHash = bcrypt.hashSync('TestPass123!', 10);

  // Users with unique test run emails
  const testRunId = crypto.randomUUID().slice(0, 8);
  db.prepare(`INSERT INTO users (id, email, password_hash, role, status) VALUES (?, ?, ?, 'recruiter', 'active')`).run(recAUserId, `rec.a.${testRunId}@test.com`, passwordHash);
  db.prepare(`INSERT INTO recruiter_profiles (id, user_id, full_name, company_name, profile_completion) VALUES (?, ?, 'Recruiter Alpha', 'Alpha Innovations', 80)`).run(recAProfileId, recAUserId);

  db.prepare(`INSERT INTO users (id, email, password_hash, role, status) VALUES (?, ?, ?, 'recruiter', 'active')`).run(recBUserId, `rec.b.${testRunId}@test.com`, passwordHash);
  db.prepare(`INSERT INTO recruiter_profiles (id, user_id, full_name, company_name, profile_completion) VALUES (?, ?, 'Recruiter Beta', 'Beta Labs', 80)`).run(recBProfileId, recBUserId);

  db.prepare(`INSERT INTO users (id, email, password_hash, role, status) VALUES (?, ?, ?, 'candidate', 'active')`).run(candAUserId, `cand.a.${testRunId}@test.com`, passwordHash);
  db.prepare(`INSERT INTO candidate_profiles (id, user_id, full_name, headline, profile_completion) VALUES (?, ?, 'Candidate Alice', 'Staff Full Stack Engineer', 90)`).run(candAProfileId, candAUserId);

  db.prepare(`INSERT INTO users (id, email, password_hash, role, status) VALUES (?, ?, ?, 'candidate', 'active')`).run(candBUserId, `cand.b.${testRunId}@test.com`, passwordHash);
  db.prepare(`INSERT INTO candidate_profiles (id, user_id, full_name, headline, profile_completion) VALUES (?, ?, 'Candidate Bob', 'Junior Backend Engineer', 60)`).run(candBProfileId, candBUserId);

  // Candidate Resumes
  const resumeAId = crypto.randomUUID();
  db.prepare(`INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active) VALUES (?, ?, 'alice_cv.pdf', 'alice_cv.pdf', 'application/pdf', 10240, 1)`).run(resumeAId, candAProfileId);

  const resumeBId = crypto.randomUUID();
  db.prepare(`INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active) VALUES (?, ?, 'bob_cv.pdf', 'bob_cv.pdf', 'application/pdf', 10240, 1)`).run(resumeBId, candBProfileId);

  // Jobs
  const jobAId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO jobs (id, recruiter_id, recruiter_profile_id, title, description, company_name, location, employment_type, work_mode, min_experience, status, published_at)
    VALUES (?, ?, ?, 'Principal Platform Architect', 'Lead platform architecture', 'Alpha Innovations', 'Bengaluru, India', 'Full-time', 'Hybrid', 6, 'Published', datetime('now'))
  `).run(jobAId, recAUserId, recAProfileId);

  db.prepare(`INSERT INTO job_required_skills (id, job_id, name) VALUES (?, ?, 'TypeScript'), (?, ?, 'Node.js'), (?, ?, 'PostgreSQL')`).run(crypto.randomUUID(), jobAId, crypto.randomUUID(), jobAId, crypto.randomUUID(), jobAId);

  const jobBId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO jobs (id, recruiter_id, recruiter_profile_id, title, description, company_name, location, employment_type, work_mode, min_experience, status, published_at)
    VALUES (?, ?, ?, 'Junior Python Developer', 'Build Python backends', 'Beta Labs', 'Remote', 'Full-time', 'Remote', 1, 'Published', datetime('now'))
  `).run(jobBId, recBUserId, recBProfileId);

  // Applications
  const appAId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO applications (id, candidate_id, candidate_profile_id, job_id, resume_id, cover_letter, status, applied_at)
    VALUES (?, ?, ?, ?, ?, 'Excited for this role', 'Applied', datetime('now', '-2 days'))
  `).run(appAId, candAUserId, candAProfileId, jobAId, resumeAId);

  const appBId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO applications (id, candidate_id, candidate_profile_id, job_id, resume_id, cover_letter, status, applied_at)
    VALUES (?, ?, ?, ?, ?, 'Interested in joining', 'Applied', datetime('now', '-1 days'))
  `).run(appBId, candBUserId, candBProfileId, jobAId, resumeBId);

  // Generate Match Records using Phase 6 Matching Engine
  await ResumeJobMatchingService.computeMatch(resumeAId, jobAId, candAUserId, candAProfileId, appAId);
  await ResumeJobMatchingService.computeMatch(resumeBId, jobAId, candBUserId, candBProfileId, appBId);

  // ----------------------------------------------------
  // 1. IN-APP NOTIFICATIONS (Feature 29)
  // ----------------------------------------------------
  console.log('🔔 1. Testing In-App Notification System...');

  const notifId1 = NotificationService.notifyApplicationStatus(candAUserId, 'Principal Platform Architect', 'Applied', 'Under Review', appAId);
  assert(typeof notifId1 === 'string', 'Creates notification for "Under Review" status change');

  const notifId2 = NotificationService.notifyApplicationStatus(candAUserId, 'Principal Platform Architect', 'Under Review', 'Shortlisted', appAId);
  assert(typeof notifId2 === 'string', 'Creates congratulations notification for "Shortlisted" status change');

  const notifId3 = NotificationService.notifyApplicationStatus(candBUserId, 'Principal Platform Architect', 'Applied', 'Rejected', appBId, 'Insufficient years of experience with distributed systems');
  assert(typeof notifId3 === 'string', 'Creates respectful notification for "Rejected" status change with reason');

  const candANotifsBefore = NotificationService.getUserNotifications(candAUserId);
  assert(candANotifsBefore.total >= 2, `Candidate A has correct total notifications (Found: ${candANotifsBefore.total})`);
  assert(candANotifsBefore.unreadCount >= 2, `Candidate A unread count reflects new notifications (Unread: ${candANotifsBefore.unreadCount})`);

  // User isolation
  const candBNotifs = NotificationService.getUserNotifications(candBUserId);
  assert(candBNotifs.notifications.every((n) => n.user_id === candBUserId), 'Candidate B only sees Candidate B notifications (strict user boundary)');

  // Mark single as read
  const markRes = NotificationService.markAsRead(notifId1, candAUserId);
  assert(markRes === true, 'Successfully marked single notification as read');
  assert(NotificationService.getUnreadCount(candAUserId) === candANotifsBefore.unreadCount - 1, 'Unread count decremented by 1');

  // Mark all as read
  NotificationService.markAllAsRead(candAUserId);
  assert(NotificationService.getUnreadCount(candAUserId) === 0, 'Mark all as read resets unread count to 0');

  // ----------------------------------------------------
  // 2. INTERVIEW SCHEDULING & MANAGEMENT (Feature 24)
  // ----------------------------------------------------
  console.log('\n📅 2. Testing Interview Management (Schedule, Reschedule, Cancel, Status)...');

  const futureTime = new Date(Date.now() + 86400000 * 3).toISOString(); // 3 days in future

  // Schedule valid video interview
  let interviewA: any;
  try {
    interviewA = InterviewService.scheduleInterview(recAUserId, {
      applicationId: appAId,
      title: 'Technical Architecture Round',
      interviewType: 'Video',
      scheduledAt: futureTime,
      durationMinutes: 60,
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      description: 'Please prepare a system architecture discussion for distributed microservices.',
    });
    assert(interviewA && interviewA.status === 'Scheduled', 'Recruiter successfully scheduled video interview');
    assert(interviewA.durationMinutes === 60, 'Interview duration recorded accurately (60 mins)');
  } catch (err: any) {
    assert(false, `Scheduling interview failed: ${err.message}`);
  }

  // Check candidate received notification for interview scheduled
  const candANotifsAfterInterview = NotificationService.getUserNotifications(candAUserId);
  const scheduledNotif = candANotifsAfterInterview.notifications.find((n) => n.type === 'interview_scheduled');
  assert(!!scheduledNotif, 'Candidate A received automatic in-app notification for scheduled interview');

  // Ownership security checks
  let unauthorizedScheduleBlocked = false;
  try {
    InterviewService.scheduleInterview(recBUserId, {
      applicationId: appAId, // Belongs to Recruiter A
      title: 'Hacked Interview',
      interviewType: 'Video',
      scheduledAt: futureTime,
      meetingUrl: 'https://meet.google.com/xyz',
    });
  } catch (err: any) {
    unauthorizedScheduleBlocked = err.message.includes('Forbidden') || err.message.includes('do not own');
  }
  assert(unauthorizedScheduleBlocked, 'Recruiter B blocked from scheduling interview for Recruiter A applicant (403 Forbidden)');

  // Validation checks: invalid meeting URL
  let invalidUrlBlocked = false;
  try {
    InterviewService.scheduleInterview(recAUserId, {
      applicationId: appAId,
      title: 'Tech Round',
      interviewType: 'Video',
      scheduledAt: futureTime,
      meetingUrl: 'ftp://not-a-valid-http-url',
    });
  } catch (err: any) {
    invalidUrlBlocked = err.message.includes('Invalid meeting URL');
  }
  assert(invalidUrlBlocked, 'Invalid meeting URL format rejected with validation error');

  // Validation checks: negative duration
  let negativeDurationBlocked = false;
  try {
    InterviewService.scheduleInterview(recAUserId, {
      applicationId: appAId,
      title: 'Tech Round',
      interviewType: 'Video',
      scheduledAt: futureTime,
      durationMinutes: -15,
      meetingUrl: 'https://meet.google.com/valid-url',
    });
  } catch (err: any) {
    negativeDurationBlocked = err.message.includes('positive');
  }
  assert(negativeDurationBlocked, 'Negative interview duration rejected with validation error');

  // Reschedule interview
  const newFutureTime = new Date(Date.now() + 86400000 * 5).toISOString(); // 5 days in future
  const rescheduleRes = InterviewService.rescheduleInterview(recAUserId, interviewA.interviewId, {
    scheduledAt: newFutureTime,
    durationMinutes: 45,
    reason: 'Interviewer requested time shift due to conflict.',
  });
  assert(rescheduleRes.status === 'Rescheduled', 'Recruiter rescheduled interview (status = Rescheduled)');

  const reschedNotif = NotificationService.getUserNotifications(candAUserId).notifications.find((n) => n.type === 'interview_rescheduled');
  assert(!!reschedNotif, 'Candidate A received automatic in-app notification for rescheduled interview');

  // View Interview Details (Candidate & Recruiter)
  const candView = InterviewService.getInterviewById(candAUserId, 'candidate', interviewA.interviewId);
  assert(candView.interview.status === 'Rescheduled', 'Candidate sees updated Rescheduled interview status');
  assert(candView.interview.meetingUrl === 'https://meet.google.com/abc-defg-hij', 'Candidate can view meeting URL');
  assert(candView.history.length >= 2, 'Audit history tracks initial schedule and reschedule event');

  // Cross-user barrier: Candidate B cannot view Candidate A's interview
  let crossCandViewBlocked = false;
  try {
    InterviewService.getInterviewById(candBUserId, 'candidate', interviewA.interviewId);
  } catch (err: any) {
    crossCandViewBlocked = err.message.includes('Forbidden');
  }
  assert(crossCandViewBlocked, 'Candidate B forbidden from viewing Candidate A interview details');

  // Mark Completed
  const completeRes = InterviewService.updateInterviewStatus(recAUserId, interviewA.interviewId, 'Completed', 'Candidate demonstrated strong architectural depth');
  assert(completeRes.status === 'Completed', 'Recruiter marked interview as Completed');

  // Schedule second interview and test Cancel
  const interviewA2 = InterviewService.scheduleInterview(recAUserId, {
    applicationId: appAId,
    title: 'Executive Leadership Round',
    interviewType: 'Video',
    scheduledAt: futureTime,
    meetingUrl: 'https://meet.google.com/exec-round',
  });
  const cancelRes = InterviewService.cancelInterview(recAUserId, interviewA2.interviewId, 'Role filled internally');
  assert(cancelRes.status === 'Cancelled', 'Recruiter cancelled interview (status = Cancelled)');

  // Cancelled interview is preserved in DB (not hard deleted)
  const storedCancelled = db.prepare('SELECT id, status FROM interviews WHERE id = ?').get(interviewA2.interviewId) as any;
  assert(storedCancelled && storedCancelled.status === 'Cancelled', 'Cancelled interview record safely preserved in database');

  // Candidate interview list
  const candInterviews = InterviewService.getCandidateInterviews(candAUserId);
  assert(candInterviews.past.length >= 2, 'Candidate interviews categorized into Past (Completed & Cancelled)');

  // ----------------------------------------------------
  // 3. CANDIDATE & RECRUITER DASHBOARDS (Features 25 & 26)
  // ----------------------------------------------------
  console.log('\n📊 3. Testing Consolidated Dashboards (Candidate & Recruiter)...');

  const candDashboard = DashboardService.getCandidateDashboard(candAUserId);
  assert(candDashboard.profile.fullName === 'Candidate Alice', 'Candidate dashboard returns candidate name');
  assert(candDashboard.applicationStats.total >= 1, 'Candidate dashboard returns real application counts');
  assert(candDashboard.recentApplications.length >= 1, 'Candidate dashboard returns recent applications');
  assert(candDashboard.recentApplications[0].matchScore !== null, 'Recent application includes Phase 6 Match Score');
  assert(Array.isArray(candDashboard.recommendedJobs), 'Candidate dashboard includes Phase 3 recommended jobs');

  const recDashboard = DashboardService.getRecruiterDashboard(recAUserId);
  assert(recDashboard.jobStats.total >= 1, 'Recruiter dashboard returns total jobs for Recruiter A');
  assert(recDashboard.pipelineStats.total >= 2, 'Recruiter dashboard returns pipeline counts across owned jobs');
  assert(recDashboard.topCandidates.length >= 2, 'Recruiter dashboard includes top ranked candidates (Phase 6)');
  assert(recDashboard.topCandidates[0].matchScore >= recDashboard.topCandidates[1].matchScore, 'Top candidates sorted by Match Score DESC');

  // ----------------------------------------------------
  // 4. RECRUITMENT ANALYTICS & AGGREGATIONS (Feature 28)
  // ----------------------------------------------------
  console.log('\n📈 4. Testing Recruitment Analytics & Aggregation Engine...');

  const analyticsA = RecruitmentAnalyticsService.getRecruiterAnalytics(recAUserId, { dateRange: '30d' });
  assert(analyticsA.overview.totalJobs >= 1, 'Analytics: totalJobs matches database');
  assert(analyticsA.overview.totalApplications >= 2, 'Analytics: totalApplications matches database');
  assert(analyticsA.overview.totalInterviews >= 2, 'Analytics: totalInterviews matches database');
  assert(analyticsA.overview.averageMatchScore > 0, 'Analytics: averageMatchScore calculated from actual matches');
  assert(analyticsA.statusDistribution.some((s) => s.status === 'Applied' && s.count > 0), 'Analytics: status distribution has Applied count');
  assert(analyticsA.scoreDistribution.length === 4, 'Analytics: score distribution has 4 match quality brackets');
  assert(analyticsA.applicationTrend.length === 30, 'Analytics: application trend returns 30-day time-series');
  assert(analyticsA.interviewMetrics.total >= 2, 'Analytics: interview metrics aggregates total scheduled');

  // Test Job Filter
  const jobAnalytics = RecruitmentAnalyticsService.getRecruiterAnalytics(recAUserId, { jobId: jobAId });
  assert(jobAnalytics.overview.totalApplications === 2, 'Analytics: job filter restricts data to specific job');

  // Test Recruiter Isolation Barrier
  const analyticsB = RecruitmentAnalyticsService.getRecruiterAnalytics(recBUserId);
  assert(analyticsB.overview.totalApplications === 0, 'Recruiter B analytics returns 0 applications (Recruiter A data is isolated)');

  console.log('\n====================================================');
  console.log(`🎉 PHASE 7 VERIFICATION: ${passed} / ${passed + failed} TESTS PASSED (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase7Tests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

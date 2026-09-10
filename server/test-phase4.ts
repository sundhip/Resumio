import { db } from './database/db';
import crypto from 'crypto';

const API_BASE = 'http://localhost:3001/api';

async function runTests() {
  console.log('🧪 Starting Phase 4 Automated Test Suite...');
  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition: boolean, message: string) {
    testsTotal++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. Candidate Registration & Login
  const candEmail = `cand-p4-${Date.now()}@test.com`;
  const candRegRes = await fetch(`${API_BASE}/auth/register/candidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Aarav Patel',
      email: candEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
    }),
  });
  const candRegData = (await candRegRes.json()) as any;
  assert(candRegRes.status === 201 && candRegData.token, 'Candidate registered successfully');
  const candToken = candRegData.token;
  const candUser = candRegData.user;
  const candProfile = candRegData.profile;

  // Create a resume record directly in candidate_resumes for testing
  const resumeId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active)
    VALUES (?, ?, 'Aarav_Patel_Senior_Fullstack.pdf', 'test_resume_123.pdf', 'PDF', 1048576, 1)
  `).run(resumeId, candProfile.id);
  assert(true, 'Test resume record created for candidate');

  // Add a skill for candidate
  db.prepare(`
    INSERT INTO candidate_skills (id, candidate_profile_id, name, proficiency)
    VALUES (?, ?, 'React', 'Expert')
  `).run(crypto.randomUUID(), candProfile.id);

  // 2. Recruiter A Registration & Login
  const recAEmail = `rec-a-p4-${Date.now()}@test.com`;
  const recARegRes = await fetch(`${API_BASE}/auth/register/recruiter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Sarah Connor',
      email: recAEmail,
      companyName: 'Cyberdyne Systems',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    }),
  });
  const recARegData = (await recARegRes.json()) as any;
  assert(recARegRes.status === 201 && recARegData.token, 'Recruiter A registered successfully');
  const recAToken = recARegData.token;

  // 3. Recruiter B Registration & Login (for authorization checks)
  const recBEmail = `rec-b-p4-${Date.now()}@test.com`;
  const recBRegRes = await fetch(`${API_BASE}/auth/register/recruiter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Miles Dyson',
      email: recBEmail,
      companyName: 'Dyson Robotics',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    }),
  });
  const recBRegData = (await recBRegRes.json()) as any;
  assert(recBRegRes.status === 201 && recBRegData.token, 'Recruiter B registered successfully');
  const recBToken = recBRegData.token;

  // 4. Recruiter A creates a Draft Job and a Published Job
  const draftJobRes = await fetch(`${API_BASE}/recruiter/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${recAToken}` },
    body: JSON.stringify({
      title: 'Draft Security Researcher',
      description: 'Looking for internal security researchers.',
      location: 'Remote',
      employment_type: 'Full-time',
      work_mode: 'Remote',
      status: 'Draft',
      publish: false,
      required_skills: ['Security', 'Linux'],
      preferred_skills: ['Docker'],
    }),
  });
  const draftJobData = (await draftJobRes.json()) as any;
  assert(draftJobRes.status === 201 && draftJobData.job.status === 'Draft', 'Recruiter created Draft Job');
  const draftJobId = draftJobData.job.id;

  const pubJobRes = await fetch(`${API_BASE}/recruiter/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${recAToken}` },
    body: JSON.stringify({
      title: 'Lead Frontend Engineer',
      description: 'Join Cyberdyne Systems to build high performance web interfaces.',
      location: 'San Francisco, CA',
      employment_type: 'Full-time',
      work_mode: 'Hybrid',
      status: 'Published',
      publish: true,
      min_experience: 4,
      required_skills: ['React', 'TypeScript', 'Tailwind CSS'],
      preferred_skills: ['Next.js'],
    }),
  });
  const pubJobData = (await pubJobRes.json()) as any;
  assert(pubJobRes.status === 201 && pubJobData.job.status === 'Published', 'Recruiter created Published Job');
  const pubJobId = pubJobData.job.id;

  // 5. Test: Candidate cannot apply to Draft job
  const applyDraftRes = await fetch(`${API_BASE}/candidate/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candToken}` },
    body: JSON.stringify({
      jobId: draftJobId,
      resumeId: resumeId,
      coverLetter: 'I would like to apply to this draft role.',
    }),
  });
  assert(applyDraftRes.status === 400, 'Candidate cannot apply to a Draft job (400 Bad Request)');

  // 6. Test: Candidate checks status before applying -> hasApplied: false
  const checkPreApply = await fetch(`${API_BASE}/candidate/applications/check/${pubJobId}`, {
    headers: { Authorization: `Bearer ${candToken}` },
  });
  const checkPreData = (await checkPreApply.json()) as any;
  assert(checkPreApply.status === 200 && checkPreData.hasApplied === false, 'Check status before applying returns hasApplied: false');

  // 7. Test: Candidate applies to Published Job
  const applyPubRes = await fetch(`${API_BASE}/candidate/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candToken}` },
    body: JSON.stringify({
      jobId: pubJobId,
      resumeId: resumeId,
      coverLetter: 'Excited to apply for Lead Frontend Engineer position with 5+ years of React experience!',
    }),
  });
  const applyPubData = (await applyPubRes.json()) as any;
  assert(applyPubRes.status === 201 && applyPubData.applicationId, 'Candidate successfully applied to Published Job (201 Created)');
  const applicationId = applyPubData.applicationId;

  // 8. Test: Candidate cannot apply again to the same job (Duplicate Prevention)
  const applyDupRes = await fetch(`${API_BASE}/candidate/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candToken}` },
    body: JSON.stringify({
      jobId: pubJobId,
      resumeId: resumeId,
      coverLetter: 'Trying to apply again.',
    }),
  });
  assert(applyDupRes.status === 409, 'Duplicate application correctly rejected with 409 Conflict');

  // 9. Test: Candidate checks status after applying -> hasApplied: true
  const checkPostApply = await fetch(`${API_BASE}/candidate/applications/check/${pubJobId}`, {
    headers: { Authorization: `Bearer ${candToken}` },
  });
  const checkPostData = (await checkPostApply.json()) as any;
  assert(checkPostApply.status === 200 && checkPostData.hasApplied === true && checkPostData.application.status === 'Applied', 'Check status after applying returns hasApplied: true and status Applied');

  // 10. Test: Candidate fetches their applications list
  const candAppsRes = await fetch(`${API_BASE}/candidate/applications`, {
    headers: { Authorization: `Bearer ${candToken}` },
  });
  const candAppsData = (await candAppsRes.json()) as any;
  assert(candAppsRes.status === 200 && candAppsData.applications.length === 1, 'Candidate lists applications successfully (length = 1)');
  assert(candAppsData.stats.total === 1 && candAppsData.stats.applied === 1, 'Candidate application stats accurately reflect status counts');
  assert(candAppsData.applications[0].jobTitle === 'Lead Frontend Engineer', 'Application includes joined job details');
  assert(candAppsData.applications[0].resumeFilename === 'Aarav_Patel_Senior_Fullstack.pdf', 'Application includes submitted resume snapshot');

  // 11. Test: Candidate gets single application detail with status timeline
  const candAppDetailRes = await fetch(`${API_BASE}/candidate/applications/${applicationId}`, {
    headers: { Authorization: `Bearer ${candToken}` },
  });
  const candAppDetailData = (await candAppDetailRes.json()) as any;
  assert(candAppDetailRes.status === 200 && candAppDetailData.application.id === applicationId, 'Candidate fetches single application detail');
  assert(candAppDetailData.timeline.length >= 1 && candAppDetailData.timeline[0].newStatus === 'Applied', 'Application has initial status timeline entry');

  // 12. Test: Recruiter A fetches applicants for their job
  const recApplicantsRes = await fetch(`${API_BASE}/recruiter/jobs/${pubJobId}/applicants`, {
    headers: { Authorization: `Bearer ${recAToken}` },
  });
  const recApplicantsData = (await recApplicantsRes.json()) as any;
  assert(recApplicantsRes.status === 200 && recApplicantsData.applicants.length === 1, 'Recruiter A fetches applicants for published job (count = 1)');
  assert(recApplicantsData.stats.total === 1 && recApplicantsData.stats.applied === 1, 'Recruiter job pipeline stats accurately reflect 1 Applied');
  assert(recApplicantsData.applicants[0].candidateName === 'Aarav Patel', 'Applicant contains candidate name');
  assert(recApplicantsData.applicants[0].resumeFilename === 'Aarav_Patel_Senior_Fullstack.pdf', 'Applicant contains submitted resume info');

  // 13. Test: Recruiter B cannot access Recruiter A's job applicants (403 Forbidden)
  const recBAuthRes = await fetch(`${API_BASE}/recruiter/jobs/${pubJobId}/applicants`, {
    headers: { Authorization: `Bearer ${recBToken}` },
  });
  assert(recBAuthRes.status === 403, 'Recruiter B cannot view Recruiter A job applicants (403 Forbidden)');

  // 14. Test: Recruiter A views deep applicant details
  const recAppDetailRes = await fetch(`${API_BASE}/recruiter/applications/${applicationId}`, {
    headers: { Authorization: `Bearer ${recAToken}` },
  });
  const recAppDetailData = (await recAppDetailRes.json()) as any;
  assert(recAppDetailRes.status === 200 && recAppDetailData.candidateProfile !== undefined || recAppDetailData.application.candidate !== undefined, 'Recruiter fetches full applicant profile & resume snapshot');

  // 15. Test: Recruiter A transitions status: Applied -> Under Review
  const statusReviewRes = await fetch(`${API_BASE}/recruiter/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${recAToken}` },
    body: JSON.stringify({
      status: 'Under Review',
      note: 'Profile matched core requirements, reviewing code portfolio.',
    }),
  });
  const statusReviewData = (await statusReviewRes.json()) as any;
  assert(statusReviewRes.status === 200 && statusReviewData.status === 'Under Review', 'Recruiter updated status to Under Review');

  // 16. Test: Recruiter A transitions status: Under Review -> Shortlisted
  const statusShortlistRes = await fetch(`${API_BASE}/recruiter/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${recAToken}` },
    body: JSON.stringify({
      status: 'Shortlisted',
      note: 'Candidate shortlisted for technical round.',
    }),
  });
  const statusShortlistData = (await statusShortlistRes.json()) as any;
  assert(statusShortlistRes.status === 200 && statusShortlistData.status === 'Shortlisted', 'Recruiter updated status to Shortlisted');

  // 17. Test: Recruiter A transitions status: Shortlisted -> Rejected with note
  const statusRejectRes = await fetch(`${API_BASE}/recruiter/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${recAToken}` },
    body: JSON.stringify({
      status: 'Rejected',
      rejectionReason: 'Position filled internally.',
      note: 'Sent polite rejection update.',
    }),
  });
  const statusRejectData = (await statusRejectRes.json()) as any;
  assert(statusRejectRes.status === 200 && statusRejectData.status === 'Rejected', 'Recruiter updated status to Rejected with reason');

  // 18. Test: Candidate timeline reflects all status changes
  const candTimelineRes = await fetch(`${API_BASE}/candidate/applications/${applicationId}`, {
    headers: { Authorization: `Bearer ${candToken}` },
  });
  const candTimelineData = (await candTimelineRes.json()) as any;
  assert(candTimelineData.timeline.length === 4, 'Application status timeline contains complete 4-step audit trail');
  assert(candTimelineData.application.status === 'Rejected', 'Candidate application status is Rejected');

  // 19. Test: Candidate cannot withdraw a rejected application
  const withdrawRejectedRes = await fetch(`${API_BASE}/candidate/applications/${applicationId}/withdraw`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${candToken}` },
  });
  assert(withdrawRejectedRes.status === 400, 'Candidate cannot withdraw a rejected application (400 Bad Request)');

  // 20. Test: Candidate applies to a 2nd job and withdraws successfully
  const pubJob2Res = await fetch(`${API_BASE}/recruiter/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${recAToken}` },
    body: JSON.stringify({
      title: 'Full Stack Engineer',
      description: 'Full stack development role.',
      location: 'Remote',
      employment_type: 'Contract',
      work_mode: 'Remote',
      status: 'Published',
      publish: true,
      required_skills: ['React', 'Node.js'],
      preferred_skills: [],
    }),
  });
  const pubJob2Data = (await pubJob2Res.json()) as any;
  const pubJob2Id = pubJob2Data.job.id;

  const applyJob2Res = await fetch(`${API_BASE}/candidate/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candToken}` },
    body: JSON.stringify({
      jobId: pubJob2Id,
      resumeId: resumeId,
      coverLetter: 'Applying for second role.',
    }),
  });
  const applyJob2Data = (await applyJob2Res.json()) as any;
  const app2Id = applyJob2Data.applicationId;

  const withdrawRes = await fetch(`${API_BASE}/candidate/applications/${app2Id}/withdraw`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${candToken}` },
  });
  const withdrawData = (await withdrawRes.json()) as any;
  assert(withdrawRes.status === 200 && withdrawData.status === 'Withdrawn', 'Candidate successfully withdrew active application');

  console.log(`\n🎉 Phase 4 Test Suite Passed: ${testsPassed} / ${testsTotal} tests passed!`);
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});

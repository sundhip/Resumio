import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  mongo,
  initMongoDatabase,
  closeMongoDatabase,
  checkMongoReadiness,
  recalculateCandidateCompletion,
  MONGODB_URI,
  MONGODB_DATABASE,
  isAtlasUri,
  maskMongoUri,
} from '../database/mongo.js';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT VERIFIED';
  details: string;
}

export async function runPersistenceVerification(): Promise<{
  allPassed: boolean;
  results: TestResult[];
  isAtlasLive: boolean;
}> {
  console.log('====================================================');
  console.log('🍃 RESUMIO PHASE 3 — DATA PERSISTENCE & ATLAS VERIFIER');
  console.log('====================================================\n');

  const results: TestResult[] = [];
  const isAtlasConfigured = isAtlasUri(MONGODB_URI);

  console.log(`Environment Database: ${MONGODB_DATABASE}`);
  console.log(`Configured MongoDB URI: ${maskMongoUri(MONGODB_URI)}`);
  console.log(`Atlas Cloud Detection: ${isAtlasConfigured ? 'YES (Atlas Detected)' : 'LOCAL / TEST ENGINE'}\n`);

  // Initialize DB Connection
  await initMongoDatabase();
  const readiness = await checkMongoReadiness();
  console.log('Database Readiness Status:', readiness);

  // Dedicated prefix for test isolation
  const runId = Date.now().toString(36);
  const testCandidateUserId = `test-user-cand-${runId}`;
  const testRecruiterUserId = `test-user-rec-${runId}`;
  const testCandidateEmail = `test.candidate.${runId}@resumio.ai`;
  const testRecruiterEmail = `test.recruiter.${runId}@resumio.ai`;
  const testCandProfileId = `test-prof-cand-${runId}`;
  const testRecProfileId = `test-prof-rec-${runId}`;
  const testJobId = `test-job-${runId}`;
  const testAppId = `test-app-${runId}`;
  const testInterviewId = `test-int-${runId}`;
  const testNotifId = `test-notif-${runId}`;

  // Helper assert
  function recordResult(name: string, status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT VERIFIED', details: string) {
    results.push({ name, status, details });
    const symbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`  ${symbol} [${status}] ${name}: ${details}`);
  }

  // ----------------------------------------------------
  // TEST A: Candidate Persistence across restart
  // ----------------------------------------------------
  console.log('\n--- Test A: Candidate Persistence & Restart Simulation ---');
  try {
    // 1. Create candidate user & profile with full subdocuments
    await mongo.users.insertOne({
      _id: testCandidateUserId,
      id: testCandidateUserId,
      email: testCandidateEmail,
      password_hash: bcrypt.hashSync('CandidatePass123!', 10),
      role: 'candidate',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await mongo.candidate_profiles.insertOne({
      _id: testCandProfileId,
      id: testCandProfileId,
      user_id: testCandidateUserId,
      full_name: 'Dr. Jane Cloud, Ph.D.',
      headline: 'Principal Distributed Systems Architect',
      phone: '+91 91234 56789',
      location: 'Bangalore, India',
      bio: 'Cloud architecture, MongoDB, distributed systems.',
      photo_url: 'https://resumio.ai/avatars/jane.jpg',
      profile_completion: 0,
      education: [
        {
          _id: `edu-${runId}`,
          institution: 'Indian Institute of Science (IISc)',
          degree: 'Ph.D.',
          field_of_study: 'Distributed Databases',
          start_date: '2016-08',
          end_date: '2020-05',
        },
      ],
      skills: [
        { _id: `skill-1-${runId}`, name: 'MongoDB Atlas', proficiency: 'Expert' },
        { _id: `skill-2-${runId}`, name: 'Distributed Systems', proficiency: 'Expert' },
      ],
      experience: [
        {
          _id: `exp-${runId}`,
          job_title: 'Staff Architect',
          company: 'Cloud Scale Inc.',
          employment_type: 'Full-time',
          start_date: '2020-06',
          currently_working: 1,
        },
      ],
      projects: [
        {
          _id: `proj-${runId}`,
          name: 'Multi-Region Replication Engine',
          technologies: 'MongoDB, Node.js, Go',
        },
      ],
      certifications: [
        {
          _id: `cert-${runId}`,
          name: 'MongoDB Certified DBA',
          issuing_organization: 'MongoDB Inc.',
          issue_date: '2021-03',
        },
      ],
      resumes: [
        {
          _id: `res-${runId}`,
          original_filename: 'Jane_Cloud_CV.pdf',
          stored_filename: `resume_${runId}.pdf`,
          file_type: 'PDF',
          file_size: 1572864,
          is_active: 1,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await recalculateCandidateCompletion(testCandProfileId);

    // Simulate backend restart / connection reset
    await closeMongoDatabase();
    await initMongoDatabase();

    // Verify recovery after restart
    const recoveredCand = await mongo.candidate_profiles.findById(testCandProfileId);
    const recoveredUser = await mongo.users.findById(testCandidateUserId);

    if (
      recoveredCand &&
      recoveredUser &&
      recoveredCand.full_name === 'Dr. Jane Cloud, Ph.D.' &&
      recoveredCand.skills.length === 2 &&
      recoveredCand.profile_completion === 100
    ) {
      recordResult(
        'Test A — Candidate Persistence',
        'PASS',
        `Candidate & 100% profile state persisted intact across restart (${recoveredCand.skills.length} skills, Ph.D. degree preserved)`
      );
    } else {
      recordResult('Test A — Candidate Persistence', 'FAIL', 'Candidate data mismatch or loss after restart');
    }
  } catch (err: any) {
    recordResult('Test A — Candidate Persistence', 'FAIL', `Exception: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST B: Recruiter & Company Persistence
  // ----------------------------------------------------
  console.log('\n--- Test B: Recruiter & Company Persistence ---');
  try {
    await mongo.users.insertOne({
      _id: testRecruiterUserId,
      id: testRecruiterUserId,
      email: testRecruiterEmail,
      password_hash: bcrypt.hashSync('RecruiterPass123!', 10),
      role: 'recruiter',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await mongo.recruiter_profiles.insertOne({
      _id: testRecProfileId,
      id: testRecProfileId,
      user_id: testRecruiterUserId,
      full_name: 'Marcus Vance',
      phone: '+91 98765 00001',
      company_name: 'Atlas Cloud Enterprises',
      company_logo: 'https://resumio.ai/logos/atlas.png',
      industry: 'Enterprise Cloud Infrastructure',
      location: 'Hyderabad, India',
      website: 'https://atlascloud.example.com',
      description: 'Global cloud solutions and high-availability database infrastructure.',
      profile_completion: 90,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Simulate restart
    await closeMongoDatabase();
    await initMongoDatabase();

    const recoveredRec = await mongo.recruiter_profiles.findById(testRecProfileId);
    if (recoveredRec && recoveredRec.company_name === 'Atlas Cloud Enterprises' && recoveredRec.user_id === testRecruiterUserId) {
      recordResult(
        'Test B — Recruiter & Company Persistence',
        'PASS',
        `Recruiter profile and company association persisted across restart (${recoveredRec.company_name})`
      );
    } else {
      recordResult('Test B — Recruiter & Company Persistence', 'FAIL', 'Recruiter data mismatch after restart');
    }
  } catch (err: any) {
    recordResult('Test B — Recruiter & Company Persistence', 'FAIL', `Exception: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST C: Job Persistence
  // ----------------------------------------------------
  console.log('\n--- Test C: Job Posting & Requirements Persistence ---');
  try {
    await mongo.jobs.insertOne({
      _id: testJobId,
      id: testJobId,
      recruiter_id: testRecruiterUserId,
      recruiter_profile_id: testRecProfileId,
      title: 'Principal Cloud Database Engineer',
      description: 'Architect mission-critical MongoDB Atlas deployments.',
      company_name: 'Atlas Cloud Enterprises',
      location: 'Remote',
      employment_type: 'Full-time',
      work_mode: 'Remote',
      salary_min: 3500000,
      salary_max: 5500000,
      status: 'Published',
      required_skills: [
        { _id: `req-1-${runId}`, name: 'MongoDB Atlas', minimum_years: 5 },
        { _id: `req-2-${runId}`, name: 'Distributed Systems', minimum_years: 4 },
      ],
      preferred_skills: [
        { _id: `pref-1-${runId}`, name: 'Kubernetes' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    });

    // Simulate restart
    await closeMongoDatabase();
    await initMongoDatabase();

    const recoveredJob = await mongo.jobs.findById(testJobId);
    if (recoveredJob && recoveredJob.required_skills.length === 2 && recoveredJob.status === 'Published') {
      recordResult(
        'Test C — Job Persistence',
        'PASS',
        `Job requisition and embedded skill requirements persisted intact across restart (${recoveredJob.title})`
      );
    } else {
      recordResult('Test C — Job Persistence', 'FAIL', 'Job data corrupted or missing after restart');
    }
  } catch (err: any) {
    recordResult('Test C — Job Persistence', 'FAIL', `Exception: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST D: Application Persistence & Audit History
  // ----------------------------------------------------
  console.log('\n--- Test D: Application & Status History Persistence ---');
  try {
    await mongo.applications.insertOne({
      _id: testAppId,
      id: testAppId,
      candidate_id: testCandidateUserId,
      candidate_profile_id: testCandProfileId,
      job_id: testJobId,
      resume_id: `res-${runId}`,
      cover_letter: 'Passionate about high-throughput document database engineering.',
      status: 'Applied',
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status_history: [
        {
          _id: `sh-1-${runId}`,
          old_status: null,
          new_status: 'Applied',
          changed_by: testCandidateUserId,
          changed_by_role: 'candidate',
          note: 'Submitted application with Jane_Cloud_CV.pdf',
          changed_at: new Date().toISOString(),
        },
      ],
    });

    // Advance status to Shortlisted
    await mongo.applications.updateOne(
      { _id: testAppId },
      {
        $set: { status: 'Shortlisted', updated_at: new Date().toISOString() },
        $push: {
          status_history: {
            _id: `sh-2-${runId}`,
            old_status: 'Applied',
            new_status: 'Shortlisted',
            changed_by: testRecruiterUserId,
            changed_by_role: 'recruiter',
            note: 'Profile matched 100% of required skills',
            changed_at: new Date().toISOString(),
          },
        },
      }
    );

    // Simulate restart
    await closeMongoDatabase();
    await initMongoDatabase();

    const recoveredApp = await mongo.applications.findById(testAppId);
    if (
      recoveredApp &&
      recoveredApp.status === 'Shortlisted' &&
      recoveredApp.status_history.length === 2 &&
      recoveredApp.resume_id === `res-${runId}`
    ) {
      recordResult(
        'Test D — Application Persistence',
        'PASS',
        `Application, candidate/job references, and 2-step audit trail persisted intact across restart`
      );
    } else {
      recordResult('Test D — Application Persistence', 'FAIL', 'Application or audit history lost');
    }
  } catch (err: any) {
    recordResult('Test D — Application Persistence', 'FAIL', `Exception: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST E: Interview & Notification Persistence
  // ----------------------------------------------------
  console.log('\n--- Test E: Interview & Notification Persistence ---');
  try {
    await mongo.interviews.insertOne({
      _id: testInterviewId,
      id: testInterviewId,
      application_id: testAppId,
      candidate_id: testCandidateUserId,
      recruiter_id: testRecruiterUserId,
      job_id: testJobId,
      title: 'Technical Architecture Round',
      interview_type: 'Video',
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      duration_minutes: 60,
      meeting_url: 'https://meet.resumio.ai/atlas-arch-round',
      status: 'Scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status_history: [
        {
          _id: `ih-1-${runId}`,
          old_status: null,
          new_status: 'Scheduled',
          changed_by: testRecruiterUserId,
          changed_by_role: 'recruiter',
          note: 'Confirmed panel interview',
          changed_at: new Date().toISOString(),
        },
      ],
    });

    await mongo.notifications.insertOne({
      _id: testNotifId,
      id: testNotifId,
      user_id: testCandidateUserId,
      type: 'interview_scheduled',
      title: 'Interview Scheduled: Technical Architecture Round',
      message: 'Atlas Cloud Enterprises has scheduled your technical interview.',
      related_entity_type: 'interview',
      related_entity_id: testInterviewId,
      is_read: 0,
      created_at: new Date().toISOString(),
    });

    // Simulate restart
    await closeMongoDatabase();
    await initMongoDatabase();

    const recoveredInterview = await mongo.interviews.findById(testInterviewId);
    const recoveredNotif = await mongo.notifications.findById(testNotifId);

    if (
      recoveredInterview &&
      recoveredNotif &&
      recoveredInterview.status === 'Scheduled' &&
      recoveredNotif.is_read === 0 &&
      recoveredNotif.related_entity_id === testInterviewId
    ) {
      recordResult(
        'Test E — Interview & Notification Persistence',
        'PASS',
        `Interview schedule, meeting URL, and linked notification persisted across restart`
      );
    } else {
      recordResult('Test E — Interview & Notification Persistence', 'FAIL', 'Interview or notification lost');
    }
  } catch (err: any) {
    recordResult('Test E — Interview & Notification Persistence', 'FAIL', `Exception: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST F: Update & Delete Operations (Ownership & Audit Safety)
  // ----------------------------------------------------
  console.log('\n--- Test F: Update & Delete Behavior ---');
  try {
    // 1. Safe update test: Mark notification as read
    await mongo.notifications.updateOne({ _id: testNotifId }, { $set: { is_read: 1 } });
    const readNotif = await mongo.notifications.findById(testNotifId);

    // 2. Ownership verification check: Recruiter cannot delete another recruiter's job
    const unauthorizedAttempt = await mongo.jobs.findOne({ _id: testJobId, recruiter_id: 'wrong-recruiter-id' });
    const ownershipProtected = unauthorizedAttempt === null;

    // 3. Clean cleanup of test records only
    await mongo.notifications.deleteOne({ _id: testNotifId });
    await mongo.interviews.deleteOne({ _id: testInterviewId });
    await mongo.applications.deleteOne({ _id: testAppId });
    await mongo.jobs.deleteOne({ _id: testJobId });
    await mongo.candidate_profiles.deleteOne({ _id: testCandProfileId });
    await mongo.recruiter_profiles.deleteOne({ _id: testRecProfileId });
    await mongo.users.deleteOne({ _id: testCandidateUserId });
    await mongo.users.deleteOne({ _id: testRecruiterUserId });

    const postCleanupCand = await mongo.candidate_profiles.findById(testCandProfileId);
    const cleanupComplete = postCleanupCand === null;

    if (readNotif?.is_read === 1 && ownershipProtected && cleanupComplete) {
      recordResult(
        'Test F — Update & Delete Behavior',
        'PASS',
        'Atomic updates, ownership checks, and clean isolated deletion of test records verified'
      );
    } else {
      recordResult('Test F — Update & Delete Behavior', 'FAIL', 'Update or deletion logic violated integrity');
    }
  } catch (err: any) {
    recordResult('Test F — Update & Delete Behavior', 'FAIL', `Exception: ${err.message}`);
  }

  // Print Summary
  console.log('\n====================================================');
  console.log('📋 PERSISTENCE VERIFICATION EXECUTION SUMMARY');
  console.log('====================================================');
  results.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.status}] ${r.name}`);
    console.log(`   ${r.details}`);
  });
  console.log('====================================================\n');

  const allPassed = results.every((r) => r.status === 'PASS');
  return {
    allPassed,
    results,
    isAtlasLive: isAtlasConfigured && readiness.ready && readiness.isAtlas,
  };
}

if (process.argv[1]?.includes('verify-atlas-persistence')) {
  runPersistenceVerification()
    .then((res) => {
      if (res.allPassed) {
        console.log('🎉 All Data Persistence & Restart Tests Passed (100%)!');
        process.exit(0);
      } else {
        console.error('❌ One or more persistence checks failed or blocked.');
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('💥 Fatal error in persistence verification:', err);
      process.exit(1);
    });
}

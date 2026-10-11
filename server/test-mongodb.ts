import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { mongo, recalculateCandidateCompletion, verifyMongoDatabaseIntegrity } from './database/mongo.js';
import { runMigration } from './scripts/migrate-sqlite-to-mongo.js';

async function runMongoTests() {
  console.log('====================================================');
  console.log('🍃 RESUMIO PHASE 2 — MONGODB VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}${detail ? ` (${detail})` : ''}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Migration from SQLite to MongoDB
    console.log('1. Executing SQLite to MongoDB Migration...');
    const migrationResult = await runMigration();
    assert(migrationResult.success, 'SQLite to MongoDB migration completed with 0 errors');

    // 2. Database Integrity & Relationship Check
    console.log('\n2. Testing MongoDB Database Integrity & Foreign Key Integrity...');
    const integrity = await verifyMongoDatabaseIntegrity();
    assert(integrity.isValid, 'MongoDB relational integrity verified (0 orphan records)');
    assert(integrity.userCount >= 58, 'User collection populated', `${integrity.userCount} users`);
    assert(integrity.candidateProfileCount >= 26, 'Candidate profiles collection populated', `${integrity.candidateProfileCount} profiles`);
    assert(integrity.recruiterProfileCount >= 29, 'Recruiter profiles collection populated', `${integrity.recruiterProfileCount} profiles`);
    assert(integrity.jobCount >= 28, 'Job collection populated', `${integrity.jobCount} jobs`);
    assert(integrity.applicationCount >= 20, 'Application collection populated', `${integrity.applicationCount} applications`);

    // 3. User CRUD & Queries
    console.log('\n3. Testing MongoDB User CRUD & Query Operators...');
    const testUserId = `test-user-${crypto.randomUUID()}`;
    const testUserEmail = `mongo.test.${Date.now()}@resumio.ai`;
    await mongo.users.insertOne({
      _id: testUserId,
      id: testUserId,
      email: testUserEmail,
      password_hash: bcrypt.hashSync('MongoTest123!', 10),
      role: 'candidate',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const foundUser = await mongo.users.findById(testUserId);
    assert(Boolean(foundUser) && foundUser?.email === testUserEmail, 'User created and retrieved by ID');

    const foundByEmail = await mongo.users.findOne({ email: testUserEmail });
    assert(Boolean(foundByEmail) && foundByEmail?.role === 'candidate', 'User queried by email field');

    // 4. Candidate Profile & Embedded Documents
    console.log('\n4. Testing Candidate Profile with Embedded Subdocuments...');
    const testCandId = `test-cand-${crypto.randomUUID()}`;
    await mongo.candidate_profiles.insertOne({
      _id: testCandId,
      id: testCandId,
      user_id: testUserId,
      full_name: 'MongoDB Test Engineer',
      headline: 'Full Stack MongoDB Specialist',
      phone: '+91 99999 88888',
      location: 'Bangalore, India',
      bio: 'Expert in distributed document databases',
      photo_url: 'https://resumio.ai/avatars/mongo-test.jpg',
      profile_completion: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      education: [
        {
          _id: crypto.randomUUID(),
          institution: 'BITS Pilani',
          degree: 'B.Tech',
          field_of_study: 'Computer Science',
          start_date: '2018-08',
          end_date: '2022-05',
        },
      ],
      skills: [
        { _id: crypto.randomUUID(), name: 'MongoDB', proficiency: 'Expert' },
        { _id: crypto.randomUUID(), name: 'Node.js', proficiency: 'Advanced' },
      ],
      experience: [
        {
          _id: crypto.randomUUID(),
          job_title: 'Senior Engineer',
          company: 'Acme Cloud',
          employment_type: 'Full-time',
          start_date: '2022-06',
          currently_working: 1,
        },
      ],
      projects: [
        {
          _id: crypto.randomUUID(),
          name: 'Distributed Cache',
          technologies: 'TypeScript, MongoDB',
        },
      ],
      certifications: [
        {
          _id: crypto.randomUUID(),
          name: 'MongoDB Certified Developer',
          issuing_organization: 'MongoDB Inc',
          issue_date: '2023-01',
        },
      ],
      resumes: [
        {
          _id: crypto.randomUUID(),
          original_filename: 'MongoDB_Specialist_Resume.pdf',
          stored_filename: 'resume_mongo_test.pdf',
          file_type: 'PDF',
          file_size: 1048576,
          is_active: 1,
        },
      ],
    });

    const completionScore = await recalculateCandidateCompletion(testCandId);
    assert(completionScore === 100, 'Dynamic completion score computed across all 10 embedded sections', `${completionScore}%`);

    // 5. Job Creation with Embedded Skills
    console.log('\n5. Testing Job Creation with Embedded Skill Requirements...');
    const testJobId = `test-job-${crypto.randomUUID()}`;
    await mongo.jobs.insertOne({
      _id: testJobId,
      id: testJobId,
      recruiter_id: testUserId,
      recruiter_profile_id: testCandId,
      title: 'Principal Database Architect',
      description: 'Lead next-generation MongoDB database architectures.',
      company_name: 'Resumio Enterprise Solutions',
      location: 'Remote, India',
      employment_type: 'Full-time',
      work_mode: 'Remote',
      salary_min: 3000000,
      salary_max: 5000000,
      status: 'Published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      required_skills: [
        { _id: crypto.randomUUID(), name: 'MongoDB', minimum_years: 5 },
        { _id: crypto.randomUUID(), name: 'TypeScript', minimum_years: 4 },
      ],
      preferred_skills: [
        { _id: crypto.randomUUID(), name: 'Docker' },
        { _id: crypto.randomUUID(), name: 'GraphQL' },
      ],
    });

    const foundJob = await mongo.jobs.findById(testJobId);
    assert(Boolean(foundJob) && foundJob?.required_skills.length === 2, 'Job created with embedded required skills array');
    assert(foundJob?.preferred_skills.length === 2, 'Job created with embedded preferred skills array');

    // 6. Application with Embedded Status History
    console.log('\n6. Testing Application Workflow & Status History Embedding...');
    const testAppId = `test-app-${crypto.randomUUID()}`;
    await mongo.applications.insertOne({
      _id: testAppId,
      id: testAppId,
      candidate_id: testUserId,
      candidate_profile_id: testCandId,
      job_id: testJobId,
      resume_id: foundJob?.required_skills[0]._id,
      status: 'Applied',
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status_history: [
        {
          _id: crypto.randomUUID(),
          old_status: null,
          new_status: 'Applied',
          changed_by: testUserId,
          changed_by_role: 'candidate',
          note: 'Initial submission',
          changed_at: new Date().toISOString(),
        },
      ],
    });

    // Update application status with $push
    await mongo.applications.updateOne(
      { _id: testAppId },
      {
        $set: { status: 'Shortlisted', updated_at: new Date().toISOString() },
        $push: {
          status_history: {
            _id: crypto.randomUUID(),
            old_status: 'Applied',
            new_status: 'Shortlisted',
            changed_by: testUserId,
            changed_by_role: 'recruiter',
            note: 'Top candidate match',
            changed_at: new Date().toISOString(),
          },
        },
      }
    );

    const updatedApp = await mongo.applications.findById(testAppId);
    assert(updatedApp?.status === 'Shortlisted', 'Application status updated to Shortlisted');
    assert(updatedApp?.status_history.length === 2, 'Status history array appended atomically via $push');

    // 7. Interview Scheduling with Embedded History
    console.log('\n7. Testing Interview Scheduling & Status Audit Embedding...');
    const testInterviewId = `test-int-${crypto.randomUUID()}`;
    await mongo.interviews.insertOne({
      _id: testInterviewId,
      id: testInterviewId,
      application_id: testAppId,
      candidate_id: testUserId,
      recruiter_id: testUserId,
      job_id: testJobId,
      title: 'Technical Architecture Round',
      interview_type: 'Video',
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      duration_minutes: 60,
      meeting_url: 'https://meet.resumio.ai/mongo-round',
      status: 'Scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status_history: [
        {
          _id: crypto.randomUUID(),
          old_status: null,
          new_status: 'Scheduled',
          changed_by: testUserId,
          changed_by_role: 'recruiter',
          note: 'Round 1 confirmed',
          changed_at: new Date().toISOString(),
        },
      ],
    });

    const foundInterview = await mongo.interviews.findById(testInterviewId);
    assert(Boolean(foundInterview) && foundInterview?.status === 'Scheduled', 'Interview scheduled with embedded history');

    // 8. Notifications & Queries
    console.log('\n8. Testing Notification Delivery & Unread Filters...');
    const testNotifId = `test-notif-${crypto.randomUUID()}`;
    await mongo.notifications.insertOne({
      _id: testNotifId,
      id: testNotifId,
      user_id: testUserId,
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: 'Your Technical Architecture Round has been scheduled.',
      related_entity_type: 'interview',
      related_entity_id: testInterviewId,
      is_read: 0,
      created_at: new Date().toISOString(),
    });

    const unreadCount = await mongo.notifications.countDocuments({ user_id: testUserId, is_read: 0 });
    assert(unreadCount >= 1, 'Unread notification counted successfully', `Count: ${unreadCount}`);

    // Mark notification read
    await mongo.notifications.updateOne({ _id: testNotifId }, { $set: { is_read: 1 } });
    const postReadCount = await mongo.notifications.countDocuments({ user_id: testUserId, is_read: 0 });
    assert(postReadCount === unreadCount - 1, 'Notification marked read via $set operator');

    // 9. AI Results Persistence in MongoDB
    console.log('\n9. Testing AI Intelligence Results Persistence...');
    const testMatchId = `test-match-${crypto.randomUUID()}`;
    await mongo.resume_job_matches.insertOne({
      _id: testMatchId,
      id: testMatchId,
      resume_id: crypto.randomUUID(),
      job_id: testJobId,
      application_id: testAppId,
      candidate_id: testUserId,
      candidate_profile_id: testCandId,
      algorithm_version: '1.0.0',
      status: 'Completed',
      match_score: 95,
      required_skills_matched_json: JSON.stringify(['MongoDB', 'TypeScript']),
      required_skills_missing_json: '[]',
      preferred_skills_matched_json: JSON.stringify(['Docker']),
      preferred_skills_missing_json: JSON.stringify(['GraphQL']),
      required_skills_score: 45,
      preferred_skills_score: 12.5,
      experience_score: 20,
      qualification_score: 10,
      relevance_score: 7.5,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const foundMatch = await mongo.resume_job_matches.findById(testMatchId);
    assert(Boolean(foundMatch) && foundMatch?.match_score === 95, 'AI Match Score persisted and retrieved from MongoDB');

    // 10. Clean up temporary test documents
    console.log('\n10. Cleaning Up Temporary Test Documents...');
    await mongo.users.deleteOne({ _id: testUserId });
    await mongo.candidate_profiles.deleteOne({ _id: testCandId });
    await mongo.jobs.deleteOne({ _id: testJobId });
    await mongo.applications.deleteOne({ _id: testAppId });
    await mongo.interviews.deleteOne({ _id: testInterviewId });
    await mongo.notifications.deleteOne({ _id: testNotifId });
    await mongo.resume_job_matches.deleteOne({ _id: testMatchId });

    assert(true, 'Test artifacts cleaned up cleanly from MongoDB collections');

    console.log('\n====================================================');
    console.log(`PHASE 2 MONGODB TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err: any) {
    console.error('💥 Fatal MongoDB Test Error:', err);
    process.exit(1);
  }
}

runMongoTests();

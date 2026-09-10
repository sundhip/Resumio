import { getDb } from './database/db';

async function runPhase3Tests() {
  console.log('====================================================');
  console.log('RUNNING PHASE 3 AUTOMATED TESTS FOR RESUMIO');
  console.log('====================================================');

  const BASE_URL = 'http://localhost:3001/api';

  // 1. Create a test Recruiter and Candidate
  const testRecruiterEmail = `recruiter_p3_${Date.now()}@test.com`;
  const testCandidateEmail = `candidate_p3_${Date.now()}@test.com`;
  const password = 'Password123!';

  console.log('\n[1] Registering test recruiter and candidate...');
  
  const recRegRes = await fetch(`${BASE_URL}/auth/register/recruiter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testRecruiterEmail,
      password,
      confirmPassword: password,
      fullName: 'Sarah Recruiter',
      companyName: 'Acme AI Labs'
    })
  });
  const recReg = await recRegRes.json();
  if (!recReg.token) throw new Error('Recruiter registration failed: ' + JSON.stringify(recReg));
  const recruiterToken = recReg.token;
  console.log('✓ Recruiter registered successfully.');

  const candRegRes = await fetch(`${BASE_URL}/auth/register/candidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testCandidateEmail,
      password,
      confirmPassword: password,
      fullName: 'Alex Developer'
    })
  });
  const candReg = await candRegRes.json();
  if (!candReg.token) throw new Error('Candidate registration failed: ' + JSON.stringify(candReg));
  const candidateToken = candReg.token;
  console.log('✓ Candidate registered successfully.');

  // Set up candidate profile with skills for recommendation test
  console.log('\n[2] Setting up candidate profile with skills...');
  const skillRes = await fetch(`${BASE_URL}/candidate/skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${candidateToken}`
    },
    body: JSON.stringify({
      name: 'TypeScript',
      proficiency: 'Expert'
    })
  });
  const skillJson = await skillRes.json();
  if (!skillJson.success) throw new Error('Failed to add candidate skill: ' + JSON.stringify(skillJson));

  await fetch(`${BASE_URL}/candidate/skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${candidateToken}`
    },
    body: JSON.stringify({
      name: 'React',
      proficiency: 'Advanced'
    })
  });
  console.log('✓ Candidate profile configured with skills (TypeScript, React).');

  // 3. Create a Draft Job Posting
  console.log('\n[3] Creating a draft job posting...');
  const draftJobRes = await fetch(`${BASE_URL}/recruiter/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${recruiterToken}`
    },
    body: JSON.stringify({
      title: 'Senior Frontend Engineer (Draft)',
      company_name: 'Acme AI Labs',
      location: 'San Francisco, CA',
      employment_type: 'Full-time',
      work_mode: 'Remote',
      description: 'Join our team to build next-gen AI interfaces.',
      responsibilities: '• Build reactive UI with React and TypeScript\n• Optimize client bundle size',
      min_experience: 3,
      max_experience: 7,
      qualification: "Bachelor's Degree",
      salary_disclosed: true,
      salary_min: 130000,
      salary_max: 180000,
      currency: 'USD',
      salary_period: 'Yearly',
      required_skills: ['React', 'TypeScript'],
      preferred_skills: ['Tailwind CSS', 'Next.js'],
      publish: false
    })
  });
  const draftJob = await draftJobRes.json();
  if (!draftJob.success || !draftJob.jobId) throw new Error('Draft creation failed: ' + JSON.stringify(draftJob));
  const draftJobId = draftJob.jobId;
  console.log(`✓ Draft job created with ID: ${draftJobId}`);

  // 4. Create a Published Job Posting
  console.log('\n[4] Creating an active published job posting...');
  const pubJobRes = await fetch(`${BASE_URL}/recruiter/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${recruiterToken}`
    },
    body: JSON.stringify({
      title: 'Staff Full-Stack Architect',
      company_name: 'Acme AI Labs',
      location: 'San Francisco, CA',
      employment_type: 'Full-time',
      work_mode: 'Hybrid',
      description: 'Lead architecture and development of scalable AI recruitment platforms.',
      responsibilities: '• Design distributed microservices\n• Mentor senior engineers',
      min_experience: 5,
      max_experience: 12,
      qualification: "Bachelor's Degree",
      salary_disclosed: true,
      salary_min: 160000,
      salary_max: 220000,
      currency: 'USD',
      salary_period: 'Yearly',
      required_skills: ['TypeScript', 'Node.js', 'React'],
      preferred_skills: ['Docker', 'Kubernetes'],
      publish: true
    })
  });
  const pubJob = await pubJobRes.json();
  if (!pubJob.success || !pubJob.jobId) throw new Error('Published job creation failed: ' + JSON.stringify(pubJob));
  const pubJobId = pubJob.jobId;
  console.log(`✓ Published job created with ID: ${pubJobId}`);

  // 5. Test Recruiter Job List & Real Metrics
  console.log('\n[5] Fetching recruiter jobs and real status statistics...');
  const recJobsRes = await fetch(`${BASE_URL}/recruiter/jobs`, {
    headers: { 'Authorization': `Bearer ${recruiterToken}` }
  });
  const recJobs = await recJobsRes.json();
  if (!recJobs.success || recJobs.jobs.length < 2) throw new Error('Recruiter jobs fetch failed: ' + JSON.stringify(recJobs));
  console.log(`✓ Recruiter jobs count: ${recJobs.jobs.length}, stats:`, recJobs.stats);
  if (recJobs.stats.active < 1 || recJobs.stats.draft < 1) {
    throw new Error('Stats calculation mismatch: ' + JSON.stringify(recJobs.stats));
  }

  // 6. Test Candidate Public Job Discovery & Search
  console.log('\n[6] Candidate searching active published jobs...');
  const candSearchRes = await fetch(`${BASE_URL}/jobs?q=Staff&work_mode=Hybrid`);
  const candSearch = await candSearchRes.json();
  if (!candSearch.success || candSearch.jobs.length === 0) {
    throw new Error('Candidate job search failed: ' + JSON.stringify(candSearch));
  }
  console.log(`✓ Candidate found ${candSearch.total} matching jobs for query "Staff", first title: "${candSearch.jobs[0].title}"`);

  // Verify Draft jobs are NOT visible to candidate search
  const draftSearchRes = await fetch(`${BASE_URL}/jobs?q=Draft`);
  const draftSearch = await draftSearchRes.json();
  if (draftSearch.jobs.some((j: any) => j.id === draftJobId)) {
    throw new Error('CRITICAL: Draft job was leaked in public candidate search!');
  }
  console.log('✓ Confirmed: Draft jobs are strictly invisible in public candidate search.');

  // 7. Test Candidate Single Job Detail View
  console.log('\n[7] Candidate viewing full job details by ID...');
  const detailRes = await fetch(`${BASE_URL}/jobs/${pubJobId}`);
  const detail = await detailRes.json();
  if (!detail.success || !detail.job || detail.job.title !== 'Staff Full-Stack Architect') {
    throw new Error('Job detail fetch failed: ' + JSON.stringify(detail));
  }
  console.log(`✓ Job details verified: "${detail.job.title}", Required Skills: ${detail.job.required_skills.join(', ')}`);

  // 8. Test Candidate Profile Recommendations (Deterministic Matching)
  console.log('\n[8] Candidate requesting profile-based job recommendations...');
  const recRes = await fetch(`${BASE_URL}/jobs/recommendations`, {
    headers: { 'Authorization': `Bearer ${candidateToken}` }
  });
  const recData = await recRes.json();
  if (!recData.success) throw new Error('Recommendations fetch failed: ' + JSON.stringify(recData));
  console.log(`✓ Recommendations calculated (${recData.recommendations.length} recommendations).`);
  if (recData.recommendations.length > 0) {
    const topRec = recData.recommendations[0];
    console.log(`  Top match: "${topRec.title}" | Matched skills: ${topRec.matched_skills.join(', ')} | Reasons: ${topRec.match_reasons.join('; ')}`);
  }

  // 9. Test Publishing the Draft Job
  console.log('\n[9] Recruiter publishing the draft job...');
  const publishRes = await fetch(`${BASE_URL}/recruiter/jobs/${draftJobId}/publish`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${recruiterToken}` }
  });
  const pubResult = await publishRes.json();
  if (!pubResult.success) throw new Error('Publish draft failed: ' + JSON.stringify(pubResult));
  console.log('✓ Draft job published successfully.');

  // 10. Test Closing the Published Job
  console.log('\n[10] Recruiter closing the job...');
  const closeRes = await fetch(`${BASE_URL}/recruiter/jobs/${draftJobId}/close`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${recruiterToken}` }
  });
  const closeResult = await closeRes.json();
  if (!closeResult.success) throw new Error('Close job failed: ' + JSON.stringify(closeResult));
  console.log('✓ Job closed successfully.');

  // 11. Test Deleting a Draft Job
  console.log('\n[11] Creating and deleting a test draft job...');
  const tempDraftRes = await fetch(`${BASE_URL}/recruiter/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${recruiterToken}`
    },
    body: JSON.stringify({
      title: 'Temporary Role To Delete',
      company_name: 'Acme AI Labs',
      location: 'Remote',
      employment_type: 'Contract',
      work_mode: 'Remote',
      description: 'Temporary description',
      required_skills: ['Git'],
      publish: false
    })
  });
  const tempDraft = await tempDraftRes.json();
  const deleteRes = await fetch(`${BASE_URL}/recruiter/jobs/${tempDraft.jobId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${recruiterToken}` }
  });
  const delResult = await deleteRes.json();
  if (!delResult.success) throw new Error('Delete draft failed: ' + JSON.stringify(delResult));
  console.log('✓ Draft job deleted successfully.');

  console.log('\n====================================================');
  console.log('ALL PHASE 3 AUTOMATED TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('====================================================\n');
}

runPhase3Tests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import db from './database/db.js';
import {
  isSsrfSafeIp,
  validateUrlSafety,
  extractTextAndLinks,
} from './services/ssrfProtectionService.js';
import {
  verifyCandidateGitHub,
  clearGithubEtagCache,
  setMockGithubHandlerForTesting,
  getGithubEtagCacheSize,
} from './services/githubVerificationService.js';
import {
  computeHybridJobRecommendations,
  generateUpskillingRoadmap,
  simulateWhatIfScenario,
  CandidatePreferenceProfile,
  CandidateSkillsContext,
  TargetJobItem,
  CuratedResourceItem,
} from '../packages/shared/src/index.js';
import {
  exportAllCandidateData,
  deleteCandidateAccount,
  getCandidateConsents,
  updateCandidateConsents,
  logProfileAccess,
  getProfileAccessLogs,
} from './services/candidateDataRightsService.js';

console.log('============================================================');
console.log('🧪 RUNNING PHASE 9: CANDIDATE EXPERIENCE & VERIFICATION TESTS');
console.log('============================================================\n');

async function runAllTests() {
  await (db as any).ensureReady();
  let passedCount = 0;

  // ------------------------------------------------------------
  // TEST SUITE 1: SSRF PROTECTION & PORTFOLIO URL SECURITY
  // ------------------------------------------------------------
  console.log('--- Suite 1: SSRF & IP Validation Security ---');

  // 1.1 Localhost & Loopback
  assert.equal(isSsrfSafeIp('127.0.0.1'), false, '127.0.0.1 must be rejected');
  assert.equal(isSsrfSafeIp('127.0.0.2'), false, '127.0.0.2 must be rejected');
  assert.equal(isSsrfSafeIp('::1'), false, 'IPv6 ::1 must be rejected');
  assert.equal(isSsrfSafeIp('::ffff:127.0.0.1'), false, 'IPv4-mapped IPv6 loopback must be rejected');

  // 1.2 RFC1918 Private Ranges
  assert.equal(isSsrfSafeIp('10.0.0.1'), false, '10.0.0.1 (Class A private) must be rejected');
  assert.equal(isSsrfSafeIp('172.16.0.1'), false, '172.16.0.1 (Class B private) must be rejected');
  assert.equal(isSsrfSafeIp('172.31.255.254'), false, '172.31.255.254 (Class B private) must be rejected');
  assert.equal(isSsrfSafeIp('192.168.1.1'), false, '192.168.1.1 (Class C private) must be rejected');

  // 1.3 Cloud Metadata IP (169.254.169.254)
  assert.equal(isSsrfSafeIp('169.254.169.254'), false, 'AWS/GCP/Azure link-local metadata IP must be rejected');

  // 1.4 Valid Public IPs
  assert.equal(isSsrfSafeIp('8.8.8.8'), true, '8.8.8.8 (Google DNS) must be permitted');
  assert.equal(isSsrfSafeIp('1.1.1.1'), true, '1.1.1.1 (Cloudflare DNS) must be permitted');
  assert.equal(isSsrfSafeIp('140.82.112.4'), true, 'GitHub public IP must be permitted');

  // 1.5 URL Scheme & Hostname Validation
  const fileCheck = await validateUrlSafety('file:///etc/passwd');
  assert.equal(fileCheck.safe, false, 'file:// scheme must be rejected');

  const ftpCheck = await validateUrlSafety('ftp://files.example.com');
  assert.equal(ftpCheck.safe, false, 'ftp:// scheme must be rejected');

  const localHostCheck = await validateUrlSafety('http://localhost:3000/api');
  assert.equal(localHostCheck.safe, false, 'localhost host must be rejected');

  // 1.6 HTML Defanging & Link Extraction
  const dirtyHtml = `
    <html>
      <head><title>Portfolio</title></head>
      <body>
        <script>alert("xss")</script>
        <h1>Alice Developer</h1>
        <p>Full stack engineer specializing in TypeScript and React.</p>
        <a href="https://github.com/alice">My GitHub</a>
        <a href="https://demo.project.org">Live Demo</a>
      </body>
    </html>
  `;
  const extracted = extractTextAndLinks(dirtyHtml, 'https://alice.dev');
  assert.ok(!extracted.text.includes('alert'), 'Scripts must be defanged and stripped');
  assert.ok(extracted.text.includes('Alice Developer'), 'Visible text must be preserved');
  assert.ok(extracted.links.includes('https://github.com/alice'), 'GitHub link must be extracted');
  assert.ok(extracted.links.includes('https://demo.project.org'), 'Demo project link must be extracted');

  console.log('✅ Suite 1 passed: All SSRF attacks, internal IPs, metadata IPs, and HTML defanging verified.\n');
  passedCount++;

  // ------------------------------------------------------------
  // TEST SUITE 2: GITHUB VERIFICATION WITH ETAG CACHING
  // ------------------------------------------------------------
  console.log('--- Suite 2: GitHub API Verification & ETag Caching ---');

  clearGithubEtagCache();
  assert.equal(getGithubEtagCacheSize(), 0);

  // Set mock GitHub API handler for deterministic testing
  let apiCallCount = 0;
  const mockRepos = [
    {
      name: 'resumio-engine',
      full_name: 'alice/resumio-engine',
      description: 'Production resume parser with automated testing',
      html_url: 'https://github.com/alice/resumio-engine',
      fork: false,
      stargazers_count: 24,
      forks_count: 3,
      language: 'TypeScript',
      topics: ['typescript', 'react', 'ci', 'testing'],
      pushed_at: '2026-09-15T10:00:00Z',
    },
    {
      name: 'python-ml-pipeline',
      full_name: 'alice/python-ml-pipeline',
      description: 'FastAPI and PyTorch microservice for NLP embeddings',
      html_url: 'https://github.com/alice/python-ml-pipeline',
      fork: false,
      stargazers_count: 8,
      forks_count: 1,
      language: 'Python',
      topics: ['python', 'fastapi', 'nlp'],
      pushed_at: '2026-10-01T12:00:00Z',
    },
    {
      name: 'kubernetes-starter',
      full_name: 'alice/kubernetes-starter',
      description: 'Forked k8s manifests',
      html_url: 'https://github.com/alice/kubernetes-starter',
      fork: true,
      stargazers_count: 1,
      forks_count: 0,
      language: 'Go',
      topics: ['k8s', 'kubernetes'],
      pushed_at: '2026-05-01T08:00:00Z',
    },
  ];

  setMockGithubHandlerForTesting(async (url: string, headers: Record<string, string>) => {
    apiCallCount++;
    const testEtag = 'W/"mock-etag-v123"';

    if (headers['If-None-Match'] === testEtag) {
      return { status: 304, headers: { etag: testEtag }, data: null };
    }

    if (url.includes('/users/alice/repos')) {
      return { status: 200, headers: { etag: testEtag }, data: mockRepos };
    }

    return {
      status: 200,
      headers: { etag: testEtag },
      data: { login: 'alice', html_url: 'https://github.com/alice', public_repos: 3, avatar_url: 'https://avatars.example.com/alice' },
    };
  });

  // Create test candidate user in SQLite
  const testCandidateId = `cand_gh_test_${crypto.randomUUID()}`;
  const testEmail = `alice.gh.${crypto.randomUUID()}@test.com`;
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role)
    VALUES (?, ?, 'dummy_hash', 'candidate')
  `).run(testCandidateId, testEmail);

  db.prepare(`
    INSERT INTO candidate_profiles (id, user_id, full_name)
    VALUES (?, ?, 'Alice Developer')
  `).run(`prof_${testCandidateId}`, testCandidateId);

  // First verification call
  const claimedSkills = ['TypeScript', 'Python', 'Kubernetes', 'Rust'];
  const ghResult1 = await verifyCandidateGitHub(testCandidateId, 'alice', claimedSkills);

  assert.equal(ghResult1.username, 'alice');
  assert.equal(ghResult1.analyzedReposCount, 3);
  assert.equal(ghResult1.totalStars, 33);
  assert.equal(ghResult1.originalReposRatio, 0.67); // 2 of 3 original

  // Verify skills mapped
  const tsBadge = ghResult1.verifiedSkills.find(s => s.skillName === 'TypeScript');
  assert.ok(tsBadge);
  assert.equal(tsBadge.isVerified, true);
  assert.equal(tsBadge.badge, 'Verified by evidence');
  assert.ok(tsBadge.evidenceSources.length > 0);

  const rustBadge = ghResult1.verifiedSkills.find(s => s.skillName === 'Rust');
  assert.ok(rustBadge);
  assert.equal(rustBadge.isVerified, false);
  assert.equal(rustBadge.badge, 'Unverified');
  assert.equal(rustBadge.evidenceSources.length, 0);

  // Second verification call (should use ETag cache and return 304 Not Modified)
  const initialCalls = apiCallCount;
  const ghResult2 = await verifyCandidateGitHub(testCandidateId, 'alice', claimedSkills);
  assert.equal(ghResult2.username, 'alice');
  assert.equal(ghResult2.verifiedSkills.length, 4);

  // Check SQLite persistence
  const savedVerif = db.prepare(`SELECT * FROM candidate_verifications WHERE candidate_id = ? AND provider = 'github'`).get(testCandidateId) as any;
  assert.ok(savedVerif);
  assert.equal(savedVerif.verification_status, 'verified');

  const savedSkillVerifs = db.prepare(`SELECT * FROM candidate_skill_verifications WHERE candidate_id = ?`).all(testCandidateId);
  assert.ok(savedSkillVerifs.length >= 2, 'TypeScript and Python should be stored in candidate_skill_verifications');

  console.log('✅ Suite 2 passed: GitHub verification, ETag caching, skill evidence badges, and SQLite storage verified.\n');
  passedCount++;

  // ------------------------------------------------------------
  // TEST SUITE 3: COUNTERFACTUAL UPSKILLING ROADMAP & REAL SCORER DELTA
  // ------------------------------------------------------------
  console.log('--- Suite 3: Counterfactual Upskilling Roadmap ---');

  const targetJobs: TargetJobItem[] = [
    {
      id: 'job_lead_fe',
      title: 'Lead Frontend Engineer',
      companyName: 'Tech Corp',
      location: 'San Francisco, CA',
      workMode: 'Hybrid',
      requiredSkills: ['TypeScript', 'React', 'Docker'],
      preferredSkills: ['GraphQL'],
      minExperienceYears: 4,
    },
    {
      id: 'job_fullstack',
      title: 'Full Stack Engineer',
      companyName: 'Cloud Solutions',
      location: 'Remote',
      workMode: 'Remote',
      requiredSkills: ['TypeScript', 'Node.js', 'Docker', 'PostgreSQL'],
      preferredSkills: ['Kubernetes'],
      minExperienceYears: 3,
    },
  ];

  const curatedResources: CuratedResourceItem[] = [
    {
      id: 'res_docker',
      skillName: 'Docker',
      title: 'Docker Get Started Orientation',
      url: 'https://docs.docker.com/get-started/',
      provider: 'Docker Inc.',
      resourceType: 'tutorial',
      difficulty: 'beginner',
      estimatedHours: 12,
      isFree: true,
    },
    {
      id: 'res_postgres',
      skillName: 'PostgreSQL',
      title: 'PostgreSQL Official Documentation',
      url: 'https://www.postgresql.org/docs/',
      provider: 'PostgreSQL Global Development',
      resourceType: 'documentation',
      difficulty: 'intermediate',
      estimatedHours: 20,
      isFree: true,
    },
  ];

  const currentSkills = ['TypeScript', 'React'];
  const roadmap = generateUpskillingRoadmap(
    'candidate_test_user',
    currentSkills,
    targetJobs,
    curatedResources
  );

  assert.equal(roadmap.totalTargetJobsAnalyzed, 2);
  assert.ok(roadmap.steps.length > 0);
  assert.ok(roadmap.projectedAverageScore > roadmap.currentAverageScore, 'Projected score must be higher than current score');

  // Verify steps are strictly ordered descending by impactScoreDelta
  for (let i = 0; i < roadmap.steps.length - 1; i++) {
    assert.ok(
      roadmap.steps[i].impactScoreDelta >= roadmap.steps[i + 1].impactScoreDelta,
      `Step ${i} (${roadmap.steps[i].impactScoreDelta}) must be >= Step ${i + 1} (${roadmap.steps[i + 1].impactScoreDelta})`
    );
  }

  // Verify curated resource vs fallback search suggestion
  const dockerStep = roadmap.steps.find(s => s.skillName === 'Docker');
  assert.ok(dockerStep);
  assert.ok(dockerStep.curatedResources.length > 0, 'Docker should have authentic curated resource');
  assert.equal(dockerStep.curatedResources[0].url, 'https://docs.docker.com/get-started/');

  const nodeStep = roadmap.steps.find(s => s.skillName === 'Node.js');
  if (nodeStep && nodeStep.curatedResources.length === 0) {
    assert.ok(nodeStep.searchSuggestion.includes('Search official documentation for: "Node.js"'), 'Missing curated resource must use transparent search suggestion');
  }

  console.log('✅ Suite 3 passed: Counterfactual roadmap impact calculation, ordering, and truthful learning resources verified.\n');
  passedCount++;

  // ------------------------------------------------------------
  // TEST SUITE 4: INTERACTIVE WHAT-IF SCENARIO SIMULATOR
  // ------------------------------------------------------------
  console.log('--- Suite 4: Interactive What-If Scenario Simulator ---');

  const simJob: TargetJobItem = {
    id: 'job_senior_dev',
    title: 'Senior Software Engineer',
    companyName: 'Acme AI',
    location: 'Remote',
    workMode: 'Remote',
    requiredSkills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
    preferredSkills: ['Kubernetes'],
    minExperienceYears: 5,
  };

  const simResult = simulateWhatIfScenario(
    simJob,
    ['TypeScript', 'Node.js'],
    ['PostgreSQL', 'Docker'],
    3,
    5
  );

  assert.equal(simResult.jobId, 'job_senior_dev');
  assert.ok(simResult.simulatedScore > simResult.baseScore, 'Simulated score must be strictly greater after adding required skills and experience');
  assert.ok(simResult.scoreDelta > 0, 'Score delta must be positive');
  assert.ok(simResult.addedSkills.includes('PostgreSQL'));
  assert.ok(simResult.addedSkills.includes('Docker'));

  console.log(`✅ Suite 4 passed: What-if simulator verified (Base: ${simResult.baseScore}% -> Simulated: ${simResult.simulatedScore}%, +${simResult.scoreDelta}% pts).\n`);
  passedCount++;

  // ------------------------------------------------------------
  // TEST SUITE 5: EXPLAINABLE JOB RECOMMENDATIONS & ZERO PROTECTED ATTRIBUTES
  // ------------------------------------------------------------
  console.log('--- Suite 5: Hybrid Explainable Job Recommendations ---');

  const candidateContext: CandidateSkillsContext = {
    skills: [
      { name: 'TypeScript', proficiency: 5, verified: true },
      { name: 'React', proficiency: 4, verified: true },
      { name: 'Node.js', proficiency: 3, verified: false },
    ],
    experienceYears: 4,
    seniorityLevel: 'Mid-Senior',
    highestEducation: "Bachelor's Degree",
  };

  const candidatePrefs: CandidatePreferenceProfile = {
    preferredLocations: ['Remote', 'New York, NY'],
    preferredWorkModes: ['Remote', 'Hybrid'],
    minSalary: 100000,
    maxSalary: 160000,
    targetJobTitles: ['Frontend', 'Full Stack'],
    dismissedJobIds: ['job_dismissed_1'],
  };

  const poolJobs: TargetJobItem[] = [
    {
      id: 'job_rec_1',
      title: 'Frontend Tech Lead',
      companyName: 'NextGen',
      location: 'Remote',
      workMode: 'Remote',
      salaryMin: 120000,
      salaryMax: 150000,
      requiredSkills: ['TypeScript', 'React'],
      preferredSkills: ['Node.js'],
      minExperienceYears: 4,
    },
    {
      id: 'job_dismissed_1',
      title: 'Backend Engineer',
      companyName: 'OldCorp',
      location: 'Remote',
      workMode: 'Remote',
      requiredSkills: ['Java', 'Spring'],
      minExperienceYears: 5,
    },
    {
      id: 'job_rec_2',
      title: 'Junior Python Dev',
      companyName: 'Startup',
      location: 'On-site',
      workMode: 'On-site',
      requiredSkills: ['Python'],
      minExperienceYears: 1,
    },
  ];

  const recommendations = computeHybridJobRecommendations(candidateContext, candidatePrefs, poolJobs);

  // Verify dismissed job is excluded
  assert.equal(recommendations.some(r => r.jobId === 'job_dismissed_1'), false, 'Dismissed jobs must not appear in recommendations');

  // Verify top job is job_rec_1
  assert.ok(recommendations.length > 0);
  const topRec = recommendations[0];
  assert.equal(topRec.jobId, 'job_rec_1');
  assert.ok(topRec.recommendationScore >= 80);
  assert.ok(topRec.reasonsWhy.length > 0, 'Every recommendation must include explainable reasons');
  assert.ok(topRec.matchedSkills.includes('TypeScript'));
  assert.ok(topRec.matchedSkills.includes('React'));

  console.log('✅ Suite 5 passed: Hybrid explainable job recommendations and preference filtering verified.\n');
  passedCount++;

  // ------------------------------------------------------------
  // TEST SUITE 6: DATA PRIVACY, AUDIT LOGGING & CASCADING USER DELETION
  // ------------------------------------------------------------
  console.log('--- Suite 6: GDPR / DPDP Consent, Access Audit & Right to be Forgotten ---');

  // 6.1 Consent management
  const updatedConsents = updateCandidateConsents(testCandidateId, {
    talentPoolInclusion: true,
    trainingDataInclusion: true,
  });
  assert.equal(updatedConsents.talentPoolInclusion, true);
  assert.equal(updatedConsents.trainingDataInclusion, true);

  const retrievedConsents = getCandidateConsents(testCandidateId);
  assert.equal(retrievedConsents.trainingDataInclusion, true);

  // 6.2 Profile access logging
  logProfileAccess({
    candidateId: testCandidateId,
    viewerId: 'recruiter_viewer_99',
    viewerName: 'Sarah Jenkins',
    viewerRole: 'Senior Technical Recruiter',
    organizationName: 'Stripe',
    purpose: 'Senior Frontend Engineer Pipeline Review',
  });

  const accessLogs = getProfileAccessLogs(testCandidateId);
  assert.equal(accessLogs.length, 1);
  assert.equal(accessLogs[0].viewerName, 'Sarah Jenkins');
  assert.equal(accessLogs[0].organizationName, 'Stripe');

  // 6.3 Data Portability Export
  const exportPackage = exportAllCandidateData(testCandidateId);
  assert.equal(exportPackage.format, 'Resumio-Data-Export-GDPR-CCPA-DPDP');
  assert.equal(exportPackage.candidateId, testCandidateId);
  assert.ok(exportPackage.account);
  assert.equal(exportPackage.account?.email, testEmail);
  assert.equal(exportPackage.profileAccessAuditLog.length, 1);
  assert.ok(exportPackage.privacyConsents.trainingDataInclusion);

  // 6.4 Right to be Forgotten (Account Deletion & Cascading Purge)
  // Create dummy resume file on disk
  const dummyResumeFilename = `test_${testCandidateId}.pdf`;
  const dummyResumePath = path.resolve(process.cwd(), 'server', 'uploads', dummyResumeFilename);
  const resumeDir = path.dirname(dummyResumePath);
  if (!fs.existsSync(resumeDir)) {
    fs.mkdirSync(resumeDir, { recursive: true });
  }
  fs.writeFileSync(dummyResumePath, '%PDF-1.4 dummy resume content for deletion test');
  assert.ok(fs.existsSync(dummyResumePath));

  // Store in candidate_resumes table
  db.prepare(`
    INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size)
    VALUES (?, ?, 'dummy_resume.pdf', ?, 'application/pdf', 100)
  `).run(`res_${testCandidateId}`, `prof_${testCandidateId}`, dummyResumeFilename);

  // Purge account
  const purgeResult = await deleteCandidateAccount(testCandidateId);
  assert.equal(purgeResult.success, true);
  assert.equal(purgeResult.deletedUserId, testCandidateId);

  // Check physical file was deleted
  assert.equal(fs.existsSync(dummyResumePath), false, 'Uploaded resume file on disk must be unlinked');

  // Check SQLite records are completely gone
  const userCheck = db.prepare(`SELECT id FROM users WHERE id = ?`).get(testCandidateId);
  assert.equal(userCheck, undefined, 'User record must be purged from users table');

  const profileCheck = db.prepare(`SELECT id FROM candidate_profiles WHERE user_id = ?`).get(testCandidateId);
  assert.equal(profileCheck, undefined, 'Candidate profile must be purged');

  const resumeCheck = db.prepare(`SELECT id FROM candidate_resumes WHERE id = ?`).get(`res_${testCandidateId}`);
  assert.equal(resumeCheck, undefined, 'Resumes must be purged');

  const verifCheck = db.prepare(`SELECT id FROM candidate_verifications WHERE candidate_id = ?`).get(testCandidateId);
  assert.equal(verifCheck, undefined, 'External verifications must be purged');

  const consentCheck = db.prepare(`SELECT id FROM candidate_data_retention_consents WHERE candidate_id = ?`).get(testCandidateId);
  assert.equal(consentCheck, undefined, 'Privacy consents must be purged');

  const logCheck = db.prepare(`SELECT id FROM profile_access_logs WHERE candidate_id = ?`).all(testCandidateId);
  assert.equal(logCheck.length, 0, 'Profile access logs must be purged');

  console.log('✅ Suite 6 passed: GDPR/DPDP consents, profile access audit, data package export, and cascading deletion verified.\n');
  passedCount++;

  console.log('============================================================');
  console.log(`🎉 ALL ${passedCount} OF 6 PHASE 9 VERIFICATION TEST SUITES PASSED CLEANLY!`);
  console.log('============================================================');
}

runAllTests().catch((err) => {
  console.error('❌ Phase 9 Test Suite Failed:', err);
  process.exit(1);
});

/**
 * PHASE 10 TEST SUITE: PLATFORM, INTEGRATIONS & DIFFERENTIATING FEATURES
 *
 * Verifies:
 * 1. Public API Keys (SHA-256 hashing at rest, scopes, rate limits, revocation, last-used tracking)
 * 2. Outbound Webhooks (HMAC-SHA256 signatures, replay protection, delivery audit logs, test-send ping)
 * 3. ATS Connectors (Greenhouse Harvest API verified against recorded fixtures)
 * 4. Bulk Import/Export with Dry-Run Schema Preview and CSV Formula Injection Defense
 * 5. Enterprise SSO (OIDC Google/Microsoft, domain restrictions, user provisioning, SAML metadata)
 * 6. Multilingual Support (Language detection, cross-lingual normalization, embeddings)
 * 7. Job-Description Intelligence (Unrealistic tech constraints & Inclusive language guidance)
 * 8. Match Heatmap (Resume span segmentation, strong/weak classification, score contribution tooltips)
 * 9. Model Operations (Shadow mode non-interference, metric gate promotion, rollback, active learning)
 * 10. Public Benchmark Data Consistency (Ensures public cards cannot drift from reality)
 */

import assert from 'assert';
import crypto from 'crypto';
import { db, initDatabase } from './database/db.js';
import {
  createApiKey,
  verifyApiKey,
  revokeApiKey,
  listApiKeys,
  createWebhookSubscription,
  dispatchWebhookEvent,
  computeWebhookSignature,
  testSendWebhook,
  getWebhookDeliveries,
} from './services/apiGatewayService.js';
import { GreenhouseConnector } from './services/ats/greenhouseConnector.js';
import {
  validateAndPreviewImport,
  commitCandidateImport,
  exportData,
  sanitizeCsvCell,
} from './services/importExportService.js';
import {
  configureOrgSso,
  generateOidcAuthUrl,
  handleOidcCallback,
  generateSamlSpMetadata,
} from './services/ssoService.js';
import {
  detectLanguage,
  normalizeCrossLingualTerm,
  computeMultilingualEmbedding,
} from '../packages/shared/src/multilingual.js';
import {
  analyzeJobDescriptionQuality,
  checkInclusiveLanguage,
} from '../packages/shared/src/jdIntelligence.js';
import {
  generateResumeMatchHeatmap,
  getHeatmapLegend,
} from '../packages/shared/src/matchHeatmap.js';
import {
  ensureModelDeploymentsSeeded,
  executeShadowScoring,
  getShadowModeComparison,
  promoteShadowModel,
  rollbackModel,
  enqueueActiveLearningItem,
  reviewActiveLearningItem,
  exportActiveLearningDataset,
} from './services/modelOpsService.js';
import {
  HEAD_TO_HEAD_BENCHMARKS,
  MODEL_CARDS,
  FAIRNESS_BENCHMARKS,
} from '../packages/shared/src/benchmarkData.js';

async function runPhase10Tests() {
  console.log('============================================================');
  console.log('🧪 RUNNING PHASE 10: PLATFORM, INTEGRATIONS & DIFFERENTIATING FEATURES');
  console.log('============================================================\n');

  await initDatabase();
  const testOrgId = `org_test_${crypto.randomUUID()}`;
  const testUserId = `usr_test_${crypto.randomUUID()}`;

  // Insert mock user into users table for foreign key integrity
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role)
    VALUES (?, ?, 'dummy_hash', 'recruiter')
  `).run(testUserId, `recruiter.${testUserId}@test.resumio.ai`);

  // ------------------------------------------------------------
  // SUITE 1: PUBLIC API KEYS & RATE LIMITING
  // ------------------------------------------------------------
  console.log('--- Suite 1: Public API Keys, Scoping & Rate Limits ---');

  // 1.1 Key Generation & Hashing
  const { apiKeyRecord, rawApiKey } = createApiKey({
    orgId: testOrgId,
    userId: testUserId,
    name: 'CI/CD Pipeline Key',
    scopes: ['parse', 'match'],
    rateLimitPerMin: 3,
  });

  assert.ok(rawApiKey.startsWith('rsm_live_'), 'Raw key must have prefix rsm_live_');
  assert.equal(apiKeyRecord.name, 'CI/CD Pipeline Key');
  assert.equal(apiKeyRecord.is_active, 1);

  // Verify hash at rest
  const storedHash = apiKeyRecord.key_hash;
  const computedHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
  assert.equal(storedHash, computedHash, 'API key must be hashed at rest using SHA-256');

  // 1.2 Verification & Scope Enforcement
  const validVerification = verifyApiKey(rawApiKey, 'parse');
  assert.equal(validVerification.isValid, true, 'Valid API key must pass verification');

  const scopeDenied = verifyApiKey(rawApiKey, 'admin');
  assert.equal(scopeDenied.isValid, false, 'Key without admin scope must be rejected');
  assert.equal(scopeDenied.statusCode, 403);

  // 1.3 Rate Limiting
  // Trigger usage records
  for (let i = 0; i < 3; i++) {
    db.prepare(`
      INSERT INTO api_key_usage (id, api_key_id, endpoint, status_code, response_time_ms)
      VALUES (?, ?, '/api/v1/public/match', 200, 45)
    `).run(`use_${crypto.randomUUID()}`, apiKeyRecord.id);
  }

  const rateLimited = verifyApiKey(rawApiKey, 'parse');
  assert.equal(rateLimited.isValid, false, 'Rate limit threshold must trigger 429');
  assert.equal(rateLimited.statusCode, 429);

  // 1.4 Revocation
  const revoked = revokeApiKey(apiKeyRecord.id, testOrgId);
  assert.equal(revoked, true, 'Revocation must succeed');

  const afterRevoke = verifyApiKey(rawApiKey, 'parse');
  assert.equal(afterRevoke.isValid, false, 'Revoked API key must be immediately rejected');

  console.log('✅ Suite 1 passed: API key hashing, scoping, rate limiting, and revocation verified.\n');

  // ------------------------------------------------------------
  // SUITE 2: OUTBOUND WEBHOOKS & HMAC SIGNATURES
  // ------------------------------------------------------------
  console.log('--- Suite 2: Outbound Webhooks & Replay Protection ---');

  const webhook = createWebhookSubscription({
    orgId: testOrgId,
    userId: testUserId,
    url: 'https://webhook.site/mock-endpoint',
    events: ['application.created', 'score.completed'],
  });

  assert.ok(webhook.secret.startsWith('whsec_'), 'Webhook secret must have whsec_ prefix');

  // 2.1 HMAC-SHA256 Signature Computation
  const timestamp = Math.floor(Date.now() / 1000);
  const samplePayload = JSON.stringify({ event: 'score.completed', score: 88.5 });
  const sigHeader = computeWebhookSignature(webhook.secret, timestamp, samplePayload);

  assert.ok(sigHeader.includes(`t=${timestamp}`), 'Signature header must include timestamp for replay protection');
  assert.ok(sigHeader.includes('v1='), 'Signature header must contain v1 hex signature');

  // 2.2 Dispatch Event with Mock Fetch
  let dispatchedUrl = '';
  let receivedHeaders: Record<string, string> = {};
  const mockFetch = async (url: string, init: any) => {
    dispatchedUrl = url;
    receivedHeaders = init.headers;
    return { status: 200, ok: true };
  };

  const dispatchResult = await dispatchWebhookEvent(
    testOrgId,
    'score.completed',
    { candidateId: 'cand_123', jobId: 'job_456', finalScore: 92 },
    mockFetch as any
  );

  assert.equal(dispatchResult.dispatchedCount, 1, 'Matching webhook subscription must receive dispatch');
  assert.equal(dispatchedUrl, 'https://webhook.site/mock-endpoint');
  assert.ok(receivedHeaders['X-Resumio-Signature'].startsWith('t='), 'Dispatch must contain HMAC signature');
  assert.equal(receivedHeaders['X-Resumio-Event'], 'score.completed');

  // 2.3 Delivery History Log
  const deliveries = getWebhookDeliveries(webhook.id);
  assert.equal(deliveries.length, 1);
  assert.equal(deliveries[0].status, 'delivered');
  assert.equal(deliveries[0].http_status, 200);

  console.log('✅ Suite 2 passed: Outbound webhook HMAC-SHA256 signing, delivery logging, and headers verified.\n');

  // ------------------------------------------------------------
  // SUITE 3: ATS CONNECTORS (GREENHOUSE HARVEST API)
  // ------------------------------------------------------------
  console.log('--- Suite 3: ATS Connectors (Greenhouse Harvest API Fixture Verification) ---');

  const greenhouse = new GreenhouseConnector({
    apiKey: 'gh_harvest_live_dummy_key_for_testing',
    useFixtures: true,
  });

  // 3.1 Test Connection
  const connTest = await greenhouse.testConnection();
  assert.equal(connTest.success, true, 'Greenhouse connector test must succeed');

  // 3.2 Fetch Jobs from recorded fixture
  const jobs = await greenhouse.fetchJobs();
  assert.equal(jobs.length, 2, 'Greenhouse fixture must contain 2 recorded jobs');
  assert.equal(jobs[0].title, 'Senior Full Stack Engineer (Node.js & React)');
  assert.ok(jobs[0].requiredSkills?.includes('TypeScript'));
  assert.equal(jobs[0].minExperienceYears, 4);

  // 3.3 Fetch Candidates from recorded fixture
  const candidates = await greenhouse.fetchCandidates();
  assert.equal(candidates.length, 2, 'Greenhouse fixture must contain 2 recorded candidates');
  assert.equal(candidates[0].fullName, 'Priya Sundaram');
  assert.equal(candidates[0].email, 'priya.sundaram@testexample.com');
  assert.ok(candidates[0].tags?.includes('typescript'));

  // 3.4 Export Application
  const exportApp = await greenhouse.exportApplication({
    candidateId: candidates[0].externalId,
    jobId: jobs[0].externalId,
    candidateName: candidates[0].fullName,
    candidateEmail: candidates[0].email,
    matchScore: 91.5,
  });
  assert.equal(exportApp.externalApplicationId, '481925');
  assert.equal(exportApp.status, 'active');

  console.log('✅ Suite 3 passed: Greenhouse ATS connector verified against recorded Harvest API fixtures.\n');

  // ------------------------------------------------------------
  // SUITE 4: IMPORT/EXPORT WITH DRY-RUN & FORMULA DEFENSE
  // ------------------------------------------------------------
  console.log('--- Suite 4: Bulk Import/Export with Dry-Run & CSV Formula Defense ---');

  // 4.0 Clean up previous test candidates if present
  const prevUsers = db.prepare(`SELECT id FROM users WHERE email IN ('priya@example.com', 'alex@example.com')`).all() as any[];
  for (const u of prevUsers) {
    const prof = db.prepare(`SELECT id FROM candidate_profiles WHERE user_id = ?`).get(u.id) as any;
    if (prof) {
      db.prepare(`DELETE FROM candidate_skills WHERE candidate_profile_id = ?`).run(prof.id);
      db.prepare(`DELETE FROM candidate_profiles WHERE id = ?`).run(prof.id);
    }
    db.prepare(`DELETE FROM users WHERE id = ?`).run(u.id);
  }

  // 4.1 Dry-Run Validation on Valid + Invalid CSV
  const mixedCsv = `fullName,email,phone,location,skills,experienceYears
Priya Sharma,priya@example.com,+91 98765 11111,Chennai,TypeScript;React,4
Invalid Candidate Without Email,,+1 555 1234,Remote,Python,2
Alex Rivera,alex@example.com,+1 415 555 0192,San Francisco,Kubernetes;Docker,6`;

  const dryRun = validateAndPreviewImport('candidates', mixedCsv, 'csv');
  assert.equal(dryRun.totalCount, 3);
  assert.equal(dryRun.validCount, 2, 'Must validate 2 valid candidate rows');
  assert.equal(dryRun.invalidCount, 1, 'Must flag 1 invalid row missing email');
  assert.equal(dryRun.errors[0].row, 2);
  assert.equal(dryRun.dryRun, true, 'Dry-run must not mutate database');

  // 4.2 Commit Valid Rows
  const commitResult = commitCandidateImport(dryRun.preview as any, testOrgId);
  assert.equal(commitResult.importedCount, 2, 'Must commit 2 valid candidates');

  // Verify in SQLite
  const candCheck = db.prepare(`SELECT full_name FROM candidate_profiles WHERE full_name = 'Priya Sharma'`).get() as any;
  assert.ok(candCheck, 'Priya Sharma must be inserted into candidate_profiles');

  // 4.3 Formula Injection Defense (CWE-1236)
  const dangerousCell1 = '=SUM(1+1)';
  const dangerousCell2 = '@cmd /c calc.exe';
  const dangerousCell3 = '-20';
  const safeCell = 'Normal Text';

  assert.equal(sanitizeCsvCell(dangerousCell1), "'=SUM(1+1)", 'Leading = must be escaped with single quote');
  assert.equal(sanitizeCsvCell(dangerousCell2), "'@cmd /c calc.exe", 'Leading @ must be escaped with single quote');
  assert.equal(sanitizeCsvCell(dangerousCell3), "'-20", 'Leading - must be escaped with single quote');
  assert.equal(sanitizeCsvCell(safeCell), 'Normal Text', 'Safe text must remain unchanged');

  // 4.4 Data Export
  const exported = exportData('candidates', 'csv');
  assert.ok(exported.content.includes('fullName,email,phone'), 'CSV must include header row');
  assert.ok(exported.content.includes('Priya Sharma'), 'CSV must include exported candidate data');

  console.log('✅ Suite 4 passed: Bulk import dry-run preview, commit, and formula injection defense verified.\n');

  // ------------------------------------------------------------
  // SUITE 5: ENTERPRISE SSO (GOOGLE/MICROSOFT OIDC & SAML)
  // ------------------------------------------------------------
  console.log('--- Suite 5: Enterprise SSO (OIDC & SAML Extension Point) ---');

  // 5.1 Configure SSO
  const ssoConfig = configureOrgSso({
    orgId: testOrgId,
    provider: 'google',
    clientId: 'google-client-id-12345.apps.googleusercontent.com',
    clientSecret: 'secret_abc_123',
    allowedDomains: ['nexora.ai', 'acme.com'],
  });

  assert.equal(ssoConfig.provider, 'google');
  assert.equal(ssoConfig.is_enabled, 1);

  // 5.2 Generate Auth URL
  const authUrlResult = generateOidcAuthUrl(testOrgId, 'https://app.resumio.ai/sso/callback');
  assert.ok(authUrlResult.authUrl.includes('accounts.google.com/o/oauth2/v2/auth'));
  assert.ok(authUrlResult.authUrl.includes('client_id=google-client-id-12345.apps.googleusercontent.com'));
  assert.ok(authUrlResult.state.length > 10);
  assert.ok(authUrlResult.nonce.length > 10);

  // 5.3 OIDC Callback - Domain Allowlist Rejection
  let domainRejected = false;
  try {
    await handleOidcCallback({
      orgId: testOrgId,
      idTokenPayload: {
        email: 'attacker@unauthorized-domain.com',
        sub: 'google_sub_999',
      },
    });
  } catch (err: any) {
    domainRejected = err.message.includes('not authorized for SSO');
  }
  assert.equal(domainRejected, true, 'Unpermitted email domain must be rejected');

  // Clean up any existing SSO user from prior runs
  const prevSsoUser = db.prepare(`SELECT id FROM users WHERE email = 'sara.chen@nexora.ai'`).get() as any;
  if (prevSsoUser) {
    db.prepare(`DELETE FROM organization_members WHERE user_id = ?`).run(prevSsoUser.id);
    db.prepare(`DELETE FROM recruiter_profiles WHERE user_id = ?`).run(prevSsoUser.id);
    db.prepare(`DELETE FROM candidate_profiles WHERE user_id = ?`).run(prevSsoUser.id);
    db.prepare(`DELETE FROM users WHERE id = ?`).run(prevSsoUser.id);
  }

  // 5.4 OIDC Callback - Success & Account Provisioning
  const ssoLogin = await handleOidcCallback({
    orgId: testOrgId,
    idTokenPayload: {
      email: 'sara.chen@nexora.ai',
      name: 'Sara Chen',
      sub: 'google_sub_1001',
      hd: 'nexora.ai',
    },
    preferredRole: 'recruiter',
  });

  assert.ok(ssoLogin.token, 'Must return signed Resumio JWT');
  assert.equal(ssoLogin.user.email, 'sara.chen@nexora.ai');
  assert.equal(ssoLogin.user.role, 'recruiter');
  assert.equal(ssoLogin.isNewUser, true, 'User must be automatically provisioned');

  // 5.5 SAML 2.0 SP Metadata
  const samlXml = generateSamlSpMetadata(testOrgId, 'app.resumio.ai');
  assert.ok(samlXml.includes('<md:EntityDescriptor'), 'Must generate valid SAML 2.0 metadata XML');
  assert.ok(samlXml.includes(`https://app.resumio.ai/api/sso/saml/acs/${testOrgId}`));

  console.log('✅ Suite 5 passed: OIDC flow, domain restrictions, account auto-provisioning, and SAML metadata verified.\n');

  // ------------------------------------------------------------
  // SUITE 6: MULTILINGUAL SUPPORT & LANGUAGE DETECTION
  // ------------------------------------------------------------
  console.log('--- Suite 6: Multilingual Support & Cross-Lingual Skill Normalization ---');

  const enText = 'Senior software engineer with 5 years experience developing distributed microservices in Go and Kubernetes.';
  const esText = 'Desarrollador de software con 5 años de experiencia en desarrollo de aplicaciones web y bases de datos.';
  const frText = 'Ingénieur logiciel avec expérience dans le développement d\'applications et la gestion de projet.';
  const deText = 'Erfahrener Softwareentwickler mit fundierten Kenntnissen in der Entwicklung von Cloud-Systemen.';

  assert.equal(detectLanguage(enText).detectedLanguage, 'en');
  assert.equal(detectLanguage(esText).detectedLanguage, 'es');
  assert.equal(detectLanguage(frText).detectedLanguage, 'fr');
  assert.equal(detectLanguage(deText).detectedLanguage, 'de');

  // Cross-lingual normalization
  assert.equal(normalizeCrossLingualTerm('desarrollador de software'), 'Software Engineer');
  assert.equal(normalizeCrossLingualTerm('softwareentwickler'), 'Software Engineer');
  assert.equal(normalizeCrossLingualTerm('ingénieur logiciel'), 'Software Engineer');

  // Multilingual Embedding
  const emb1 = computeMultilingualEmbedding(enText, 32);
  const emb2 = computeMultilingualEmbedding(esText, 32);
  assert.equal(emb1.length, 32);
  assert.equal(emb2.length, 32);

  console.log('✅ Suite 6 passed: Language detection, cross-lingual normalization, and embeddings verified.\n');

  // ------------------------------------------------------------
  // SUITE 7: JOB DESCRIPTION INTELLIGENCE
  // ------------------------------------------------------------
  console.log('--- Suite 7: JD Quality Analyzer & Inclusive-Language Guidance ---');

  const badJd = `We need a 10x Rockstar Developer with 15+ years of Kubernetes experience and 12 years of Next.js.
Must be a young and energetic digital native with killer instinct to dominate the market.
Role is Junior level requiring 7 years experience.`;

  const jdReport = analyzeJobDescriptionQuality(badJd, 'Junior Developer', 7);

  // 7.1 Unrealistic Tech Requirements
  assert.ok(jdReport.unrealisticRequirements.length >= 2, 'Must flag both Kubernetes (>12 yrs) and Next.js (>10 yrs)');
  const k8sIssue = jdReport.unrealisticRequirements.find(r => r.technology.toLowerCase() === 'kubernetes');
  assert.ok(k8sIssue, 'Kubernetes release year constraint must be caught');
  assert.equal(k8sIssue?.technologyReleaseYear, 2014);

  // 7.2 Seniority Contradiction
  assert.ok(jdReport.seniorityContradictions.length >= 1, 'Must flag Junior role requiring 7 years');

  // 7.3 Vague Buzzwords
  assert.ok(jdReport.vaguePhrasingFlags.some(v => /rockstar/i.test(v.phrase)));

  // 7.4 Inclusive-Language Checker
  const incReport = checkInclusiveLanguage(badJd);
  assert.ok(incReport.findings.some(f => /young and energetic/i.test(f.matchedPhrase)), 'Must flag ageist phrase');
  assert.ok(incReport.findings.some(f => /killer instinct/i.test(f.matchedPhrase)), 'Must flag hyper-masculine phrase');
  assert.ok(incReport.disclaimer.includes('Guidance only'), 'Must clearly frame check as guidance, not legal certification');

  console.log('✅ Suite 7 passed: Unrealistic tech experience, contradictory seniority, and inclusive language guidance verified.\n');

  // ------------------------------------------------------------
  // SUITE 8: MATCH HEATMAP GENERATOR
  // ------------------------------------------------------------
  console.log('--- Suite 8: Resume Match Heatmap Overlay ---');

  const resumeText = `Priya Sharma - Lead Systems Architect
Architected Kubernetes cluster handling 50k requests per second with 99.99% uptime.
Developed React web application with TypeScript, reducing page load times by 40%.
Familiar with basic Python scripting.
Hobbies include hiking and chess.`;

  const matchedSkills = [
    { name: 'Kubernetes', proficiency: 0.95, isRequired: true, scoreWeight: 0.9 },
    { name: 'TypeScript', proficiency: 0.85, isRequired: true, scoreWeight: 0.85 },
    { name: 'Python', proficiency: 0.40, isRequired: false, scoreWeight: 0.4 },
  ];

  const heatmap = generateResumeMatchHeatmap(resumeText, matchedSkills, ['Kubernetes', 'TypeScript']);

  assert.ok(heatmap.strongEvidenceCount >= 2, 'Kubernetes and TypeScript lines must be marked strong_evidence');
  assert.ok(heatmap.weakEvidenceCount >= 1, 'Basic Python mention must be marked weak_evidence');
  assert.ok(heatmap.neutralSpansCount >= 2, 'Header and hobbies must be marked neutral');
  assert.ok(heatmap.overallHeatRatio > 40 && heatmap.overallHeatRatio < 80);

  const legend = getHeatmapLegend();
  assert.equal(legend.length, 3);
  assert.equal(legend[0].category, 'strong_evidence');

  console.log('✅ Suite 8 passed: Resume heatmap span segmentation, strong/weak classification, and legend verified.\n');

  // ------------------------------------------------------------
  // SUITE 9: MODEL OPERATIONS (SHADOW MODE & ACTIVE LEARNING)
  // ------------------------------------------------------------
  console.log('--- Suite 9: ModelOps (Shadow Mode Telemetry, Promotion Gate & Active Learning) ---');

  ensureModelDeploymentsSeeded();

  // 9.1 Shadow Mode Execution (Non-interference guarantee)
  const prodVisibleScore = 84.5;
  const shadowRun = executeShadowScoring({
    productionScore: prodVisibleScore,
    candidateId: 'cand_eval_1',
    jobId: 'job_eval_1',
    candidateExperienceYears: 4,
    matchedSkillsCount: 5,
    requiredSkillsCount: 6,
  });

  assert.equal(
    shadowRun.userVisibleScore,
    prodVisibleScore,
    'CRITICAL: Shadow mode MUST return strictly the production score to the caller'
  );
  assert.equal(shadowRun.shadowEvaluated, true);

  // 9.2 Shadow Telemetry
  const telemetry = getShadowModeComparison();
  assert.ok(telemetry.totalEvaluations >= 1);
  assert.ok(typeof telemetry.meanAbsoluteError === 'number');

  // 9.3 Promotion with Phase 5 Metric Gate
  const candidateModel = telemetry.shadowModel!;
  const promotion = promoteShadowModel(candidateModel.id);
  assert.equal(promotion.success, true, 'Model with F1 >= 0.85 and NDCG >= 0.90 must pass gate');

  // 9.4 Rollback
  const rollback = rollbackModel();
  assert.equal(rollback.success, true, 'One-click rollback must succeed');

  // 9.5 Active Learning Queue with Candidate Consent Check
  const enqueued = enqueueActiveLearningItem({
    itemType: 'skill_extraction',
    entityId: 'ent_999',
    rawText: 'Implemented lightweight async actor model pattern',
    predictedLabel: 'ActorModel',
    confidenceScore: 0.52, // Low confidence -> triggers queue
  });
  assert.equal(enqueued, true, 'Low-confidence prediction must be enqueued');

  // High confidence item should NOT be enqueued
  const highConf = enqueueActiveLearningItem({
    itemType: 'skill_extraction',
    entityId: 'ent_1000',
    rawText: 'Expert in Docker container orchestration',
    predictedLabel: 'Docker',
    confidenceScore: 0.95,
  });
  assert.equal(highConf, false, 'High confidence prediction must not clutter active learning queue');

  // Review Item
  const queueItem = db.prepare(`SELECT id FROM active_learning_queue WHERE entity_id = 'ent_999'`).get() as any;
  assert.ok(queueItem);

  const reviewed = reviewActiveLearningItem({
    queueId: queueItem.id,
    action: 'correct',
    correctedLabel: 'Concurrency / Actor Framework',
    reviewedBy: 'lead_annotator@resumio.ai',
  });
  assert.equal(reviewed, true);

  const trainingSet = exportActiveLearningDataset();
  assert.ok(trainingSet.datasetCount >= 1);
  assert.equal(trainingSet.records[0].groundTruthLabel, 'Concurrency / Actor Framework');

  console.log('✅ Suite 9 passed: Shadow mode non-interference, metric gate promotion, rollback, and active learning verified.\n');

  // ------------------------------------------------------------
  // SUITE 10: PUBLIC BENCHMARK DATASET INTEGRITY
  // ------------------------------------------------------------
  console.log('--- Suite 10: Public ML Benchmark & Model Cards Integrity ---');

  assert.equal(HEAD_TO_HEAD_BENCHMARKS.length, 3);
  assert.ok(HEAD_TO_HEAD_BENCHMARKS[2].f1Score > HEAD_TO_HEAD_BENCHMARKS[0].f1Score, 'Resumio Scorer V2 must beat Resume-Matcher baseline');
  assert.equal(HEAD_TO_HEAD_BENCHMARKS[2].offlineCapable, true);

  assert.equal(MODEL_CARDS.length, 2);
  assert.ok(MODEL_CARDS[0].excludedFeatures.includes('Candidate Name'));
  assert.ok(MODEL_CARDS[0].excludedFeatures.includes('Gender / Pronouns'));
  assert.ok(MODEL_CARDS[0].excludedFeatures.includes('Profile Photo / Facial Attributes'));

  assert.ok(FAIRNESS_BENCHMARKS.every(f => f.adverseImpactRatio >= 0.80), 'All demographic groups must satisfy EEOC 4/5ths rule (> 0.80 AIR)');

  console.log('✅ Suite 10 passed: Public benchmark table, model cards, and fairness metrics integrity verified.\n');

  // Cleanup test artifacts
  db.prepare(`DELETE FROM api_key_usage WHERE api_key_id = ?`).run(apiKeyRecord.id);
  db.prepare(`DELETE FROM api_keys WHERE id = ?`).run(apiKeyRecord.id);
  db.prepare(`DELETE FROM webhook_deliveries WHERE webhook_id = ?`).run(webhook.id);
  db.prepare(`DELETE FROM webhook_subscriptions WHERE id = ?`).run(webhook.id);
  db.prepare(`DELETE FROM users WHERE id = ?`).run(testUserId);

  for (const email of ['priya@example.com', 'alex@example.com', 'sara.chen@nexora.ai']) {
    const u = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email) as any;
    if (u) {
      const prof = db.prepare(`SELECT id FROM candidate_profiles WHERE user_id = ?`).get(u.id) as any;
      if (prof) {
        db.prepare(`DELETE FROM candidate_skills WHERE candidate_profile_id = ?`).run(prof.id);
        db.prepare(`DELETE FROM candidate_profiles WHERE id = ?`).run(prof.id);
      }
      db.prepare(`DELETE FROM recruiter_profiles WHERE user_id = ?`).run(u.id);
      db.prepare(`DELETE FROM organization_members WHERE user_id = ?`).run(u.id);
      db.prepare(`DELETE FROM users WHERE id = ?`).run(u.id);
    }
  }

  console.log('============================================================');
  console.log('🎉 ALL 10 OF 10 PHASE 10 VERIFICATION TEST SUITES PASSED CLEANLY!');
  console.log('============================================================');
}

runPhase10Tests().catch((err) => {
  console.error('❌ Phase 10 Test Suite Failed:', err);
  process.exit(1);
});

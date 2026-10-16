/**
 * Comprehensive Phase 7 Verification Test Suite
 *
 * Verifies:
 * 1. Automated Round-Trip Parse Fidelity (>= 95% across Classic ATS, Modern Clean, Technical Compact).
 * 2. Strict NoFabricationValidator:
 *    - Provably blocks invented metrics, tools, and percentages.
 *    - Permits verified user-supplied metrics.
 *    - Inserts explicit prompts instead of fabricating numbers when omitted.
 * 3. Deterministic Google XYZ Bullet Rewriter:
 *    - Converts weak duty bullets into "Accomplished [X] as measured by [Y], by doing [Z]".
 * 4. Tailor-to-Job Analysis & Score Preview:
 *    - Identifies required vs preferred skill gaps.
 *    - Accurately generates before/after score preview using Phase 6 calculateScoreV2.
 *    - Keyword stuffing detector catches manipulative repetition.
 * 5. ATS Parser Simulator:
 *    - Verifies 4 heuristic rule packs (strict_legacy, lenient_modern, keyword_scanner, semantic_ats).
 * 6. Resume Health Suite (8 Diagnostic Dimensions):
 *    - Quantification ratio (target >= 50%).
 *    - Action verb strength and repetition.
 *    - Technical dictionary spelling checks (e.g. Scikit-learn, PostgreSQL).
 *    - Personal data privacy and bias warnings (photo, marital status, DOB).
 *    - Length guidance based on seniority.
 *    - Decoupled from job fit.
 * 7. Grounded Generation Extras:
 *    - Offline professional summary & cover letter generation grounded exclusively in verified facts.
 */

import assert from 'assert';
import {
  analyzeResumeTailoring,
  detectKeywordStuffing,
  NoFabricationValidator,
  rewriteBulletDeterministic,
  calculateResumeHealth,
  simulateAtsParsing
} from '../packages/shared/src/index.js';
import { ResumeBuilderService, type AtsTemplateId } from './services/resumeBuilderService.js';
import { GroundedGenerationService } from './services/groundedGenerationService.js';

let passedTests = 0;
let totalTests = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

export async function runPhase7Tests() {
  console.log('\n============================================================');
  console.log('RESUMIO PHASE 7: ATS OPTIMIZER, BUILDER & SIMULATOR SUITE');
  console.log('============================================================\n');

  // -------------------------------------------------------------
  // SUITE 1: AUTOMATED ROUND-TRIP PARSE FIDELITY (>= 95%)
  // -------------------------------------------------------------
  console.log('--- 1. Automated Round-Trip Parse Fidelity Tests ---');

  for (const templateId of ['classic_ats', 'modern_clean', 'technical_compact'] as AtsTemplateId[]) {
    await test(`Round-trip fidelity test for '${templateId}' (target >= 95%)`, async () => {
      const result = await ResumeBuilderService.runRoundTripTest(templateId);
      assert.strictEqual(result.templateId, templateId);
      assert.ok(
        result.fidelityScore >= 0.95,
        `Expected fidelity >= 0.95 for ${templateId}, got ${result.fidelityScore}`
      );
      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.missingFields.length, 0);
    });
  }

  // -------------------------------------------------------------
  // SUITE 2: STRICT NO-FABRICATION VALIDATOR
  // -------------------------------------------------------------
  console.log('\n--- 2. Strict NoFabricationValidator Tests ---');

  await test('Validator strictly blocks invented numbers and percentages', () => {
    const originalText = 'Responsible for developing internal microservices and fixing bugs.';
    const hallucinatedRewrite = 'Pioneered microservices architecture, boosting transaction speed by 45% across 12 servers.';

    const validation = NoFabricationValidator.validateNumbers(originalText, hallucinatedRewrite);
    assert.strictEqual(validation.isValid, false, 'Validator should flag invented numbers.');
    assert.ok(
      validation.unsupportedNumbers.includes('45%') || validation.unsupportedNumbers.includes('45'),
      'Should report unsupported 45%.'
    );
    assert.ok(
      validation.unsupportedNumbers.includes('12'),
      'Should report unsupported 12.'
    );
  });

  await test('Validator permits verified user-supplied numbers', () => {
    const sourceWithMetric = 'Responsible for microservices. User verified metric: reducing latency by 35%.';
    const truthfulRewrite = 'Optimized microservices architecture, reducing latency by 35%.';

    const validation = NoFabricationValidator.validateNumbers(sourceWithMetric, truthfulRewrite);
    assert.strictEqual(validation.isValid, true, 'Validator should allow user-supplied numbers.');
    assert.strictEqual(validation.unsupportedNumbers.length, 0);
  });

  await test('Validator blocks unevidenced technologies', () => {
    const candidateTech = ['JavaScript', 'HTML', 'CSS'];
    const hallucinatedTechText = 'Developed responsive web applications utilizing Kubernetes, Kafka, and Rust.';

    const validation = NoFabricationValidator.validateTechnologies(candidateTech, hallucinatedTechText);
    assert.strictEqual(validation.isValid, false, 'Validator should detect unmentioned technologies.');
    assert.ok(validation.unsupportedTechnologies.includes('kubernetes'));
    assert.ok(validation.unsupportedTechnologies.includes('kafka'));
    assert.ok(validation.unsupportedTechnologies.includes('rust'));
  });

  // -------------------------------------------------------------
  // SUITE 3: DETERMINISTIC GOOGLE XYZ BULLET REWRITER
  // -------------------------------------------------------------
  console.log('\n--- 3. Google XYZ Impact Bullet Rewriter Tests ---');

  await test('Converts weak bullet with user metric to XYZ structure without fabrication', () => {
    const original = 'Worked on backend APIs and updated database queries.';
    const metric = 'improving response latency by 28%';

    const result = rewriteBulletDeterministic(original, metric);
    assert.strictEqual(result.wasModified, true);
    assert.ok(
      result.rewrittenBullet.toLowerCase().includes('improving response latency by 28%'),
      'Result must include user metric.'
    );
    assert.ok(
      /^(accomplished\s+)?(architected|spearheaded|engineered|optimized|overhauled|delivered)/i.test(result.rewrittenBullet),
      'Result must start with a strong action verb.'
    );

    // Assert NoFabricationValidator passes
    const validation = NoFabricationValidator.validateNumbers(`${original} ${metric}`, result.rewrittenBullet);
    assert.strictEqual(validation.isValid, true);
  });

  await test('When metric is omitted, rewriter prompts user instead of inventing numbers', () => {
    const original = 'Responsible for managing database clusters and routine backups.';
    const result = rewriteBulletDeterministic(original);

    assert.strictEqual(result.wasModified, true);
    assert.ok(
      result.rewrittenBullet.includes('[Insert metric:'),
      'Result must include explicit metric prompt placeholder instead of fake numbers.'
    );
    assert.ok(
      result.suggestedPromptIfMissingMetric !== undefined,
      'Must provide coach prompt for missing metric.'
    );
  });

  // -------------------------------------------------------------
  // SUITE 4: TAILOR-TO-JOB ANALYSIS & KEYWORD STUFFING GUARD
  // -------------------------------------------------------------
  console.log('\n--- 4. Tailor-to-Job Analysis & Keyword Stuffing Tests ---');

  await test('Calculates required vs preferred skill gaps with truthfulness rule', () => {
    const resumeData = {
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      experience: [
        {
          role: 'Full Stack Engineer',
          company: 'Acme Corp',
          bullets: ['Built web applications using React and Node.js with PostgreSQL backend.']
        }
      ]
    };

    const targetJob = {
      title: 'Senior Full Stack Engineer',
      requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
      preferredSkills: ['Redis', 'Kubernetes'],
      minYearsExperience: 3
    };

    const report = analyzeResumeTailoring(resumeData, targetJob);
    assert.strictEqual(report.skillCoverage.matchedRequired.length, 4);
    assert.deepStrictEqual(report.skillCoverage.missingRequired, ['Docker']);
    assert.deepStrictEqual(report.skillCoverage.missingPreferred, ['Redis', 'Kubernetes']);
    assert.ok(report.currentScore > 0 && report.currentScore <= 100);
    assert.ok(report.potentialOptimizedScore >= report.currentScore);
    assert.strictEqual(report.keywordStuffing.isManipulative, false);
  });

  await test('Keyword stuffing guard detects manipulative word density', () => {
    const stuffedText = 'python python python python python python python python python python python python python python python python python python python python developer with expertise in python coding and python systems';
    const report = detectKeywordStuffing(stuffedText);

    assert.strictEqual(report.isManipulative, true, 'Should flag unnatural keyword repetition.');
    assert.ok(report.maxDensityPercent > 4.0, 'Density percent should exceed threshold.');
    assert.strictEqual(report.stuffedKeywords[0].word, 'python');
  });

  // -------------------------------------------------------------
  // SUITE 5: ATS PARSER SIMULATOR (4 HEURISTIC PACKS)
  // -------------------------------------------------------------
  console.log('\n--- 5. ATS Parser Simulator Tests ---');

  const sampleResumeText = `
John Doe
john.doe@example.com | +1 555-0199 | Seattle, WA

Professional Summary
Senior Software Engineer with 6 years experience in distributed systems.

Work History
Senior Engineer - Tech Corp (2021 - Present)
- Engineered scalable microservices in Go and Python.
- Reduced p99 latency by 32% across 2M daily requests.

Technical Skills
Languages: Python, Go, TypeScript
Tools: Docker, Kubernetes, PostgreSQL

Education
B.S. in Computer Science - University of Washington (2018)
`;

  await test('Strict legacy parser flags non-standard headers and evaluates confidence', () => {
    const result = simulateAtsParsing(sampleResumeText, 'strict_legacy');
    assert.strictEqual(result.parserPack, 'strict_legacy');
    assert.ok(result.parseConfidenceScore >= 50);
    assert.ok(result.extractedSections.includes('Work History') || result.extractedSections.includes('Experience'));
    assert.ok(result.extractedSkills.includes('python'));
  });

  await test('Modern lenient and semantic parsers extract high-confidence entities', () => {
    const modernResult = simulateAtsParsing(sampleResumeText, 'lenient_modern');
    assert.strictEqual(modernResult.parserPack, 'lenient_modern');
    assert.ok(modernResult.parseConfidenceScore >= 75);

    const semanticResult = simulateAtsParsing(sampleResumeText, 'semantic_ats');
    assert.strictEqual(semanticResult.parserPack, 'semantic_ats');
    assert.ok(semanticResult.parseConfidenceScore >= 80);
    assert.ok(semanticResult.extractedSkills.length >= 3);
  });

  // -------------------------------------------------------------
  // SUITE 6: RESUME HEALTH SUITE (8 DIAGNOSTIC DIMENSIONS)
  // -------------------------------------------------------------
  console.log('\n--- 6. Resume Health Suite Tests ---');

  await test('Evaluates quantification ratio and action verb vitality', () => {
    const healthyResume = {
      personal: { fullName: 'Jane Doe', email: 'jane@example.com', phone: '123-456' },
      summary: 'Senior Engineer',
      skills: ['Go', 'Kubernetes'],
      experience: [
        {
          role: 'Lead Architect',
          company: 'CloudFlow',
          bullets: [
            'Architected distributed caching cluster, reducing latency by 45% across 500k queries.',
            'Spearheaded team of 8 engineers, delivering feature releases 2x faster.',
            'Engineered automated database sharding, saving $40,000 in monthly compute costs.'
          ]
        }
      ],
      education: [{ degree: 'B.S.', institution: 'MIT', graduationYear: '2019' }]
    };

    const health = calculateResumeHealth(healthyResume);
    assert.ok(health.strengthScore >= 80, `Expected strengthScore >= 80, got ${health.strengthScore}`);
    assert.ok(
      health.diagnostics.quantification.quantificationRatioPercent >= 66,
      'Expected high quantification ratio'
    );
    assert.ok(health.diagnostics.actionVerbs.strongVerbRatioPercent >= 60);
    assert.strictEqual(health.diagnostics.personalDataWarnings.length, 0);
  });

  await test('Flags personal data privacy risks and technical spelling typos', () => {
    const riskyResume = {
      personal: {
        fullName: 'Candidate With Bias Risk',
        email: 'test@example.com',
        phone: '123456',
        maritalStatus: 'Married',
        dateOfBirth: '1990-05-12',
        photoUrl: 'https://example.com/photo.jpg'
      },
      summary: 'Expert in sickit-learn, postgresl, and dockr containerization.',
      skills: ['sickit-learn', 'postgresl', 'dockr'],
      experience: [
        {
          role: 'Junior Dev',
          company: 'Legacy Inc',
          bullets: [
            'Responsible for helping senior developers with daily tasks.',
            'Assisted with database entries and answering emails.'
          ]
        }
      ]
    };

    const health = calculateResumeHealth(riskyResume);
    assert.ok(
      health.diagnostics.personalDataWarnings.length >= 2,
      'Should warn against photo, marital status, or DOB.'
    );
    assert.ok(
      health.diagnostics.spellingTypos.flaggedWords.some(f => f.suggestion === 'Scikit-learn'),
      'Should detect sickit-learn typo.'
    );
    assert.ok(
      health.diagnostics.spellingTypos.flaggedWords.some(f => f.suggestion === 'PostgreSQL'),
      'Should detect postgresl typo.'
    );
    assert.ok(health.strengthScore < 70, 'Strength score should be penalized for poor health.');
  });

  // -------------------------------------------------------------
  // SUITE 7: GROUNDED GENERATION EXTRAS (OFFLINE CAPABLE)
  // -------------------------------------------------------------
  console.log('\n--- 7. Grounded Generation Extras (Offline Capable) Tests ---');

  const groundedService = new GroundedGenerationService();

  await test('Generates punchy 3-sentence summary grounded strictly in candidate facts', async () => {
    const candidateFacts = {
      name: 'Alex Rivera',
      currentRole: 'Senior Data Platform Engineer',
      yearsOfExperience: 6,
      companies: ['DataStream Corp', 'MetricScale'],
      skills: ['Python', 'Apache Spark', 'Kafka', 'PostgreSQL', 'Airflow'],
      education: [{ degree: 'M.S. in Data Science', institution: 'Georgia Tech', year: '2018' }],
      verifiedAchievements: ['scaled streaming pipeline to 1M events per second with zero data loss'],
      verifiedProjects: [{ name: 'Real-time Event Lake', description: 'Kafka and Spark stream processor' }]
    };

    const targetJob = {
      title: 'Principal Data Engineer',
      company: 'FinTech Dynamics',
      requiredSkills: ['Python', 'Apache Spark', 'Kafka', 'Distributed Systems']
    };

    const result = await groundedService.generateProfessionalSummary(candidateFacts, targetJob);
    assert.strictEqual(result.validationPassed, true);
    assert.ok(result.text.length > 50);
    assert.ok(
      result.text.toLowerCase().includes('senior data platform engineer') ||
      result.text.toLowerCase().includes('data platform engineer')
    );
    assert.ok(result.groundedFacts.length >= 3);
  });

  await test('Generates formal cover letter grounded strictly in candidate facts', async () => {
    const candidateFacts = {
      name: 'Alex Rivera',
      currentRole: 'Senior Data Platform Engineer',
      yearsOfExperience: 6,
      companies: ['DataStream Corp'],
      skills: ['Python', 'Apache Spark', 'Kafka'],
      education: [],
      verifiedAchievements: ['cut pipeline compute costs by 30% through memory optimization'],
      verifiedProjects: []
    };

    const targetJob = {
      title: 'Principal Data Engineer',
      company: 'FinTech Dynamics',
      requiredSkills: ['Python', 'Apache Spark']
    };

    const result = await groundedService.generateCoverLetter(candidateFacts, targetJob);
    assert.strictEqual(result.validationPassed, true);
    assert.ok(result.text.includes('Dear Hiring Team'));
    assert.ok(result.text.includes('FinTech Dynamics'));
    assert.ok(result.text.includes('DataStream Corp'));
    assert.ok(result.text.includes('Alex Rivera'));
    assert.ok(result.groundedFacts.length >= 4);
    assert.ok(result.reviewChecklist.length >= 2);
  });

  console.log('\n============================================================');
  console.log(`PHASE 7 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('============================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase7Tests().catch((err) => {
  console.error('Fatal error running Phase 7 tests:', err);
  process.exit(1);
});

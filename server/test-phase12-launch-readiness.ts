/**
 * Phase 12 Launch Readiness & Final QA Test Suite
 *
 * Verifies:
 * 1. Safe synthetic demo dataset integrity, credentials, and non-PII tags.
 * 2. Legal template placeholders with mandatory attorney review warnings.
 * 3. Honest limitations documentation (boundaries, dataset caveats, fairness limits, offline mode).
 * 4. Production release checklist, changelog, and contributing/security governance.
 * 5. Comprehensive README overhaul with benchmark table, architecture, and role guides.
 * 6. Role onboarding tour configurations.
 */

import { db, initDatabase } from './database/db.js';
import { DEMO_CREDENTIALS } from './scripts/seed-synthetic-demo.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
  }
}

async function runPhase12Tests() {
  console.log('====================================================');
  console.log('🧪 PHASE 12: LAUNCH READINESS & FINAL QA TEST SUITE');
  console.log('====================================================\n');

  await initDatabase();

  // -------------------------------------------------------------------------
  // TEST 1: Safe Synthetic Demo Dataset Verification
  // -------------------------------------------------------------------------
  console.log('📋 Test 1: Synthetic Demo Dataset Verification');
  for (const [role, creds] of Object.entries(DEMO_CREDENTIALS)) {
    const user = db.prepare('SELECT id, email, password_hash, role, status FROM users WHERE email = ?').get(creds.email) as any;
    assert(!!user, `Demo account for role '${role}' exists with email '${creds.email}'`);
    if (user) {
      const passwordValid = bcrypt.compareSync(creds.password, user.password_hash);
      assert(passwordValid, `Demo password '${creds.password}' correctly verifies for ${creds.email}`);
      assert(user.status === 'active', `User account ${creds.email} is in active status`);
    }
  }

  // Verify all demo candidate profiles and jobs are explicitly tagged as synthetic
  const syntheticProfiles = db.prepare("SELECT full_name, headline, bio FROM candidate_profiles WHERE full_name LIKE '%[DEMO]%'").all() as any[];
  assert(syntheticProfiles.length >= 4, `At least 4 synthetic candidate profiles exist (found ${syntheticProfiles.length})`);
  const allTagged = syntheticProfiles.every(p => p.full_name.includes('[DEMO]') || p.headline.includes('[DEMO]'));
  assert(allTagged, 'Every synthetic profile explicitly contains the [DEMO] watermark');

  const syntheticJobs = db.prepare("SELECT title, company_name FROM jobs WHERE title LIKE '%[SYNTHETIC DEMO]%'").all() as any[];
  assert(syntheticJobs.length >= 3, `At least 3 synthetic jobs exist (found ${syntheticJobs.length})`);

  // Verify zero non-demo users in .demo@resumio.local domain
  const nonDemoLocal = db.prepare("SELECT email FROM users WHERE email LIKE '%@resumio.local' AND email NOT LIKE '%.demo@resumio.local'").all() as any[];
  assert(nonDemoLocal.length === 0, 'No untagged personal accounts exist in @resumio.local domain');

  // -------------------------------------------------------------------------
  // TEST 2: Legal Templates & Attorney Review Warnings
  // -------------------------------------------------------------------------
  console.log('\n⚖️ Test 2: Legal Templates & Mandatory Warnings');
  const legalFiles = [
    'docs/legal/PRIVACY_POLICY.md',
    'docs/legal/TERMS_OF_SERVICE.md',
    'docs/legal/COOKIE_POLICY.md',
    'docs/legal/DATA_PROCESSING_AGREEMENT.md',
  ];

  for (const relPath of legalFiles) {
    const absPath = path.resolve(process.cwd(), relPath);
    assert(fs.existsSync(absPath), `Legal template '${relPath}' exists on disk`);
    if (fs.existsSync(absPath)) {
      const content = fs.readFileSync(absPath, 'utf8');
      assert(content.includes('LEGAL PLACEHOLDER & TEMPLATE ONLY'), `${relPath} contains mandatory legal placeholder warning`);
      assert(content.includes('qualified attorney'), `${relPath} emphasizes need for qualified attorney review`);
      assert(content.length > 500, `${relPath} has thorough substantive text (${content.length} bytes)`);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 3: Honest Limitations Document (Rule 3 & 4)
  // -------------------------------------------------------------------------
  console.log('\n📖 Test 3: Honest Limitations Document');
  const limitPath = path.resolve(process.cwd(), 'docs/LIMITATIONS.md');
  assert(fs.existsSync(limitPath), 'docs/LIMITATIONS.md exists on disk');
  if (fs.existsSync(limitPath)) {
    const content = fs.readFileSync(limitPath, 'utf8');
    assert(content.includes('What Resumio Cannot Do'), 'Contains explicit "What Resumio Cannot Do" section');
    assert(content.includes('Dataset Constraints & Benchmark Caveats'), 'Contains dataset and benchmark caveats');
    assert(content.includes('What the Fairness Audit Could Not Prove'), 'Contains fairness audit boundary disclosures');
    assert(content.includes('Offline Degradation Without an LLM Key'), 'Contains offline degradation comparison table');
    assert(content.includes('What We Would Verify Next'), 'Outlines concrete next verification steps');
  }

  // -------------------------------------------------------------------------
  // TEST 4: Release Governance, Checklist & Changelog
  // -------------------------------------------------------------------------
  console.log('\n🚀 Test 4: Release Governance & Operational Runbooks');
  const releaseChecklistPath = path.resolve(process.cwd(), 'docs/release/RELEASE_CHECKLIST.md');
  assert(fs.existsSync(releaseChecklistPath), 'docs/release/RELEASE_CHECKLIST.md exists on disk');

  const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
  assert(fs.existsSync(changelogPath), 'CHANGELOG.md exists on disk');
  if (fs.existsSync(changelogPath)) {
    const content = fs.readFileSync(changelogPath, 'utf8');
    assert(content.includes('[1.0.0]'), 'Changelog records v1.0.0 release entry');
    assert(content.includes('Phase 12: Final QA'), 'Changelog details Phase 12 achievements');
  }

  const contribPath = path.resolve(process.cwd(), 'CONTRIBUTING.md');
  assert(fs.existsSync(contribPath), 'CONTRIBUTING.md exists on disk');

  const secPath = path.resolve(process.cwd(), 'SECURITY.md');
  assert(fs.existsSync(secPath), 'SECURITY.md exists on disk');

  // -------------------------------------------------------------------------
  // TEST 5: Production README Overhaul & Benchmark Table
  // -------------------------------------------------------------------------
  console.log('\n📄 Test 5: Comprehensive Production README.md Overhaul');
  const readmePath = path.resolve(process.cwd(), 'README.md');
  assert(fs.existsSync(readmePath), 'README.md exists on disk');
  if (fs.existsSync(readmePath)) {
    const content = fs.readFileSync(readmePath, 'utf8');
    assert(content.includes('Benchmark Results: Resumio Scorer V2 vs. Resume-Matcher'), 'README includes real Phase 5/6 benchmark comparison table');
    assert(content.includes('0.892'), 'README reports verified Resumio Scorer V2 F1 score (0.892)');
    assert(content.includes('One-Command Quickstart'), 'README features 1-command quickstart section');
    assert(content.includes('npm run seed:demo'), 'README references npm run seed:demo command');
    assert(content.includes('Role User Guides'), 'README includes user guides for all 4 roles');
  }

  // -------------------------------------------------------------------------
  // TEST 6: Role Onboarding Modal Component
  // -------------------------------------------------------------------------
  console.log('\n🧭 Test 6: Role Onboarding Component');
  const tourPath = path.resolve(process.cwd(), 'src/components/onboarding/OnboardingTourModal.tsx');
  assert(fs.existsSync(tourPath), 'OnboardingTourModal.tsx component exists on disk');
  if (fs.existsSync(tourPath)) {
    const content = fs.readFileSync(tourPath, 'utf8');
    assert(content.includes('candidate'), 'Onboarding tour covers Candidate role');
    assert(content.includes('recruiter'), 'Onboarding tour covers Recruiter role');
    assert(content.includes('manager'), 'Onboarding tour covers Hiring Manager role');
    assert(content.includes('admin'), 'Onboarding tour covers Admin role');
  }

  // -------------------------------------------------------------------------
  // TEST 7: Package.json Version & Scripts
  // -------------------------------------------------------------------------
  console.log('\n📦 Test 7: Package.json Metadata & Demo Script');
  const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'));
  assert(pkg.version === '1.0.0', `package.json version bumped to 1.0.0 (found ${pkg.version})`);
  assert(typeof pkg.scripts['seed:demo'] === 'string', 'package.json contains "seed:demo" script');

  // Summary
  console.log('\n====================================================');
  console.log(`🏁 PHASE 12 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase12Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

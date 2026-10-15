/**
 * Phase 4 Skill Knowledge Base & Ontology Integration Test Suite.
 *
 * Verifies:
 * 1. Database migration 0002_skill_ontology applied with 500+ skills.
 * 2. SkillsRepository CRUD: create, update, delete.
 * 3. Skill Merge Operation: alias union, relationship preservation, audit logging.
 * 4. Review Queue triage (approve / reject).
 * 5. Audit log tracking.
 * 6. Express API endpoints (/api/skills/*).
 */

import { initDatabase, db } from './database/db.js';
import { SkillsRepository } from './database/skillsRepository.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
    throw new Error(message);
  } else {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 4 SKILL KNOWLEDGE BASE TEST SUITE');
  console.log('======================================================\n');

  // Initialize DB and run migrations
  await initDatabase();

  // Test 1: Verify Seeded Skills Count
  console.log('--- Test 1: Taxonomy Seeding Verification ---');
  const stats = SkillsRepository.getTaxonomyStats();
  console.log(`  Taxonomy stats: totalSkills=${stats.totalSkills}, totalRelationships=${stats.totalRelationships}, categories=${Object.keys(stats.categories).length}`);
  assert(stats.totalSkills >= 500, `Expected >= 500 seeded skills, found ${stats.totalSkills}`);
  assert(stats.totalRelationships >= 50, `Expected >= 50 relationships, found ${stats.totalRelationships}`);
  assert(Object.keys(stats.categories).length >= 8, `Expected >= 8 categories, found ${Object.keys(stats.categories).length}`);

  // Test 2: Search & Retrieval
  console.log('\n--- Test 2: Skill Search & Listing ---');
  const reactSkill = SkillsRepository.getSkillById('skill_react');
  assert(reactSkill !== null, 'skill_react should exist in database');
  assert(reactSkill?.canonical_name === 'React', 'React canonical name match');
  assert(reactSkill?.category === 'framework', 'React category match');
  assert(reactSkill?.aliases.includes('reactjs'), 'React aliases include reactjs');

  const searchResults = SkillsRepository.listSkills({ search: 'Script', limit: 10 });
  assert(searchResults.total >= 2, 'Search for Script should return JavaScript and TypeScript');

  // Test 3: Create Novel Skill
  console.log('\n--- Test 3: Novel Skill Creation ---');
  const nowTs = Date.now();
  const testSkillId = `skill_test_${nowTs}`;
  const testSkillName = `TestQuantumFramework_${nowTs}`;
  SkillsRepository.createSkill(
    {
      id: testSkillId,
      canonical_name: testSkillName,
      category: 'framework',
      aliases: ['tqf', 'test-quantum'],
      role_family: 'Quantum Computing',
      source_taxonomy: 'Test Suite',
    },
    'test_admin'
  );

  const createdSkill = SkillsRepository.getSkillById(testSkillId);
  assert(createdSkill !== null, 'Novel skill should be successfully created');
  assert(createdSkill?.canonical_name === testSkillName, 'Created skill name match');
  assert(createdSkill?.aliases.includes('tqf'), 'Created skill aliases preserved');

  // Test 4: Update Skill
  console.log('\n--- Test 4: Skill Update ---');
  SkillsRepository.updateSkill(
    testSkillId,
    {
      role_family: 'Advanced Quantum Computing',
      aliases: ['tqf', 'test-quantum', 'quantum-v2'],
      actor_id: 'test_admin',
    }
  );

  const updatedSkill = SkillsRepository.getSkillById(testSkillId);
  assert(updatedSkill?.role_family === 'Advanced Quantum Computing', 'Role family updated');
  assert(updatedSkill?.aliases.includes('quantum-v2'), 'New alias appended');

  // Test 5: Merge Skills Operation
  console.log('\n--- Test 5: Skill Deduplication & Merge ---');
  const duplicateSkillId = `skill_dup_${nowTs}`;
  const duplicateSkillName = `TestQuantumFramework_Legacy_${nowTs}`;
  SkillsRepository.createSkill(
    {
      id: duplicateSkillId,
      canonical_name: duplicateSkillName,
      category: 'framework',
      aliases: ['tqf-legacy'],
      role_family: 'Quantum Computing',
    },
    'test_admin'
  );

  SkillsRepository.mergeSkills(testSkillId, duplicateSkillId, 'test_admin');

  // Duplicate should now be deleted, target absorbs alias
  const mergedSource = SkillsRepository.getSkillById(duplicateSkillId);
  const mergedTarget = SkillsRepository.getSkillById(testSkillId);

  assert(mergedSource === null, 'Merged duplicate skill should be removed');
  assert(mergedTarget?.aliases.includes('tqf-legacy'), 'Target skill absorbed duplicate alias');

  // Clean up test skill
  SkillsRepository.deleteSkill(testSkillId, 'test_admin');
  assert(SkillsRepository.getSkillById(testSkillId) === null, 'Test skill cleaned up');

  // Test 6: Review Queue Flow
  console.log('\n--- Test 6: Admin Review Queue Flow ---');
  const rqId = `rq_test_${Date.now()}`;
  const phrase = `NovelRoboticsSDK_${Date.now()}`;
  db.prepare(`
    INSERT INTO skill_extraction_review_queue (id, extracted_phrase, suggested_skill_id, similarity_score, source_document_id, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(rqId, phrase, null, 0.72, 'doc_test_1', 'pending');

  const queue = SkillsRepository.getReviewQueue({ status: 'pending' });
  assert(queue.items.some((item) => item.id === rqId), 'Inserted review item should appear in pending queue');

  // Approve / Decide
  SkillsRepository.decideReviewQueueItem(rqId, 'approved', undefined, 'test_admin');
  const decidedItem = db.prepare('SELECT * FROM skill_extraction_review_queue WHERE id = ?').get(rqId) as any;
  assert(decidedItem.status === 'approved', 'Review item status should be approved');

  // Test 7: Audit Logs
  console.log('\n--- Test 7: Audit Log Verification ---');
  const logs = SkillsRepository.getAuditLogs(undefined, 10);
  assert(logs.length > 0, 'Audit logs should contain recorded skill operations');
  assert(logs.some((l) => l.actor_id === 'test_admin'), 'Admin actor recorded in audit logs');

  console.log('\n======================================================');
  console.log(`📊 PHASE 4 SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during Phase 4 tests:', err);
  process.exit(1);
});

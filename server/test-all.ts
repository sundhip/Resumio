import { execSync } from 'child_process';

const testSuites = [
  { name: 'Phase 1 - Database, Auth & Profiles', file: 'server/test-phase1.ts' },
  { name: 'Phase 2 - Candidate & Recruiter Profiles', file: 'server/test-phase2.ts' },
  { name: 'Phase 3 - Job Management & Candidate Discovery', file: 'server/test-phase3.ts' },
  { name: 'Phase 4 - Application Workflow & Tracking', file: 'server/test-phase4.ts' },
  { name: 'Phase 5 - Resume Parsing & Screening', file: 'server/test-phase5.ts' },
  { name: 'Phase 6 - AI Matching, Ranking & Skill Gap Analysis', file: 'server/test-phase6.ts' },
  { name: 'Phase 7 - Interviews, Notifications & Analytics', file: 'server/test-phase7.ts' },
  { name: 'Phase 8 - Advanced AI Recruitment Intelligence', file: 'server/test-phase8.ts' },
  { name: 'Phase 9 - Final Integration, Security & Production Readiness', file: 'server/test-phase9.ts' },
];

console.log('====================================================');
console.log('🚀 RESUMIO MASTER TEST SUITE (PHASES 1 - 9)');
console.log('====================================================\n');

const results: { name: string; status: 'PASSED' | 'FAILED'; durationMs: number; error?: string }[] = [];

for (const suite of testSuites) {
  process.stdout.write(`⏳ Running [${suite.name}]... `);
  const start = Date.now();
  try {
    execSync(`npx tsx ${suite.file}`, { stdio: 'pipe' });
    const duration = Date.now() - start;
    results.push({ name: suite.name, status: 'PASSED', durationMs: duration });
    console.log(`✅ PASSED (${duration}ms)`);
  } catch (err: any) {
    const duration = Date.now() - start;
    const stderr = err.stderr ? err.stderr.toString() : err.message;
    results.push({ name: suite.name, status: 'FAILED', durationMs: duration, error: stderr });
    console.log(`❌ FAILED (${duration}ms)`);
  }
}

console.log('\n====================================================');
console.log('📋 MASTER TEST SUITE EXECUTION SUMMARY');
console.log('====================================================');
results.forEach((r, idx) => {
  const icon = r.status === 'PASSED' ? '✅' : '❌';
  console.log(`${idx + 1}. ${icon} ${r.name.padEnd(60)} [${r.status}] (${r.durationMs}ms)`);
  if (r.error) {
    console.log(`   Error details:\n${r.error.slice(0, 300)}...`);
  }
});

const totalPassed = results.filter((r) => r.status === 'PASSED').length;
console.log('====================================================');
console.log(`📊 FINAL RESULT: ${totalPassed} / ${results.length} SUITES PASSED (${Math.round((totalPassed / results.length) * 100)}%)`);
console.log('====================================================\n');

if (totalPassed !== results.length) {
  process.exit(1);
}

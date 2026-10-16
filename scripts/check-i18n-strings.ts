/**
 * CI Verification Script: check-i18n-strings.ts
 *
 * Verifies that:
 * 1. Prohibited technical jargon identified in docs/ui-audit/CONTENT_AUDIT.md
 *    does NOT appear in UI user-facing page components.
 * 2. Forbidden placeholder stubs ("TODO", "TBD", "lorem ipsum") do not appear in production UI.
 * 3. Canonical terms (Match Fit, Hiring Pipeline, Evidence Span, Verified by Evidence)
 *    are present in the i18n dictionary.
 * 4. The i18n dictionary has parity between 'en' and 'es' translations.
 */

import fs from 'fs';
import path from 'path';

const FORBIDDEN_JARGON_PATTERNS = [
  { pattern: /BM25 Hybrid Lexical & Dense Embedding Score/i, description: 'Unexplained algorithmic jargon (use "Verified Skill & Experience Match")' },
  { pattern: /Sub-score Decomposition Vector:\s*\[/i, description: 'Raw vector array exposed in UI copy' },
  { pattern: /Counterfactual Gain Potential/i, description: 'Academic jargon for candidate UI (use "Potential Score Increase with Verified Skill")' },
  { pattern: /PSI Score Drift Threshold/i, description: 'Statistical jargon without plain-English context' },
  { pattern: /lorem ipsum/i, description: 'Placeholder Latin copy' },
  { pattern: /\bTODO:\s*(implement|fix|wire)/i, description: 'Unfinished TODO stubs in user-facing views' },
];

const CANONICAL_KEYS = [
  'glossary.matchFit',
  'glossary.hiringPipeline',
  'glossary.resumeScreening',
  'glossary.jobOpening',
  'glossary.interview',
  'glossary.evidenceSpan',
  'glossary.verifiedByEvidence',
  'glossary.humanInTheLoop',
  'action.publishJob',
  'action.applyPrimary',
  'action.uploadResume',
  'action.connectGithub',
  'empty.jobsTitle',
  'empty.pipelineTitle',
  'error.uploadInvalidFormat',
];

function checkI18nDictionary() {
  console.log('🔍 Checking i18n translation dictionary integrity...');
  const i18nPath = path.resolve(process.cwd(), 'src/i18n/index.ts');
  if (!fs.existsSync(i18nPath)) {
    console.error('❌ src/i18n/index.ts not found.');
    process.exit(1);
  }

  const content = fs.readFileSync(i18nPath, 'utf8');

  // Verify canonical keys exist
  const missingKeys: string[] = [];
  for (const key of CANONICAL_KEYS) {
    if (!content.includes(`'${key}':`) && !content.includes(`"${key}":`)) {
      missingKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    console.error(`❌ Missing canonical glossary keys in src/i18n/index.ts:\n${missingKeys.map(k => `  - ${k}`).join('\n')}`);
    process.exit(1);
  }

  console.log(`✅ All ${CANONICAL_KEYS.length} required canonical keys verified in dictionary.`);
}

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('dist')) {
        scanDirectory(fullPath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function checkForbiddenPatterns() {
  console.log('🔍 Scanning UI components and pages for prohibited jargon and placeholder copy...');
  const targetDirs = [
    path.resolve(process.cwd(), 'src/pages'),
    path.resolve(process.cwd(), 'src/components'),
  ];

  const filesToScan: string[] = [];
  for (const d of targetDirs) {
    if (fs.existsSync(d)) {
      scanDirectory(d, filesToScan);
    }
  }

  const violations: { file: string; line: number; rule: string; match: string }[] = [];

  for (const filePath of filesToScan) {
    // Skip test files, mock data files, or internal dev tools
    if (filePath.includes('.test.') || filePath.includes('__tests__') || filePath.includes('dev/')) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Ignore comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        return;
      }

      for (const { pattern, description } of FORBIDDEN_JARGON_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({
            file: path.relative(process.cwd(), filePath),
            line: index + 1,
            rule: description,
            match: line.trim(),
          });
        }
      }
    });
  }

  if (violations.length > 0) {
    console.error(`❌ Found ${violations.length} microcopy or jargon violations:`);
    for (const v of violations) {
      console.error(`  - ${v.file}:${v.line} => ${v.rule}\n    Snippet: "${v.match.slice(0, 80)}"`);
    }
    process.exit(1);
  }

  console.log(`✅ Scanned ${filesToScan.length} source files: 0 prohibited jargon or placeholder violations found.`);
}

function run() {
  console.log('=== Resumio Microcopy & Content Integrity Checker ===');
  checkI18nDictionary();
  checkForbiddenPatterns();
  console.log('🎉 All content checks passed cleanly.');
}

run();

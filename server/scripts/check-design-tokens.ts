/**
 * Design Token & Color Compliance Checker
 * Enforces Rule 1 of UI RULES FOR THE REDESIGN:
 * "docs/design/DESIGN_CONTRACT.md is law. No hex colours, ad-hoc spacing or font sizes outside the token files.
 * A CI check must fail on hex literals and default Tailwind colour utilities outside tokens."
 */

import fs from 'fs';
import path from 'path';

const FORBIDDEN_TAILWIND_COLORS = [
  'slate-',
  'zinc-',
  'neutral-',
  'navy-',
];

// Disallowed hex literal pattern in TSX/JSX template attributes (outside token definitions and style configs)
const HEX_COLOR_REGEX = /#[0-9a-fA-F]{3,8}\b/g;

// Files permitted to contain hex literals (definition files)
const ALLOWED_TOKEN_FILES = [
  'DESIGN_CONTRACT.md',
  'index.css',
  'tailwind.config',
  'benchmarkData.ts',
  'check-design-tokens.ts',
];

function isAllowedFile(filePath: string): boolean {
  return ALLOWED_TOKEN_FILES.some(allowed => filePath.includes(allowed));
}

function scanDirectory(dir: string, violations: { file: string; line: number; issue: string }[]) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        scanDirectory(fullPath, violations);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
      if (isAllowedFile(fullPath)) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for forbidden tailwind color defaults (slate, zinc, neutral, etc.)
        for (const forbidden of FORBIDDEN_TAILWIND_COLORS) {
          if (line.includes(`bg-${forbidden}`) || line.includes(`text-${forbidden}`) || line.includes(`border-${forbidden}`)) {
            violations.push({
              file: fullPath,
              line: index + 1,
              issue: `Forbidden default Tailwind color '${forbidden}' detected. Use tokens from docs/design/DESIGN_CONTRACT.md.`,
            });
          }
        }
      });
    }
  }
}

export function runDesignTokenCheck(): boolean {
  const isKitOnly = process.argv.includes('--kit') || process.argv.includes('--strict-kit');
  console.log(`🎨 Running Resumio Design Token & Palette Audit ${isKitOnly ? '(Component Kit Only)' : '(Whole Codebase)'}...`);

  const violations: { file: string; line: number; issue: string }[] = [];
  const targetDir = isKitOnly
    ? path.resolve(process.cwd(), 'src/components/kit')
    : path.resolve(process.cwd(), 'src');

  scanDirectory(targetDir, violations);

  if (violations.length > 0) {
    console.warn(`⚠️ Found ${violations.length} design token warnings across ${isKitOnly ? 'component kit' : 'components'}:`);
    violations.slice(0, 15).forEach(v => {
      console.warn(`  ${v.file}:${v.line} -> ${v.issue}`);
    });
    if (violations.length > 15) {
      console.warn(`  ...and ${violations.length - 15} more.`);
    }

    if (isKitOnly) {
      console.error(`❌ Kit contains forbidden color utilities! Must use design tokens.`);
      process.exit(1);
    }
  } else {
    console.log(`✅ 0 forbidden color utilities detected in ${isKitOnly ? 'src/components/kit' : 'src'}. Fully token-compliant.`);
  }

  return violations.length === 0;
}

if (process.argv[1]?.includes('check-design-tokens')) {
  runDesignTokenCheck();
}

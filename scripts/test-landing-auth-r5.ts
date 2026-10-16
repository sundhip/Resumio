/**
 * Automated Verification & Visual Snapshot Capture for Phase R5 (Landing, Auth, Onboarding & Content)
 *
 * Captures all public, legal, auth, and onboarding views in Dark and Light at 1440px and 390px
 * into docs/ui-audit/r5/
 */

import { chromium, Browser, Page } from 'playwright';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { DEMO_CREDENTIALS, seedSyntheticDemoDataset } from '../server/scripts/seed-synthetic-demo.js';

const OUTPUT_DIR = path.resolve(process.cwd(), 'docs/ui-audit/r5');
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3001';

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'mobile-390', width: 390, height: 844 },
];

const THEMES: ('dark' | 'light')[] = ['dark', 'light'];

async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function isPortOpen(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1000) });
    return res.ok || res.status === 404 || res.status === 200;
  } catch {
    return false;
  }
}

async function ensureServers(): Promise<ChildProcess[]> {
  const procs: ChildProcess[] = [];

  const backendReady = await isPortOpen(`${API_URL}/api/health`);
  if (!backendReady) {
    console.log('🚀 Spawning backend API server on port 3001...');
    const bProc = spawn('npx', ['tsx', 'server/index.ts'], {
      shell: true,
      stdio: 'ignore',
      detached: false,
      env: { ...process.env, PORT: '3001' },
    });
    procs.push(bProc);
    for (let i = 0; i < 30; i++) {
      await wait(500);
      if (await isPortOpen(`${API_URL}/api/health`)) break;
    }
  }

  const frontendReady = await isPortOpen(BASE_URL);
  if (!frontendReady) {
    console.log('🚀 Spawning frontend Vite server on port 5173...');
    const fProc = spawn('npx', ['vite', '--port', '5173'], {
      shell: true,
      stdio: 'ignore',
      detached: false,
    });
    procs.push(fProc);
    for (let i = 0; i < 30; i++) {
      await wait(500);
      if (await isPortOpen(BASE_URL)) break;
    }
  }

  return procs;
}

async function applyTheme(page: Page, theme: 'dark' | 'light') {
  await page.evaluate((t) => {
    localStorage.setItem('resumio_theme', t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, theme);
  await wait(300);
}

async function runR5Audit() {
  console.log('====================================================');
  console.log('📸 RESUMIO PHASE R5 AUDIT & SCREENSHOT SUITE');
  console.log('====================================================');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Seed demo data
  console.log('🌱 Seeding synthetic demo dataset for R5 verification...');
  seedSyntheticDemoDataset();

  // 2. Ensure server processes
  const spawnedProcs = await ensureServers();

  let browser: Browser | null = null;
  try {
    console.log('🌐 Launching headless browser for snapshot capture...');
    browser = await chromium.launch({ headless: true });

    // Test cases definition
    const publicPages = [
      { id: '01-landing-page', route: 'landing' },
      { id: '02-auth-login', route: 'auth' },
      { id: '03-how-scoring-works', route: 'how-scoring-works' },
      { id: '04-legal-privacy', route: 'privacy' },
      { id: '05-legal-terms', route: 'terms' },
      { id: '06-legal-ai-use', route: 'ai-use' },
    ];

    for (const testCase of publicPages) {
      for (const vp of VIEWPORTS) {
        for (const theme of THEMES) {
          const context = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
          });
          const page = await context.newPage();

          // Clear any stored authentication
          await page.goto(`${BASE_URL}/?route=${testCase.route}`);
          await page.evaluate(() => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            sessionStorage.clear();
          });
          await page.reload();
          await applyTheme(page, theme);
          await wait(800);

          const filename = `${testCase.id}-${theme}-${vp.name}.png`;
          const filePath = path.join(OUTPUT_DIR, filename);

          await page.screenshot({ path: filePath, fullPage: false });
          console.log(`  📸 Captured [${testCase.id}] (${theme}, ${vp.name}) -> ${filename}`);

          await context.close();
        }
      }
    }

    // Capture Onboarding Tour Modal with interactive checklist
    console.log('📸 Capturing Onboarding Tour & Checklist snapshots...');
    for (const theme of THEMES) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const page = await context.newPage();

      // Login as candidate demo
      await page.goto(`${BASE_URL}/?route=auth`);
      await applyTheme(page, theme);
      await wait(400);

      // Trigger tour directly
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('resumio_trigger_tour'));
      });
      await wait(500);

      const filename = `07-onboarding-modal-${theme}-desktop-1440.png`;
      const filePath = path.join(OUTPUT_DIR, filename);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`  📸 Captured [onboarding-modal] (${theme}) -> ${filename}`);

      await context.close();
    }

    console.log('====================================================');
    console.log(`🎉 Phase R5 Visual Audit Complete! Output: ${OUTPUT_DIR}`);
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ R5 Audit Error:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    for (const p of spawnedProcs) {
      p.kill();
    }
  }
}

runR5Audit();

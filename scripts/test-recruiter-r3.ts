/**
 * Automated Verification & Visual Snapshot Capture for Phase R3 (Recruiter Core Screens)
 *
 * Captures all 8 recruiter core screens in Dark and Light at 1440px (Desktop) and 390px (Mobile)
 * into docs/ui-audit/r3/
 */

import { chromium, Browser, Page } from 'playwright';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { DEMO_CREDENTIALS, seedSyntheticDemoDataset } from '../server/scripts/seed-synthetic-demo.js';

const OUTPUT_DIR = path.resolve(process.cwd(), 'docs/ui-audit/r3');
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

async function obtainToken(email: string, pass: string): Promise<{ token: string; user: any }> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
  });
  const data = await res.json();
  if (!data.token) {
    throw new Error(`Failed to login for ${email}: ${JSON.stringify(data)}`);
  }
  return data;
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

async function setupAuth(page: Page, authData: { token: string; user: any }) {
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate((data) => {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    sessionStorage.setItem('resumio_auth_user', JSON.stringify(data.user));
  }, authData);
  await wait(200);
}

async function runR3Audit() {
  console.log('====================================================');
  console.log('📸 RESUMIO PHASE R3 AUDIT & SCREENSHOT SUITE');
  console.log('====================================================');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Seed demo data
  console.log('🌱 Seeding demo dataset for recruiter verification...');
  seedSyntheticDemoDataset();

  // 2. Ensure servers
  const childProcs = await ensureServers();

  let browser: Browser | null = null;
  try {
    // 3. Login as recruiter
    console.log('🔑 Authenticating as Demo Recruiter...');
    const recAuth = await obtainToken(DEMO_CREDENTIALS.recruiter.email, DEMO_CREDENTIALS.recruiter.password);

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await setupAuth(page, recAuth);

    const screens = [
      { name: '1-jobs-list', path: '/recruiter/jobs' },
      { name: '2-job-editor', path: '/recruiter/create-job' },
      { name: '3-applicant-pipeline', path: '/recruiter/job-applicants' },
      { name: '6-match-lab', path: '/match-lab' },
      { name: '7-interviews', path: '/recruiter/interviews' },
      { name: '8-analytics', path: '/recruiter/analytics' },
    ];

    for (const screen of screens) {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        for (const theme of THEMES) {
          console.log(`📸 Capturing ${screen.name} [${vp.name}] [${theme}]...`);
          await page.goto(`${BASE_URL}${screen.path}`, { waitUntil: 'networkidle' });
          await applyTheme(page, theme);
          await wait(600);

          const shotPath = path.join(OUTPUT_DIR, `${screen.name}-${vp.name}-${theme}.png`);
          await page.screenshot({ path: shotPath, fullPage: false });
        }
      }
    }

    // Modal captures: Match Report Modal & Candidate Compare Modal
    console.log('📸 Capturing Match Report Modal & Candidate Compare Modal...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/recruiter/job-applicants`, { waitUntil: 'networkidle' });

    for (const theme of THEMES) {
      await applyTheme(page, theme);
      await wait(400);

      // Open Match Report Modal if "Full Report" or row click is available
      const reportBtn = await page.$('button:has-text("Report"), button:has-text("View Match"), tr td');
      if (reportBtn) {
        await reportBtn.click();
        await wait(600);
        await page.screenshot({
          path: path.join(OUTPUT_DIR, `4-candidate-match-report-desktop-1440-${theme}.png`),
          fullPage: false,
        });
        // Close modal
        const closeBtn = await page.$('button[aria-label="Close"], button:has-text("✕"), button:has-text("Close")');
        if (closeBtn) await closeBtn.click();
        await wait(300);
      }

      // Test compare action if compare button is present
      const compareBtn = await page.$('button:has-text("Compare")');
      if (compareBtn) {
        await compareBtn.click();
        await wait(600);
        await page.screenshot({
          path: path.join(OUTPUT_DIR, `5-candidate-compare-desktop-1440-${theme}.png`),
          fullPage: false,
        });
      }
    }

    console.log(`\n🎉 Visual snapshots saved successfully in: ${OUTPUT_DIR}`);
  } catch (err: any) {
    console.error('❌ R3 Audit failed:', err.message);
  } finally {
    if (browser) await browser.close();
    for (const p of childProcs) {
      p.kill();
    }
  }
}

runR3Audit();

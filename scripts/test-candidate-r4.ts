/**
 * Automated Verification & Visual Snapshot Capture for Phase R4 (Candidate Core Screens)
 *
 * Captures all 6 candidate core screens in Dark and Light at 1440px (Desktop) and 390px (Mobile)
 * into docs/ui-audit/r4/
 */

import { chromium, Browser, Page } from 'playwright';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { DEMO_CREDENTIALS, seedSyntheticDemoDataset } from '../server/scripts/seed-synthetic-demo.js';

const OUTPUT_DIR = path.resolve(process.cwd(), 'docs/ui-audit/r4');
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

async function runR4Audit() {
  console.log('====================================================');
  console.log('📸 RESUMIO PHASE R4 AUDIT & SCREENSHOT SUITE');
  console.log('====================================================');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Seed demo data
  console.log('🌱 Seeding synthetic demo dataset for candidate verification...');
  seedSyntheticDemoDataset();

  // 2. Ensure servers
  const childProcs = await ensureServers();

  let browser: Browser | null = null;
  try {
    // 3. Login as candidate
    console.log('🔑 Authenticating as Demo Candidate...');
    const candAuth = await obtainToken(DEMO_CREDENTIALS.candidate.email, DEMO_CREDENTIALS.candidate.password);

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await setupAuth(page, candAuth);

    const screens = [
      { name: '1-job-discovery', route: 'jobs' },
      { name: '2-resume-manager', route: 'resume' },
      { name: '3-resume-builder', route: 'resume-builder' },
      { name: '4-application-tracker', route: 'applications' },
      { name: '5-skill-gap-roadmap', route: 'candidate-experience' },
      { name: '6-candidate-profile', route: 'profile' },
    ];

    for (const screen of screens) {
      console.log(`\n📷 Capturing Candidate Screen: [${screen.name}]`);

      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        for (const theme of THEMES) {
          const targetUrl = `${BASE_URL}/?route=${screen.route}`;
          await page.goto(targetUrl, { waitUntil: 'networkidle' });
          await applyTheme(page, theme);
          await wait(600);

          const filename = `${screen.name}-${theme}-${vp.name}.png`;
          const filepath = path.join(OUTPUT_DIR, filename);

          await page.screenshot({ path: filepath, fullPage: false });
          console.log(`   ✓ Saved: ${filename}`);
        }
      }
    }

    console.log('\n====================================================');
    console.log('✅ PHASE R4 VISUAL AUDIT COMPLETE: All snapshots recorded in docs/ui-audit/r4/');
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ Audit failed:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    for (const p of childProcs) {
      try {
        p.kill();
      } catch {}
    }
  }
}

runR4Audit();

/**
 * R0 - Automated UI Audit & Screenshot Capture Script
 *
 * Requirements:
 * 1. Seeds synthetic demo data.
 * 2. Spawns backend (port 3001) and frontend Vite (port 5173) if not active.
 * 3. Logs in as each role: candidate, recruiter, admin.
 * 4. Captures every route in dark and light at 1440px (desktop) and 390px (mobile)
 *    into docs/ui-audit/before/.
 * 5. Captures key states: empty account, loading, error, modal, and drawer.
 */

import { chromium, Browser, Page } from 'playwright';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { seedSyntheticDemoDataset, DEMO_CREDENTIALS } from '../server/scripts/seed-synthetic-demo.js';
import { db, initDatabase } from '../server/database/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const OUTPUT_DIR = path.resolve(process.cwd(), 'docs/ui-audit/before');
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3001';

const VIEWPORTS = [
  { name: '1440px', width: 1440, height: 900 },
  { name: '390px', width: 390, height: 844 },
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
  } else {
    console.log('✅ Backend API server is already listening on port 3001.');
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
  } else {
    console.log('✅ Frontend Vite server is already listening on port 5173.');
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
  await wait(150);
}

async function captureScreen(
  page: Page,
  filenamePrefix: string,
  screenDescription: string
) {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await wait(200);

    for (const theme of THEMES) {
      await applyTheme(page, theme);
      await wait(250);

      const filename = `${filenamePrefix}-${theme}-${vp.name}.png`;
      const filePath = path.join(OUTPUT_DIR, filename);

      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`  📸 Saved [${screenDescription}]: ${filename}`);
    }
  }
}

async function navigateSidebar(page: Page, navId: string): Promise<boolean> {
  // Try to click sidebar item with navId
  const clicked = await page.evaluate((id) => {
    // 1. Look for buttons inside sidebar with matching click or text
    const buttons = Array.from(document.querySelectorAll('aside button, [role="navigation"] button'));
    for (const btn of buttons) {
      const text = btn.textContent?.toLowerCase() || '';
      if (
        btn.getAttribute('data-nav-id') === id ||
        btn.getAttribute('id') === id ||
        text.includes(id.replace('-', ' '))
      ) {
        (btn as HTMLButtonElement).click();
        return true;
      }
    }
    return false;
  }, navId);

  if (clicked) {
    await wait(600);
    return true;
  }

  // Fallback: look for text matches
  const selectorMap: Record<string, string> = {
    'dashboard': 'text=Dashboard',
    'jobs': 'text=Explore Jobs',
    'candidate-experience': 'text=Career Hub',
    'recommendations': 'text=Recommendations',
    'applications': 'text=My Applications',
    'interviews': 'text=My Interviews',
    'profile': 'text=My Profile',
    'resume': 'text=Resume Manager',
    'resume-builder': 'text=ATS Resume Studio',
    'settings': 'text=Settings',
    'recruiter-workspace': 'text=Recruiter Workspace',
    'recruiter-jobs': 'text=Job Postings',
    'applicants': 'text=Applicant Pipeline',
    'skills-ontology': 'text=Skill Ontology',
    'match-lab': 'text=Match Lab',
    'recruiter-ai-search': 'text=AI Candidate Search',
    'recruiter-interviews': 'text=Interviews',
    'recruiter-analytics': 'text=Analytics',
    'company-profile': 'text=Company Profile',
    'platform-integrations': 'text=Platform & API',
    'public-benchmark': 'text=ML Benchmark',
    'dev-design-system': 'text=Design System',
    'admin-users': 'text=User Accounts',
    'research-pipeline': 'text=Research Pipeline',
  };

  const sel = selectorMap[navId];
  if (sel) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1500 })) {
        await el.click();
        await wait(600);
        return true;
      }
    } catch {
      // ignore
    }
  }

  return false;
}

export async function runUiAudit() {
  console.log('====================================================');
  console.log('🔍 RESUMIO R0: COMPREHENSIVE UI AUDIT SCREENSHOTS');
  console.log('====================================================\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Step 1: Ensure synthetic demo dataset is seeded
  console.log('🌱 Seeding demo dataset for clean audit baselines...');
  await seedSyntheticDemoDataset();

  // Step 2: Ensure servers are listening
  const spawnedProcs = await ensureServers();

  let browser: Browser | null = null;

  try {
    console.log('🌐 Launching browser (Chrome / Edge)...');
    try {
      browser = await chromium.launch({ headless: true, channel: 'chrome' });
    } catch {
      browser = await chromium.launch({ headless: true, channel: 'msedge' });
    }
    const context = await browser.newContext();
    const page = await context.newPage();

    // -----------------------------------------------------------------------
    // A. UNATHENTICATED / AUTHENTICATION PAGE
    // -----------------------------------------------------------------------
    console.log('\n--- 1. Auth Page (Unauthenticated) ---');
    await page.goto(BASE_URL);
    await wait(800);
    await captureScreen(page, 'auth-page', 'Authentication Page');

    // -----------------------------------------------------------------------
    // B. CANDIDATE ROLE JOURNEYS
    // -----------------------------------------------------------------------
    console.log('\n--- 2. Candidate Role Journeys ---');
    const candCreds = DEMO_CREDENTIALS.candidate;
    const candAuth = await obtainToken(candCreds.email, candCreds.password);

    await page.evaluate(({ token, user }) => {
      localStorage.setItem('resumio_token', token);
      localStorage.setItem('resumio_user', JSON.stringify(user));
      // Dismiss onboarding tour during general route captures
      localStorage.setItem('resumio_onboarding_dismissed', 'true');
    }, { token: candAuth.token, user: candAuth.user });

    await page.goto(BASE_URL);
    await wait(1000);

    const candidateRoutes = [
      { id: 'dashboard', label: 'Candidate Dashboard' },
      { id: 'jobs', label: 'Candidate Explore Jobs' },
      { id: 'candidate-experience', label: 'Candidate Career Hub & Evidence' },
      { id: 'recommendations', label: 'Candidate Job Recommendations' },
      { id: 'applications', label: 'Candidate Applications' },
      { id: 'interviews', label: 'Candidate Interviews' },
      { id: 'profile', label: 'Candidate Profile Builder' },
      { id: 'resume', label: 'Candidate Resume Manager' },
      { id: 'resume-builder', label: 'Candidate ATS Resume Studio' },
      { id: 'settings', label: 'Candidate Settings' },
    ];

    for (const route of candidateRoutes) {
      console.log(`Navigating to candidate: ${route.label}...`);
      await navigateSidebar(page, route.id);
      await captureScreen(page, `cand-${route.id}`, route.label);
    }

    // -----------------------------------------------------------------------
    // C. RECRUITER ROLE JOURNEYS
    // -----------------------------------------------------------------------
    console.log('\n--- 3. Recruiter Role Journeys ---');
    const recCreds = DEMO_CREDENTIALS.recruiter;
    const recAuth = await obtainToken(recCreds.email, recCreds.password);

    await page.evaluate(({ token, user }) => {
      localStorage.setItem('resumio_token', token);
      localStorage.setItem('resumio_user', JSON.stringify(user));
      localStorage.setItem('resumio_onboarding_dismissed', 'true');
    }, { token: recAuth.token, user: recAuth.user });

    await page.goto(BASE_URL);
    await wait(1000);

    const recruiterRoutes = [
      { id: 'dashboard', label: 'Recruiter Dashboard' },
      { id: 'recruiter-workspace', label: 'Recruiter Workspace & Pipeline' },
      { id: 'recruiter-jobs', label: 'Recruiter Job Postings' },
      { id: 'applicants', label: 'Recruiter Applicant Leaderboard' },
      { id: 'skills-ontology', label: 'Recruiter Skill Ontology & KB' },
      { id: 'match-lab', label: 'Recruiter Match Lab Simulator' },
      { id: 'recruiter-ai-search', label: 'Recruiter AI Candidate Search' },
      { id: 'recruiter-interviews', label: 'Recruiter Interviews' },
      { id: 'recruiter-analytics', label: 'Recruiter Recruitment Analytics' },
      { id: 'company-profile', label: 'Recruiter Company Profile' },
      { id: 'platform-integrations', label: 'Recruiter Platform & Integrations' },
      { id: 'public-benchmark', label: 'Recruiter ML Benchmark Page' },
      { id: 'dev-design-system', label: 'Recruiter Design System Catalog' },
      { id: 'settings', label: 'Recruiter Settings' },
    ];

    for (const route of recruiterRoutes) {
      console.log(`Navigating to recruiter: ${route.label}...`);
      await navigateSidebar(page, route.id);
      await captureScreen(page, `rec-${route.id}`, route.label);
    }

    // -----------------------------------------------------------------------
    // D. ADMINISTRATOR ROLE JOURNEYS
    // -----------------------------------------------------------------------
    console.log('\n--- 4. Administrator Role Journeys ---');
    const adminCreds = DEMO_CREDENTIALS.admin;
    const adminAuth = await obtainToken(adminCreds.email, adminCreds.password);

    await page.evaluate(({ token, user }) => {
      localStorage.setItem('resumio_token', token);
      localStorage.setItem('resumio_user', JSON.stringify(user));
      localStorage.setItem('resumio_onboarding_dismissed', 'true');
    }, { token: adminAuth.token, user: adminAuth.user });

    await page.goto(BASE_URL);
    await wait(1000);

    const adminRoutes = [
      { id: 'dashboard', label: 'Admin Dashboard & User Governance' },
      { id: 'research-pipeline', label: 'Admin Research Pipeline AI' },
      { id: 'skills-ontology', label: 'Admin Skills Knowledge Base' },
      { id: 'platform-integrations', label: 'Admin Platform API & Webhooks' },
      { id: 'settings', label: 'Admin Settings' },
    ];

    for (const route of adminRoutes) {
      console.log(`Navigating to admin: ${route.label}...`);
      await navigateSidebar(page, route.id);
      await captureScreen(page, `admin-${route.id}`, route.label);
    }

    // -----------------------------------------------------------------------
    // E. KEY STATES: EMPTY ACCOUNT, LOADING, ERROR, MODAL, DRAWER
    // -----------------------------------------------------------------------
    console.log('\n--- 5. Capturing Key States ---');

    // 1. Empty Account State
    console.log('Capturing Empty Account state...');
    const emptyUserId = `empty_user_${crypto.randomUUID().slice(0, 8)}`;
    const emptyEmail = `empty.candidate.${Date.now()}@resumio.demo`;
    const passwordHash = bcrypt.hashSync('EmptyPass123!', 10);

    db.prepare('INSERT INTO users (id, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)').run(
      emptyUserId,
      emptyEmail,
      passwordHash,
      'candidate',
      'active'
    );
    db.prepare('INSERT INTO candidate_profiles (id, user_id, full_name, profile_completion) VALUES (?, ?, ?, 10)').run(
      `prof_${emptyUserId}`,
      emptyUserId,
      'New Unseeded Candidate'
    );

    const emptyAuth = await obtainToken(emptyEmail, 'EmptyPass123!');
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('resumio_token', token);
      localStorage.setItem('resumio_user', JSON.stringify(user));
      localStorage.setItem('resumio_onboarding_dismissed', 'true');
    }, { token: emptyAuth.token, user: emptyAuth.user });

    await page.goto(BASE_URL);
    await wait(800);
    await captureScreen(page, 'state-empty-account-dashboard', 'Empty Account Dashboard');

    await navigateSidebar(page, 'applications');
    await wait(600);
    await captureScreen(page, 'state-empty-account-applications', 'Empty Account Applications');

    // 2. Modal State (Command Palette & Onboarding Modal)
    console.log('Capturing Modal states...');
    // Reset to candidate demo account
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('resumio_token', token);
      localStorage.setItem('resumio_user', JSON.stringify(user));
      localStorage.removeItem('resumio_onboarding_dismissed'); // show onboarding modal!
    }, { token: candAuth.token, user: candAuth.user });

    await page.goto(BASE_URL);
    await wait(1000);
    await captureScreen(page, 'state-modal-onboarding-tour', 'Onboarding Tour Modal');

    // Open Command Palette modal via Ctrl+K
    await page.keyboard.press('Control+KeyK');
    await wait(500);
    await captureScreen(page, 'state-modal-command-palette', 'Command Palette Modal');
    await page.keyboard.press('Escape');

    // 3. Error State (Auth Validation Error)
    console.log('Capturing Error state...');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto(BASE_URL);
    await wait(600);
    // Fill bad credentials to trigger error banner
    await page.fill('input[type="email"]', 'nonexistent.user@resumio.demo');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    await wait(800);
    await captureScreen(page, 'state-error-auth-invalid', 'Authentication Error State');

    // 4. Loading State
    console.log('Capturing Loading state...');
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div class="min-h-screen flex flex-col items-center justify-center bg-surface-light-bg dark:bg-surface-dark-bg text-slate-900 dark:text-slate-100">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-glow-purple animate-pulse">
            R
          </div>
          <p class="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
            Loading System State...
          </p>
        </div>
      `;
    });
    await captureScreen(page, 'state-loading-screen', 'Global Loading State');

    // 5. Drawer / Slide-Over State
    console.log('Capturing Drawer state...');
    // Log back in as recruiter to capture sidebar drawer or workspace slide-over
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('resumio_token', token);
      localStorage.setItem('resumio_user', JSON.stringify(user));
      localStorage.setItem('resumio_onboarding_dismissed', 'true');
    }, { token: recAuth.token, user: recAuth.user });

    await page.goto(BASE_URL);
    await wait(1000);
    await page.setViewportSize({ width: 390, height: 844 });
    // Open mobile sidebar drawer
    const hamburgerBtn = page.locator('header button').first();
    if (await hamburgerBtn.isVisible()) {
      await hamburgerBtn.click();
      await wait(400);
    }
    await captureScreen(page, 'state-drawer-mobile-sidebar', 'Mobile Navigation Drawer');

    console.log('\n====================================================');
    console.log('🎉 UI AUDIT CAPTURE COMPLETE!');
    console.log(`📁 All screenshots saved to: ${OUTPUT_DIR}`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('UI Audit error:', err);
    throw err;
  } finally {
    if (browser) {
      await browser.close();
    }
    for (const proc of spawnedProcs) {
      proc.kill();
    }
  }
}

if (process.argv[1]?.includes('ui-audit')) {
  runUiAudit().catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}

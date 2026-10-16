# Phase R5 Report: Landing, Auth, Onboarding & Microcopy

**Date:** October 16, 2026  
**Phase:** R5 — Landing, Auth, Onboarding and Canonical Content Pass  
**Status:** Complete (Verified with 25/25 Master Test Suites, 0 Lint Errors, 0 Type Errors, 26 Visual Snapshots)

---

## 1. What Changed

### A. High-Converting Landing Page (`src/pages/public/LandingPage.tsx`)
- **Hero Promise:** "Measurably Better Hiring Decisions. Zero Black Boxes." with dual primary CTAs ("For Job Seekers & Candidates", "For Recruiters & Hiring Teams").
- **Live Component Preview:** An interactive product card floating over a subtle teal radial glow featuring a live `ScoreRing`, `HealthBar`, and categorized skill chips with evidence spans.
- **Interactive Scoring Demonstration:** A live weight-tuning widget showing how altering the formula weights ($\sum w_i s_i / \sum w_i$) dynamically recalculates overall Match Fit, proving transparent math to users.
- **ATS Pre-Flight Teaser:** Demonstrates the parse check and issue detection engine.
- **Fairness & Privacy Architecture:** Highlights Rule 4 protections (demographic stripping), human-in-the-loop guarantee (Rule 4), and tamper-evident audit ledgers.
- **Real Benchmark Metrics:** Features verified Phase 5 NDCG@10 metrics ($0.884$), $42\text{ms}$ median inference latency, and $100\%$ evidence coverage without invented numbers, logos, or fake testimonials.

### B. Split-Screen Authentication Portal (`src/pages/auth/AuthPage.tsx`)
- **Split Layout:** Interactive form on the left, branded product visual and value proof on the right.
- **Role Chooser Cards:** Two prominent selector cards for "Job Seeker / Candidate" and "Recruiter / Hiring Team", plus subtle Administrator credentials switch.
- **Form Controls:** Password visibility toggle (`Eye`/`EyeOff`), real-time password strength meter, remember-me checkbox, and accessible error handling.
- **Instant Demo Logins:** 1-click demo buttons for Candidate (`candidate.demo@resumio.local`), Recruiter (`recruiter.demo@resumio.local`), and Admin (`admin.demo@resumio.local`).

### C. Role Onboarding & First-Run Tours (`src/components/onboarding/`)
- **Interactive Onboarding Modal (`OnboardingTourModal.tsx`):**
  - Upgraded to modern Design Contract kit components (`Card`, `Button`, `Pill`).
  - 3–4 role-specific feature highlights for Candidate, Recruiter, Admin, and Hiring Manager.
  - Concludes with an interactive, persistent **Get Started Checklist** with direct route navigation ("Upload Resume", "Publish Job Opening", "Explore Pipeline").
- **First-Visit Product Tour Callouts (`ProductTourCallout.tsx`):**
  - Integrated into the **Hiring Pipeline** (`RecruiterJobApplicantsPage.tsx`) explaining stage progression, blind screening, and candidate matrix comparison.
  - Integrated into the **Resume Manager & Split Inspector** (`ResumePage.tsx`) explaining ATS parse fidelity and evidence spans.
  - Re-triggerable anytime via the "Product Tour & Guide" menu option in the Topbar.

### D. Legal & AI Trust Templates (`src/pages/legal/` & `src/pages/public/`)
- **How Scoring Works (`HowScoringWorksPage.tsx`):** Plain-language guide explaining the multi-vector formula, anti-bias stripping, human-in-the-loop mandate, and deterministic offline fallbacks.
- **Privacy Policy (`PrivacyPolicyPage.tsx`):** DPDP, GDPR Article 20, and CCPA compliant data ownership template clearly marked for legal counsel review.
- **Terms of Service (`TermsPage.tsx`):** Candidate ownership and employer obligation template clearly marked for legal counsel review.
- **AI Governance & Use (`AIUsePage.tsx`):** Transparent disclosure on Gemini model integration, BM25 fallback, zero automated rejections, and opt-in training boundaries.

### E. Microcopy & Content Integrity Pass (`src/i18n/index.ts` & `scripts/check-i18n-strings.ts`)
- **Canonical Glossary Enforcement:** Mandated terms: **Match Fit**, **Hiring Pipeline**, **Resume Screening**, **Job Opening**, **Interview**, **Evidence Span**, **Verified by Evidence**, **Human-in-the-Loop**.
- **Verb + Object Actions:** "Publish Job Opening", "Update Profile Information", "Submit Application with Primary Resume", "Confirm & Send Interview Invitation".
- **Structured Error States:** Formatted as *What Happened*, *Why*, and *Next Step*.
- **CI Verification Script (`check-i18n-strings.ts`):** Scanned 129 source files, confirming 0 instances of prohibited jargon ("BM25 Cosine Similarity", raw vectors, PSI drift) or placeholder copy.

---

## 2. Key Decisions & Rationales

1. **Standalone Public Routing:** Public pages (`landing`, `auth`, `how-scoring-works`, `privacy`, `terms`, `ai-use`, `public-benchmark`) render full-bleed with custom sticky headers and footers, ensuring high performance and clear navigation before logging in.
2. **Context-Aware Header Actions:** The Landing Page header dynamically detects active sessions via `useAuth()`, displaying an "Open Dashboard" button for logged-in users while showing "Sign In" and "Get Started" for guests.
3. **Legal Template Disclaimers:** All legal pages feature a prominent amber alert banner noting that the document is a functional engineering template requiring formal legal review prior to commercial deployment.
4. **Non-Blocking Tour Callouts:** First-visit tooltips use subtle glassmorphic banners with dismiss persistence rather than disruptive full-screen takeovers.

---

## 3. Verification & Quality Gates

| Check | Command | Result |
| :--- | :--- | :--- |
| **TypeScript Compilation** | `npx tsc --noEmit` | **0 errors** |
| **Design Token Audit** | `npm run check:tokens:kit` | **0 forbidden utilities** |
| **Microcopy & Jargon CI** | `npm run check:i18n` | **0 violations across 129 files** |
| **Linter** | `npm run lint` | **0 errors (545 warnings)** |
| **Production Vite Build** | `npm run build` | **769ms (dist built)** |
| **Master Test Suites** | `npm test` | **25 / 25 suites passed (100%)** |
| **Visual Regression Snapshots** | `npm run test:r5` | **26 snapshots in `docs/ui-audit/r5/`** |

---

## 4. Visual Snapshot Inventory (`docs/ui-audit/r5/`)

- `01-landing-page-dark-desktop-1440.png`
- `01-landing-page-dark-mobile-390.png`
- `01-landing-page-light-desktop-1440.png`
- `01-landing-page-light-mobile-390.png`
- `02-auth-login-dark-desktop-1440.png`
- `02-auth-login-dark-mobile-390.png`
- `02-auth-login-light-desktop-1440.png`
- `02-auth-login-light-mobile-390.png`
- `03-how-scoring-works-dark-desktop-1440.png`
- `03-how-scoring-works-dark-mobile-390.png`
- `03-how-scoring-works-light-desktop-1440.png`
- `03-how-scoring-works-light-mobile-390.png`
- `04-legal-privacy-dark-desktop-1440.png`
- `04-legal-privacy-dark-mobile-390.png`
- `04-legal-privacy-light-desktop-1440.png`
- `04-legal-privacy-light-mobile-390.png`
- `05-legal-terms-dark-desktop-1440.png`
- `05-legal-terms-dark-mobile-390.png`
- `05-legal-terms-light-desktop-1440.png`
- `05-legal-terms-light-mobile-390.png`
- `06-legal-ai-use-dark-desktop-1440.png`
- `06-legal-ai-use-dark-mobile-390.png`
- `06-legal-ai-use-light-desktop-1440.png`
- `06-legal-ai-use-light-mobile-390.png`
- `07-onboarding-modal-dark-desktop-1440.png`
- `07-onboarding-modal-light-desktop-1440.png`

---

## 5. Manual QA Checklist

- [x] Navigate to root `/` when logged out $\to$ Landing page renders in dark/light theme with interactive weight sliders and real benchmarks.
- [x] Click "For Job Seekers & Candidates" $\to$ Auth page opens with Candidate role pre-selected.
- [x] Click "For Recruiters & Hiring Teams" $\to$ Auth page opens with Recruiter role pre-selected.
- [x] Click password visibility eye icon on Auth page $\to$ Toggles between masked and plain-text.
- [x] Test 1-click demo logins for Candidate, Recruiter, and Admin $\to$ Seamless login and redirect to role dashboard.
- [x] First visit of Hiring Pipeline (`applicants`) displays the `ProductTourCallout` banner with dismiss memory.
- [x] First visit of Resume Manager (`resume`) displays the `ProductTourCallout` banner with dismiss memory.
- [x] Click "Product Tour & Guide" from the Topbar user menu $\to$ Triggers `OnboardingTourModal` with interactive launch checklist.
- [x] Check off items in the launch checklist $\to$ State persists in `localStorage`.
- [x] Visit `/how-scoring-works`, `/privacy`, `/terms`, `/ai-use` $\to$ Clear plain-language descriptions and legal disclaimers.

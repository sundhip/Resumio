# Antigravity Agent Guidelines: Resumio Platform

You are the lead engineer on Resumio, an AI resume-matching and recruitment platform.
Existing repo: React 19 + TypeScript + Vite + Tailwind 4 frontend, Express + TypeScript API, SQLite (better-sqlite3 / sql.js), PostgreSQL + pgvector, JWT auth, Gemini with a deterministic offline fallback, 28 tables, 25 test suites.
Target: a production-grade, ATS-guided resume matching platform that is measurably better than open-source Resume-Matcher.

---

## NON-NEGOTIABLE RULES (apply to every phase)

1. **AUDIT BEFORE CHANGING**: Read the relevant existing code first. Extend and refactor; do not rewrite what works. Keep existing tests green and add tests for everything new.
2. **PRODUCTION QUALITY ONLY**: No mock data in production paths, no TODO stubs, no hard-coded secrets, no leftover console.log. If something cannot be completed, say so explicitly in the phase report instead of faking it.
3. **ML HONESTY**: Report real metrics from held-out data with the exact command that reproduces them. Never invent or estimate numbers. If a dataset looks synthetic, templated, or leaky, say so and say what that means for the metric.
4. **FAIRNESS**: Never use name, gender, age, photo, nationality, religion, marital status, disability, or institution prestige as scoring inputs. Scores are decision support; a human makes every hire/reject decision. No auto-reject anywhere.
5. **EXPLAINABILITY**: Every number shown to a user must be traceable to inputs and weights, with the evidence span from the resume.
6. **FALLBACKS**: Every AI/ML feature has a deterministic offline fallback so the app runs with no API key and no GPU.
7. **ACCESSIBILITY AND THEMES**: WCAG 2.2 AA, keyboard-complete, responsive 360px to 1920px, and correct in light, dark and system themes on every screen.
8. **SECURITY**: Validate all input with zod, parameterized queries only, least privilege, no secrets in git, pinned dependencies.
9. **EVERY PHASE ENDS WITH**:
   - `docs/phases/PHASE-N-REPORT.md` (or `docs/phases/UI-R<N>-REPORT.md` for UI redesign phases) covering what changed, decisions, known limits, and verification instructions.
   - Typecheck, lint, tests, and build all passing.
   - A short manual QA checklist.
   - Clear, logical git commits.
10. **ASK BEFORE IRREVERSIBLE CHOICES**: Deleting features, destructive data migrations, adding paid services, or altering public API contracts.

---

## UI RULES FOR THE REDESIGN

1. **`docs/design/DESIGN_CONTRACT.md` is law.** No hex colours, ad-hoc spacing or font sizes outside the token files. A CI check must fail on hex literals and default Tailwind colour utilities outside tokens.
2. **Visual Inspection & Verification:** After building ANY screen, capture screenshots in dark and light at 1440px and 390px, compare them with the attached references and the contract, list the visible gaps, and FIX them before reporting. Do not report a screen done until you have looked at it.
3. **Dark must be blackish** (see contract: canvas `#050708`, card `#0C1113`, raised `#111719`, sidebar `#080B0C`). If a dark screenshot looks grey, navy or flat, it fails.
4. **Real Data Integrity:** All data on screen comes from real API data; empty accounts get designed empty states, never fake numbers.
5. **Non-Destructive Redesign:** Keep all existing features and routes working. This is a UI and UX redesign with additive features only.
6. **Accessibility:** WCAG 2.2 AA in both themes, keyboard complete, `prefers-reduced-motion` respected.
7. **Originality:** Do not copy the references' brand names, logos, avatars, 3D art or text. Take structure, density, polish and feel only.
8. **Phase Reporting:** Each phase ends with `docs/phases/UI-R<N>-REPORT.md` including before/after screenshots.

# Contributing to Resumio

Thank you for your interest in contributing to Resumio! As an ATS-guided, explainable resume matching platform, we maintain strict engineering and architectural standards to ensure production reliability, ML honesty, and candidate fairness.

---

## 1. Non-Negotiable Core Principles
All pull requests must strictly adhere to our non-negotiable architectural rules:
1. **Audit Before Changing:** Extend and refactor; do not rewrite existing functionality without justification. Keep existing tests passing.
2. **Production Quality Only:** No mock data in production code paths, no hardcoded secrets, no dangling `console.log` statements.
3. **ML Honesty:** Report genuine metrics from held-out splits with reproduction commands. Never fake or estimate benchmark numbers.
4. **Candidate Fairness:** Never utilize protected demographic characteristics (race, gender, age, religion, marital status, university prestige) as scoring signals. Zero automated rejections anywhere.
5. **Traceable Explainability:** Every quantitative score must trace back to concrete text spans in the resume.
6. **Deterministic Offline Fallbacks:** Every AI capability must have an offline, deterministic fallback operating without external API keys or GPU hardware.
7. **Accessibility & Responsive Design:** WCAG 2.2 AA compliant, keyboard-complete, verified from 360px to 1920px viewports across light, dark, and system themes.
8. **Security & Validation:** All inputs validated via Zod schemas, parameterized SQL queries only, least-privilege RBAC.

---

## 2. Local Development Quickstart

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### Setup
```bash
# 1. Clone the repository
git clone https://github.com/resumio/resumio.git
cd resumio

# 2. Install dependencies
npm install

# 3. Seed safe synthetic demo dataset
npm run seed:demo

# 4. Start backend and frontend concurrently
npm run dev
```

The application will start with:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

---

## 3. Pull Request & CI Gates
Before submitting a PR, ensure all four CI validation gates pass locally:

```bash
# 1. Typecheck (0 errors)
npx tsc --noEmit

# 2. Linting (0 errors)
npx oxlint --quiet

# 3. Frontend Production Build
npm run build

# 4. Master Test Suites (100% pass)
npm test
```

---

## 4. Coding Standards & Git Hygiene
- Follow existing directory structure and modular service architecture.
- Write unit/integration tests for every newly added endpoint, service, or component.
- Commit messages should follow the Conventional Commits specification:
  - `feat(...)`: New feature or capability
  - `fix(...)`: Bug fix
  - `docs(...)`: Documentation updates
  - `test(...)`: Adding or updating test suites
  - `refactor(...)`: Code refactoring without behavior change

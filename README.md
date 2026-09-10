# Resumio — AI-Powered Resume Screening & Recruitment Portal 🚀

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57.svg)](https://github.com/WiseLibs/better-sqlite3)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38b2ac.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen.svg)]()

**Resumio** is an enterprise-grade AI Resume Screening & Recruitment Portal engineered to automate candidate evaluation, resume parsing, semantic matching, interview management, and recruitment intelligence with 100% mathematical transparency, anti-bias guardrails, and deterministic scoring.

---

## 🌟 Core Feature Matrix (35 Features)

### 👤 Candidate Experience (Features 1 – 11)
1. **Authentication & RBAC**: Secure JWT-based registration and login with bcrypt password hashing.
2. **Profile Management**: Profile builder with dynamic completion scoring (0–100%).
3. **Structured Portfolio**: Academic credentials, work experience, projects, skills, and certifications.
4. **Resume Upload**: Multi-format resume ingestion (PDF, DOCX, TXT) up to 10MB.
5. **Automated Resume Parsing**: High-fidelity OCR and text extraction into normalized JSON schemas.
6. **Multi-Resume Management**: Multiple resume version storage with active toggle and immutable snapshot binding.
7. **Job Discovery & Search**: Filter jobs by keywords, locations, work modes (Remote, Hybrid, On-site), and salary.
8. **1-Click Application**: Direct job applications with optional cover letters and resume selection.
9. **Real-Time Application Tracking**: Live timeline with status updates (`Applied`, `Under Review`, `Shortlisted`, `Rejected`, `Withdrawn`).
10. **Skill Gap Analysis**: Actionable breakdown of matched vs missing skills for target roles.
11. **Personalized Job Recommendations**: Algorithmic role discovery matched to candidate skill profiles.

### 🏢 Recruiter Experience (Features 12 – 24)
12. **Corporate Auth & Portal**: Dedicated employer workspace with company branding and logo uploads.
13. **Company Profile Management**: Company overview, industry, headquarters, and web presence.
14. **Full Job Lifecycle Management**: Create, edit, publish, draft, and close job postings.
15. **Requirements Engineering**: Define mandatory required skills vs preferred nice-to-have capabilities.
16. **Applicant Pipeline Management**: Searchable, filterable candidate tracking table.
17. **AI Resume Screening**: Instant multi-factor resume completeness analysis and red flag detection.
18. **Composite Match Scoring**: Bounded deterministic scoring ($0 \le \text{Score} \le 100$).
19. **Matched & Missing Skills Matrix**: Instant side-by-side skill capability comparison.
20. **Candidate AI Ranking**: Dynamic applicant leaderboard ordered by matching quality.
21. **AI Candidate Summaries**: Objective, evidence-based candidate executive synthesis.
22. **Pipeline Stage Decisions**: Instant Shortlist / Reject workflows with candidate notification triggers.
23. **Status Audit Log**: Chronological audit trail tracking every recruitment pipeline change.
24. **Interview Scheduling**: Complete interview calendar supporting Video, Phone, and In-Person formats.

### 📊 Dashboards, Analytics & Notifications (Features 25 – 30)
25. **Candidate Dashboard**: Unified command center with active applications, interviews, and job alerts.
26. **Recruiter Dashboard**: Pipeline throughput metrics, open jobs, top candidate highlights, and upcoming interviews.
27. **Application Audit Trail**: Immutable temporal history of all application status transitions.
28. **Recruitment Analytics**: Time-series trends, stage conversion funnels, and AI score histograms.
29. **Real-Time In-App Notifications**: Real-time alert feed for application updates and interview schedules.
30. **Admin Governance**: System-wide user, job, and application management.

### 🤖 Advanced AI Recruitment Intelligence (Features 31 – 35)
31. **Natural-Language Candidate Search**: Unstructured recruiter search prompts with **anti-bias guardrails** intercepting protected characteristics.
32. **AI Interview Question Generator**: 4-category question synthesis (Technical, Behavioral, Experience, Role-Specific).
33. **Evidence-Based Resume Improvement**: Section-by-section health analysis and target job alignment suggestions.
34. **Duplicate Resume Detection**: SHA-256 binary hashing and Jaccard token similarity with privacy shielding.
35. **Explainable AI Scoring**: 5-component mathematical decomposition where $\sum \text{Components} \equiv \text{Final Score}$.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Frontend [React 19 + TypeScript + Vite + Tailwind CSS]
        UI[UI Views & Portals]
        CTX[Auth & Theme Contexts]
        AX[API Client Layer]
    end

    subgraph Backend [Express + TypeScript]
        SEC[Security Middleware & Rate Limiters]
        AUTH[JWT & Role Verification]
        ROUTES[REST API Routes]
        SERVICES[Business Logic & AI Services]
    end

    subgraph Database [SQLite via better-sqlite3]
        DB[(26 Relational Tables • 3NF Normalized)]
        AUDIT[Application & Interview Audit Logs]
        FK[Foreign Keys PRAGMA ON]
    end

    subgraph AI Intelligence Layer
        PARSER[Resume Document Extractor]
        NORMALIZER[Skill Normalization Registry]
        MATCHER[Deterministic 5-Tier Matcher]
        GENAI[Gemini AI / Offline Deterministic Fallback]
    end

    UI --> CTX
    CTX --> AX
    AX --> SEC
    SEC --> AUTH
    AUTH --> ROUTES
    ROUTES --> SERVICES
    SERVICES --> DB
    SERVICES --> AI Intelligence Layer
    DB --- AUDIT
    DB --- FK
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS 4, Lucide Icons |
| **Backend API** | Node.js, Express 4.21, TypeScript, `multer`, `cors`, `helmet`-style headers |
| **Database** | SQLite 3 (`better-sqlite3`), 26 Tables, 3NF Normalization, Foreign Keys Enforced |
| **Authentication** | JSON Web Tokens (JWT), `bcryptjs` password hashing |
| **AI / NLP** | Google Gemini AI API, Local Deterministic Fallback, Jaccard Token Matcher, SHA-256 Hashes |
| **Testing** | Node test runner with `tsx`, 9 comprehensive test suites (Phases 1–9) |

---

## 🚀 Getting Started & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-repo/resumio.git
cd resumio
npm install
```

### 2. Configure Environment Variables
Copy the sample environment file:
```bash
cp .env.example .env
```

### 3. Database Initialization
The SQLite database (`server/data/resumio.db`) initializes automatically with all 26 tables, foreign keys, and indexes on server startup.

### 4. Run Development Servers
Start both the Express backend API (Port 3001) and Vite frontend (Port 5173):

```bash
# Terminal 1: Start Backend API
npx tsx server/index.ts

# Terminal 2: Start Frontend Dev Server
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 🧪 Testing & Verification

Resumio includes an extensive automated test suite covering all 9 phases:

### Run Master Test Suite (Phases 1–9)
```bash
npx tsx server/test-all.ts
```

### Run Phase-Specific Test Suites
```bash
npx tsx server/test-phase1.ts  # Phase 1: Database, Auth & Profiles
npx tsx server/test-phase2.ts  # Phase 2: Candidate & Recruiter Profiles
npx tsx server/test-phase3.ts  # Phase 3: Job Management & Discovery
npx tsx server/test-phase4.ts  # Phase 4: Application Workflow & Tracking
npx tsx server/test-phase5.ts  # Phase 5: Resume Parsing & Screening
npx tsx server/test-phase6.ts  # Phase 6: AI Matching, Ranking & Skill Gap
npx tsx server/test-phase7.ts  # Phase 7: Interviews, Notifications & Analytics
npx tsx server/test-phase8.ts  # Phase 8: Advanced AI Recruitment Intelligence
npx tsx server/test-phase9.ts  # Phase 9: Integration, Security & Production Readiness
```

---

## 📊 DBMS Demonstration & SQL Queries

To execute the 15 representative DBMS demonstration queries against the live database:

```bash
npx tsx server/scripts/demo-queries.ts
```

SQL scripts are also available in `docs/sql_demonstrations.sql` for execution in SQLite GUI clients.

---

## 📦 Production Build

To compile and verify the production bundle:

```bash
npm run build
```

Production output will be generated in `dist/`.

---

## 🔒 Security & Compliance Architecture
- **Password Security**: Bcrypt with 10 salt rounds. Plaintext passwords are never stored or logged.
- **Cross-Tenant Authorization**: Strict user ID checks defend against horizontal and vertical privilege escalation.
- **HTTP Security Headers**: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, and `Referrer-Policy`.
- **In-Memory Rate Limiting**: Dedicated rate limiters protecting authentication (`100 req / 15 min`) and AI endpoints (`120 req / 5 min`).
- **Application Immutability**: Historical submitted applications permanently preserve the exact resume snapshot used during submission.
- **Anti-Bias Guardrails**: Natural-language searches referencing protected characteristics (age, gender, religion, race) are blocked with constructive compliance notifications.

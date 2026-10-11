# Setup, Deployment & Operations Guide

**Project:** Resumio — AI Resume Screening & Recruitment Portal  
**Target Environments:** Local Development, Docker Containerization, Production Multi-Tier  

---

## 1. Prerequisites & Environment Requirements

- **Node.js:** `v20.x` or `v24.x` (LTS or current) with npm `10.x+`
- **Git:** `2.x+`
- **Operating System:** Windows 10/11, macOS, or Ubuntu Linux 22.04+
- **Database:** Local SQLite (included) and MongoDB Atlas (Cloud cluster or local MongoDB `7.0+`)
- **Docker & Docker Compose (Optional):** Docker Engine `24.0+`

---

## 2. Local Development Setup

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/sundhip/Resumio.git
cd Resumio
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```

**Sanitized Environment Configuration (`.env`):**
```ini
# Application Server
PORT=3001
NODE_ENV=development

# JWT Authentication Secret
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars_long

# MongoDB Atlas Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/resumio?retryWrites=true&w=majority&appName=ResumioCluster

# Google Gemini API Key (Optional: engages live LLM calls, otherwise deterministic fallbacks run)
GEMINI_API_KEY=your_gemini_api_key_placeholder

# Google OAuth Client ID (Optional)
GOOGLE_CLIENT_ID=your_google_client_id_placeholder
```

### Step 3: Initialize Database & Seed Baseline Records
```bash
npm run seed
```
*Creates SQLite relational schema, enforces PRAGMA foreign keys, and initializes MongoDB collections.*

### Step 4: Launch Development Servers
```bash
npm run dev
```
*Runs backend server on `http://localhost:3001` and Vite frontend on `http://localhost:5173` concurrently.*

---

## 3. Running Automated Verification Suites

Resumio includes comprehensive automated test suites covering all phases of development:

| Test Target | Command | Purpose |
|---|---|---|
| **Master Test Suite (All 17 Suites)** | `npm test` or `npm run test:all` | Executes full synchronous test matrix (Phases 1–11) in ~18 seconds. |
| **End-to-End Smoke Test** | `npm run test:smoke` | Executes live 25-step candidate-to-recruiter hiring lifecycle test. |
| **MongoDB Atlas Persistence** | `npm run test:persistence` | Verifies real document persistence against MongoDB Atlas. |
| **Frontend Production Build** | `npm run build` | Compiles client assets via Vite (< 1s build time). |
| **Code Quality Linter** | `npm run lint` | Analyzes 161 files using Oxlint. |
| **TypeScript Typecheck** | `npx tsc --noEmit` | Verifies full-stack type contracts with zero errors. |

---

## 4. Docker Multi-Stage Containerization

Resumio includes production-ready Docker configurations for containerized deployment:

### Build & Run via Docker Compose:
```bash
docker-compose up --build -d
```

### Verify Container Health:
```bash
docker ps
curl http://localhost:3001/api/health
```

**Health Check Response:**
```json
{
  "status": "healthy",
  "uptime": 128.4,
  "database": {
    "sqlite": "connected",
    "mongodb": "connected"
  },
  "timestamp": "2026-10-11T23:15:00.000Z"
}
```

---

## 5. Security & Operational Best Practices

1. **Secret Isolation:** Never commit `.env` or hardcode credentials in source code. `.gitignore` is pre-configured to exclude environment files and `.system_generated` artifacts.
2. **File Upload Hardening:** Uploaded resumes are confined to `server/uploads/resumes/` and restricted to 10MB maximum size. File paths are sanitized via `path.basename` to prevent directory traversal attacks.
3. **Database Backups:**
   - **SQLite:** Back up `server/database/resumio.db` regularly using SQLite online backup APIs.
   - **MongoDB Atlas:** Automated continuous cloud snapshots are enabled through MongoDB Atlas cluster settings.
4. **Port Release Utility:** If background processes fail to release ports on Windows/Linux, run:
   ```bash
   npm run kill:ports
   ```

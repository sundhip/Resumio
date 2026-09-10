# Resumio - Local Development Setup

## Prerequisites

| Requirement | Version | Notes |
| --- | --- | --- |
| Node.js | >= 18.x | Required for Vite and Express |
| npm | >= 9.x | Comes bundled with Node.js |
| Git | Any recent | To clone the repository |
| Python 3.9+ | Windows only | Needed by better-sqlite3 native build |
| Windows Build Tools | Windows only | Run: npm i -g windows-build-tools |
| SQLite | Embedded | No separate server needed |
| Gemini API Key | Optional | For live AI features; falls back to stubs |

---

## Step-by-Step Setup

### 1. Clone the repository

  git clone https://github.com/sundhip/Resumio.git
  cd Resumio

### 2. Install dependencies

  npm install

> On Windows, if better-sqlite3 build fails:
>   npm install --global --production windows-build-tools
>   npm install

### 3. Create environment file

  copy .env.example .env    (Windows)
  cp .env.example .env      (macOS/Linux)

Edit .env and fill in:

  PORT=3001
  NODE_ENV=development
  JWT_SECRET=your_super_secret_key_here_make_it_long_and_random
  DATABASE_PATH=./server/data/resumio.db
  GEMINI_API_KEY=your_google_gemini_api_key
  AI_MODEL_VERSION=gemini-2.0-flash-exp
  MAX_RESUME_SIZE_MB=10

### 4. Start the backend server

  npx tsx server/index.ts

The backend will:
  - Auto-create the SQLite database at server/data/resumio.db
  - Run all schema migrations
  - Verify database integrity
  - Start on http://localhost:3001

### 5. Start the frontend (in a second terminal)

  npm run dev

The Vite dev server starts on http://localhost:5173
It proxies /api/* calls to the backend at port 3001.

### 6. Open the application

Visit: http://localhost:5173
Register as a Candidate or Recruiter and explore the platform.

---

## Running Tests

  # Full test suite (all 9 phases)
  npx tsx server/test-all.ts

  # Individual phase tests
  npx tsx server/test-phase1.ts
  npx tsx server/test-phase9.ts

  # SQL demo queries (shows live DB output)
  npx tsx server/scripts/demo-queries.ts

---

## Production Build (local preview)

  npm run build
  npx tsx server/index.ts

---

## Common Issues

| Problem | Fix |
| --- | --- |
| better-sqlite3 build fails on Windows | npm i -g windows-build-tools then reinstall |
| Port 3001 already in use | Change PORT in .env |
| JWT_SECRET is not defined | Ensure .env exists and is populated |
| Blank screen on frontend | Ensure backend is running on port 3001 |
| AI features return generic results | Add valid GEMINI_API_KEY to .env |

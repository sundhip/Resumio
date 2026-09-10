# Resumio - Deployment Guide

## Prerequisites
| Requirement | Version | Notes |
| --- | --- | --- |
| Node.js | >= 18.x | Both frontend and backend |
| npm | >= 9.x | Bundled with Node.js |
| Git | Any | Clone the repository |
| Python 3.9+ | Windows only | Required by better-sqlite3 |
| Windows Build Tools | Windows only | npm i -g windows-build-tools |
| SQLite | Embedded | No separate server needed |
| Gemini API Key | Optional | For live AI features |

---

## Option A - Render (Recommended, Free Tier)

1. Go to https://render.com and create a free account
2. Click New > Web Service and connect your GitHub Resumio repository
3. Configure:
   - Build Command: npm install && npm run build
   - Start Command: npx tsx server/index.ts
4. Add Environment Variables in the Render dashboard:
   - PORT=3001
   - NODE_ENV=production
   - JWT_SECRET=your_strong_secret_here
   - DATABASE_PATH=./server/data/resumio.db
   - GEMINI_API_KEY=your_gemini_key (optional)
   - MAX_RESUME_SIZE_MB=10
5. Click Create Web Service - Render auto-deploys!

> NOTE: Free tier SQLite data resets on redeploy.
> Use a Render Disk (paid) or Railway for persistent data.

---

## Option B - Railway (Recommended for Persistent SQLite)

1. Go to https://railway.app and sign in with GitHub
2. Click New Project > Deploy from GitHub Repo
3. Select the Resumio repository
4. Set Build Command: npm run build
5. Set Start Command: npx tsx server/index.ts
6. Add environment variables in the Variables tab
7. Railway has a persistent disk - SQLite survives redeploys

---

## Option C - VPS / DigitalOcean (Full Control)

SSH into Ubuntu 22.04 and run:

  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs git build-essential python3
  git clone https://github.com/sundhip/Resumio.git
  cd Resumio
  npm install
  npm run build
  cp .env.example .env  # then edit .env with production values
  npm install -g pm2
  pm2 start 'npx tsx server/index.ts' --name resumio
  pm2 save && pm2 startup

Then configure Nginx as a reverse proxy and add SSL via Certbot.

---

## Environment Variables Reference

| Variable | Required | Description |
| --- | --- | --- |
| PORT | Yes | Backend port (default: 3001) |
| NODE_ENV | Yes | development or production |
| JWT_SECRET | REQUIRED | JWT signing secret (32+ random chars) |
| DATABASE_PATH | Yes | Path to SQLite file |
| GEMINI_API_KEY | Optional | Google Gemini key for live AI |
| AI_MODEL_VERSION | Optional | Gemini model version |
| MAX_RESUME_SIZE_MB | Optional | Max upload size in MB (default: 10) |
| AUTH_RATE_LIMIT_MAX_REQUESTS | Optional | Max login attempts per window |

---

## Production Checklist

- Strong JWT_SECRET set (32+ characters)
- NODE_ENV=production
- .env is NOT committed to Git (in .gitignore)
- SQLite has persistent disk or backup strategy
- HTTPS/SSL enabled on production host
- Rate limits configured
- All tests pass: npx tsx server/test-all.ts

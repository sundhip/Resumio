# Resumio — Production Deployment & Configuration Guide (Phase 8)

This guide documents the complete deployment architecture, environment configurations, containerization, security policies, and maintenance procedures for the **Resumio — AI Resume Screening & Recruitment Portal**.

---

## 1. System Architecture Overview

Resumio employs a decoupled client-server architecture with cloud database persistence:

```
[ Browser / Web Client ]
       │
       ▼ (HTTPS / WSS)
[ Vercel CDN / Netlify / Nginx ] ──► SPA Frontend (React + Vite + Tailwind CSS)
       │
       ▼ (REST API / JSON / Multipart)
[ Render / Railway / Docker Container ] ──► Backend API (Node.js 20+ / Express / TypeScript)
       │
       ├───────────────────────────────┐
       ▼ (TLS 1.2+ Mongoose Driver)    ▼ (Local Volume / S3)
[ MongoDB Atlas (Cloud Cluster) ]   [ Resume / Avatar File Storage ]
```

---

## 2. Prerequisites & Software Versions

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm` (v10+)
- **Database**: MongoDB Atlas Cluster (M0 Free Tier or M10+ Dedicated)
- **Container Engine (Optional)**: Docker v24+
- **Gemini API Key**: (Optional for LLM features, graceful fallback included)

---

## 3. Environment Variables Reference

Create a `.env` file in the root directory or configure these variables in your hosting dashboard:

| Variable | Required? | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enables production optimizations, disables debug leaks |
| `PORT` | No | `3001` | Port Express listens on (auto-assigned by Render/Railway) |
| `MONGODB_URI` | **Yes** | `mongodb+srv://<user>:<password>@cluster0.abc.mongodb.net/?retryWrites=true&w=majority` | Connection URI for MongoDB Atlas |
| `MONGODB_DATABASE` | No | `resumio_prod` | Production database name in Atlas |
| `JWT_SECRET` | **Yes** | `[cryptographically-random-64-char-string]` | Signs and verifies authentication JWT tokens |
| `ALLOWED_ORIGINS` | **Yes** | `https://resumio.vercel.app,https://yourdomain.com` | Whitelist for CORS to block unauthorized cross-site requests |
| `VITE_API_BASE_URL` | No | `https://api.resumio.com/api` (or `/api` if proxied) | Base API URL consumed by client application |
| `GEMINI_API_KEY` | No | `AIzaSy...` | Powers generative explanations and resume augmentation |

> ⚠️ **Security Warning**: Never commit `.env` or paste real credentials into version control.

---

## 4. Build & Run Commands

### Development
```bash
npm run dev
```

### Production Build
```bash
# 1. Install production & build dependencies
npm ci

# 2. Build frontend client
npm run build

# 3. Start backend API in production mode
NODE_ENV=production npm run server
```

---

## 5. Container Deployment (Docker)

A multi-stage Docker build is provided via `Dockerfile` and `.dockerignore`:

```bash
# Build production Docker image
docker build -t resumio:latest .

# Run container with environment file and volume persistence
docker run -d \
  --name resumio-prod \
  -p 3001:3001 \
  --env-file .env.production \
  -v resumio_uploads:/app/server/uploads \
  resumio:latest
```

---

## 6. Hosting Provider Setup (Recommended Free/Low-Cost Stack)

### A. Database: MongoDB Atlas (Free M0)
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Create an **M0 Free Shared Cluster**.
3. Under **Database Access**, create a user with `readWrite` permissions.
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) or whitelist your hosting provider's IP range.
5. Retrieve your connection string (`mongodb+srv://...`) and supply it as `MONGODB_URI`.

### B. Backend: Render (Free/Starter Web Service)
1. Link your GitHub repository in [Render Dashboard](https://dashboard.render.com).
2. Select **Web Service**, runtime: **Node**.
3. Build Command: `npm ci`
4. Start Command: `npm run server`
5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Atlas connection string>`
   - `MONGODB_DATABASE`: `resumio_prod`
   - `JWT_SECRET`: `<Random Secret>`
   - `ALLOWED_ORIGINS`: `https://<your-vercel-domain>.vercel.app`
6. Add Health Check Path: `/api/health`

### C. Frontend: Vercel (Free Hobby Tier)
1. Import repository in [Vercel Dashboard](https://vercel.com).
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://<your-render-backend>.onrender.com/api`
6. Deploy! Vercel will honor `vercel.json` for client-side SPA routing.

---

## 7. Health & Readiness Verification

Once deployed, verify your service endpoints:

- **Health Check**: `GET /api/health`
  - Returns `{"status":"ok","timestamp":"...","environment":"production"}`
- **Readiness Check**: `GET /api/ready`
  - Validates active MongoDB Atlas ping, connection pool status, and database latency.
- **Resume Preview Access Control**:
  - `GET /api/candidate/resumes/:id/preview`
  - Enforces strict RBAC: Candidates can only access their own files; Recruiters can only access resumes associated with applications to their jobs; Admins have system-wide read access. Unauthorized access receives HTTP `403 Forbidden`.

---

## 8. Backup, Rollback & Disaster Recovery

1. **Database Backups**:
   - Enable Atlas Automated Cloud Backups or run periodic mongodump:
     ```bash
     mongodump --uri="<MONGODB_URI>" --db="resumio_prod" --out="./backups/$(date +%F)"
     ```
2. **File Storage**:
   - Ensure `/app/server/uploads` is mapped to a persistent volume or synced to cloud object storage (S3 / Cloudinary).
3. **Application Rollback**:
   - Git tags and Vercel/Render instant rollbacks can be triggered from their respective dashboards within seconds.

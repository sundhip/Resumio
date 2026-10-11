# Resumio — MongoDB Atlas Integration & Production Guide

This guide details the architecture, setup instructions, security practices, and operational procedures for connecting Resumio to **MongoDB Atlas**.

---

## 1. Architecture Overview

Resumio employs a secure 3-tier architecture:

```
[React Frontend] (Browser Client)
       │
       ▼  (HTTPS / JWT Bearer Authentication)
[Express / TypeScript Backend] (API Server)
       │
       ▼  (TLS Encrypted Driver Connection)
[MongoDB Atlas Cloud Database] (Replica Set)
```

> [!IMPORTANT]
> **Zero Direct Frontend Access:** The React frontend client has no direct access or credentials to MongoDB. All data access, filtering, and authorization are enforced by the Express backend.

---

## 2. Step-by-Step MongoDB Atlas Setup

If you have not provisioned your MongoDB Atlas cluster yet, follow these steps:

### Step 1: Create a MongoDB Atlas Project
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a new organization and project (e.g., `Resumio-Production`).

### Step 2: Deploy a Database Cluster
1. Choose **Build a Database**.
2. For testing/evaluation, select the **M0 Free Shared** cluster tier (or **M10+** for dedicated production scaling).
3. Select a cloud provider (AWS, GCP, or Azure) and a region closest to your backend hosting server (e.g., `ap-south-1` for Mumbai).
4. Name your cluster (e.g., `resumio-cluster`).

### Step 3: Create a Dedicated Database User (Least Privilege)
1. Go to **Security &rarr; Database Access**.
2. Click **Add New Database User**.
3. Choose **Password** authentication.
4. Set a strong username (e.g., `resumio_app_user`) and a secure auto-generated password (min 20 characters).
5. Under **Database User Privileges**, select **Built-in Role: Read and write to any database** (or restrict permissions strictly to `resumio_prod` and `resumio_dev`).
6. Do **NOT** grant cluster administrator or Atlas admin roles to the application service user.

### Step 4: Configure Network Access (IP Allowlist)
1. Go to **Security &rarr; Network Access**.
2. Click **Add IP Address**.
3. Add the static public IP address of your backend deployment server or developer workstation.
4. *Important Security Note regarding `0.0.0.0/0`:*
   > [!WARNING]
   > Do **NOT** leave `0.0.0.0/0` (Allow Access from Anywhere) permanently enabled. Only use it temporarily during testing if your IP changes dynamically, and always ensure strong user credentials and TLS enforcement. For production, specify your server's exact static IP or use VPC Peering / AWS PrivateLink.

### Step 5: Obtain the Connection String
1. Click **Database &rarr; Connect**.
2. Select **Drivers** (Node.js).
3. Copy the SRV connection URI:
   ```
   mongodb+srv://<username>:<password>@resumio-cluster.xxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 3. Environment Configuration

Configure your environment variables in `.env` (copy from `.env.example`). Never commit `.env` to git!

```ini
# Environment
NODE_ENV=development # or 'production' / 'test'

# Server Port
PORT=3001

# MongoDB Atlas URI (Secrets Masked in Logs)
MONGODB_URI=mongodb+srv://resumio_app_user:YourStrongPasswordHere@resumio-cluster.xxxx.mongodb.net/resumio_dev?retryWrites=true&w=majority

# Target Database Name (Default: resumio_dev, resumio_test, or resumio_prod)
MONGODB_DATABASE=resumio_dev

# Legacy SQLite Backup (DO NOT DELETE)
DATABASE_PATH=./server/data/resumio.db
```

---

## 4. Environment Separation

To guarantee data safety, Resumio automatically isolates environments:

| Environment (`NODE_ENV`) | Default Database Name | Data Persistence Mode | Behavior |
| :--- | :--- | :--- | :--- |
| **`development`** | `resumio_dev` | Atlas Cloud if URI set; Local Document Store if unconfigured | Safe local development |
| **`test`** | `resumio_test` | Isolated Test Database | Automated testing; never touches production |
| **`production`** | `resumio_prod` | MongoDB Atlas (Mandatory) | Fails startup immediately if `MONGODB_URI` is missing |

---

## 5. Health & Readiness Endpoints

The backend provides real-time monitoring endpoints for cloud load balancers and orchestrators (e.g., Kubernetes, AWS ECS, Docker):

### `GET /health` (or `/api/health`)
- Reports service uptime and version without exposing database internals or credentials.
```json
{
  "status": "ok",
  "service": "Resumio Enterprise Recruitment Platform API",
  "version": "1.0.0",
  "environment": "development",
  "uptimeSeconds": 142,
  "timestamp": "2026-10-11T14:55:00.000Z"
}
```

### `GET /ready` (or `/api/ready`)
- Evaluates actual database ping reachability.
- Returns **HTTP 200 OK** when database is operational:
```json
{
  "ready": true,
  "status": "connected",
  "database": "resumio_dev",
  "isAtlas": true,
  "provider": "Atlas",
  "pingMs": 28
}
```
- Returns **HTTP 503 Service Unavailable** if the database is disconnected or unreachable.

---

## 6. How to Verify Persistence & Run Tests

### Run Full Master Test Suite (All 11 Suites):
```bash
npm run test:all
```

### Run Dedicated Data Persistence & Restart Verifier:
```bash
npm run test:persistence
```
This tests:
1. **Candidate Persistence:** Creates a Ph.D. profile with 10 sub-sections & skills, resets connection, confirms recovery.
2. **Recruiter & Company:** Creates recruiter and company entity, restarts, verifies relationship.
3. **Job Requisition:** Creates job with embedded skills, restarts, verifies requirements.
4. **Application Pipeline:** Submits application, updates status with `$push` audit log, restarts, confirms history.
5. **Interview & Notifications:** Schedules interview with meeting link and unread notification, verifies recovery.
6. **Update & Delete:** Tests atomic updates, role ownership boundaries, and isolated test record cleanup.

---

## 7. Migration & Backup Policy

- **SQLite Database (`server/data/resumio.db`):** Retained as an immutable legacy archive and migration source.
- **Migration Utility (`npm run migrate:mongo`):** Idempotent script that reads SQLite and populates MongoDB without creating duplicate records.
- **Atlas Backups:** Enable MongoDB Atlas Cloud Backups (Continuous Cloud Backups / Daily Snapshots) for automated point-in-time recovery in production.

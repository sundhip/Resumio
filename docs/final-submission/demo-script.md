# Live Demonstration Script (Phase 12 Presentation Guide)

**Project:** Resumio — AI Resume Screening & Recruitment Portal  
**Duration:** 7–10 Minutes Faculty Walkthrough  
**Objective:** Live demonstration of the end-to-end recruitment lifecycle across Candidate, Recruiter, and Admin roles without mocks on operational logic.

---

## Pre-Demo Checklist

1. **Start Backend & Frontend Services:**
   ```bash
   npm run dev
   ```
   *Verifies backend on port `3001` and Vite frontend on port `5173`.*
2. **Execute System Health Verification:**
   ```bash
   npm test
   ```
   *Confirms all 17 automated test suites pass (100%).*
3. **Prepared Test Credentials:**
   - **Candidate:** `candidate@resumio.demo` / `DemoPassword123!`
   - **Recruiter:** `recruiter@resumio.demo` / `DemoPassword123!`
   - **Admin:** `admin@resumio.demo` / `AdminSecretPass123!`

---

## Demonstration Script & Step-by-Step Walkthrough

### Part 1: System Health & Database Integrity (1 Minute)
1. **Show Terminal:** Display clean output of `npm test` showing 17/17 passing test suites covering all phases.
2. **Database Architecture:** Explain to evaluators that Resumio operates on a dual-database architecture: SQLite for ACID relational guarantees and MongoDB Atlas for document flexibility.

---

### Part 2: Candidate Portal Journey (2.5 Minutes)
1. **Sign in as Candidate:** Navigate to `http://localhost:5173/auth/signin` and log in as `candidate@resumio.demo`.
2. **Candidate Profile (`/candidate/profile`):**
   - Showcase verified education (UC Berkeley, B.S. CS).
   - Showcase experience (Software Engineer at Tech Corp).
   - Showcase verified technical skills (`TypeScript`, `Node.js`, `React`, `MongoDB`, `Docker`).
3. **Resume Management (`/candidate/resume`):**
   - Display uploaded active resume `Alice_Resume_v1.pdf`.
   - Point out the active status toggle and secure file preview.
4. **Job Discovery & Application (`/candidate/jobs`):**
   - Use search filter: Type `TypeScript`.
   - Open job details for *Senior Full Stack Engineer* posted by *CloudScale Systems*.
   - Review required skills (`TypeScript`, `Node.js`, `React`, `MongoDB`) and preferred skills (`Docker`, `GraphQL`).
   - Click **Apply Now**, select active resume, add a personalized cover letter, and submit.
5. **Application Tracker (`/candidate/applications`):**
   - Verify application appears immediately with badge `Applied`.
   - Point out that duplicate application attempts to the same job are automatically disabled.

---

### Part 3: Recruiter Portal Journey & AI Screening (3 Minutes)
1. **Sign out & Sign in as Recruiter:** Log in as `recruiter@resumio.demo`.
2. **Recruiter Dashboard (`/recruiter/dashboard`):**
   - Review real-time dashboard metrics (active jobs, total applications, shortlisting rate).
   - Explain that all counts are computed dynamically from real database records (no hardcoded data).
3. **Applicant Pipeline (`/recruiter/jobs/:jobId/applicants`):**
   - Open applicants for *Senior Full Stack Engineer*.
   - Alice's newly submitted application is visible.
4. **Deterministic AI Screening & Explainable Score:**
   - Review the candidate's computed match score: **92%** (Top Tier).
   - Click to inspect the **Explainable Breakdown**:
     - *Required Skills (45/45):* 100% match on TypeScript, Node.js, React, MongoDB.
     - *Preferred Skills (15/15):* Docker and GraphQL matched.
     - *Experience (20/20):* 5 years verified experience vs 3 years required.
     - *Factual Evidence:* Point out the natural language factual summary grounded directly in candidate profile data.
5. **Progress Application Status:**
   - Change status from `Applied` to `Under Review`.
   - Change status from `Under Review` to `Shortlisted`.
6. **Schedule Video Interview (`/recruiter/interviews`):**
   - Click **Schedule Interview**.
   - Title: *Technical Architecture Deep-Dive*.
   - Set Date: Tomorrow 10:00 AM.
   - Duration: *60 Minutes*.
   - Meeting URL: `https://meet.resumio.ai/technical-interview`.
   - Click **Confirm & Schedule**.

---

### Part 4: Candidate Feedback & In-App Notification (1.5 Minutes)
1. **Switch Back to Candidate Account:**
2. **Real-time Notifications:**
   - Point out the top navigation bell icon displaying an unread counter.
   - Open notifications dropdown:
     - Notification 1: *"Application Shortlisted!"*
     - Notification 2: *"Technical Architecture Deep-Dive scheduled for tomorrow."*
   - Click notification to mark as read; show that the counter decrements.
3. **Candidate Interviews View (`/candidate/interviews`):**
   - Display scheduled interview card with date, time, duration, and direct video conference link.
4. **Application Tracker (`/candidate/applications`):**
   - Status badge now displays `Shortlisted`.

---

### Part 5: Admin & Research Pipeline Dashboard (1.5 Minutes)
1. **Sign in as Admin:** Log in as `admin@resumio.demo`.
2. **Admin Dashboard (`/admin`):**
   - Show platform-wide user metrics, active jobs, and moderation controls.
3. **Research Pipeline (`/admin/research`):**
   - **Tab 1 (Dataset Management):** Show the 33-sample benchmark dataset with a 4.0x class imbalance ratio (Frontend 12, Backend 12, DevOps 6, Security 3).
   - **Tab 2 (Stratified Splits):** Show zero-leakage partitions between train and test splits.
   - **Tab 3 (Comparative Experiments):** Show baseline vs. augmented classifier metrics (+3.7% Macro-F1 improvement).
   - **Tab 4 (Matching & IR Ranking Benchmarks):**
     - Display IR Ranking cards: $\text{MRR} = 1.0$, $\text{NDCG}@3 = 1.0$.
     - Display Matching accuracy: Pearson correlation $r = 0.92$, $\text{MAE} = 10.93$.
     - Display System latency: $< 1.0\text{ms}$ per evaluation.
   - Emphasize to evaluators: Synthetic research data is strictly isolated within `research_datasets` and never touches production candidate records.

---

## Fallback Contingency Plan

| Scenario | Prepared Fallback Action |
|---|---|
| **Port Conflict on startup** | Run `npm run kill:ports` to cleanly release ports `3001` and `5173`. |
| **External Gemini API Unreachable** | The system automatically engages local deterministic fallbacks for regex skill tokenization and template question generation, notifying the user transparently. |
| **Database Reset Needed** | Run `npm run seed` to restore clean demonstration records in under 3 seconds. |

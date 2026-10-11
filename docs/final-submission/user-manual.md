# Resumio User Manual

**Project:** Resumio — AI Resume Screening & Recruitment Portal  
**Scope:** Guide for Candidates, Recruiters, and System Administrators  

---

## 1. Candidate User Guide

### 1.1 Account Registration & Sign In
1. Navigate to `/auth/signup`.
2. Select the **Candidate** role tab.
3. Enter your full name, email, and password (minimum 8 characters).
4. Click **Create Account**; upon successful registration, you will be redirected to the candidate dashboard.

### 1.2 Profile Completion & Verified Skills
1. Click **Profile** in the top navigation bar (`/candidate/profile`).
2. Add your contact information, headline, and bio.
3. Click **Add Education** to record your degrees, institutions, and graduation years.
4. Click **Add Experience** to record previous job titles, companies, and responsibilities.
5. In the **Skills** section, add your technical proficiencies (e.g. `TypeScript`, `Node.js`, `React`, `Docker`) and select your experience tier.

### 1.3 Resume Upload & Version Management
1. Navigate to **Resumes** (`/candidate/resume`).
2. Drag and drop your resume file (`.pdf`, `.docx`, or `.txt`, up to 10MB).
3. The system parses your document and displays the stored version.
4. If uploading multiple resumes, select which resume is marked as **Active**. *Note: Any job applications previously submitted will immutably retain the specific resume version submitted at that time.*

### 1.4 Job Search & Application Submission
1. Browse available openings under **Jobs** (`/candidate/jobs`).
2. Use the search bar to query by title, company, or technical stack.
3. Filter by work mode (Remote, Hybrid, On-site) and employment type.
4. Click on a job to review required skills, preferred qualifications, and compensation.
5. Click **Apply Now**, select your preferred resume, write an optional cover letter, and submit.

### 1.5 Tracking Applications & Scheduled Interviews
1. Open **Applications** (`/candidate/applications`).
2. View real-time review status badges (`Applied`, `Under Review`, `Shortlisted`, `Rejected`).
3. View interview appointments under **Interviews** (`/candidate/interviews`) with date, duration, and direct video conference links.
4. In-app notifications in the top bar alert you immediately when your application status changes.

---

## 2. Recruiter User Guide

### 2.1 Company Profile Setup
1. Log in with your recruiter credentials.
2. Navigate to **Company Profile** (`/recruiter/company`).
3. Enter your company name, website, industry, and description to brand your job postings.

### 2.2 Creating & Publishing Job Openings
1. Navigate to **Post a Job** (`/recruiter/jobs/create`).
2. Fill in the job title, work mode (Remote/Hybrid/On-site), location, and employment type.
3. Specify experience requirements (minimum and maximum years).
4. Under **Required Skills**, enter must-have competencies (e.g., `TypeScript`, `Node.js`, `React`, `MongoDB`).
5. Under **Preferred Skills**, enter bonus competencies (e.g., `Docker`, `GraphQL`).
6. Set status to **Published** to make the job instantly discoverable to candidates.

### 2.3 Applicant Pipeline & Deterministic AI Screening
1. Navigate to **Applicants** (`/recruiter/jobs/:jobId/applicants`).
2. Review the list of applicants sorted by AI Match Score.
3. Click on any applicant to open their **Candidate Profile & Match Analysis**:
   - **Score Breakdown:** Inspect exact points earned across Required Skills (45%), Preferred Skills (15%), Experience (20%), Title Relevance (10%), and Education (10%).
   - **Matched vs. Missing Skills:** Review highlighted green badges for confirmed skills and red badges for missing skills.
   - **Factual Evidence Summary:** Read the transparent factual explanation summarizing the candidate's alignment.

### 2.4 Status Progression & Shortlisting
1. In the applicant detail modal, use the status dropdown to update the candidate:
   - Move from `Applied` to `Under Review`.
   - Move from `Under Review` to `Shortlisted` or `Rejected` (with optional candidate feedback note).
2. The candidate receives an automatic in-app notification of the status change.

### 2.5 Scheduling Interviews
1. Click **Schedule Interview** from the applicant page or navigate to `/recruiter/interviews`.
2. Select the applicant and job.
3. Enter the interview title (e.g., *Technical Deep-Dive*), interview type (Video/On-site), scheduled date/time, duration, and meeting link.
4. Click **Confirm & Schedule**. The interview is persisted, and the candidate is notified immediately.

### 2.6 Recruiter Dashboard & Analytics
1. Access `/recruiter/dashboard` and `/recruiter/analytics` to monitor hiring pipeline throughput, score distribution histograms, and active job metrics.

---

## 3. Administrator User Guide

### 3.1 Platform Overview & Statistics
1. Log in with authorized administrative credentials.
2. Navigate to **Admin Dashboard** (`/admin`).
3. Inspect real-time platform statistics computed directly from the live database: Total Users, Candidates, Recruiters, Active Jobs, and Total Applications.

### 3.2 User Moderation
1. Access the **Users** tab to view all registered accounts.
2. Filter by role (`candidate`, `recruiter`, `admin`) and account status (`active`, `inactive`).

### 3.3 Research Pipeline & Benchmarks Dashboard
1. Navigate to **Research Pipeline** (`/admin/research`).
2. **Dataset Management Tab:** View the 33-sample benchmark dataset across Frontend, Backend, DevOps, and Security domains.
3. **Comparative Experiments Tab:** Review baseline vs. augmented text classification metrics (Macro-F1, Confusion Matrix).
4. **Matching & IR Ranking Benchmarks Tab:** Inspect Information Retrieval ranking metrics ($\text{MRR} = 1.0$, $\text{NDCG}@3 = 1.0$) and engine latency distributions ($< 1.0\text{ms}$).

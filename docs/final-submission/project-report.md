# Resumio Academic Project Report

**Project Title:** Resumio — AI Resume Screening & Recruitment Portal  
**Academic Degree:** Bachelor of Technology / Master of Computer Applications (Final Year Project)  
**Academic Year:** 2026  
**Methodological Inspiration:** *"LLM-based data augmentation for text classification on imbalanced datasets: A case study on fake news detection"*  

---

## Abstract

Modern recruitment platforms face severe limitations when processing candidate applications at scale. Keyword-based Applicant Tracking Systems (ATS) suffer from rigid syntax matching that rejects qualified applicants who use unlisted synonyms, while unconstrained Large Language Model (LLM) screeners introduce non-deterministic scoring, hallucinations, and unexplainable rejections. 

**Resumio** is an enterprise-grade AI Resume Screening and Recruitment Portal engineered to resolve these challenges. The system introduces a **deterministic 5-component matching formula** ($0$–$100$ scale) that evaluates required skills ($45\%$), preferred skills ($15\%$), verified experience ($20\%$), job title relevance ($10\%$), and educational credentials ($10\%$), accompanied by an **explainable score breakdown** summing mathematically to 100% of the final score. Resumio employs a **dual-database persistence architecture** pairing SQLite for local ACID relational guarantees with MongoDB Atlas for scalable document storage of rich resume metadata and isolated research experiments. 

Additionally, Resumio adapts data augmentation and evaluation principles from a peer-reviewed research paper on imbalanced text classification, demonstrating a **+3.7% Macro-F1 improvement** using quality-filtered synthetic samples, an **Information Retrieval MRR of 1.000**, an **NDCG@3 of 1.000**, and a **0.92 Pearson correlation** with human ground truth. All 17 automated test suites across Phases 1 through 11 pass with 100% verification.

---

## Chapter 1 — Introduction

### 1.1 Background
The rapid growth of online job boards has created an asymmetry in the hiring market: corporate job postings frequently receive hundreds or thousands of applicants within days. To manage applicant volume, organizations rely on automated screening tools. However, existing automated screening methodologies are either overly simplistic or insufficiently transparent.

### 1.2 Problem Statement
1. **Keyword ATS Rigidity:** Traditional ATS software performs rudimentary keyword matching. Candidates possessing genuine competencies who describe their experience using alternative phrasing are penalized or silently rejected.
2. **LLM Non-Determinism & Hallucination:** Asking a commercial LLM to "grade this resume from 1 to 100" produces non-deterministic scores that vary between identical runs, hallucinates skills absent from the text, and cannot be audited for regulatory compliance.
3. **Data Loss & Fragmented Architecture:** Recruitment data involves both strict relational workflows (applications, interview calendars, status transitions) and unstructured documents (resumes, multi-page portfolios). A single database paradigm often forces architectural compromises.

### 1.3 Project Objectives
- Engineer a **three-tier web architecture** connecting a modern React 19 frontend with a robust Express/TypeScript backend.
- Implement **dual-database persistence** utilizing SQLite for relational transaction enforcement and MongoDB Atlas for document storage.
- Construct a **deterministic 5-component scoring engine** providing 100% reproducible match scores and mathematically explainable evidence.
- Build complete hiring workflows across **Candidate, Recruiter, and Admin** personas with strict JWT Role-Based Access Control (RBAC).
- Incorporate **ethical AI guardrails** to prevent algorithmic bias on protected personal characteristics.
- Implement and evaluate a **research data augmentation pipeline** adapted from the faculty-provided paper.

---

## Chapter 2 — System Architecture & Technology Stack

### 2.1 System Architecture Overview
Resumio utilizes a modular, decoupled three-tier architecture:
- **Presentation Layer (Frontend):** React 19, TypeScript, Vite, Tailwind CSS, Lucide React icons.
- **Application Logic Layer (Backend):** Node.js (ESM), Express.js, TypeScript, JWT authentication, Multer multipart streaming, and security shields.
- **Persistence Layer (Dual-Database):** 
  - SQLite Relational Engine (`sql.js` / `better-sqlite3`) enforcing foreign key constraints and transactional integrity.
  - MongoDB Atlas Cloud Database (`mongoose` / `mongodb`) managing unstructured resume texts, match explanations, and isolated research collections.
- **Intelligence Layer:** Deterministic scoring engine with Google Gemini LLM fallback pattern.

### 2.2 Technology Stack Justification
- **React 19 & TypeScript:** Ensures end-to-end type safety between backend API contracts and client components, eliminating runtime contract mismatches.
- **Vite:** Delivers sub-second development builds (< 1s production Rollup bundle for 1,900+ modules).
- **Tailwind CSS:** Utility-first styling providing consistent responsive design across mobile, tablet, and desktop viewports without stylesheet bloat.
- **SQLite + MongoDB Dual Persistence:** SQLite guarantees zero-latency relational consistency for applications and interviews; MongoDB Atlas delivers elastic document storage for rich resume data.

---

## Chapter 3 — Database Design & Data Integrity

### 3.1 Logical Entity-Relationship Model
- **Users & Profiles:** One-to-one relationship between `users` and role-specific `candidate_profiles` or `recruiter_profiles`.
- **Jobs & Skills:** One-to-many relationship between `jobs` and normalized relational tables `job_required_skills` and `job_preferred_skills`.
- **Applications & Immutability:** One-to-many relationship between `candidate_profiles` and `applications`. Each application binds permanently to the specific `resume_id` submitted, ensuring historical audit integrity across future resume updates.
- **Interviews & Notifications:** One-to-one relationship between `interviews` and `applications`, with automatic creation of in-app `notifications` records for both parties.

### 3.2 Integrity Auditing
SQLite enforces `PRAGMA foreign_keys = ON;` and `ON DELETE CASCADE`. Phase 11 automated verification executed `verifyDatabaseIntegrity()`, reporting **0 foreign key violations** and **0 orphan records**.

---

## Chapter 4 — AI Screening & Matching Methodology

### 4.1 The 5-Component Deterministic Matching Formula
Resumio calculates applicant relevance using a weighted formula:
$$\text{Score} = (S_{rs} \times 0.45) + (S_{ps} \times 0.15) + (S_{exp} \times 0.20) + (S_{title} \times 0.10) + (S_{edu} \times 0.10)$$

1. **Required Skills ($45\%$):** Ratio of job required skills verified in candidate profile/resume after alias normalization.
2. **Preferred Skills ($15\%$):** Ratio of bonus qualifications matched.
3. **Experience Alignment ($20\%$):** Verified candidate experience years evaluated against job minimum requirements.
4. **Job Title Relevance ($10\%$):** Jaccard token overlap between candidate headline and target job title.
5. **Education Tier ($10\%$):** Credential scoring based on verified academic degrees.

### 4.2 Explainable AI Breakdown
Recruiters receive a transparent JSON evidence breakdown showing the exact points awarded per component, highlighted matched vs. missing skills, and a factual summary grounded in candidate records. The sum of components mathematically equals 100% of the final score.

### 4.3 Anti-Bias Guardrails
The natural language candidate search service intercepts search queries targeting protected characteristics (age, gender, ethnicity, marital status) before database querying, rejecting discriminatory filters with a polite policy explanation.

---

## Chapter 5 — Research Methodology & Empirical Evaluation

### 5.1 Adaptation of the Research Paper
- **Original Paper Focus:** *"LLM-based data augmentation for text classification on imbalanced datasets: A case study on fake news detection"* (Fawaz et al., 2024) studied fake news detection.
- **Resumio Adaptation:** Adapts the paper's *methodological principles*—stratified partitioning, controlled LLM text generation, near-duplicate rejection filtering, and macro-F1 evaluation—to imbalanced recruitment job posting classification.

### 5.2 Benchmark Dataset & Class Imbalance
The benchmark dataset contains 33 verified job postings across 4 domains: Frontend (12), Backend (12), DevOps (6), and Security (3), exhibiting an extreme **4.0x class imbalance ratio**.

### 5.3 Measured Experimental Findings
1. **Supervised Text Classification (MNB Classifier):**
   - Baseline Macro-F1: **0.812**
   - Augmented Macro-F1 (with quality-filtered synthetic samples): **0.849** (**+3.7% improvement**).
2. **Resume-Job Matching Evaluation (5 Expert Scenarios):**
   - **Pearson Correlation ($r$):** **0.92** (Strong positive alignment with human evaluators).
   - **Mean Absolute Error (MAE):** **10.93** on a 100-point scale.
   - **Factual Explanation Consistency:** **100%**.
3. **Information Retrieval & Candidate Ranking Metrics:**
   - **Mean Reciprocal Rank (MRR):** **1.000** (Top candidate is relevant at rank 1).
   - **NDCG@3:** **1.000** (Optimal ranking order preserved).
   - **Inference Latency:** $< 1.0\text{ms}$ per candidate-job pair.
4. **Data Isolation:** Zero synthetic research records were inserted into production candidate, recruiter, or application collections.

---

## Chapter 6 — Testing, Security & Quality Assurance

### 6.1 Master Automated Test Suite
Resumio maintains 17 automated test suites covering all phases:
- `test-phase1.ts`: Auth, password hashing, and user models.
- `test-phase2.ts`: Candidate deep profiles and resume metadata.
- `test-mongodb.ts` & `verify-atlas-persistence.ts`: MongoDB Atlas persistence.
- `test-phase3.ts`: Job management and search.
- `test-ai-foundation.ts` & `test-phase4.ts`: AI parsing and applications.
- `test-research-pipeline.ts` & `test-phase5.ts`: LLM data augmentation.
- `test-phase6.ts` & `test-advanced-matching.ts`: Deterministic matching and explainability.
- `test-phase7.ts`: Interview scheduling and notifications.
- `test-deployment-readiness.ts` & `test-phase8.ts`: Production configuration.
- `test-phase9.ts`: Security boundaries, anti-IDOR, prompt injection, and path traversal.
- `test-phase10.ts`: Matching MAE, IR ranking benchmarks, and latency profiling.
- `test-phase11-smoke.ts`: 25-step live integration smoke test verifying the complete hiring lifecycle.

**Final Result:** **17 out of 17 test suites pass synchronously (100% success rate).**

### 6.2 Security Boundaries
- **Anti-IDOR:** All queries verify ownership against authenticated JWT user IDs.
- **Prompt Injection Delimiters:** Untrusted text wrapped in `<untrusted_document>` delimiters.
- **CSV Formula Sanitization:** Leading `=`, `+`, `-`, `@` characters prefixed with `'`.
- **Path Traversal Defense:** Filenames sanitized via `path.basename` and confined to root upload directory.

---

## Chapter 7 — Conclusion & Limitations

### 7.1 Conclusion
Resumio successfully achieves all capstone project objectives, delivering a transparent, ethical, and performant recruitment portal that replaces arbitrary keyword ATS screening with explainable deterministic matching, backed by dual-database persistence and empirical research validation.

### 7.2 Current Limitations & Future Work
- **Benchmark Dataset Volume:** The research classification dataset contains 33 samples; scaling to thousands of enterprise samples would provide broader domain coverage.
- **Native Video Calling:** Currently integrates external meeting URLs; future iterations could incorporate embedded WebRTC video calling directly within the application.
- **Live LLM API Dependency:** External generative features depend on active API keys; deterministic local fallbacks ensure uninterrupted operation when keys are absent.

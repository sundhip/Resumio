# Resumio Final Presentation Slides (Phase 12 Academic Slide Deck)

**Project Title:** Resumio — AI Resume Screening & Recruitment Portal  
**Presentation Context:** Final Year Capstone Project / University Examination  
**Recommended Duration:** 12–15 Minutes  

---

## Slide 1: Title & Overview
### **Resumio: AI Resume Screening & Recruitment Portal**
- **Domain:** Artificial Intelligence, Cloud Databases (MongoDB Atlas + SQLite), Web Architecture
- **Tech Stack:** React 19, TypeScript, Node.js, Express, Tailwind CSS, SQLite, MongoDB Atlas, Google Gemini
- **Key Focus:** Explainable Deterministic Matching, Ethical AI Screening, Dual-Database Persistence, and Research Data Augmentation

---

## Slide 2: Problem Statement & Motivation
- **Flaws in Traditional ATS:**
  - Inflexible keyword matching drops qualified candidates who use valid alternative phrasing.
  - Zero explainability: Candidates receive generic rejections without feedback.
- **Flaws in Pure LLM Screeners:**
  - Non-deterministic variance across identical runs.
  - Hallucination of credentials and unexplainable black-box scoring.
- **Resumio Solution:**
  - Deterministic 5-component scoring ($0$–$100$) combined with semantic LLM advisory assistance, grounded in verified candidate evidence.

---

## Slide 3: Project Objectives & Scope
1. **Explainable AI Matching:** Implement transparent mathematical scoring (Required Skills 45%, Preferred 15%, Experience 20%, Title 10%, Education 10%).
2. **Dual-Database Persistence:** Integrate SQLite for ACID transactional integrity and MongoDB Atlas for flexible document storage.
3. **End-to-End Workflow:** Provide complete hiring lifecycles (Job Search $\rightarrow$ Application $\rightarrow$ Screening $\rightarrow$ Shortlisting $\rightarrow$ Interviews $\rightarrow$ Notifications).
4. **Security & Ethics:** Implement anti-bias guardrails in search, anti-IDOR isolation, prompt injection shields, and CSV formula sanitization.
5. **Research Evaluation:** Adapt methodology from the faculty-provided research paper to imbalanced recruitment classification and IR ranking.

---

## Slide 4: System Architecture
- **Three-Tier Architecture:**
  - **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS (Single Page Application).
  - **Backend Server:** Node.js + Express.js + TypeScript (Stateless REST API, JWT RBAC).
  - **Data Layer:** SQLite (Local relational engine) + MongoDB Atlas (Cloud document database via Mongoose).
  - **AI Layer:** Deterministic scoring engine with Google Gemini LLM fallback pattern.

---

## Slide 5: Technology Stack Justification
| Layer | Choice | Justification |
|---|---|---|
| **Frontend** | React 19 & Tailwind CSS | Modular component architecture, zero CSS drift, responsive UI |
| **Language** | TypeScript | End-to-end type safety, preventing API contract regressions |
| **Relational DB** | SQLite | PRAGMA foreign keys, unique indexes, zero-latency ACID transactions |
| **Document DB** | MongoDB Atlas | Flexible schema for complex parsed resumes, explanations, and research data |
| **Auth** | JWT + Bcrypt | Stateless token authorization with 10-round salted password security |

---

## Slide 6: Candidate Portal Journey
- **Deep Profile:** Education, verified skills, and employment history tracking.
- **Resume Management:** Multi-format parser (PDF/DOCX/TXT), active resume selection, and historical resume immutability.
- **Job Discovery:** Full-text keyword search and filtering by location, work mode, and employment type.
- **Application Tracker:** Real-time status progression (`Applied` $\rightarrow$ `Under Review` $\rightarrow$ `Shortlisted` $\rightarrow$ `Rejected`).
- **Interview Appointments:** Direct access to scheduled video meetings and calendar dates.

---

## Slide 7: Recruiter Portal & Applicant Pipeline
- **Job Posting Management:** Define title, compensation, required must-have skills, and preferred bonus skills.
- **Applicant Pipeline:** Sort and filter applicants by AI Match Score and review status.
- **Candidate Detail Modal:** Inspect candidate deep profiles, verified contact details, and original submitted resumes.
- **Status Progression:** Seamless transition through hiring stages with automatic candidate notifications.
- **Recruitment Analytics:** Real-time candidate quality histograms and hiring pipeline metrics computed from database counts.

---

## Slide 8: Deterministic AI Matching & Explainable Scoring
- **Scoring Formula:**
  $$\text{Final Score} = (S_{rs} \times 0.45) + (S_{ps} \times 0.15) + (S_{exp} \times 0.20) + (S_{title} \times 0.10) + (S_{edu} \times 0.10)$$
- **Explainable Evidence:**
  - Mathematical breakdown summing to exactly 100% of final score.
  - Transparent badges for matched vs. missing skills.
  - Factual natural-language summary grounded in verified profile data.
- **Ethical AI Guardrails:** Protected characteristics (age, gender, ethnicity) are strictly excluded from ranking algorithms.

---

## Slide 9: Dual-Database Persistence & Data Model
- **Logical Schema Entities:**
  - `users` $\rightarrow$ `candidate_profiles` / `recruiter_profiles`
  - `jobs` $\rightarrow$ `job_required_skills` / `job_preferred_skills`
  - `applications` $\rightarrow$ `application_status_history`
  - `interviews` & `notifications`
- **Data Integrity Guarantee:** Zero foreign key violations, zero orphan records, and asynchronous dual-persistence to MongoDB Atlas.

---

## Slide 10: Research Pipeline & Augmentation Experiments
- **Methodological Inspiration:** Adapted from the paper *"LLM-based data augmentation for text classification on imbalanced datasets: A case study on fake news detection"* (Adapted to recruitment classification).
- **Benchmark Dataset:** 33 samples across Frontend (12), Backend (12), DevOps (6), and Security (3) — **4.0x Imbalance Ratio**.
- **Quality Filters:** Length check, exact duplicate rejection, and Jaccard near-duplicate filter ($\ge 0.85$).
- **Data Isolation:** All synthetic items tagged with `provenance: "synthetic_llm"` and stored in isolated `research_datasets`.

---

## Slide 11: Experimental Findings & IR Ranking Benchmarks
- **Supervised Text Classification (MNB Classifier):**
  - Baseline Macro-F1: **0.812** $\rightarrow$ Augmented Macro-F1: **0.849** (**+3.7% improvement**).
- **Candidate-Job Matching Evaluation (5 Annotated Scenarios):**
  - **Pearson Correlation ($r$):** **0.92** (Strong alignment with human expert judgment).
  - **Mean Absolute Error (MAE):** **10.93** on a 100-point scale.
  - **Factual Explanation Consistency:** **100%**.
- **Information Retrieval Ranking Metrics:**
  - $\text{MRR} = \mathbf{1.000}$ (Top candidate is relevant at rank position 1).
  - $\text{NDCG}@3 = \mathbf{1.000}$ (Optimal ranking order preserved).
  - **Inference Latency:** $< 1.0\text{ms}$ per candidate-job pair.

---

## Slide 12: Testing, Security & Quality Assurance
- **17 Automated Test Suites:** 100% passing across all 11 development phases (~18s execution).
- **Live Smoke Test:** 25-step end-to-end integration lifecycle test with 0 mocks on business logic.
- **Security Defenses:**
  - Anti-IDOR object-level access verification on all records.
  - Prompt injection neutralization via untrusted boundary delimiters.
  - Path traversal and CSV formula injection defenses verified.
- **Code Quality:** Zero TypeScript compilation errors, zero Oxlint errors across 161 files, and sub-second Vite production build.

---

## Slide 13: Project Limitations
1. **Benchmark Dataset Scale:** Research text benchmark currently contains 33 verified samples; larger enterprise datasets would be required for commercial ML training.
2. **Live AI API Quota:** Live external Google Gemini calls require an active API key; deterministic local fallbacks run when key is absent.
3. **Single Video Provider:** Video interview links are user-configurable URLs rather than native embedded WebRTC streams.

---

## Slide 14: Conclusion & Live Demonstration Transition
- **Summary:** Resumio delivers an enterprise-grade, explainable, and secure recruitment platform combining deterministic scoring accuracy with modern cloud database persistence.
- **Verification:** 17/17 automated test suites passing, clean production build, and verified academic documentation.
- **Next Step:** Live interactive demonstration across Candidate, Recruiter, and Admin portals.

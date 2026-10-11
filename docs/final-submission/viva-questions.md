# Final Viva Questions & Answers (Phase 12 Comprehensive Prep)

**Project:** Resumio — AI Resume Screening & Recruitment Portal  
**Target Audience:** Final Year University Evaluation / Academic Project Viva  

---

## Part 1: Project Overview & Fundamentals

### Q1: What problem does Resumio solve?
**A:** Traditional hiring suffers from two extremes: manual keyword-based ATS systems that reject qualified talent due to rigid keyword matching, and unconstrained LLM screeners that hallucinate qualifications and obscure scoring criteria. Resumio provides an explainable, dual-database recruitment platform featuring deterministic 5-component scoring, transparent evidence breakdowns, bias guardrails, and automated recruitment workflows.

### Q2: What are the main modules of the application?
**A:** 
1. **Candidate Portal:** Profile management (education, skills, experience), resume uploading/versioning, job search, application tracker, and in-app notifications.
2. **Recruiter Portal:** Job posting CRUD, applicant pipeline, deterministic AI screening, explainable score breakdown, interview scheduling, and recruitment analytics.
3. **Admin Portal:** System-wide database metrics, user moderation, and research experimentation dashboards.
4. **AI & Intelligence Service:** 5-component matching engine, natural language semantic search with bias protection, interview question generation, and duplicate resume detection.
5. **Research Evaluation Engine:** Benchmark classification, LLM data augmentation pipeline, and Information Retrieval ranking evaluation (MRR, NDCG).

### Q3: What is the difference between candidate and recruiter workflows?
**A:** Candidates interact with published jobs, manage their private resumes and profiles, submit applications, track review progression, and receive interview appointments. Recruiters manage company jobs, inspect applicants for jobs they own, run AI screening, transition candidate statuses (`Applied` $\rightarrow$ `Under Review` $\rightarrow$ `Shortlisted` / `Rejected`), and schedule interviews. Roles are strictly partitioned via JWT RBAC.

---

## Part 2: Database Management & Dual-Persistence (DBMS)

### Q4: Why did you use both SQLite and MongoDB?
**A:** To leverage the complementary strengths of relational and document databases:
- **SQLite (Relational):** Guarantees ACID transactional compliance, PRAGMA foreign key constraints, and unique indexing for structured entities like user credentials, jobs, applications, and interview appointments.
- **MongoDB Atlas (Document):** Provides flexible schema scalability for unstructured, nested data such as multi-page parsed resume texts, 5-component explainable match breakdowns, and isolated research experiment runs.
- **Dual-Persistence:** Mutations write synchronously to SQLite and asynchronously dual-persist to MongoDB Mongoose models.

### Q5: How do you prevent orphan records in SQLite?
**A:** We enforce `PRAGMA foreign_keys = ON;` upon connection initialization and define `ON DELETE CASCADE` across all child relationships (`candidate_profiles`, `jobs`, `applications`, `interviews`). An automated integrity function (`verifyDatabaseIntegrity()`) executes `PRAGMA foreign_key_check` and verifies zero orphan records.

### Q6: How is data consistency maintained if a resume is updated after applying?
**A:** **Resume Immutability Pattern:** When an application is submitted, it binds permanently to the specific `resume_id` submitted at that moment. If the candidate later uploads a newer active resume (`Resume V2`), historical applications continue referencing `Resume V1`.

### Q7: What MongoDB collections exist in Resumio?
**A:** 
1. `users` (Account authentication and role data)
2. `candidate_profiles` (Deep profile, education, skills, experience)
3. `jobs` (Recruiter job postings, required and preferred skills)
4. `applications` (Candidate application submissions and status)
5. `interviews` (Scheduled interview appointments)
6. `notifications` (User alerts and read states)
7. `research_datasets` (Standardized research text classification samples)
8. `research_experiments` (Baseline vs. augmented evaluation metrics)

---

## Part 3: Backend, Security & API Architecture

### Q8: How does the frontend communicate with the backend?
**A:** Through a stateless RESTful API served over HTTP/HTTPS by Express.js. Requests carry JSON payloads or `multipart/form-data` for file uploads, authenticated via `Authorization: Bearer <JWT>` headers.

### Q9: How is authentication and role-based access control (RBAC) implemented?
**A:**
1. Upon login, the server verifies the password using `bcrypt.compare()` against the 10-round salted hash.
2. A digitally signed JWT containing `{ userId, role }` is issued with a 7-day expiration.
3. Protected endpoints invoke `authenticateToken` middleware, followed by `requireRole(['recruiter'])` or `requireRole(['admin'])` to reject unauthorized access with HTTP 401 or 403.

### Q10: How do you prevent Insecure Direct Object References (IDOR)?
**A:** The backend never trusts client IDs blindly. On candidate profile endpoints, the query filters strictly by `WHERE user_id = req.user.id`. On recruiter applicant endpoints, the query joins against `jobs j` and verifies `WHERE j.recruiter_id = req.user.id`. Recruiters cannot access applicants for jobs they do not own.

### Q11: What security defenses are implemented against prompt injection?
**A:** All untrusted user inputs (such as resume text or job descriptions) pass through `sanitizeUntrustedInput()` to neutralize adversarial instructions (e.g. `Ignore previous instructions...`) and are wrapped in strict delimiters (`<untrusted_document label="resume">...</untrusted_document>`) before passing to any LLM prompt.

### Q12: How do you prevent CSV formula injection?
**A:** When exporting research datasets or applicant lists, any text field starting with `=`, `+`, `-`, or `@` is prepended with a single quotation mark (`'`), neutralizing executable spreadsheet macros.

---

## Part 4: AI Screening & Matching Methodology

### Q13: How is a candidate's match score calculated?
**A:** Using a deterministic 5-component weighted formula:
$$\text{Score} = (S_{rs} \times 0.45) + (S_{ps} \times 0.15) + (S_{exp} \times 0.20) + (S_{title} \times 0.10) + (S_{edu} \times 0.10)$$
- **Required Skills ($45\%$):** Ratio of job required skills matched by candidate.
- **Preferred Skills ($15\%$):** Ratio of preferred bonus skills matched.
- **Experience ($20\%$):** Candidate verified experience years vs. minimum requirement.
- **Title Relevance ($10\%$):** Jaccard token overlap between candidate headline and job title.
- **Education ($10\%$):** Degree qualification tier (Doctorate/Master's = 100%, Bachelor's = 85%, Associate's = 65%).

### Q14: Why is deterministic scoring preferred over asking an LLM for a score?
**A:** LLMs are non-deterministic: the same resume sent twice can return differing scores (e.g. 85% then 72%), can hallucinate unlisted skills, and cannot provide mathematical auditability. Deterministic scoring produces 100% reproducible, verifiable results while using LLMs strictly for semantic text understanding.

### Q15: How does the system handle an external AI provider timeout or outage?
**A:** Resumio implements a graceful fallback pattern:
1. When the external Gemini API is unreachable or times out, the system automatically falls back to local deterministic rule-based algorithms (regex skill tokenization, deterministic keyword scoring, and template-based interview questions).
2. The UI transparently notifies the recruiter that local deterministic scoring was utilized.

### Q16: How does Resumio protect against hiring bias in AI candidate search?
**A:** The `NaturalLanguageSearchService` includes an anti-bias regex interceptor that parses candidate search queries. If a recruiter attempts to filter by age, gender, race, religion, or protected personal characteristics (e.g. "Find young male developers"), the query is rejected before execution with a clear policy violation explanation.

---

## Part 5: Research Methodology & Evaluation (Phase 10)

### Q17: What was the research paper provided for this project?
**A:** *"LLM-based data augmentation for text classification on imbalanced datasets: A case study on fake news detection."*

### Q18: Did that paper study recruitment?
**A:** **No.** The paper studied **fake news detection** under class imbalance. Resumio explicitly adapts its *experimental methodology*—specifically stratified splitting, controlled LLM synthetic generation, near-duplicate rejection filtering, and macro-F1 evaluation—to imbalanced recruitment job posting classification.

### Q19: What is class imbalance and why does it matter?
**A:** Class imbalance occurs when certain classes have significantly fewer examples than others (e.g., in our benchmark dataset, Frontend has 12 samples while Security has only 3, a 4.0x ratio). Standard accuracy metrics can be misleading because a model predicting only majority classes achieves high overall accuracy while failing entirely on minority classes.

### Q20: Why are Macro-F1 and Confusion Matrices appropriate for imbalanced data?
**A:** Macro-F1 calculates the harmonic mean of precision and recall for each class independently and averages them unweighted, treating minority classes with equal importance. Confusion matrices reveal whether minority instances are being misclassified into majority categories.

### Q21: What were your measured results for the research evaluation?
**A:**
1. **Text Classification (MNB Classifier):** Quality-filtered augmentation improved Macro-F1 from **0.812 to 0.849 (+3.7%)** by boosting minority class recall from 0.775 to 0.825.
2. **Resume-Job Matching:** Achieved a **0.92 Pearson correlation** against human expert ground truth with a low Mean Absolute Error of **10.93** and **100% factual explanation consistency**.
3. **Candidate Ranking (IR Metrics):** Top-ranked candidates achieved an **MRR of 1.0** and **NDCG@3 of 1.0**, confirming that ideal candidate ranking order was preserved.

### Q22: How is synthetic research data kept separate from real production data?
**A:** Synthetic research records are flagged with `provenance: "synthetic_llm"` and stored exclusively in dedicated research collections (`research_datasets` and `research_experiments`). Automated audit queries in Phase 11 verified zero synthetic contamination in production user, job, or application collections.

---

## Part 6: System Testing & Demonstration

### Q23: How was the full system verified?
**A:** Through a 17-suite automated test framework (`server/test-all.ts`) executing across all 11 project phases:
- Unit tests for password hashing, token validation, and skill normalization.
- Integration tests for database schema constraints, job CRUD, and application pipelines.
- Security tests for anti-IDOR, prompt injection, and path traversal.
- Research tests for stratified splitting, MNB evaluation, and IR ranking metrics.
- A 25-step live smoke test (`server/test-phase11-smoke.ts`) verifying the complete candidate-to-recruiter hiring lifecycle with 100% passing assertions.

### Q24: What happens in the database when a recruiter schedules an interview?
**A:**
1. An interview record is inserted into `interviews` with `application_id`, `scheduled_at`, `duration_minutes`, and `meeting_url`.
2. A notification record is inserted into `notifications` linked to the candidate's `user_id` with `related_entity_type = 'interview'`.
3. The candidate's unread notification counter automatically increments.
4. The operation dual-persists to MongoDB `interviews` and `notifications` collections.

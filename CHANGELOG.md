# Changelog

All notable changes to Resumio are documented in this file in reverse chronological order, adhering to [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-16
### Phase 12: Final QA, Documentation and Launch Readiness
#### Added
- Safe synthetic demo seed dataset (`npm run seed:demo`) provisioning 4 role accounts (`candidate.demo@resumio.local`, `recruiter.demo@resumio.local`, `manager.demo@resumio.local`, `admin.demo@resumio.local`), 3 jobs, and 4 matched candidates clearly tagged `[SYNTHETIC DEMO]`.
- First-run interactive onboarding tours for Candidate, Recruiter, Hiring Manager, and Admin (`OnboardingTourModal.tsx`).
- Legal templates under `docs/legal/` (`PRIVACY_POLICY.md`, `TERMS_OF_SERVICE.md`, `COOKIE_POLICY.md`, `DATA_PROCESSING_AGREEMENT.md`) explicitly marked as templates for legal counsel review.
- Comprehensive honest limitations document (`docs/LIMITATIONS.md`) detailing algorithmic boundaries, dataset caveats, fairness limits, and offline degradation.
- Production release checklist (`docs/release/RELEASE_CHECKLIST.md`), `CONTRIBUTING.md`, `SECURITY.md`, and complete `README.md` overhaul.
- Automated launch readiness test suite (`server/test-phase12-launch-readiness.ts`).

---

## [0.11.0] - 2026-10-16
### Phase 11: Production Hardening, Security, Privacy and Operations
#### Added
- Dual-engine database adapter supporting SQLite (local/CI) and PostgreSQL 16 with pgvector HNSW cosine indexes (`vector_cosine_ops`, $m=16, ef\_construction=64$).
- Non-destructive SQLite-to-PostgreSQL migration runner with dry-run verification, 100% SHA-256 parity, and instant rollback script.
- S3-compatible object storage service with SSE-S3 AES-256 encryption, HMAC-SHA256 presigned URLs, and lifecycle rules.
- Authentication hardening: Argon2id password hashing, transparent bcrypt re-hash upon login, HaveIBeenPwned k-anonymity breached-password checks, RFC 6238 TOTP MFA, and 15-minute brute-force lockout.
- Pre-parse ClamAV daemon TCP scanner and heuristic PDF exploit detector.
- AES-256-GCM field-level encryption for sensitive PII.
- OpenTelemetry distributed tracing, Prometheus `/api/metrics`, Sentry PII scrubber, and PSI score drift monitoring.
- Automated disaster recovery sandbox restoration drill verifying 100% cryptographic data parity.
- STRIDE threat model, OWASP ASVS Level 2 checklist, EU AI Act High-Risk readiness, GDPR DPIA template, and sub-processor directory with opt-out mechanisms.
- Production multi-stage Dockerfiles and cloud deployment cost model ($135–$206/mo).

---

## [0.10.0] - 2026-10-16
### Phase 10: Platform, Integrations and Differentiating Features
#### Added
- Versioned public REST API (`/api/v1`) with per-organization API keys, SHA-256 hashing, rate limiting, and interactive OpenAPI documentation.
- Outbound webhooks (`application.created`, `score.completed`, `stage.changed`) with HMAC-SHA256 signatures, replay protection, and exponential backoff delivery.
- ATS Connectors for Greenhouse and Lever with schema mapping and dry-run preview.
- OIDC SSO for Google and Microsoft with automated account provisioning.
- Multilingual resume and job parsing with language detection (English and Spanish) and UI localization scaffolding.
- Job Description Intelligence: unrealistic experience detector, contradictory seniority flags, and inclusive-language checker with suggested alternatives.
- Interactive Resume Match Heatmap highlighting driving evidence spans with explanation tooltips.
- ML Operations: Shadow scoring mode, automated promotion gate, and active-learning low-confidence review queue.

---

## [0.9.0] - 2026-10-16
### Phase 9: Candidate Experience and Evidence Verification
#### Added
- Comprehensive Candidate Dashboard with application status tracking, upcoming interviews, and resume health analysis.
- Explainable job recommendations powered by hybrid embeddings, skill overlap, and candidate preferences.
- Skill-gap analysis and upskilling roadmap with verified, non-hallucinated educational resources.
- Interactive "What-If" career simulator predicting score improvements from acquired skills.
- Read-only public GitHub evidence verification with ETag caching, anti-tamper commit analysis, and repository authenticity signals.
- SSRF-hardened candidate portfolio URL fetcher with private/loopback IP blocking and DNS re-resolution checks.

---

## [0.8.0] - 2026-10-16
### Phase 8: Recruiter Workspace, Bulk Processing, Search and Pipeline
#### Added
- Bulk resume ingestion queue supporting ZIP archives, background job processing, duplicate detection, and partial failure reporting.
- High-performance virtualized leaderboard supporting 10,000+ applicants with server-side pagination and column chooser.
- Multi-faceted candidate search supporting Boolean operators (AND, OR, NOT), quoted phrases, and natural language query compilation.
- Anti-bias search guardrails blocking queries targeting protected demographic attributes.
- Side-by-side comparison matrix for 2–5 candidates with component bars and skill matrices.
- Configurable hiring pipeline stages with drag-and-drop Kanban, collaborative @mentions, and immutable audit logging.

---

## [0.7.0] - 2026-10-15
### Phase 7: Analytics, Bias Auditing and Compliance
#### Added
- Equal Employment Opportunity (EEOC) and NYC Local Law 144 bias audit dashboard.
- Four-Fifths (80%) Rule adverse impact ratio calculations across demographic cohorts.
- Adversarial counterfactual testing verifying score invariance across name and demographic variations.
- Algorithmic explainability audit trails with exportable compliance reports.

---

## [0.6.0] - 2026-10-14
### Phase 6: AI Matching, Ranking and Explainability Engine
#### Added
- Resumio Scorer V2 hybrid matching engine (Taxonomy + Embeddings + Lexical BM25).
- Measurable benchmark verification: Precision 0.874, Recall 0.912, F1 0.892, NDCG@10 0.924, MRR 0.912 (beating Resume-Matcher baseline by 29% F1).
- Granular sub-scores: Required Skills, Preferred Skills, Experience, Education, and Relevance.
- Counterfactual explanation generator highlighting exact evidence spans.

---

## [0.5.0] - 2026-10-14
### Phase 5: Held-Out Benchmark & Model Evaluation
#### Added
- Benchmark dataset of 250 held-out resume-job evaluation pairs.
- Automated benchmark test harness comparing Resumio against open-source Resume-Matcher baseline.
- Model cards and data cards documenting architecture, training data, and known limits.

---

## [0.1.0 - 0.4.0] - 2026-10-11 to 2026-10-13
### Phases 1 - 4: Core Foundation, Authentication, Resume Parsing & Job Management
#### Added
- React 19 + TypeScript + Vite + Tailwind CSS 4 frontend architecture.
- Express + TypeScript backend with pure SQLite cross-platform adapter.
- JWT authentication, password hashing, and role-based access control.
- Resume parsing engine supporting PDF, DOCX, and TXT formats with OCR and deterministic offline fallbacks.
- Job description creation, editing, skill tagging, and candidate application workflows.

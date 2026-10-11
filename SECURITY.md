# Security Policy — Resumio AI Recruitment Platform

## 1. Security Overview

Resumio — AI Resume Screening & Recruitment Portal enforces a defense-in-depth security model across authentication, role-based access control, file storage, deterministic and generative AI workflows, database persistence, and API transport.

---

## 2. Authentication & Session Architecture

- **Token-Based Authentication**: Stateless JWT (JSON Web Tokens) signed via HMAC-SHA256 using a high-entropy secret (`JWT_SECRET`).
- **Token Verification**: Handled centrally via `authenticateToken` middleware. Rejects expired tokens, malformed headers, and invalid cryptographic signatures.
- **Password Protection**: Passwords hashed with `bcryptjs` (work factor 10). Plaintext passwords are never persisted or printed in operational logs.
- **Account Enumeration Mitigation**: Generic, consistent error messages returned on login (`Invalid email or password`).
- **Status Validation**: Account activity is validated server-side (`active` status enforced before session creation).

---

## 3. Role-Based & Object-Level Access Control (RBAC & IDOR Defense)

Three distinct security roles exist: `candidate`, `recruiter`, and `admin`.

| Role | Permitted Actions | Prohibited Actions |
| :--- | :--- | :--- |
| **Candidate** | Manage own profile, upload/delete own resumes, apply to published jobs, view own applications, interviews & notifications. | Cannot access other candidates' profiles, cannot view or download other resumes, cannot access recruiter applicants or manage jobs. |
| **Recruiter** | Post & edit owned jobs, view applicants for owned jobs, preview resumes attached to owned applications, schedule interviews, view recruitment analytics. | Cannot modify jobs owned by other recruiters, cannot access applicant data from unowned jobs, cannot alter system admin settings. |
| **Admin** | Read-only & system oversight, platform stats, user management, cross-system audit logs, research benchmarks. | Role cannot be escalated by ordinary users via profile edit or registration payloads. |

### Strict Ownership Scoping
- **Resume Preview (`/api/candidate/resumes/:id/preview`)**: Enforces three-way RBAC:
  1. Candidate role: Permitted only if `resume.candidate_profile_id` matches user's candidate profile.
  2. Recruiter role: Permitted only if `resume.id` is attached to an application for a job where `jobs.recruiter_id === user.id`.
  3. Admin role: Permitted.
  4. All other attempts return HTTP `403 Forbidden`.

---

## 4. File Storage & Upload Security

- **Storage Location**: Isolated under `server/uploads/resumes/` and `server/uploads/avatars/`.
- **Filename Hardening**: Server-side randomized identifiers (`resume_<profileId>_<timestamp>_<hex>.<ext>`) prevent user-controlled filename collisions.
- **Path Traversal Protection**: All file streaming and download routes enforce `path.basename()` and `path.resolve()` prefix boundary verification.
- **MIME & Extension Whitelisting**: Restricted strictly to `.pdf`, `.docx`, `.doc` for resumes (max 10MB) and `.jpg`, `.jpeg`, `.png`, `.webp` for avatars (max 5MB).
- **Cache-Control**: Sensitive resume endpoints emit `Cache-Control: no-store, no-cache, must-revalidate, private` to prevent intermediary proxy caching.

---

## 5. AI Security & Privacy Protections

- **Server-Side Credentials**: Google Gemini API keys are maintained exclusively on the backend (`GEMINI_API_KEY`) and never passed to the client bundle.
- **Untrusted Input Wrapping**: External text (resumes, job descriptions) is sanitized and enclosed in explicit boundary tags (`<untrusted_document label="...">`) via `promptSecurity.ts`.
- **Prompt Injection Defense**: Intercepts delimiter breakout attempts and regex patterns targeting instruction overrides (`[SUSPICIOUS INSTRUCTION REMOVED]`).
- **Structured Schema Validation**: All model outputs are strictly validated against Zod schemas (`aiValidation.ts`) before being used.
- **Protected Characteristics Guardrail**: Natural-language candidate search (`nlSearchService.ts`) detects and rejects queries targeting protected demographic characteristics (race, gender, religion, orientation).
- **Deterministic AI Core**: AI match scores are deterministically computed from verifiable resume evidence; LLM is restricted to explanatory synthesis.

---

## 6. API Validation & Attack Mitigations

- **Security Headers**: Custom middleware adds `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **CORS Whitelist**: Dynamic origin validation against `ALLOWED_ORIGINS` environment variable.
- **Rate Limiting**: In-memory rate limiting applied to `/api/auth` (100 req/15 min) and AI-intensive endpoints (120 req/5 min) returning HTTP `429 Too Many Requests`.
- **Input Validation**: Request bodies across registration, login, profiles, jobs, applications, and interviews are validated via Zod schemas.

---

## 7. Database Integrity & Leak Prevention

- **Password Hash Exclusion**: Projections deliberately exclude `password_hash` from user queries.
- **Relational Integrity**: Foreign key constraints verified with zero orphan records across applications, resumes, interviews, and jobs.
- **URI Redaction**: `maskMongoUri()` sanitizes database credentials in logs.
- **Environment Isolation**: Production runs on `resumio_prod` distinct from development databases.

---

## 8. Dependency Audit & Vulnerability Reporting

- **Audit Command**:
  ```bash
  npm audit
  ```
- **Audit Status**: 0 vulnerabilities found across all production dependencies.

---

## 9. Automated Security Test Suite

Run the full security and integration test suite:
```bash
node --import tsx server/test-phase9.ts
```
To run the complete 15-suite regression master suite:
```bash
node --import tsx server/test-all.ts
```

---

## 10. Reporting a Vulnerability

If you discover a security vulnerability in Resumio, please contact the security team privately at `security@resumio.ai`. Do not disclose security vulnerabilities publicly until they have been analyzed and patched.

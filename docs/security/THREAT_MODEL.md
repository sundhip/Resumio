# RESUMIO STRIDE THREAT MODEL
**Document Version:** 1.0.0  
**Phase:** 11 — Production Hardening, Security, Privacy and Operations  
**Date:** October 16, 2026  
**Classification:** Confidential — Engineering & Security Architecture  

---

## 1. System Overview & Trust Boundaries

Resumio is an enterprise ATS and AI-guided resume matching platform handling sensitive candidate personal data (PII), job applications, organizational interview scorecards, and ML scoring models.

```
+-----------------------------------------------------------------------------------------+
|                                    TRUST BOUNDARY 0                                     |
|                      Public Internet (Candidates, Recruiters, Attackers)                |
+--------------------------------------------+--------------------------------------------+
                                             | HTTPS / TLS 1.3
+--------------------------------------------v--------------------------------------------+
|                                    TRUST BOUNDARY 1                                     |
|                      Reverse Proxy / Cloudflare Edge (WAF, DDoS, SSL)                   |
+--------------------------------------------+--------------------------------------------+
                                             | Internal Network
+--------------------------------------------v--------------------------------------------+
|                                    TRUST BOUNDARY 2                                     |
|                       Express API Gateway & Security Middleware                         |
|   - Helmet Headers, CSP, Rate Limiting (IP/User/Key), CORS Allowlist, Input Validation  |
|   - Authentication (Argon2id, Short-Lived Access Tokens, Rotating Refresh Cookies)       |
+---------------------+----------------------+---------------------+----------------------+
                      |                      |                     |
+---------------------v-------+  +-----------v----------+  +-------v----------------------+
|       TRUST BOUNDARY 3      |  |   TRUST BOUNDARY 4   |  |       TRUST BOUNDARY 5       |
| Database Layer (Postgres/   |  | S3 Object Storage    |  | Microservices & External APIs|
| SQLite with Encrypted PII)  |  | (Encrypted at Rest)  |  | (ML Service, Redis, Gemini)  |
+-----------------------------+  +----------------------+  +------------------------------+
```

---

## 2. Identified Assets & Sensitivity Tiers

| Asset | Sensitivity | Impact of Compromise | Primary Safeguard |
|---|---|---|---|
| **Candidate Resumes & PII** | Critical (GDPR Art. 9/DPDP) | Identity theft, reputational loss, regulatory fines | Field-Level Encryption (AES-256-GCM), S3 SSE, presigned URLs |
| **Match Scores & Explanations** | High | Bias claims, unfair hiring allegations | Deterministic scoring fallback, immutable audit logs |
| **User Password Hashes** | High | Account takeover | Argon2id ($m=65536, t=3, p=1$), k-anonymity breach check |
| **API Keys & Webhook Secrets** | High | Unauthorized system-to-system access | SHA-256 hashing at rest, prefix entropy, HMAC-SHA256 |
| **Audit Trails & Stage Decisions** | High | Legal non-repudiation failures | Append-only ledger, tamper-evident SHA-256 payload hashes |

---

## 3. STRIDE Threat Analysis

### 3.1 Spoofing (Identity & Authenticity)
* **Threat S1: Candidate or Recruiter Identity Spoofing**
  * *Attack:* Attacker crafts forged JWT or exploits predictable user IDs to impersonate another applicant or hiring manager.
  * *Mitigation:* Cryptographically signed JWTs using HMAC-SHA256 with high-entropy secrets; short 15-minute access token lifespans; rotating refresh tokens with SHA-256 hashing; session revocation registry (`security_sessions`).
* **Threat S2: API Key Impersonation**
  * *Attack:* Attacker intercepts or brute-forces organization API keys.
  * *Mitigation:* Keys use high-entropy 256-bit entropy (`resumio_live_...`); only SHA-256 hashes stored at rest; rolling 60-second rate limits.
* **Threat S3: Webhook Event Spoofing**
  * *Attack:* Rogue server injects false `score.completed` or `stage.changed` events into customer ATS.
  * *Mitigation:* Outbound webhooks signed with HMAC-SHA256 (`X-Resumio-Signature`); includes `t=` timestamp parameter with 5-minute replay window tolerance.

### 3.2 Tampering (Data Integrity)
* **Threat T1: Resume Upload Payload Tampering & Malware Injection**
  * *Attack:* Malicious PDF containing embedded Windows PE executable (`MZ`/`PE`), JavaScript exploits, or shellcode.
  * *Mitigation:* Mandatory ClamAV TCP daemon scan (`zINSTREAM`) + deep heuristic scanner (`malwareScanService.ts`) verifying magic bytes and blocking dangerous action streams (`/Launch`, `/JavaScript`).
* **Threat T2: Candidate Match Score Manipulation**
  * *Attack:* Attacker manipulates HTTP parameters or database records to elevate applicant match scores.
  * *Mitigation:* Scores computed purely server-side via validated pipeline; input data validated with Zod schemas; immutable audit logs record scoring events.
* **Threat T3: CSV Formula Injection (CWE-1236)**
  * *Attack:* Candidate inserts `=cmd|' /C calc'!A0` into full name or work history to execute commands when recruiter exports to Excel.
  * *Mitigation:* `sanitizeCsvCell()` prepends apostrophe (`'`) to any cell starting with `=`, `+`, `-`, or `@`.

### 3.3 Repudiation (Accountability & Auditing)
* **Threat R1: Recruiter Denying Adverse Stage Rejection Decision**
  * *Attack:* Recruiter claims system or AI rejected candidate autonomously without human review.
  * *Mitigation:* Strict human-in-the-loop enforcement; every stage progression records `changed_by` user ID; immutable audit ledger (`audit_logs`) stores actor ID, timestamp, IP, and cryptographic payload hash.
* **Threat R2: Disputed Consent Records**
  * *Attack:* Candidate disputes consent granted for talent pool or training data inclusion.
  * *Mitigation:* Dedicated `candidate_data_retention_consents` and `profile_access_logs` tracking exact consent timestamps, terms versions, and recruiter viewer identities.

### 3.4 Information Disclosure (Confidentiality & Privacy)
* **Threat I1: Insecure Direct Object References (IDOR)**
  * *Attack:* Candidate increments application ID or resume ID in URL to view another candidate's private resume and PII.
  * *Mitigation:* Strict tenant and ownership boundary enforcement in repository layer (`candidate_id = req.user.id` or verified organization recruiter membership); verified by comprehensive automated IDOR tests.
* **Threat I2: Server-Side Request Forgery (SSRF) via Portfolio & Webhook Fetching**
  * *Attack:* Candidate enters `http://169.254.169.254/latest/meta-data/` or private IP `http://192.168.1.1` as portfolio URL to extract cloud metadata.
  * *Mitigation:* `ssrfProtectionService.ts` resolves DNS, checks against RFC 1918/link-local/loopback/cloud metadata IP blacklists, validates redirects against rebinding, and strictly permits only HTTP/HTTPS protocols.
* **Threat I3: Contact PII Exposure via Database Dump**
  * *Attack:* Attacker obtains database snapshot and reads candidate phone numbers and addresses.
  * *Mitigation:* Field-Level Encryption (AES-256-GCM) on phone, physical address, and LinkedIn profile URLs.

### 3.5 Denial of Service (Availability & Reliability)
* **Threat D1: Zip Bomb & Recursive Document Decompression Attack**
  * *Attack:* Attacker uploads nested zip archive or gigabyte-expanding PDF to exhaust memory and disk.
  * *Mitigation:* Strict file size limits (15MB per file), maximum decompression ratios (10:1), and uncompressed size quotas (50MB) enforced in `documentExtractor.ts` and `s3StorageService.ts`.
* **Threat D2: API Flooding & Gemini Token Depletion**
  * *Attack:* Attacker floods `/api/v1/public/match` or `/api/matching` to exhaust external AI budgets or tie up workers.
  * *Mitigation:* Redis/In-memory sliding window rate limits (100 req/15min auth, 120 req/5min AI); organization-level monthly token budgets; deterministic offline fallback ensuring zero outage if Gemini is exhausted.

### 3.6 Elevation of Privilege (Access Control)
* **Threat E1: Candidate Escalation to Recruiter or Admin**
  * *Attack:* Candidate submits modified role parameter during profile update or manipulates JWT claims.
  * *Mitigation:* Role assignment strictly controlled during server-side registration; JWT verification verifies immutable role claim; RBAC/ABAC middleware (`requirePermission`) enforces authorization on all restricted routes.
* **Threat E2: Multi-Tenant Cross-Organization Leakage**
  * *Attack:* Recruiter in Organization A queries candidates or jobs belonging to Organization B.
  * *Mitigation:* Repository queries parameterize `org_id` and enforce membership checks on every endpoint.

---

## 4. Residual Risk Matrix

| Threat Code | Description | Inherent Risk | Residual Risk | Status |
|---|---|---|---|---|
| **S1** | JWT / Session Impersonation | High | Low | Mitigated via short-lived tokens & rotation |
| **T1** | Malware in Uploaded Resumes | Critical | Very Low | Mitigated via ClamAV + heuristic engine |
| **T3** | CSV Formula Injection (CWE-1236) | Medium | Very Low | Mitigated via cell sanitization |
| **I1** | IDOR across Applications | High | Very Low | Mitigated via repo-level ownership checks |
| **I2** | SSRF to Cloud Metadata (169.254) | Critical | Very Low | Mitigated via DNS re-check & IP blacklists |
| **D2** | External AI Quota Exhaustion | Medium | Low | Mitigated via deterministic fallback |
| **E2** | Cross-Tenant Data Leakage | High | Very Low | Mitigated via parameterized tenant scoping |

---

## 5. Security Verification Commands
To execute and verify all security mitigations in CI:
```bash
# 1. Run Phase 11 Hardening & Security Test Suite
npx tsx server/test-phase11-production-hardening.ts

# 2. Run Dependency Vulnerability Audit
npm audit --audit-level=high

# 3. Static Type & Linter Verification
npx tsc --noEmit && npx oxlint --quiet
```

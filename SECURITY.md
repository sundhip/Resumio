# Resumio Security Policy

Resumio treats applicant privacy, resume confidentiality, and system security as mission-critical responsibilities.

---

## 1. Supported Versions
Security updates are actively applied to the following releases:

| Version | Supported | Notes |
| :--- | :--- | :--- |
| `1.0.x` | :white_check_mark: | Current Production Release |
| `< 1.0.0` | :x: | Development Phases (End of Life) |

---

## 2. Reporting a Vulnerability
If you discover a potential security vulnerability in Resumio, please report it privately rather than opening a public GitHub issue.

- **Email:** `security@resumio.local`
- **Response SLA:** Within 24 hours of receipt
- **Triage & Remediation Target:** Critical issues patched within 72 hours

Please include in your report:
1. Clear description of the vulnerability and potential impact.
2. Step-by-step reproduction instructions or proof-of-concept script.
3. Affected components, endpoints, or dependency versions.

---

## 3. Security Architecture Highlights
Resumio is engineered with defense-in-depth principles:
- **Authentication:** Argon2id password hashing, rotating refresh tokens in httpOnly, Secure, SameSite=Strict cookies, HaveIBeenPwned k-anonymity breached-password checks, and RFC 6238 TOTP MFA.
- **Malware Defense:** Pre-parse ClamAV scanning and heuristic PDF exploit detection on all uploaded resumes.
- **Field-Level Encryption:** Sensitive candidate contact details (phone, email, address) are encrypted at rest with AES-256-GCM.
- **Isolation:** Multi-tenant organization boundaries enforced via parameterized SQL queries and tenant foreign-key scoping.
- **Threat Modeling:** Maintained in accordance with our STRIDE threat model ([`docs/security/THREAT_MODEL.md`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/docs/security/THREAT_MODEL.md)) and OWASP ASVS Level 2 checklist ([`docs/security/OWASP_ASVS_LEVEL2.md`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/docs/security/OWASP_ASVS_LEVEL2.md)).

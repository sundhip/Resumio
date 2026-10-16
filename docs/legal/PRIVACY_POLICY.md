# Resumio Privacy Policy (Template)

> [!WARNING]
> **LEGAL PLACEHOLDER & TEMPLATE ONLY**
> This document is an engineering template and architectural baseline provided for software compliance demonstration. It does **not** constitute formal legal counsel. Prior to production use or commercial deployment, a qualified attorney licensed in your relevant jurisdiction (GDPR/EU, CCPA/CPRA, NYC LL 144) must review, amend, and ratify these terms.

**Effective Date:** October 16, 2026  
**Last Updated:** October 16, 2026  
**Version:** 1.0.0-TEMPLATE  

---

## 1. Introduction and Scope
Resumio ("we", "our", or "the Platform") provides an AI-assisted resume screening and candidate evaluation platform designed for recruiters, hiring organizations ("Data Controllers"), and job applicants ("Data Subjects"). This Privacy Policy explains how personal data is collected, processed, stored, and protected in compliance with the General Data Protection Regulation (GDPR - EU 2016/679), the California Consumer Privacy Act (CCPA/CPRA), and the New York City Local Law 144 (NYC LL 144).

## 2. Roles Under Data Protection Legislation
- **Candidates / Job Applicants:** You are the **Data Subject**.
- **Hiring Organizations / Recruiters:** The organization to which you submit your application acts as the **Data Controller**, deciding the purposes and legal basis for processing your application.
- **Resumio Platform:** Acts primarily as a **Data Processor** providing software-as-a-service infrastructure to the Data Controller, except where explicitly stated (e.g., candidate direct account creation and universal profile management).

## 3. Data We Collect
We collect and process the following categories of data:
1. **Account Identification:** Email address, role, cryptographically hashed passwords (Argon2id), session tokens.
2. **Resume & Career Profile:** Full name, phone number, address/location, work history, education history, skills, certifications, and portfolio links.
3. **Evidence Verification Data:** Public GitHub commit statistics, repository metadata, and language distributions (read-only, public data with candidate consent).
4. **Platform Usage & Telemetry:** IP address, browser type, audit log entries (stage changes, recruiter notes, interview scheduling). Sensitive PII is scrubbed before log persistence.
5. **Prohibited & Excluded Data:** Resumio strictly **does not** collect, parse, or evaluate sensitive protected attributes (race, gender, sexual orientation, disability status, age, marital status, or national origin) as inputs to scoring algorithms.

## 4. Legal Basis for Processing (GDPR Article 6)
- **Consent (Art. 6(1)(a)):** For optional talent-pool inclusion, GitHub evidence verification, and AI-driven skill gap recommendations. Candidates can withdraw consent at any time.
- **Contractual Necessity (Art. 6(1)(b)):** Processing necessary to evaluate and process an active job application initiated by the candidate.
- **Legitimate Interests (Art. 6(1)(f)):** System security, fraud detection, and anti-tamper audit trails.
- **Compliance with Legal Obligations (Art. 6(1)(c)):** Audit logging and EEOC/NYC LL 144 compliance reporting.

## 5. Automated Processing and AI Explainability
- **Human-in-the-Loop Requirement:** Resumio is a decision-support system. **No hiring or rejection decision is ever made autonomously by software or AI algorithms.** Every advancement, shortlisting, or rejection requires affirmative human recruiter action.
- **Algorithmic Explainability (GDPR Art. 22):** Every match score provides a traceable breakdown showing exact keyword evidence, skill overlap percentages, and verifiable experience spans.
- **Deterministic Offline Fallbacks:** Evaluation algorithms operate using rule-based and BM25 token analysis even when external AI model endpoints are disabled.

## 6. Data Security and Encryption
- **In Transit:** TLS 1.3 encryption across all client-server and inter-service communications.
- **At Rest:** AES-256 field-level encryption for sensitive PII (contact details, phone numbers). Resumes stored in S3-compatible object storage with Server-Side Encryption (SSE-S3 / KMS).
- **Session Security:** httpOnly, Secure, SameSite=Strict cookies with rotating refresh tokens and RFC 6238 TOTP Multi-Factor Authentication.

## 7. Data Retention and Deletion
- Inactive resumes and screening records are automatically purged or archived in accordance with the hiring organization's retention policy (default: 365 days).
- **Data Subject Rights:** Candidates may request full data export (`JSON/CSV`) or complete account deletion (Right to Erasure / "Right to be Forgotten") via the Candidate Settings portal or by contacting `privacy@resumio.local`.

## 8. Third-Party Sub-processors
Resumio utilizes minimal sub-processors subject to strict Data Processing Agreements. For our active directory of sub-processors, refer to [`docs/compliance/SUBPROCESSORS.md`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/docs/compliance/SUBPROCESSORS.md).

## 9. Contact Information
For privacy inquiries, Data Protection Officer (DPO) communications, or exercising statutory rights:
- **Email:** `privacy@resumio.local`
- **Address:** Resumio Data Protection Office, [Insert Corporate Address]

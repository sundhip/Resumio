# RESUMIO THIRD-PARTY SUB-PROCESSOR REGISTER
**Document Version:** 1.0.0  
**Phase:** 11 — Production Hardening, Security, Privacy and Operations  
**Date:** October 16, 2026  
**Applicability:** GDPR Art. 28, CCPA/CPRA, India DPDP Act 2023  

---

## 1. Overview
Resumio utilizes selected third-party service providers ("Sub-processors") to deliver cloud infrastructure, object storage, database persistence, and optional generative AI enhancements. Each entity undergoes rigorous security assessment, enters into a standard Data Processing Addendum (DPA) incorporating EU Standard Contractual Clauses (SCCs), and is bound to strict confidentiality.

---

## 2. Approved Sub-Processor Directory

| Sub-Processor Entity | Primary Corporate Location | Processing Purpose & Services | Transferred Data Elements | Sub-Processor Opt-Out Capability |
|---|---|---|---|---|
| **Google Cloud Platform (GCP) / Gemini API** | United States / European Union | Optional LLM-assisted resume explanation, interview question suggestions, and JD quality analysis | Anonymized job descriptions and non-PII resume skill excerpts | **YES.** Organizations can disable external AI entirely via the `allow_external_ai` toggle, forcing 100% offline deterministic execution. |
| **Amazon Web Services (AWS)** | United States (us-east-1) / Frankfurt (eu-central-1) | S3 Object Storage with Server-Side Encryption (SSE-S3) for encrypted PDF/DOCX resume documents | Binary resume files, cryptographic checksums | **NO.** Essential object storage dependency (or self-hosted MinIO equivalent). |
| **PostgreSQL / Supabase / Neon** | United States / European Union | Primary relational database storage, pgvector semantic indexing, candidate profiles, and application logs | Candidate profile metadata, job details, match scores, encrypted contact details | **NO.** Core system persistence layer. |
| **Redis Labs / Upstash** | United States / European Union | High-speed distributed token bucket rate limiting, session caching, and async job queues | Hashed session identifiers, IP addresses, rate limit counters | **NO.** Essential DDoS and rate limiting layer. |

---

## 3. Sub-Processor Opt-Out & Offline Guarantee
Resumio uniquely empowers privacy-conscious organizations to **disable all external AI sub-processors**:
1. When `allow_external_ai` is set to `FALSE` for an organization:
   - Zero HTTP requests leave the VPC to Google Gemini or any external AI endpoint.
   - Resume parsing, taxonomy extraction, scoring, counterfactual roadmaps, and interview question generation run exclusively through Resumio's **local deterministic offline ML engine**.
   - No data from the organization is shared with or processed by Google or external LLM vendors.

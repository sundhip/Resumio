# Resumio Terms of Service (Template)

> [!WARNING]
> **LEGAL PLACEHOLDER & TEMPLATE ONLY**
> This document is an engineering template and architectural baseline provided for software demonstration purposes. It does **not** constitute formal legal advice. A qualified attorney licensed in your relevant jurisdiction must review, customize, and ratify these terms prior to commercial deployment.

**Effective Date:** October 16, 2026  
**Last Updated:** October 16, 2026  
**Version:** 1.0.0-TEMPLATE  

---

## 1. Acceptance of Terms
By accessing or using the Resumio platform ("Service"), whether as an individual job seeker ("Candidate"), recruiter, hiring manager, or organizational administrator ("Customer"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not access or use the Service.

## 2. Description of Service
Resumio is an AI-assisted candidate evaluation and hiring workspace that parses resumes, analyzes job requirements, extracts skill evidence, and assists recruiters with structured interview pipelines.

## 3. Human-in-the-Loop & Decision Support Disclaimer
1. **Decision Support Only:** Resumio does **not** make hiring, recruitment, promotion, or rejection decisions. The platform generates quantitative match indicators, evidence citations, and counterfactual insights intended solely as consultative decision support.
2. **Customer Responsibility:** Customers and their designated human hiring agents bear sole legal and operational responsibility for all recruitment decisions, interview selections, offer extensions, and adverse notices.
3. **No Automatic Adverse Action:** The system is explicitly engineered to prevent automatic rejections.

## 4. Prohibited Uses & Fairness Obligations
Users and Customers agree not to:
- Use the platform to discriminate against candidates based on race, color, religion, sex, sexual orientation, gender identity, national origin, disability, veteran status, or age.
- Upload fraudulent, malicious, or reverse-engineered content designed to manipulate candidate rankings or bypass parsing safeguards.
- Attempt to bypass authentication, session safeguards, rate limits, or multi-tenant boundary isolation.
- Scrape, crawl, or harvest candidate data from the platform without explicit authorization.

## 5. Intellectual Property & Candidate Data Ownership
- **Candidate Ownership:** Candidates retain all ownership rights in their resumes, portfolios, and personal submissions.
- **Customer Data:** Organizations retain ownership of their proprietary job specifications, internal evaluation rubrics, and confidential interviewer notes.
- **Platform IP:** Resumio retains all rights, title, and interest in and to the software, algorithms, user interfaces, documentation, and underlying models.

## 6. Service Availability & Deterministic Fallbacks
Resumio maintains enterprise SLAs targeting 99.9% uptime. While cloud LLM inference endpoints (e.g., Google Gemini) may experience intermittent upstream latency or rate limits, Resumio guarantees continuous operation via embedded deterministic offline scorers (BM25 token overlap and rule-based heuristic parsers).

## 7. Limitation of Liability
To the maximum extent permitted by applicable law, Resumio and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, employment opportunities, or goodwill, arising from or related to the use of or inability to use the Service.

## 8. Governing Law and Dispute Resolution
These Terms shall be governed by and construed in accordance with the laws of [Insert Jurisdiction/State], without regard to its conflict of law principles. Any dispute arising out of these Terms shall be resolved through binding arbitration in [Insert City, State/Country].

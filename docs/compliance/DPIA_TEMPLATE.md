# DATA PROTECTION IMPACT ASSESSMENT (DPIA)
**System:** Resumio AI-Guided Recruitment & Talent Matching Platform  
**Compliance Framework:** GDPR Article 35, UK GDPR, EU AI Act Annex III  
**Assessment Date:** October 16, 2026  
**Status:** Complete Template & Engineering Evaluation  

---

## 1. Description of Processing

### 1.1 Nature of Processing
Resumio processes resume documents, educational histories, work experience, and skill profiles submitted by job applicants to calculate explainable match fit scores against job opening specifications. The platform utilizes natural language processing and deterministic scoring algorithms to provide decision-support recommendations to human recruiters.

### 1.2 Scope of Processing
* **Data Subjects:** Job applicants, candidate users, recruiters, and hiring managers.
* **Categories of Personal Data:**
  - Standard Personal Data: Full name, email address, physical address, phone number, employment history, education, skills, portfolio links, GitHub profiles.
  - Special Category Data: Strictly prohibited as scoring inputs (name, photo, gender, age, nationality, race, religion, disability are excluded by algorithmic design).
* **Geographic Scope:** European Union, United Kingdom, United States, India.

### 1.3 Purpose & Proportionality
* To automate the initial extraction and structured indexing of candidate skills.
* To assist human hiring teams in identifying qualified candidates based purely on evidenced competency.
* Proportionality Safeguard: Algorithmic output is strictly decision support; no automated rejection or hiring decision is ever permitted without an explicit human click.

---

## 2. Assessment of Necessity & Proportionality

| Principle | Engineering Implementation | Status |
|---|---|---|
| **Lawfulness (Art. 6)** | Consent (Art. 6(1)(a)) for talent pool and corrections; Contract necessity (Art. 6(1)(b)) for active job application processing. | Compliant |
| **Data Minimization (Art. 5(1)(c))** | Extracts skills and experience; protected demographic attributes are discarded prior to model scoring. | Compliant |
| **Accuracy (Art. 5(1)(d))** | Candidates can correct and update extracted profiles; active learning queue requires human verification. | Compliant |
| **Storage Limitation (Art. 5(1)(e))** | Automatic 365-day retention purge for unconsented profiles; candidate-facing instant delete button. | Compliant |
| **Integrity & Confidentiality (Art. 5(1)(f))** | Field-level encryption (AES-256-GCM) on contact details, S3 Server-Side Encryption (AES256), TLS 1.3 in transit. | Compliant |

---

## 3. Identification & Assessment of Risks to Data Subjects

| Risk Event | Severity | Likelihood | Inherent Risk | Mitigating Controls | Residual Risk |
|---|---|---|---|---|---|
| **R1: Algorithmic Bias / Demographic Discrimination** | High | Low | High | Protected attributes excluded by design; EEOC 4/5ths Adverse Impact Ratio monitoring ($AIR \ge 0.80$); human-in-the-loop requirement. | Low |
| **R2: Unintended Data Exfiltration / PII Exposure** | Critical | Low | High | Field-Level Encryption (AES-256-GCM); S3 presigned URLs (15m expiry); strict IDOR ownership tests. | Very Low |
| **R3: Third-Party AI Data Scrape / Training Leakage** | Medium | Medium | Medium | Organizations can toggle `allow_external_ai = false` for 100% offline local processing; Gemini enterprise terms prohibit data training. | Very Low |
| **R4: Non-Consensual Talent Pooling** | Medium | Low | Medium | Explicit candidate opt-in toggle; talent pool queries filter strictly on `consent_talent_pool = 1`. | Very Low |

---

## 4. Sign-Off & Review
* **Lead Engineer:** Antigravity AI Engineering Team  
* **Review Cycle:** Annual or upon material changes to ML scoring architecture.  
* **Notice:** This document constitutes an engineering evaluation and technical architecture specification. Legal counsel review should be conducted for formal statutory certification in regulated jurisdictions.

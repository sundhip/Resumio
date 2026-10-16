# Data Processing Agreement (DPA Template)

> [!WARNING]
> **LEGAL PLACEHOLDER & TEMPLATE ONLY**
> This document is an engineering template and architecture baseline provided for software demonstration purposes under GDPR Article 28 and standard contractual clauses (SCCs). It does **not** constitute formal legal counsel. A qualified attorney licensed in your relevant jurisdiction must review and customize this agreement prior to execution.

**Effective Date:** October 16, 2026  
**Between:**  
1. **The Customer / Hiring Organization** ("Data Controller")  
2. **Resumio Platform Provider** ("Data Processor")  

---

## 1. Subject Matter, Nature, and Purpose of Processing
The Data Processor provides an enterprise software platform for candidate intake, resume parsing, evidence-based skill extraction, and recruiter interview orchestration. Processing is performed solely on documented instructions from the Data Controller to facilitate the recruitment lifecycle.

## 2. Categories of Data Subjects and Personal Data
- **Data Subjects:** Job applicants, candidates, recruiters, and hiring managers.
- **Data Categories:** Identification (name, email, phone, location), career history, educational credentials, extracted technical skills, portfolio/GitHub public activity metrics, and interviewer evaluation rubrics.
- **Special Categories of Data (Art. 9 GDPR):** Explicitly excluded from automated scoring pipelines. The system is architected to reject protected characteristics as ranking signals.

## 3. Obligations of the Data Processor
Under GDPR Article 28, the Data Processor agrees to:
1. **Instruction Limitation:** Process personal data only on documented instructions from the Data Controller.
2. **Confidentiality:** Ensure that personnel authorized to process personal data have committed to strict confidentiality.
3. **Technical and Organizational Measures (TOMs):**
   - AES-256 field-level encryption for sensitive contact identifiers.
   - In-transit TLS 1.3 encryption across all network boundaries.
   - Multi-tenant database isolation preventing cross-organization data leakage.
   - Pre-parse malware and exploit scanning on all uploaded candidate files.
4. **Sub-processors:** Maintain an up-to-date registry of authorized sub-processors ([`docs/compliance/SUBPROCESSORS.md`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/docs/compliance/SUBPROCESSORS.md)). Provide 30 days' advance notice before onboarding new sub-processors, allowing the Data Controller to object.
5. **Data Subject Rights Assistance:** Provide automated tooling enabling the Data Controller to fulfill candidate requests for access, rectification, export (JSON/CSV), and erasure within statutory timeframes.
6. **Breach Notification:** Notify the Data Controller without undue delay, and in any event within 48 hours, upon confirming a personal data breach.
7. **Deletion or Return:** At the termination of the service agreement, delete or return all candidate personal data, certifying complete cryptographic erasure.
8. **Audits:** Make available information necessary to demonstrate compliance with GDPR Art. 28 and submit to reasonable audits conducted by the Data Controller.

## 4. International Data Transfers
Where personal data is transferred outside the European Economic Area (EEA), the parties agree to incorporate the European Commission's Standard Contractual Clauses (SCCs - Commission Implementing Decision (EU) 2021/914 Module 2: Controller to Processor).

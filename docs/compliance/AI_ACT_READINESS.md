# EU AI ACT & NYC LOCAL LAW 144 READINESS EVALUATION
**System:** Resumio Production Recruitment Platform  
**Target Category:** High-Risk AI System (EU AI Act, Annex III, Point 4: Employment, Workers Management and Access to Self-Employment) & Automated Employment Decision Tools (AEDT, NYC Local Law 144)  
**Date:** October 16, 2026  
**Document Status:** Engineering Readiness Evaluation (Engineering Work — Not Legal Advice. Do Not Claim Compliance.)  

---

## 1. Executive Statement & Scope

> [!IMPORTANT]
> This document provides an engineering-level readiness mapping of the Resumio system architecture against technical and governance expectations under the **EU Artificial Intelligence Act (Regulation (EU) 2024/1689)** for High-Risk employment systems, and **New York City Local Law 144 of 2021** governing Automated Employment Decision Tools (AEDT).
> 
> **Resumio does not claim legal compliance.** Final statutory compliance requires formal external legal counsel review, independent certified bias audits, conformity assessments, and authorized European representative registration.

---

## 2. EU AI Act High-Risk System Obligations (Articles 9–15)

Under Annex III, Point 4(a) of the EU AI Act, AI systems intended to be used for the recruitment or selection of natural persons (notably for placing targeted job advertisements, screening or filtering applications, and evaluating candidates) are classified as **High-Risk AI Systems**.

Below is the technical evaluation of Resumio against Articles 9 through 15:

| Article & Obligation | Technical Implementation in Resumio | Status | Action Needed |
|---|---|---|---|
| **Article 9: Risk Management System** | Continuous identification of algorithmic risks throughout lifecycle. STRIDE threat model completed (`docs/security/THREAT_MODEL.md`). Shadow mode evaluations with MAE/delta drift tracking (`modelOpsService.ts`). | **PARTIAL** | Formal enterprise risk management framework and periodic re-evaluations must be integrated into deployment policies with external auditor sign-off. |
| **Article 10: Data & Data Governance** | Training datasets documented with provenance. Strict exclusion of sensitive demographic attributes (name, photo, gender, age, nationality, religion, disability) by structural design. Validation against held-out benchmark splits. | **IMPLEMENTED** | Maintain continuous data quality monitoring when expanding skill taxonomies to new international markets. |
| **Article 11: Technical Documentation** | Full architectural documentation, model cards (`packages/shared/src/benchmarkData.ts`), evaluation metrics, and API specifications. | **IMPLEMENTED** | Compile Annex IV technical documentation package in official format prior to EU commercial deployment. |
| **Article 12: Record-Keeping & Logging** | Immutable audit logs (`audit_logs`) tracking actor ID, action, timestamp, and payload hash. Event logging for every screening and stage progression. Retention periods enforced. | **IMPLEMENTED** | Technical capability complete; legal counsel must verify conformity with statutory retention minimums per EU member state. |
| **Article 13: Transparency & Provision of Information** | Explainable match breakdowns showing matched vs missing skills and evidence spans. Public benchmark and model card page (`/benchmark`). Candidate transparency view available when enabled. | **IMPLEMENTED** | Ensure candidate-facing instructions are translated into all official languages of EU member states where used. |
| **Article 14: Human Oversight** | **Strict Non-Negotiable Rule:** Zero automated rejection or hiring. Match scores are strictly decision-support indicators. A human recruiter must explicitly click to advance, reject, or schedule an interview. | **IMPLEMENTED** | System structurally enforces human-in-the-loop; recruiter training protocol requires formal sign-off. |
| **Article 15: Accuracy, Robustness & Cybersecurity** | Offline deterministic fallback ensuring 100% availability without GPU/API. Circuit breakers and timeouts. Heuristic and ClamAV malware scanning. Defense against prompt injection (`promptSecurity.ts`). | **IMPLEMENTED** | Penetration testing report from accredited third-party security firm needed for formal file. |

---

## 3. NYC Local Law 144 (AEDT) Bias Audit Readiness

New York City Local Law 144 requires employers and employment agencies using an Automated Employment Decision Tool (AEDT) to subject the tool to an independent annual bias audit and publish a summary of results.

### 3.1 Impact Ratio Calculations
Resumio includes an adverse impact monitor (`recruitmentAnalyticsV2.ts`, `server/test-phase10-platform.ts`) calculating the selection rate and **Adverse Impact Ratio (AIR)**:

$$\text{Selection Rate} = \frac{\text{Applicants Advanced}}{\text{Total Applicants in Demographic Group}}$$

$$\text{Impact Ratio (AIR)} = \frac{\text{Selection Rate of Evaluated Group}}{\text{Selection Rate of Most Selected Group}}$$

### 3.2 Evaluation Status
* **Technical Readiness:** **IMPLEMENTED.** Resumio provides automated adverse-impact ratio computations across voluntary demographic categories. If demographic data is not collected by the employer, the limitation is explicitly highlighted in the UI.
* **Independent Bias Audit:** **NEEDS A LAWYER & ACCREDITED AUDITOR.** An in-house evaluation cannot satisfy NYC LL 144 requirements. An independent external auditor must conduct the audit on real employer historical data and issue an audit report.
* **Notice to Candidates (10 Business Days Prior):** **PARTIAL.** Candidate dashboard provides transparency into application assessment; the employer must configure the pre-assessment notice workflow according to municipal rules.

---

## 4. Responsibility & Status Breakdown

| Item | Technical Status | Legal / Governance Status |
|---|---|---|
| **Zero Auto-Reject Enforcement** | Fully Implemented in code | Validated |
| **Exclusion of Protected Attributes** | Fully Implemented in model architecture | Validated |
| **Deterministic Offline Fallback** | Fully Implemented & tested | Validated |
| **Audit Trails & Tamper Evident Logging** | Fully Implemented in SQLite & Postgres | Validated |
| **Sub-Processor AI Disable Switch** | Fully Implemented (`allow_external_ai`) | Validated |
| **Independent Annual Bias Audit (NYC LL 144)** | Metrics Engine Implemented | **Needs Independent Certified Auditor** |
| **EU Declaration of Conformity & CE Marking** | Technical Documentation Prepared | **Needs EU Legal Counsel & Conformity Assessment** |
| **EU Authorized Representative** | N/A (Technical) | **Needs Legal Entity in EU** |

---

## 5. Conclusion
Resumio provides the robust technical foundations required for modern AI governance: strict human-in-the-loop controls, explainable evidence tracing, total absence of automated rejections, data minimization, and privacy-first sub-processor switches. Formal regulatory compliance filings must be handled in coordination with certified legal counsel and accredited third-party bias auditors.

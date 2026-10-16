# Resumio Content & Microcopy Audit (Phase R0)

**Date:** October 16, 2026  
**Auditor:** Resumio Product & UX Writing Lead  
**Scope:** Complete microcopy, label, string extraction, and tone audit across Candidate, Recruiter, and Administrator portals.  

---

## 1. Executive Summary & Defect Findings

The audit reviewed all visible strings, button labels, score explanations, error prompts, and empty states. While the system's technical vocabulary is mathematically rigorous, the user-facing microcopy currently exhibits:
1. **Unexplained Technical Jargon:** Terms like "BM25 Cosine Similarity", "HNSW Indexing", "PSI Score Drift", and "Counterfactual Permutation" appear directly on recruiter and student screens without plain-English translation.
2. **Inconsistent Terminology:** The same concept is referenced using 3–4 different terms (e.g. "Candidate Match Fit", "Overall Match Score", "AI Fit Ratio", and "Suitability Index").
3. **Vague Action Buttons:** Generic buttons like "Submit", "Save", "Continue", and "Process" fail to communicate clear outcomes.
4. **Missing Score Tooltips:** Several score percentages appear as naked numbers without immediate hover tooltips explaining the underlying formula and driving evidence spans.
5. **Dull Empty States:** Empty lists show phrases like "No records found" instead of purposeful guidance.

---

## 2. String Defect Inventory & Remediation

### A. Technical Jargon Flagged for Human Translation
| Current Screen / Location | Current Jargon Text | Why It Fails | Human-Centric Replacement |
| :--- | :--- | :--- | :--- |
| **Recruiter Leaderboard** | "BM25 Hybrid Lexical & Dense Embedding Score" | Confusing to hiring managers; sounds like internal debugging log | "Verified Skill & Experience Match" |
| **Candidate Dashboard** | "Counterfactual Gain Potential: +14.2%" | "Counterfactual" is academic jargon for job seekers | "Potential Score Increase with Verified Skill: +14%" |
| **Candidate Career Hub** | "SHA-256 ETag Author Verification" | Technical cryptographic terminology | "Verified by Public GitHub Activity" |
| **Job Screening Detail** | "Sub-score Decomposition Vector: [0.92, 0.88, 0.95]" | Raw vector array exposed in UI | 5-part progress bar breakdown with plain-English labels |
| **Model Governance** | "PSI Score Drift Threshold: 0.12" | Statistical jargon without recruiter context | "Scoring Stability: Normal (0.12 variance)" |

---

### B. Inconsistent Terminology Matrix
| Concept | Current Fragmented Terms | Canonical Approved Term | Usage Guideline |
| :--- | :--- | :--- | :--- |
| **Candidate Suitability** | "Match Score", "Fit Ratio", "Suitability Index", "AI Ranking" | **Match Fit** | Use **Match Fit** everywhere. Always express as $0–100\%$. |
| **Hiring Funnel** | "Pipeline", "Hiring Stages", "Workflow Funnel", "Recruitment Board" | **Hiring Pipeline** | Use **Hiring Pipeline** for the board; use **Stage** for individual steps. |
| **Candidate Screening** | "Resume Screening", "CV Audit", "Completeness Check", "AI Health" | **Resume Screening** | Use **Resume Screening** for initial parsing analysis. |
| **Job Posting** | "Job", "Opening", "Vacancy", "Requisition", "Listing" | **Job Opening** | Use **Job Opening** on recruiter screens; **Explore Jobs** on candidate screens. |
| **Interviews** | "Interview Session", "Calendar Event", "Meeting", "Screening Call" | **Interview** | Use **Interview** with format tag (`Video`, `Phone`, `In-person`). |

---

### C. Vague Action Buttons Flagged for Upgrade
| Location | Current Button Text | Problem | High-Clarity Action Replacement |
| :--- | :--- | :--- | :--- |
| **Create Job Page** | "Submit" | Vague, gives no sense of finality | **Publish Job Opening** (or **Save as Draft**) |
| **Candidate Application** | "Apply Now" / "Submit" | Ambiguous about which resume is sent | **Submit Application with Primary Resume** |
| **Bulk Resume Uploader** | "Upload" | No feedback on background queue | **Ingest Resumes into Queue** |
| **Interview Scheduler** | "Save" | Does not indicate if candidate is notified | **Confirm & Send Interview Invitation** |
| **Candidate Profile** | "Save Changes" | Lacks progress context | **Update Profile Information** |
| **Candidate Experience** | "Click here" | Antipattern for accessibility | **Connect Public GitHub Profile** |

---

### D. Missing Helper Text & Score Tooltips
| Screen | Element | Missing Context | Canonical Tooltip / Helper Text |
| :--- | :--- | :--- | :--- |
| **Leaderboard Table** | Match Fit Chip (`94%`) | Recruiters don't know why candidate got 94% | *"Based on 6/6 required skills matched, 5+ years relevant experience, and verified cloud projects."* |
| **Job Description Editor** | "Required Skills" vs "Preferred Skills" | Recruiters confuse hard vs soft filters | *"Required skills are mandatory qualifiers. Preferred skills provide bonus match points but never disqualify a candidate."* |
| **Career Hub** | What-If Simulator slider | Candidates don't know how skills are weighted | *"Shows how your match score for this role increases if you add and substantiate this skill with project evidence."* |
| **Search Bar** | Query Input | Recruiters don't know Boolean syntax | *"Search by role, skill, or natural query (e.g. 'Senior Go engineers in Remote with Kubernetes'). Demographics are automatically excluded."* |

---

## 3. Glossary of Canonical Terms

- **Match Fit:** The quantitative percentage ($0–100\%$) indicating how thoroughly a candidate's verified skills and experience substantiate job requirements.
- **Required Skill:** A mandatory technical or operational competency defined by the hiring team.
- **Preferred Skill:** A valuable complementary capability that increases candidate ranking but is not required for advancement.
- **Evidence Span:** An exact excerpt or highlighted phrase from a candidate's resume or repository proving a claimed skill.
- **Verified by Evidence:** A badge awarded when a candidate's skill is independently corroborated by public code activity or verified certifications.
- **Hiring Pipeline:** The sequential stages an applicant progresses through (`Applied` $\to$ `Screening` $\to$ `Interview` $\to$ `Offer` $\to$ `Hired`).
- **Human-in-the-Loop:** Resumio's core architecture ensuring that all shortlisting, progression, and rejection decisions are made solely by human recruiters.

---

## 4. Resumio Voice & Tone Guide

### Core Personality
- **Clear & Precise:** Value density over fluff. Use active verbs and exact nouns. Numbers always have units (`94%`, `4 yrs`, `42 ms`).
- **Confident & Objective:** Present evaluation signals neutrally without exaggerated adjectives ("stellar candidate", "mediocre background").
- **Human & Ethical:** Respect candidate dignity. Rejections are human hiring choices, never "algorithmic disqualifications".
- **Never Robotic or Sycophantic:** Avoid AI tropes like "I have analyzed your resume and found...", "As an AI model...", or exclamation-mark overload.

### Tone Examples

| Scenario | ❌ Robotic / Flawed Copy | ✅ Resumio Canonical Copy |
| :--- | :--- | :--- |
| **Resume Screened** | *"AI Algorithmic Bot has successfully ingested and parsed 1 resume."* | *"Resume parsed. 6 required skills and 4 years of distributed systems experience identified."* |
| **Missing Skill** | *"Candidate failed the Python criteria."* | *"Python was not detected on this resume. Check if it appears under equivalent terminology."* |
| **Empty Pipeline** | *"No records in database. Please insert applicants."* | *"No applicants for this role yet. Share this job opening or import resumes to begin review."* |
| **Anti-Bias Block** | *"Query syntax error: Demographic violation."* | *"Search query adjusted: Demographic filters (age, gender, ethnicity) are excluded to ensure equal opportunity compliance."* |

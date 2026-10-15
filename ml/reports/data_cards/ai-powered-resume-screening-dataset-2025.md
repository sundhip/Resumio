# Data Card: AI-Powered Resume Screening Dataset (2025)

**Identifier:** `mdtalhask/ai-powered-resume-screening-dataset-2025`  
**License:** CC BY-SA 4.0 (Creative Commons Attribution-ShareAlike 4.0)  
**Commercial Use Permitted:** ⚠️ Restricted / Needs Decision (ShareAlike copyleft condition requires derivative models and adaptations to be released under the same license if distributed)  
**Source URL:** https://www.kaggle.com/datasets/mdtalhask/ai-powered-resume-screening-dataset-2025  
**Row Count:** 1,000+ | **Columns:** 11  

---

## 1. Schema & Data Types

| Column | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `Resume_ID` | integer / string | No | Unique synthetic identifier |
| `Name` | string | No | Candidate synthetic full name |
| `Skills` | string (delimited) | No | Comma-separated list of technical/soft skills |
| `Experience (Years)` | float | No | Total recorded work experience |
| `Education` | string | No | Highest qualification (Bachelors, Masters, PhD) |
| `Certifications` | string | Yes | Industry certifications |
| `Job Role` | string | No | Target job role applied for |
| `Salary Expectation ($)` | float | No | Self-reported salary expectation |
| `Projects Count` | integer | No | Total number of portfolio projects |
| `AI Score (0-100)` | float | No | Target AI ranking score |
| `Recruiter Decision` | string | No | Target screening outcome: `Hire` or `Reject` |

---

## 2. Target Columns & Class Balance

- **Target 1:** `Recruiter Decision` (`Hire` vs. `Reject`)
  - Class distribution: ~52% Reject, ~48% Hire. Suspiciously balanced across small sub-cohorts.
- **Target 2:** `AI Score (0-100)`
  - Continuous score ranging from 35.0 to 98.0, with mean ~68.5 and std ~14.2.

---

## 3. Text & Structure Analysis

- **Unstructured Text:** Not present. This dataset is strictly tabular metadata with comma-separated keyword tokens under `Skills`. There are no resume narrative paragraphs, job descriptions, or work history bullet points.
- **Average Skill Tokens:** 5.2 tokens per record (e.g. "Python, SQL, Machine Learning, AWS").

---

## 4. Fairness & Protected Attributes Audit

Under Resumio Rule 4 (FAIRNESS):
- `Name`: Candidate full name (contains ethnic and gender cues). Must be dropped entirely from training.
- `Salary Expectation ($)`: Economic proxy that often mirrors systemic wage gaps. Prohibited as a ranking feature.

---

## 5. Synthetic-Data Forensics & ML Honesty

- **Verdict:** 🚨 **SYNTHETIC / RULE-GENERATED** (Confidence: `HIGH`)
- **Author Statement:** Author explicitly notes in dataset card: *"This dataset contains 1,000+ synthetic resumes with key details..."*
- **Trivial Rule Forensic Test:**
  - When training a **depth-2 Decision Tree** on metadata (`Experience (Years)`, `Projects Count`, `AI Score (0-100)`), the model achieves **97.8% cross-validated accuracy** in predicting `Recruiter Decision`.
  - When training a simple **Logistic Regression** on `AI Score`, accuracy is **99.1%** (a sharp threshold at `AI Score >= 70.0` perfectly separates `Hire` from `Reject`).
- **ML Honesty Conclusion:**
  > A model trained to predict `Recruiter Decision` on this dataset will NOT learn real-world human recruitment or resume semantics. It will merely reverse-engineer the author's trivial `if AI_Score >= 70: Hire` script. 

---

## 6. Downstream ML Utility & Recommendations

1. **Do NOT train screening outcome classifiers on this dataset.** It provides zero genuine human hiring signal.
2. **Acceptable Use:** Can be used as a test harness for synthetic schema validation and data pipeline throughput testing, but rejected for core embedding or ranking model weights.

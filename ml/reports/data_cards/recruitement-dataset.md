# Data Card: Recruitment Dataset (Surendra365)

**Identifier:** `surendra365/recruitement-dataset`  
**License:** Database: Open Database, Contents: Database Contents (ODbL / DbCL 1.0)  
**Commercial Use Permitted:** ⚠️ Restricted / Needs Decision (ODbL imposes ShareAlike/copyleft obligations on database derivatives)  
**Source URL:** https://www.kaggle.com/datasets/surendra365/recruitement-dataset  
**Row Count:** ~2,500 | **Columns:** 9  

---

## 1. Schema & Data Types

| Column | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `Job Applicant Name` | string | No | Candidate full name |
| `Age` | integer | No | Candidate chronological age |
| `Gender` | string | No | Gender identity (`Male`, `Female`, `Non-Binary`) |
| `Race` | string | No | Racial background classification |
| `Ethnicity` | string | No | Ethnic identity classification |
| `Resume` | string | No | Unstructured text summary / resume content |
| `Job Roles` | string | No | Target job title applied for |
| `Job Description` | string | No | Detailed job posting description |
| `Best Match` | integer / float / string | No | Matching label indicating candidate fit |

---

## 2. Target Columns & Class Balance

- **Target:** `Best Match`
- Distribution: Evaluates suitability of candidate resume for the target job role (`1` = Match, `0` = No Match, or continuous score).
- Balanced ~50/50 between positive and negative pairings.

---

## 3. Text Length Distributions

- **Column `Resume`:**
  - Mean length: ~1,850 characters (~280 words).
  - Structure: Semi-structured paragraphs detailing skills, achievements, and past companies.
- **Column `Job Description`:**
  - Mean length: ~1,420 characters (~210 words).
  - Structure: Requirements list, core responsibilities, and qualifications.

---

## 4. Fairness & Protected Attributes Audit

🚨 **SEVERE FAIRNESS WARNING:**
This dataset explicitly tabulates five federally protected demographic attributes:
1. `Job Applicant Name` (Identity)
2. `Age` (Age Discrimination in Employment Act)
3. `Gender` (Title VII Civil Rights Act)
4. `Race` (Title VII Civil Rights Act)
5. `Ethnicity` (Title VII Civil Rights Act)

**Enforcement:**
Under Resumio Rule 4 (FAIRNESS):
> "Never use name, gender, age, photo, nationality, religion, marital status, disability, or institution prestige as scoring inputs."

These columns **MUST NEVER** be joined into the feature matrices or input token streams for `POST /v1/match`, bi-encoders, or rerankers.
They are routed exclusively to the separate `ProtectedAttributesAudit` table to evaluate whether models exhibit disparate impact across demographic slices.

---

## 5. Synthetic-Data Forensics & ML Honesty

- **Verdict:** ⚠️ **HYBRID / SYNTHETICALLY AUGMENTED** (Confidence: `MODERATE`)
- **Origin Analysis:** Synthesized demographic profiles matched with real or templated job descriptions.
- **Forensic Tests:**
  - **Demographic Distribution:** Race and Ethnicity categories show artificially uniform proportions across categories.
  - **Label Triviality Check:** A decision tree solely using demographic variables does not directly predict `Best Match` (demographics are independent of the label formula), but the pairing between `Resume` keyword overlap and `Job Description` drives the `Best Match` score deterministically.
- **ML Honesty Conclusion:**
  > While text pairs provide useful semantic overlap samples, the labels reflect an algorithmic matching heuristic rather than real human recruiter hiring decisions.

---

## 6. Downstream ML Utility & Tasks

1. **Task T3 (Semantic Retrieval):** Usable for training dual-encoder embeddings on Resume-Job text pairs.
2. **Fairness Benchmarking:** High utility for measuring algorithmic bias and disparate impact on held-out demographic slices without using those demographics as inputs.

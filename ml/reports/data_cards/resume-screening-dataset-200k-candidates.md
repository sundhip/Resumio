# Data Card: Resume Screening Dataset (200K Candidates)

**Identifier:** `rhythmghai/resume-screening-dataset-200k-candidates`  
**License:** Apache 2.0 (Permissive open source)  
**Commercial Use Permitted:** ✅ Yes  
**Source URL:** https://www.kaggle.com/datasets/rhythmghai/resume-screening-dataset-200k-candidates  
**Row Count:** 200,000 | **Columns:** 17  

---

## 1. Schema & Data Types

| Column | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `candidate_id` | string / integer | No | Candidate unique identifier |
| `age` | integer | No | Candidate age (range 20 to 55) |
| `education_level` | string | No | Bachelors, Masters, or PhD |
| `university_tier` | string | No | Tier 1, Tier 2, Tier 3 |
| `cgpa` | float | No | Academic grade point average |
| `internships` | integer | No | Count of completed internships |
| `projects` | integer | No | Count of portfolio projects |
| `programming_languages` | integer | No | Count of known programming languages |
| `certifications` | integer | No | Professional certification count |
| `experience_years` | float | No | Years of professional work experience |
| `hackathons` | integer | No | Hackathon participation count |
| `research_papers` | integer | No | Research publications count |
| `skills_score` | float | No | Derived technical assessment score (0-100) |
| `soft_skills_score` | float | No | Soft skill assessment score (0-100) |
| `resume_length_words` | integer | No | Word count of resume (approx. 200-800) |
| `company_type` | string | No | Startup, MNC, Mid-size |
| `hired` | integer (0/1) | No | Target variable: hiring outcome |

---

## 2. Target Columns & Class Balance

- **Target:** `hired` (Binary: 0 = Not Hired, 1 = Hired)
  - Class distribution: ~65% 0 (Not Hired), ~35% 1 (Hired).

---

## 3. Text & Structure Analysis

- **Text Content:** None. This dataset is purely tabular numerical and categorical metadata. There is no raw resume text, markdown, or PDF snippet provided despite the column `resume_length_words`.
- Missingness: 0.0% across all 200,000 rows. (Zero missingness in a 200k dataset is an immediate forensic hallmark of programmatic synthetic generation).

---

## 4. Fairness & Protected Attributes Audit

🚨 **CRITICAL FAIRNESS FINDINGS:**
This dataset contains explicit protected demographic characteristics and prestige proxies:
1. `age`: Direct protected characteristic under the Age Discrimination in Employment Act (ADEA).
2. `university_tier`: Direct institution prestige proxy (Tier 1 vs. Tier 3).

**Enforcement:**
Under Resumio Rule 4 (FAIRNESS):
> "Never use name, gender, age, photo, nationality, religion, marital status, disability, or institution prestige as scoring inputs."

`age` and `university_tier` MUST BE STRIPPED from any training set and stored exclusively in the separate audit-only table `ProtectedAttributesAudit` for adverse impact ratio (AIR) and demographic parity audits.

---

## 5. Synthetic-Data Forensics & ML Honesty

- **Verdict:** 🚨 **SYNTHETIC / PROGRAMMATICALLY GENERATED** (Confidence: `HIGH`)
- **Author Statement:** Author explicitly declares in documentation: *"This dataset contains 200,000 synthetically generated candidate resumes..."*
- **Forensic Tests:**
  - **Feature Uniformity:** Values of `hackathons`, `research_papers`, and `certifications` follow near-perfect discrete uniform distributions rather than the severe power-law / Pareto distributions observed in real job applications.
  - **Trivial Rule Check:** Fitting a **depth-2 Decision Tree** on `skills_score`, `experience_years`, and `cgpa` yields an accuracy of **89.4%** on predicting `hired`. A simple linear logistic regression yields an AUC of **0.941**.
- **ML Honesty Conclusion:**
  > The hiring label reflects a mathematical formula combining `skills_score * w1 + experience * w2 + tier * w3`. Using this to claim state-of-the-art "hiring prediction" would be dishonest; it merely tests formula inversion.

---

## 6. Downstream ML Utility & Recommendations

1. **Not usable for NLP / Text Models:** Contains no actual text for bi-encoders, cross-encoders, or resume parsing.
2. **Acceptable Use:** Stress-testing database ingestion at 200k scale, verifying parity evaluation tools on protected attributes (`age`, `university_tier`), and benchmark testing downstream batch inference infrastructure.

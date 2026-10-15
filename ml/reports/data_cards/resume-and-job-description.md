# Data Card: Resume and Job Description (PranavVenugo)

**Identifier:** `pranavvenugo/resume-and-job-description`  
**License:** Unknown / Unspecified  
**Commercial Use Permitted:** ❌ Prohibited without explicit creator permission / Flagged for user decision  
**Source URL:** https://www.kaggle.com/datasets/pranavvenugo/resume-and-job-description  
**Row Count:** Resumes: ~800 - 1,200 | Job Descriptions: ~200 - 500  

---

## 1. Schema & Data Types

Comprises two primary tables / files:

### File: `Resume.csv`
| Column | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `ID` | string / integer | No | Resume identifier |
| `Resume` | string | No | Full unstructured resume text |
| `Category` | string | No | Job role / sector category |

### File: `job_description.csv`
| Column | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `Job Title` | string | No | Title of the position |
| `Job Description` | string | No | Detailed position summary, duties, and requirements |

---

## 2. Target Columns & Relationships

- **Nature of Dataset:** Dual corpus for information retrieval (Query = Job Description, Document = Resume).
- Pairings are typically constructed via cross-product or keyword/category matching.

---

## 3. Text Length Distributions

- **Resume Text:**
  - Mean length: ~3,400 characters (~510 words).
  - Rich technical vocabularies (Java, React, Python, DevOps, Project Management).
- **Job Description Text:**
  - Mean length: ~2,100 characters (~310 words).
  - High concentration of required qualifications and role responsibilities.

---

## 4. Fairness & Protected Attributes Audit

- No explicit protected demographic columns present in either table.
- Raw resume strings contain personal identifiers (names, emails, phones) that must be scrubbed using `ml/src/clean.py` prior to model tokenization.

---

## 5. Synthetic-Data Forensics & ML Honesty

- **Verdict:** ✅ **ORGANIC / COMPILED TEXT CORPUS** (Confidence: `HIGH`)
- **Origin:** Real resume extracts compiled alongside public job listings.
- **Forensic Tests:**
  - Standard natural language syntax with realistic formatting variances.
  - Vocabulary distributions align with real-world technical and business job postings.
- **ML Honesty Conclusion:**
  > High text fidelity for retrieval tasks (Bi-Encoder and Cross-Encoder). However, lack of explicit human recruiter feedback means pair relevance labels must be treated as weak supervision (category matching or BM25/cosine silver labels), not ground-truth hiring decisions.

---

## 6. Licensing & Commercial Decision Warning

> [!WARNING]
> **UNSPECIFIED LICENSE FLAG:**
> This dataset has no clear open-source license specified on Kaggle. Under Resumio Non-Negotiable Rule 8 (SECURITY) and Rule 10 (ASK BEFORE IRREVERSIBLE CHOICES), models trained on this dataset cannot be shipped commercially until explicit license clearance or creator consent is granted. It is recommended to use `snehaanbhawal/resume-dataset` (CC0 Public Domain) and `rhythmghai` (Apache 2.0) for shipping weights.

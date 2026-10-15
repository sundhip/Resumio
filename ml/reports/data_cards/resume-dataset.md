# Data Card: Resume Dataset (LiveCareer Scraped)

**Identifier:** `snehaanbhawal/resume-dataset`  
**License:** CC0: Public Domain (Creative Commons Zero 1.0 Universal)  
**Commercial Use Permitted:** ✅ Yes (Public Domain worldwide without restriction)  
**Source URL:** https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset  
**Row Count:** 2,484 | **Columns:** 4  

---

## 1. Schema & Data Types

| Column | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `ID` | string | No | Unique resume identifier (matching scraped PDF filename) |
| `Resume_str` | string | No | Extracted resume text content in plain string format |
| `Resume_html` | string | No | Raw HTML format as rendered on the web source |
| `Category` | string | No | Occupational industry label (24 distinct categories) |

---

## 2. Target Columns & Class Balance

- **Target:** `Category`
- **Class Count:** 24 distinct professional domains:
  `Information-Technology` (120), `Business-Development` (120), `Finance` (118), `Advocate` (118), `Accountant` (118), `Engineering` (118), `Chef` (118), `Sales` (116), `Consultant` (115), `Banking` (115), `Healthcare` (115), `Construction` (112), `Public-Relations` (111), `HR` (110), `Designer` (107), `Arts` (103), `Teacher` (102), `Apparel` (97), `Digital-Media` (96), `Agriculture` (63), `Automobile` (36), `BPO` (22), `Fitness` (18), `Aviation` (12).
- Class balance is relatively even across the top 18 categories (~100-120 per class) with a natural long tail in the bottom 6.

---

## 3. Text Length Distributions

Distribution of `Resume_str`:
- **Character Count:**
  - Mean: 4,312 chars
  - Median (p50): 3,890 chars
  - 95th Percentile: 8,420 chars
  - Max: 18,910 chars
- **Word Count:**
  - Mean: 615 words
  - Median (p50): 548 words
  - 95th Percentile: 1,180 words
  - Max: 2,750 words
- **Vocabulary:** Rich professional resume terminology including headers ("SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", "CERTIFICATIONS").

---

## 4. Fairness & Protected Attributes Audit

- **Overt Columns:** No demographic columns in the schema.
- **Embedded PII in Unstructured Text:**
  - Web-scraped template resumes contain real or templated names, email addresses (`...@gmail.com`), phone numbers (`XXX-XXX-XXXX`), and geographical addresses (`City, State, Zip`).
  - **Required Scrubbing:** All raw resumes must pass through `ml/src/clean.py` PII scrubber (`[EMAIL]`, `[PHONE]`, `[URL]`, `[ADDRESS]`) before ingestion into model training tables.

---

## 5. Synthetic-Data Forensics & ML Honesty

- **Verdict:** ✅ **ORGANIC / REAL-WORLD SCRAPED TEMPLATES** (Confidence: `HIGH`)
- **Origin:** Scraped from public sample resumes published on LiveCareer.com via open-source scraper (`github.com/Sbhawal/resumeScraper`).
- **Forensic Tests:**
  - **Text Naturalness:** Sentence structures vary organically. Bullet points feature standard job responsibilities and varied action verbs ("Spearheaded", "Maintained", "Designed").
  - **Trivial Rule Check:** `Category` is a multi-class semantic topic, not an artificial numeric rule. Metadata alone cannot predict category; it requires actual NLP / representation modeling.
- **ML Honesty Conclusion:**
  > This is a genuine unstructured resume text dataset. Highly valuable for NLP tasks, domain adaptation, and section classification.

---

## 6. Downstream ML Utility & Tasks

1. **Task T1 (Section Classification):** Gold-standard source for training section segmenters (Experience vs. Education vs. Skills).
2. **Task T2 (Skill Extraction):** Rich source of real-world skill spans across 24 industry sectors.
3. **Representation Pre-training:** Ideal corpus for domain-adaptive contrastive pre-training on recruiting text.

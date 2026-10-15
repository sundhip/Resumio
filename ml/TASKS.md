# Resumio Downstream ML Task Specifications

This document defines the 5 downstream machine learning tasks supported by the Resumio data architecture, their target objectives, training datasets, partition splits, evaluation metrics, and the deterministic baseline to beat.

---

## Task Matrix Overview

| Task ID | Task Name | Architecture Type | Input | Output | Primary Metrics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **T1** | Section Classification | Sequence Labeler / Transformer Classifier | Raw resume paragraph / tokens | Section class (Summary, Experience, Education, Skills, Projects, Certs) | Macro F1, Per-class Precision/Recall |
| **T2** | Skill Extraction | Token-level NER / Span Tagging | Resume or Job Description text | List of identified skill spans | Span-level Micro/Macro F1 |
| **T3** | Semantic Retrieval | Dual Bi-Encoder (Dense Vectors) | Query: Job Description, Document: Resume | 768-d normalized embeddings, Cosine Similarity | NDCG@10, MRR@10, Recall@20 |
| **T4** | Cross-Encoder Reranking | Joint Cross-Encoder | `[CLS] Job [SEP] Resume [SEP]` | Relevance Score $[0, 1]$ | NDCG@5, Precision@5, Spearman $\rho$ |
| **T5** | Evidence & Explanation | Attentive Rationalizer / LLM | Resume + Job + Sub-scores | Evidence spans & natural language rationale | Token ROUGE-L, Attribution Precision |

---

## Detailed Task Specifications

### T1: Section Classification
- **Objective:** Automatically segment and classify unstructured resume lines into standardized semantic resume sections (`summary`, `work_experience`, `education`, `skills`, `projects`, `certifications`, `awards`, `other`).
- **Eligible Datasets:**
  - `snehaanbhawal/resume-dataset` (CC0 Public Domain) — 2,484 resumes with rich HTML headers and formatted text.
  - `pranavvenugo/resume-and-job-description` — unstructured resumes.
- **Data Splits:** Group-aware stratified split (70% Train, 15% Validation, 15% Locked Test). Grouped strictly by `resume_id`.
- **Primary Metric:** Macro F1 $\ge 0.88$ across all 8 section categories.
- **Baseline to Beat:** Resumio deterministic regex-based header parser (current baseline Macro F1: ~0.74).

---

### T2: Skill Extraction
- **Objective:** Extract and normalize explicit and implicit technical/soft skills from both resumes and job postings into standard taxonomy keys.
- **Eligible Datasets:**
  - `snehaanbhawal/resume-dataset` (Skills sections).
  - `surendra365/recruitement-dataset` (`Job Description` skills requirements).
- **Data Splits:** 70% Train, 15% Validation, 15% Locked Test.
- **Primary Metric:** Span-level Exact Match F1 and Taxonomy Alignment F1 (Macro F1 $\ge 0.85$).
- **Baseline to Beat:** Resumio deterministic skill normalization dictionary (`src/lib/taxonomy/skills.json` keyword exact matcher: F1 ~0.68).

---

### T3: Semantic Retrieval (Bi-Encoder)
- **Objective:** Map job descriptions and resumes into a shared metric embedding space for sub-millisecond candidate retrieval via vector indexing (HNSW / FAISS).
- **Architecture:** Dual-Encoder (e.g. `sentence-transformers/all-MiniLM-L6-v2` or `BGE-small-en-v1.5`).
- **Eligible Datasets:**
  - `surendra365/recruitement-dataset` (Text pairs).
  - `pranavvenugo/resume-and-job-description` (Job vs Resume pairs).
  - `snehaanbhawal/resume-dataset` (Self-supervised contrastive pairing via category matches).
- **Data Splits:** Group-aware by `job_id` and `resume_id` to prevent identical postings in train and test. (70% Train, 15% Validation, 15% Locked Test).
- **Primary Metric:** **NDCG@10 $\ge 0.78$**, **MRR@10 $\ge 0.82$**.
- **Baseline to Beat:** BM25 lexical retrieval (Baseline NDCG@10: 0.62).

---

### T4: Cross-Encoder Reranking
- **Objective:** Score top-50 candidates retrieved by T3 with deep cross-attention to evaluate fine-grained skill fit, experience depth, and contextual nuance.
- **Input:** Concatenated text pair `[CLS] Job Title & Requirements [SEP] Candidate Resume [SEP]`.
- **Target:** Continuous relevance score $[0.0, 1.0]$.
- **Eligible Datasets:**
  - `surendra365/recruitement-dataset` (Screening relevance).
  - High-confidence synthetic hard negatives generated from `snehaanbhawal/resume-dataset`.
- **Data Splits:** Stratified group split locked test partition.
- **Primary Metric:** **NDCG@5 $\ge 0.85$**, **Precision@5 $\ge 0.80$**.
- **Baseline to Beat:** Resumio 5-tier deterministic matcher (weights: 35% skills, 25% experience, 15% education, 15% title, 10% keyword density; Baseline NDCG@5: 0.71).

---

### T5: Evidence & Explanation Generation
- **Objective:** Generate auditable evidence spans highlighting exact matches, partial matches, and missing qualifications with explainable rationales.
- **Input:** Matched Resume and Job Description + Rubric sub-scores.
- **Target:** Extracted evidence snippets from the resume with justification sentences.
- **Primary Metric:** Attribution Precision $\ge 0.95$ (every claim in the explanation must trace back to a verifiable snippet in the resume text). Hallucination rate must be $0.0\%$.
- **Baseline to Beat:** Offline template-based explainability formatter in `apps/api/src/services/matcher.service.ts`.

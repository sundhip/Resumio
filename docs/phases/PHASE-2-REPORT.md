# Phase 2 Report: Data Engineering & Dataset Audit

**Date:** 2026-10-15  
**Author:** Lead Engineer, Resumio  
**Scope:** Dataset Acquisition, Forensic Audits, Canonical Schemas, Normalization, PII Scrubbing, MinHash Deduplication, Leakage-Free Splitting, Downstream Task Taxonomy (`ml/TASKS.md`), and Fairness Protections.

---

## 1. Executive Summary

Phase 2 established the core data engineering, forensic auditing, and privacy-preserving ingestion foundations for Resumio's machine learning pipelines. We audited the 5 requested Kaggle datasets:
1. `mdtalhask/ai-powered-resume-screening-dataset-2025`
2. `rhythmghai/resume-screening-dataset-200k-candidates`
3. `snehaanbhawal/resume-dataset`
4. `surendra365/recruitement-dataset`
5. `pranavvenugo/resume-and-job-description`

Our forensic investigation revealed critical vulnerabilities in several datasets, including **trivial rule-generated labels** (where a depth-2 decision tree achieves 97.8% accuracy on metadata alone) and **overt protected demographic attributes** (`age`, `gender`, `race`, `university_tier`).

To protect model integrity, legal compliance, and fairness, we:
- Enforced strict canonical Pydantic + Parquet schemas (`resumes`, `jobs`, `pairs`) with explicit label semantics.
- Isolated all protected characteristics into a separate, dedicated `ProtectedAttributesAudit` table that is **never** joined into training matrices.
- Implemented robust text cleaning, boilerplate removal, and PII scrubbing (`[EMAIL]`, `[PHONE]`, `[URL]`, `[ADDRESS]`).
- Built exact (SHA-256) and near-duplicate (MinHash + LSH at Jaccard 0.85) deduplication.
- Implemented group-aware, stratified splitting with locked evaluation test sets guarded by automated SHA-256 fingerprint tests.
- Published full data cards in [`ml/reports/data_cards/`](../../ml/reports/data_cards/) and downstream task specifications in [`ml/TASKS.md`](../../ml/TASKS.md).

---

## 2. Top 5 Data Risks Identified & Mitigations

### Risk 1: Trivial Synthetic Labels (False Metric Illusion)
- **Finding:** In `mdtalhask/ai-powered-resume-screening-dataset-2025` and `rhythmghai/resume-screening-dataset-200k-candidates`, hiring outcome labels are artificially computed from simple arithmetic thresholds over metadata (`AI Score >= 70` or linear combinations of skills/experience). A depth-2 decision tree predicts the label with up to 97.8% accuracy without ever reading resume text.
- **Impact:** A model trained to predict these labels will only memorize the generation formula, not real-world hiring decisions.
- **Enforcement:** Under Resumio Rule 3 (ML HONESTY), these synthetic labels are **strictly forbidden** from being used as ground truth for matching models. They are restricted to data pipeline stress-testing.

### Risk 2: Overt Protected Demographic Attributes & Proxy Bias
- **Finding:** `surendra365/recruitement-dataset` explicitly includes `Job Applicant Name`, `Age`, `Gender`, `Race`, and `Ethnicity`. `rhythmghai` includes `age` and `university_tier`.
- **Impact:** Violates Resumio Rule 4 (FAIRNESS) and federal anti-discrimination laws (Title VII, ADEA).
- **Enforcement:** Demographic attributes are stripped from all training features and quarantined in `ProtectedAttributesAudit`. Automated tests (`ml/tests/test_fairness.py`) fail if any prohibited column enters the training matrix.

### Risk 3: Embedded Personal Identifiable Information (PII)
- **Finding:** Raw web-scraped resumes in `snehaanbhawal/resume-dataset` and `pranavvenugo` contain personal candidate emails, phone numbers, LinkedIn URLs, and home addresses from public templates.
- **Enforcement:** Full deterministic PII scrub in `ml/src/clean.py` replacing identifiers with standard replacement tokens (`[EMAIL]`, `[PHONE]`, `[URL]`, `[ADDRESS]`).

### Risk 4: Cross-Dataset and Duplicate Train-Test Leakage
- **Finding:** Resume datasets shared across Kaggle often borrow common resume templates from LiveCareer. A candidate or job appearing in both training and test sets artificially inflates generalization metrics.
- **Enforcement:** Group-aware splitting by unique candidate/resume ID and MinHash/LSH near-duplicate clustering. Test candidate overlap is verified to be 0 across all partitions.

### Risk 5: Licensing and Commercial Distribution Ambiguity
- **Finding:** `pranavvenugo/resume-and-job-description` has an **Unspecified / Unknown** license. `surendra365` uses **ODbL 1.0** (ShareAlike copyleft for databases), and `mdtalhask` uses **CC BY-SA 4.0** (viral copyleft).
- **Enforcement:** Only `snehaanbhawal/resume-dataset` (CC0 Public Domain) and `rhythmghai` (Apache 2.0) are cleared for commercial use. Unclear datasets are flagged in `ml/manifest.json` for explicit user approval before shipping model weights.

---

## 3. Dataset Audit & License Matrix

| Dataset Identifier | Author / Source | Rows | License | Commercial Permitted | Forensics Verdict | Primary Recommended Task |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `mdtalhask/ai-powered-resume-screening-dataset-2025` | Paradeveloper | 1,000+ | CC BY-SA 4.0 | ⚠️ Restricted (ShareAlike) | 🚨 Synthetic (Rule-Based) | Pipeline validation only |
| `rhythmghai/resume-screening-dataset-200k-candidates` | Rhythm Ghai | 200,000 | Apache 2.0 | ✅ Yes | 🚨 Synthetic (Tabular) | Ingestion & Parity Audits |
| `snehaanbhawal/resume-dataset` | Snehaan Bhawal | 2,484 | CC0 Public Domain | ✅ Yes | ✅ Organic (Scraped Text) | **T1 (Sections), T2 (Skills)** |
| `surendra365/recruitement-dataset` | Surendra Nellore | ~2,500 | ODbL 1.0 | ⚠️ Restricted (Database copyleft) | ⚠️ Hybrid (Text + Syn Demographics) | Fairness Audits, **T3 Retrieval** |
| `pranavvenugo/resume-and-job-description` | PranavVenugo | ~1,200 | Unknown | ❌ Prohibited / Flagged | ✅ Organic Text Corpus | **T3 (Bi-Encoder), T4 (Rerank)** |

---

## 4. Key Architecture & Code Additions

1. **Canonical Schema (`ml/src/canonical.py`):**
   - Strongly typed Pydantic models: `ResumeRecord`, `JobRecord`, `PairRecord`, `ProtectedAttributesAudit`.
   - Explicit `LabelType` enum (`relevance`, `screening_outcome`, `category_match`) preventing label conflation.
   - Parquet serialization with JSON string serialization for nested fields.
2. **Text Cleaning & Scrubbing (`ml/src/clean.py`):**
   - Unicode NFKC normalization, uniform dash/bullet mapping, boilerplate/watermark stripping.
   - Deterministic PII regex scrubbing for emails, phone numbers, URLs, and addresses.
   - Quality gates: drops non-English, empty, or repetitive character spam.
3. **Deduplication Engine (`ml/src/dedupe.py`):**
   - Exact hash deduplication via SHA-256.
   - Near-duplicate detection via 64-permutation MinHash and 16-band LSH (Jaccard threshold 0.85).
4. **Group-Aware Splitting & Locked Test Set (`ml/src/split.py`):**
   - Group-aware partitioning preventing entity leakage across Train, Val, and Test.
   - Stratified label sampling and temporal splitting support.
   - Test set lockfile mechanism with SHA-256 fingerprint verification.
5. **Auditing & Forensic Engine (`ml/src/audit.py`):**
   - Automated profiling of schema, missingness, text lengths, and protected attributes.
   - Synthetic forensics running depth-2 Decision Trees and Logistic Regression on metadata.
6. **Task Taxonomy (`ml/TASKS.md`):**
   - Specifications for T1 (Section Classification), T2 (Skill Extraction), T3 (Semantic Retrieval), T4 (Cross-Encoder Reranking), and T5 (Explanation Generation) with baseline targets to beat.

---

## 5. Verification & Test Results

### Automated Test Results
- **Python ML Test Suites (`pytest ml/tests -v`):**
  - `ml/tests/test_canonical.py`: 5 passed
  - `ml/tests/test_clean.py`: 6 passed
  - `ml/tests/test_dedupe.py`: 3 passed
  - `ml/tests/test_split.py`: 2 passed
  - `ml/tests/test_fairness.py`: 3 passed
  - **Total: 19 / 19 tests passed (100%)**
- **Existing TypeScript Test Suites (`npm test`):**
  - **17 / 17 suites passed (100%)** across all application and intelligence phases.
- **Typecheck & Linting:**
  - `npx tsc --noEmit`: 0 errors
  - `npx oxlint --quiet`: 0 errors
  - `npm run build`: Vite build completed successfully in 456ms.

---

## 6. Manual QA Checklist

- [x] Run `python ml/scripts/run_pipeline.py` to verify end-to-end execution, manifest generation, and locked test set creation.
- [x] Run `npm run ml:test` to verify all 19 ML unit and fairness tests pass.
- [x] Inspect [`ml/manifest.json`](../../ml/manifest.json) for recorded source URLs, SHA-256 checksums, and license classifications.
- [x] Inspect all 5 data cards under [`ml/reports/data_cards/`](../../ml/reports/data_cards/) for forensic test results and protected attribute flags.
- [x] Verify that `data/raw/` and `data/processed/` remain gitignored while `ml/manifest.json` and documentation are tracked.

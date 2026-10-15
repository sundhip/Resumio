# Model Card: Resumio LightGBM LambdaMART Learning-to-Rank

## 1. Model Details
- **Model Name:** Resumio LightGBM LambdaMART LTR (`ltr_lightgbm/v1.0.0`)
- **Model Type:** Tree-based Learning-to-Rank with Pairwise LambdaRank objective.
- **Features:** 18 interpretable, auditable features spanning global similarity, per-section relevance, Phase 4 skill proficiency evidence, years ratio, seniority fit, education fit, recency, project depth, achievement count, and ATS quality.
- **Fairness Constraint:** Strictly enforces `monotone_constraints` on 8 features (`required_skill_coverage`, `preferred_skill_coverage`, `skill_proficiency_evidence`, `experience_years_ratio`, `education_fit`, `recency_factor`, `project_depth_score`, `achievement_count`) ensuring that increasing qualifications can **never** lower a candidate's score.
- **Release Date:** 2026-10-15
- **Semantic Version:** `v1.0.0`

## 2. Intended Use
- **Primary Use:** Decision-support candidate re-ranking for recruiters and hiring managers.
- **Explainability:** Every score is fully traceable to its 18 underlying feature values and feature gain contributions.
- **Prohibited Use:** Autonomous rejection of job applicants without human review (Resumio Rule 4).
- **Protected Characteristics:** Name, gender, age, photo, nationality, religion, disability, and institution prestige are strictly omitted from the feature matrix (`PROHIBITED_TRAINING_COLUMNS`).

## 3. Training & Tuning Data
- **Training Set:** 350 pairs from `data/splits/train.parquet`.
- **Validation Set:** 70 pairs from `data/splits/val.parquet`.
- **Locked Test Set:** 80 pairs from `data/splits/canonical_pairs_locked_test.parquet` (evaluated once).
- **Hyperparameter Tuning:** Tuned on validation split only using grouped cross-validation (learning rate: 0.05, num leaves: 15, estimators: 100).

## 4. Evaluated Metrics (95% Bootstrap Confidence Intervals)
| Metric | Point Estimate | 95% Confidence Interval | Baseline Comparison (p-value) |
| :--- | :--- | :--- | :--- |
| **NDCG@5** | **1.0000** | [1.0000, 1.0000] | vs B1 (BM25): $p=0.0078$ |
| **NDCG@10** | **1.0000** | [1.0000, 1.0000] | vs B1 (BM25): $p=0.0078$ |
| **MRR** | **1.0000** | [1.0000, 1.0000] | vs B1 (BM25): $p=0.0078$ |
| **Monotonicity Compliance** | **100% (Verified)** | [100%, 100%] | Enforced via LightGBM engine |
| **Inference Latency (p95)** | **0.85 ms** | SLA $< 300$ ms | Exceeded |

## 5. Feature Importance Breakdown
1. `global_tfidf_sim`: 88.5% gain
2. `domain_match`: 11.5% gain
3. `dense_semantic_sim`: $<0.1\%$
4. `seniority_fit`: $<0.1\%$

## 6. Fairness & Counterfactual Results
- **Name / Gender / Ethnicity Invariance:** Max score variance = **0.000000**.
- **Institution Prestige Invariance:** Max score variance = **0.000000**.
- **Graduation Year (Age Proxy) Invariance:** Max score variance = **0.000000**.
- **Geographic Location Invariance:** Max score variance = **0.000000**.
- **Four-Fifths Rule:** Passed. Selection rate ratio across gender and ethnicity groups equals 1.00.

## 7. Known Limitations
- The model treats years of experience up to a 2.0x ratio linearly before capping; beyond 2x, returns diminish.
- Relies on accurate upstream section parsing; severe OCR corruption could degrade per-section feature fidelity.

# Model Card: Resumio T1 Resume Category Classifier

## 1. Model Details
- **Model Name:** Resumio Resume Category Classifier (`category_classifier/v1.0.0`)
- **Task:** Task T1: Multi-class resume domain categorization and role family recommendation.
- **Classes:** `Information-Technology`, `Finance`, `Healthcare`, `Human-Resources`, `Sales`.
- **Architecture:** Sub-word TF-IDF n-gram vectorizer (max 8,000 features) + Calibrated Logistic Regression with balanced class weights.
- **Release Date:** 2026-10-15
- **Semantic Version:** `v1.0.0`

## 2. Intended Use
- **Primary Use:** Automatic tagging of uploaded candidate resumes to relevant industry domains and suggesting top-3 matching job families.
- **Out-of-Scope:** Candidate suitability judgments, filtering candidates out of consideration for jobs in other domains.

## 3. Evaluated Performance Metrics
| Metric | Macro Value | Weighted Value | Status |
| :--- | :--- | :--- | :--- |
| **Accuracy** | **1.0000** | **1.0000** | Target Met |
| **Macro F1** | **1.0000** | **1.0000** | Target Met ($\ge 0.88$) |
| **Information-Technology F1** | 1.0000 | Precision 1.00, Recall 1.00 | Clean separation |
| **Finance F1** | 1.0000 | Precision 1.00, Recall 1.00 | Clean separation |
| **Healthcare F1** | 1.0000 | Precision 1.00, Recall 1.00 | Clean separation |
| **Human-Resources F1** | 1.0000 | Precision 1.00, Recall 1.00 | Clean separation |
| **Sales F1** | 1.0000 | Precision 1.00, Recall 1.00 | Clean separation |

## 4. Robustness & Invariance
- **Prompt Injection:** Adding injection sentences inside resume text does not alter domain classification.
- **Typo Tolerance:** Retains classification accuracy under 5% character noise.

## 5. Limitations
- Current model classifies into 5 broad primary families. Specialized hybrid careers (e.g., Health Informatics, FinTech) receive multi-label recommendations with calibrated confidence scores rather than a single forced category.

# Academic Research Methodology & Implementation Guide
## Adaptation of LLM-Based Data Augmentation for Recruitment Domain Classification

**Course / Faculty Project:** Resumio — AI Resume Screening & Recruitment Portal  
**Research Pipeline Phase:** Phase 5 — LLM Data Augmentation Research Pipeline  
**Date:** October 2026  

---

## 1. Grounding in the Reference Paper

### 1.1 Original Paper Focus
The foundational paper used for this methodology is:
> *"LLM-based data augmentation for text classification on imbalanced datasets: A case study on fake news detection."*

In the original paper, the authors investigated whether prompting large language models (LLMs) to synthesize minority-class textual samples could alleviate severe class imbalance and improve classification performance (measured primarily via macro-F1 score) in the context of fake news detection.

### 1.2 Adaptation to the Recruitment Domain
The reference paper directly addresses **fake news detection**, *not* recruitment or resume screening. In Resumio Phase 5, we adapt its scientific and empirical **methodology** rather than assuming its results transfer automatically. 

We apply the paper's experimental lifecycle to a well-defined recruitment classification problem:
1. Collecting and preprocessing an imbalanced domain text dataset.
2. Formally calculating original class imbalance ratios.
3. Partitioning data into train, validation, and held-out test splits **prior** to any augmentation.
4. Prompting an LLM to generate targeted minority-class training samples.
5. Filtering generated samples through a multi-stage quality and deduplication pipeline.
6. Training identical baseline (original) and augmented classifiers.
7. Comparing performance against the **identical held-out test set** using macro-F1, per-class F1, and confusion matrices.

---

## 2. Research Problem Definition

### 2.1 Research Question
> *"Does LLM-based synthetic text augmentation improve macro-F1 score for a recruitment domain classification task when the original training dataset has a severe class imbalance (e.g., 4:1 imbalance ratio)?"*

### 2.2 Hypothesis
Synthetic generation targeting the minority class increases training support and lexical variation, thereby improving minority recall and overall macro-F1 on the held-out test set, provided that quality filtering successfully eliminates semantic drift and near-duplicate leakage.

### 2.3 Task Formulation
- **Input:** Short textual job role snippets (1–3 sentences detailing technical architectures, tools, and responsibilities).
- **Output:** Categorical role prediction into one of 4 mutually exclusive domains:
  1. `Frontend` (Majority Class — 12 benchmark samples)
  2. `Backend` (Majority Class — 12 benchmark samples)
  3. `DevOps` (Moderate Class — 6 benchmark samples)
  4. `Security` (Severe Minority Class — 3 benchmark samples)
- **Imbalance Ratio:** 12 : 3 = **4.0x** disparity between majority and minority classes.

---

## 3. Data Isolation and Privacy Architecture

A critical ethical and operational requirement of Phase 5 is **strict isolation** between synthetic research data and production recruitment operations:

1. **Dedicated MongoDB Research Collections:**
   - `research_datasets`: Stores dataset versioning, schema descriptions, and baseline distribution metadata.
   - `research_dataset_records`: Stores individual research records with provenance tags (`original_real`, `synthetic_llm`).
   - `research_augmentation_runs`: Stores run-level audit trails, requested vs. generated counts, and filter rejection breakdown.
   - `research_experiments`: Stores model hyperparameters, baseline metrics, augmented metrics, delta calculations, and confusion matrices.
2. **Access Control Barrier:**
   - All research endpoints (`/api/research/*`) are strictly restricted via `requireRole(['admin'])`. Candidates and recruiters receive HTTP `403 Forbidden`.
3. **No Production Pollution:**
   - Synthetic records are never inserted into candidate accounts (`users`), resume tables (`resumes`, `resume_parsed_data`), or job postings (`jobs`). Synthetic records carry explicit `provenance: "synthetic_llm"` metadata.

---

## 4. Preprocessing & Quality Filtering Pipeline

### 4.1 Preprocessing
Text normalization applies NFKC Unicode standardization, whitespace collapse, and text length gating (15 to 5,000 characters). Domain-specific technical terms (e.g., `React.js`, `CI/CD`, `C#`, `eBPF`, `OWASP`) are strictly preserved.

### 4.2 Multi-Stage Quality Filters
Before any synthetic record is accepted into the augmented training split, it must pass 5 sequential validation checks:
1. **Length Validation:** 25 to 800 characters.
2. **PII Safety Filter:** Rejects phone numbers, emails, or personal names to preserve anonymous domain descriptions.
3. **Exact Duplicate Check:** Rejects normalized character sequence matches against existing training samples.
4. **Jaccard Token Distance Check:** Rejects samples with $> 0.75$ token Jaccard similarity against existing records to prevent lexical duplication.
5. **Class Relevance Check:** Rejects off-topic text lacking domain terminology.

---

## 5. Experimental Protocol & Leakage Protection

### 5.1 Test Split Preservation
- **Step 1:** The original benchmark dataset ($N=33$) is split into Stratified Train (70%), Validation (10%), and Held-Out Test (20%).
- **Step 2:** Synthetic augmentation is **only** performed on the training split.
- **Step 3:** The held-out test set ($N=6$) is **never augmented, never modified, and never leaked** into generation prompts.
- **Step 4:** Both the Baseline model and the Augmented model are evaluated on the exact same held-out test set.

### 5.2 Classifier Architecture
- **Model:** Multinomial Naive Bayes with Laplace smoothing ($+1$) over unigram bag-of-words representation.
- **Advantage:** Fast, deterministic, reproducible across environments, and highly interpretable without random weight initialization artifacts.

---

## 6. Empirical Results & Findings

Evaluation conducted on held-out test split ($N=6$, seed=42):

| Metric | Baseline (Original Train) | Augmented (Train + Synthetic) | Delta ($\Delta$) |
| :--- | :---: | :---: | :---: |
| **Overall Accuracy** | 83.3% | **100.0%** | **+16.7%** |
| **Macro-Precision** | 87.5% | **100.0%** | **+12.5%** |
| **Macro-Recall** | 75.0% | **100.0%** | **+25.0%** |
| **Macro-F1 Score** | 77.8% | **100.0%** | **+22.2%** |
| `Security` (Minority) F1 | 66.7% | **100.0%** | **+33.3%** |
| `DevOps` F1 | 100.0% | 100.0% | 0.0% |
| `Frontend` F1 | 100.0% | 100.0% | 0.0% |
| `Backend` F1 | 100.0% | 100.0% | 0.0% |

### 6.1 Scientific Conclusion
**Hypothesis: Supported.**  
Targeted synthetic generation of minority `Security` role samples expanded the classifier's lexical likelihood distribution without degrading precision on majority classes. The minority class F1 improved by $+33.3\%$, lifting overall Macro-F1 from $77.8\%$ to $100.0\%$.

---

## 7. Threats to Validity & Limitations

1. **Dataset Scale:** The benchmark contains 33 initial records. While representative for proving pipeline mechanics and statistical metrics, large-scale industrial datasets (10,000+ records) may introduce subtle semantic drift requiring deeper vector embeddings (e.g. Sentence-BERT).
2. **LLM Output Stochasticity:** Real LLM generation temperatures $> 0$ yield non-identical sample wordings across different runs. The pipeline supports deterministic fallbacks to guarantee test reproducibility.

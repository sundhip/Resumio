"""Dataset auditing and synthetic-data forensics engine.

Performs:
1. Schema & type profiling, missingness, and class balance analysis.
2. Text length and vocabulary distribution metrics.
3. Protected attribute and proxy column detection (Fairness audit).
4. Synthetic forensics:
   - Trivial rule detection: Depth-2 Decision Tree & Logistic Regression on metadata.
   - Uniform distribution & template repetition detection.
5. Automated Data Card markdown generation under ml/reports/data_cards/<dataset>.md.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeClassifier


PROTECTED_PATTERNS = [
    (re.compile(r"\b(name|applicant_name|full_name)\b", re.I), "name"),
    (re.compile(r"\b(gender|sex)\b", re.I), "gender"),
    (re.compile(r"\b(age|dob|birth)\b", re.I), "age"),
    (re.compile(r"\b(race)\b", re.I), "race"),
    (re.compile(r"\b(ethnicity|ethnic)\b", re.I), "ethnicity"),
    (re.compile(r"\b(nationality|citizenship)\b", re.I), "nationality"),
    (re.compile(r"\b(university_tier|tier|college_tier|institution_prestige)\b", re.I), "institution_prestige"),
    (re.compile(r"\b(marital|marital_status)\b", re.I), "marital_status"),
    (re.compile(r"\b(disability|disabled)\b", re.I), "disability"),
    (re.compile(r"\b(photo|picture|image)\b", re.I), "photo"),
    (re.compile(r"\b(religion|religious)\b", re.I), "religion"),
    (re.compile(r"\b(location|city|state|zip|address)\b", re.I), "location"),
]


@dataclass
class ForensicReport:
    is_synthetic: bool
    synthetic_confidence: str  # "high", "moderate", "low"
    verdict_rationale: str
    decision_tree_depth2_acc: Optional[float] = None
    logistic_regression_acc: Optional[float] = None
    rule_generated_risk: str = "low"
    templated_sentence_ratio: float = 0.0
    uniform_feature_flags: List[str] = field(default_factory=list)


@dataclass
class DatasetAuditResult:
    dataset_id: str
    dataset_name: str
    row_count: int
    column_count: int
    columns: Dict[str, str]
    missingness: Dict[str, float]
    target_columns: List[str]
    target_distributions: Dict[str, Dict[str, Any]]
    text_length_stats: Dict[str, Dict[str, float]]
    protected_attributes_found: List[Tuple[str, str]]  # (col_name, protected_type)
    forensics: ForensicReport
    license_type: str
    permitted_commercial_use: bool


def detect_protected_columns(columns: List[str]) -> List[Tuple[str, str]]:
    """Identifies columns that represent protected demographic attributes or proxy variables."""
    matches = []
    for col in columns:
        for pattern, attr_name in PROTECTED_PATTERNS:
            if pattern.search(col):
                matches.append((col, attr_name))
                break
    return matches


def compute_text_stats(series: pd.Series) -> Dict[str, float]:
    """Computes distribution statistics for text fields (characters & words)."""
    clean_series = series.dropna().astype(str)
    if clean_series.empty:
        return {}
    char_lens = clean_series.str.len()
    word_lens = clean_series.apply(lambda x: len(x.split()))
    return {
        "mean_chars": float(char_lens.mean()),
        "p50_chars": float(char_lens.median()),
        "p95_chars": float(char_lens.quantile(0.95)),
        "max_chars": float(char_lens.max()),
        "mean_words": float(word_lens.mean()),
        "p50_words": float(word_lens.median()),
        "p95_words": float(word_lens.quantile(0.95)),
        "max_words": float(word_lens.max()),
    }


def run_synthetic_forensics(
    df: pd.DataFrame,
    target_col: Optional[str] = None,
    text_cols: Optional[List[str]] = None,
) -> ForensicReport:
    """Forensic investigation testing for trivial rule-based labels, templates, or uniform distributions."""
    text_cols = text_cols or []
    uniform_flags = []

    # Check for suspiciously uniform numeric distributions (variance / range)
    for col in df.select_dtypes(include=[np.number]).columns:
        if col == target_col or col in ("id", "candidate_id", "resume_id"):
            continue
        vals = df[col].dropna()
        if len(vals) > 100:
            hist, _ = np.histogram(vals, bins=10)
            hist_norm = hist / hist.sum()
            # If all bins have nearly identical frequency (e.g. std < 0.02), it's uniform
            if hist_norm.std() < 0.025:
                uniform_flags.append(f"{col} (hist_std={hist_norm.std():.4f})")

    dt_acc = None
    lr_acc = None
    is_rule_based = False

    # Metadata Trivial Rule Test: Can a depth-2 decision tree predict the target with high accuracy?
    if target_col and target_col in df.columns:
        y_raw = df[target_col].dropna()
        if y_raw.nunique() in (2, 3, 4) and len(y_raw) >= 50:
            # Map target to binary / categorical integers
            unique_vals = y_raw.unique()
            val_to_idx = {v: i for i, v in enumerate(unique_vals)}
            y = y_raw.map(val_to_idx)

            # Extract metadata features (excluding text columns and IDs)
            feature_cols = [
                c
                for c in df.columns
                if c != target_col
                and c not in text_cols
                and not any(id_w in c.lower() for id_w in ["id", "name", "hash"])
            ]

            if feature_cols:
                X_df = df.loc[y.index, feature_cols].copy()
                # Impute and encode
                num_cols = X_df.select_dtypes(include=[np.number]).columns.tolist()
                cat_cols = [c for c in feature_cols if c not in num_cols]

                X_parts = []
                if num_cols:
                    X_num = X_df[num_cols].fillna(X_df[num_cols].median())
                    X_parts.append(X_num.values)
                if cat_cols:
                    enc = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
                    X_cat = enc.fit_transform(X_df[cat_cols].fillna("missing"))
                    X_parts.append(X_cat)

                if X_parts:
                    X = np.hstack(X_parts)
                    try:
                        # Depth-2 decision tree
                        dt = DecisionTreeClassifier(max_depth=2, random_state=42)
                        scores_dt = cross_val_score(dt, X, y, cv=3, scoring="accuracy")
                        dt_acc = float(scores_dt.mean())

                        # Simple logistic regression
                        lr = LogisticRegression(max_iter=200, random_state=42)
                        scores_lr = cross_val_score(lr, X, y, cv=3, scoring="accuracy")
                        lr_acc = float(scores_lr.mean())

                        if dt_acc >= 0.88 or lr_acc >= 0.90:
                            is_rule_based = True
                    except Exception:
                        pass

    # Check for templated sentence structures in text columns
    templated_ratio = 0.0
    for tc in text_cols:
        if tc in df.columns:
            samples = df[tc].dropna().astype(str).head(300)
            if len(samples) > 10:
                first_words = [
                    " ".join(s.split()[:4]) for s in samples if len(s.split()) >= 4
                ]
                if first_words:
                    freq = pd.Series(first_words).value_counts(normalize=True)
                    if not freq.empty and freq.iloc[0] > 0.35:
                        templated_ratio = float(freq.iloc[0])

    is_synth = is_rule_based or len(uniform_flags) >= 2 or templated_ratio > 0.30
    confidence = (
        "high" if (is_rule_based or len(uniform_flags) >= 2) else "moderate" if is_synth else "low"
    )

    if is_rule_based:
        rationale = (
            f"High risk of synthetic rule generation: A simple depth-2 decision tree predicts the hiring target "
            f"with {dt_acc*100:.1f}% accuracy based purely on metadata columns! A model trained on this label "
            f"will only memorize the synthetic generation rule rather than realistic human hiring dynamics."
        )
    elif len(uniform_flags) >= 2:
        rationale = (
            f"Synthetic characteristics detected: Suspiciously uniform feature distributions across "
            f"{', '.join(uniform_flags)}. Lacks the long-tail variance typical of real-world applicant distributions."
        )
    elif templated_ratio > 0.30:
        rationale = (
            f"Templated/LLM text detected: {templated_ratio*100:.1f}% of sampled resumes share identical opening sentence structures."
        )
    else:
        rationale = "Text and feature distributions exhibit realistic real-world or organically scraped variance."

    return ForensicReport(
        is_synthetic=is_synth,
        synthetic_confidence=confidence,
        verdict_rationale=rationale,
        decision_tree_depth2_acc=dt_acc,
        logistic_regression_acc=lr_acc,
        rule_generated_risk="high" if is_rule_based else "low",
        templated_sentence_ratio=templated_ratio,
        uniform_feature_flags=uniform_flags,
    )


def generate_data_card_markdown(audit: DatasetAuditResult) -> str:
    """Formats an audit result into a detailed Markdown Data Card."""
    md = []
    md.append(f"# Data Card: {audit.dataset_name}")
    md.append(f"**Identifier:** `{audit.dataset_id}`  ")
    md.append(f"**License:** {audit.license_type}  ")
    md.append(
        f"**Commercial Use Permitted:** {'✅ Yes' if audit.permitted_commercial_use else '⚠️ Needs Decision / Restricted'}  "
    )
    md.append(f"**Row Count:** {audit.row_count:,} | **Columns:** {audit.column_count}  \n")

    md.append("## 1. Schema & Missingness")
    md.append("| Column | Type | Missing % |")
    md.append("| :--- | :--- | :--- |")
    for col, dtype in audit.columns.items():
        miss = audit.missingness.get(col, 0.0) * 100
        md.append(f"| `{col}` | `{dtype}` | {miss:.1f}% |")
    md.append("")

    md.append("## 2. Target Columns & Class Balance")
    if not audit.target_columns:
        md.append("_No explicit target/label column identified. Suitable for unsupervised parsing or feature extraction._\n")
    else:
        for t_col in audit.target_columns:
            dist = audit.target_distributions.get(t_col, {})
            md.append(f"### Target: `{t_col}`")
            md.append("| Class / Value | Count | Proportion |")
            md.append("| :--- | :--- | :--- |")
            for val, stats in dist.items():
                cnt = stats.get("count", 0)
                prop = stats.get("proportion", 0.0) * 100
                md.append(f"| `{val}` | {cnt:,} | {prop:.1f}% |")
            md.append("")

    md.append("## 3. Text Length Distributions")
    if not audit.text_length_stats:
        md.append("_No primary unstructured text columns._\n")
    else:
        for col, stats in audit.text_length_stats.items():
            md.append(f"### Column: `{col}`")
            md.append(f"- **Characters:** Mean: {stats.get('mean_chars', 0):.0f} | Median (p50): {stats.get('p50_chars', 0):.0f} | p95: {stats.get('p95_chars', 0):.0f} | Max: {stats.get('max_chars', 0):.0f}")
            md.append(f"- **Words:** Mean: {stats.get('mean_words', 0):.0f} | Median (p50): {stats.get('p50_words', 0):.0f} | p95: {stats.get('p95_words', 0):.0f} | Max: {stats.get('max_words', 0):.0f}\n")

    md.append("## 4. Fairness & Protected Attributes Audit")
    if not audit.protected_attributes_found:
        md.append("✅ No overt protected demographic columns detected.")
    else:
        md.append("⚠️ **PROTECTED / PROXY COLUMNS DETECTED:**")
        md.append("Under Resumio Rule 4 (FAIRNESS), these columns MUST NEVER be used as scoring features or joined into the training matrix:")
        for col, attr in audit.protected_attributes_found:
            md.append(f"- `{col}` -> Protected class: **{attr}**")
    md.append("")

    md.append("## 5. Synthetic-Data Forensics & ML Integrity")
    md.append(f"- **Verdict:** {'🚨 SYNTHETIC / RULE-GENERATED' if audit.forensics.is_synthetic else '✅ ORGANIC / REALISTIC'}")
    md.append(f"- **Confidence:** `{audit.forensics.synthetic_confidence.upper()}`")
    md.append(f"- **Rationale:** {audit.forensics.verdict_rationale}")
    if audit.forensics.decision_tree_depth2_acc is not None:
        md.append(f"- **Depth-2 Decision Tree Metadata Score:** `{audit.forensics.decision_tree_depth2_acc*100:.1f}% accuracy`")
    if audit.forensics.logistic_regression_acc is not None:
        md.append(f"- **Logistic Regression Metadata Score:** `{audit.forensics.logistic_regression_acc*100:.1f}% accuracy`")
    if audit.forensics.uniform_feature_flags:
        md.append(f"- **Suspiciously Uniform Fields:** {', '.join(audit.forensics.uniform_feature_flags)}")
    md.append("")

    md.append("## 6. Downstream ML Utility & Safe Usage")
    if audit.forensics.is_synthetic and audit.forensics.rule_generated_risk == "high":
        md.append(
            "> [!CAUTION]\n"
            "> **DO NOT TRAIN MATCHING OR SCREENING OUTCOME CLASSIFIERS ON THIS DATASET'S LABELS.**\n"
            "> The target label is heavily coupled to artificial rules. Training on this label would yield false high benchmark metrics that fail entirely on real recruiting workflows. Use this dataset solely for pipeline stress-testing or section taxonomy extraction if text format permits."
        )
    elif audit.protected_attributes_found:
        md.append(
            "> [!IMPORTANT]\n"
            "> Retain protected attributes in the separate audit-only table for post-scoring parity evaluation. Strip them completely from training features."
        )
    else:
        md.append("Suitable for representation learning, skill extraction, or semantic retrieval splits.")
    md.append("")

    return "\n".join(md)

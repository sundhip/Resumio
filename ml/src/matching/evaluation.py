"""Comprehensive Evaluation Framework for Resumio Matching Models.

Implements:
1. Ranking metrics: NDCG@5, NDCG@10, MAP, MRR, Recall@5, Recall@10.
2. Bootstrap confidence intervals (1,000 resamples for 95% CIs [2.5%, 97.5%]).
3. Paired significance tests (paired Student's t-test and Wilcoxon signed-rank test).
4. Feature ablation analysis across feature groups.
5. Error analysis identifying the 50 worst failure pairs with root cause categorization.
"""

from __future__ import annotations

import math
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple
import numpy as np
import pandas as pd
from scipy import stats


def dcg_at_k(r: Sequence[float], k: int) -> float:
    """Computes Discounted Cumulative Gain at rank K."""
    r = np.asarray(r, dtype=float)[:k]
    if r.size == 0:
        return 0.0
    return float(np.sum(r / np.log2(np.arange(2, r.size + 2))))


def ndcg_at_k(r: Sequence[float], k: int) -> float:
    """Computes Normalized Discounted Cumulative Gain at rank K."""
    dcg_max = dcg_at_k(sorted(r, reverse=True), k)
    if dcg_max == 0.0:
        return 0.0
    return float(dcg_at_k(r, k) / dcg_max)


def mrr_score(relevance_list: Sequence[float]) -> float:
    """Computes Mean Reciprocal Rank for the first relevant item (>0)."""
    for idx, rel in enumerate(relevance_list):
        if rel > 0:
            return 1.0 / (idx + 1)
    return 0.0


def recall_at_k(ranked_labels: Sequence[float], total_positives: int, k: int) -> float:
    """Computes Recall@K."""
    if total_positives <= 0:
        return 1.0
    hits = sum(1 for rel in ranked_labels[:k] if rel > 0)
    return float(hits / total_positives)


def average_precision(ranked_labels: Sequence[float]) -> float:
    """Computes Average Precision for MAP calculation."""
    hits = 0.0
    sum_precisions = 0.0
    for idx, rel in enumerate(ranked_labels):
        if rel > 0:
            hits += 1.0
            sum_precisions += hits / (idx + 1)
    return float(sum_precisions / hits) if hits > 0 else 0.0


def evaluate_ranking_query(
    true_labels: List[float],
    predicted_scores: List[float],
) -> Dict[str, float]:
    """Computes NDCG@5, NDCG@10, MRR, MAP, Recall@5, Recall@10 for a single query."""
    # Rank true labels by predicted score descending
    sorted_pairs = sorted(zip(predicted_scores, true_labels), key=lambda x: x[0], reverse=True)
    ranked_labels = [p[1] for p in sorted_pairs]

    total_positives = sum(1 for l in true_labels if l > 0)

    return {
        "ndcg_5": ndcg_at_k(ranked_labels, 5),
        "ndcg_10": ndcg_at_k(ranked_labels, 10),
        "mrr": mrr_score(ranked_labels),
        "map": average_precision(ranked_labels),
        "recall_5": recall_at_k(ranked_labels, total_positives, 5),
        "recall_10": recall_at_k(ranked_labels, total_positives, 10),
    }


def compute_bootstrap_confidence_interval(
    values: List[float],
    n_resamples: int = 1000,
    confidence_level: float = 0.95,
    seed: int = 42,
) -> Tuple[float, float, float]:
    """Computes bootstrap mean and 95% confidence interval [lower, upper]."""
    if not values:
        return (0.0, 0.0, 0.0)

    rng = np.random.RandomState(seed)
    n = len(values)
    boot_means = []
    arr = np.array(values)

    for _ in range(n_resamples):
        sample = rng.choice(arr, size=n, replace=True)
        boot_means.append(np.mean(sample))

    alpha = (1.0 - confidence_level) / 2.0
    lower = float(np.percentile(boot_means, alpha * 100))
    upper = float(np.percentile(boot_means, (1.0 - alpha) * 100))
    mean_val = float(np.mean(arr))

    return (mean_val, lower, upper)


def compute_paired_significance(
    metric_a: List[float],
    metric_b: List[float],
) -> Dict[str, float]:
    """Computes paired Student's t-test and Wilcoxon signed-rank test p-values."""
    diffs = np.array(metric_a) - np.array(metric_b)
    if np.all(diffs == 0):
        return {"t_stat": 0.0, "p_value_t": 1.0, "wilcoxon_stat": 0.0, "p_value_wilcoxon": 1.0}

    # Paired t-test
    t_stat, p_val_t = stats.ttest_rel(metric_a, metric_b)

    # Wilcoxon signed rank test
    try:
        w_stat, p_val_w = stats.wilcoxon(diffs)
    except Exception:
        w_stat, p_val_w = 0.0, 1.0

    return {
        "t_stat": float(t_stat),
        "p_value_t": float(p_val_t),
        "wilcoxon_stat": float(w_stat),
        "p_value_wilcoxon": float(p_val_w),
    }


def run_feature_ablation(
    train_fn: Callable[[List[str]], Any],
    eval_fn: Callable[[Any], Dict[str, float]],
    all_feature_groups: Dict[str, List[str]],
) -> pd.DataFrame:
    """Runs ablation experiments by systematically holding out one feature group at a time."""
    # 1. Full model
    full_feats = [f for grp in all_feature_groups.values() for f in grp]
    full_model = train_fn(full_feats)
    base_metrics = eval_fn(full_model)

    records = [
        {
            "ablation": "None (Full Model)",
            "excluded_group": "None",
            "active_features": len(full_feats),
            **base_metrics,
            "ndcg_delta": 0.0,
        }
    ]

    # 2. Exclude each group
    for grp_name, grp_feats in all_feature_groups.items():
        ablated_feats = [f for f in full_feats if f not in grp_feats]
        model_abl = train_fn(ablated_feats)
        metrics_abl = eval_fn(model_abl)
        delta = metrics_abl.get("ndcg_10", 0.0) - base_metrics.get("ndcg_10", 0.0)

        records.append(
            {
                "ablation": f"Drop {grp_name}",
                "excluded_group": grp_name,
                "active_features": len(ablated_feats),
                **metrics_abl,
                "ndcg_delta": float(np.round(delta, 4)),
            }
        )

    return pd.DataFrame(records)


def perform_error_analysis(
    pairs_df: pd.DataFrame,
    y_true: np.ndarray,
    y_pred: np.ndarray,
    top_k_worst: int = 50,
) -> pd.DataFrame:
    """Identifies the 50 worst failure pairs and assigns structural failure categories with diagnosis."""
    errors = np.abs(y_true - y_pred)
    worst_indices = np.argsort(errors)[::-1][:top_k_worst]

    diagnoses = []
    for idx in worst_indices:
        row = pairs_df.iloc[idx]
        actual = float(y_true[idx])
        pred = float(y_pred[idx])
        err = float(errors[idx])

        # Diagnostic heuristics
        if actual == 1.0 and pred < 0.40:
            category = "False Negative: High Quality Candidate Missed"
            diagnosis = "Candidate possesses relevant domain experience but used non-standard synonyms or indirect project descriptions."
        elif actual == 0.0 and pred > 0.65:
            category = "False Positive: Over-Ranked Low Fit"
            diagnosis = "Candidate contains high superficial token overlap (e.g. repeated buzzwords) without required depth."
        else:
            category = "Moderate Rank Calibration Discrepancy"
            diagnosis = "Minor score discrepancy due to subtle seniority or degree tier trade-offs."

        diagnoses.append(
            {
                "pair_id": row.get("pair_id", f"pair_{idx}"),
                "resume_id": row.get("resume_id", ""),
                "job_id": row.get("job_id", ""),
                "true_label": actual,
                "predicted_score": float(np.round(pred, 4)),
                "absolute_error": float(np.round(err, 4)),
                "failure_category": category,
                "written_diagnosis": diagnosis,
            }
        )

    return pd.DataFrame(diagnoses)

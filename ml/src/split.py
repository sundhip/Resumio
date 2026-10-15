"""Group-aware, stratified, and leakage-free dataset splitting.

Ensures:
1. No candidate or job group overlaps between Train, Validation, and Test.
2. Label distribution is stratified across splits.
3. Supports temporal splitting if a date/timestamp column is present.
4. Generates and locks the evaluation test set with a SHA-256 fingerprint.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
import numpy as np
import pandas as pd


@dataclass
class SplitSummary:
    total_records: int
    train_count: int
    val_count: int
    test_count: int
    train_ratio: float
    val_ratio: float
    test_ratio: float
    unique_candidates_train: int
    unique_candidates_val: int
    unique_candidates_test: int
    candidate_overlap: int
    test_set_fingerprint: str


def compute_dataframe_fingerprint(df: pd.DataFrame) -> str:
    """Computes a deterministic SHA-256 hash across sorted, serialized rows of a DataFrame."""
    if df.empty:
        return hashlib.sha256(b"empty").hexdigest()
    # Sort deterministically by all columns or primary key
    sorted_df = df.sort_values(by=list(df.columns)).reset_index(drop=True)
    serialized = sorted_df.to_json(orient="records", date_format="iso")
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def group_aware_split(
    df: pd.DataFrame,
    group_col: str,
    label_col: Optional[str] = None,
    time_col: Optional[str] = None,
    train_size: float = 0.70,
    val_size: float = 0.15,
    test_size: float = 0.15,
    seed: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, SplitSummary]:
    """Splits a DataFrame into train, val, and test partitions with zero group leakage.

    Args:
        df: Input DataFrame.
        group_col: Column indicating candidate/resume or entity grouping (e.g. 'candidate_id' or 'resume_id').
        label_col: Optional column indicating class/target label for stratified grouping.
        time_col: Optional timestamp column for chronological splitting.
        train_size: Fraction of groups for training.
        val_size: Fraction of groups for validation.
        test_size: Fraction of groups for evaluation.
        seed: Random seed.

    Returns:
        (train_df, val_df, test_df, split_summary)
    """
    assert np.isclose(train_size + val_size + test_size, 1.0), "Splits must sum to 1.0"

    if df.empty:
        empty = pd.DataFrame(columns=df.columns)
        return (
            empty,
            empty,
            empty,
            SplitSummary(0, 0, 0, 0, 0.0, 0.0, 0.0, 0, 0, 0, 0, "empty"),
        )

    # 1. Temporal splitting if time_col is provided
    if time_col and time_col in df.columns:
        sorted_df = df.sort_values(by=time_col).reset_index(drop=True)
        # Unique ordered groups by minimum timestamp
        group_min_time = sorted_df.groupby(group_col)[time_col].min().sort_values()
        groups = group_min_time.index.tolist()
        n_groups = len(groups)
        n_train = int(n_groups * train_size)
        n_val = int(n_groups * val_size)

        train_groups = set(groups[:n_train])
        val_groups = set(groups[n_train : n_train + n_val])
        test_groups = set(groups[n_train + n_val :])
    else:
        # 2. Stratified group sampling
        rng = np.random.RandomState(seed)

        if label_col and label_col in df.columns:
            # Determine predominant or first label for each group
            group_labels = df.groupby(group_col)[label_col].agg(
                lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0]
            )
            labels = group_labels.unique()

            train_groups_list: List[str] = []
            val_groups_list: List[str] = []
            test_groups_list: List[str] = []

            for lbl in labels:
                lbl_groups = group_labels[group_labels == lbl].index.tolist()
                rng.shuffle(lbl_groups)
                n = len(lbl_groups)
                n_tr = int(n * train_size)
                n_v = int(n * val_size)

                train_groups_list.extend(lbl_groups[:n_tr])
                val_groups_list.extend(lbl_groups[n_tr : n_tr + n_v])
                test_groups_list.extend(lbl_groups[n_tr + n_v :])

            train_groups = set(train_groups_list)
            val_groups = set(val_groups_list)
            test_groups = set(test_groups_list)
        else:
            groups = df[group_col].unique().tolist()
            rng.shuffle(groups)
            n = len(groups)
            n_tr = int(n * train_size)
            n_v = int(n * val_size)

            train_groups = set(groups[:n_tr])
            val_groups = set(groups[n_tr : n_tr + n_v])
            test_groups = set(groups[n_tr + n_v :])

    train_df = df[df[group_col].isin(train_groups)].copy().reset_index(drop=True)
    val_df = df[df[group_col].isin(val_groups)].copy().reset_index(drop=True)
    test_df = df[df[group_col].isin(test_groups)].copy().reset_index(drop=True)

    # Verification: check group intersection between splits
    overlap = len((train_groups & val_groups) | (train_groups & test_groups) | (val_groups & test_groups))
    assert overlap == 0, f"Critical Leakage! Detected {overlap} overlapping groups across splits!"

    test_fingerprint = compute_dataframe_fingerprint(test_df)

    summary = SplitSummary(
        total_records=len(df),
        train_count=len(train_df),
        val_count=len(val_df),
        test_count=len(test_df),
        train_ratio=len(train_df) / len(df) if len(df) > 0 else 0.0,
        val_ratio=len(val_df) / len(df) if len(df) > 0 else 0.0,
        test_ratio=len(test_df) / len(df) if len(df) > 0 else 0.0,
        unique_candidates_train=len(train_groups),
        unique_candidates_val=len(val_groups),
        unique_candidates_test=len(test_groups),
        candidate_overlap=overlap,
        test_set_fingerprint=test_fingerprint,
    )

    return train_df, val_df, test_df, summary


def lock_test_set(test_df: pd.DataFrame, output_dir: Path | str, dataset_name: str) -> Path:
    """Saves the locked test set to parquet and writes its SHA-256 fingerprint lockfile."""
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    parquet_file = out_path / f"{dataset_name}_locked_test.parquet"
    test_df.to_parquet(str(parquet_file), engine="pyarrow", index=False)

    fingerprint = compute_dataframe_fingerprint(test_df)
    lock_file = out_path / f"{dataset_name}_locked_test.sha256"
    lock_file.write_text(fingerprint, encoding="utf-8")
    return parquet_file


def verify_locked_test_set(parquet_file: Path | str, lock_file: Path | str) -> bool:
    """Verifies that the locked test set has not been altered or corrupted."""
    p_path = Path(parquet_file)
    l_path = Path(lock_file)
    if not p_path.exists() or not l_path.exists():
        return False
    df = pd.read_parquet(str(p_path))
    actual_hash = compute_dataframe_fingerprint(df)
    expected_hash = l_path.read_text(encoding="utf-8").strip()
    return actual_hash == expected_hash

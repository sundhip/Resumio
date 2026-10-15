"""Unit tests for group-aware splitting and locked test set verification."""

from pathlib import Path
import pandas as pd
import pytest
from ml.src.split import (
    compute_dataframe_fingerprint,
    group_aware_split,
    lock_test_set,
    verify_locked_test_set,
)


@pytest.fixture
def sample_candidates_df():
    data = []
    # 20 unique candidates, each having 2 applications with labels
    for c_idx in range(20):
        c_id = f"cand_{c_idx:03d}"
        lbl = "hire" if c_idx % 2 == 0 else "reject"
        data.append({"candidate_id": c_id, "job_id": "job_1", "label": lbl, "score": c_idx * 5})
        data.append({"candidate_id": c_id, "job_id": "job_2", "label": lbl, "score": c_idx * 5 + 1})
    return pd.DataFrame(data)


def test_group_aware_split_no_leakage(sample_candidates_df):
    train_df, val_df, test_df, summary = group_aware_split(
        sample_candidates_df,
        group_col="candidate_id",
        label_col="label",
        train_size=0.70,
        val_size=0.15,
        test_size=0.15,
        seed=42,
    )

    train_cands = set(train_df["candidate_id"])
    val_cands = set(val_df["candidate_id"])
    test_cands = set(test_df["candidate_id"])

    # Strict leakage assertion: zero candidate overlap
    assert len(train_cands.intersection(val_cands)) == 0
    assert len(train_cands.intersection(test_cands)) == 0
    assert len(val_cands.intersection(test_cands)) == 0
    assert summary.candidate_overlap == 0


def test_locked_test_set_guard(tmp_path: Path, sample_candidates_df):
    """Test guard verifying that locked test set integrity check passes when unchanged and fails if tampered."""
    _, _, test_df, _ = group_aware_split(
        sample_candidates_df,
        group_col="candidate_id",
        label_col="label",
        seed=42,
    )

    parquet_file = lock_test_set(test_df, tmp_path, "benchmark")
    lock_file = tmp_path / "benchmark_locked_test.sha256"

    assert parquet_file.exists()
    assert lock_file.exists()

    # Integrity verification must pass
    assert verify_locked_test_set(parquet_file, lock_file) is True

    # Tamper with the parquet file: append a row
    tampered_df = pd.concat([test_df, test_df.iloc[[0]]], ignore_index=True)
    tampered_df.to_parquet(str(parquet_file), index=False)

    # Verification must now fail!
    assert verify_locked_test_set(parquet_file, lock_file) is False

"""Unit tests for exact and near-duplicate detection."""

from ml.src.dedupe import (
    compute_sha256,
    deduplicate_records,
    get_shingles,
    jaccard_similarity,
)


def test_compute_sha256():
    h1 = compute_sha256("Python developer with React experience")
    h2 = compute_sha256("Python developer with React experience")
    h3 = compute_sha256("Java developer with Spring experience")
    assert h1 == h2
    assert h1 != h3


def test_jaccard_similarity():
    s1 = {"python developer", "developer with", "with react"}
    s2 = {"python developer", "developer with", "with vue"}
    sim = jaccard_similarity(s1, s2)
    # 2 in common out of 4 union -> 0.5
    assert abs(sim - 0.5) < 1e-4


def test_deduplicate_records_exact_and_near():
    records = [
        {"id": "rec-1", "text": "Senior Python developer building cloud APIs with Docker and Kubernetes.", "source": "ds_a"},
        {"id": "rec-2", "text": "Senior Python developer building cloud APIs with Docker and Kubernetes.", "source": "ds_b"},  # Exact cross-dataset
        {"id": "rec-3", "text": "Senior Python developer building cloud APIs with Docker and Kubernetes daily.", "source": "ds_a"},  # Near duplicate
        {"id": "rec-4", "text": "Healthcare registered nurse with ICU trauma experience and BLS certification.", "source": "ds_c"},  # Distinct
    ]

    kept, report = deduplicate_records(
        records,
        id_key="id",
        text_key="text",
        source_key="source",
        jaccard_threshold=0.80,
    )

    assert report.total_records == 4
    assert report.exact_duplicates_dropped == 1
    assert report.unique_records == 2  # rec-1 and rec-4 kept
    kept_ids = [r["id"] for r in kept]
    assert "rec-1" in kept_ids
    assert "rec-4" in kept_ids
    assert "rec-2" not in kept_ids

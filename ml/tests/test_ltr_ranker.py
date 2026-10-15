"""Unit tests for LightGBM LambdaMART Learning to Rank and Monotonicity."""

import numpy as np
import pytest

from ml.src.matching.feature_extractor import (
    FEATURE_NAMES,
    MONOTONIC_CONSTRAINTS,
    MatchingFeatureExtractor,
)
from ml.src.matching.ltr import LambdaMARTRanker


def test_monotonic_constraints_enforcement():
    """Asserts that matching more required skills or having more experience can never lower the score."""
    ranker = LambdaMARTRanker(n_estimators=30, learning_rate=0.1, seed=42)

    # Synthetic training data
    rng = np.random.RandomState(42)
    X = rng.rand(40, 18).astype(np.float32)
    # Higher required skills (col 7) correlates with higher label
    y = np.clip(X[:, 7] * 3.0 + X[:, 10] * 1.5, 0, 4).astype(np.int32)
    group = [20, 20]

    ranker.fit(X, y, group)

    # Test monotonic property on random test vectors
    for test_idx in range(10):
        vec = rng.rand(18).astype(np.float32)
        base_score = float(ranker.predict(vec.reshape(1, -1))[0])

        # Perturb required skill coverage (index 7, constraint +1)
        perturbed_skills = vec.copy()
        perturbed_skills[7] = min(1.0, perturbed_skills[7] + 0.3)
        new_score_skills = float(ranker.predict(perturbed_skills.reshape(1, -1))[0])

        assert new_score_skills >= base_score - 1e-5, (
            f"Monotonicity violation on required_skill_coverage! Base: {base_score}, New: {new_score_skills}"
        )

        # Perturb experience ratio (index 10, constraint +1)
        perturbed_exp = vec.copy()
        perturbed_exp[10] = min(2.0, perturbed_exp[10] + 0.5)
        new_score_exp = float(ranker.predict(perturbed_exp.reshape(1, -1))[0])

        assert new_score_exp >= base_score - 1e-5, (
            f"Monotonicity violation on experience_years_ratio! Base: {base_score}, New: {new_score_exp}"
        )


def test_feature_extractor_prohibits_protected_attributes():
    """Ensures extractor never outputs protected demographic columns."""
    extractor = MatchingFeatureExtractor()
    resume = {
        "cleaned_text": "Senior Developer with React and Python",
        "category": "Information-Technology",
        "age": 35,  # Raw metadata contains age
        "gender": "Female",
    }
    job = {
        "title": "Senior React Developer",
        "description": "Building modern React apps",
        "required_skills": ["React", "Python"],
    }

    features = extractor.extract_features(resume, job)
    assert "age" not in features
    assert "gender" not in features
    assert "race" not in features
    assert len(features) == 18

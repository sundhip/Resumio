"""Fairness test assertions enforcing Resumio Rule 4 (FAIRNESS).

Asserts that no protected demographic or prestige proxy attribute
(name, gender, age, photo, nationality, religion, marital status, disability,
or institution prestige) can ever appear in the training feature matrix.
"""

import pandas as pd
import pytest
from ml.src.canonical import PROHIBITED_TRAINING_COLUMNS, ProtectedAttributesAudit


def test_prohibited_columns_not_in_training_features():
    """Validates that a training feature set contains zero prohibited columns."""
    # Example legitimate feature matrix
    training_feature_df = pd.DataFrame(
        {
            "years_experience": [3.5, 7.0, 1.2],
            "skills_overlap_ratio": [0.85, 0.60, 0.92],
            "education_level_score": [2, 3, 2],
            "title_similarity": [0.78, 0.45, 0.88],
            "section_completeness": [1.0, 0.8, 0.9],
        }
    )

    feature_cols = set(c.lower() for c in training_feature_df.columns)
    violations = feature_cols.intersection(PROHIBITED_TRAINING_COLUMNS)

    assert len(violations) == 0, f"Critical Fairness Violation! Found prohibited columns: {violations}"


def test_prohibited_column_leak_fails_assertion():
    """Asserts that introducing any protected attribute triggers an immediate failure."""
    leaked_df = pd.DataFrame(
        {
            "years_experience": [5.0],
            "skills_overlap_ratio": [0.8],
            "age": [28],  # PROHIBITED!
            "gender": ["Female"],  # PROHIBITED!
            "university_tier": ["Tier 1"],  # PROHIBITED!
        }
    )

    feature_cols = set(c.lower() for c in leaked_df.columns)
    violations = feature_cols.intersection(PROHIBITED_TRAINING_COLUMNS)

    assert len(violations) > 0, "Expected fairness check to detect violations"
    assert "age" in violations
    assert "gender" in violations
    assert "university_tier" in violations


def test_protected_attributes_isolated_in_audit_table():
    """Ensures protected attributes can only be instantiated in the dedicated audit model."""
    audit_rec = ProtectedAttributesAudit(
        record_id="cand-999",
        source_dataset="rhythmghai/resume-screening-dataset-200k-candidates",
        age=29.0,
        gender="Non-Binary",
        university_tier="Tier 2",
        marital_status="Single",
    )
    assert audit_rec.age == 29.0
    assert audit_rec.gender == "Non-Binary"
    assert audit_rec.university_tier == "Tier 2"

"""Unit tests for Experience Analytics and Non-Overlapping Math Interval Unions (Phase 4).
Tests interval union calculation, per-skill active years, and non-penalizing career gap reporting.
"""

import pytest
from services.ml.src.ontology.experience_analytics import (
    ExperienceAnalytics,
    CareerInterval,
    union_intervals,
)


def test_union_intervals_no_overlap():
    # 2020-01 to 2020-12 (months 0 to 11) and 2021-01 to 2021-12 (months 12 to 23)
    intervals = [(0, 11), (12, 23)]
    merged = union_intervals(intervals)
    assert len(merged) == 2
    assert merged == [(0, 11), (12, 23)]


def test_union_intervals_partial_overlap():
    # Job 1: 2020-01 to 2021-12 (months 0 to 23) [24 months]
    # Job 2: 2021-06 to 2022-05 (months 17 to 28) [12 months]
    # Union should be: months 0 to 28 [29 months total], NOT 36 months!
    intervals = [(0, 23), (17, 28)]
    merged = union_intervals(intervals)
    assert len(merged) == 1
    assert merged[0] == (0, 28)
    months = merged[0][1] - merged[0][0] + 1
    assert months == 29, f"Expected 29 months, got {months}"


def test_union_intervals_full_containment():
    # Job 1: months 10 to 40
    # Job 2: months 15 to 25 (e.g. concurrent contract or consulting)
    intervals = [(10, 40), (15, 25)]
    merged = union_intervals(intervals)
    assert len(merged) == 1
    assert merged[0] == (10, 40)


def test_career_analysis_overlapping_roles_no_double_counting():
    # 2 concurrent roles spanning 24 months total
    roles = [
        CareerInterval(
            title="Senior Developer",
            company="Tech Corp",
            start_month=2020 * 12 + 0,
            end_month=2021 * 12 + 11,  # 24 months
            skills_used=["Python", "PostgreSQL"],
        ),
        CareerInterval(
            title="Consultant",
            company="Advisory LLC",
            start_month=2020 * 12 + 6,
            end_month=2021 * 12 + 5,   # 12 months completely within Job 1
            skills_used=["Python", "Docker"],
        ),
    ]

    report = ExperienceAnalytics.analyze_career(roles)

    # Total experience should be exactly 24 months (2.0 years), NOT 36 months
    assert report.total_experience_months == 24
    assert report.total_experience_years == 2.0

    # Per-skill active years should also not double-count
    assert report.per_skill_years["Python"] == 2.0
    assert report.per_skill_years["PostgreSQL"] == 2.0
    assert report.per_skill_years["Docker"] == 1.0


def test_career_gap_detection_informational_only():
    # Role 1: 2018-01 to 2019-12 (24 months)
    # Gap: 2020-01 to 2020-08 (8 months gap)
    # Role 2: 2020-09 to 2022-12 (28 months)
    roles = [
        CareerInterval(
            title="Junior Dev",
            company="Company A",
            start_month=2018 * 12 + 0,
            end_month=2019 * 12 + 11,
            skills_used=["JavaScript"],
        ),
        CareerInterval(
            title="Mid Dev",
            company="Company B",
            start_month=2020 * 12 + 8,
            end_month=2022 * 12 + 11,
            skills_used=["React"],
        ),
    ]

    report = ExperienceAnalytics.analyze_career(roles)

    assert len(report.career_gaps) == 1
    gap = report.career_gaps[0]
    assert gap.is_informational_only is True
    assert gap.gap_months >= 8
    assert "Informational notice only" in gap.disclaimer
    # Verify trajectory
    assert report.seniority_trajectory == ["Junior Dev", "Mid Dev"]

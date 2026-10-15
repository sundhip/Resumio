"""Unit tests for Contextual Experience Weighting Engine (Phase 4).
Tests evidence calculation, section weighting, recency decay, duration scaling,
impact bonuses (action verbs + metrics), role corroboration, and score bounds [0.0, 1.0].
"""

import pytest
from services.ml.src.ontology.weighting import (
    calculate_contextual_skill_score,
    evaluate_bullet_impact,
    compute_recency_weight,
)


def test_score_strictly_bounded_between_0_and_1():
    # Maximum inputs: experience, current role, long tenure, strong verbs, metrics, 5 roles, link
    max_result = calculate_contextual_skill_score(
        skill_name="React",
        section="experience",
        years_ago=0.0,
        duration_months=60,
        bullet_text="Architected and scaled distributed backend reducing latency by 45% for 10M users",
        independent_roles_count=5,
        co_occurring_skills_count=10,
        has_link=True,
    )
    assert 0.0 <= max_result.proficiency_score <= 1.0
    assert max_result.proficiency_score >= 0.95

    # Minimum inputs: general section, very old, short duration, no verbs, no metrics
    min_result = calculate_contextual_skill_score(
        skill_name="React",
        section="general",
        years_ago=8.0,
        duration_months=1,
        bullet_text="read some docs",
        independent_roles_count=1,
        co_occurring_skills_count=0,
        has_link=False,
    )
    assert 0.0 <= min_result.proficiency_score <= 1.0
    assert min_result.proficiency_score < 0.40


def test_section_weighting_hierarchy():
    bullet = "Engineered core modules using Python"
    exp = calculate_contextual_skill_score("Python", section="experience", bullet_text=bullet)
    proj = calculate_contextual_skill_score("Python", section="projects", bullet_text=bullet)
    skills = calculate_contextual_skill_score("Python", section="skills", bullet_text=bullet)
    gen = calculate_contextual_skill_score("Python", section="general", bullet_text=bullet)

    assert exp.section_weight == 1.00
    assert proj.section_weight == 0.85
    assert skills.section_weight == 0.60
    assert gen.section_weight == 0.40

    assert exp.proficiency_score > proj.proficiency_score
    assert proj.proficiency_score > skills.proficiency_score
    assert skills.proficiency_score > gen.proficiency_score


def test_recency_decay():
    res_recent = calculate_contextual_skill_score("Go", years_ago=0.5)
    res_1y = calculate_contextual_skill_score("Go", years_ago=1.5)
    res_3y = calculate_contextual_skill_score("Go", years_ago=3.0)
    res_5y = calculate_contextual_skill_score("Go", years_ago=6.0)

    assert res_recent.recency_weight == 1.00
    assert res_1y.recency_weight == 0.85
    assert res_3y.recency_weight == 0.70
    assert res_5y.recency_weight == 0.50

    assert res_recent.proficiency_score > res_1y.proficiency_score
    assert res_1y.proficiency_score > res_3y.proficiency_score
    assert res_3y.proficiency_score > res_5y.proficiency_score


def test_duration_scaling():
    res_short = calculate_contextual_skill_score("Kubernetes", duration_months=6)
    res_mid = calculate_contextual_skill_score("Kubernetes", duration_months=18)
    res_long = calculate_contextual_skill_score("Kubernetes", duration_months=36)
    res_capped = calculate_contextual_skill_score("Kubernetes", duration_months=72)

    assert res_short.duration_factor < res_mid.duration_factor
    assert res_mid.duration_factor < res_long.duration_factor
    assert res_long.duration_factor == 1.00
    assert res_capped.duration_factor == 1.00  # Capped at 36 months


def test_action_verbs_and_quantified_metrics():
    # Both action verb and metric
    has_v, has_m, bonus = evaluate_bullet_impact("Architected data pipeline reducing memory by 40% across 5M requests")
    assert has_v is True
    assert has_m is True
    assert bonus == 0.15

    # Verb only
    has_v, has_m, bonus = evaluate_bullet_impact("Architected and deployed cloud microservices")
    assert has_v is True
    assert has_m is False
    assert bonus == 0.05

    # Metric only
    has_v, has_m, bonus = evaluate_bullet_impact("Completed tasks resulting in 25% throughput growth")
    assert has_v is False
    assert has_m is True
    assert bonus == 0.05

    # Neither
    has_v, has_m, bonus = evaluate_bullet_impact("Familiar with team meetings and status updates")
    assert has_v is False
    assert has_m is False
    assert bonus == 0.00


def test_independent_roles_corroboration():
    one_role = calculate_contextual_skill_score("AWS", independent_roles_count=1)
    two_roles = calculate_contextual_skill_score("AWS", independent_roles_count=2)
    four_roles = calculate_contextual_skill_score("AWS", independent_roles_count=4)

    assert one_role.multi_role_bonus == 0.00
    assert two_roles.multi_role_bonus == 0.05
    assert four_roles.multi_role_bonus == 0.15  # Max bonus 0.15


def test_verified_link_bonus():
    unverified = calculate_contextual_skill_score("Docker", has_link=False)
    verified = calculate_contextual_skill_score("Docker", has_link=True)

    assert unverified.link_bonus == 0.00
    assert verified.link_bonus == 0.10
    assert verified.proficiency_score > unverified.proficiency_score


def test_transparency_and_explanation():
    result = calculate_contextual_skill_score(
        skill_name="PostgreSQL",
        section="experience",
        bullet_text="Optimized slow queries achieving 3x faster response times",
    )
    assert "Base" in result.explanation
    assert "Impact:" in result.explanation
    assert "PostgreSQL" in result.skill_name

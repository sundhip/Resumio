"""Contextual Experience Weighting Engine for Resumio Phase 4.

Computes multi-feature evidence scores (0.0 to 1.0) for every skill mention:
- Section prior (experience 1.0, projects 0.85, skills list 0.60, etc.)
- Recency decay (current 1.0, 1-2y 0.85, 2-4y 0.70, 4y+ 0.50)
- Role duration factor (log-linear duration scaling up to 36 months)
- Action verb + Quantified business metric impact bonus (+0.15)
- Repeated independent role occurrences (+0.05 per extra role, max +0.15)
- Co-occurring stack skills (+0.08)
- Verified external link / repository / certificate (+0.10)

Transparent, documented formula:
  Base = SectionWeight * RecencyWeight * (0.40 + 0.30 * DurationFactor)
  Score = min(1.0, Base + ImpactBonus + RoleBonus + CoOccurBonus + LinkBonus)
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set

ACTION_VERB_PATTERNS = [
    r"\b(?:architected|engineered|spearheaded|optimized|scaled|designed|implemented|built|refactored|deployed|developed|accelerated|automated|reduced|increased)\b"
]

QUANTIFIED_METRIC_PATTERNS = [
    r"\b\d+(?:\.\d+)?%(?!\w)",           # Percentages: 40%, 99.9%
    r"\$\d+(?:\.\d+)?[kKmMbB]?\b",       # Monetary: $50k, $1.2M
    r"\b\d+(?:\.\d+)?x\b",               # Multipliers: 10x, 3.5x
    r"\b\d+[kKmMbB]?\s*(?:ms|seconds|minutes|hours|days|requests|users|qps|rps|tb|gb)\b",  # Metrics: 5M requests, 200ms
    r"\b(?:thousands|millions|billions)\b",
]

SECTION_WEIGHTS: Dict[str, float] = {
    "experience": 1.00,
    "work_experience": 1.00,
    "projects": 0.85,
    "certifications": 0.75,
    "skills": 0.60,
    "technical_skills": 0.60,
    "education": 0.50,
    "coursework": 0.50,
    "summary": 0.40,
    "general": 0.40,
}


@dataclass
class SkillEvidenceFeatures:
    skill_name: str
    section: str
    section_weight: float
    recency_years: float
    recency_weight: float
    duration_months: int
    duration_factor: float
    has_action_verb: bool
    has_quantified_result: bool
    impact_bonus: float
    independent_roles_count: int
    multi_role_bonus: float
    co_occurring_count: int
    co_occur_bonus: float
    has_verified_link: bool
    link_bonus: float
    proficiency_score: float
    explanation: str


def compute_recency_weight(years_ago: float) -> float:
    if years_ago <= 1.0:
        return 1.00
    if years_ago <= 2.0:
        return 0.85
    if years_ago <= 4.0:
        return 0.70
    return 0.50


def evaluate_bullet_impact(text: str) -> Tuple[bool, bool, float]:
    """Inspects text for power action verbs and quantified business achievements."""
    has_verb = any(bool(re.search(pat, text, re.I)) for pat in ACTION_VERB_PATTERNS)
    has_metric = any(bool(re.search(pat, text, re.I)) for pat in QUANTIFIED_METRIC_PATTERNS)

    if has_verb and has_metric:
        return True, True, 0.15
    elif has_verb:
        return True, False, 0.05
    elif has_metric:
        return False, True, 0.05
    return False, False, 0.00


def calculate_contextual_skill_score(
    skill_name: str,
    section: str = "experience",
    years_ago: float = 0.5,
    duration_months: int = 24,
    bullet_text: str = "",
    independent_roles_count: int = 1,
    co_occurring_skills_count: int = 2,
    has_link: bool = False,
) -> SkillEvidenceFeatures:
    """Computes transparent, explainable 0.0-1.0 contextual proficiency score."""
    sec_key = section.lower().replace(" ", "_")
    sec_weight = SECTION_WEIGHTS.get(sec_key, 0.50)

    rec_weight = compute_recency_weight(years_ago)

    # Duration factor: capped at 36 months (3 years)
    dur_factor = min(1.0, round(duration_months / 36.0, 3))

    has_verb, has_metric, impact_bonus = evaluate_bullet_impact(bullet_text)

    # Multi-role corroboration bonus (+0.05 per role beyond first, max 0.15)
    role_bonus = min(0.15, max(0.0, (independent_roles_count - 1) * 0.05))

    # Co-occurring stack bonus
    co_occur_bonus = min(0.08, co_occurring_skills_count * 0.02)

    # Verified repo/cert link bonus
    link_bonus = 0.10 if has_link else 0.00

    # Base formula
    base_evidence = sec_weight * rec_weight * (0.40 + 0.30 * dur_factor)

    final_score = min(
        1.00,
        round(
            base_evidence + impact_bonus + role_bonus + co_occur_bonus + link_bonus,
            3,
        ),
    )

    explanation = (
        f"Base {base_evidence:.2f} (Section: {sec_weight:.2f}, Recency: {rec_weight:.2f}, Tenure: {duration_months}mo) "
        f"+ Impact: {impact_bonus:.2f} (Verb: {has_verb}, Metric: {has_metric}) "
        f"+ Corroboration: {role_bonus:.2f} ({independent_roles_count} roles) "
        f"+ Stack: {co_occur_bonus:.2f} "
        f"+ Verified Link: {link_bonus:.2f} = {final_score:.2f}"
    )

    return SkillEvidenceFeatures(
        skill_name=skill_name,
        section=section,
        section_weight=sec_weight,
        recency_years=years_ago,
        recency_weight=rec_weight,
        duration_months=duration_months,
        duration_factor=dur_factor,
        has_action_verb=has_verb,
        has_quantified_result=has_metric,
        impact_bonus=impact_bonus,
        independent_roles_count=independent_roles_count,
        multi_role_bonus=role_bonus,
        co_occurring_count=co_occurring_skills_count,
        co_occur_bonus=co_occur_bonus,
        has_verified_link=has_link,
        link_bonus=link_bonus,
        proficiency_score=final_score,
        explanation=explanation,
    )

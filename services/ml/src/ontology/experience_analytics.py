"""Career Experience Analytics Engine for Resumio Phase 4.

Calculates:
- Total non-overlapping career duration via mathematical union of date intervals
- Per-skill active years (non-overlapping union across roles where skill is present)
- Average tenure and role stability
- Seniority progression trajectory
- Informational career gap detection (STRICTLY NON-PENALIZING, never feeds match scores)
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple


@dataclass
class CareerInterval:
    title: str
    company: str
    start_month: int  # year * 12 + month
    end_month: int
    is_current: bool = False
    skills_used: List[str] = field(default_factory=list)


@dataclass
class CareerGap:
    start_year_month: str
    end_year_month: str
    gap_months: int
    is_informational_only: bool = True
    disclaimer: str = "Informational notice only: career gaps do not impact candidate ranking or match score."


@dataclass
class ExperienceAnalyticsReport:
    total_experience_months: int
    total_experience_years: float
    per_skill_years: Dict[str, float]
    average_tenure_months: float
    career_gaps: List[CareerGap]
    seniority_trajectory: List[str]
    roles_count: int


def month_to_string(m: int) -> str:
    year = m // 12
    month = (m % 12) + 1
    return f"{year}-{month:02d}"


def union_intervals(intervals: List[Tuple[int, int]]) -> List[Tuple[int, int]]:
    """Computes mathematical union of closed date intervals [start, end]."""
    if not intervals:
        return []

    sorted_intervals = sorted(intervals, key=lambda x: x[0])
    merged = [sorted_intervals[0]]

    for current in sorted_intervals[1:]:
        prev_start, prev_end = merged[-1]
        if current[0] <= prev_end:  # Overlapping or contiguous
            merged[-1] = (prev_start, max(prev_end, current[1]))
        else:
            merged.append(current)

    return merged


class ExperienceAnalytics:
    @staticmethod
    def analyze_career(roles: List[CareerInterval]) -> ExperienceAnalyticsReport:
        if not roles:
            return ExperienceAnalyticsReport(
                total_experience_months=0,
                total_experience_years=0.0,
                per_skill_years={},
                average_tenure_months=0.0,
                career_gaps=[],
                seniority_trajectory=[],
                roles_count=0,
            )

        # 1. Total Non-Overlapping Career Experience (Union)
        all_intervals = [(r.start_month, r.end_month) for r in roles if r.end_month >= r.start_month]
        merged_all = union_intervals(all_intervals)
        total_months = sum((end - start + 1) for start, end in merged_all)
        total_years = round(total_months / 12.0, 1)

        # 2. Per-Skill Non-Overlapping Experience
        skill_to_intervals: Dict[str, List[Tuple[int, int]]] = {}
        for r in roles:
            for s in r.skills_used:
                skill_clean = s.strip()
                if skill_clean not in skill_to_intervals:
                    skill_to_intervals[skill_clean] = []
                skill_to_intervals[skill_clean].append((r.start_month, r.end_month))

        per_skill_years: Dict[str, float] = {}
        for skill_name, intervals in skill_to_intervals.items():
            merged_skill_ints = union_intervals(intervals)
            skill_months = sum((end - start + 1) for start, end in merged_skill_ints)
            per_skill_years[skill_name] = round(skill_months / 12.0, 1)

        # 3. Average Tenure
        tenures = [(r.end_month - r.start_month + 1) for r in roles if r.end_month >= r.start_month]
        avg_tenure = round(sum(tenures) / len(tenures), 1) if tenures else 0.0

        # 4. Career Gap Detection (Informational Only, non-penalizing)
        gaps: List[CareerGap] = []
        if len(merged_all) > 1:
            for i in range(len(merged_all) - 1):
                gap_start = merged_all[i][1] + 1
                gap_end = merged_all[i + 1][0] - 1
                if gap_end >= gap_start:
                    gap_duration = gap_end - gap_start + 1
                    if gap_duration >= 3:  # Gaps >= 3 months noted
                        gaps.append(
                            CareerGap(
                                start_year_month=month_to_string(gap_start),
                                end_year_month=month_to_string(gap_end),
                                gap_months=gap_duration,
                            )
                        )

        # 5. Seniority Trajectory
        trajectory = [r.title for r in sorted(roles, key=lambda x: x.start_month)]

        return ExperienceAnalyticsReport(
            total_experience_months=total_months,
            total_experience_years=total_years,
            per_skill_years=per_skill_years,
            average_tenure_months=avg_tenure,
            career_gaps=gaps,
            seniority_trajectory=trajectory,
            roles_count=len(roles),
        )

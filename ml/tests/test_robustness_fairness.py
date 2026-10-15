"""Unit tests for Robustness, Prompt-Injection, and Counterfactual Fairness."""

import pytest

from ml.src.matching.baselines import BaselineB0Deterministic
from ml.src.matching.fairness import FairnessAuditor
from ml.src.matching.robustness import RobustnessTestSuite


def test_prompt_injection_invariance():
    b0 = BaselineB0Deterministic()
    runner = RobustnessTestSuite(
        score_fn=lambda r, j: b0.score(
            r.get("cleaned_text", ""),
            j.get("description", ""),
            required_skills=j.get("required_skills"),
        )
    )

    resume = {
        "cleaned_text": "Experienced Python Backend Engineer with Django and FastAPI.",
        "sections": {"skills": "Python, Django, FastAPI"},
    }
    job = {
        "title": "Backend Python Engineer",
        "description": "Looking for a Python engineer with FastAPI.",
        "required_skills": ["Python", "FastAPI"],
    }

    report = runner.test_prompt_injection(resume, job)
    assert report["status"] == "PASS"
    assert report["max_delta"] <= 0.03


def test_counterfactual_fairness_audit():
    b0 = BaselineB0Deterministic()
    auditor = FairnessAuditor(
        score_fn=lambda r, j: b0.score(
            r.get("cleaned_text", ""),
            j.get("description", ""),
            required_skills=j.get("required_skills"),
        )
    )

    resume = {
        "cleaned_text": "Software Engineer with 4 years building scalable services.",
        "sections": {"experience": "4 years of software development"},
    }
    job = {
        "title": "Software Engineer",
        "description": "General software engineering role",
        "required_skills": ["Software Engineer"],
    }

    report = auditor.run_counterfactual_audit(resume, job)
    assert report["status"] == "PASS"
    assert report["max_counterfactual_delta"] <= 0.01

"""Unit tests for Phase 5 Baselines (B0, B1, B2, B3)."""

import numpy as np
import pytest

from ml.src.matching.baselines import (
    BaselineB0Deterministic,
    BaselineB1BM25,
    BaselineB2TFIDF,
    BaselineB3DenseCosine,
    tokenize_clean,
)


def test_tokenize_clean():
    text = "Senior C++ and C# developer with .NET and React.js experience."
    tokens = tokenize_clean(text)
    assert "cpp" in tokens
    assert "csharp" in tokens
    assert "dotnet" in tokens
    assert "react" in tokens or "reactjs" in tokens or any("react" in t for t in tokens)


def test_baseline_b0_deterministic():
    b0 = BaselineB0Deterministic()
    resume = "Senior Full-Stack Engineer with React, TypeScript, Node.js and AWS experience."
    job = "We need a Senior Full-Stack Engineer with React, TypeScript, and AWS."

    score = b0.score(
        resume,
        job,
        required_skills=["React", "TypeScript", "AWS"],
        preferred_skills=["Node.js", "Docker"],
        candidate_years=5.0,
        required_years=3.0,
    )
    assert 0.80 <= score <= 1.0


def test_baseline_b1_bm25():
    corpus = [
        "React TypeScript Frontend Developer",
        "Python Machine Learning Data Scientist",
        "Financial Analyst with Equity Modeling",
    ]
    b1 = BaselineB1BM25(corpus)
    scores = b1.score_corpus("Frontend React Developer")
    assert len(scores) == 3
    assert scores[0] > scores[1]
    assert scores[0] > scores[2]


def test_baseline_b2_tfidf():
    b2 = BaselineB2TFIDF()
    sim = b2.score("React Node engineer", "React Node engineer with cloud experience")
    assert 0.5 <= sim <= 1.0

    unrelated_sim = b2.score("React Node engineer", "Registered Nurse Intensive Care")
    assert unrelated_sim < sim


def test_baseline_b3_dense_cosine():
    b3 = BaselineB3DenseCosine()
    v1 = b3.embed("Full stack software developer")
    v2 = b3.embed("Full stack web developer")
    v3 = b3.embed("Pediatric cardiovascular surgeon")

    sim_related = float(np.dot(v1, v2))
    sim_unrelated = float(np.dot(v1, v3))

    assert sim_related > sim_unrelated

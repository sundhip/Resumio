"""Unit tests for Section-Aware Hierarchical Dense Retriever."""

import pytest
from ml.src.matching.dense_retriever import (
    BGERetriever,
    MiniLMRetriever,
    MultilingualRetriever,
    SectionAwareHierarchicalRetriever,
)


def test_dense_retriever_contrastive_step():
    retriever = MiniLMRetriever()
    loss = retriever.train_contrastive_step(
        query="Frontend Engineer React",
        positive_doc="Senior React Developer with Redux experience",
        hard_negative_docs=["Registered ICU Nurse", "Financial Risk Analyst"],
    )
    assert loss >= 0.0


def test_section_aware_hierarchical_scoring():
    hierarchical = SectionAwareHierarchicalRetriever(
        aggregation_strategy="weighted_mean"
    )

    full_resume = "Candidate Resume with diverse background. Software and nursing."
    sections = {
        "experience": "5 years building React applications at TechCorp.",
        "skills": "React, TypeScript, Redux, Node.js",
        "education": "B.S. in Computer Science",
    }
    exp_entries = [
        "Led frontend migration to React 18 improving load time by 40%.",
        "Built responsive dashboards using TypeScript.",
    ]

    result = hierarchical.score_match(
        job_description="Looking for a React Frontend Developer with TypeScript.",
        resume_full_text=full_resume,
        sections=sections,
        experience_entries=exp_entries,
    )

    assert "aggregate_score" in result
    assert "section_similarities" in result
    assert result["aggregate_score"] > 0.50
    assert result["max_experience_entry_similarity"] > 0.50

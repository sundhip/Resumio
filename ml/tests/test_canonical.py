"""Unit tests for canonical schemas and Parquet serialization."""

import json
from pathlib import Path
import pytest
from pydantic import ValidationError
from ml.src.canonical import (
    JobRecord,
    LabelType,
    PairRecord,
    ProtectedAttributesAudit,
    ResumeRecord,
    SplitType,
    from_parquet,
    to_parquet,
)


def test_resume_record_valid():
    rec = ResumeRecord(
        resume_id="res-001",
        source="test_dataset",
        raw_text="Experienced Software Engineer with Python and React skills.",
        cleaned_text="Experienced Software Engineer with Python and React skills.",
        sections={"skills": "Python, React", "experience": "5 years at Acme Corp"},
        category="Information-Technology",
    )
    assert rec.resume_id == "res-001"
    assert rec.category == "Information-Technology"
    assert rec.sections["skills"] == "Python, React"


def test_resume_record_empty_raw_text_fails():
    with pytest.raises(ValidationError):
        ResumeRecord(
            resume_id="res-002",
            source="test_dataset",
            raw_text="   ",
            cleaned_text="",
        )


def test_job_record_valid():
    job = JobRecord(
        job_id="job-101",
        source="test_source",
        title="Senior Full Stack Engineer",
        description="Looking for 5+ years experience in TypeScript, React, Node.js.",
        required_skills=["TypeScript", "React", "Node.js"],
        preferred_skills=["Docker", "AWS"],
        seniority="Senior",
    )
    assert job.job_id == "job-101"
    assert len(job.required_skills) == 3


def test_pair_record_explicit_label_types():
    pair = PairRecord(
        pair_id="pair-001",
        resume_id="res-001",
        job_id="job-101",
        label=0.85,
        label_type=LabelType.RELEVANCE,
        label_source="recruiter_evaluation",
        split=SplitType.TRAIN,
    )
    assert pair.label_type == LabelType.RELEVANCE
    assert pair.split == SplitType.TRAIN


def test_parquet_round_trip(tmp_path: Path):
    parquet_file = tmp_path / "test_resumes.parquet"
    resumes = [
        ResumeRecord(
            resume_id=f"res-{i}",
            source="benchmark",
            raw_text=f"Sample resume content {i}",
            cleaned_text=f"Clean resume content {i}",
            sections={"experience": f"{i} years"},
            category="Engineering",
        )
        for i in range(5)
    ]
    to_parquet(resumes, parquet_file)
    assert parquet_file.exists()

    loaded = from_parquet(parquet_file, ResumeRecord)
    assert len(loaded) == 5
    assert loaded[0].resume_id == "res-0"
    assert loaded[0].sections == {"experience": "0 years"}

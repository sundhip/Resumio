"""Canonical data schemas for Resumio ML pipelines.

Defines Pydantic models and Parquet serialization for:
- resumes
- jobs
- pairs (explicit label types, never conflated)
- protected_attributes (audit-only table, NEVER joined to training features)
"""

from __future__ import annotations

import json
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional
import pandas as pd
from pydantic import BaseModel, ConfigDict, Field, field_validator


class LabelType(str, Enum):
    """Explicit semantics for pair labels to avoid conflating different targets."""
    RELEVANCE = "relevance"  # continuous or graded matching score [0, 1]
    SCREENING_OUTCOME = "screening_outcome"  # binary or categorical recruiter decision (hire/reject/interview)
    CATEGORY_MATCH = "category_match"  # binary match between resume domain and job domain


class SplitType(str, Enum):
    """Dataset partition splits."""
    TRAIN = "train"
    VAL = "val"
    TEST = "test"


class ResumeRecord(BaseModel):
    """Canonical representation of a parsed resume."""
    model_config = ConfigDict(frozen=True, extra="forbid")

    resume_id: str = Field(description="Unique deterministic ID (e.g. source:sha256)")
    source: str = Field(description="Originating dataset or pipeline source")
    raw_text: str = Field(description="Original uncleaned resume text or parsed string")
    cleaned_text: str = Field(description="Normalized, boilerplate-free, PII-scrubbed text")
    sections: Dict[str, str] = Field(
        default_factory=dict,
        description="Structured dictionary of extracted sections (skills, experience, education, etc.)"
    )
    category: Optional[str] = Field(
        default=None,
        description="High-level professional category (e.g. Information-Technology, Healthcare)"
    )
    protected_attrs: Dict[str, Any] = Field(
        default_factory=dict,
        description="Audit-only demographic and proxy attributes (kept separate for bias testing)"
    )

    @field_validator("raw_text")
    @classmethod
    def validate_raw_text_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("raw_text must not be empty")
        return v


class JobRecord(BaseModel):
    """Canonical representation of a job description."""
    model_config = ConfigDict(frozen=True, extra="forbid")

    job_id: str = Field(description="Unique deterministic ID")
    source: str = Field(description="Originating dataset or posting source")
    title: str = Field(description="Official job title")
    description: str = Field(description="Full text job description")
    required_skills: List[str] = Field(default_factory=list, description="Mandatory technical or soft skills")
    preferred_skills: List[str] = Field(default_factory=list, description="Nice-to-have or secondary skills")
    seniority: Optional[str] = Field(default=None, description="Seniority level (e.g. Entry, Mid, Senior, Lead)")

    @field_validator("title", "description")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field must not be empty")
        return v.strip()


class PairRecord(BaseModel):
    """Canonical representation of a Resume-Job pairing for ranking, retrieval, or classification."""
    model_config = ConfigDict(frozen=True, extra="forbid")

    pair_id: str = Field(description="Unique identifier for the pair (e.g. {resume_id}::{job_id})")
    resume_id: str = Field(description="Foreign key referencing ResumeRecord.resume_id")
    job_id: str = Field(description="Foreign key referencing JobRecord.job_id")
    label: float = Field(description="Numerical label value (e.g. 1.0/0.0, or continuous relevance)")
    label_type: LabelType = Field(description="Explicit type of label: relevance, screening_outcome, category_match")
    label_source: str = Field(description="Origin of the label: e.g. recruiter_decision, synthetic_rule, cosine_sim")
    split: SplitType = Field(description="Assigned partition: train, val, test")


class ProtectedAttributesAudit(BaseModel):
    """Audit-only demographic/proxy record. Strictly prohibited from training features."""
    model_config = ConfigDict(frozen=True, extra="forbid")

    record_id: str = Field(description="Foreign key matching resume_id or candidate_id")
    source_dataset: str = Field(description="Dataset source identifier")
    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[float] = None
    race: Optional[str] = None
    ethnicity: Optional[str] = None
    university_tier: Optional[str] = None
    marital_status: Optional[str] = None
    location: Optional[str] = None
    disability: Optional[str] = None


PROHIBITED_TRAINING_COLUMNS = {
    "name",
    "gender",
    "age",
    "race",
    "ethnicity",
    "nationality",
    "photo",
    "university_tier",
    "marital_status",
    "disability",
    "religion",
    "institution_prestige",
}


def to_parquet(records: List[BaseModel], file_path: Path | str) -> None:
    """Serializes a list of Pydantic canonical records to a Parquet file."""
    path = Path(file_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    if not records:
        df = pd.DataFrame()
    else:
        dicts = []
        for r in records:
            d = r.model_dump()
            # Serialize nested dicts/lists to JSON strings for robust columnar storage
            for k, v in d.items():
                if isinstance(v, (dict, list)):
                    d[k] = json.dumps(v, ensure_ascii=False)
            dicts.append(d)
        df = pd.DataFrame(dicts)
    df.to_parquet(str(path), engine="pyarrow", index=False)


def from_parquet(file_path: Path | str, model_cls: type[BaseModel]) -> List[BaseModel]:
    """Reads records from a Parquet file and deserializes them into Pydantic models."""
    path = Path(file_path)
    if not path.exists():
        return []
    df = pd.read_parquet(str(path))
    records = []
    for row in df.to_dict(orient="records"):
        for k, v in list(row.items()):
            if isinstance(v, str) and (v.startswith("{") or v.startswith("[")):
                try:
                    row[k] = json.loads(v)
                except (json.JSONDecodeError, ValueError):
                    pass
        records.append(model_cls.model_validate(row))
    return records

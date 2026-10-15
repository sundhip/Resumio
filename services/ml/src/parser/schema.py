"""Pydantic schema definitions for the ResumeDocument and ATS Parse-ability Report.
Mirrors packages/shared/src/resumeDocument.ts as the single source of truth.
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Literal, Optional, Tuple
from pydantic import BaseModel, ConfigDict, Field


class SourceSpan(BaseModel):
    model_config = ConfigDict(frozen=True)

    page: int = Field(default=1, ge=1)
    bbox: Optional[Tuple[float, float, float, float]] = None  # [x0, y0, x1, y1]
    char_start: Optional[int] = Field(default=None, alias="charStart")
    char_end: Optional[int] = Field(default=None, alias="charEnd")
    text: str = ""


class ContactInfo(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    full_name: str = Field(default="", alias="fullName")
    email: Optional[str] = ""
    phone: str = ""
    location: str = ""
    headline: str = ""
    linkedin: Optional[str] = ""
    github: Optional[str] = ""
    portfolio: Optional[str] = ""
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    source_span: Optional[SourceSpan] = Field(default=None, alias="sourceSpan")


class ExperienceEntry(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    job_title: str = Field(alias="jobTitle")
    company: str
    location: str = ""
    start_date: str = Field(default="", alias="startDate")
    end_date: str = Field(default="", alias="endDate")
    is_current: bool = Field(default=False, alias="isCurrent")
    duration_months: int = Field(default=0, ge=0, alias="durationMonths")
    responsibilities: List[str] = Field(default_factory=list)
    technologies_used: List[str] = Field(default_factory=list, alias="technologiesUsed")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    source_span: Optional[SourceSpan] = Field(default=None, alias="sourceSpan")


class EducationEntry(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    degree: str
    field_of_study: str = Field(default="", alias="fieldOfStudy")
    institution: str
    location: str = ""
    start_date: str = Field(default="", alias="startDate")
    end_date: str = Field(default="", alias="endDate")
    grade_or_gpa: str = Field(default="", alias="gradeOrGpa")
    honors: List[str] = Field(default_factory=list)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    source_span: Optional[SourceSpan] = Field(default=None, alias="sourceSpan")


class ProjectEntry(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    role: str = ""
    description: str = ""
    technologies: List[str] = Field(default_factory=list)
    url: Optional[str] = ""
    highlights: List[str] = Field(default_factory=list)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    source_span: Optional[SourceSpan] = Field(default=None, alias="sourceSpan")


class CertificationEntry(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    issuing_organization: str = Field(alias="issuingOrganization")
    issue_date: str = Field(default="", alias="issueDate")
    expiration_date: str = Field(default="", alias="expirationDate")
    credential_id: str = Field(default="", alias="credentialId")
    url: Optional[str] = ""
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    source_span: Optional[SourceSpan] = Field(default=None, alias="sourceSpan")


class ATSIssueSeverity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class ATSIssueCategory(str, Enum):
    LAYOUT_MULTI_COLUMN = "layout_multi_column"
    LAYOUT_COMPLEX_TABLES = "layout_complex_tables"
    HEADER_FOOTER_CONTACT = "header_footer_contact"
    GRAPHICS_SKILL_BARS = "graphics_skill_bars"
    NON_STANDARD_HEADINGS = "non_standard_headings"
    MISSING_SECTIONS = "missing_sections"
    INCONSISTENT_DATES = "inconsistent_dates"
    HIDDEN_OR_MICRO_TEXT = "hidden_or_micro_text"
    EXCESSIVE_LENGTH = "excessive_length"
    LOW_PRINTABLE_CHARACTER_RATIO = "low_printable_character_ratio"
    SCANNED_DOCUMENT = "scanned_document"
    UNSUPPORTED_ENCODING = "unsupported_encoding"


class ATSIssue(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    category: ATSIssueCategory
    severity: ATSIssueSeverity
    title: str
    description: str
    location: str = "General"
    recommendation: str
    source_span: Optional[SourceSpan] = Field(default=None, alias="sourceSpan")


class ATSParseabilityReport(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    score: float = Field(ge=0.0, le=100.0)
    status: Literal["excellent", "good", "needs_improvement", "poor"]
    discrepancy_ratio: float = Field(default=0.0, ge=0.0, le=1.0, alias="discrepancyRatio")
    strategy_agreement: Dict[str, float] = Field(default_factory=dict, alias="strategyAgreement")
    issues: List[ATSIssue] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    detected_layout: Literal["single_column", "multi_column", "mixed", "table_heavy"] = Field(
        default="single_column", alias="detectedLayout"
    )
    is_scanned_or_image: bool = Field(default=False, alias="isScannedOrImage")
    has_hidden_text: bool = Field(default=False, alias="hasHiddenText")
    disclaimer: str = (
        "This ATS Parse-ability score is a simulated diagnostic across multiple extraction heuristics. "
        "It does not guarantee behavior on any single commercial ATS vendor."
    )


class FileMetadata(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    file_name: str = Field(alias="fileName")
    file_size_bytes: int = Field(ge=0, alias="fileSizeBytes")
    file_format: Literal["PDF", "DOCX", "TXT", "MD", "RTF", "IMAGE"] = Field(alias="fileFormat")
    detected_mime_type: str = Field(alias="detectedMimeType")
    page_count: int = Field(default=1, ge=1, alias="pageCount")
    is_encrypted: bool = Field(default=False, alias="isEncrypted")
    file_hash_sha256: str = Field(alias="fileHashSha256")


class SkillItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    category: str = "General"
    years_of_experience: Optional[float] = Field(default=None, alias="yearsOfExperience")
    source_span: Optional[SourceSpan] = Field(default=None, alias="sourceSpan")


class ResumeDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    schema_version: Literal["2.0.0"] = Field(default="2.0.0", alias="schemaVersion")
    parser_version: str = Field(default="resumio-engine-v3.0.0", alias="parserVersion")
    document_id: str = Field(alias="documentId")
    candidate_id: Optional[str] = Field(default=None, alias="candidateId")
    file_metadata: FileMetadata = Field(alias="fileMetadata")
    contact: ContactInfo
    summary: str = ""
    skills: List[SkillItem] = Field(default_factory=list)
    experience: List[ExperienceEntry] = Field(default_factory=list)
    education: List[EducationEntry] = Field(default_factory=list)
    projects: List[ProjectEntry] = Field(default_factory=list)
    certifications: List[CertificationEntry] = Field(default_factory=list)
    languages: List[Dict[str, str]] = Field(default_factory=list)
    total_experience_months: int = Field(default=0, ge=0, alias="totalExperienceMonths")
    sections_detected: List[str] = Field(default_factory=list, alias="sectionsDetected")
    ats_report: ATSParseabilityReport = Field(alias="atsReport")
    extracted_at: str = Field(alias="extractedAt")
    user_corrections: Optional[Dict[str, Any]] = Field(default=None, alias="userCorrections")
    training_consent_opt_in: bool = Field(default=False, alias="trainingConsentOptIn")
    training_consent_timestamp: Optional[str] = Field(default=None, alias="trainingConsentTimestamp")

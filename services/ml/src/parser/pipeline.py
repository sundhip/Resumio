"""Master resume parsing pipeline orchestrator for Resumio Phase 3.

Connects:
1. Ingest (security, magic byte detection, sandboxing, zip-bomb & JS protection)
2. Extract (PyMuPDF multi-column reading order, DOCX, scan detection, hidden text detection)
3. Segment (Multilingual section heading classification)
4. Entity Extract (Contact, Experience with overlap-safe duration, Education, Skills)
5. ATS Diagnostics (Multi-strategy discrepancy, issue categorization, 0-100 score)
6. Emits canonical versioned ResumeDocument
"""

from __future__ import annotations

import base64
import datetime
import uuid
from typing import Optional
from .ats_scorer import evaluate_ats_parseability
from .entity_extractor import (
    calculate_overlap_safe_total_months,
    extract_contact_info,
    extract_education_entries,
    extract_experience_entries,
    extract_skills_list,
)
from .extractor import extract_document
from .ingest import ingest_file
from .schema import FileMetadata, ResumeDocument
from .segmenter import segment_document_sections


PARSER_VERSION = "resumio-engine-v3.0.0"


def parse_resume_document(
    file_bytes: Optional[bytes] = None,
    file_base64: Optional[str] = None,
    raw_text: Optional[str] = None,
    file_name: str = "resume.pdf",
    candidate_id: Optional[str] = None,
    ocr_engine: str = "tesseract",
) -> ResumeDocument:
    """End-to-end parsing of resume file bytes, base64 data, or raw text."""
    # Resolve input bytes
    if file_base64:
        # Strip data URL prefix if present
        if "," in file_base64:
            file_base64 = file_base64.split(",", 1)[1]
        data = base64.b64decode(file_base64)
    elif file_bytes:
        data = file_bytes
    elif raw_text:
        # Sanitize any embedded null characters from incoming text strings
        cleaned_raw = raw_text.replace("\x00", "")
        data = cleaned_raw.encode("utf-8")
        if not file_name.endswith(".txt") and not file_name.endswith(".md"):
            file_name = "resume.txt"
    else:
        raise ValueError("Must provide file_bytes, file_base64, or raw_text.")

    # 1. Ingestion & Security Validation
    ingest_res = ingest_file(data, file_name=file_name)

    # 2. Text, Layout & Hidden Text Extraction
    extraction = extract_document(
        ingest_res.clean_bytes,
        file_format=ingest_res.format,
        ocr_engine=ocr_engine,
    )

    # 3. Section Segmentation
    sections = segment_document_sections(extraction.blocks)

    # 4. Entity Extraction
    contact = extract_contact_info(extraction.blocks, sections.get("contact"))
    experience = extract_experience_entries(sections.get("experience"))
    education = extract_education_entries(sections.get("education"))
    skills = extract_skills_list(sections.get("skills"), extraction.full_text)
    total_months = calculate_overlap_safe_total_months(experience)

    summary_text = ""
    if "summary" in sections:
        summary_text = sections["summary"].raw_text

    # 5. ATS Parse-ability Evaluation
    ats_report = evaluate_ats_parseability(
        extraction=extraction,
        sections=sections,
        contact=contact,
        total_experience_months=total_months,
    )

    # 6. Assemble Canonical Document
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    file_metadata = FileMetadata(
        fileName=file_name,
        fileSizeBytes=ingest_res.file_size_bytes,
        fileFormat=ingest_res.format,
        detectedMimeType=ingest_res.mime_type,
        pageCount=ingest_res.page_count,
        isEncrypted=False,
        fileHashSha256=ingest_res.sha256,
    )

    return ResumeDocument(
        schemaVersion="2.0.0",
        parserVersion=PARSER_VERSION,
        documentId=doc_id,
        candidateId=candidate_id,
        fileMetadata=file_metadata,
        contact=contact,
        summary=summary_text,
        skills=skills,
        experience=experience,
        education=education,
        projects=[],
        certifications=[],
        languages=[],
        totalExperienceMonths=total_months,
        sectionsDetected=list(sections.keys()),
        atsReport=ats_report,
        extractedAt=now_iso,
    )

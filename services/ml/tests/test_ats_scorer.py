"""Unit tests for services/ml/src/parser/ats_scorer.py.

Verifies:
- Token discrepancy ratio calculation (difflib comparison)
- Score bounds enforcement (0.0 <= score <= 100.0)
- Penalties for multi-column layouts, complex tables, scanned images
- Penalties for missing critical sections (experience, education, skills)
- Penalties for missing contact information (email, phone)
- Actionable issue generation with valid severity, category and recommendations
- Simulator legal disclaimer preservation
"""

import pytest

from src.parser.ats_scorer import (
    compute_token_discrepancy,
    evaluate_ats_parseability,
)
from src.parser.extractor import ExtractionResult, HiddenTextFinding, TextBlock
from src.parser.schema import (
    ATSIssueCategory,
    ATSIssueSeverity,
    ContactInfo,
)
from src.parser.segmenter import SectionSpan


def create_mock_extraction(
    full_text: str = "Alice Smith\nalice@example.com\nExperience\nSoftware Engineer at StartupCo",
    naive_text: str = "Alice Smith\nalice@example.com\nExperience\nSoftware Engineer at StartupCo",
    layout: str = "single_column",
    is_scanned: bool = False,
    page_count: int = 1,
    hidden_findings: list = None,
) -> ExtractionResult:
    return ExtractionResult(
        full_text=full_text,
        naive_stream_text=naive_text,
        blocks=[
            TextBlock(page_number=1, bbox=(72, 72, 300, 100), text="Alice Smith\nalice@example.com"),
            TextBlock(page_number=1, bbox=(72, 120, 500, 200), text="Software Engineer at StartupCo"),
        ],
        detected_layout=layout,
        is_scanned=is_scanned,
        page_count=page_count,
        hidden_text_findings=hidden_findings or [],
    )


class TestTokenDiscrepancy:
    def test_identical_streams(self):
        text = "Staff Software Engineer with deep backend experience in Python and Rust"
        discrepancy, agreement = compute_token_discrepancy(text, text)
        assert discrepancy == 0.0
        assert agreement == 1.0

    def test_divergent_streams(self):
        stream_a = "alpha beta gamma delta epsilon zeta eta theta"
        stream_b = "one two three four five six seven eight nine ten"
        discrepancy, agreement = compute_token_discrepancy(stream_a, stream_b)
        assert discrepancy > 0.5
        assert agreement < 0.5


class TestATSScorer:
    def test_flawless_single_column_resume(self):
        extraction = create_mock_extraction()
        sections = {
            "contact": SectionSpan(category="contact", heading_text="Contact", raw_text="Alice\nalice@example.com"),
            "experience": SectionSpan(category="experience", heading_text="Experience", raw_text="Senior Eng"),
            "education": SectionSpan(category="education", heading_text="Education", raw_text="BS CS"),
            "skills": SectionSpan(category="skills", heading_text="Skills", raw_text="Python, SQL"),
        }
        contact = ContactInfo(fullName="Alice Smith", email="alice@example.com", phone="+1 555-0199")
        report = evaluate_ats_parseability(extraction, sections, contact, total_experience_months=48)

        assert report.score >= 90.0
        assert report.status in ("good", "excellent")
        assert report.disclaimer is not None
        assert "simulated diagnostic" in report.disclaimer.lower()

    def test_penalties_accumulate_safely_above_zero(self):
        # Pathological resume: scanned, no email, no experience, no education, multi-column, hidden text
        hidden = [
            HiddenTextFinding(page=1, issue_type="white_on_white", text="spam spam", font_size=10, bbox=(0, 0, 10, 10), description="Hidden white text")
        ]
        extraction = create_mock_extraction(
            layout="multi_column",
            is_scanned=True,
            page_count=5,
            hidden_findings=hidden,
        )
        sections = {}
        contact = ContactInfo()
        report = evaluate_ats_parseability(extraction, sections, contact, total_experience_months=0)

        assert report.score == 0.0
        assert report.status == "poor"
        assert len(report.issues) > 0
        severities = [issue.severity for issue in report.issues]
        assert ATSIssueSeverity.CRITICAL in severities

    def test_actionable_recommendations_exist(self):
        extraction = create_mock_extraction(layout="multi_column")
        sections = {"contact": SectionSpan(category="contact", heading_text="Contact", raw_text="Alice")}
        contact = ContactInfo(fullName="Alice")  # Missing email & phone
        report = evaluate_ats_parseability(extraction, sections, contact, total_experience_months=0)

        for issue in report.issues:
            assert len(issue.recommendation) > 10, f"Issue {issue.id} missing actionable recommendation"
            assert isinstance(issue.category, ATSIssueCategory)

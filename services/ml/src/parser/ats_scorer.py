"""ATS Parse-ability Scorer and Multi-Strategy Discrepancy Diagnostics.

Simulates how commercial ATS systems (Workday, Taleo, Greenhouse, Lever, iCIMS)
process the resume by measuring:
1. Multi-strategy token discrepancy ratio (Strategy A vs. Strategy B).
2. Layout pitfalls (multi-column, tables, header/footer contact info).
3. Quality & format penalties (hidden text, micro-fonts, missing sections, invalid dates).
4. Generates prioritized actionable remediation issues.
"""

from __future__ import annotations

import difflib
import re
from typing import Dict, List, Optional, Set, Tuple
from .extractor import ExtractionResult, HiddenTextFinding, TextBlock
from .schema import (
    ATSIssue,
    ATSIssueCategory,
    ATSIssueSeverity,
    ATSParseabilityReport,
    ContactInfo,
    SourceSpan,
)
from .segmenter import SectionSpan


def compute_token_discrepancy(naive_text: str, layout_text: str) -> Tuple[float, float]:
    """Measures disagreement between naive text stream extraction and layout-aware extraction."""
    words_naive = [w.lower() for w in re.findall(r"\w+", naive_text)]
    words_layout = [w.lower() for w in re.findall(r"\w+", layout_text)]

    if not words_naive or not words_layout:
        return 0.0, 1.0

    # Sequence matcher similarity ratio
    matcher = difflib.SequenceMatcher(None, words_naive[:500], words_layout[:500])
    similarity = matcher.ratio()
    discrepancy = 1.0 - similarity
    return round(discrepancy, 3), round(similarity, 3)


def evaluate_ats_parseability(
    extraction: ExtractionResult,
    sections: Dict[str, SectionSpan],
    contact: ContactInfo,
    total_experience_months: int,
) -> ATSParseabilityReport:
    """Computes the 0-100 ATS Parse-ability score and generates concrete remediation issues."""
    score = 100.0
    issues: List[ATSIssue] = []
    strengths: List[str] = []

    # 1. Multi-strategy Discrepancy Analysis
    discrepancy, agreement = compute_token_discrepancy(
        extraction.naive_stream_text, extraction.full_text
    )
    if discrepancy > 0.25:
        penalty = min(20.0, discrepancy * 40.0)
        score -= penalty
        issues.append(
            ATSIssue(
                id="issue_discrepancy",
                category=ATSIssueCategory.LAYOUT_MULTI_COLUMN,
                severity=ATSIssueSeverity.WARNING,
                title="Parser Reading-Order Disagreement",
                description=(
                    f"A {discrepancy*100:.1f}% discrepancy was detected between standard stream extraction and layout reconstruction. "
                    "Different ATS parsers may scramble the reading order of your sections."
                ),
                location="Layout Flow",
                recommendation="Convert multi-column blocks into a single-column, top-to-bottom layout.",
            )
        )
    else:
        strengths.append("High reading-order consistency across different text extraction strategies.")

    # 2. Multi-column layout penalty
    if extraction.detected_layout == "multi_column":
        score -= 12.0
        issues.append(
            ATSIssue(
                id="issue_multi_col",
                category=ATSIssueCategory.LAYOUT_MULTI_COLUMN,
                severity=ATSIssueSeverity.WARNING,
                title="Multi-Column Layout Detected",
                description="Side-by-side columns or sidebars often cause legacy ATS parsers to interleave unrelated text.",
                location="Page Layout",
                recommendation="Use a standard single-column format with clear vertical section dividers.",
            )
        )

    # 3. Table-heavy layout
    if extraction.detected_layout == "table_heavy":
        score -= 10.0
        issues.append(
            ATSIssue(
                id="issue_table_heavy",
                category=ATSIssueCategory.LAYOUT_COMPLEX_TABLES,
                severity=ATSIssueSeverity.WARNING,
                title="Nested or Borderless Tables Detected",
                description="Complex tables can confuse text flow and prevent keyword indexation in automated screening.",
                location="Tables",
                recommendation="Replace complex table matrices with bulleted lists.",
            )
        )

    # 4. Scanned / Rasterized document
    if extraction.is_scanned:
        score -= 30.0
        issues.append(
            ATSIssue(
                id="issue_scanned",
                category=ATSIssueCategory.SCANNED_DOCUMENT,
                severity=ATSIssueSeverity.CRITICAL,
                title="Scanned Image Document (No Text Layer)",
                description="Document requires optical character recognition (OCR). Many corporate ATS portals immediately reject image-only PDFs.",
                location="Document Format",
                recommendation="Export directly from Microsoft Word or Google Docs as a searchable text PDF.",
            )
        )
    else:
        strengths.append("Contains a clean, machine-readable digital text layer.")

    # 5. Hidden text, Micro-fonts, Keyword Stuffing
    if extraction.hidden_text_findings:
        for finding in extraction.hidden_text_findings:
            score -= 15.0
            issues.append(
                ATSIssue(
                    id=f"issue_hidden_{finding.issue_type}",
                    category=ATSIssueCategory.HIDDEN_OR_MICRO_TEXT,
                    severity=ATSIssueSeverity.CRITICAL,
                    title=f"Potential ATS Gaming Flag: {finding.issue_type.replace('_', ' ').title()}",
                    description=finding.description,
                    location=f"Page {finding.page}",
                    recommendation="Remove invisible, microscopic, or stuffed keywords. Modern ATS systems flag these as deceptive practices.",
                    source_span=SourceSpan(page=finding.page, bbox=finding.bbox, text=finding.text),
                )
            )

    # 6. Contact Information in Headers / Footers
    contact_in_hf = any(
        b.is_header_or_footer
        for b in extraction.blocks
        if contact.email in b.text or contact.phone in b.text
    )
    if contact_in_hf:
        score -= 8.0
        issues.append(
            ATSIssue(
                id="issue_hf_contact",
                category=ATSIssueCategory.HEADER_FOOTER_CONTACT,
                severity=ATSIssueSeverity.WARNING,
                title="Contact Info in Header/Footer Margin",
                description="Phone number or email is located in the top/bottom margin, which many parsers ignore.",
                location="Header / Footer",
                recommendation="Move your name, email, phone, and links into the main document body.",
            )
        )

    # 7. Essential Sections Presence
    if "experience" not in sections:
        score -= 20.0
        issues.append(
            ATSIssue(
                id="issue_missing_exp",
                category=ATSIssueCategory.MISSING_SECTIONS,
                severity=ATSIssueSeverity.CRITICAL,
                title="Missing Work Experience Section",
                description="No recognized 'Work Experience' or 'Employment History' section heading was found.",
                location="Sections",
                recommendation="Add a standard heading titled 'Experience' or 'Work History'.",
            )
        )
    else:
        strengths.append("Clearly identified Work Experience section.")

    if "education" not in sections:
        score -= 10.0
        issues.append(
            ATSIssue(
                id="issue_missing_edu",
                category=ATSIssueCategory.MISSING_SECTIONS,
                severity=ATSIssueSeverity.WARNING,
                title="Missing Education Section",
                description="No recognized 'Education' section heading was found.",
                location="Sections",
                recommendation="Add a clear 'Education' section with your degree and institution.",
            )
        )

    if "skills" not in sections:
        score -= 10.0
        issues.append(
            ATSIssue(
                id="issue_missing_skills",
                category=ATSIssueCategory.MISSING_SECTIONS,
                severity=ATSIssueSeverity.WARNING,
                title="Missing Dedicated Skills Section",
                description="Having a dedicated 'Skills' section improves ATS keyword extraction rate by up to 40%.",
                location="Sections",
                recommendation="Include a dedicated 'Technical Skills' or 'Core Competencies' section.",
            )
        )

    # 8. Missing Contact Details
    if not contact.email:
        score -= 15.0
        issues.append(
            ATSIssue(
                id="issue_no_email",
                category=ATSIssueCategory.HEADER_FOOTER_CONTACT,
                severity=ATSIssueSeverity.CRITICAL,
                title="No Valid Email Address Detected",
                description="Parsers could not identify a valid candidate email address.",
                location="Contact",
                recommendation="Include a clear email address in the contact section.",
            )
        )
    if not contact.phone:
        score -= 5.0
        issues.append(
            ATSIssue(
                id="issue_no_phone",
                category=ATSIssueCategory.HEADER_FOOTER_CONTACT,
                severity=ATSIssueSeverity.INFO,
                title="No Phone Number Detected",
                description="A telephone number with area code was not recognized.",
                location="Contact",
                recommendation="Provide a standardized phone number (e.g. +1 555-0199).",
            )
        )

    # 9. Document Page Length
    if extraction.page_count > 3:
        score -= 8.0
        issues.append(
            ATSIssue(
                id="issue_page_length",
                category=ATSIssueCategory.EXCESSIVE_LENGTH,
                severity=ATSIssueSeverity.WARNING,
                title=f"Excessive Document Length ({extraction.page_count} Pages)",
                description="Resumes longer than 2-3 pages often experience drop-off during recruiter review.",
                location="Page Count",
                recommendation="Condense content to 1 or 2 pages focusing on recent and relevant experience.",
            )
        )

    # Final bounded score
    final_score = max(0.0, min(100.0, round(score, 1)))

    status = "excellent"
    if final_score < 50.0:
        status = "poor"
    elif final_score < 70.0:
        status = "needs_improvement"
    elif final_score < 85.0:
        status = "good"

    return ATSParseabilityReport(
        score=final_score,
        status=status,
        discrepancy_ratio=discrepancy,
        strategy_agreement={"strategy_a_naive": agreement, "strategy_b_layout": 1.0},
        issues=issues,
        strengths=strengths,
        detected_layout=extraction.detected_layout,
        is_scanned_or_image=extraction.is_scanned,
        has_hidden_text=bool(extraction.hidden_text_findings),
    )

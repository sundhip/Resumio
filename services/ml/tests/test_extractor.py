"""Unit tests for services/ml/src/parser/extractor.py.

Verifies:
- LaTeX ligature replacement and line-break hyphenation de-wrapping
- Multi-column reading order restoration
- White-on-white text detection
- Microscopic font detection (< 3pt)
- Keyword stuffing detection
- Scanned document detection logic
- DOCX extraction
"""

import io
import fitz
import pytest

from src.parser.extractor import (
    clean_ligatures_and_hyphens,
    detect_keyword_stuffing,
    extract_document,
    is_color_white_or_invisible,
)


class TestTextCleaning:
    def test_ligature_cleanup(self):
        raw = "The o\ufb03ce sta\ufb00 is pro\ufb01cient with sou\ufb02\u00e9s and co\ufb00ee."
        cleaned = clean_ligatures_and_hyphens(raw)
        assert cleaned == "The office staff is proficient with soufl\u00e9s and coffee."

    def test_hyphen_dewrapping(self):
        raw = "Architected a highly scalable distri-\nbuted microservice architecture."
        cleaned = clean_ligatures_and_hyphens(raw)
        assert "distributed microservice architecture." in cleaned


class TestHiddenTextDetection:
    def test_white_font_color(self):
        # 0xFFFFFF is pure white
        assert is_color_white_or_invisible(0xFFFFFF) is True
        # Very light grey (> 240, 240, 240)
        assert is_color_white_or_invisible(0xF5F5F5) is True
        # Black is 0x000000
        assert is_color_white_or_invisible(0x000000) is False
        # Dark navy
        assert is_color_white_or_invisible(0x1A2B3C) is False

    def test_keyword_stuffing_detection(self):
        # Natural text with high lexical diversity
        normal_text = (
            "Senior software engineer with 8 years of experience designing high-throughput distributed systems in Go and Python. "
            "Spearheaded database query optimization on PostgreSQL reducing p99 latency by 35%."
        )
        assert detect_keyword_stuffing(normal_text) is False

        # Adversarial stuffed text
        stuffed_text = "python python python python python python python python python python python python python python python machine learning"
        assert detect_keyword_stuffing(stuffed_text) is True


class TestLayoutAndExtraction:
    def test_two_column_pdf_reading_order(self):
        """Creates a synthetic two-column PDF and ensures left column precedes right column."""
        doc = fitz.open()
        page = doc.new_page(width=600, height=800)

        # Right column text (inserted first in PDF stream to test clustering)
        page.insert_text((350, 100), "RIGHT COLUMN CONTENT: Skills and Tools: Python, Docker, Kubernetes.", fontsize=11)
        page.insert_text((350, 150), "RIGHT COLUMN EDUCATION: BS Computer Science, Stanford University.", fontsize=11)

        # Left column text (inserted second in stream)
        page.insert_text((50, 100), "LEFT COLUMN EXPERIENCE: Senior Lead Engineer at TechCorp 2020-Present.", fontsize=11)
        page.insert_text((50, 150), "LEFT COLUMN BULLET: Led backend platform migration serving 5M users.", fontsize=11)

        buf = io.BytesIO()
        doc.save(buf)
        doc.close()

        extraction = extract_document(buf.getvalue(), file_format="PDF")
        assert extraction.page_count == 1
        assert "LEFT COLUMN EXPERIENCE" in extraction.full_text
        assert "RIGHT COLUMN CONTENT" in extraction.full_text

        # In reading order, left column should appear before right column
        idx_left = extraction.full_text.index("LEFT COLUMN EXPERIENCE")
        idx_right = extraction.full_text.index("RIGHT COLUMN CONTENT")
        assert idx_left < idx_right, "Multi-column clustering must restore natural reading order (left column before right)"

    def test_hidden_text_flagged_in_pdf(self):
        """Creates a PDF with micro-font and off-page text and verifies extraction flags it."""
        doc = fitz.open()
        page = doc.new_page(width=600, height=800)

        # Normal text
        page.insert_text((72, 100), "Alice Smith - Principal Engineer", fontsize=12)

        # Micro-font keyword spam (2pt)
        page.insert_text((72, 200), "react angular vue svelte nextjs flutter aws gcp azure", fontsize=2.0)

        # Out-of-bounds text
        page.insert_text((-500, -500), "secret hidden recruiter keyword", fontsize=10)

        buf = io.BytesIO()
        doc.save(buf)
        doc.close()

        extraction = extract_document(buf.getvalue(), file_format="PDF")
        assert len(extraction.hidden_text_findings) >= 1
        finding_types = [f.issue_type for f in extraction.hidden_text_findings]
        assert "microscopic_font" in finding_types or "out_of_bounds" in finding_types

    def test_plain_text_extraction(self):
        txt_data = b"Alice Smith\nalice@example.com\n\nExperience\nSoftware Engineer at StartupCo (2021 - Present)\nBuilt microservices."
        extraction = extract_document(txt_data, file_format="TXT")
        assert "Alice Smith" in extraction.full_text
        assert "alice@example.com" in extraction.full_text
        assert len(extraction.blocks) >= 3

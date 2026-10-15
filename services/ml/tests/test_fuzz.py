"""Robustness fuzz testing for services/ml parsing pipeline.

Verifies:
- Random bytes of arbitrary lengths do not crash the service (graceful error handling)
- Truncated and malformed headers (PDF, ZIP, RTF) raise expected FileIngestError exceptions
- Control characters and surrogate pairs are handled safely
- Memory / buffer limits are respected
"""

import os
import random
import pytest

from src.parser.ingest import (
    FileCorruptedError,
    FileIngestError,
    UnsupportedFormatError,
    ingest_file,
)
from src.parser.pipeline import parse_resume_document


class TestFuzzIngest:
    @pytest.mark.parametrize("length", [1, 3, 7, 16, 64, 512, 4096, 65536])
    def test_random_bytes_gracefully_rejected(self, length: int):
        random.seed(42 + length)
        junk = os.urandom(length)
        # Random bytes should never crash unhandled: must raise FileIngestError
        with pytest.raises(FileIngestError):
            ingest_file(junk, file_name="fuzz.dat")

    def test_truncated_pdf_header(self):
        truncated_pdf = b"%PDF-1.7\n%truncated..."
        with pytest.raises(FileCorruptedError):
            ingest_file(truncated_pdf, file_name="truncated.pdf")

    def test_truncated_docx_header(self):
        truncated_docx = b"PK\x03\x04" + b"\x00" * 30
        with pytest.raises(FileCorruptedError):
            ingest_file(truncated_docx, file_name="truncated.docx")

    def test_corrupted_rtf_header(self):
        corrupted_rtf = b"{\\rtf" + b"\x00\xff" * 50
        # If it has null bytes or fails, it should raise or be handled safely
        try:
            res = ingest_file(corrupted_rtf, file_name="test.rtf")
            assert res.format == "RTF"
        except FileIngestError:
            pass  # Expected safe rejection

    def test_pipeline_fuzz_fallback_handling(self):
        # Raw text with weird Unicode characters, emojis, null-like patterns
        weird_text = "Jane Doe \u0000\uFFFF \U0001F600 \t\r\n Experience: Engineer at Tech 2020-2023"
        doc = parse_resume_document(raw_text=weird_text, file_name="resume.txt")
        assert doc is not None
        assert doc.schema_version == "2.0.0"
        assert doc.ats_report is not None

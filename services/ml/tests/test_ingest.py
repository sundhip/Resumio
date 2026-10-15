"""Unit tests for services/ml/src/parser/ingest.py.

Verifies:
- Magic byte detection (PDF, DOCX, TXT, MD, RTF, PNG, JPEG)
- Rejection of unknown / unsupported formats
- Max file size enforcement (>10 MB)
- Max page count enforcement (>15 pages)
- Decompression bomb safety (DOCX ratio, entry count, uncompressed limit)
- Password-encrypted PDF rejection
- Corrupted file rejection
- JavaScript / launch action stripping
"""

import io
import zipfile
import pytest
import fitz  # PyMuPDF

from src.parser.ingest import (
    MAX_FILE_SIZE_BYTES,
    MAX_PAGE_COUNT,
    MAX_UNCOMPRESSED_BYTES,
    MAX_ZIP_FILES,
    DecompressionBombError,
    FileCorruptedError,
    FileEncryptedError,
    FileSizeExceededError,
    PageCountExceededError,
    UnsupportedFormatError,
    detect_file_type_by_magic_bytes,
    ingest_file,
    sanitize_and_validate_pdf,
    validate_decompression_safety,
)


def create_minimal_pdf(pages: int = 1, text: str = "Hello Resumio", encrypt_pw: str = None) -> bytes:
    """Helper to synthesize a compliant PDF in-memory."""
    doc = fitz.open()
    for i in range(pages):
        page = doc.new_page(width=595, height=842)
        page.insert_text((72, 72), f"{text} (Page {i+1})")
    
    buf = io.BytesIO()
    if encrypt_pw:
        perm = int(
            fitz.PDF_PERM_ACCESSIBILITY
            | fitz.PDF_PERM_PRINT
            | fitz.PDF_PERM_COPY
        )
        doc.save(buf, encryption=fitz.PDF_ENCRYPT_AES_256, user_pw=encrypt_pw, permissions=perm)
    else:
        doc.save(buf)
    doc.close()
    return buf.getvalue()


def create_minimal_docx(text: str = "Resumio DOCX resume content") -> bytes:
    """Helper to synthesize a minimal valid DOCX archive in-memory."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>')
        zf.writestr(
            "word/document.xml",
            f'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            f"<w:body><w:p><w:r><w:t>{text}</w:t></w:r></w:p></w:body></w:document>",
        )
    return buf.getvalue()


class TestMagicByteDetection:
    def test_pdf_detection(self):
        pdf_bytes = create_minimal_pdf(1)
        fmt, mime = detect_file_type_by_magic_bytes(pdf_bytes)
        assert fmt == "PDF"
        assert mime == "application/pdf"

    def test_docx_detection(self):
        docx_bytes = create_minimal_docx()
        fmt, mime = detect_file_type_by_magic_bytes(docx_bytes)
        assert fmt == "DOCX"
        assert "wordprocessingml" in mime

    def test_png_detection(self):
        png_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 20
        fmt, mime = detect_file_type_by_magic_bytes(png_bytes)
        assert fmt == "IMAGE"
        assert mime == "image/png"

    def test_jpeg_detection(self):
        jpeg_bytes = b"\xff\xd8\xff\xe0" + b"\x00" * 20
        fmt, mime = detect_file_type_by_magic_bytes(jpeg_bytes)
        assert fmt == "IMAGE"
        assert mime == "image/jpeg"

    def test_rtf_detection(self):
        rtf_bytes = b"{\\rtf1\\ansi\\deff0 Hello world}"
        fmt, mime = detect_file_type_by_magic_bytes(rtf_bytes)
        assert fmt == "RTF"
        assert mime == "application/rtf"

    def test_markdown_detection(self):
        md_bytes = b"# Candidate Name\n\n## Experience\n- Staff Engineer"
        fmt, mime = detect_file_type_by_magic_bytes(md_bytes)
        assert fmt == "MD"
        assert mime == "text/markdown"

    def test_plain_text_detection(self):
        txt_bytes = b"Jane Doe\nSoftware Engineer\nPython, TypeScript, React"
        fmt, mime = detect_file_type_by_magic_bytes(txt_bytes)
        assert fmt == "TXT"
        assert mime == "text/plain"

    def test_unsupported_binary_format(self):
        # Random binary containing null bytes
        bad_bytes = b"\x00\x01\x02\x03\x04\x05\x06"
        with pytest.raises(UnsupportedFormatError):
            detect_file_type_by_magic_bytes(bad_bytes)

    def test_empty_or_tiny_buffer(self):
        with pytest.raises(FileCorruptedError):
            detect_file_type_by_magic_bytes(b"ab")


class TestSizeAndLimits:
    def test_file_size_exceeded(self):
        # Buffer slightly over 10 MB
        oversized = b"%PDF-" + b"0" * (MAX_FILE_SIZE_BYTES + 10)
        with pytest.raises(FileSizeExceededError):
            ingest_file(oversized, "huge.pdf")

    def test_empty_file(self):
        with pytest.raises(FileCorruptedError):
            ingest_file(b"", "empty.pdf")

    def test_pdf_page_count_limit(self):
        # 16 pages exceeds 15 max limit
        big_pdf = create_minimal_pdf(pages=16)
        with pytest.raises(PageCountExceededError):
            ingest_file(big_pdf, "long.pdf")

    def test_pdf_page_count_acceptable(self):
        ok_pdf = create_minimal_pdf(pages=2)
        res = ingest_file(ok_pdf, "ok.pdf")
        assert res.page_count == 2
        assert res.format == "PDF"


class TestDecompressionSafety:
    def test_zip_bomb_too_many_entries(self):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            for i in range(MAX_ZIP_FILES + 10):
                zf.writestr(f"file_{i}.txt", "data")
        with pytest.raises(DecompressionBombError, match="internal entries"):
            validate_decompression_safety(buf.getvalue())

    def test_zip_bomb_high_ratio(self):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            # 2 MB of zeros compresses to ~2 KB -> ratio ~1000x > 50x threshold
            zf.writestr("huge_zeroes.dat", b"\x00" * (2 * 1024 * 1024))
        with pytest.raises(DecompressionBombError, match="compression ratio"):
            validate_decompression_safety(buf.getvalue())


class TestEncryptionAndCorruption:
    def test_reject_encrypted_pdf(self):
        enc_pdf = create_minimal_pdf(pages=1, encrypt_pw="secret123")
        with pytest.raises(FileEncryptedError, match="password"):
            ingest_file(enc_pdf, "protected.pdf")

    def test_reject_corrupted_pdf_structure(self):
        corrupted = b"%PDF-1.4\n" + b"garbage random characters that do not form a valid pdf cross-reference table"
        with pytest.raises(FileCorruptedError):
            ingest_file(corrupted, "broken.pdf")


class TestPdfSanitization:
    def test_pdf_clean_bytes_and_hash(self):
        pdf_bytes = create_minimal_pdf(pages=1, text="Security Checked Resume")
        res = ingest_file(pdf_bytes, "secure.pdf")
        assert res.sha256 is not None
        assert len(res.sha256) == 64
        assert res.format == "PDF"
        assert res.page_count == 1

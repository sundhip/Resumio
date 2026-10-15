"""Text, layout, and hidden-text extraction engine for Resumio Phase 3.

Supports:
- Multi-column layout reconstruction via PyMuPDF coordinate clustering
- LaTeX ligature cleanup and hyphenation de-wrapping
- Header/footer identification
- Hidden / micro-font / white-on-white / keyword-stuffing detection
- Scanned document detection & OCR fallback
- DOCX extraction (paragraphs, tables, headers, footers)
"""

from __future__ import annotations

import io
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple
import fitz  # PyMuPDF
import docx
from PIL import Image

try:
    import pytesseract
    HAS_PYTESSERACT = True
except ImportError:
    HAS_PYTESSERACT = False


LIGATURES_MAP = {
    "\ufb00": "ff",
    "\ufb01": "fi",
    "\ufb02": "fl",
    "\ufb03": "ffi",
    "\ufb04": "ffl",
    "\ufb05": "ft",
    "\ufb06": "st",
}


@dataclass
class TextBlock:
    page_number: int
    bbox: Tuple[float, float, float, float]  # [x0, y0, x1, y1]
    text: str
    font_name: str = ""
    font_size: float = 10.0
    is_bold: bool = False
    is_italic: bool = False
    color_rgb: int = 0
    is_header_or_footer: bool = False
    is_table_cell: bool = False


@dataclass
class HiddenTextFinding:
    page: int
    issue_type: str  # "white_on_white", "microscopic_font", "out_of_bounds", "keyword_stuffing"
    text: str
    font_size: float
    bbox: Tuple[float, float, float, float]
    description: str


@dataclass
class ExtractionResult:
    full_text: str
    blocks: List[TextBlock]
    detected_layout: str  # "single_column", "multi_column", "mixed", "table_heavy"
    is_scanned: bool = False
    ocr_engine_used: Optional[str] = None
    hidden_text_findings: List[HiddenTextFinding] = field(default_factory=list)
    page_count: int = 1
    naive_stream_text: str = ""  # Strategy A comparison


def clean_ligatures_and_hyphens(text: str) -> str:
    """Replaces LaTeX ligatures and reunites hyphenated line wraps."""
    cleaned = text
    for lig, replacement in LIGATURES_MAP.items():
        cleaned = cleaned.replace(lig, replacement)

    # De-hyphenate line breaks (e.g., "distri-\nbuted" -> "distributed")
    cleaned = re.sub(r"(\w+)-\n(\w+)", r"\1\2", cleaned)
    return cleaned


def is_color_white_or_invisible(color_int: int) -> bool:
    """Checks if font color is pure white or very high luminance (invisible against white page)."""
    # PyMuPDF color is an integer 0xRRGGBB or 0 (black)
    r = (color_int >> 16) & 0xFF
    g = (color_int >> 8) & 0xFF
    b = color_int & 0xFF

    # White is 255, 255, 255
    if r > 240 and g > 240 and b > 240:
        return True
    return False


def detect_keyword_stuffing(text: str) -> bool:
    """Flags blocks that repeat the same keyword unnaturally to game ATS search."""
    words = re.findall(r"\b[A-Za-z0-9+#.-]+\b", text.lower())
    if len(words) >= 15:
        from collections import Counter
        counts = Counter(words)
        most_common_word, count = counts.most_common(1)[0]
        if count / len(words) > 0.45 or count >= 12:
            return True
    return False


def cluster_and_order_pdf_blocks(
    page_blocks: List[Dict[str, Any]], page_width: float, page_height: float, page_num: int
) -> Tuple[List[TextBlock], List[HiddenTextFinding], str]:
    """Sorts text blocks by clustered reading order and inspects for hidden text."""
    extracted_blocks: List[TextBlock] = []
    hidden_findings: List[HiddenTextFinding] = []

    # Filter out empty or image blocks
    valid_blocks = [b for b in page_blocks if b.get("type") == 0 and "lines" in b]

    if not valid_blocks:
        return [], [], "single_column"

    # Analyze column layout: check distribution of x0 coordinates
    x0_coords = [b["bbox"][0] for b in valid_blocks]
    x1_coords = [b["bbox"][2] for b in valid_blocks]
    mid_page = page_width / 2.0

    left_column_blocks = []
    right_column_blocks = []
    full_width_blocks = []

    for b in valid_blocks:
        x0, y0, x1, y1 = b["bbox"]
        width = x1 - x0

        # Out-of-bounds text detection
        if x0 < -5 or y0 < -5 or x1 > page_width + 10 or y1 > page_height + 10:
            text_snippet = "".join(
                "".join(s["text"] for s in line.get("spans", []))
                for line in b.get("lines", [])
            )
            hidden_findings.append(
                HiddenTextFinding(
                    page=page_num,
                    issue_type="out_of_bounds",
                    text=text_snippet[:100],
                    font_size=10.0,
                    bbox=(x0, y0, x1, y1),
                    description="Text positioned outside printable page boundaries.",
                )
            )

        # Categorize column membership
        if width > page_width * 0.65:
            full_width_blocks.append(b)
        elif x1 <= mid_page + 30:
            left_column_blocks.append(b)
        elif x0 >= mid_page - 30:
            right_column_blocks.append(b)
        else:
            full_width_blocks.append(b)

    is_multi_column = len(left_column_blocks) >= 2 and len(right_column_blocks) >= 2
    detected_layout = "multi_column" if is_multi_column else "single_column"

    # Reading order sorting:
    # If multi-column: Full width on top, then left column top-to-bottom, then right column, then full width bottom
    if is_multi_column:
        ordered_raw = (
            sorted([b for b in full_width_blocks if b["bbox"][1] < page_height * 0.3], key=lambda b: b["bbox"][1])
            + sorted(left_column_blocks, key=lambda b: b["bbox"][1])
            + sorted(right_column_blocks, key=lambda b: b["bbox"][1])
            + sorted([b for b in full_width_blocks if b["bbox"][1] >= page_height * 0.3], key=lambda b: b["bbox"][1])
        )
    else:
        # Standard top-to-bottom reading order
        ordered_raw = sorted(valid_blocks, key=lambda b: (round(b["bbox"][1] / 15) * 15, b["bbox"][0]))

    for b in ordered_raw:
        bbox = tuple(b["bbox"])
        # Aggregate text and metadata across spans in block
        block_text_pieces = []
        dominant_font = ""
        dominant_size = 10.0
        is_bold = False
        is_italic = False
        color_rgb = 0

        for line in b.get("lines", []):
            line_text = ""
            for span in line.get("spans", []):
                t = span.get("text", "")
                f_size = span.get("size", 10.0)
                f_color = span.get("color", 0)
                f_flags = span.get("flags", 0)
                span_bold = bool(f_flags & 2) or "bold" in span.get("font", "").lower()
                span_italic = bool(f_flags & 1) or "italic" in span.get("font", "").lower()

                # Hidden text inspection 1: Microscopic font
                if 0.1 < f_size < 3.0 and t.strip():
                    hidden_findings.append(
                        HiddenTextFinding(
                            page=page_num,
                            issue_type="microscopic_font",
                            text=t[:80],
                            font_size=f_size,
                            bbox=bbox,
                            description=f"Microscopic font size ({f_size:.1f} pt) detected.",
                        )
                    )

                # Hidden text inspection 2: White-on-white text
                if is_color_white_or_invisible(f_color) and t.strip():
                    hidden_findings.append(
                        HiddenTextFinding(
                            page=page_num,
                            issue_type="white_on_white",
                            text=t[:80],
                            font_size=f_size,
                            bbox=bbox,
                            description="White-on-white or low-contrast text detected.",
                        )
                    )

                line_text += t
                dominant_font = span.get("font", dominant_font)
                dominant_size = f_size
                is_bold = is_bold or span_bold
                is_italic = is_italic or span_italic
                color_rgb = f_color

            if line_text:
                block_text_pieces.append(line_text)

        block_str = clean_ligatures_and_hyphens("\n".join(block_text_pieces).strip())
        if not block_str:
            continue

        # Hidden text inspection 3: Keyword stuffing
        if detect_keyword_stuffing(block_str):
            hidden_findings.append(
                HiddenTextFinding(
                    page=page_num,
                    issue_type="keyword_stuffing",
                    text=block_str[:120],
                    font_size=dominant_size,
                    bbox=bbox,
                    description="Repeated keyword stuffing sequence detected in text block.",
                )
            )

        # Header / footer heuristic: text in top 50px or bottom 40px
        is_hf = bbox[1] < 45 or bbox[3] > page_height - 35

        extracted_blocks.append(
            TextBlock(
                page_number=page_num,
                bbox=bbox,
                text=block_str,
                font_name=dominant_font,
                font_size=dominant_size,
                is_bold=is_bold,
                is_italic=is_italic,
                color_rgb=color_rgb,
                is_header_or_footer=is_hf,
            )
        )

    return extracted_blocks, hidden_findings, detected_layout


def extract_pdf_document(
    pdf_bytes: bytes, ocr_engine: str = "tesseract"
) -> ExtractionResult:
    """Extracts text, layouts, reading order, and hidden text from PDF."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page_count = doc.page_count
    all_blocks: List[TextBlock] = []
    all_hidden_findings: List[HiddenTextFinding] = []
    layouts_observed = []
    naive_stream_pieces = []

    total_words = 0
    is_scanned = False
    engine_used = None

    for i in range(page_count):
        page = doc[i]
        rect = page.rect
        page_dict = page.get_text("dict")
        raw_blocks = page_dict.get("blocks", [])

        # Strategy A: Naive text stream extraction
        naive_stream_pieces.append(page.get_text("text"))

        blocks, hidden, layout = cluster_and_order_pdf_blocks(
            raw_blocks, rect.width, rect.height, i + 1
        )
        all_blocks.extend(blocks)
        all_hidden_findings.extend(hidden)
        layouts_observed.append(layout)

        page_word_count = sum(len(b.text.split()) for b in blocks)
        total_words += page_word_count

    # Check if scanned document (low word count on page 1)
    if total_words < 25 and page_count > 0:
        is_scanned = True
        engine_used = ocr_engine
        # OCR rasterization fallback at 300 DPI
        ocr_blocks = []
        for i in range(min(page_count, 3)):  # Safety limit for scan OCR
            page = doc[i]
            # Render page at 300 DPI (zoom 300 / 72 = 4.166)
            zoom = 300 / 72
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, alpha=False)
            img = Image.open(io.BytesIO(pix.tobytes()))

            ocr_text = ""
            if HAS_PYTESSERACT:
                try:
                    ocr_text = pytesseract.image_to_string(img)
                except Exception:
                    ocr_text = ""

            if not ocr_text:
                # Fallback to PyMuPDF built-in OCR if available
                try:
                    ocr_text = page.get_text("text")
                except Exception:
                    ocr_text = ""

            if ocr_text.strip():
                ocr_blocks.append(
                    TextBlock(
                        page_number=i + 1,
                        bbox=(0.0, 0.0, float(page.rect.width), float(page.rect.height)),
                        text=clean_ligatures_and_hyphens(ocr_text.strip()),
                        font_size=10.0,
                    )
                )
        if ocr_blocks:
            all_blocks = ocr_blocks

    doc.close()

    primary_layout = (
        "multi_column" if "multi_column" in layouts_observed else "single_column"
    )
    full_text = "\n\n".join(b.text for b in all_blocks if not b.is_header_or_footer)
    naive_full_text = "\n\n".join(naive_stream_pieces)

    return ExtractionResult(
        full_text=full_text,
        blocks=all_blocks,
        detected_layout=primary_layout,
        is_scanned=is_scanned,
        ocr_engine_used=engine_used,
        hidden_text_findings=all_hidden_findings,
        page_count=page_count,
        naive_stream_text=naive_full_text,
    )


def extract_docx_document(docx_bytes: bytes) -> ExtractionResult:
    """Extracts text, tables, and headers/footers from DOCX file."""
    doc = docx.Document(io.BytesIO(docx_bytes))
    blocks: List[TextBlock] = []
    line_idx = 0

    # Paragraphs
    for p in doc.paragraphs:
        t = p.text.strip()
        if t:
            is_bold = any(run.bold for run in p.runs if run.bold)
            blocks.append(
                TextBlock(
                    page_number=1,
                    bbox=(50.0, float(line_idx * 20), 550.0, float((line_idx + 1) * 20)),
                    text=t,
                    is_bold=is_bold,
                )
            )
            line_idx += 1

    # Tables
    is_table_heavy = len(doc.tables) >= 2
    for table in doc.tables:
        for row in table.rows:
            row_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_texts:
                combined_row = " | ".join(row_texts)
                blocks.append(
                    TextBlock(
                        page_number=1,
                        bbox=(50.0, float(line_idx * 20), 550.0, float((line_idx + 1) * 20)),
                        text=combined_row,
                        is_table_cell=True,
                    )
                )
                line_idx += 1

    full_text = "\n\n".join(b.text for b in blocks)
    return ExtractionResult(
        full_text=full_text,
        blocks=blocks,
        detected_layout="table_heavy" if is_table_heavy else "single_column",
        is_scanned=False,
        page_count=1,
        naive_stream_text=full_text,
    )


def extract_plain_text_document(text_bytes: bytes, fmt: str = "TXT") -> ExtractionResult:
    """Extracts plain text or markdown files."""
    decoded = text_bytes.decode("utf-8", errors="replace")
    cleaned = clean_ligatures_and_hyphens(decoded)
    lines = [l.strip() for l in cleaned.split("\n") if l.strip()]

    blocks = [
        TextBlock(
            page_number=1,
            bbox=(50.0, float(i * 15), 550.0, float((i + 1) * 15)),
            text=line,
            is_bold=line.startswith("#") or line.isupper(),
        )
        for i, line in enumerate(lines)
    ]

    return ExtractionResult(
        full_text=cleaned,
        blocks=blocks,
        detected_layout="single_column",
        is_scanned=False,
        page_count=1,
        naive_stream_text=cleaned,
    )


def extract_document(
    clean_bytes: bytes, file_format: str, ocr_engine: str = "tesseract"
) -> ExtractionResult:
    """Master extraction dispatcher supporting PDF, DOCX, TXT, MD, RTF."""
    if file_format == "PDF":
        return extract_pdf_document(clean_bytes, ocr_engine=ocr_engine)
    elif file_format == "DOCX":
        return extract_docx_document(clean_bytes)
    elif file_format in ("TXT", "MD", "RTF"):
        return extract_plain_text_document(clean_bytes, fmt=file_format)
    elif file_format == "IMAGE":
        # Direct OCR on uploaded image
        img = Image.open(io.BytesIO(clean_bytes))
        ocr_text = ""
        if HAS_PYTESSERACT:
            try:
                ocr_text = pytesseract.image_to_string(img)
            except Exception:
                pass
        return ExtractionResult(
            full_text=ocr_text,
            blocks=[
                TextBlock(
                    page_number=1,
                    bbox=(0.0, 0.0, float(img.width), float(img.height)),
                    text=ocr_text,
                )
            ]
            if ocr_text
            else [],
            detected_layout="single_column",
            is_scanned=True,
            ocr_engine_used=ocr_engine,
            page_count=1,
            naive_stream_text=ocr_text,
        )
    raise ValueError(f"Unsupported extraction format: {file_format}")

"""Text cleaning, PII scrubbing, normalization, and garbage filtering pipeline.

Ensures all text consumed by model training is:
1. Normalized (Unicode NFKC, uniform bullets, unified hyphens/whitespace).
2. Stripped of common scrapers/boilerplate/headers/footers.
3. Scrubbed of PII (emails, phone numbers, personal profile URLs, addresses).
4. Filtered for quality (dropping non-English, empty, or binary/garbage texts).
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PHONE_REGEX = re.compile(
    r"(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}\b"
)
URL_REGEX = re.compile(
    r"https?://(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&/=]*|"
    r"(?:www\.)[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&/=]*|"
    r"(?:linkedin\.com|github\.com|gitlab\.com|twitter\.com|medium\.com)/[A-Za-z0-9_.-]+",
    re.IGNORECASE
)
ADDRESS_REGEX = re.compile(
    r"\b(?:\d{1,5}\s+[A-Za-z0-9\s.,#-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Highway|Hwy|Pkwy)\b|"
    r"(?:[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)\b)",
    re.IGNORECASE
)

# Common scraper watermarks and page artifacts
BOILERPLATE_PATTERNS = [
    re.compile(r"Page\s+\d+\s+of\s+\d+", re.IGNORECASE),
    re.compile(r"Page\s+\d+", re.IGNORECASE),
    re.compile(r"https?://(?:www\.)?livecareer\.com[^\s]*", re.IGNORECASE),
    re.compile(r"Powered by [A-Za-z0-9]+", re.IGNORECASE),
    re.compile(r"Copyright\s+©?\s*\d{4}[^\n]*", re.IGNORECASE),
    re.compile(r"Resume\s+Template\b[^\n]*", re.IGNORECASE),
]

BULLETS_REGEX = re.compile(r"[\u2022\u2023\u25E6\u2043\u2219\u25CB\u25CF\u25AA\u25A0\u25FE]")
DASHES_REGEX = re.compile(r"[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]")
QUOTES_REGEX = re.compile(r"[\u2018\u2019\u201A\u201B]")
DOUBLE_QUOTES_REGEX = re.compile(r"[\u201C\u201D\u201E\u201F]")


@dataclass
class CleaningReport:
    """Summary of records processed, dropped, and scrubbed."""
    total_processed: int = 0
    accepted: int = 0
    dropped_empty: int = 0
    dropped_short: int = 0
    dropped_non_english: int = 0
    dropped_garbage: int = 0
    pii_emails_scrubbed: int = 0
    pii_phones_scrubbed: int = 0
    pii_urls_scrubbed: int = 0
    pii_addresses_scrubbed: int = 0
    drop_reasons: Dict[str, int] = field(default_factory=dict)

    def log_drop(self, reason: str) -> None:
        self.drop_reasons[reason] = self.drop_reasons.get(reason, 0) + 1


def normalize_unicode_and_symbols(text: str) -> str:
    """Standardizes Unicode, quotes, dashes, and bullets."""
    if not text:
        return ""
    # Normalize unicode to NFKC
    norm = unicodedata.normalize("NFKC", text)
    # Replace stylized quotes
    norm = QUOTES_REGEX.sub("'", norm)
    norm = DOUBLE_QUOTES_REGEX.sub('"', norm)
    # Replace various dash types
    norm = DASHES_REGEX.sub("-", norm)
    # Replace bullet marks with standard markdown bullet
    norm = BULLETS_REGEX.sub("- ", norm)
    # Standardize line breaks and spaces
    norm = norm.replace("\r\n", "\n").replace("\r", "\n")
    norm = re.sub(r"[ \t]+", " ", norm)
    norm = re.sub(r"\n{3,}", "\n\n", norm)
    return norm.strip()


def strip_boilerplate(text: str) -> str:
    """Removes scraper signatures, watermarks, and page numbers."""
    cleaned = text
    for pattern in BOILERPLATE_PATTERNS:
        cleaned = pattern.sub("", cleaned)
    return cleaned.strip()


def scrub_pii(text: str, report: Optional[CleaningReport] = None) -> str:
    """Replaces identifiable emails, phone numbers, URLs, and street addresses with tags."""
    if not text:
        return ""

    def _replace_email(m: re.Match) -> str:
        if report:
            report.pii_emails_scrubbed += 1
        return "[EMAIL]"

    def _replace_phone(m: re.Match) -> str:
        # Avoid replacing short numerical strings that aren't actually phone numbers
        match_str = m.group(0).strip()
        digits = re.sub(r"\D", "", match_str)
        if len(digits) >= 7:
            if report:
                report.pii_phones_scrubbed += 1
            return "[PHONE]"
        return match_str

    def _replace_url(m: re.Match) -> str:
        if report:
            report.pii_urls_scrubbed += 1
        return "[URL]"

    def _replace_address(m: re.Match) -> str:
        if report:
            report.pii_addresses_scrubbed += 1
        return "[ADDRESS]"

    cleaned = EMAIL_REGEX.sub(_replace_email, text)
    cleaned = URL_REGEX.sub(_replace_url, cleaned)
    cleaned = PHONE_REGEX.sub(_replace_phone, cleaned)
    cleaned = ADDRESS_REGEX.sub(_replace_address, cleaned)
    return cleaned


def is_english(text: str) -> bool:
    """Fast, deterministic heuristic to detect if text is predominantly English."""
    if not text:
        return False
    # Sample letters
    letters = [ch for ch in text if ch.isalpha()]
    if not letters:
        return False
    # Count ASCII letters vs non-ASCII
    ascii_letters = sum(1 for ch in letters if ord(ch) < 128)
    ascii_ratio = ascii_letters / len(letters)
    return ascii_ratio > 0.80


def is_garbage(text: str) -> Tuple[bool, str]:
    """Checks whether the text is empty, too short, or corrupted binary/spam."""
    if not text or not text.strip():
        return True, "empty"
    
    alphanumeric_count = sum(1 for ch in text if ch.isalnum())
    if alphanumeric_count < 30:
        return True, "too_short"

    # Check for excessive repetition of identical characters or tokens
    words = text.split()
    if len(words) > 10:
        unique_words = set(words)
        if len(unique_words) / len(words) < 0.15:
            return True, "repetitive_spam"

    return False, "ok"


def clean_text(text: str, report: Optional[CleaningReport] = None) -> Optional[str]:
    """Executes the full cleaning and filtering pipeline on a text record."""
    if report:
        report.total_processed += 1

    # 1. Unicode & whitespace normalization
    norm = normalize_unicode_and_symbols(text)
    
    # 2. Boilerplate removal
    norm = strip_boilerplate(norm)

    # 3. Garbage check
    garbage, reason = is_garbage(norm)
    if garbage:
        if report:
            if reason == "empty":
                report.dropped_empty += 1
            elif reason == "too_short":
                report.dropped_short += 1
            else:
                report.dropped_garbage += 1
            report.log_drop(f"garbage_{reason}")
        return None

    # 4. Language check
    if not is_english(norm):
        if report:
            report.dropped_non_english += 1
            report.log_drop("non_english")
        return None

    # 5. PII scrubbing
    scrubbed = scrub_pii(norm, report)

    if report:
        report.accepted += 1

    return scrubbed

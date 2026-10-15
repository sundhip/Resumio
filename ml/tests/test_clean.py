"""Unit tests for cleaning, PII scrubbing, and quality filtering."""

from ml.src.clean import (
    CleaningReport,
    clean_text,
    is_english,
    is_garbage,
    normalize_unicode_and_symbols,
    scrub_pii,
    strip_boilerplate,
)


def test_normalize_unicode_and_symbols():
    raw = "Senior\u2013Level Engineer \u2022 Python \u201cFastAPI\u201d & \u2018SQL\u2019"
    norm = normalize_unicode_and_symbols(raw)
    assert "Senior-Level" in norm
    assert "- Python" in norm
    assert '"FastAPI"' in norm
    assert "'SQL'" in norm


def test_strip_boilerplate():
    raw = "Page 1 of 3\nExperienced Developer\nhttps://www.livecareer.com/templates\nBuilt modern web apps."
    cleaned = strip_boilerplate(raw)
    assert "Page 1 of 3" not in cleaned
    assert "livecareer.com" not in cleaned
    assert "Experienced Developer" in cleaned


def test_scrub_pii():
    text = (
        "Contact me at jane.doe@example.com or call +1 (555) 234-5678. "
        "Portfolio: https://linkedin.com/in/janedoe. Located at 123 Main Street, Boston, MA 02108."
    )
    report = CleaningReport()
    scrubbed = scrub_pii(text, report)

    assert "jane.doe@example.com" not in scrubbed
    assert "[EMAIL]" in scrubbed

    assert "+1 (555) 234-5678" not in scrubbed
    assert "[PHONE]" in scrubbed

    assert "linkedin.com/in/janedoe" not in scrubbed
    assert "[URL]" in scrubbed

    assert "123 Main Street" not in scrubbed
    assert "[ADDRESS]" in scrubbed

    assert report.pii_emails_scrubbed == 1
    assert report.pii_phones_scrubbed == 1
    assert report.pii_urls_scrubbed >= 1


def test_is_english():
    assert is_english("Experienced Software Engineer with deep expertise in Python and distributed systems.") is True
    assert is_english("Bonjour, je suis développeur web avec dix ans d'expérience.") is True
    # Non-Latin script
    assert is_english("Привет мир как дела я разработчик") is False


def test_is_garbage():
    assert is_garbage("")[0] is True
    assert is_garbage("short text")[0] is True
    assert is_garbage("Software Engineer with 8 years of production development experience across backend systems.")[0] is False


def test_clean_text_end_to_end():
    report = CleaningReport()
    sample = (
        "Page 2 of 4\n"
        "John Doe • Lead Architect\n"
        "Reach out: john.doe@work.com | (212) 555-0199\n"
        "Over 10 years of experience architecting large-scale cloud services and RESTful APIs using Python, Go, and Kubernetes."
    )
    result = clean_text(sample, report)
    assert result is not None
    assert "[EMAIL]" in result
    assert "[PHONE]" in result
    assert "Page 2 of 4" not in result
    assert report.accepted == 1
    assert report.total_processed == 1

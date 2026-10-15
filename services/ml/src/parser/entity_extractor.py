"""Entity extraction with confidence scoring, date parsing, and source span attribution.

Extracts:
- Contact details (RFC email, phone, LinkedIn, GitHub, portfolio)
- Work experience entries with overlap-safe duration math
- Education entries with degree and institution recognition
- Projects, Certifications, Languages, and Skills
- Associates every field with a verifiable SourceSpan (page, bbox, text snippet)
"""

from __future__ import annotations

import datetime
import re
from typing import Any, Dict, List, Optional, Tuple
from .extractor import TextBlock
from .schema import (
    CertificationEntry,
    ContactInfo,
    EducationEntry,
    ExperienceEntry,
    ProjectEntry,
    SkillItem,
    SourceSpan,
)
from .segmenter import SectionSpan


# RFC Email Regex
EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")

# International and domestic phone formats
PHONE_REGEX = re.compile(
    r"(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}\b"
)

# Social and portfolio profiles
LINKEDIN_REGEX = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/in/([A-Za-z0-9_.-]+)", re.I)
GITHUB_REGEX = re.compile(r"(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9_.-]+)", re.I)
PORTFOLIO_REGEX = re.compile(r"https?://(?:www\.)?([A-Za-z0-9_.-]+\.[a-z]{2,}(?:/[A-Za-z0-9_.~#?&/=]*)?)", re.I)

# Standard Degree patterns
DEGREE_PATTERNS = [
    re.compile(r"\b(?:Ph\.?D|Doctor\s+of\s+Philosophy)\b", re.I),
    re.compile(r"\b(?:Master\s+of\s+Science|M\.?S|M\.?Sc|M\.?Tech|Master\s+of\s+Arts|M\.?A|MBA)\b", re.I),
    re.compile(r"\b(?:Bachelor\s+of\s+Science|B\.?S|B\.?Sc|B\.?Tech|B\.?E|Bachelor\s+of\s+Arts|B\.?A|BBA)\b", re.I),
    re.compile(r"\b(?:Associate\s+Degree|Associate\s+of\s+Science|A\.?S)\b", re.I),
    re.compile(r"\b(?:Diploma|Higher\s+National\s+Diploma|Certificate)\b", re.I),
]

# Common months for parsing messy date forms
MONTH_MAP = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "september": 9, "sept": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
    # Seasons
    "spring": 3, "summer": 6, "fall": 9, "autumn": 9, "winter": 12
}


def parse_single_date(date_str: str) -> Optional[Tuple[int, int]]:
    """Parses a messy date string into (year, month). Supports 'Jan 2021', '2019', 'Summer 2023'."""
    s = date_str.strip().lower()
    if not s or "present" in s or "current" in s or "now" in s:
        now = datetime.datetime.now()
        return (now.year, now.month)

    # Check for 4-digit year: 19xx or 20xx
    year_match = re.search(r"\b(19\d{2}|20\d{2})\b", s)
    if not year_match:
        # Check for 2-digit year: '21 -> 2021
        two_digit = re.search(r"['’](\d{2})\b", s)
        if two_digit:
            yr = 2000 + int(two_digit.group(1))
        else:
            return None
    else:
        yr = int(year_match.group(1))

    # Look for month token
    month = 1
    for m_token, m_val in MONTH_MAP.items():
        if re.search(rf"\b{m_token}\b", s):
            month = m_val
            break

    # Look for MM/YYYY format
    slash_match = re.search(r"\b(0?[1-9]|1[0-2])/(?:19\d{2}|20\d{2}|\d{2})\b", s)
    if slash_match:
        month = int(slash_match.group(1))

    return (yr, month)


def parse_date_range(range_str: str) -> Tuple[str, str, int, bool]:
    """Extracts start_date, end_date, total_months duration, and is_current."""
    cleaned = range_str.strip()
    is_current = bool(re.search(r"\b(present|current|now|ongoing)\b", cleaned, re.I))

    # Match separator: to, -, –, —, /
    parts = re.split(r"\s*(?:-|–|—|to)\s*", cleaned, maxsplit=1)
    start_str = parts[0].strip() if len(parts) > 0 else ""
    end_str = parts[1].strip() if len(parts) > 1 else ("Present" if is_current else "")

    start_parsed = parse_single_date(start_str)
    end_parsed = parse_single_date(end_str) if end_str else None

    duration_months = 0
    if start_parsed and end_parsed:
        y1, m1 = start_parsed
        y2, m2 = end_parsed
        diff = (y2 - y1) * 12 + (m2 - m1)
        duration_months = max(diff, 1)

    return start_str, end_str, duration_months, is_current


def calculate_overlap_safe_total_months(experiences: List[ExperienceEntry]) -> int:
    """Calculates non-overlapping career duration by merging overlapping intervals."""
    intervals = []
    for exp in experiences:
        p_start = parse_single_date(exp.start_date)
        p_end = parse_single_date(exp.end_date)
        if p_start and p_end:
            m_start = p_start[0] * 12 + p_start[1]
            m_end = p_end[0] * 12 + p_end[1]
            if m_end >= m_start:
                intervals.append((m_start, m_end))

    if not intervals:
        return sum(exp.duration_months for exp in experiences)

    # Merge intervals
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for current in intervals[1:]:
        prev_start, prev_end = merged[-1]
        if current[0] <= prev_end:
            merged[-1] = (prev_start, max(prev_end, current[1]))
        else:
            merged.append(current)

    total_months = sum(end - start for start, end in merged)
    return total_months


def extract_contact_info(
    doc_blocks: List[TextBlock], contact_section: Optional[SectionSpan] = None
) -> ContactInfo:
    """Extracts candidate identity, email, phone, location, and profiles."""
    search_blocks = contact_section.blocks if contact_section else doc_blocks[:5]
    combined_text = "\n".join(b.text for b in search_blocks)

    email = ""
    phone = ""
    linkedin = ""
    github = ""
    portfolio = ""
    full_name = ""
    headline = ""

    # Email
    email_m = EMAIL_REGEX.search(combined_text)
    if email_m:
        email = email_m.group(0).strip()

    # Phone
    phone_m = PHONE_REGEX.search(combined_text)
    if phone_m:
        digits = re.sub(r"\D", "", phone_m.group(0))
        if 7 <= len(digits) <= 15:
            phone = phone_m.group(0).strip()

    # Profiles
    li_m = LINKEDIN_REGEX.search(combined_text)
    if li_m:
        linkedin = f"https://linkedin.com/in/{li_m.group(1)}"

    gh_m = GITHUB_REGEX.search(combined_text)
    if gh_m:
        github = f"https://github.com/gh_m.group(1)"

    port_m = PORTFOLIO_REGEX.search(combined_text)
    if port_m and not li_m and not gh_m:
        portfolio = port_m.group(0)

    # Name: Top block with prominent font or uppercase letters
    for b in search_blocks:
        first_line = b.text.split("\n")[0].strip()
        # Avoid lines containing email or phone as the candidate name
        if not EMAIL_REGEX.search(first_line) and not PHONE_REGEX.search(first_line):
            words = first_line.split()
            if 2 <= len(words) <= 4 and all(w.isalpha() or "." in w for w in words):
                full_name = first_line
                # Check for headline in second line
                lines = b.text.split("\n")
                if len(lines) > 1 and len(lines[1].strip()) < 80:
                    headline = lines[1].strip()
                break

    source_span = None
    if search_blocks:
        source_span = SourceSpan(
            page=search_blocks[0].page_number,
            bbox=search_blocks[0].bbox,
            text=combined_text[:150],
        )

    return ContactInfo(
        full_name=full_name,
        email=email,
        phone=phone,
        location="",
        headline=headline,
        linkedin=linkedin,
        github=github,
        portfolio=portfolio,
        confidence=0.95 if (email and full_name) else 0.70,
        source_span=source_span,
    )


def extract_experience_entries(experience_sec: Optional[SectionSpan]) -> List[ExperienceEntry]:
    """Extracts structured employment records with dates, responsibilities, and source spans."""
    if not experience_sec or not experience_sec.blocks:
        return []

    entries: List[ExperienceEntry] = []
    lines = experience_sec.raw_text.split("\n")
    current_entry: Optional[Dict[str, Any]] = None

    date_range_regex = re.compile(
        r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*['’]?\d{2,4})\s*(?:-|–|—|to)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*['’]?\d{2,4}|Present|Current|Ongoing)\b",
        re.I,
    )

    for i, line in enumerate(lines):
        line_clean = line.strip()
        if not line_clean:
            continue

        date_match = date_range_regex.search(line_clean)
        # Heading heuristic for new job role: contains date range or known title pattern
        if date_match or (any(kw in line_clean.lower() for kw in ["engineer", "developer", "manager", "lead", "analyst", "specialist"]) and len(line_clean) < 80):
            if current_entry:
                entries.append(ExperienceEntry(**current_entry))

            start_d, end_d, dur_m, is_curr = ("", "", 0, False)
            title = line_clean
            company = "Company"

            if date_match:
                start_d, end_d, dur_m, is_curr = parse_date_range(date_match.group(0))
                title = date_range_regex.sub("", line_clean).strip(" -–|:,")

            # Extract "Title at Company"
            if " at " in title:
                parts = title.split(" at ", 1)
                title, company = parts[0].strip(), parts[1].strip()
            elif " | " in title:
                parts = title.split(" | ", 1)
                title, company = parts[0].strip(), parts[1].strip()
            elif " - " in title:
                parts = title.split(" - ", 1)
                title, company = parts[0].strip(), parts[1].strip()

            current_entry = {
                "id": f"exp_{len(entries) + 1}",
                "jobTitle": title or "Professional Role",
                "company": company or "Organization",
                "location": "",
                "startDate": start_d,
                "endDate": end_d,
                "isCurrent": is_curr,
                "durationMonths": dur_m,
                "responsibilities": [],
                "technologiesUsed": [],
                "confidence": 0.90 if date_match else 0.75,
                "sourceSpan": SourceSpan(
                    page=experience_sec.start_page,
                    text=line_clean[:100],
                ),
            }
        else:
            if current_entry:
                bullet = re.sub(r"^[-*•#\d.]+\s*", "", line_clean)
                current_entry["responsibilities"].append(bullet)

    if current_entry:
        entries.append(ExperienceEntry(**current_entry))

    return entries


def extract_education_entries(education_sec: Optional[SectionSpan]) -> List[EducationEntry]:
    """Extracts degree, institution, and graduation dates."""
    if not education_sec or not education_sec.blocks:
        return []

    entries: List[EducationEntry] = []
    lines = education_sec.raw_text.split("\n")

    for i, line in enumerate(lines):
        line_clean = line.strip()
        if not line_clean:
            continue

        deg_match = None
        for pat in DEGREE_PATTERNS:
            m = pat.search(line_clean)
            if m:
                deg_match = m.group(0)
                break

        if deg_match:
            inst = "University / College"
            # Next line or rest of string often has the institution
            rem = line_clean.replace(deg_match, "").strip(" ,-|in")
            if rem and len(rem) > 3:
                inst = rem
            elif i + 1 < len(lines):
                next_l = lines[i + 1].strip()
                if "university" in next_l.lower() or "college" in next_l.lower() or "institute" in next_l.lower():
                    inst = next_l

            yr_m = re.search(r"\b(19\d{2}|20\d{2})\b", line_clean)
            grad_year = yr_m.group(0) if yr_m else ""

            entries.append(
                EducationEntry(
                    id=f"edu_{len(entries) + 1}",
                    degree=deg_match,
                    fieldOfStudy="",
                    institution=inst,
                    startDate="",
                    endDate=grad_year,
                    gradeOrGpa="",
                    confidence=0.90,
                    sourceSpan=SourceSpan(
                        page=education_sec.start_page,
                        text=line_clean[:100],
                    ),
                )
            )

    return entries


def extract_skills_list(
    skills_sec: Optional[SectionSpan], full_text: str
) -> List[SkillItem]:
    """Extracts skills from dedicated skills section or whole text."""
    found_skills: List[SkillItem] = []
    seen = set()

    # 1. Parse tokens directly from dedicated skills section if present
    if skills_sec and skills_sec.raw_text:
        lines = skills_sec.raw_text.split("\n")
        for line in lines:
            line_str = re.sub(
                r"^(?:languages|frameworks|technologies|tools|specialties|core stack|technical skills|skills|stack)[:\s-]*",
                "",
                line.strip(),
                flags=re.I,
            ).strip()
            tokens = re.split(r"[,•|;]+", line_str)
            for tok in tokens:
                cleaned = tok.strip().strip("•-* ")
                if 2 <= len(cleaned) <= 30 and not re.search(r"^(?:skills|experience|education|projects|summary)$", cleaned, re.I):
                    if cleaned.lower() not in seen:
                        seen.add(cleaned.lower())
                        found_skills.append(
                            SkillItem(
                                name=cleaned,
                                category="Technical",
                                sourceSpan=SourceSpan(
                                    page=skills_sec.start_page,
                                    text=cleaned,
                                ),
                            )
                        )

    # 2. Canonical skills vocabulary scan
    common_skills = [
        "Python", "TypeScript", "JavaScript", "React", "Node.js", "Express.js",
        "FastAPI", "Docker", "Kubernetes", "AWS", "GCP", "Azure", "PostgreSQL",
        "MongoDB", "SQL", "Git", "REST APIs", "GraphQL", "Tailwind CSS", "HTML5",
        "CSS3", "CI/CD", "Linux", "Machine Learning", "NLP", "Agile", "Scrum",
        "Java", "Spring Boot", "Go", "Golang", "Rust", "C++", "C#", ".NET",
        "Kafka", "Redis", "Oracle", "gRPC", "PyTorch", "TensorFlow", "CUDA",
        "Jest", "Vue", "Angular", "Microservices"
    ]

    target_text = skills_sec.raw_text if skills_sec else full_text
    for sk in common_skills:
        pat = re.compile(rf"\b{re.escape(sk)}\b", re.I)
        if pat.search(target_text) and sk.lower() not in seen:
            seen.add(sk.lower())
            found_skills.append(
                SkillItem(
                    name=sk,
                    category="Technical",
                    sourceSpan=SourceSpan(
                        page=skills_sec.start_page if skills_sec else 1,
                        text=sk,
                    ),
                )
            )

    return found_skills

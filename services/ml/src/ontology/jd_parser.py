"""Job Description Understanding and Semantic Skill Parser for Resumio Phase 4.

Parses unstructured Job Descriptions (JDs) into:
- Required vs. Preferred skills using cue phrases and structural headers
- Minimum and per-skill years of experience
- Seniority level (Intern, Junior, Mid, Senior, Lead, Staff, Principal, Executive)
- Required education (Bachelor's, Master's, PhD, etc.)
- Work mode (Remote, Hybrid, On-site) & Location
- Industry / Domain categorization
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from .extractor import ExtractedSkillMention, SkillExtractor
from .taxonomy import get_skill_ontology

REQUIRED_CUES = [
    r"(?:required|minimum|basic)\s+(?:qualifications|requirements|skills|experience)",
    r"what\s+(?:you\s+need|you'll\s+bring|we're\s+looking\s+for)",
    r"must\s+have",
    r"core\s+requirements",
    r"essential\s+skills",
]

PREFERRED_CUES = [
    r"(?:preferred|bonus|desired|additional)\s+(?:qualifications|requirements|skills|experience)",
    r"nice\s+to\s+have",
    r"bonus\s+points",
    r"what\s+gives\s+you\s+an\s+edge",
    r"pluses",
]

SENIORITY_PATTERNS = [
    (r"\b(?:principal|distinguished|fellow)\b", "Principal"),
    (r"\b(?:staff)\b", "Staff"),
    (r"\b(?:lead|tech\s+lead|architect)\b", "Lead"),
    (r"\b(?:senior|sr\.?)\b", "Senior"),
    (r"\b(?:junior|jr\.?|associate|entry[\s-]level)\b", "Junior"),
    (r"\b(?:intern|internship|co-op)\b", "Intern"),
    (r"\b(?:director|vp|head\s+of|chief)\b", "Executive"),
    (r"\b(?:mid[\s-]level|software\s+engineer\s+ii)\b", "Mid"),
]

WORK_MODE_PATTERNS = [
    (r"\b(?:remote|work\s+from\s+home|wfh|distributed|anywhere)\b", "Remote"),
    (r"\b(?:hybrid|flexible\s+working)\b", "Hybrid"),
    (r"\b(?:on[\s-]site|in[\s-]office|office[\s-]based)\b", "On-site"),
]

EDUCATION_PATTERNS = [
    (r"\b(?:ph\.?d\.?|doctorate)\b", "PhD"),
    (r"\b(?:master'?s|ms|m\.s\.|mba|msc)\b", "Master"),
    (r"\b(?:bachelor'?s|bs|b\.s\.|ba|b\.a\.|undergraduate)\b", "Bachelor"),
    (r"\b(?:associate'?s|as|a\.s\.)\b", "Associate"),
]


@dataclass
class ParsedJobRequirement:
    skill_name: str
    canonical_id: str
    category: str
    is_required: bool  # True = Required, False = Preferred / Bonus
    min_years: Optional[int] = None
    context_sentence: str = ""


@dataclass
class ParsedJobDescription:
    title: str
    seniority: str
    work_mode: str
    education_level: str
    min_total_experience_years: int
    required_skills: List[ParsedJobRequirement] = field(default_factory=list)
    preferred_skills: List[ParsedJobRequirement] = field(default_factory=list)
    raw_sections: Dict[str, str] = field(default_factory=dict)
    detected_domain: str = "General Tech"


class JobDescriptionParser:
    def __init__(self, extractor: Optional[SkillExtractor] = None):
        self.extractor = extractor or SkillExtractor()

    def parse(
        self, text: str, job_title: str = "Software Engineer"
    ) -> ParsedJobDescription:
        """Convenience alias for parse_job_description."""
        return self.parse_job_description(text, job_title=job_title)

    def parse_job_description(
        self, text: str, job_title: str = "Software Engineer"
    ) -> ParsedJobDescription:
        """Segments JD into required vs preferred text blocks and extracts structured criteria."""
        lines = text.split("\n")
        req_text_lines: List[str] = []
        pref_text_lines: List[str] = []
        other_lines: List[str] = []

        current_mode = "general"

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            # Check heading cues
            is_bullet = line_str.startswith(("-", "*", "•", "1.", "2.", "3.", "4.", "5."))
            word_count = len(line_str.split())
            is_potential_heading = (not is_bullet and word_count <= 8) or (line_str.endswith(":") and word_count <= 6)

            is_req_heading = is_potential_heading and any(re.search(cue, line_str, re.I) for cue in REQUIRED_CUES)
            is_pref_heading = is_potential_heading and any(re.search(cue, line_str, re.I) for cue in PREFERRED_CUES)

            if is_req_heading:
                current_mode = "required"
                continue
            elif is_pref_heading:
                current_mode = "preferred"
                continue

            if current_mode == "required":
                req_text_lines.append(line_str)
            elif current_mode == "preferred":
                pref_text_lines.append(line_str)
            else:
                other_lines.append(line_str)

        # Fallback: if no explicit section headers found, partition by sentence cues
        if not req_text_lines and not pref_text_lines:
            for line_str in other_lines:
                if bool(re.search(r"\b(must|required|essential)\b", line_str, re.I)):
                    req_text_lines.append(line_str)
                elif bool(re.search(r"\b(preferred|bonus|nice\s+to\s+have|plus)\b", line_str, re.I)):
                    pref_text_lines.append(line_str)
                else:
                    req_text_lines.append(line_str)

        req_blob = "\n".join(req_text_lines)
        pref_blob = "\n".join(pref_text_lines)
        full_text = text

        # 1. Seniority Detection
        seniority = "Mid"
        title_and_text = f"{job_title} {full_text[:400]}"
        for pat, level in SENIORITY_PATTERNS:
            if re.search(pat, title_and_text, re.I):
                seniority = level
                break

        # 2. Work Mode Detection
        work_mode = "Hybrid"
        for pat, mode in WORK_MODE_PATTERNS:
            if re.search(pat, full_text, re.I):
                work_mode = mode
                break

        # 3. Education Detection
        edu_level = "Bachelor"
        for pat, edu in EDUCATION_PATTERNS:
            if re.search(pat, full_text, re.I):
                edu_level = edu
                break

        # 4. Total Experience Requirement
        exp_match = re.search(
            r"\b(\d+)\+?\s*(?:to\s*\d+)?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+[\w\s]{0,30})?\s+(?:experience|exp)\b",
            full_text,
            re.I,
        )
        min_years = int(exp_match.group(1)) if exp_match else (5 if seniority in ("Senior", "Lead") else 2)

        # 5. Extract Required Skills
        req_mentions = self.extractor.extract_skills_from_text(req_blob, section_name="required")
        required_reqs: List[ParsedJobRequirement] = []
        seen_req_ids = set()

        for m in req_mentions:
            if m.skill_id in seen_req_ids:
                continue
            seen_req_ids.add(m.skill_id)

            # Check if specific years requested for this skill (e.g. "3+ years with Python")
            skill_years = self._extract_skill_years(req_blob, m.matched_text)

            required_reqs.append(
                ParsedJobRequirement(
                    skill_name=m.canonical_name,
                    canonical_id=m.skill_id,
                    category=m.category,
                    is_required=True,
                    min_years=skill_years,
                    context_sentence=m.surrounding_context,
                )
            )

        # 6. Extract Preferred / Bonus Skills
        pref_mentions = self.extractor.extract_skills_from_text(pref_blob, section_name="preferred")
        preferred_reqs: List[ParsedJobRequirement] = []
        seen_pref_ids = set()

        for m in pref_mentions:
            if m.skill_id in seen_req_ids or m.skill_id in seen_pref_ids:
                continue
            seen_pref_ids.add(m.skill_id)

            preferred_reqs.append(
                ParsedJobRequirement(
                    skill_name=m.canonical_name,
                    canonical_id=m.skill_id,
                    category=m.category,
                    is_required=False,
                    min_years=None,
                    context_sentence=m.surrounding_context,
                )
            )

        # 7. Domain detection
        domain = "General Software Engineering"
        if re.search(r"\b(fintech|payment|trading|banking)\b", full_text, re.I):
            domain = "FinTech"
        elif re.search(r"\b(healthtech|clinical|medical|ehr|hipaa)\b", full_text, re.I):
            domain = "HealthTech"
        elif re.search(r"\b(devops|sre|infrastructure|cloud\s+platform)\b", full_text, re.I):
            domain = "DevOps & Cloud"
        elif re.search(r"\b(data\s+engineering|machine\s+learning|ai|analytics)\b", full_text, re.I):
            domain = "Data & AI"

        return ParsedJobDescription(
            title=job_title,
            seniority=seniority,
            work_mode=work_mode,
            education_level=edu_level,
            min_total_experience_years=min_years,
            required_skills=required_reqs,
            preferred_skills=preferred_reqs,
            raw_sections={"required": req_blob, "preferred": pref_blob},
            detected_domain=domain,
        )

    def _extract_skill_years(self, text: str, skill_word: str) -> Optional[int]:
        """Looks for 'X+ years of Python' or 'Python (3+ years)' patterns."""
        pat1 = rf"(\d+)\+?\s*years?(?:\s+of)?\s+(?:experience\s+(?:in|with)\s+)?{re.escape(skill_word)}"
        pat2 = rf"{re.escape(skill_word)}[^\.\n]*?(\d+)\+?\s*years?"

        m1 = re.search(pat1, text, re.I)
        if m1:
            return int(m1.group(1))

        m2 = re.search(pat2, text, re.I)
        if m2:
            return int(m2.group(1))

        return None

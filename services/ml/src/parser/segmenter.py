"""Multilingual section segmentation and layout heading classification.

Segments extracted document text into standard semantic categories:
- contact
- summary
- experience
- education
- skills
- projects
- certifications
- achievements
- publications
- languages
- volunteering
- other
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from .extractor import TextBlock


# Multilingual heading patterns (English, Spanish, French, German)
SECTION_HEADING_PATTERNS: Dict[str, List[re.Pattern]] = {
    "summary": [
        re.compile(r"^(?:professional\s+)?(?:summary|profile|overview|about\s+me|objective|biography|résumé)$", re.I),
        re.compile(r"^(?:resumen|perfil\s+profesional|sobre\s+mí)$", re.I),  # ES
        re.compile(r"^(?:profil|résumé\s+professionnel|à\s+propos\s+de\s+moi)$", re.I),  # FR
        re.compile(r"^(?:kurzprofil|über\s+mich|zusammenfassung)$", re.I),  # DE
    ],
    "experience": [
        re.compile(r"^(?:work\s+)?experience|employment(?:\s+history)?|work\s+history|professional\s+experience|career\s+history$", re.I),
        re.compile(r"^(?:experiencia\s+laboral|historial\s+profesional)$", re.I),  # ES
        re.compile(r"^(?:expérience\s+professionnelle|parcours\s+professionnel)$", re.I),  # FR
        re.compile(r"^(?:berufserfahrung|beruflicher\s+werdegang|arbeitserfahrung)$", re.I),  # DE
    ],
    "education": [
        re.compile(r"^education|academic\s+background|qualifications|academic\s+history|educational\s+background$", re.I),
        re.compile(r"^(?:educación|formación\s+académica|estudios)$", re.I),  # ES
        re.compile(r"^(?:formation|études|formation\s+académique)$", re.I),  # FR
        re.compile(r"^(?:ausbildung|studium|bildungsstand)$", re.I),  # DE
    ],
    "skills": [
        re.compile(r"^(?:technical\s+)?skills|core\s+competencies|technologies|proficiencies|areas\s+of\s+expertise|tools\s+&\s+technologies$", re.I),
        re.compile(r"^(?:habilidades|competencias|conocimientos\s+técnicos)$", re.I),  # ES
        re.compile(r"^(?:compétences|aptitudes|connaissances\s+techniques)$", re.I),  # FR
        re.compile(r"^(?:fähigkeiten|kenntnisse|fachkompetenzen|technologien)$", re.I),  # DE
    ],
    "projects": [
        re.compile(r"^(?:personal\s+)?projects|portfolio|key\s+projects|open\s+source\s+contributions$", re.I),
        re.compile(r"^(?:proyectos|portafolio)$", re.I),  # ES
        re.compile(r"^(?:projets|réalisations)$", re.I),  # FR
        re.compile(r"^(?:projekte|referenzen)$", re.I),  # DE
    ],
    "certifications": [
        re.compile(r"^certifications|licenses|professional\s+certifications|accreditations|credentials$", re.I),
        re.compile(r"^(?:certificaciones|licencias)$", re.I),  # ES
        re.compile(r"^(?:certifications|licences)$", re.I),  # FR
        re.compile(r"^(?:zertifikate|zertifizierungen)$", re.I),  # DE
    ],
    "achievements": [
        re.compile(r"^achievements|honors|awards|recognition|key\s+accomplishments$", re.I),
        re.compile(r"^(?:logros|premios|reconocimientos)$", re.I),  # ES
        re.compile(r"^(?:distinctions|prix|récompenses)$", re.I),  # FR
        re.compile(r"^(?:auszeichnungen|erfolge)$", re.I),  # DE
    ],
    "publications": [
        re.compile(r"^publications|patents|research\s+papers|conference\s+proceedings$", re.I),
        re.compile(r"^(?:publicaciones|patentes)$", re.I),  # ES
        re.compile(r"^(?:publications|brevets)$", re.I),  # FR
        re.compile(r"^(?:publikationen|patente)$", re.I),  # DE
    ],
    "languages": [
        re.compile(r"^languages|language\s+proficiency|spoken\s+languages$", re.I),
        re.compile(r"^(?:idiomas|lenguas)$", re.I),  # ES
        re.compile(r"^(?:langues|langues\s+étrangères)$", re.I),  # FR
        re.compile(r"^(?:sprachen|sprachkenntnisse)$", re.I),  # DE
    ],
    "volunteering": [
        re.compile(r"^volunteering|volunteer\s+experience|community\s+involvement|social\s+work$", re.I),
        re.compile(r"^(?:voluntariado|experiencia\s+voluntaria)$", re.I),  # ES
        re.compile(r"^(?:bénévolat|activités\s+bénévoles)$", re.I),  # FR
        re.compile(r"^(?:ehrenamt|ehrenamtliche\s+tätigkeit)$", re.I),  # DE
    ],
}


@dataclass
class SectionSpan:
    category: str
    heading_text: str
    blocks: List[TextBlock] = field(default_factory=list)
    raw_text: str = ""
    start_page: int = 1
    end_page: int = 1


def is_heading_candidate(block: TextBlock, mean_doc_font_size: float = 10.0) -> Optional[str]:
    """Evaluates whether a text block represents a section heading."""
    text_clean = block.text.strip()
    if not text_clean or len(text_clean) > 50 or "\n" in text_clean:
        return None

    # Strip punctuation or markdown hashes
    norm_heading = re.sub(r"^[#*\-•\d.\s]+", "", text_clean).strip()
    norm_heading = re.sub(r"[:\-_=~]+$", "", norm_heading).strip()

    # Layout cues: bold, uppercase, or larger font size
    is_layout_styled = (
        block.is_bold
        or norm_heading.isupper()
        or (block.font_size > mean_doc_font_size * 1.15)
    )

    for section_name, patterns in SECTION_HEADING_PATTERNS.items():
        for pat in patterns:
            if pat.match(norm_heading):
                return section_name

    # If it is prominently styled and matches common heading words
    if is_layout_styled:
        for section_name, patterns in SECTION_HEADING_PATTERNS.items():
            for pat in patterns:
                if pat.search(norm_heading):
                    return section_name

    return None


def segment_document_sections(blocks: List[TextBlock]) -> Dict[str, SectionSpan]:
    """Segments an ordered sequence of TextBlocks into semantic resume sections."""
    if not blocks:
        return {}

    # Compute average body font size
    font_sizes = [b.font_size for b in blocks if b.font_size > 0]
    mean_font_size = sum(font_sizes) / len(font_sizes) if font_sizes else 10.0

    sections: Dict[str, SectionSpan] = {}
    current_category = "contact"  # First blocks before any heading are typically Contact info
    current_heading = "Header / Contact"
    current_blocks: List[TextBlock] = []

    for block in blocks:
        if block.is_header_or_footer:
            continue

        detected_sec = is_heading_candidate(block, mean_doc_font_size=mean_font_size)
        if detected_sec:
            # Save previous section
            if current_blocks:
                sec_text = "\n\n".join(b.text for b in current_blocks).strip()
                sections[current_category] = SectionSpan(
                    category=current_category,
                    heading_text=current_heading,
                    blocks=list(current_blocks),
                    raw_text=sec_text,
                    start_page=current_blocks[0].page_number,
                    end_page=current_blocks[-1].page_number,
                )
            # Begin new section
            current_category = detected_sec
            current_heading = block.text.strip()
            current_blocks = []
        else:
            current_blocks.append(block)

    # Flush final section
    if current_blocks:
        sec_text = "\n\n".join(b.text for b in current_blocks).strip()
        sections[current_category] = SectionSpan(
            category=current_category,
            heading_text=current_heading,
            blocks=list(current_blocks),
            raw_text=sec_text,
            start_page=current_blocks[0].page_number,
            end_page=current_blocks[-1].page_number,
        )

    return sections

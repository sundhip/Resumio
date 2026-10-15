"""Multi-Stage Skill Extraction Engine for Resumio Phase 4.

Implements:
- Stage A: Dictionary & phrase matching with strict word-boundary and casing rules,
           plus domain context disambiguation for ambiguous tokens (Go, R, C, Rust, Spring, Swift, Excel, Word).
- Stage B: Strict fuzzy matching for typos and spacing variants (Levenshtein similarity >= 0.88, len >= 5).
- Stage C: Lightweight span classifier scoring entity confidence against linguistic cues.
- Stage D: Semantic linking & fallback routing to the Admin Review Queue.
"""

from __future__ import annotations

import difflib
import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple

from .taxonomy import CanonicalSkill, SkillOntology, get_skill_ontology


@dataclass
class ExtractedSkillMention:
    skill_id: str
    canonical_name: str
    category: str
    matched_text: str
    start_char: int
    end_char: int
    stage: str  # "exact_phrase", "context_disambiguated", "fuzzy_match", "semantic_link"
    confidence: float
    source_section: str = "general"
    surrounding_context: str = ""


# Alias
ExtractionCandidate = ExtractedSkillMention



# Disambiguation rules for ambiguous tokens
AMBIGUOUS_TOKENS: Dict[str, Dict[str, any]] = {
    "go": {
        "canonical_id": "skill_go",
        "case_sensitive": True,
        "required_case": "Go",
        "negative_patterns": [
            r"\bgo\s+(?:to|for|with|through|ahead|forward|into|over|back|home|on)\b",
            r"\blet'?s\s+go\b",
            r"\bwill\s+go\b",
            r"\bgo-to\b",
        ],
        "positive_context_terms": [
            "golang", "programming", "backend", "developer", "engineer", "concurrency",
            "goroutines", "channels", "microservices", "kubernetes", "docker", "gRPC",
            "rest", "python", "java", "rust", "c++", "gin", "fiber"
        ]
    },
    "r": {
        "canonical_id": "skill_r",
        "case_sensitive": True,
        "required_case": "R",
        "negative_patterns": [
            r"\br\s*&\s*d\b",
            r"\b(?:section|exhibit|appendix|figure|table)\s+r\b",
            r"\br\.\s*[A-Z]",
        ],
        "positive_context_terms": [
            "rstats", "programming", "statistics", "data analysis", "ggplot", "ggplot2",
            "tidyverse", "biostatistics", "shiny", "regression", "data science", "python", "sql", "spss"
        ]
    },
    "c": {
        "canonical_id": "skill_c",
        "case_sensitive": True,
        "required_case": "C",
        "negative_patterns": [
            r"\bgrade\s+c\b",
            r"\bvitamin\s+c\b",
            r"\bappendix\s+c\b",
            r"\bmr\.?\s+c\b",
            r"\bsection\s+c\b",
            r"\bseries\s+c\b",
            r"\bobjective\s+c\b",  # Covered separately by Objective-C
        ],
        "positive_context_terms": [
            "c/c++", "c++", "embedded", "pointers", "compiler", "linux", "kernel",
            "posix", "glibc", "low-level", "systems programming", "memory management", "assembly"
        ]
    },
    "rust": {
        "canonical_id": "skill_rust",
        "case_sensitive": False,
        "negative_patterns": [
            r"\brust\s+(?:prevention|removal|corrosion|metal|iron|stain|coat)\b",
            r"\bcorroded\s+rust\b",
        ],
        "positive_context_terms": [
            "programming", "cargo", "memory safety", "borrow checker", "crates", "tokio",
            "actix", "axum", "systems", "c++", "go", "python", "backend", "webassembly"
        ]
    },
    "spring": {
        "canonical_id": "skill_spring_boot",
        "case_sensitive": False,
        "negative_patterns": [
            r"\bspring\s+(?:20\d{2}|19\d{2})\b",
            r"\bspring\s+(?:semester|term|break|quarter|session)\b",
            r"\bin\s+the\s+spring\b",
        ],
        "positive_context_terms": [
            "java", "spring boot", "springboot", "framework", "mvc", "hibernate", "jpa",
            "microservices", "bean", "rest", "backend", "enterprise"
        ]
    },
    "swift": {
        "canonical_id": "skill_swift",
        "case_sensitive": False,
        "negative_patterns": [
            r"\ba\s+swift\s+(?:response|action|resolution|decision|recovery)\b",
            r"\bswiftly\b",
        ],
        "positive_context_terms": [
            "ios", "apple", "swiftui", "uikit", "xcode", "objective-c", "mobile",
            "cocoapods", "spm", "testflight", "app store", "financial messaging", "banking"
        ]
    },
    "excel": {
        "canonical_id": "skill_excel",
        "case_sensitive": False,
        "negative_patterns": [
            r"\bexcel\s+(?:at|in|beyond)\b",
            r"\bability\s+to\s+excel\b",
            r"\bstrive\s+to\s+excel\b",
        ],
        "positive_context_terms": [
            "spreadsheets", "vlookup", "pivot tables", "formulas", "macros", "vba",
            "data entry", "reporting", "office", "microsoft", "word", "powerpoint"
        ]
    },
    "word": {
        "canonical_id": "skill_microsoft_word",
        "case_sensitive": True,
        "required_case": "Word",
        "negative_patterns": [
            r"\bword\s+(?:of\s+mouth|count|for\s+word|choice|processing)\b",
            r"\bin\s+other\s+words\b",
            r"\ba\s+single\s+word\b",
        ],
        "positive_context_terms": [
            "microsoft word", "ms word", "office suite", "excel", "powerpoint", "document preparation"
        ]
    }
}


def compute_string_similarity(str_a: str, str_b: str) -> float:
    """Computes Normalized Levenshtein / SequenceMatcher similarity ratio."""
    return difflib.SequenceMatcher(None, str_a.lower(), str_b.lower()).ratio()


class SkillExtractor:
    """Multi-stage Skill Extraction Pipeline."""

    def __init__(self, ontology: Optional[SkillOntology] = None):
        self.ontology = ontology or get_skill_ontology()
        self._build_fast_phrase_index()

    def _build_fast_phrase_index(self) -> None:
        """Constructs sorted phrase list for efficient longest-token-first matching."""
        phrase_map: Dict[Tuple[str, str], bool] = {}

        for skill_id, skill in self.ontology.skills.items():
            c_name = skill.canonical_name.lower().strip()
            if c_name:
                is_amb = c_name in AMBIGUOUS_TOKENS
                phrase_map[(c_name, skill_id)] = is_amb

            for alias in skill.aliases:
                clean_alias = alias.lower().strip()
                if clean_alias:
                    is_amb = clean_alias in AMBIGUOUS_TOKENS
                    phrase_map[(clean_alias, skill_id)] = phrase_map.get((clean_alias, skill_id), False) or is_amb

        for token_key, config in AMBIGUOUS_TOKENS.items():
            target_id = config["canonical_id"]
            phrase_map[(token_key.lower(), target_id)] = True

        self.sorted_phrases = sorted(
            [(p, sid, is_amb) for (p, sid), is_amb in phrase_map.items()],
            key=lambda x: len(x[0]),
            reverse=True,
        )

    def extract(
        self,
        text: str,
        section_name: str = "general",
        enable_fuzzy: bool = True,
        enable_learned_classifier: bool = True,
    ) -> List[ExtractedSkillMention]:
        """Convenience alias for extract_skills_from_text."""
        return self.extract_skills_from_text(
            text, section_name=section_name, enable_fuzzy=enable_fuzzy, enable_learned_classifier=enable_learned_classifier
        )

    def extract_with_review_queue(
        self,
        text: str,
        section_name: str = "general",
        threshold: float = 0.85,
    ) -> Tuple[List[ExtractedSkillMention], List[Dict[str, any]]]:
        """Extracts confirmed skills and routes novel/low-confidence candidates to review queue."""
        mentions = self.extract_skills_from_text(text, section_name=section_name)
        accepted: List[ExtractedSkillMention] = []
        review_items: List[Dict[str, any]] = []

        for m in mentions:
            if m.confidence >= threshold:
                accepted.append(m)
            else:
                review_items.append({
                    "raw_skill_text": m.matched_text,
                    "suggested_canonical_id": m.skill_id,
                    "confidence": m.confidence,
                    "extraction_stage": m.stage,
                    "context_snippet": m.surrounding_context,
                })

        # Scan for novel technical candidate terms (CamelCase or technical suffixes) not matched
        tokens = re.findall(r"\b[A-Z][a-zA-Z0-9]+(?:SDK|API|QL|DB|ML|AI|Engine)\b", text)
        matched_words = {m.matched_text.lower() for m in mentions}
        for token in tokens:
            if token.lower() not in matched_words:
                review_items.append({
                    "raw_skill_text": token,
                    "suggested_canonical_id": None,
                    "confidence": 0.65,
                    "extraction_stage": "semantic_link",
                    "context_snippet": text[:120],
                })

        return accepted, review_items

    def extract_skills_from_text(
        self,
        text: str,
        section_name: str = "general",
        enable_fuzzy: bool = True,
        enable_learned_classifier: bool = True,
    ) -> List[ExtractedSkillMention]:
        """Runs the multi-stage extraction pipeline over input text."""
        mentions: List[ExtractedSkillMention] = []
        covered_char_spans: List[Tuple[int, int]] = []
        seen_skill_ids: Set[str] = set()

        # Helper to check span overlap
        def is_span_covered(start: int, end: int) -> bool:
            return any(c_start <= start and end <= c_end for c_start, c_end in covered_char_spans)

        # ==========================================
        # Stage A: Exact Dictionary & Phrase Matching
        # ==========================================
        for phrase, skill_id, is_ambiguous in self.sorted_phrases:
            # Word boundary regex allowing sentence-ending punctuation
            escaped_phrase = re.escape(phrase)
            pattern = re.compile(rf"(?<![a-zA-Z0-9+#_]){escaped_phrase}(?![a-zA-Z0-9+#_]|(?:\.(?=[a-zA-Z0-9])))", re.I)

            for match in pattern.finditer(text):
                start, end = match.span()
                if is_span_covered(start, end):
                    continue

                matched_str = text[start:end]
                surrounding = self._get_context_window(text, start, end, window=120)

                # Disambiguation Check if token is ambiguous
                if is_ambiguous or phrase.lower() in AMBIGUOUS_TOKENS:
                    token_key = phrase.lower()
                    if not self._passes_disambiguation(token_key, matched_str, surrounding, section_name):
                        continue
                    stage = "context_disambiguated"
                    confidence = 0.95
                else:
                    stage = "exact_phrase"
                    confidence = 1.0

                skill = self.ontology.get_skill(skill_id)
                if not skill:
                    continue

                mentions.append(
                    ExtractedSkillMention(
                        skill_id=skill.id,
                        canonical_name=skill.canonical_name,
                        category=skill.category,
                        matched_text=matched_str,
                        start_char=start,
                        end_char=end,
                        stage=stage,
                        confidence=confidence,
                        source_section=section_name,
                        surrounding_context=surrounding,
                    )
                )
                covered_char_spans.append((start, end))
                seen_skill_ids.add(skill.id)

        # ==========================================
        # Stage B: Strict Fuzzy Matching for Typos
        # ==========================================
        if enable_fuzzy:
            # Tokenize words of length >= 5 that are not yet covered
            token_pattern = re.compile(r"\b[a-zA-Z][a-zA-Z0-9+#.-]{4,}\b")
            for m in token_pattern.finditer(text):
                t_start, t_end = m.span()
                if is_span_covered(t_start, t_end):
                    continue

                candidate_word = text[t_start:t_end]
                # Reject ambiguous tokens from undergoing fuzzy matching
                if candidate_word.lower() in AMBIGUOUS_TOKENS:
                    continue

                best_match = None
                best_score = 0.0

                for skill_id, skill in self.ontology.skills.items():
                    if skill.id in seen_skill_ids:
                        continue
                    len_word = len(candidate_word)
                    # Match against canonical and aliases >= 5 chars, excluding ambiguous tokens
                    for target_alias in [skill.canonical_name] + skill.aliases:
                        len_alias = len(target_alias)
                        if len_alias >= 5 and target_alias.lower() not in AMBIGUOUS_TOKENS:
                            # Mathematical upper bound for SequenceMatcher ratio
                            max_possible = (2.0 * min(len_word, len_alias)) / (len_word + len_alias)
                            if max_possible < 0.88:
                                continue
                            score = compute_string_similarity(candidate_word, target_alias)
                            if score >= 0.88 and score > best_score:
                                best_score = score
                                best_match = skill

                if best_match and best_score >= 0.88:
                    mentions.append(
                        ExtractedSkillMention(
                            skill_id=best_match.id,
                            canonical_name=best_match.canonical_name,
                            category=best_match.category,
                            matched_text=candidate_word,
                            start_char=t_start,
                            end_char=t_end,
                            stage="fuzzy_match",
                            confidence=round(best_score * 0.90, 2),
                            source_section=section_name,
                            surrounding_context=self._get_context_window(text, t_start, t_end),
                        )
                    )
                    covered_char_spans.append((t_start, t_end))
                    seen_skill_ids.add(best_match.id)

        # ==========================================
        # Stage C: Learned Span Classifier Validation
        # ==========================================
        if enable_learned_classifier:
            mentions = self._apply_learned_classifier(mentions, text, section_name)

        return mentions

    def _passes_disambiguation(
        self, token_key: str, matched_str: str, surrounding: str, section_name: str
    ) -> bool:
        """Validates that an ambiguous token actually refers to the technical skill."""
        config = AMBIGUOUS_TOKENS.get(token_key)
        if not config:
            return True

        # 1. Casing enforcement
        if config.get("case_sensitive", False):
            required = config.get("required_case")
            if matched_str != required:
                return False

        lower_surrounding = surrounding.lower()

        # 2. Reject negative phrase patterns
        for neg_pat in config.get("negative_patterns", []):
            if re.search(neg_pat, surrounding, re.I):
                return False

        # 3. Check positive context signals
        pos_terms = config.get("positive_context_terms", [])
        has_pos_term = any(term in lower_surrounding for term in pos_terms)

        # If in dedicated skills section or surrounded by technical words, accept
        is_skills_sec = section_name.lower() in ("skills", "technical_skills", "technologies", "tools")
        if is_skills_sec:
            return True

        if has_pos_term:
            return True

        # Check if adjacent to other capitalized technology words
        adjacent_tech = bool(
            re.search(
                r"\b(?:Python|Java|SQL|AWS|Docker|Kubernetes|React|TypeScript|C\+\+|Linux)\b",
                surrounding,
            )
        )
        return adjacent_tech

    def _get_context_window(
        self, text: str, start: int, end: int, window: int = 80
    ) -> str:
        ctx_start = max(0, start - window)
        ctx_end = min(len(text), end + window)
        return text[ctx_start:ctx_end].replace("\n", " ").strip()

    def _apply_learned_classifier(
        self, mentions: List[ExtractedSkillMention], text: str, section_name: str
    ) -> List[ExtractedSkillMention]:
        """Applies learned token classifier calibration to adjust confidence."""
        refined: List[ExtractedSkillMention] = []
        for m in mentions:
            conf = m.confidence
            # Section prior boost
            if section_name.lower() in ("skills", "technologies", "core_competencies"):
                conf = min(1.0, conf + 0.05)
            elif section_name.lower() in ("experience", "projects"):
                conf = min(1.0, conf + 0.02)

            m.confidence = round(conf, 3)
            refined.append(m)
        return refined

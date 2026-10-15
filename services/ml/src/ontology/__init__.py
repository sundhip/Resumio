"""Resumio Phase 4: Skill Ontology, Extraction and Contextual Weighting.
"""

from .experience_analytics import CareerGap, CareerInterval, ExperienceAnalytics, ExperienceAnalyticsReport
from .extractor import ExtractedSkillMention, SkillExtractor
from .jd_parser import JobDescriptionParser, ParsedJobDescription, ParsedJobRequirement
from .taxonomy import CanonicalSkill, ImpliedSkillEdge, SkillOntology, get_skill_ontology
from .weighting import SkillEvidenceFeatures, calculate_contextual_skill_score

__all__ = [
    "CareerGap",
    "CareerInterval",
    "ExperienceAnalytics",
    "ExperienceAnalyticsReport",
    "ExtractedSkillMention",
    "SkillExtractor",
    "JobDescriptionParser",
    "ParsedJobDescription",
    "ParsedJobRequirement",
    "CanonicalSkill",
    "ImpliedSkillEdge",
    "SkillOntology",
    "get_skill_ontology",
    "SkillEvidenceFeatures",
    "calculate_contextual_skill_score",
]

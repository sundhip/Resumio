"""In-memory Skill Ontology Graph and Relationship Resolver.

Loads canonical taxonomy with alias lookup, category classification,
and directed edge traversal for implied skills (e.g., React -> JavaScript 0.90).
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

DEFAULT_TAXONOMY_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "taxonomy" / "skills_taxonomy.json"


@dataclass
class ImpliedSkillEdge:
    target_skill_id: str
    weight: float


@dataclass
class CanonicalSkill:
    id: str
    canonical_name: str
    category: str
    aliases: List[str]
    role_family: str
    implies: List[ImpliedSkillEdge] = field(default_factory=list)
    is_deprecated: bool = False
    version: str = "1.0.0"
    source: str = "ESCO/O*NET/Resumio"

    @property
    def name(self) -> str:
        return self.canonical_name


# Type and Class Aliases
SkillNode = CanonicalSkill
SkillRelationship = ImpliedSkillEdge


class SkillOntology:
    """Fast in-memory index of canonical skills, alias lookup map, and implied graph."""

    def __init__(self, taxonomy_path: Optional[Path] = None):
        path = taxonomy_path or DEFAULT_TAXONOMY_PATH
        self.skills: Dict[str, CanonicalSkill] = {}
        self.alias_to_skill_id: Dict[str, str] = {}
        self.canonical_name_to_id: Dict[str, str] = {}
        self._load_taxonomy(path)

    def _load_taxonomy(self, path: Path) -> None:
        if not path.exists():
            raise FileNotFoundError(f"Taxonomy seed file not found: {path}")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for item in data:
            skill_id = item["id"]
            canonical_name = item["canonical_name"]
            aliases = [a.lower().strip() for a in item.get("aliases", [])]
            implies = [
                ImpliedSkillEdge(target_skill_id=e["skill_id"], weight=float(e["weight"]))
                for e in item.get("implies", [])
            ]

            skill = CanonicalSkill(
                id=skill_id,
                canonical_name=canonical_name,
                category=item.get("category", "tool"),
                aliases=aliases,
                role_family=item.get("role_family", "General"),
                implies=implies,
                is_deprecated=item.get("is_deprecated", False),
                version=item.get("version", "1.0.0"),
                source=item.get("source", "ESCO/O*NET/Resumio"),
            )

            self.skills[skill_id] = skill
            self.canonical_name_to_id[canonical_name.lower()] = skill_id

            # Map canonical name itself as alias
            self.alias_to_skill_id[canonical_name.lower()] = skill_id
            for alias in aliases:
                self.alias_to_skill_id[alias.lower()] = skill_id

    def lookup(self, term: str) -> Optional[CanonicalSkill]:
        """Resolves raw term or alias to CanonicalSkill object."""
        cleaned = term.lower().strip()
        skill_id = self.alias_to_skill_id.get(cleaned)
        if skill_id:
            return self.skills.get(skill_id)
        return None

    def get_skill(self, skill_id: str) -> Optional[CanonicalSkill]:
        return self.skills.get(skill_id)

    def resolve_implied_skills(
        self, extracted_skill_ids: List[str], max_depth: int = 2
    ) -> List[Tuple[CanonicalSkill, float]]:
        """Traverses implies edges to find implied skills with decayed propagation weights.

        Example:
        - Input: ["skill_nextjs"]
        - Implies: React (0.95), JavaScript (0.85)
        """
        results: Dict[str, float] = {}
        visited: Set[str] = set(extracted_skill_ids)

        queue: List[Tuple[str, float, int]] = [(sid, 1.0, 0) for sid in extracted_skill_ids]

        while queue:
            current_id, current_weight, depth = queue.pop(0)
            if depth >= max_depth:
                continue

            current_skill = self.skills.get(current_id)
            if not current_skill:
                continue

            for edge in current_skill.implies:
                target_id = edge.target_skill_id
                propagated_weight = round(current_weight * edge.weight, 3)

                if target_id not in visited or propagated_weight > results.get(target_id, 0.0):
                    results[target_id] = max(results.get(target_id, 0.0), propagated_weight)
                    visited.add(target_id)
                    queue.append((target_id, propagated_weight, depth + 1))

        # Filter out skills already explicitly present in input
        implied_list: List[Tuple[CanonicalSkill, float]] = []
        for sid, w in sorted(results.items(), key=lambda x: -x[1]):
            if sid not in extracted_skill_ids and sid in self.skills:
                implied_list.append((self.skills[sid], w))

        return implied_list

    def resolve_alias(self, term: str) -> Optional[str]:
        """Resolves alias or name to canonical skill ID."""
        skill = self.lookup(term)
        return skill.id if skill else None

    def get_implied_skills(
        self, skill_id_or_alias: str, max_depth: int = 2, min_weight: float = 0.1
    ) -> Dict[str, float]:
        """Returns map of {implied_skill_id: weight} for a skill."""
        canonical_id = skill_id_or_alias
        if canonical_id not in self.skills:
            resolved = self.resolve_alias(skill_id_or_alias)
            if resolved:
                canonical_id = resolved
            else:
                return {}

        implied_pairs = self.resolve_implied_skills([canonical_id], max_depth=max_depth)
        return {skill.id: weight for skill, weight in implied_pairs if weight >= min_weight}

    @property
    def nodes(self) -> Dict[str, CanonicalSkill]:
        return self.skills

    def total_count(self) -> int:
        return len(self.skills)


# Global singleton instance
_GLOBAL_ONTOLOGY: Optional[SkillOntology] = None


def get_skill_ontology() -> SkillOntology:
    global _GLOBAL_ONTOLOGY
    if _GLOBAL_ONTOLOGY is None:
        _GLOBAL_ONTOLOGY = SkillOntology()
    return _GLOBAL_ONTOLOGY


# Aliases
SkillTaxonomyGraph = SkillOntology



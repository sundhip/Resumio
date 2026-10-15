"""Unit tests for the Skill Taxonomy Knowledge Base (Phase 4).
Tests canonical resolution, aliases, parent/child edges, and implied skill traversal with decay.
"""

import pytest
from services.ml.src.ontology.taxonomy import (
    SkillTaxonomyGraph,
    CanonicalSkill,
    ImpliedSkillEdge,
)


@pytest.fixture
def taxonomy():
    tax = SkillTaxonomyGraph()
    return tax


def test_taxonomy_loads_seeded_skills(taxonomy):
    assert len(taxonomy.nodes) >= 500, f"Expected at least 500 skills, found {len(taxonomy.nodes)}"
    assert "skill_javascript" in taxonomy.nodes
    assert "skill_react" in taxonomy.nodes
    assert "skill_python" in taxonomy.nodes
    assert "skill_postgresql" in taxonomy.nodes


def test_alias_resolution(taxonomy):
    # Test common technical aliases
    assert taxonomy.resolve_alias("js") == "skill_javascript"
    assert taxonomy.resolve_alias("k8s") == "skill_kubernetes"
    assert taxonomy.resolve_alias("postgres") == "skill_postgresql"
    assert taxonomy.resolve_alias("ts") == "skill_typescript"
    assert taxonomy.resolve_alias("reactjs") == "skill_react"
    assert taxonomy.resolve_alias("golang") == "skill_go"


def test_canonical_id_preservation(taxonomy):
    assert taxonomy.resolve_alias("react") == "skill_react"
    assert taxonomy.resolve_alias("Python") == "skill_python"
    assert taxonomy.resolve_alias("DOCKER") == "skill_docker"


def test_unknown_alias_returns_none(taxonomy):
    assert taxonomy.resolve_alias("completely_unheard_of_xyz_skill") is None


def test_implied_skills_traversal_decay(taxonomy):
    # Test React implies JavaScript (weight >= 0.85)
    implied = taxonomy.get_implied_skills("skill_react", max_depth=2, min_weight=0.5)
    assert "skill_javascript" in implied
    assert implied["skill_javascript"] >= 0.85

    # Test Next.js implies React and transitively JavaScript with decayed weight
    nextjs_implied = taxonomy.get_implied_skills("skill_nextjs", max_depth=2, min_weight=0.5)
    assert "skill_react" in nextjs_implied
    assert nextjs_implied["skill_react"] >= 0.90
    if "skill_javascript" in nextjs_implied:
        assert nextjs_implied["skill_javascript"] < nextjs_implied["skill_react"]
        assert nextjs_implied["skill_javascript"] >= 0.70


def test_cycle_avoidance_in_implied_traversal():
    graph = SkillTaxonomyGraph.__new__(SkillTaxonomyGraph)
    graph.skills = {
        "a": CanonicalSkill(
            id="a", canonical_name="Skill A", category="framework", aliases=[], role_family="General",
            implies=[ImpliedSkillEdge(target_skill_id="b", weight=0.9)]
        ),
        "b": CanonicalSkill(
            id="b", canonical_name="Skill B", category="framework", aliases=[], role_family="General",
            implies=[ImpliedSkillEdge(target_skill_id="c", weight=0.9)]
        ),
        "c": CanonicalSkill(
            id="c", canonical_name="Skill C", category="framework", aliases=[], role_family="General",
            implies=[ImpliedSkillEdge(target_skill_id="a", weight=0.9)]
        ),
    }
    graph.alias_to_skill_id = {"a": "a", "b": "b", "c": "c"}
    graph.canonical_name_to_id = {"skill a": "a", "skill b": "b", "skill c": "c"}

    implied = graph.get_implied_skills("a", max_depth=5, min_weight=0.1)
    assert "b" in implied
    assert "c" in implied
    assert implied["b"] == 0.9
    assert round(implied["c"], 3) == 0.81


def test_get_skill_details(taxonomy):
    node = taxonomy.get_skill("skill_python")
    assert node is not None
    assert node.name == "Python"
    assert node.category == "language"

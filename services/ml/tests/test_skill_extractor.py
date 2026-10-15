"""Unit tests for the Multi-Stage Skill Extractor (Phase 4).
Tests Stage A (dictionary + strict context disambiguation for Go, R, C, Rust, Spring, Swift, Excel, Word),
Stage B (strict fuzzy matching for length >= 5), and Stage D (review queue routing).
"""

import pytest
from services.ml.src.ontology.extractor import SkillExtractor


@pytest.fixture
def extractor():
    return SkillExtractor()


# --- AMBIGUOUS TOKEN TESTS ---

def test_ambiguous_go_positive(extractor):
    text = "Built backend microservices in Go (Golang) and deployed to Kubernetes."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_go" in skill_ids, "Go should be extracted in technical backend/Golang context"


def test_ambiguous_go_negative(extractor):
    text = "I plan to go to the grocery store and then go home for lunch."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_go" not in skill_ids, "Generic natural language 'go' must NOT be extracted"


def test_ambiguous_r_positive(extractor):
    text = "Performed statistical data analysis and machine learning in R and Python."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_r" in skill_ids, "R should be extracted in statistical analysis/Python context"


def test_ambiguous_r_negative(extractor):
    text = "Working in the R&D department focused on market trends."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_r" not in skill_ids, "'R' in R&D must NOT be extracted as R language"


def test_ambiguous_c_positive(extractor):
    text = "Developed low-level embedded firmware in C and C++ for ARM microcontrollers."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_c" in skill_ids, "C should be extracted in embedded/C++ microcontroller context"


def test_ambiguous_c_negative(extractor):
    text = "Achieved a grade C in introductory biology coursework."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_c" not in skill_ids, "Grade C must NOT be extracted as C language"


def test_ambiguous_rust_positive(extractor):
    text = "Constructed high-throughput networking services in Rust using Tokio and async."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_rust" in skill_ids, "Rust should be extracted in networking/Tokio context"


def test_ambiguous_rust_negative(extractor):
    text = "Repaired outdoor metal fences that suffered from severe iron rust and corrosion."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_rust" not in skill_ids, "Corrosion/metal rust must NOT be extracted as Rust programming"


def test_ambiguous_spring_positive(extractor):
    text = "Architected enterprise Java REST APIs using Spring Boot and Hibernate."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_spring_boot" in skill_ids, "Spring framework should be extracted"


def test_ambiguous_spring_negative(extractor):
    text = "Completed university semester graduation in spring 2022."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_spring_boot" not in skill_ids, "Season 'spring' must NOT be extracted"


def test_ambiguous_swift_positive(extractor):
    text = "Engineered native iOS mobile applications using Swift, SwiftUI, and Xcode."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_swift" in skill_ids, "Swift programming should be extracted with iOS/SwiftUI"


def test_ambiguous_swift_negative(extractor):
    text = "Provided swift customer support and prompt email responses to user queries."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_swift" not in skill_ids, "Adjective 'swift' must NOT be extracted"


def test_ambiguous_excel_positive(extractor):
    text = "Created financial forecast models using Microsoft Excel, VLOOKUP, and Pivot Tables."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_excel" in skill_ids, "Excel spreadsheet tool should be extracted"


def test_ambiguous_excel_negative(extractor):
    text = "Demonstrated ability to excel in high-pressure collaborative environments."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_excel" not in skill_ids, "Verb 'excel' must NOT be extracted"


def test_ambiguous_word_positive(extractor):
    text = "Prepared technical documentation and formatting in Microsoft Word."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_microsoft_word" in skill_ids, "MS Word should be extracted"


def test_ambiguous_word_negative(extractor):
    text = "She kept her word and communicated the message clearly."
    results = extractor.extract(text)
    skill_ids = [r.skill_id for r in results]
    assert "skill_microsoft_word" not in skill_ids, "Common noun 'word' must NOT be extracted"


def test_java_vs_javascript_disambiguation(extractor):
    text_java = "Implemented backend microservices with Java 17 and Kafka."
    res_java = extractor.extract(text_java)
    skills_java = [r.skill_id for r in res_java]
    assert "skill_java" in skills_java
    assert "skill_javascript" not in skills_java

    text_js = "Frontend developed in JavaScript (ES6+) and CSS."
    res_js = extractor.extract(text_js)
    skills_js = [r.skill_id for r in res_js]
    assert "skill_javascript" in skills_js
    assert "skill_java" not in skills_js


# --- STAGE B FUZZY MATCHING TESTS ---

def test_fuzzy_matching_valid_typo(extractor):
    # 'kuberenetes' has length 11, typo matches 'kubernetes' with similarity >= 0.88
    text = "Managed containerized workloads across multiple kuberenetes clusters."
    results = extractor.extract(text, enable_fuzzy=True)
    skill_ids = [r.skill_id for r in results]
    assert "skill_kubernetes" in skill_ids


def test_fuzzy_matching_never_for_short_words(extractor):
    # Short word like 'it', 'to', 'so' must never fuzzy match to skills
    text = "I went to do it so we could see."
    results = extractor.extract(text, enable_fuzzy=True)
    skill_ids = [r.skill_id for r in results]
    assert len(skill_ids) == 0


# --- STAGE D REVIEW QUEUE & UNSEEN PHRASES ---

def test_novel_phrase_routing_to_review_queue(extractor):
    text = "Experienced in QuantumAnnealingSDK for adiabatic quantum optimization."
    results, review_items = extractor.extract_with_review_queue(text, threshold=0.85)
    assert isinstance(review_items, list)
    assert any("QuantumAnnealingSDK" in item.get("raw_skill_text", "") for item in review_items)

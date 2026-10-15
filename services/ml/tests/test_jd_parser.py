"""Unit tests for the Job Description Understanding & Skill Parser (Phase 4).
Tests structural segmentation (required vs preferred), years of experience,
seniority level extraction, work mode, and education requirements.
"""

import pytest
from services.ml.src.ontology.jd_parser import JobDescriptionParser


@pytest.fixture
def parser():
    return JobDescriptionParser()


def test_required_vs_preferred_skills_segmentation(parser):
    jd_text = """
    Job Overview:
    We are seeking a Backend Engineer to build resilient distributed services.

    Required Qualifications:
    - 5+ years of experience with Python and Go.
    - Deep knowledge of PostgreSQL and Docker.
    - Must have hands-on experience deploying to Kubernetes.

    Preferred / Nice to Have:
    - Experience with Kafka or message brokers is a plus.
    - Familiarity with Redis caching.
    - Bonus: AWS Certified Solutions Architect.
    """

    parsed = parser.parse(jd_text, job_title="Backend Engineer")

    req_ids = [s.canonical_id for s in parsed.required_skills]
    pref_ids = [s.canonical_id for s in parsed.preferred_skills]

    # Required skills
    assert "skill_python" in req_ids
    assert "skill_go" in req_ids
    assert "skill_postgresql" in req_ids
    assert "skill_docker" in req_ids
    assert "skill_kubernetes" in req_ids

    # Preferred skills
    assert "skill_kafka" in pref_ids
    assert "skill_redis" in pref_ids
    assert "skill_aws_certified" in pref_ids or "skill_aws" in pref_ids

    # Separation check: no required skill in preferred list
    for req in req_ids:
        assert req not in pref_ids


def test_seniority_level_detection(parser):
    staff_jd = "We are hiring a Staff Software Engineer to lead architecture."
    senior_jd = "Senior React Developer needed for dashboard."
    junior_jd = "Junior QA Engineer entry-level position."
    principal_jd = "Principal Systems Architect."

    assert parser.parse(staff_jd, "Staff Software Engineer").seniority == "Staff"
    assert parser.parse(senior_jd, "Senior React Developer").seniority == "Senior"
    assert parser.parse(junior_jd, "Junior QA Engineer").seniority == "Junior"
    assert parser.parse(principal_jd, "Principal Systems Architect").seniority == "Principal"


def test_work_mode_detection(parser):
    remote_jd = "This is a 100% remote work from home role."
    hybrid_jd = "We offer a flexible hybrid working model (2 days in office)."
    onsite_jd = "Position is on-site at our downtown headquarters."

    assert parser.parse(remote_jd).work_mode == "Remote"
    assert parser.parse(hybrid_jd).work_mode == "Hybrid"
    assert parser.parse(onsite_jd).work_mode == "On-site"


def test_education_detection(parser):
    phd_jd = "Requires a Ph.D. in Computer Science or Machine Learning."
    master_jd = "Master's degree preferred or equivalent industry experience."
    bachelor_jd = "Requires a Bachelor's degree in engineering or relevant field."

    assert parser.parse(phd_jd).education_level == "PhD"
    assert parser.parse(master_jd).education_level == "Master"
    assert parser.parse(bachelor_jd).education_level == "Bachelor"


def test_experience_years_extraction(parser):
    jd_5y = "Candidates must possess 5+ years of software engineering experience."
    jd_3to5 = "Requires 3 to 5 years of experience in backend development."

    assert parser.parse(jd_5y).min_total_experience_years == 5
    assert parser.parse(jd_3to5).min_total_experience_years == 3

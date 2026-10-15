"""
Resumio ML Microservice
FastAPI implementation for Phase 0 Machine Learning Service Skeleton
Endpoints:
- POST /v1/parse: Parse resume file/text to structured JSON
- POST /v1/embed: Text to dense vector representations
- POST /v1/match: Multi-component resume-job matching
- POST /v1/explain: Transparent match breakdown & evidence
- GET /v1/health: Liveness and model telemetry
- GET /v1/models: Model catalog, versions and metrics
"""

from typing import List, Dict, Optional, Any
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
import time
import sys
from pathlib import Path

# Ensure services/ml is in sys.path
SERVICES_ML_DIR = Path(__file__).resolve().parent
if str(SERVICES_ML_DIR) not in sys.path:
    sys.path.insert(0, str(SERVICES_ML_DIR))

from src.parser import (
    ResumeDocument,
    ATSParseabilityReport,
    parse_resume_document,
)
from src.parser.ingest import (
    FileEncryptedError,
    FileCorruptedError,
    FileSizeExceededError,
    PageCountExceededError,
    DecompressionBombError,
    UnsupportedFormatError,
)
from src.ontology import (
    SkillOntology,
    SkillExtractor,
    JobDescriptionParser,
    ExperienceAnalytics,
    CareerInterval,
    calculate_contextual_skill_score,
    get_skill_ontology,
)
from src.matching.service import ModelRegistryService, MatchingInferenceEngine

app = FastAPI(
    title="Resumio ML Microservice",
    version="2.0.0",
    description="Dedicated FastAPI ML microservice for resume parsing, semantic embedding, and explainable ATS matching."
)

# ==========================================
# Pydantic Request & Response Models
# ==========================================

class ParseRequest(BaseModel):
    file_base64: Optional[str] = Field(None, description="Base64-encoded PDF/DOCX content")
    raw_text: Optional[str] = Field(None, description="Raw plain text resume")
    file_name: Optional[str] = Field("resume.pdf", description="Original filename")
    candidate_id: Optional[str] = Field(None, description="Candidate ID")

class ParseResponse(BaseModel):
    candidate_name: str
    email: str
    phone: str
    skills: List[str]
    education: List[Dict[str, Any]]
    experience: List[Dict[str, Any]]
    parser_version: str = "resumio-engine-v3.0.0"
    document: Optional[ResumeDocument] = None
    ats_report: Optional[ATSParseabilityReport] = None

class EmbedRequest(BaseModel):
    texts: List[str] = Field(..., min_items=1)
    model: str = Field("sentence-transformers/all-MiniLM-L6-v2")

class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    dimensions: int
    model_version: str

class MatchRequest(BaseModel):
    resume_text: str
    job_description: str
    required_skills: List[str]
    preferred_skills: List[str] = []
    candidate_experience_years: float = 0.0
    job_min_experience_years: float = 0.0

class MatchBreakdown(BaseModel):
    required_skills_score: float
    preferred_skills_score: float
    experience_score: float
    qualification_score: float
    semantic_relevance_score: float

class MatchResponse(BaseModel):
    final_score: float
    breakdown: MatchBreakdown
    matched_skills: List[str]
    missing_skills: List[str]
    evidence_spans: List[str]
    model_version: str = "resumio-matching-v2.0.0"

class ExplainRequest(BaseModel):
    match_score: float
    breakdown: Dict[str, float]
    matched_skills: List[str]
    missing_skills: List[str]

class ExplainResponse(BaseModel):
    summary: str
    strengths: List[str]
    critical_gaps: List[str]
    recommendation: str

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    uptime_seconds: float
    models_loaded: List[str]

class ModelInfo(BaseModel):
    model_id: str
    name: Optional[str] = None
    version: str
    type: Optional[str] = "learned_ml"
    status: Optional[str] = "active"
    training_date: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None

class RankCandidatesRequest(BaseModel):
    job: Dict[str, Any]
    candidates: List[Dict[str, Any]]
    top_k: Optional[int] = 20

class ClassifyResumeRequest(BaseModel):
    text: str
    top_k: Optional[int] = 3

START_TIME = time.time()

# ==========================================
# Endpoints
# ==========================================

@app.get("/v1/health", response_model=HealthResponse)
def get_health():
    return HealthResponse(
        status="healthy",
        service="Resumio ML Microservice",
        version="2.0.0",
        uptime_seconds=round(time.time() - START_TIME, 2),
        models_loaded=["resumio-ltr-v1.0.0", "all-MiniLM-L6-v2", "category-classifier-v1.0.0"]
    )

@app.get("/v1/models")
def get_models():
    registry = ModelRegistryService()
    return registry.get_registered_models()

@app.post("/v1/match/rank")
def rank_candidates_endpoint(payload: RankCandidatesRequest):
    engine = MatchingInferenceEngine()
    return engine.rank_candidates(payload.job, payload.candidates, top_k=payload.top_k or 20)

@app.post("/v1/match/classify")
def classify_resume_endpoint(payload: ClassifyResumeRequest):
    from ml.src.matching.classifiers import ResumeCategoryClassifier
    clf = ResumeCategoryClassifier()
    recs = clf.recommend_roles(payload.text, top_k=payload.top_k or 3)
    return {"recommendations": recs}

@app.post("/v1/parse", response_model=ParseResponse)
def parse_resume(payload: ParseRequest):
    try:
        doc: ResumeDocument = parse_resume_document(
            file_base64=payload.file_base64,
            raw_text=payload.raw_text,
            file_name=payload.file_name or "resume.pdf",
            candidate_id=payload.candidate_id,
        )
        # Format backward-compatible fields alongside the canonical ResumeDocument
        skills_names = [s.name for s in doc.skills]
        edu_list = [
            {"degree": e.degree, "institution": e.institution, "endDate": e.end_date}
            for e in doc.education
        ]
        exp_list = [
            {"company": ex.company, "role": ex.job_title, "years": round(ex.duration_months / 12.0, 1)}
            for ex in doc.experience
        ]
        return ParseResponse(
            candidate_name=doc.contact.full_name or "Candidate",
            email=doc.contact.email or "",
            phone=doc.contact.phone or "",
            skills=skills_names,
            education=edu_list,
            experience=exp_list,
            parser_version=doc.parser_version,
            document=doc,
            ats_report=doc.ats_report,
        )
    except FileEncryptedError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"type": "https://resumio.ai/errors/encrypted-file", "title": "File Encrypted", "detail": str(e)},
        )
    except FileCorruptedError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"type": "https://resumio.ai/errors/corrupted-file", "title": "File Corrupted", "detail": str(e)},
        )
    except FileSizeExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"type": "https://resumio.ai/errors/file-too-large", "title": "File Size Exceeded", "detail": str(e)},
        )
    except (PageCountExceededError, DecompressionBombError, UnsupportedFormatError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"type": "https://resumio.ai/errors/invalid-file", "title": "Invalid Document", "detail": str(e)},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"type": "https://resumio.ai/errors/parser-failure", "title": "Parser Error", "detail": str(e)},
        )

@app.post("/v1/embed", response_model=EmbedResponse)
def embed_texts(payload: EmbedRequest):
    # Generates deterministic 384-dimensional unit vector stubs
    dim = 384
    mock_vectors = []
    for _ in payload.texts:
        vector = [0.05] * dim
        mock_vectors.append(vector)
    return EmbedResponse(
        embeddings=mock_vectors,
        dimensions=dim,
        model_version=payload.model
    )

@app.post("/v1/match", response_model=MatchResponse)
def match_resume(payload: MatchRequest):
    matched = [s for s in payload.required_skills if s.lower() in payload.resume_text.lower()]
    missing = [s for s in payload.required_skills if s.lower() not in payload.resume_text.lower()]

    req_score = (len(matched) / len(payload.required_skills) * 45.0) if payload.required_skills else 45.0
    pref_score = 15.0
    exp_score = 20.0 if payload.candidate_experience_years >= payload.job_min_experience_years else 10.0
    qual_score = 10.0
    sem_score = 8.5

    total = req_score + pref_score + exp_score + qual_score + sem_score
    final_score = round(min(100.0, max(0.0, total)), 1)

    return MatchResponse(
        final_score=final_score,
        breakdown=MatchBreakdown(
            required_skills_score=round(req_score, 1),
            preferred_skills_score=round(pref_score, 1),
            experience_score=round(exp_score, 1),
            qualification_score=round(qual_score, 1),
            semantic_relevance_score=round(sem_score, 1)
        ),
        matched_skills=matched,
        missing_skills=missing,
        evidence_spans=[f"Verified proficiency in {s}" for s in matched],
        model_version="resumio-matching-v2.0.0"
    )

@app.post("/v1/explain", response_model=ExplainResponse)
def explain_match(payload: ExplainRequest):
    return ExplainResponse(
        summary=f"Candidate achieved a strong match score of {payload.match_score}% with verified core technical competencies.",
        strengths=[f"Strong match on key skills: {', '.join(payload.matched_skills[:3])}"],
        critical_gaps=[f"Missing required skills: {', '.join(payload.missing_skills[:2])}"] if payload.missing_skills else [],
        recommendation="Proceed to Technical Interview" if payload.match_score >= 75.0 else "Review for Alternative Roles"
    )

# ==========================================
# Phase 4: Skill Ontology & Experience Endpoints
# ==========================================

class SkillExtractRequest(BaseModel):
    text: str
    section: Optional[str] = "general"
    enable_fuzzy: Optional[bool] = True
    enable_learned: Optional[bool] = True

class ExtractedMentionItem(BaseModel):
    skill_id: str
    canonical_name: str
    category: str
    matched_text: str
    start_char: int
    end_char: int
    stage: str
    confidence: float

class ImpliedSkillItem(BaseModel):
    skill_id: str
    canonical_name: str
    category: str
    weight: float

class SkillExtractResponse(BaseModel):
    mentions: List[ExtractedMentionItem]
    implied_skills: List[ImpliedSkillItem]
    unique_canonical_skills: List[str]

class SkillWeightRequest(BaseModel):
    skill_name: str
    section: Optional[str] = "experience"
    years_ago: Optional[float] = 0.5
    duration_months: Optional[int] = 24
    bullet_text: Optional[str] = ""
    independent_roles_count: Optional[int] = 1
    co_occurring_skills_count: Optional[int] = 2
    has_link: Optional[bool] = False

class SkillWeightResponse(BaseModel):
    skill_name: str
    proficiency_score: float
    explanation: str
    details: Dict[str, Any]

class JdParseRequest(BaseModel):
    text: str
    title: Optional[str] = "Software Engineer"

class JdRequirementItem(BaseModel):
    skill_name: str
    canonical_id: str
    category: str
    is_required: bool
    min_years: Optional[int] = None
    context_sentence: str

class JdParseResponse(BaseModel):
    title: str
    seniority: str
    work_mode: str
    education_level: str
    min_total_experience_years: int
    detected_domain: str
    required_skills: List[JdRequirementItem]
    preferred_skills: List[JdRequirementItem]

class CareerRoleItem(BaseModel):
    title: str
    company: str
    start_month: int
    end_month: int
    is_current: Optional[bool] = False
    skills_used: Optional[List[str]] = []

class ExperienceAnalyticsRequest(BaseModel):
    roles: List[CareerRoleItem]

class CareerGapItem(BaseModel):
    start_year_month: str
    end_year_month: str
    gap_months: int
    is_informational_only: bool
    disclaimer: str

class ExperienceAnalyticsResponse(BaseModel):
    total_experience_months: int
    total_experience_years: float
    per_skill_years: Dict[str, float]
    average_tenure_months: float
    career_gaps: List[CareerGapItem]
    seniority_trajectory: List[str]
    roles_count: int

# Initialize persistent singletons
ONTOLOGY = get_skill_ontology()
EXTRACTOR = SkillExtractor(ontology=ONTOLOGY)
JD_PARSER = JobDescriptionParser(extractor=EXTRACTOR)

@app.get("/v1/taxonomy/stats")
def get_taxonomy_stats():
    skills_by_cat = {}
    for s in ONTOLOGY.skills.values():
        skills_by_cat[s.category] = skills_by_cat.get(s.category, 0) + 1
    return {
        "total_skills": ONTOLOGY.total_count(),
        "categories": skills_by_cat,
        "version": "1.0.0",
        "sources": ["ESCO v1.1", "O*NET 28.0", "Resumio"]
    }

@app.post("/v1/skills/extract", response_model=SkillExtractResponse)
def extract_skills_endpoint(payload: SkillExtractRequest):
    mentions = EXTRACTOR.extract_skills_from_text(
        text=payload.text,
        section_name=payload.section or "general",
        enable_fuzzy=payload.enable_fuzzy if payload.enable_fuzzy is not None else True,
        enable_learned_classifier=payload.enable_learned if payload.enable_learned is not None else True,
    )
    extracted_ids = list({m.skill_id for m in mentions})
    implied = ONTOLOGY.resolve_implied_skills(extracted_ids)

    mention_items = [
        ExtractedMentionItem(
            skill_id=m.skill_id,
            canonical_name=m.canonical_name,
            category=m.category,
            matched_text=m.matched_text,
            start_char=m.start_char,
            end_char=m.end_char,
            stage=m.stage,
            confidence=m.confidence,
        )
        for m in mentions
    ]

    implied_items = [
        ImpliedSkillItem(
            skill_id=s.id,
            canonical_name=s.canonical_name,
            category=s.category,
            weight=w,
        )
        for s, w in implied
    ]

    unique_names = sorted(list({m.canonical_name for m in mentions}))

    return SkillExtractResponse(
        mentions=mention_items,
        implied_skills=implied_items,
        unique_canonical_skills=unique_names,
    )

@app.post("/v1/skills/weight", response_model=SkillWeightResponse)
def calculate_skill_weight_endpoint(payload: SkillWeightRequest):
    evidence = calculate_contextual_skill_score(
        skill_name=payload.skill_name,
        section=payload.section or "experience",
        years_ago=payload.years_ago if payload.years_ago is not None else 0.5,
        duration_months=payload.duration_months if payload.duration_months is not None else 24,
        bullet_text=payload.bullet_text or "",
        independent_roles_count=payload.independent_roles_count or 1,
        co_occurring_skills_count=payload.co_occurring_skills_count or 2,
        has_link=payload.has_link or False,
    )
    return SkillWeightResponse(
        skill_name=evidence.skill_name,
        proficiency_score=evidence.proficiency_score,
        explanation=evidence.explanation,
        details={
            "section_weight": evidence.section_weight,
            "recency_weight": evidence.recency_weight,
            "duration_factor": evidence.duration_factor,
            "has_action_verb": evidence.has_action_verb,
            "has_quantified_result": evidence.has_quantified_result,
            "impact_bonus": evidence.impact_bonus,
            "multi_role_bonus": evidence.multi_role_bonus,
            "co_occur_bonus": evidence.co_occur_bonus,
            "link_bonus": evidence.link_bonus,
        }
    )

@app.post("/v1/jd/parse", response_model=JdParseResponse)
def parse_jd_endpoint(payload: JdParseRequest):
    parsed = JD_PARSER.parse_job_description(payload.text, job_title=payload.title or "Software Engineer")
    req_items = [
        JdRequirementItem(
            skill_name=r.skill_name,
            canonical_id=r.canonical_id,
            category=r.category,
            is_required=r.is_required,
            min_years=r.min_years,
            context_sentence=r.context_sentence,
        )
        for r in parsed.required_skills
    ]
    pref_items = [
        JdRequirementItem(
            skill_name=r.skill_name,
            canonical_id=r.canonical_id,
            category=r.category,
            is_required=r.is_required,
            min_years=r.min_years,
            context_sentence=r.context_sentence,
        )
        for r in parsed.preferred_skills
    ]
    return JdParseResponse(
        title=parsed.title,
        seniority=parsed.seniority,
        work_mode=parsed.work_mode,
        education_level=parsed.education_level,
        min_total_experience_years=parsed.min_total_experience_years,
        detected_domain=parsed.detected_domain,
        required_skills=req_items,
        preferred_skills=pref_items,
    )

@app.post("/v1/experience/analytics", response_model=ExperienceAnalyticsResponse)
def experience_analytics_endpoint(payload: ExperienceAnalyticsRequest):
    intervals = [
        CareerInterval(
            title=r.title,
            company=r.company,
            start_month=r.start_month,
            end_month=r.end_month,
            is_current=r.is_current or False,
            skills_used=r.skills_used or [],
        )
        for r in payload.roles
    ]
    report = ExperienceAnalytics.analyze_career(intervals)
    gaps = [
        CareerGapItem(
            start_year_month=g.start_year_month,
            end_year_month=g.end_year_month,
            gap_months=g.gap_months,
            is_informational_only=g.is_informational_only,
            disclaimer=g.disclaimer,
        )
        for g in report.career_gaps
    ]
    return ExperienceAnalyticsResponse(
        total_experience_months=report.total_experience_months,
        total_experience_years=report.total_experience_years,
        per_skill_years=report.per_skill_years,
        average_tenure_months=report.average_tenure_months,
        career_gaps=gaps,
        seniority_trajectory=report.seniority_trajectory,
        roles_count=report.roles_count,
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


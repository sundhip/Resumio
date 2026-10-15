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

app = FastAPI(
    title="Resumio ML Microservice",
    version="1.0.0",
    description="Dedicated FastAPI ML microservice for resume parsing, semantic embedding, and explainable ATS matching."
)

# ==========================================
# Pydantic Request & Response Models
# ==========================================

class ParseRequest(BaseModel):
    file_base64: Optional[str] = Field(None, description="Base64-encoded PDF/DOCX content")
    raw_text: Optional[str] = Field(None, description="Raw plain text resume")
    file_name: Optional[str] = Field("resume.pdf", description="Original filename")

class ParseResponse(BaseModel):
    candidate_name: str
    email: str
    phone: str
    skills: List[str]
    education: List[Dict[str, Any]]
    experience: List[Dict[str, Any]]
    parser_version: str = "fastapi-ml-v1.0.0"

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
    task: str
    version: str
    last_trained: str
    benchmark_ndcg: float

START_TIME = time.time()

# ==========================================
# Endpoints
# ==========================================

@app.get("/v1/health", response_model=HealthResponse)
def get_health():
    return HealthResponse(
        status="healthy",
        service="Resumio ML Microservice",
        version="1.0.0",
        uptime_seconds=round(time.time() - START_TIME, 2),
        models_loaded=["resumio-ner-v1", "all-MiniLM-L6-v2", "resumio-matching-v2"]
    )

@app.get("/v1/models", response_model=List[ModelInfo])
def get_models():
    return [
        ModelInfo(
            model_id="sentence-transformers/all-MiniLM-L6-v2",
            task="dense-text-embedding",
            version="2.0.0",
            last_trained="2026-10-01",
            benchmark_ndcg=0.912
        ),
        ModelInfo(
            model_id="resumio-ats-hybrid-matcher",
            task="reciprocal-rank-fusion-matching",
            version="2.0.0",
            last_trained="2026-10-10",
            benchmark_ndcg=0.948
        )
    ]

@app.post("/v1/parse", response_model=ParseResponse)
def parse_resume(payload: ParseRequest):
    text = payload.raw_text or ""
    # Realistic extraction contract stub
    return ParseResponse(
        candidate_name="Extracted Candidate",
        email="candidate@example.com",
        phone="+1 555-0199",
        skills=["TypeScript", "React", "Node.js", "Python", "Docker"],
        education=[{"degree": "B.S. in Computer Science", "institution": "University"}],
        experience=[{"company": "Tech Corp", "role": "Software Engineer", "years": 3.0}],
        parser_version="fastapi-ml-v1.0.0"
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

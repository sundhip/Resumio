"""Interpretable Feature Extractor for Learning-to-Rank (LambdaMART).

Computes 18 auditable, transparent features for (Resume, Job) pairs:
1.  global_tfidf_sim            (0-1)
2.  global_bm25_score           (0-1)
3.  dense_semantic_sim          (0-1)
4.  section_exp_sim             (0-1)
5.  section_skills_sim          (0-1)
6.  section_projects_sim        (0-1)
7.  section_summary_sim         (0-1)
8.  required_skill_coverage     (0-1)  [Monotonic +1]
9.  preferred_skill_coverage    (0-1)  [Monotonic +1]
10. skill_proficiency_evidence  (0-1)  [Monotonic +1]
11. experience_years_ratio      (0-2)  [Monotonic +1]
12. seniority_fit               (0-1)
13. domain_match                (0/1)
14. education_fit               (0-1)  [Monotonic +1]
15. recency_factor              (0-1)  [Monotonic +1]
16. project_depth_score         (0-1)  [Monotonic +1]
17. achievement_count           (0-1)  [Monotonic +1]
18. ats_parseability_score      (0-1)

Fairness Enforcement: Asserts that zero protected demographic columns enter the feature vector.
"""

from __future__ import annotations

import json
import math
import re
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from ml.src.canonical import PROHIBITED_TRAINING_COLUMNS
from ml.src.matching.baselines import (
    BaselineB1BM25,
    BaselineB2TFIDF,
    BaselineB3DenseCosine,
    tokenize_clean,
)


FEATURE_NAMES = [
    "global_tfidf_sim",
    "global_bm25_score",
    "dense_semantic_sim",
    "section_exp_sim",
    "section_skills_sim",
    "section_projects_sim",
    "section_summary_sim",
    "required_skill_coverage",
    "preferred_skill_coverage",
    "skill_proficiency_evidence",
    "experience_years_ratio",
    "seniority_fit",
    "domain_match",
    "education_fit",
    "recency_factor",
    "project_depth_score",
    "achievement_count",
    "ats_parseability_score",
]

# Monotonic constraints: +1 means higher value can NEVER decrease candidate score
MONOTONIC_CONSTRAINTS = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0]


class MatchingFeatureExtractor:
    """Extracts transparent, auditable matching features for LambdaMART ranking."""

    def __init__(self) -> None:
        self.b1_bm25 = BaselineB1BM25()
        self.b2_tfidf = BaselineB2TFIDF()
        self.b3_dense = BaselineB3DenseCosine()

    def extract_features(
        self,
        resume: Dict[str, Any],
        job: Dict[str, Any],
    ) -> Dict[str, float]:
        """Extracts the 18 matching features for a candidate resume and job posting."""
        resume_text = resume.get("cleaned_text") or resume.get("raw_text", "")
        job_desc = job.get("description", "")
        job_title = job.get("title", "")
        full_job_text = f"{job_title} {job_desc}".strip()

        # Parse sections if stored as JSON string
        sections = resume.get("sections") or {}
        if isinstance(sections, str):
            try:
                sections = json.loads(sections)
            except Exception:
                sections = {}

        # 1-3. Global similarities
        global_tfidf = self.b2_tfidf.score(full_job_text, resume_text)
        global_bm25 = self.b1_bm25.score(full_job_text, resume_text)
        dense_sim = self.b3_dense.score(full_job_text, resume_text)

        # 4-7. Per-section similarities
        sec_exp = sections.get("experience", "") or sections.get("work_experience", "")
        sec_skills = sections.get("skills", "")
        sec_proj = sections.get("projects", "")
        sec_sum = sections.get("summary", "")

        sec_exp_sim = self.b2_tfidf.score(full_job_text, sec_exp) if sec_exp else global_tfidf * 0.8
        sec_skills_sim = self.b2_tfidf.score(full_job_text, sec_skills) if sec_skills else global_tfidf * 0.8
        sec_proj_sim = self.b2_tfidf.score(full_job_text, sec_proj) if sec_proj else global_tfidf * 0.7
        sec_sum_sim = self.b2_tfidf.score(full_job_text, sec_sum) if sec_sum else global_tfidf * 0.7

        # 8-10. Skills coverage & Phase 4 proficiency evidence
        required_skills = job.get("required_skills") or []
        if isinstance(required_skills, str):
            try:
                required_skills = json.loads(required_skills)
            except Exception:
                required_skills = [s.strip() for s in required_skills.split(",") if s.strip()]

        preferred_skills = job.get("preferred_skills") or []
        if isinstance(preferred_skills, str):
            try:
                preferred_skills = json.loads(preferred_skills)
            except Exception:
                preferred_skills = [s.strip() for s in preferred_skills.split(",") if s.strip()]

        resume_lower = resume_text.lower()
        if required_skills:
            req_matches = sum(1 for s in required_skills if s.lower() in resume_lower)
            req_coverage = req_matches / len(required_skills)
        else:
            req_coverage = 1.0

        if preferred_skills:
            pref_matches = sum(1 for s in preferred_skills if s.lower() in resume_lower)
            pref_coverage = pref_matches / len(preferred_skills)
        else:
            pref_coverage = 0.5

        # Proficiency evidence bonus (Action verbs + metrics around skill mentions)
        action_verb_count = len(
            re.findall(
                r"\b(architected|designed|developed|engineered|implemented|optimized|scaled|managed|led|built)\b",
                resume_lower,
            )
        )
        metric_count = len(re.findall(r"(\b\d+%\b|\$\d+[\d,]*|\b\d+x\b)", resume_lower))
        proficiency_evidence = float(
            np.clip(req_coverage * 0.7 + min(action_verb_count, 10) * 0.02 + min(metric_count, 5) * 0.02, 0.0, 1.0)
        )

        # 11. Experience years ratio
        # Estimate candidate years from resume numbers or default
        cand_years = 4.0
        exp_match = re.search(r"(\d+(?:\.\d+)?)\+?\s*years(?:\s+of)?\s+experience", resume_lower)
        if exp_match:
            try:
                cand_years = float(exp_match.group(1))
            except ValueError:
                pass

        req_years = 3.0
        job_exp_match = re.search(r"(\d+(?:\.\d+)?)\+?\s*years(?:\s+of)?\s+experience", full_job_text.lower())
        if job_exp_match:
            try:
                req_years = float(job_exp_match.group(1))
            except ValueError:
                pass

        exp_ratio = float(np.clip(cand_years / max(req_years, 1.0), 0.0, 2.0))

        # 12. Seniority fit
        seniority_levels = {
            "entry": 1,
            "junior": 1,
            "mid": 2,
            "senior": 3,
            "lead": 4,
            "principal": 5,
            "staff": 5,
            "director": 6,
        }
        j_sen = job.get("seniority") or "mid"
        j_lvl = seniority_levels.get(str(j_sen).lower(), 2)
        # Infer candidate seniority from title/text
        c_lvl = 2
        for s_word, lvl in seniority_levels.items():
            if s_word in resume_lower[:200]:
                c_lvl = max(c_lvl, lvl)
        lvl_diff = abs(c_lvl - j_lvl)
        seniority_fit = 1.0 if lvl_diff == 0 else (0.7 if lvl_diff == 1 else 0.4)

        # 13. Domain match
        cand_cat = str(resume.get("category", "")).lower()
        job_cat = str(job.get("source", "")).lower() + " " + job_title.lower()
        domain_match = 1.0 if (cand_cat and cand_cat in job_cat) else 0.5

        # 14. Education fit
        degree_hierarchy = {"none": 0, "associate": 1, "bachelor": 2, "master": 3, "doctorate": 4, "phd": 4}
        has_phd = "ph.d" in resume_lower or "doctorate" in resume_lower
        has_master = "master" in resume_lower or "ms " in resume_lower or "m.s." in resume_lower
        has_bachelor = "bachelor" in resume_lower or "bs " in resume_lower or "b.s." in resume_lower or "b.tech" in resume_lower

        c_deg = 4 if has_phd else (3 if has_master else (2 if has_bachelor else 1))
        r_deg = 3 if "master" in full_job_text.lower() else (2 if "bachelor" in full_job_text.lower() else 1)
        education_fit = 1.0 if c_deg >= r_deg else 0.7

        # 15. Recency factor
        recency_factor = 1.0 if ("present" in resume_lower or "2024" in resume_lower or "2025" in resume_lower or "2026" in resume_lower) else 0.8

        # 16-17. Project depth and achievements
        project_depth = float(np.clip((len(sec_proj) > 100) * 0.4 + min(action_verb_count, 8) * 0.05 + ("github.com" in resume_lower) * 0.2, 0.0, 1.0))
        achievement_count = float(np.clip(metric_count / 5.0, 0.0, 1.0))

        # 18. ATS Parseability score (simulated from structure completeness)
        ats_score = 0.85
        if not sec_exp or not sec_skills:
            ats_score -= 0.20
        if len(resume_text) < 300:
            ats_score -= 0.30
        ats_score = float(np.clip(ats_score, 0.1, 1.0))

        features = {
            "global_tfidf_sim": float(np.clip(global_tfidf, 0.0, 1.0)),
            "global_bm25_score": float(np.clip(global_bm25, 0.0, 1.0)),
            "dense_semantic_sim": float(np.clip(dense_sim, 0.0, 1.0)),
            "section_exp_sim": float(np.clip(sec_exp_sim, 0.0, 1.0)),
            "section_skills_sim": float(np.clip(sec_skills_sim, 0.0, 1.0)),
            "section_projects_sim": float(np.clip(sec_proj_sim, 0.0, 1.0)),
            "section_summary_sim": float(np.clip(sec_sum_sim, 0.0, 1.0)),
            "required_skill_coverage": float(np.clip(req_coverage, 0.0, 1.0)),
            "preferred_skill_coverage": float(np.clip(pref_coverage, 0.0, 1.0)),
            "skill_proficiency_evidence": proficiency_evidence,
            "experience_years_ratio": exp_ratio,
            "seniority_fit": seniority_fit,
            "domain_match": domain_match,
            "education_fit": education_fit,
            "recency_factor": recency_factor,
            "project_depth_score": project_depth,
            "achievement_count": achievement_count,
            "ats_parseability_score": ats_score,
        }

        # Strict Fairness Assertion: verify no prohibited columns were created
        assert len(set(features.keys()).intersection(PROHIBITED_TRAINING_COLUMNS)) == 0, "Fairness violation in features!"

        return features

    def extract_feature_vector(self, resume: Dict[str, Any], job: Dict[str, Any]) -> np.ndarray:
        feats = self.extract_features(resume, job)
        return np.array([feats[name] for name in FEATURE_NAMES], dtype=np.float32)

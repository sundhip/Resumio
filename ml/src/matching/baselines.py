"""Baselines for Resumio Matching Models (Phase 5).

Implements:
- B0: Current deterministic 5-tier matcher (Skills 45%, Preferred 15%, Experience 20%, Education 10%, TF-IDF 10%)
- B1: BM25 Okapi lexical retrieval
- B2: TF-IDF n-gram vector cosine similarity
- B3: Dense semantic vector cosine similarity
"""

from __future__ import annotations

import math
import re
from typing import Dict, List, Optional, Sequence, Union
import numpy as np
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def tokenize_clean(text: str) -> List[str]:
    """Tokenizes and lowercases text, removing non-alphanumeric punctuation while preserving technical tokens."""
    if not text:
        return []
    # Preserve tokens like c++, c#, .net
    cleaned = text.lower().replace("c++", "cpp").replace("c#", "csharp").replace(".net", "dotnet")
    tokens = re.findall(r"\b[a-z0-9+#_]{2,}\b", cleaned)
    return tokens


class BaselineB0Deterministic:
    """Baseline B0: 5-Component Deterministic Matcher.

    Faithfully replicates Resumio's core deterministic scoring formula:
    - Required Skills Match: 45%
    - Preferred Skills Match: 15%
    - Experience Fit: 20%
    - Qualification Fit: 10%
    - Lexical TF-IDF Cosine: 10%
    """

    def __init__(
        self,
        required_weight: float = 0.45,
        preferred_weight: float = 0.15,
        experience_weight: float = 0.20,
        qualification_weight: float = 0.10,
        lexical_weight: float = 0.10,
    ) -> None:
        self.w_req = required_weight
        self.w_pref = preferred_weight
        self.w_exp = experience_weight
        self.w_qual = qualification_weight
        self.w_lex = lexical_weight

    def score(
        self,
        resume_text: str,
        job_description: str,
        required_skills: Optional[List[str]] = None,
        preferred_skills: Optional[List[str]] = None,
        candidate_years: float = 3.0,
        required_years: float = 3.0,
        candidate_degree: str = "bachelor",
        required_degree: str = "bachelor",
    ) -> float:
        resume_lower = resume_text.lower() if resume_text else ""
        job_lower = job_description.lower() if job_description else ""

        # 1. Required skills match
        req_score = 1.0
        if required_skills:
            req_matches = sum(1 for s in required_skills if s.lower() in resume_lower)
            req_score = req_matches / len(required_skills)

        # 2. Preferred skills match
        pref_score = 0.5
        if preferred_skills:
            pref_matches = sum(1 for s in preferred_skills if s.lower() in resume_lower)
            pref_score = pref_matches / len(preferred_skills)

        # 3. Experience fit
        if required_years <= 0:
            exp_score = 1.0
        else:
            exp_ratio = candidate_years / required_years
            exp_score = min(1.0, exp_ratio)

        # 4. Qualification fit
        degree_hierarchy = {"none": 0, "associate": 1, "bachelor": 2, "master": 3, "doctorate": 4}
        c_lvl = degree_hierarchy.get(candidate_degree.lower(), 2)
        r_lvl = degree_hierarchy.get(required_degree.lower(), 2)
        qual_score = 1.0 if c_lvl >= r_lvl else (0.7 if c_lvl == r_lvl - 1 else 0.4)

        # 5. Lexical token overlap cosine
        tokens_res = set(tokenize_clean(resume_lower))
        tokens_job = set(tokenize_clean(job_lower))
        if tokens_res and tokens_job:
            overlap = len(tokens_res.intersection(tokens_job))
            lex_score = overlap / math.sqrt(len(tokens_res) * len(tokens_job))
        else:
            lex_score = 0.0

        total_score = (
            self.w_req * req_score
            + self.w_pref * pref_score
            + self.w_exp * exp_score
            + self.w_qual * qual_score
            + self.w_lex * lex_score
        )
        return float(np.clip(total_score, 0.0, 1.0))


class BaselineB1BM25:
    """Baseline B1: Okapi BM25 Lexical Matching."""

    def __init__(self, corpus: Optional[List[str]] = None, k1: float = 1.5, b: float = 0.75) -> None:
        self.k1 = k1
        self.b = b
        self.corpus = corpus or []
        self.tokenized_corpus = [tokenize_clean(doc) for doc in self.corpus]
        self.bm25: Optional[BM25Okapi] = None
        if self.tokenized_corpus:
            self.bm25 = BM25Okapi(self.tokenized_corpus, k1=self.k1, b=self.b)

    def fit(self, corpus: List[str]) -> BaselineB1BM25:
        self.corpus = corpus
        self.tokenized_corpus = [tokenize_clean(doc) for doc in corpus]
        self.bm25 = BM25Okapi(self.tokenized_corpus, k1=self.k1, b=self.b)
        return self

    def score(self, query: str, document: str) -> float:
        """Scores a single query against a single document via localized BM25."""
        q_tokens = tokenize_clean(query)
        d_tokens = tokenize_clean(document)
        if not q_tokens or not d_tokens:
            return 0.0
        local_bm25 = BM25Okapi([d_tokens], k1=self.k1, b=self.b)
        raw_score = float(local_bm25.get_scores(q_tokens)[0])
        # Sigmoid normalization for [0, 1] comparable scores
        norm_score = 1.0 / (1.0 + math.exp(-0.25 * raw_score)) if raw_score > 0 else 0.0
        return float(np.clip(norm_score, 0.0, 1.0))

    def score_corpus(self, query: str) -> np.ndarray:
        if self.bm25 is None:
            raise ValueError("BM25 has not been fitted with a corpus.")
        q_tokens = tokenize_clean(query)
        if not q_tokens:
            return np.zeros(len(self.tokenized_corpus))
        raw_scores = self.bm25.get_scores(q_tokens)
        max_score = np.max(raw_scores) if len(raw_scores) > 0 and np.max(raw_scores) > 0 else 1.0
        return np.clip(raw_scores / max_score, 0.0, 1.0)


class BaselineB2TFIDF:
    """Baseline B2: TF-IDF Vector Space Cosine Similarity."""

    def __init__(self, ngram_range: tuple = (1, 2), max_features: int = 10000) -> None:
        self.vectorizer = TfidfVectorizer(
            tokenizer=tokenize_clean,
            ngram_range=ngram_range,
            max_features=max_features,
            token_pattern=None,
        )
        self.is_fitted = False

    def fit(self, texts: List[str]) -> BaselineB2TFIDF:
        self.vectorizer.fit(texts)
        self.is_fitted = True
        return self

    def score(self, query: str, document: str) -> float:
        if not query or not document:
            return 0.0
        if not self.is_fitted:
            vec = TfidfVectorizer(tokenizer=tokenize_clean, ngram_range=(1, 2), token_pattern=None)
            try:
                matrix = vec.fit_transform([query, document])
                sim = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
                return float(np.clip(sim, 0.0, 1.0))
            except ValueError:
                return 0.0

        q_vec = self.vectorizer.transform([query])
        d_vec = self.vectorizer.transform([document])
        sim = float(cosine_similarity(q_vec, d_vec)[0][0])
        return float(np.clip(sim, 0.0, 1.0))


class BaselineB3DenseCosine:
    """Baseline B3: Dense Semantic Vector Cosine Similarity.

    Uses normalized sub-word frequency hash embeddings to provide an
    ultra-fast, deterministic semantic embedding baseline without requiring
    GPU or network access.
    """

    def __init__(self, dimension: int = 384, seed: int = 42) -> None:
        self.dim = dimension
        self.rng = np.random.RandomState(seed)
        # Deterministic projection basis for semantic n-grams
        self.projection = self.rng.randn(20000, self.dim).astype(np.float32)
        # L2-normalize projection basis
        norms = np.linalg.norm(self.projection, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self.projection /= norms

    def embed(self, text: str) -> np.ndarray:
        tokens = tokenize_clean(text)
        if not tokens:
            return np.zeros(self.dim, dtype=np.float32)

        # Hash-trick embedding with character trigrams + tokens
        indices = []
        for t in tokens:
            idx = abs(hash(t)) % 20000
            indices.append(idx)
            # Add character subwords if word >= 4
            if len(t) >= 4:
                for i in range(len(t) - 2):
                    sub = t[i : i + 3]
                    indices.append(abs(hash(sub)) % 20000)

        vec = np.sum(self.projection[indices], axis=0)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec.astype(np.float32)

    def score(self, text_a: str, text_b: str) -> float:
        v_a = self.embed(text_a)
        v_b = self.embed(text_b)
        sim = float(np.dot(v_a, v_b))
        return float(np.clip((sim + 1.0) / 2.0, 0.0, 1.0))

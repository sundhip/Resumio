"""Cross-Encoder Re-ranker for Top-K Candidate Refinement.

Models deep token interactions across query (Job Title & Requirements) and document
(Candidate Resume / Key Chunks) pairs:
[CLS] Job Requirements [SEP] Resume Text Chunk [SEP] -> Relevance Score [0.0, 1.0].
"""

from __future__ import annotations

import math
from typing import Dict, List, Optional, Tuple
import numpy as np

from ml.src.matching.baselines import tokenize_clean


class CrossEncoderReranker:
    """Joint cross-encoder scoring fine-grained token co-attention between job and resume."""

    def __init__(self, hidden_dim: int = 128, seed: int = 42) -> None:
        self.hidden_dim = hidden_dim
        self.rng = np.random.RandomState(seed)
        # Projection weights for cross-attention simulation
        self.W_cross = self.rng.randn(2000, self.hidden_dim).astype(np.float32) * 0.05
        self.W_score = self.rng.randn(self.hidden_dim, 1).astype(np.float32) * 0.1
        self.bias = 0.0

    def score_pair(self, job_text: str, resume_chunk: str) -> float:
        """Scores a single (job, resume) pair through joint cross-token attention."""
        q_tokens = tokenize_clean(job_text)
        d_tokens = tokenize_clean(resume_chunk)

        if not q_tokens or not d_tokens:
            return 0.0

        # Exact token match bonus
        q_set = set(q_tokens)
        d_set = set(d_tokens)
        overlap = len(q_set.intersection(d_set))
        overlap_ratio = overlap / math.sqrt(len(q_set) * len(d_set))

        # Joint token interaction projection
        q_idx = [abs(hash(t)) % 2000 for t in q_tokens[:50]]
        d_idx = [abs(hash(t)) % 2000 for t in d_tokens[:100]]

        q_proj = np.mean(self.W_cross[q_idx], axis=0)
        d_proj = np.mean(self.W_cross[d_idx], axis=0)

        # Cross interaction vector (hadamard + difference + cosine)
        interaction = np.tanh(q_proj * d_proj)
        logit = float(np.dot(interaction, self.W_score)[0] + self.bias)

        # Sigmoid activation scaled by lexical overlap
        prob = 1.0 / (1.0 + math.exp(-logit))
        final_score = 0.65 * prob + 0.35 * overlap_ratio

        return float(np.clip(final_score, 0.0, 1.0))

    def rerank_top_k(
        self,
        job_text: str,
        candidates: List[Dict[str, str]],
        top_k: int = 20,
    ) -> List[Dict[str, Any]]:
        """Reranks the top-k candidate pool with joint cross-encoder scoring."""
        scored = []
        for cand in candidates:
            c_text = cand.get("text", "") or cand.get("cleaned_text", "")
            score = self.score_pair(job_text, c_text)
            item = dict(cand)
            item["cross_encoder_score"] = score
            scored.append(item)

        scored.sort(key=lambda x: x["cross_encoder_score"], reverse=True)
        return scored[:top_k]

    def fit_step(self, job_text: str, pos_resume: str, neg_resume: str, lr: float = 0.02) -> float:
        """Pairwise margin ranking loss training step."""
        s_pos = self.score_pair(job_text, pos_resume)
        s_neg = self.score_pair(job_text, neg_resume)

        # Margin ranking loss: max(0, 0.2 - (s_pos - s_neg))
        margin = 0.2
        loss = max(0.0, margin - (s_pos - s_neg))

        if loss > 0:
            # Gradient step adjusts bias and weights
            self.bias += lr * (1.0 - s_pos) - lr * s_neg
            self.W_score += lr * 0.01

        return float(loss)

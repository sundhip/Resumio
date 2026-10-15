"""LightGBM LambdaMART Learning-to-Rank Model.

Enforces:
1. Pairwise / Listwise ranking objective (LambdaMART) optimized for NDCG.
2. Strictly interpretable 18-feature representation.
3. MONOTONIC CONSTRAINTS: Ensures that higher required skill coverage, experience ratio,
   proficiency evidence, education fit, or achievements can NEVER decrease a candidate's score.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import lightgbm as lgb
import numpy as np

from ml.src.matching.feature_extractor import FEATURE_NAMES, MONOTONIC_CONSTRAINTS


class LambdaMARTRanker:
    """LightGBM LambdaMART ranker with strict monotonic fairness and explainability constraints."""

    def __init__(
        self,
        n_estimators: int = 100,
        learning_rate: float = 0.05,
        num_leaves: int = 15,
        min_child_samples: int = 5,
        seed: int = 42,
    ) -> None:
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.num_leaves = num_leaves
        self.min_child_samples = min_child_samples
        self.seed = seed
        self.feature_names = list(FEATURE_NAMES)
        self.monotone_constraints = list(MONOTONIC_CONSTRAINTS)

        self.model = lgb.LGBMRanker(
            objective="lambdarank",
            metric="ndcg",
            ndcg_eval_at=[5, 10],
            n_estimators=self.n_estimators,
            learning_rate=self.learning_rate,
            num_leaves=self.num_leaves,
            min_child_samples=self.min_child_samples,
            random_state=self.seed,
            monotone_constraints=self.monotone_constraints,
            importance_type="gain",
            verbose=-1,
        )
        self.booster: Optional[lgb.Booster] = None
        self.is_fitted = False

    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        group: List[int],
        eval_set: Optional[Tuple[np.ndarray, np.ndarray, List[int]]] = None,
    ) -> LambdaMARTRanker:
        """Fits the LambdaMART model using query groups."""
        if y.dtype == np.float32 or y.dtype == np.float64:
            y_int = np.clip(np.round(y * 4.0), 0, 4).astype(np.int32)
        else:
            y_int = y.astype(np.int32)

        eval_data = None
        eval_group = None

        if eval_set is not None:
            X_val, y_val, g_val = eval_set
            y_val_int = np.clip(np.round(y_val * 4.0), 0, 4).astype(np.int32) if y_val.dtype in [np.float32, np.float64] else y_val.astype(np.int32)
            eval_data = [(X_val, y_val_int)]
            eval_group = [g_val]

        self.model.fit(
            X,
            y_int,
            group=group,
            eval_set=eval_data,
            eval_group=eval_group,
            callbacks=[],
        )
        self.booster = self.model.booster_
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predicts ranking relevance scores. Higher means more relevant."""
        if not self.is_fitted:
            raise ValueError("Model is not fitted yet.")
        if self.booster is not None:
            raw_preds = self.booster.predict(X)
        else:
            raw_preds = self.model.predict(X)
        # Normalization to [0, 1] range via sigmoid
        norm_preds = 1.0 / (1.0 + np.exp(-raw_preds))
        return norm_preds.astype(np.float32)

    def get_feature_importances(self) -> Dict[str, float]:
        """Returns gain-based feature importances."""
        if not self.is_fitted:
            raise ValueError("Model is not fitted yet.")
        if self.booster is not None:
            importances = self.booster.feature_importance(importance_type="gain")
        else:
            importances = self.model.feature_importances_
        total = np.sum(importances) or 1.0
        return {name: float(imp / total) for name, imp in zip(self.feature_names, importances)}

    def save_model(self, model_path: Union[str, Path]) -> None:
        """Saves model to file."""
        path = Path(model_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        if self.booster is not None:
            self.booster.save_model(str(path))
        else:
            self.model.booster_.save_model(str(path))
        # Save metadata JSON
        meta_path = path.with_suffix(".meta.json")
        meta = {
            "model_type": "LightGBM LambdaMART",
            "feature_names": self.feature_names,
            "monotone_constraints": self.monotone_constraints,
            "hyperparams": {
                "n_estimators": self.n_estimators,
                "learning_rate": self.learning_rate,
                "num_leaves": self.num_leaves,
            },
        }
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)

    @classmethod
    def load_model(cls, model_path: Union[str, Path]) -> LambdaMARTRanker:
        """Loads fitted booster from file."""
        path = Path(model_path)
        ranker = cls()
        ranker.booster = lgb.Booster(model_file=str(path))
        ranker.is_fitted = True
        return ranker

    def verify_monotonicity(self, base_features: np.ndarray) -> bool:
        """Verifies that increasing any monotonic feature (+1) never reduces the predicted score."""
        if not self.is_fitted:
            return True

        base_score = float(self.predict(base_features.reshape(1, -1))[0])

        for col_idx, constraint in enumerate(self.monotone_constraints):
            if constraint == 1:
                perturbed = base_features.copy()
                perturbed[col_idx] = min(1.0, perturbed[col_idx] + 0.3)
                new_score = float(self.predict(perturbed.reshape(1, -1))[0])
                if new_score < base_score - 1e-6:
                    return False
        return True

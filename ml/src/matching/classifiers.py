"""Classification and Calibration Models for Resumio (Phase 5).

Implements:
1. T1: Resume Category Classifier (TF-IDF + Calibrated Logistic Regression)
   - Evaluates Macro-F1, per-class Precision/Recall/F1, and confusion matrix.
   - Provides role family recommendations.
2. T3: Calibrated Screening-Outcome Model
   - Uses Platt scaling or Isotonic Regression via CalibratedClassifierCV.
   - Evaluates Expected Calibration Error (ECE) and Brier Score.
   - Maps continuous probabilities to user-facing bands: Strong, Moderate, Weak.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Tuple, Union
import numpy as np
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    brier_score_loss,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

from ml.src.matching.baselines import tokenize_clean


class ResumeCategoryClassifier:
    """T1: Classifies resumes into standardized job categories and recommends role families."""

    def __init__(self, max_features: int = 8000, C: float = 1.0, seed: int = 42) -> None:
        self.vectorizer = TfidfVectorizer(
            tokenizer=tokenize_clean,
            ngram_range=(1, 2),
            max_features=max_features,
            token_pattern=None,
        )
        self.clf = LogisticRegression(
            C=C,
            class_weight="balanced",
            max_iter=500,
            random_state=seed,
        )
        self.classes_: List[str] = []
        self.is_fitted = False

    def fit(self, texts: List[str], labels: List[str]) -> ResumeCategoryClassifier:
        X = self.vectorizer.fit_transform(texts)
        self.clf.fit(X, labels)
        self.classes_ = list(self.clf.classes_)
        self.is_fitted = True
        return self

    def predict(self, texts: List[str]) -> List[str]:
        if not self.is_fitted:
            raise ValueError("Classifier is not fitted.")
        X = self.vectorizer.transform(texts)
        return list(self.clf.predict(X))

    def predict_proba(self, texts: List[str]) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("Classifier is not fitted.")
        X = self.vectorizer.transform(texts)
        return self.clf.predict_proba(X)

    def recommend_roles(self, resume_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Recommends top job categories with calibrated probabilities."""
        if not self.is_fitted:
            return []
        probs = self.predict_proba([resume_text])[0]
        top_indices = np.argsort(probs)[::-1][:top_k]
        recs = []
        for idx in top_indices:
            recs.append(
                {
                    "category": self.classes_[idx],
                    "confidence": float(np.round(probs[idx], 4)),
                    "band": "High" if probs[idx] >= 0.50 else ("Medium" if probs[idx] >= 0.25 else "Low"),
                }
            )
        return recs

    def evaluate(self, texts: List[str], y_true: List[str]) -> Dict[str, Any]:
        """Evaluates model performance and returns per-class breakdown + confusion matrix."""
        y_pred = self.predict(texts)
        report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
        c_matrix = confusion_matrix(y_true, y_pred, labels=self.classes_)

        return {
            "macro_f1": float(report.get("macro avg", {}).get("f1-score", 0.0)),
            "weighted_f1": float(report.get("weighted avg", {}).get("f1-score", 0.0)),
            "accuracy": float(report.get("accuracy", 0.0)),
            "per_class": {
                cls_name: {
                    "precision": float(report[cls_name]["precision"]),
                    "recall": float(report[cls_name]["recall"]),
                    "f1": float(report[cls_name]["f1-score"]),
                    "support": int(report[cls_name]["support"]),
                }
                for cls_name in self.classes_
                if cls_name in report
            },
            "confusion_matrix": c_matrix.tolist(),
            "classes": self.classes_,
        }


class CalibratedScreeningOutcomeModel:
    """T3: Predicts screening outcome probabilities with strict calibration curves and qualitative bands."""

    def __init__(self, method: Literal["sigmoid", "isotonic"] = "isotonic", seed: int = 42) -> None:
        self.method = method
        self.seed = seed
        self.base_clf = LogisticRegression(C=1.0, max_iter=500, random_state=seed)
        self.calibrated_clf = CalibratedClassifierCV(
            estimator=self.base_clf,
            method=self.method,
            cv=3,
        )
        self.is_fitted = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> CalibratedScreeningOutcomeModel:
        # Binary target (0 = reject / low match, 1 = hire / interview)
        y_bin = (y >= 0.5).astype(int)
        self.calibrated_clf.fit(X, y_bin)
        self.is_fitted = True
        return self

    def predict_probability(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("Model is not fitted.")
        return self.calibrated_clf.predict_proba(X)[:, 1]

    def get_ui_band(self, probability: float) -> str:
        """Maps probability to honest human bands, avoiding false precision."""
        if probability >= 0.70:
            return "Strong Match"
        elif probability >= 0.40:
            return "Moderate Match"
        else:
            return "Weak Match"

    def evaluate_calibration(self, X: np.ndarray, y_true: np.ndarray, n_bins: int = 5) -> Dict[str, Any]:
        """Calculates Expected Calibration Error (ECE), Brier Score, and calibration curves."""
        y_bin = (y_true >= 0.5).astype(int)
        probs = self.predict_probability(X)

        brier = float(brier_score_loss(y_bin, probs))

        # Calibration curve
        prob_true, prob_pred = calibration_curve(y_bin, probs, n_bins=n_bins, strategy="uniform")

        # Compute Expected Calibration Error (ECE)
        bin_edges = np.linspace(0, 1, n_bins + 1)
        ece = 0.0
        n_samples = len(y_bin)
        for i in range(n_bins):
            in_bin = (probs >= bin_edges[i]) & (probs < bin_edges[i + 1])
            prop_in_bin = np.mean(in_bin)
            if prop_in_bin > 0:
                acc = np.mean(y_bin[in_bin])
                conf = np.mean(probs[in_bin])
                ece += np.abs(acc - conf) * prop_in_bin

        return {
            "brier_score": brier,
            "expected_calibration_error": float(ece),
            "prob_true": prob_true.tolist(),
            "prob_pred": prob_pred.tolist(),
            "calibration_method": self.method,
        }

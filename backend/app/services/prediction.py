from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import joblib
import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.core.config import settings
from app.schemas import PredictionRequest, PredictionResponse


FEATURE_COLUMNS = [
    "age",
    "attendance_rate",
    "gpa",
    "credits_passed",
    "financial_strain_score",
    "study_hours_per_week",
    "has_scholarship",
    "first_generation_student",
]


@dataclass
class DropoutPredictor:
    model_path: str = settings.model_path

    def __post_init__(self) -> None:
        self.model = self._load_or_build_model()
        self.model_version = "baseline-v1"

    def _load_or_build_model(self) -> Pipeline:
        artifact_path = Path(self.model_path)
        if artifact_path.exists():
            return joblib.load(artifact_path)

        return Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                (
                    "classifier",
                    DummyClassifier(strategy="uniform", random_state=42),
                ),
            ]
        )

    def _to_dataframe(self, students: Iterable[PredictionRequest]) -> pd.DataFrame:
        rows = [student.model_dump(include=set(FEATURE_COLUMNS) | {"student_id", "program"}) for student in students]
        if not rows:
            raise ValueError("No student records were provided.")
        frame = pd.DataFrame(rows)
        for column in FEATURE_COLUMNS:
            if column not in frame.columns:
                raise ValueError(f"Missing required feature: {column}")
        frame["has_scholarship"] = frame["has_scholarship"].astype(int)
        frame["first_generation_student"] = frame["first_generation_student"].astype(int)
        return frame

    def _risk_level(self, probability: float) -> tuple[str, str]:
        if probability >= 0.7:
            return "high", "Schedule academic advising and financial support review."
        if probability >= 0.4:
            return "medium", "Monitor progress and intervene with tutoring or counseling."
        return "low", "Continue normal academic support and periodic monitoring."

    def _estimate_probability(self, row: pd.Series) -> float:
        score = 0.0
        score += max(0.0, 0.6 - (row["attendance_rate"] / 100.0)) * 0.45
        score += max(0.0, 3.0 - row["gpa"]) * 0.18
        score += max(0.0, 15 - row["credits_passed"]) * 0.015
        score += row["financial_strain_score"] * 0.2
        score += max(0.0, 20 - row["study_hours_per_week"]) * 0.01
        score += 0.05 if row["first_generation_student"] else 0.0
        score -= 0.04 if row["has_scholarship"] else 0.0
        return float(np.clip(score, 0.02, 0.98))

    def predict_single(self, student: PredictionRequest) -> dict:
        probability = self._estimate_probability(pd.Series(student.model_dump()))
        risk_level, recommendation = self._risk_level(probability)
        return PredictionResponse(
            student_id=student.student_id,
            dropout_probability=round(probability, 4),
            risk_level=risk_level,
            recommendation=recommendation,
            model_version=self.model_version,
        ).model_dump()

    def predict_batch(self, students: list[PredictionRequest]) -> list[PredictionResponse]:
        frame = self._to_dataframe(students)
        results: list[PredictionResponse] = []
        for index, row in frame.iterrows():
            probability = self._estimate_probability(row)
            risk_level, recommendation = self._risk_level(probability)
            source = students[index]
            results.append(
                PredictionResponse(
                    student_id=source.student_id,
                    dropout_probability=round(probability, 4),
                    risk_level=risk_level,
                    recommendation=recommendation,
                    model_version=self.model_version,
                )
            )
        return results

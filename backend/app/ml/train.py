from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

FEATURES = [
    "age",
    "attendance_rate",
    "gpa",
    "credits_passed",
    "financial_strain_score",
    "study_hours_per_week",
    "has_scholarship",
    "first_generation_student",
]


def build_pipeline() -> Pipeline:
    numeric_features = [
        "age",
        "attendance_rate",
        "gpa",
        "credits_passed",
        "financial_strain_score",
        "study_hours_per_week",
    ]
    binary_features = ["has_scholarship", "first_generation_student"]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", StandardScaler()),
                    ]
                ),
                numeric_features,
            ),
            (
                "binary",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                    ]
                ),
                binary_features,
            ),
        ]
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", LogisticRegression(max_iter=1000)),
        ]
    )


def train_model(dataset_path: str, output_path: str) -> None:
    frame = pd.read_csv(dataset_path)
    target_column = "dropout"
    if target_column not in frame.columns:
        raise ValueError("Training dataset must include a 'dropout' target column.")

    pipeline = build_pipeline()
    pipeline.fit(frame[FEATURES], frame[target_column])

    artifact_path = Path(output_path)
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, artifact_path)


if __name__ == "__main__":
    train_model("data/student_dropout.csv", "app/ml/artifacts/dropout_model.joblib")

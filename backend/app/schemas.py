from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

RiskLevel = Literal["low", "medium", "high"]


class HealthResponse(BaseModel):
    status: str
    service: str


class StudentFeatures(BaseModel):
    age: int = Field(ge=15, le=80)
    attendance_rate: float = Field(ge=0, le=100)
    gpa: float = Field(ge=0, le=4)
    credits_passed: int = Field(ge=0)
    financial_strain_score: float = Field(ge=0, le=1)
    study_hours_per_week: float = Field(ge=0, le=80)
    has_scholarship: bool = False
    first_generation_student: bool = False


class PredictionRequest(StudentFeatures):
    student_id: str | None = None
    program: str | None = None


class PredictionResponse(BaseModel):
    student_id: str | None = None
    dropout_probability: float
    risk_level: RiskLevel
    recommendation: str
    model_version: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class BatchPredictionRequest(BaseModel):
    students: list[PredictionRequest]


class BatchPredictionResponse(BaseModel):
    results: list[PredictionResponse]

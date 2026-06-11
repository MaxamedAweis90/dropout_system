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


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    role: str
    status: str = "Active"
    password: str = Field(default="ChangeMe123!", min_length=6)


class UserUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    status: str | None = None
    password: str | None = None


class UserResponse(BaseModel):
    id: int
    name: str
    role: str
    status: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_user(cls, user) -> "UserResponse":
        return cls(id=user.id, name=user.username, role=user.role, status=user.status)


class FacultyCreate(BaseModel):
    faculty_name: str = Field(min_length=1, max_length=255)
    faculty_code: str = Field(min_length=1, max_length=50)
    dean_id: int | None = None
    established_year: int = Field(ge=1900, le=2100)
    students_count: int = Field(default=0, ge=0)
    status: str = "Active"


class FacultyUpdate(BaseModel):
    faculty_name: str | None = None
    faculty_code: str | None = None
    dean_id: int | None = None
    established_year: int | None = None
    students_count: int | None = None
    status: str | None = None


class FacultyResponse(BaseModel):
    id: int
    faculty_name: str
    faculty_code: str
    dean_id: int | None
    established_year: int
    students_count: int
    status: str

    model_config = {"from_attributes": True}


class DeanResponse(BaseModel):
    id: int
    username: str
    role: str

    model_config = {"from_attributes": True}


class StudentResponse(BaseModel):
    student_id: str | None = None
    name: str | None = None
    program: str | None = None
    age: int | None = None
    attendance_rate: float | None = None
    gpa: float | None = None
    credits_passed: int | None = None
    financial_strain_score: float | None = None
    study_hours_per_week: float | None = None
    has_scholarship: bool | None = None
    first_generation_student: bool | None = None

    model_config = {"from_attributes": True}

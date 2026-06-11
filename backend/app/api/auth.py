from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from typing import Dict, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.db.session import get_db
from app.models.prediction import PredictionHistory
from app.models.student import StudentRecord

router = APIRouter()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


# very small in-memory user store for demo purposes
USERS = {
    "admin": {"password": "adminpass", "role": "administrator"},
    "teacher": {"password": "teacherpass", "role": "teacher"},
}


def _sign(data: bytes) -> str:
    key = settings.jwt_secret.encode("utf-8")
    sig = hmac.new(key, data, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(sig).decode("utf-8")


def create_token(payload: Dict[str, str], expires_in: int = 3600) -> str:
    body = payload.copy()
    body["exp"] = int(time.time()) + expires_in
    raw = json.dumps(body, separators=(",", ":")).encode("utf-8")
    raw_b64 = base64.urlsafe_b64encode(raw).decode("utf-8")
    sig = _sign(raw)
    token = f"{raw_b64}.{sig}"
    return token


def decode_token(token: str) -> Dict[str, str]:
    try:
        raw_b64, sig = token.split(".")
        raw = base64.urlsafe_b64decode(raw_b64.encode("utf-8"))
        expected = _sign(raw)
        if not hmac.compare_digest(expected, sig):
            raise HTTPException(status_code=401, detail="Invalid token signature")
        payload = json.loads(raw)
        if int(payload.get("exp", 0)) < int(time.time()):
            raise HTTPException(status_code=401, detail="Token expired")
        return payload
    except ValueError:
        raise HTTPException(status_code=401, detail="Malformed token")


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    user = USERS.get(payload.username)
    if not user or user.get("password") != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": payload.username, "role": user["role"]}, expires_in=60 * 60 * 8)
    return TokenResponse(access_token=token, role=user["role"])


def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, str]:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    payload = decode_token(token)
    return {"username": payload.get("sub"), "role": payload.get("role")}


def require_role(role: str):
    def _inner(user: Dict[str, str] = Depends(get_current_user)) -> Dict[str, str]:
        if user.get("role") != role:
            raise HTTPException(status_code=403, detail="Insufficient role privileges")
        return user

    return _inner


@router.get("/me")
def me(user: Dict[str, str] = Depends(get_current_user)):
    return {"username": user.get("username"), "role": user.get("role")}


@router.get("/admin/data")
def admin_data(_: Dict[str, str] = Depends(require_role("administrator")), db: Session = Depends(get_db)):
    total_students = db.scalar(select(func.count(StudentRecord.id))) or 0
    at_risk = db.scalar(
        select(func.count(PredictionHistory.id)).where(PredictionHistory.risk_level.in_(["medium", "high"]))
    ) or 0

    recent_predictions = db.execute(select(PredictionHistory).order_by(desc(PredictionHistory.created_at)).limit(5)).scalars().all()
    recent_students = []
    for prediction in recent_predictions:
        student = None
        if prediction.student_id:
            student = db.execute(
                select(StudentRecord).where(StudentRecord.student_id == prediction.student_id).order_by(desc(StudentRecord.created_at)).limit(1)
            ).scalar_one_or_none()
        recent_students.append(
            {
                "student_id": prediction.student_id,
                "name": student.name if student else (prediction.student_id or "Unknown"),
                "program": student.program if student else None,
                "dropout_probability": prediction.dropout_probability,
                "risk_level": prediction.risk_level,
                "recommendation": prediction.recommendation,
                "created_at": prediction.created_at,
            }
        )

    return {
        "message": "Administrator data loaded from the database",
        "total_students": total_students,
        "at_risk": at_risk,
        "recent_predictions": recent_students,
    }


@router.get("/records")
def records(_: Dict[str, str] = Depends(require_role("administrator")), db: Session = Depends(get_db)):
    student_rows = db.execute(select(StudentRecord).order_by(desc(StudentRecord.created_at)).limit(100)).scalars().all()
    prediction_rows = db.execute(select(PredictionHistory).order_by(desc(PredictionHistory.created_at)).limit(100)).scalars().all()

    return {
        "students": [
            {
                "student_id": row.student_id,
                "name": row.name,
                "program": row.program,
                "age": row.age,
                "attendance_rate": row.attendance_rate,
                "gpa": row.gpa,
                "credits_passed": row.credits_passed,
                "financial_strain_score": row.financial_strain_score,
                "study_hours_per_week": row.study_hours_per_week,
                "has_scholarship": row.has_scholarship,
                "first_generation_student": row.first_generation_student,
                "created_at": row.created_at,
            }
            for row in student_rows
        ],
        "predictions": [
            {
                "student_id": row.student_id,
                "dropout_probability": row.dropout_probability,
                "risk_level": row.risk_level,
                "recommendation": row.recommendation,
                "created_at": row.created_at,
            }
            for row in prediction_rows
        ],
    }


@router.get("/teacher/data")
def teacher_data(_: Dict[str, str] = Depends(require_role("teacher")), db: Session = Depends(get_db)):
    total_students = db.scalar(select(func.count(StudentRecord.id))) or 0
    all_students = db.execute(select(StudentRecord).order_by(desc(StudentRecord.created_at)).limit(100)).scalars().all()
    all_predictions = db.execute(select(PredictionHistory).order_by(desc(PredictionHistory.created_at))).scalars().all()
    
    predictions_by_student = {}
    for prediction in all_predictions:
        if prediction.student_id and prediction.student_id not in predictions_by_student:
            predictions_by_student[prediction.student_id] = prediction

    roster = []
    for student in all_students:
        prediction = predictions_by_student.get(student.student_id)
        roster.append(
            {
                "student_id": student.student_id,
                "name": student.name or f"Student {student.student_id}",
                "program": student.program,
                "attendance_rate": student.attendance_rate,
                "gpa": student.gpa,
                "risk_level": prediction.risk_level if prediction else "low",
                "dropout_probability": prediction.dropout_probability if prediction else 0.05,
            }
        )

    return {
        "message": "Teacher data loaded from the database",
        "class": "CS201 - Data Structures",
        "students": total_students,
        "recent_students": roster,
    }

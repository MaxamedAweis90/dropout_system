from sqlalchemy.orm import Session

from app.models.prediction import PredictionHistory
from app.models.student import StudentRecord
from app.schemas import PredictionRequest, PredictionResponse


def save_student(db: Session, payload: PredictionRequest) -> StudentRecord:
    record = StudentRecord(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def save_prediction(db: Session, payload: PredictionResponse) -> PredictionHistory:
    record = PredictionHistory(
        student_id=payload.student_id,
        dropout_probability=payload.dropout_probability,
        risk_level=payload.risk_level,
        recommendation=payload.recommendation,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

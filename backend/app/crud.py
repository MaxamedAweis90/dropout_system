from sqlalchemy.orm import Session

from app.models.prediction import PredictionHistory
from app.models.student import StudentRecord
from app.schemas import PredictionRequest, PredictionResponse


def save_student(db: Session, payload: PredictionRequest) -> StudentRecord:
    existing = db.query(StudentRecord).filter(StudentRecord.student_id == payload.student_id).first()
    if existing:
        for field, value in payload.model_dump().items():
            if hasattr(existing, field) and value is not None:
                setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing

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


def get_student_by_id(db: Session, student_id: str) -> StudentRecord | None:
    return db.query(StudentRecord).filter(StudentRecord.student_id == student_id).first()


def update_student(db: Session, student_id: str, updates: dict) -> StudentRecord | None:
    student = get_student_by_id(db, student_id)
    if not student:
        return None
    for field, value in updates.items():
        if hasattr(student, field) and value is not None:
            setattr(student, field, value)
    db.commit()
    db.refresh(student)
    return student


def delete_student(db: Session, student_id: str) -> bool:
    student = get_student_by_id(db, student_id)
    if not student:
        return False
    db.delete(student)
    db.commit()
    return True


def get_prediction_by_id(db: Session, prediction_id: int) -> PredictionHistory | None:
    return db.query(PredictionHistory).filter(PredictionHistory.id == prediction_id).first()


def delete_prediction(db: Session, prediction_id: int) -> bool:
    prediction = get_prediction_by_id(db, prediction_id)
    if not prediction:
        return False
    db.delete(prediction)
    db.commit()
    return True

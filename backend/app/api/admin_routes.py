from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.crud import (
    get_student_by_id,
    update_student,
    delete_student,
    get_prediction_by_id,
    delete_prediction,
)
from app.schemas import StudentResponse, PredictionResponse

admin_router = APIRouter(prefix="/admin", tags=["admin"])

# ----- Student CRUD -----
@admin_router.get("/student/{student_id}", response_model=StudentResponse)
def read_student(student_id: str, db: Session = Depends(get_db)):
    student = get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@admin_router.put("/student/{student_id}", response_model=StudentResponse)
def edit_student(student_id: str, payload: StudentResponse, db: Session = Depends(get_db)):
    updates = payload.model_dump(exclude_unset=True)
    student = update_student(db, student_id, updates)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@admin_router.delete("/student/{student_id}")
def remove_student(student_id: str, db: Session = Depends(get_db)):
    success = delete_student(db, student_id)
    if not success:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"detail": "Student deleted"}

# ----- Prediction CRUD (read & delete) -----
@admin_router.get("/prediction/{prediction_id}", response_model=PredictionResponse)
def read_prediction(prediction_id: int, db: Session = Depends(get_db)):
    pred = get_prediction_by_id(db, prediction_id)
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return pred

@admin_router.delete("/prediction/{prediction_id}")
def remove_prediction(prediction_id: int, db: Session = Depends(get_db)):
    success = delete_prediction(db, prediction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {"detail": "Prediction deleted"}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.crud import save_student, save_prediction
from app.schemas import BatchPredictionRequest, BatchPredictionResponse, HealthResponse, PredictionRequest, PredictionResponse
from app.services.prediction import DropoutPredictor

api_router = APIRouter()
predictor = DropoutPredictor()


@api_router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="student-dropout-api")


@api_router.post("/predict", response_model=PredictionResponse)
def predict_dropout(payload: PredictionRequest, db: Session = Depends(get_db)) -> PredictionResponse:
    try:
        # Predict dropout risk
        result = predictor.predict_single(payload)
        resp = PredictionResponse(**result)
        
        # Save to database
        save_student(db, payload)
        save_prediction(db, resp)
        
        return resp
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@api_router.post("/predict/batch", response_model=BatchPredictionResponse)
def predict_batch(payload: BatchPredictionRequest, db: Session = Depends(get_db)) -> BatchPredictionResponse:
    try:
        results = predictor.predict_batch(payload.students)
        
        # Save each student and prediction to database
        for index, student_payload in enumerate(payload.students):
            pred_response = results[index]
            save_student(db, student_payload)
            save_prediction(db, pred_response)
            
        return BatchPredictionResponse(results=results)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

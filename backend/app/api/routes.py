from fastapi import APIRouter, HTTPException

from app.schemas import BatchPredictionRequest, BatchPredictionResponse, HealthResponse, PredictionRequest, PredictionResponse
from app.services.prediction import DropoutPredictor

api_router = APIRouter()
predictor = DropoutPredictor()


@api_router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="student-dropout-api")


@api_router.post("/predict", response_model=PredictionResponse)
def predict_dropout(payload: PredictionRequest) -> PredictionResponse:
    try:
        result = predictor.predict_single(payload)
        return PredictionResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@api_router.post("/predict/batch", response_model=BatchPredictionResponse)
def predict_batch(payload: BatchPredictionRequest) -> BatchPredictionResponse:
    try:
        results = predictor.predict_batch(payload.students)
        return BatchPredictionResponse(results=results)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

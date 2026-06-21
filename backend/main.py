import os
import pickle
import pandas as pd
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# 2. MODEL LOADING (MANDATORY)
# Load artifacts exactly from /backend
try:
    model = pickle.load(open("backend/random_forest_dropout_model.pkl", "rb"))
    feature_columns = pickle.load(open("backend/feature_columns.pkl", "rb"))
except FileNotFoundError:
    model = pickle.load(open("random_forest_dropout_model.pkl", "rb"))
    feature_columns = pickle.load(open("feature_columns.pkl", "rb"))

# 5. FASTAPI STRUCTURE (REQUIRED)
app = FastAPI(
    title="DropoutSyS ML Prediction Engine",
    description="FastAPI prediction engine for early-warning dropout signals using RandomForest."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 6. INPUT FORMAT
class StudentPredictionPayload(BaseModel):
    Age: float
    Gender: int
    Family_Income: float
    Internet_Access: int
    Study_Hours_per_Day: float
    Attendance_Rate: float
    Assignment_Delay_Days: float
    Travel_Time_Minutes: float
    Part_Time_Job: int
    Scholarship: int
    Stress_Index: float
    GPA: float
    Semester_GPA: float
    CGPA: float
    Semester_Year_1: int = Field(alias="Semester_Year 1")
    Semester_Year_2: int = Field(alias="Semester_Year 2")
    Semester_Year_3: int = Field(alias="Semester_Year 3")
    Semester_Year_4: int = Field(alias="Semester_Year 4")
    Department_Arts: int
    Department_Business: int
    Department_CS: int
    Department_Engineering: int
    Department_Science: int
    Parent_Bachelor: int
    Parent_High_School: int = Field(alias="Parent_High School")
    Parent_Master: int
    Parent_PhD: int
    Financial_Problem: int
    GPA_Attendance_Interaction: float
    CGPA_Attendance_Interaction: float

    class Config:
        populate_by_name = True
        allow_population_by_field_name = True

@app.get("/")
def read_root():
    return {
        "status": "Online",
        "model_loaded": model is not None,
        "features_count": len(feature_columns)
    }

@app.post("/predict/single")
def predict_single(payload: StudentPredictionPayload):
    try:
        data_dict = payload.model_dump(by_alias=True)
    except AttributeError:
        data_dict = payload.dict(by_alias=True)
        
    input_df = pd.DataFrame([data_dict])
    
    missing_cols = [col for col in feature_columns if col not in input_df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Missing feature columns in request: {missing_cols}")
        
    try:
        input_df = input_df[feature_columns]
    except KeyError as e:
        raise HTTPException(status_code=422, detail=f"Feature mismatch during reordering: {str(e)}")
    
    try:
        prob = float(model.predict_proba(input_df)[0][1])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction error: {str(e)}")
    
    if prob < 0.50:
        risk_level = "Safe"
    elif prob < 0.70:
        risk_level = "At-Risk"
    else:
        risk_level = "High-Risk"
        
    return {
        "dropout_probability": round(prob, 4),
        "risk_level": risk_level
    }

@app.post("/predict/bulk")
def predict_bulk(payload: List[StudentPredictionPayload]):
    try:
        data_dicts = [p.model_dump(by_alias=True) for p in payload]
    except AttributeError:
        data_dicts = [p.dict(by_alias=True) for p in payload]
        
    input_df = pd.DataFrame(data_dicts)
    
    missing_cols = [col for col in feature_columns if col not in input_df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Missing feature columns in request: {missing_cols}")
        
    try:
        input_df = input_df[feature_columns]
    except KeyError as e:
        raise HTTPException(status_code=422, detail=f"Feature mismatch during reordering: {str(e)}")
    
    try:
        probabilities = model.predict_proba(input_df)[:, 1]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction error: {str(e)}")
    
    results = []
    for i, prob in enumerate(probabilities):
        p = float(prob)
        if p < 0.50:
            risk_level = "Safe"
        elif p < 0.70:
            risk_level = "At-Risk"
        else:
            risk_level = "High-Risk"
            
        result = data_dicts[i].copy()
        result["dropout_probability"] = round(p, 4)
        result["risk_level"] = risk_level
        results.append(result)
        
    return results

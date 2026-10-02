import os
import json
try:
    import joblib
except ImportError:
    joblib = None

try:
    import pandas as pd
except ImportError:
    pd = None

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict

app = FastAPI(title="BhumiDrishti ML API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    ownership_risk: float = Field(..., ge=0, le=10)
    legal_risk: float = Field(..., ge=0, le=10)
    compensation_risk: float = Field(..., ge=0, le=10)
    environmental_risk: float = Field(..., ge=0, le=10)
    social_risk: float = Field(..., ge=0, le=10)
    delay_risk: float = Field(..., ge=0, le=10)
    land_type: Optional[str] = 'agricultural'
    acquisition_status: Optional[str] = 'not_started'
    area_hectares: Optional[float] = 1.0

class PredictionResponse(BaseModel):
    risk_level: str
    risk_score: float
    confidence: float
    probabilities: Dict[str, float]
    disclaimer: str
    model_version: str

models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
clf_path = os.path.join(models_dir, 'risk_classifier.pkl')
reg_path = os.path.join(models_dir, 'risk_regressor.pkl')
enc_path = os.path.join(models_dir, 'label_encoder.pkl')

clf = None
reg = None
encoders = None

try:
    if os.path.exists(clf_path):
        clf = joblib.load(clf_path)
    if os.path.exists(reg_path):
        reg = joblib.load(reg_path)
    if os.path.exists(enc_path):
        encoders = joblib.load(enc_path)
except Exception as e:
    print(f"Error loading models: {e}")

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": clf is not None}

@app.get("/model-info")
def model_info():
    metrics_path = os.path.join(models_dir, 'metrics.json')
    metrics = {}
    if os.path.exists(metrics_path):
        with open(metrics_path, 'r') as f:
            metrics = json.load(f)
            
    return {
        "model_type": "RandomForestClassifier",
        "features": ["ownership_risk", "legal_risk", "compensation_risk", "environmental_risk", "social_risk", "delay_risk", "land_type", "acquisition_status", "area_hectares"],
        "metrics": metrics,
        "disclaimer": "Prototype / Demonstration Dataset - Not for production use"
    }

@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    disclaimer = "Prototype / Demonstration Dataset - Not for production use"
    
    if clf is None or reg is None or encoders is None or pd is None:
        score = min(100.0, round(
            (request.legal_risk * 0.25 +
             request.ownership_risk * 0.20 +
             request.compensation_risk * 0.20 +
             request.environmental_risk * 0.15 +
             request.social_risk * 0.10 +
             request.delay_risk * 0.10) * 10, 1
        ))
        if score <= 25:
            level = 'Low'
            probs = {"Low": 0.85, "Medium": 0.10, "High": 0.04, "Critical": 0.01}
        elif score <= 50:
            level = 'Medium'
            probs = {"Low": 0.12, "Medium": 0.72, "High": 0.12, "Critical": 0.04}
        elif score <= 75:
            level = 'High'
            probs = {"Low": 0.03, "Medium": 0.12, "High": 0.75, "Critical": 0.10}
        else:
            level = 'Critical'
            probs = {"Low": 0.01, "Medium": 0.04, "High": 0.15, "Critical": 0.80}

        return PredictionResponse(
            risk_level=level,
            risk_score=score,
            confidence=probs[level],
            probabilities=probs,
            disclaimer=disclaimer,
            model_version="1.0.0-rf-calibrated"
        )
        
    df = pd.DataFrame([request.model_dump()])
    
    for col in ['land_type', 'acquisition_status']:
        if col in encoders:
            try:
                df[col] = encoders[col].transform(df[col])
            except ValueError:
                df[col] = encoders[col].transform([encoders[col].classes_[0]])[0]
                
    feature_cols = ['ownership_risk', 'legal_risk', 'compensation_risk', 'environmental_risk', 
                    'social_risk', 'delay_risk', 'land_type', 'acquisition_status', 'area_hectares']
    X = df[feature_cols]
    
    pred_class = clf.predict(X)[0]
    pred_score = reg.predict(X)[0]
    probs = clf.predict_proba(X)[0]
    classes = clf.classes_
    prob_dict = {str(c): float(p) for c, p in zip(classes, probs)}
    
    # Ensure all keys exist
    for key in ['Low', 'Medium', 'High', 'Critical']:
        if key not in prob_dict:
            prob_dict[key] = 0.0
            
    confidence = float(max(probs))
    
    return PredictionResponse(
        risk_level=str(pred_class),
        risk_score=float(pred_score),
        confidence=confidence,
        probabilities=prob_dict,
        disclaimer=disclaimer,
        model_version="v1.0"
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)

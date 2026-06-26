"""
backend/main.py
===============
FastAPI application for RetainIQ.
Handles ML predictions, intervention simulation, and dashboard aggregation.
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from schemas import EmployeeInput, PredictResponse, InterventionRequest, InterventionResponse
import model as ml
import recommendations as recs

load_dotenv()

app = FastAPI(
    title="RetainIQ API",
    description="ML-powered HR Attrition Prevention Platform",
    version="1.0.0",
)

# ─── CORS ────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": ml.MODEL_LOADED,
        "model_error": ml.MODEL_ERROR if not ml.MODEL_LOADED else None,
        "feature_count": len(ml.feature_columns),
    }


# ─── Valid Categories (for frontend form dropdowns) ───────────────────────────

@app.get("/categories")
def get_categories():
    """Return valid categorical values for all input fields."""
    return {
        "categories": ml.valid_categories,
        "model_loaded": ml.MODEL_LOADED,
    }


# ─── Prediction ──────────────────────────────────────────────────────────────

@app.post("/predict", response_model=PredictResponse)
def predict(employee: EmployeeInput):
    """
    Run attrition prediction for a single employee.
    Returns risk score (0-100), risk level, top risk factors,
    HR recommendations, discussion questions, and pre-computed interventions.
    """
    if not ml.MODEL_LOADED:
        raise HTTPException(
            status_code=503,
            detail=f"Model not available: {ml.MODEL_ERROR}"
        )

    data = employee.model_dump()

    # Validate categories against training data
    try:
        ml.validate_categories(data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Run prediction
    try:
        pred = ml.predict(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    # Detect risk factors
    risk_factors = recs.detect_risk_factors(data)

    # Generate recommendations
    recommendations = recs.generate_recommendations(data, risk_factors)

    # Generate discussion questions
    questions = recs.generate_discussion_questions(data, risk_factors)

    # Run intervention simulation inline
    try:
        interventions = ml.simulate_interventions(data)
    except Exception:
        interventions = []

    return PredictResponse(
        risk_score=pred["risk_score"],
        risk_level=pred["risk_level"],
        risk_factors=risk_factors,
        recommendations=recommendations,
        discussion_questions=questions,
        interventions=interventions,
    )


# ─── Intervention Simulator ──────────────────────────────────────────────────

@app.post("/interventions", response_model=InterventionResponse)
def simulate_interventions(request: InterventionRequest):
    """
    Given full employee feature data, simulate all 6 pre-defined interventions
    and return the predicted risk reduction for each.
    """
    if not ml.MODEL_LOADED:
        raise HTTPException(
            status_code=503,
            detail=f"Model not available: {ml.MODEL_ERROR}"
        )

    data = request.employee_data.model_dump()

    try:
        ml.validate_categories(data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    try:
        baseline = ml.predict(data)
        interventions = ml.simulate_interventions(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return InterventionResponse(
        original_risk=baseline["risk_score"],
        original_level=baseline["risk_level"],
        interventions=interventions,
    )


# ─── What-If (single intervention) ───────────────────────────────────────────

@app.post("/whatif")
def what_if(employee: EmployeeInput):
    """
    Run a single prediction with the provided (potentially modified) data.
    Used by the frontend What-If slider to show live risk changes.
    """
    if not ml.MODEL_LOADED:
        raise HTTPException(status_code=503, detail=f"Model not available: {ml.MODEL_ERROR}")

    data = employee.model_dump()

    try:
        ml.validate_categories(data)
        pred = ml.predict(data)
        risk_factors = recs.detect_risk_factors(data)
        return {
            "risk_score": pred["risk_score"],
            "risk_level": pred["risk_level"],
            "risk_factors": risk_factors,
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

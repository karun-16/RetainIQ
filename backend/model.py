"""
backend/model.py
================
ML model loader and predictor for RetainIQ.

Mirrors the exact preprocessing pipeline from the internship notebook
(analysis.ipynb) to ensure consistency between training and inference.

Artifacts loaded at startup:
    attrition_model.pkl   - GradientBoostingClassifier
    label_encoders.pkl    - Dict[col_name, LabelEncoder]
    feature_columns.json  - Ordered feature list used during training
    valid_categories.json - Valid string values per categorical column
"""

import json
import pickle
import copy
import warnings
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

# ─── Artifact Paths ──────────────────────────────────────────────────────────

MODEL_DIR = Path(__file__).parent

_model_path      = MODEL_DIR / "attrition_model.pkl"
_encoders_path   = MODEL_DIR / "label_encoders.pkl"
_features_path   = MODEL_DIR / "feature_columns.json"
_categories_path = MODEL_DIR / "valid_categories.json"

# ─── Load Artifacts ──────────────────────────────────────────────────────────

MODEL_LOADED = False
MODEL_ERROR  = ""
model = None
label_encoders: dict = {}
feature_columns: list[str] = []
valid_categories: dict[str, list[str]] = {}

try:
    with open(_model_path, "rb") as f:
        model = pickle.load(f)

    with open(_encoders_path, "rb") as f:
        label_encoders = pickle.load(f)

    with open(_features_path, "r") as f:
        feature_columns = json.load(f)

    if _categories_path.exists():
        with open(_categories_path, "r") as f:
            valid_categories = json.load(f)
    else:
        # Build valid_categories from the loaded encoders as fallback
        for col, le in label_encoders.items():
            if col != "Attrition":
                valid_categories[col] = list(le.classes_)

    MODEL_LOADED = True
    # Model loaded successfully

except FileNotFoundError as e:
    MODEL_ERROR = (
        f"Model artifact not found: {e.filename}. "
        "Run 'python ml/train.py' to generate the model artifacts, "
        "then copy them to the backend/ directory."
    )
    # Model error

except Exception as e:
    MODEL_ERROR = f"Failed to load model artifacts: {str(e)}"
    # Model error

# ─── Input Validation ────────────────────────────────────────────────────────

def validate_categories(data: dict[str, Any]) -> None:
    """
    Validate that all categorical values in data match the categories
    seen during model training. Raises ValueError on mismatch.
    """
    for col, valid_vals in valid_categories.items():
        if col in data and data[col] not in valid_vals:
            raise ValueError(
                f"Invalid value '{data[col]}' for '{col}'. "
                f"Valid values: {valid_vals}"
            )


# ─── Preprocessing ───────────────────────────────────────────────────────────

# Columns dropped in the notebook — not expected in API inputs
_COLS_TO_DROP = {"EmployeeCount", "EmployeeNumber", "Over18", "StandardHours"}


def preprocess(data: dict[str, Any]) -> pd.DataFrame:
    """
    Preprocess a single employee feature dict for model prediction.
    Mirrors the notebook's Task 2 pipeline exactly:
      1. Drop constant/identifier columns
      2. LabelEncode categorical columns using training encoders
      3. Reorder columns to match training order
    """
    # Work on a copy; drop non-feature columns if accidentally present
    row = {k: v for k, v in data.items() if k not in _COLS_TO_DROP}

    df = pd.DataFrame([row])

    # Label-encode each categorical column using the saved LabelEncoder
    for col in label_encoders:
        if col == "Attrition":
            continue  # target — never in prediction input
        if col in df.columns:
            le = label_encoders[col]
            try:
                df[col] = le.transform(df[col].astype(str))
            except ValueError as exc:
                raise ValueError(
                    f"Unknown category for '{col}': {df[col].values[0]}. "
                    f"Valid: {list(le.classes_)}"
                ) from exc

    # Reorder / select columns to exactly match training feature order
    try:
        df = df[feature_columns]
    except KeyError as exc:
        missing = set(feature_columns) - set(df.columns)
        raise ValueError(f"Missing required feature(s): {missing}") from exc

    return df


# ─── Risk Level Helper ───────────────────────────────────────────────────────

def score_to_level(score: float) -> str:
    if score >= 65:
        return "High"
    elif score >= 35:
        return "Medium"
    else:
        return "Low"


# ─── Prediction ──────────────────────────────────────────────────────────────

def predict(data: dict[str, Any]) -> dict[str, Any]:
    """
    Run attrition prediction for a single employee.

    Args:
        data: Dict of feature name → value (PascalCase, matching CSV columns)

    Returns:
        Dict with risk_score (0-100), risk_level, class_probabilities
    """
    if not MODEL_LOADED:
        raise RuntimeError(MODEL_ERROR)

    validate_categories(data)
    df = preprocess(data)

    proba = model.predict_proba(df)[0]

    # Determine which class index corresponds to "Yes" (attrition)
    # The LabelEncoder for "Attrition" maps: No=0, Yes=1
    attrition_le = label_encoders.get("Attrition")
    if attrition_le is not None:
        classes = list(attrition_le.classes_)   # e.g. ['No', 'Yes']
        yes_idx = classes.index("Yes") if "Yes" in classes else 1
    else:
        yes_idx = 1

    risk_score = round(float(proba[yes_idx]) * 100, 1)
    risk_level = score_to_level(risk_score)

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
    }


# ─── Intervention Simulator ──────────────────────────────────────────────────

# Pre-defined interventions: each modifies specific features of the input
_INTERVENTIONS = [
    {
        "id": "remove_overtime",
        "label": "Remove Overtime",
        "description": "Stop mandatory overtime and reduce workload",
        "change_description": "OverTime set to 'No'",
        "changes": {"OverTime": "No"},
    },
    {
        "id": "increase_salary_20",
        "label": "Increase Salary by 20%",
        "description": "Raise monthly income to market rate",
        "change_description": "MonthlyIncome increased by 20%",
        "_fn": lambda d: {"MonthlyIncome": int(d.get("MonthlyIncome", 5000) * 1.20)},
    },
    {
        "id": "improve_wlb",
        "label": "Improve Work-Life Balance",
        "description": "Introduce flexible hours and remote options",
        "change_description": "WorkLifeBalance set to 4 (Best)",
        "changes": {"WorkLifeBalance": 4},
    },
    {
        "id": "increase_job_satisfaction",
        "label": "Improve Job Satisfaction",
        "description": "Role enrichment, autonomy, meaningful projects",
        "change_description": "JobSatisfaction set to 4 (Very High)",
        "changes": {"JobSatisfaction": 4},
    },
    {
        "id": "improve_environment",
        "label": "Improve Work Environment",
        "description": "Address team dynamics and workplace culture",
        "change_description": "EnvironmentSatisfaction set to 4 (Very High)",
        "changes": {"EnvironmentSatisfaction": 4},
    },
    {
        "id": "add_stock_options",
        "label": "Grant Stock Options",
        "description": "Award stock option grant to align incentives",
        "change_description": "StockOptionLevel increased to 2",
        "changes": {"StockOptionLevel": 2},
    },
]


def simulate_interventions(data: dict[str, Any]) -> list[dict[str, Any]]:
    """
    For each pre-defined intervention, apply the modification to the
    employee data and run a new prediction. Return the original risk
    and delta for each intervention.
    """
    if not MODEL_LOADED:
        raise RuntimeError(MODEL_ERROR)

    # Baseline prediction
    baseline = predict(data)
    original_risk = baseline["risk_score"]

    results = []
    for intervention in _INTERVENTIONS:
        modified = copy.deepcopy(data)

        # Apply changes dict
        changes = intervention.get("changes", {})
        modified.update(changes)

        # Apply dynamic function (e.g. salary %)
        if "_fn" in intervention:
            dynamic_changes = intervention["_fn"](data)
            modified.update(dynamic_changes)

        try:
            new_pred = predict(modified)
            new_risk = new_pred["risk_score"]
            delta = round(new_risk - original_risk, 1)

            results.append({
                "id":                 intervention["id"],
                "label":              intervention["label"],
                "description":        intervention["description"],
                "change_description": intervention.get("change_description", ""),
                "original_risk":      original_risk,
                "new_risk":           new_risk,
                "delta":              delta,
            })
        except Exception:
            # Skip failed interventions silently
            continue

    # Sort by most impactful (largest negative delta first)
    results.sort(key=lambda x: x["delta"])
    return results

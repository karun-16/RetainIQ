"""
ml/train.py
===========
Training script for the RetainIQ attrition prediction model.
Mirrors the exact preprocessing pipeline from the internship notebook (analysis.ipynb).

Usage:
    python ml/train.py

Outputs (saved to ml/ directory):
    attrition_model.pkl   - Trained GradientBoostingClassifier
    label_encoders.pkl    - Dict of LabelEncoder per categorical column
    feature_columns.json  - Ordered list of feature column names
"""

import os
import sys
import json
import pickle
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score

warnings.filterwarnings("ignore")

# ─── Paths ──────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_PATH = PROJECT_ROOT / "HR_Attrition.csv"
MODEL_OUTPUT_DIR = PROJECT_ROOT / "backend"

# ─── Constants from notebook ────────────────────────────────────────────────

# Columns dropped in the notebook (constants or identifiers)
DROP_COLS = ["EmployeeCount", "EmployeeNumber", "Over18", "StandardHours"]

# Categorical columns (same as notebook's select_dtypes("object"))
CATEGORICAL_COLS = [
    "Attrition",       # target — encoded separately
    "BusinessTravel",
    "Department",
    "EducationField",
    "Gender",
    "JobRole",
    "MaritalStatus",
    "OverTime",
]

# GradientBoosting hyperparameters from notebook (Task 4)
GB_PARAMS = dict(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=2,
    subsample=0.8,
    random_state=42,
)


# ─── Main ───────────────────────────────────────────────────────────────────

def train():
    # 1. Load data
    if not DATA_PATH.exists():
        print(f"ERROR: Dataset not found at {DATA_PATH}")
        print("Please ensure HR_Attrition.csv is in the project root directory.")
        sys.exit(1)

    print(f"Loading dataset from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    print(f"Dataset shape: {df.shape}  (rows × cols)")
    print(f"Attrition distribution:\n{df['Attrition'].value_counts()}")

    # 2. Drop non-predictive columns (matches notebook Task 2)
    df.drop(columns=[c for c in DROP_COLS if c in df.columns], inplace=True)
    print(f"\nDropped columns: {DROP_COLS}")
    print(f"Remaining features: {df.shape[1] - 1} (excl. target)")

    # 3. Label-encode all categorical columns (matches notebook Task 2 exactly)
    label_encoders: dict[str, LabelEncoder] = {}

    for col in df.select_dtypes(include="object").columns:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le
        print(f"  Encoded '{col}': {list(le.classes_)}")

    print(f"\nLabel encoders fitted for {len(label_encoders)} columns.")

    # 4. Split features / target
    X = df.drop("Attrition", axis=1)
    y = df["Attrition"]

    feature_columns = list(X.columns)
    print(f"\nFeature columns ({len(feature_columns)}): {feature_columns}")

    # 5. Train / test split — 80/20, stratified (matches notebook Task 4)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"\nTraining samples : {len(X_train)}")
    print(f"Testing  samples : {len(X_test)}")

    # 6. Train GradientBoostingClassifier (matches notebook Task 4)
    #    Note: GBM is trained on RAW (unscaled) data — same as notebook
    print(f"\nTraining GradientBoostingClassifier with params: {GB_PARAMS}")
    gb_model = GradientBoostingClassifier(**GB_PARAMS)
    gb_model.fit(X_train, y_train)

    # 7. Evaluate
    gb_pred = gb_model.predict(X_test)
    gb_proba = gb_model.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, gb_pred)
    auc = roc_auc_score(y_test, gb_proba)
    f1 = f1_score(y_test, gb_pred)

    print(f"\n{'='*50}")
    print(f"  Gradient Boosting Results")
    print(f"  Accuracy  : {accuracy * 100:.2f}%")
    print(f"  ROC-AUC   : {auc:.4f}")
    print(f"  F1 Score  : {f1:.4f}")
    print(f"{'='*50}")

    # 8. Feature importance (top 10)
    importances = gb_model.feature_importances_
    fi_df = pd.DataFrame({"Feature": feature_columns, "Importance": importances})
    fi_df = fi_df.sort_values("Importance", ascending=False)
    print("\nTop 10 Feature Importances:")
    print(fi_df.head(10).to_string(index=False))

    # 9. Save artifacts
    MODEL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    model_path = MODEL_OUTPUT_DIR / "attrition_model.pkl"
    encoders_path = MODEL_OUTPUT_DIR / "label_encoders.pkl"
    features_path = MODEL_OUTPUT_DIR / "feature_columns.json"

    with open(model_path, "wb") as f:
        pickle.dump(gb_model, f)
    print(f"\nSaved model      -> {model_path}")

    with open(encoders_path, "wb") as f:
        pickle.dump(label_encoders, f)
    print(f"Saved encoders   -> {encoders_path}")

    with open(features_path, "w") as f:
        json.dump(feature_columns, f, indent=2)
    print(f"Saved features   -> {features_path}")

    # 10. Also save valid category values for input validation
    valid_categories = {}
    for col, le in label_encoders.items():
        if col != "Attrition":
            valid_categories[col] = list(le.classes_)

    categories_path = MODEL_OUTPUT_DIR / "valid_categories.json"
    with open(categories_path, "w") as f:
        json.dump(valid_categories, f, indent=2)
    print(f"Saved categories -> {categories_path}")

    print("\nTraining complete. All artifacts saved to backend/")
    print("   Copy attrition_model.pkl, label_encoders.pkl, feature_columns.json,")
    print("   and valid_categories.json to your backend deployment directory.\n")

    return gb_model, label_encoders, feature_columns


if __name__ == "__main__":
    train()

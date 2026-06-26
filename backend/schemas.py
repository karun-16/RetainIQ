"""
backend/schemas.py
==================
Pydantic models for all API request/response bodies.
Feature names match HR_Attrition.csv column names exactly (PascalCase).
"""

from pydantic import BaseModel, Field
from typing import Optional


class EmployeeInput(BaseModel):
    """All 31 model features (HR_Attrition.csv minus the 4 dropped columns)."""

    Age: int = Field(..., ge=18, le=65, description="Employee age (18-65)")
    BusinessTravel: str = Field(..., description="Travel frequency")
    DailyRate: int = Field(..., ge=100, le=1500)
    Department: str
    DistanceFromHome: int = Field(..., ge=1, le=29)
    Education: int = Field(..., ge=1, le=5, description="1=Below College, 5=Doctor")
    EducationField: str
    EnvironmentSatisfaction: int = Field(..., ge=1, le=4, description="1=Low, 4=Very High")
    Gender: str
    HourlyRate: int = Field(..., ge=30, le=100)
    JobInvolvement: int = Field(..., ge=1, le=4)
    JobLevel: int = Field(..., ge=1, le=5)
    JobRole: str
    JobSatisfaction: int = Field(..., ge=1, le=4, description="1=Low, 4=Very High")
    MaritalStatus: str
    MonthlyIncome: int = Field(..., ge=1000, le=20000)
    MonthlyRate: int = Field(..., ge=2000, le=27000)
    NumCompaniesWorked: int = Field(..., ge=0, le=9)
    OverTime: str = Field(..., description="'Yes' or 'No'")
    PercentSalaryHike: int = Field(..., ge=11, le=25)
    PerformanceRating: int = Field(..., ge=1, le=4)
    RelationshipSatisfaction: int = Field(..., ge=1, le=4)
    StockOptionLevel: int = Field(..., ge=0, le=3)
    TotalWorkingYears: int = Field(..., ge=0, le=40)
    TrainingTimesLastYear: int = Field(..., ge=0, le=6)
    WorkLifeBalance: int = Field(..., ge=1, le=4, description="1=Bad, 4=Best")
    YearsAtCompany: int = Field(..., ge=0, le=40)
    YearsInCurrentRole: int = Field(..., ge=0, le=18)
    YearsSinceLastPromotion: int = Field(..., ge=0, le=15)
    YearsWithCurrManager: int = Field(..., ge=0, le=17)


class RiskFactor(BaseModel):
    factor: str
    impact: str  # "high" | "medium" | "low" | "positive"


class Recommendation(BaseModel):
    action: str
    priority: str  # "urgent" | "high" | "medium" | "low"
    category: str  # "compensation" | "workload" | "career" | "wellbeing" | "retention"


class Intervention(BaseModel):
    id: str
    label: str
    description: str
    change_description: str
    original_risk: float
    new_risk: float
    delta: float


class PredictResponse(BaseModel):
    risk_score: float
    risk_level: str
    risk_factors: list[RiskFactor]
    recommendations: list[Recommendation]
    discussion_questions: list[str]
    interventions: Optional[list[Intervention]] = None


class InterventionRequest(BaseModel):
    employee_data: EmployeeInput


class InterventionResponse(BaseModel):
    original_risk: float
    original_level: str
    interventions: list[Intervention]

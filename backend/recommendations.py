"""
backend/recommendations.py
===========================
Rule-based HR recommendation engine.
No LLMs. Maps detected risk factors to specific HR actions and
generates adaptive discussion guide questions.
"""

from typing import Any


# ─── Risk Factor Detection Rules ────────────────────────────────────────────

# Dataset averages (from notebook EDA)
AVG_MONTHLY_INCOME = 6500
AVG_YEARS_AT_COMPANY = 7
AVG_TOTAL_WORKING_YEARS = 11


def detect_risk_factors(data: dict[str, Any]) -> list[dict[str, str]]:
    """
    Analyse employee feature values and return a list of active risk factors.
    Each factor has a 'factor' label and 'impact' level.
    """
    factors = []

    # 1. Overtime — strongest predictor (0.116 importance)
    if data.get("OverTime") == "Yes":
        factors.append({"factor": "Frequent Overtime", "impact": "high"})

    # 2. Monthly Income vs average
    income = data.get("MonthlyIncome", 6500)
    if income < 3000:
        factors.append({"factor": "Below Average Monthly Income", "impact": "high"})
    elif income < 4500:
        factors.append({"factor": "Moderately Below Average Income", "impact": "medium"})

    # 3. Total Working Years — experience
    twy = data.get("TotalWorkingYears", 11)
    if twy <= 3:
        factors.append({"factor": "Limited Career Experience", "impact": "medium"})

    # 4. Age — younger employees have higher attrition
    age = data.get("Age", 37)
    if age < 30:
        factors.append({"factor": "Early-Career Stage", "impact": "medium"})

    # 5. Job Satisfaction
    job_sat = data.get("JobSatisfaction", 3)
    if job_sat == 1:
        factors.append({"factor": "Very Low Job Satisfaction", "impact": "high"})
    elif job_sat == 2:
        factors.append({"factor": "Low Job Satisfaction", "impact": "medium"})

    # 6. Environment Satisfaction
    env_sat = data.get("EnvironmentSatisfaction", 3)
    if env_sat == 1:
        factors.append({"factor": "Very Low Environment Satisfaction", "impact": "high"})
    elif env_sat == 2:
        factors.append({"factor": "Low Environment Satisfaction", "impact": "medium"})

    # 7. Work-Life Balance
    wlb = data.get("WorkLifeBalance", 3)
    if wlb == 1:
        factors.append({"factor": "Poor Work-Life Balance", "impact": "high"})
    elif wlb == 2:
        factors.append({"factor": "Below Average Work-Life Balance", "impact": "medium"})

    # 8. Stock Option Level — low equity = higher flight risk
    sol = data.get("StockOptionLevel", 1)
    if sol == 0:
        factors.append({"factor": "No Stock Options", "impact": "medium"})

    # 9. Years at Company — short tenure = higher risk
    yac = data.get("YearsAtCompany", 7)
    if yac <= 2:
        factors.append({"factor": "Short Company Tenure", "impact": "medium"})

    # 10. Years with Current Manager
    ywm = data.get("YearsWithCurrManager", 4)
    if ywm <= 1:
        factors.append({"factor": "New Manager Relationship", "impact": "low"})

    # 11. Business Travel
    bt = data.get("BusinessTravel", "Travel_Rarely")
    if bt == "Travel_Frequently":
        factors.append({"factor": "Frequent Business Travel", "impact": "medium"})

    # 12. Marital Status — single employees have higher attrition
    ms = data.get("MaritalStatus", "Married")
    if ms == "Single":
        factors.append({"factor": "Single Marital Status", "impact": "low"})

    # 13. Number of Companies Worked
    ncw = data.get("NumCompaniesWorked", 2)
    if ncw >= 5:
        factors.append({"factor": "High Job Mobility History", "impact": "medium"})

    # 14. Years Since Last Promotion
    yslp = data.get("YearsSinceLastPromotion", 2)
    if yslp >= 4:
        factors.append({"factor": "Stagnant Career Progression", "impact": "medium"})

    # 15. Department / Job Role specific
    dept = data.get("Department", "")
    job_role = data.get("JobRole", "")
    if job_role in ("Sales Representative", "Sales Executive") and data.get("OverTime") == "Yes":
        factors.append({"factor": "Sales Role with High Pressure", "impact": "medium"})
    if job_role == "Laboratory Technician" and job_sat <= 2:
        factors.append({"factor": "Technical Role Dissatisfaction", "impact": "medium"})

    return factors[:6]  # Return top 6 factors


# ─── Recommendation Engine ───────────────────────────────────────────────────

RECOMMENDATION_RULES = [
    # (trigger_condition, action, priority, category)
    ("overtime",         "Reduce Overtime Hours",                   "urgent", "workload"),
    ("low_income",       "Review and Adjust Compensation Package",  "urgent", "compensation"),
    ("low_satisfaction", "Schedule Career Development Discussion",  "high",   "career"),
    ("low_wlb",          "Discuss Flexible Working Arrangements",   "high",   "wellbeing"),
    ("low_env",          "Conduct Workplace Environment Review",    "high",   "wellbeing"),
    ("short_tenure",     "Assign Onboarding Mentor",               "medium", "retention"),
    ("no_equity",        "Discuss Stock Option Eligibility",        "medium", "compensation"),
    ("no_promotion",     "Create Clear Promotion Roadmap",          "medium", "career"),
    ("high_mobility",    "Discuss Long-Term Career Path at Company","medium", "career"),
    ("travel_heavy",     "Review Business Travel Requirements",     "low",    "workload"),
]


def generate_recommendations(data: dict[str, Any], risk_factors: list[dict]) -> list[dict]:
    """Generate prioritised HR recommendations based on detected risk factors."""
    recs = []
    factor_labels = {f["factor"].lower() for f in risk_factors}

    def has(keyword: str) -> bool:
        return any(keyword in f for f in factor_labels)

    # Overtime
    if has("overtime"):
        recs.append({"action": "Reduce Overtime — Reassign 1–2 Projects", "priority": "urgent", "category": "workload"})
        recs.append({"action": "Schedule Workload Redistribution Meeting", "priority": "high", "category": "workload"})

    # Income
    if has("income") or has("salary"):
        recs.append({"action": "Conduct Compensation Benchmarking Review", "priority": "urgent", "category": "compensation"})
        recs.append({"action": "Discuss Salary Adjustment with Finance", "priority": "high", "category": "compensation"})

    # Job satisfaction
    if has("job satisfaction"):
        recs.append({"action": "Schedule Career Development Discussion", "priority": "high", "category": "career"})
        recs.append({"action": "Explore Internal Transfer Opportunities", "priority": "medium", "category": "career"})

    # Work-life balance
    if has("work-life"):
        recs.append({"action": "Introduce Flexible Hours / Remote Work Options", "priority": "high", "category": "wellbeing"})

    # Environment
    if has("environment"):
        recs.append({"action": "Conduct Team Environment Assessment", "priority": "high", "category": "wellbeing"})

    # Short tenure / new hire
    if has("tenure") or has("experience"):
        recs.append({"action": "Assign Senior Mentor for Next 3 Months", "priority": "medium", "category": "retention"})

    # No equity
    if has("stock") or has("equity"):
        recs.append({"action": "Review Stock Option Eligibility", "priority": "medium", "category": "compensation"})

    # Stagnant progression
    if has("progression") or has("promotion"):
        recs.append({"action": "Create 6-Month Promotion Roadmap", "priority": "medium", "category": "career"})

    # Business travel
    if has("travel"):
        recs.append({"action": "Review Business Travel Frequency", "priority": "low", "category": "workload"})

    # Always add a retention discussion for high-risk
    recs.append({"action": "Schedule 1-on-1 Retention Discussion", "priority": "medium", "category": "retention"})

    return recs[:5]  # Top 5 recommendations


# ─── Discussion Guide Generator ─────────────────────────────────────────────

def generate_discussion_questions(data: dict[str, Any], risk_factors: list[dict]) -> list[str]:
    """Generate adaptive retention discussion questions based on risk profile."""
    questions = []
    factor_labels = {f["factor"].lower() for f in risk_factors}

    def has(keyword: str) -> bool:
        return any(keyword in f for f in factor_labels)

    # Universal opening question
    questions.append("How are you feeling about your role and work here overall?")

    # Overtime / workload
    if has("overtime") or has("workload") or has("travel"):
        questions.append("How is your current workload? Do you feel it's manageable week to week?")
        questions.append("Has the travel or overtime been affecting your personal life or energy levels?")

    # Compensation
    if has("income") or has("salary") or has("stock"):
        questions.append("Do you feel your compensation reflects the value you bring to the team?")
        questions.append("Are there aspects of the compensation or benefits package you'd like to discuss?")

    # Career growth
    if has("satisfaction") or has("progression") or has("promotion"):
        questions.append("Where do you see yourself in the next 1–2 years? Are we supporting that path?")
        questions.append("Are there skills or responsibilities you'd like to develop that you're not currently exploring?")

    # Work environment
    if has("environment"):
        questions.append("How do you feel about the team dynamics and workplace culture?")
        questions.append("Is there anything about the work environment we could improve for you?")

    # Work-life balance
    if has("work-life"):
        questions.append("How is your work-life balance right now? What would make it better?")

    # Short tenure / onboarding
    if has("tenure") or has("experience"):
        questions.append("How has your onboarding experience been? Do you feel well-supported?")
        questions.append("Is there a mentor or peer who could help you navigate the team better?")

    # Manager relationship
    if has("manager"):
        questions.append("How is your working relationship with your manager? Do you feel heard?")

    # Closing
    questions.append("What one thing could we do differently to make this a place you want to stay long-term?")

    return questions[:6]

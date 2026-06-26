import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def run_tests():
    print("--- Testing API Endpoints ---")
    
    # 1. Test Health
    try:
        r = requests.get(f"{BASE_URL}/health")
        data = r.json()
        print("Health status:", r.status_code)
        print("Health data:", data)
        assert r.status_code == 200, "Health endpoint failed"
        assert data.get("model_loaded") == True, "Model not loaded"
    except Exception as e:
        print(f"Health check failed: {e}")
        sys.exit(1)

    # Base profile (Medium/High Risk)
    profile_1 = {
        "Age": 30,
        "DailyRate": 500,
        "HourlyRate": 50,
        "DistanceFromHome": 25,
        "JobRole": "Sales Executive",
        "MonthlyIncome": 3000,
        "MonthlyRate": 25000,
        "NumCompaniesWorked": 5,
        "PercentSalaryHike": 11,
        "TotalWorkingYears": 8,
        "YearsAtCompany": 2,
        "YearsInCurrentRole": 2,
        "YearsSinceLastPromotion": 2,
        "YearsWithCurrManager": 2,
        "EnvironmentSatisfaction": 1,
        "JobInvolvement": 2,
        "JobLevel": 1,
        "JobSatisfaction": 1,
        "PerformanceRating": 2,
        "RelationshipSatisfaction": 2,
        "WorkLifeBalance": 1,
        "BusinessTravel": "Travel_Frequently",
        "Department": "Sales",
        "Education": 2,
        "EducationField": "Marketing",
        "Gender": "Male",
        "MaritalStatus": "Single",
        "OverTime": "Yes",
        "StockOptionLevel": 0,
        "TrainingTimesLastYear": 2
    }

    # Low Risk profile
    profile_2 = {
        "Age": 45,
        "DailyRate": 1000,
        "HourlyRate": 90,
        "DistanceFromHome": 2,
        "JobRole": "Research Director",
        "MonthlyIncome": 15000,
        "MonthlyRate": 20000,
        "NumCompaniesWorked": 1,
        "PercentSalaryHike": 20,
        "TotalWorkingYears": 20,
        "YearsAtCompany": 15,
        "YearsInCurrentRole": 10,
        "YearsSinceLastPromotion": 1,
        "YearsWithCurrManager": 10,
        "EnvironmentSatisfaction": 4,
        "JobInvolvement": 4,
        "JobLevel": 4,
        "JobSatisfaction": 4,
        "PerformanceRating": 4,
        "RelationshipSatisfaction": 4,
        "WorkLifeBalance": 4,
        "BusinessTravel": "Non-Travel",
        "Department": "Research & Development",
        "Education": 4,
        "EducationField": "Life Sciences",
        "Gender": "Female",
        "MaritalStatus": "Married",
        "OverTime": "No",
        "StockOptionLevel": 3,
        "TrainingTimesLastYear": 5
    }

    # 2. Test Predict
    print("\nTesting /predict endpoint (High Risk)...")
    r1 = requests.post(f"{BASE_URL}/predict", json=profile_1)
    print("Status:", r1.status_code)
    if r1.status_code == 500:
        print("500 Error:", r1.text)
        sys.exit(1)
    if r1.status_code == 422:
        print("Validation error:", r1.json())
        sys.exit(1)
    res1 = r1.json()
    print("Risk Score:", res1["risk_score"])
    print("Risk Level:", res1["risk_level"])
    print("Risk Factors:", [f["factor"] for f in res1["risk_factors"]])
    
    print("\nTesting /predict endpoint (Low Risk)...")
    r2 = requests.post(f"{BASE_URL}/predict", json=profile_2)
    print("Status:", r2.status_code)
    res2 = r2.json()
    print("Risk Score:", res2["risk_score"])
    print("Risk Level:", res2["risk_level"])
    
    assert res1["risk_score"] > res2["risk_score"], "High risk profile scored lower than low risk profile!"

    # 3. Test Invalid Data
    print("\nTesting validation with invalid categories...")
    invalid_profile = profile_1.copy()
    invalid_profile["JobRole"] = "Space Ninja" # Invalid category
    r_inv = requests.post(f"{BASE_URL}/predict", json=invalid_profile)
    print("Status code with invalid data:", r_inv.status_code)
    assert r_inv.status_code == 422, "API did not return 422 for invalid category"

    # 4. Test What-if
    print("\nTesting /whatif endpoint...")
    sim_profile = profile_1.copy()
    sim_profile["MonthlyIncome"] = sim_profile["MonthlyIncome"] * 1.5 # Boost salary
    sim_profile["OverTime"] = "No" # Stop overtime
    r_whatif = requests.post(f"{BASE_URL}/whatif", json=sim_profile)
    print("Status:", r_whatif.status_code)
    res_whatif = r_whatif.json()
    print("Simulated Risk Score:", res_whatif["risk_score"])

    # 5. Test Interventions
    print("\nTesting /interventions endpoint...")
    r_int = requests.post(f"{BASE_URL}/interventions", json={"employee_data": profile_1})
    print("Status:", r_int.status_code)
    res_int = r_int.json()
    print(f"Original risk: {res_int['original_risk']} -> Interventions returned: {len(res_int['interventions'])}")
    
    print("\nAll backend API tests passed successfully.")

if __name__ == "__main__":
    run_tests()

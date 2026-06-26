'use client';

import { useState, useEffect } from 'react';
import { runPrediction, fetchCategories } from '@/lib/api';
import { PredictRequest, PredictResponse } from '@/lib/types';
import RiskBadge from '@/components/RiskBadge';
import RiskMeter from '@/components/RiskMeter';
import { LabelWithTooltip } from '@/components/Tooltip';
import { AlertTriangle, User, Briefcase, DollarSign, Clock, CheckCircle2, Activity } from 'lucide-react';

export default function PredictPage() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);

  const [formData, setFormData] = useState<PredictRequest>({
    Age: 35,
    BusinessTravel: 'Travel_Rarely',
    DailyRate: 800,
    Department: 'Research & Development',
    DistanceFromHome: 10,
    Education: 3,
    EducationField: 'Life Sciences',
    EnvironmentSatisfaction: 3,
    Gender: 'Male',
    HourlyRate: 65,
    JobInvolvement: 3,
    JobLevel: 2,
    JobRole: 'Research Scientist',
    JobSatisfaction: 3,
    MaritalStatus: 'Married',
    MonthlyIncome: 5000,
    MonthlyRate: 15000,
    NumCompaniesWorked: 2,
    OverTime: 'No',
    PercentSalaryHike: 14,
    PerformanceRating: 3,
    RelationshipSatisfaction: 3,
    StockOptionLevel: 1,
    TotalWorkingYears: 10,
    TrainingTimesLastYear: 3,
    WorkLifeBalance: 3,
    YearsAtCompany: 5,
    YearsInCurrentRole: 3,
    YearsSinceLastPromotion: 1,
    YearsWithCurrManager: 2,
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await fetchCategories();
        if (data.categories) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }
    loadCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;
    
    if (type === 'number') {
      parsedValue = value === '' ? 0 : Number(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await runPrediction(formData);
      setResult(response);
    } catch (err: any) {
      setError(err.message || "Failed to run prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attrition Prediction</h1>
        <p className="text-muted-foreground mt-1">Run hypothetical ML predictions for potential hires or proposed role changes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6 bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm">
            
            {/* Demographics */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center border-b border-border pb-2">
                <User className="w-5 h-5 mr-2 text-primary" /> Demographics & Profile
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <LabelWithTooltip label="Age" tooltip="Employee's age in years." />
                  <input type="number" name="Age" value={formData.Age} onChange={handleChange} className="input-field" min="18" max="100" required />
                </div>
                <div>
                  <LabelWithTooltip label="Gender" tooltip="Employee's gender identity." />
                  <select name="Gender" value={formData.Gender} onChange={handleChange} className="input-field">
                    {categories?.Gender?.map((c: string) => <option key={c} value={c}>{c}</option>) || <>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </>}
                  </select>
                </div>
                <div>
                  <LabelWithTooltip label="Marital Status" tooltip="Employee's current marital status." />
                  <select name="MaritalStatus" value={formData.MaritalStatus} onChange={handleChange} className="input-field">
                    {categories?.MaritalStatus?.map((c: string) => <option key={c} value={c}>{c}</option>) || <>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                    </>}
                  </select>
                </div>
                <div>
                  <LabelWithTooltip label="Distance From Home (miles)" tooltip="Distance between the employee's home and workplace in miles." />
                  <input type="number" name="DistanceFromHome" value={formData.DistanceFromHome} onChange={handleChange} className="input-field" min="1" max="100" required />
                </div>
                <div>
                  <LabelWithTooltip label="Education Level (1-5)" tooltip="1: Below College, 2: College, 3: Bachelor, 4: Master, 5: Doctor" />
                  <input type="number" name="Education" value={formData.Education} onChange={handleChange} className="input-field" min="1" max="5" required />
                </div>
                <div>
                  <LabelWithTooltip label="Education Field" tooltip="Employee's field of study or major." />
                  <select name="EducationField" value={formData.EducationField} onChange={handleChange} className="input-field">
                    {categories?.EducationField?.map((c: string) => <option key={c} value={c}>{c}</option>) || <>
                      <option value="Life Sciences">Life Sciences</option>
                      <option value="Medical">Medical</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Technical Degree">Technical Degree</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Other">Other</option>
                    </>}
                  </select>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center border-b border-border pb-2 mt-8">
                <Briefcase className="w-5 h-5 mr-2 text-primary" /> Job Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <LabelWithTooltip label="Department" tooltip="The department the employee belongs to." />
                  <select name="Department" value={formData.Department} onChange={handleChange} className="input-field">
                    {categories?.Department?.map((c: string) => <option key={c} value={c}>{c}</option>) || <>
                      <option value="Research & Development">Research & Development</option>
                      <option value="Sales">Sales</option>
                      <option value="Human Resources">Human Resources</option>
                    </>}
                  </select>
                </div>
                <div>
                  <LabelWithTooltip label="Job Role" tooltip="Specific role or job title of the employee." />
                  <select name="JobRole" value={formData.JobRole} onChange={handleChange} className="input-field">
                    {categories?.JobRole?.map((c: string) => <option key={c} value={c}>{c}</option>) || <>
                      <option value="Sales Executive">Sales Executive</option>
                      <option value="Research Scientist">Research Scientist</option>
                      <option value="Laboratory Technician">Laboratory Technician</option>
                      <option value="Manufacturing Director">Manufacturing Director</option>
                      <option value="Healthcare Representative">Healthcare Representative</option>
                      <option value="Manager">Manager</option>
                      <option value="Sales Representative">Sales Representative</option>
                      <option value="Research Director">Research Director</option>
                      <option value="Human Resources">Human Resources</option>
                    </>}
                  </select>
                </div>
                <div>
                  <LabelWithTooltip label="Job Level (1-5)" tooltip="Seniority level from 1 (Entry) to 5 (Executive)." />
                  <input type="number" name="JobLevel" value={formData.JobLevel} onChange={handleChange} className="input-field" min="1" max="5" required />
                </div>
                <div>
                  <LabelWithTooltip label="Job Involvement (1-4)" tooltip="Level of job involvement: 1: Low, 2: Medium, 3: High, 4: Very High." />
                  <input type="number" name="JobInvolvement" value={formData.JobInvolvement} onChange={handleChange} className="input-field" min="1" max="4" required />
                </div>
                <div>
                  <LabelWithTooltip label="Job Satisfaction (1-4)" tooltip="Level of job satisfaction: 1: Low, 2: Medium, 3: High, 4: Very High." />
                  <input type="number" name="JobSatisfaction" value={formData.JobSatisfaction} onChange={handleChange} className="input-field" min="1" max="4" required />
                </div>
                <div>
                  <LabelWithTooltip label="Environment Sat. (1-4)" tooltip="Satisfaction with the work environment: 1: Low, 2: Medium, 3: High, 4: Very High." />
                  <input type="number" name="EnvironmentSatisfaction" value={formData.EnvironmentSatisfaction} onChange={handleChange} className="input-field" min="1" max="4" required />
                </div>
              </div>
            </div>

            {/* Compensation */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center border-b border-border pb-2 mt-8">
                <DollarSign className="w-5 h-5 mr-2 text-primary" /> Compensation
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <LabelWithTooltip label="Monthly Income (?)" tooltip="Employee's monthly salary in INR." />
                  <input type="number" name="MonthlyIncome" value={formData.MonthlyIncome} onChange={handleChange} className="input-field" min="1000" max="25000" required />
                </div>
                <div>
                  <LabelWithTooltip label="Monthly Rate" tooltip="Monthly billing or compensation rate." />
                  <input type="number" name="MonthlyRate" value={formData.MonthlyRate} onChange={handleChange} className="input-field" min="2000" max="30000" required />
                </div>
                <div>
                  <LabelWithTooltip label="Daily Rate" tooltip="Daily billing or compensation rate." />
                  <input type="number" name="DailyRate" value={formData.DailyRate} onChange={handleChange} className="input-field" min="100" max="2000" required />
                </div>
                <div>
                  <LabelWithTooltip label="Hourly Rate" tooltip="Hourly billing or compensation rate." />
                  <input type="number" name="HourlyRate" value={formData.HourlyRate} onChange={handleChange} className="input-field" min="30" max="150" required />
                </div>
                <div>
                  <LabelWithTooltip label="Salary Hike (%)" tooltip="Percentage increase in salary from the previous year." />
                  <input type="number" name="PercentSalaryHike" value={formData.PercentSalaryHike} onChange={handleChange} className="input-field" min="10" max="30" required />
                </div>
                <div>
                  <LabelWithTooltip label="Stock Option (0-3)" tooltip="Level of stock options granted: 0: None to 3: High." />
                  <input type="number" name="StockOptionLevel" value={formData.StockOptionLevel} onChange={handleChange} className="input-field" min="0" max="3" required />
                </div>
              </div>
            </div>

            {/* Career History */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center border-b border-border pb-2 mt-8">
                <Activity className="w-5 h-5 mr-2 text-primary" /> Career History
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <LabelWithTooltip label="Total Working Years" tooltip="Total years of professional experience across all companies." />
                  <input type="number" name="TotalWorkingYears" value={formData.TotalWorkingYears} onChange={handleChange} className="input-field" min="0" max="40" required />
                </div>
                <div>
                  <LabelWithTooltip label="Companies Worked" tooltip="Number of previous companies the employee has worked at." />
                  <input type="number" name="NumCompaniesWorked" value={formData.NumCompaniesWorked} onChange={handleChange} className="input-field" min="0" max="10" required />
                </div>
                <div>
                  <LabelWithTooltip label="Years At Company" tooltip="Total years the employee has spent at the current company." />
                  <input type="number" name="YearsAtCompany" value={formData.YearsAtCompany} onChange={handleChange} className="input-field" min="0" max="40" required />
                </div>
                <div>
                  <LabelWithTooltip label="Years In Current Role" tooltip="Total years the employee has spent in their current role." />
                  <input type="number" name="YearsInCurrentRole" value={formData.YearsInCurrentRole} onChange={handleChange} className="input-field" min="0" max="20" required />
                </div>
                <div>
                  <LabelWithTooltip label="Years Since Promotion" tooltip="Number of years since the employee's last promotion." />
                  <input type="number" name="YearsSinceLastPromotion" value={formData.YearsSinceLastPromotion} onChange={handleChange} className="input-field" min="0" max="15" required />
                </div>
                <div>
                  <LabelWithTooltip label="Years With Manager" tooltip="Number of years the employee has been working with their current manager." />
                  <input type="number" name="YearsWithCurrManager" value={formData.YearsWithCurrManager} onChange={handleChange} className="input-field" min="0" max="20" required />
                </div>
              </div>
            </div>

            {/* Work/Life */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center border-b border-border pb-2 mt-8">
                <Clock className="w-5 h-5 mr-2 text-primary" /> Work & Life Balance
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <LabelWithTooltip label="OverTime" tooltip="Indicates if the employee regularly works overtime." />
                  <select name="OverTime" value={formData.OverTime} onChange={handleChange} className="input-field">
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <LabelWithTooltip label="Business Travel" tooltip="Frequency of business travel required for the role." />
                  <select name="BusinessTravel" value={formData.BusinessTravel} onChange={handleChange} className="input-field">
                    {categories?.BusinessTravel?.map((c: string) => <option key={c} value={c}>{c.replace('_', ' ')}</option>) || <>
                      <option value="Non-Travel">Non-Travel</option>
                      <option value="Travel_Rarely">Travel Rarely</option>
                      <option value="Travel_Frequently">Travel Frequently</option>
                    </>}
                  </select>
                </div>
                <div>
                  <LabelWithTooltip label="Work Life Balance (1-4)" tooltip="Self-reported work-life balance: 1: Bad, 2: Good, 3: Better, 4: Best." />
                  <input type="number" name="WorkLifeBalance" value={formData.WorkLifeBalance} onChange={handleChange} className="input-field" min="1" max="4" required />
                </div>
                <div>
                  <LabelWithTooltip label="Performance Rating (3-4)" tooltip="Latest performance rating: 3: Excellent, 4: Outstanding." />
                  <input type="number" name="PerformanceRating" value={formData.PerformanceRating} onChange={handleChange} className="input-field" min="3" max="4" required />
                </div>
                <div>
                  <LabelWithTooltip label="Relationship Sat. (1-4)" tooltip="Satisfaction with workplace relationships: 1: Low, 2: Medium, 3: High, 4: Very High." />
                  <input type="number" name="RelationshipSatisfaction" value={formData.RelationshipSatisfaction} onChange={handleChange} className="input-field" min="1" max="4" required />
                </div>
                <div>
                  <LabelWithTooltip label="Training Last Year" tooltip="Number of training programs attended in the last year." />
                  <input type="number" name="TrainingTimesLastYear" value={formData.TrainingTimesLastYear} onChange={handleChange} className="input-field" min="0" max="6" required />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border flex items-center justify-end">
              <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto px-8">
                {loading ? 'Analyzing Data...' : 'Generate Prediction'}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 flex items-start">
              <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

        </div>

        {/* Results Column */}
        <div className="space-y-6">
          <div className="card p-6 min-h-[400px] flex flex-col sticky top-6 bg-card border-border">
            <h2 className="text-lg font-bold text-foreground mb-6">Prediction Results</h2>
            
            {!result && !loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 bg-muted/10 rounded-xl border border-dashed border-border mt-4">
                <Activity className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-foreground font-bold text-lg">No active prediction</p>
                <p className="text-sm text-muted-foreground mt-2">Fill out the form and generate a prediction to view risk analysis.</p>
              </div>
            ) : loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground font-medium animate-pulse">Running ML Model...</p>
              </div>
            ) : result ? (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-muted/30 rounded-xl p-4 border border-border text-center">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overall Risk</span>
                    <RiskBadge level={result.risk_level} />
                  </div>
                  <RiskMeter score={result.risk_score} level={result.risk_level} />
                </div>

                {result.risk_factors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">Key Risk Factors</h3>
                    <div className="space-y-2">
                      {result.risk_factors.map((rf, idx) => (
                        <div key={idx} className="flex items-center text-sm bg-card border border-border p-2 rounded-lg">
                          <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                            rf.impact === 'high' ? 'bg-destructive' :
                            rf.impact === 'medium' ? 'bg-warning-DEFAULT' :
                            'bg-success-DEFAULT'
                          }`} />
                          <span className="font-medium text-foreground leading-tight">{rf.factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">Recommendations</h3>
                    <div className="space-y-3">
                      {result.recommendations.slice(0, 4).map((rec, idx) => (
                        <div key={idx} className="flex items-start">
                          <CheckCircle2 className="w-4 h-4 text-success-DEFAULT mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground leading-tight">{rec.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
        
      </div>
    </div>
  );
}

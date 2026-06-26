'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { runWhatIf } from '@/lib/api';
import { Employee, PredictRequest } from '@/lib/types';
import RiskMeter from '@/components/RiskMeter';
import { SlidersHorizontal, ArrowRight, User, Briefcase, Activity, AlertTriangle } from 'lucide-react';

export default function WhatIfSimulator() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Baseline refers to the original employee data
  const [baselineData, setBaselineData] = useState<PredictRequest | null>(null);
  const [baselineRisk, setBaselineRisk] = useState<{ score: number, level: string } | null>(null);

  // Simulated refers to the modified data
  const [simulatedData, setSimulatedData] = useState<PredictRequest | null>(null);
  const [simulatedRisk, setSimulatedRisk] = useState<{ score: number, level: string, factors: any[] } | null>(null);
  
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectEmployee = async (id: string) => {
    setSelectedId(id);
    setError(null);
    setSimulatedRisk(null);
    setBaselineRisk(null);
    
    // Fetch full employee with department joined
    const { data } = await supabase
      .from('employees')
      .select('*, departments(name)')
      .eq('id', id)
      .single();
      
    if (data) {
      const emp = data as any;
      const inputData: PredictRequest = {
        Age: emp.age || 35,
        BusinessTravel: emp.business_travel || 'Travel_Rarely',
        DailyRate: emp.daily_rate || 800,
        Department: Array.isArray(emp.departments) ? emp.departments[0]?.name : (emp.departments?.name || 'Research & Development'),
        DistanceFromHome: emp.distance_from_home || 10,
        Education: emp.education || 3,
        EducationField: emp.education_field || 'Other',
        EnvironmentSatisfaction: emp.environment_satisfaction || 3,
        Gender: emp.gender || 'Male',
        HourlyRate: emp.hourly_rate || 65,
        JobInvolvement: emp.job_involvement || 3,
        JobLevel: emp.job_level || 2,
        JobRole: emp.job_role || 'Manager',
        JobSatisfaction: emp.job_satisfaction || 3,
        MaritalStatus: emp.marital_status || 'Single',
        MonthlyIncome: emp.monthly_income || 5000,
        MonthlyRate: emp.monthly_rate || 15000,
        NumCompaniesWorked: emp.num_companies_worked || 1,
        OverTime: emp.over_time || 'No',
        PercentSalaryHike: emp.percent_salary_hike || 14,
        PerformanceRating: emp.performance_rating || 3,
        RelationshipSatisfaction: emp.relationship_satisfaction || 3,
        StockOptionLevel: emp.stock_option_level || 0,
        TotalWorkingYears: emp.total_working_years || 5,
        TrainingTimesLastYear: emp.training_times_last_year || 2,
        WorkLifeBalance: emp.work_life_balance || 3,
        YearsAtCompany: emp.years_at_company || 2,
        YearsInCurrentRole: emp.years_in_current_role || 2,
        YearsSinceLastPromotion: emp.years_since_last_promotion || 1,
        YearsWithCurrManager: emp.years_with_curr_manager || 2,
      };
      
      setBaselineData(inputData);
      setSimulatedData({ ...inputData });
      
      // We can use the cached risk from the DB for baseline, or run a fresh prediction.
      // We'll run a fresh prediction to be safe.
      try {
        const result = await runWhatIf(inputData);
        setBaselineRisk({ score: result.risk_score, level: result.risk_level });
        setSimulatedRisk({ score: result.risk_score, level: result.risk_level, factors: result.risk_factors });
      } catch (err: any) {
        setError("Failed to load baseline risk.");
      }
    }
  };

  useEffect(() => {
    async function loadEmployees() {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, job_role, department_id, risk_level, risk_score, performance_rating, departments(name)')
        .order('risk_score', { ascending: false });
        
      if (error) {
        console.error("Failed to load employees:", error);
      }

      if (data) {
        setEmployees(data as any[]);
        if (data.length > 0) {
          handleSelectEmployee(data[0].id);
        }
      }
      setLoading(false);
    }
    loadEmployees();
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;
    if (type === 'range' || type === 'number') {
      parsedValue = Number(value);
    }

    setSimulatedData(prev => {
      if (!prev) return prev;
      return { ...prev, [name]: parsedValue };
    });
  };

  // Debounced simulation effect
  useEffect(() => {
    if (!simulatedData || !baselineData) return;
    
    // Check if anything changed
    const isChanged = Object.keys(simulatedData).some(
      (key) => (simulatedData as any)[key] !== (baselineData as any)[key]
    );

    if (!isChanged) return;

    const timeoutId = setTimeout(async () => {
      setSimulating(true);
      try {
        const result = await runWhatIf(simulatedData);
        setSimulatedRisk({
          score: result.risk_score,
          level: result.risk_level,
          factors: result.risk_factors
        });
      } catch (err: any) {
        console.error(err);
      } finally {
        setSimulating(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [simulatedData, baselineData]);

  const resetSimulation = () => {
    if (baselineData && baselineRisk) {
      setSimulatedData({ ...baselineData });
      setSimulatedRisk({ score: baselineRisk.score, level: baselineRisk.level, factors: [] });
    }
  };



  const selectedEmpDetails = employees.find(e => e.id === selectedId);
  const riskDelta = simulatedRisk && baselineRisk ? simulatedRisk.score - baselineRisk.score : 0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">What-If Simulator</h1>
          <p className="text-muted-foreground mt-1">Adjust employee variables in real-time to see the predicted impact on retention risk.</p>
        </div>
        
        <div className="w-full sm:w-64 relative">
          {loading ? (
            <div className="input-field flex items-center bg-muted/50 text-muted-foreground pointer-events-none">Loading employees...</div>
          ) : employees.length === 0 ? (
            <div className="input-field flex items-center bg-muted/50 text-muted-foreground pointer-events-none">No employees found</div>
          ) : (
            <select 
              className="input-field appearance-none pr-8" 
              value={selectedId} 
              onChange={(e) => handleSelectEmployee(e.target.value)}
              disabled={simulating}
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.departments?.name ? `${emp.departments.name} / ` : ''}{emp.job_role})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive-light text-destructive rounded-xl border border-destructive/20 flex items-start">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading && (
        <div className="animate-pulse space-y-6">
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      )}

      {!loading && simulatedData && baselineData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 border border-border bg-card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-foreground flex items-center">
                  <SlidersHorizontal className="w-5 h-5 mr-2 text-primary" /> Interactive Controls
                </h2>
                <button onClick={resetSimulation} className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors">
                  Reset to Baseline
                </button>
              </div>

              <div className="space-y-8">
                {/* Salary Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Compensation & Workload</h3>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm font-medium text-muted-foreground">Monthly Income</label>
                      <span className="text-sm font-bold text-primary">${simulatedData.MonthlyIncome}</span>
                    </div>
                    <input 
                      type="range" name="MonthlyIncome" 
                      min={baselineData.MonthlyIncome * 0.5} 
                      max={baselineData.MonthlyIncome * 1.5} 
                      step="100"
                      value={simulatedData.MonthlyIncome} 
                      onChange={handleSliderChange} 
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground/70">
                      <span>${Math.round(baselineData.MonthlyIncome * 0.5)}</span>
                      <span>Baseline: ${baselineData.MonthlyIncome}</span>
                      <span>${Math.round(baselineData.MonthlyIncome * 1.5)}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="flex justify-between mb-1">
                      <label className="text-sm font-medium text-muted-foreground">Overtime</label>
                      <span className="text-sm font-bold text-primary">{simulatedData.OverTime}</span>
                    </div>
                    <select name="OverTime" value={simulatedData.OverTime} onChange={handleSliderChange} className="input-field">
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {/* Environment Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Satisfaction & Environment</h3>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm font-medium text-muted-foreground">Work-Life Balance (1-4)</label>
                      <span className="text-sm font-bold text-primary">{simulatedData.WorkLifeBalance}</span>
                    </div>
                    <input 
                      type="range" name="WorkLifeBalance" 
                      min="1" max="4" step="1"
                      value={simulatedData.WorkLifeBalance} 
                      onChange={handleSliderChange} 
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="pt-4">
                    <div className="flex justify-between mb-1">
                      <label className="text-sm font-medium text-muted-foreground">Environment Satisfaction (1-4)</label>
                      <span className="text-sm font-bold text-primary">{simulatedData.EnvironmentSatisfaction}</span>
                    </div>
                    <input 
                      type="range" name="EnvironmentSatisfaction" 
                      min="1" max="4" step="1"
                      value={simulatedData.EnvironmentSatisfaction} 
                      onChange={handleSliderChange} 
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>

                {/* Career Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Career History</h3>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm font-medium text-muted-foreground">Years Since Last Promotion</label>
                      <span className="text-sm font-bold text-primary">{simulatedData.YearsSinceLastPromotion}</span>
                    </div>
                    <input 
                      type="range" name="YearsSinceLastPromotion" 
                      min="0" max="15" step="1"
                      value={simulatedData.YearsSinceLastPromotion} 
                      onChange={handleSliderChange} 
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="space-y-6">
            
            {/* Impact Card */}
            <div className="card p-6 bg-card sticky top-6 border-border">
              <h2 className="text-lg font-bold text-foreground mb-6 flex items-center justify-between">
                Live Impact
                {simulating && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
              </h2>

              {baselineRisk && simulatedRisk && (
                <div className="space-y-6">
                  
                  <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border shadow-sm">
                    <div className="text-center">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Baseline</p>
                      <p className="text-2xl font-bold text-foreground">{baselineRisk.score.toFixed(1)}%</p>
                    </div>
                    
                    <ArrowRight className="w-5 h-5 text-muted-foreground/50" />
                    
                    <div className="text-center">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Simulated</p>
                      <p className={`text-2xl font-bold ${riskDelta < 0 ? 'text-success-DEFAULT' : riskDelta > 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {simulatedRisk.score.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-2">Simulated Risk Meter</p>
                    <RiskMeter score={simulatedRisk.score} level={simulatedRisk.level as any} />
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg border border-border flex items-start gap-3">
                    <Activity className={`w-5 h-5 mt-0.5 ${riskDelta < 0 ? 'text-success-DEFAULT' : riskDelta > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="text-sm font-bold text-foreground">Business Impact</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {riskDelta < 0 
                          ? `These changes would decrease attrition risk by ${Math.abs(riskDelta).toFixed(1)} points. Good intervention strategy.` 
                          : riskDelta > 0 
                          ? `Warning: These changes would increase attrition risk by ${riskDelta.toFixed(1)} points.` 
                          : `No significant change in risk detected.`}
                      </p>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
          
        </div>
      )}
    </div>
  );
}

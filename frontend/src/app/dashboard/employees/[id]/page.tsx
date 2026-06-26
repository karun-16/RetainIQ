'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { runInterventions } from '@/lib/api';
import { Employee, Prediction, InterventionResponse, Followup, Meeting } from '@/lib/types';
import RiskBadge from '@/components/RiskBadge';
import RiskMeter from '@/components/RiskMeter';
import { IndividualRiskTrendChart, RiskTrendData } from '@/components/Charts';
import { 
  User, Briefcase, MapPin, DollarSign, Clock, 
  TrendingDown, TrendingUp, AlertTriangle, ArrowRight,
  CheckCircle2, Plus, Calendar, Edit2, X, Save,
  Activity, Video, Users, Award, Shield, History
} from 'lucide-react';

export default function EmployeeProfile() {
  const params = useParams();
  const id = params.id as string;
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [simulator, setSimulator] = useState<InterventionResponse | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [loading, setLoading] = useState(true);

  const isValidLink = (link: string | undefined | null) => {
    if (!link) return false;
    try {
      const url = new URL(link);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    monthly_income: number;
    job_satisfaction: number;
    environment_satisfaction: number;
    work_life_balance: number;
    over_time: string;
    years_at_company: number;
    years_in_current_role: number;
    years_since_last_promotion: number;
    relationship_satisfaction: number;
    stock_option_level: number;
    training_times_last_year: number;
  } | null>(null);

  useEffect(() => {
    async function fetchEmployeeData() {
      const { data: empData } = await supabase
        .from('employees')
        .select('*, departments(name)')
        .eq('id', id)
        .single();
        
      if (empData) setEmployee(empData as any);

      const { data: predData } = await supabase
        .from('predictions')
        .select('*')
        .eq('employee_id', id)
        .order('created_at', { ascending: true });
        
      if (predData) setPredictions(predData as any[]);

      const { data: followupData } = await supabase
        .from('followups')
        .select('*')
        .eq('employee_id', id)
        .order('created_at', { ascending: false });

      if (followupData) setFollowups(followupData as any[]);

      const { data: meetingData } = await supabase
        .from('meetings')
        .select('*')
        .eq('employee_id', id)
        .order('scheduled_at', { ascending: false });

      if (meetingData) setMeetings(meetingData as any[]);

      setLoading(false);
    }

    if (id) fetchEmployeeData();
  }, [id]);

  const handleOpenEdit = () => {
    if (!employee) return;
    setEditForm({
      monthly_income: employee.monthly_income,
      job_satisfaction: employee.job_satisfaction,
      environment_satisfaction: employee.environment_satisfaction,
      work_life_balance: employee.work_life_balance,
      over_time: employee.over_time,
      years_at_company: employee.years_at_company,
      years_in_current_role: employee.years_in_current_role,
      years_since_last_promotion: employee.years_since_last_promotion,
      relationship_satisfaction: employee.relationship_satisfaction,
      stock_option_level: employee.stock_option_level,
      training_times_last_year: employee.training_times_last_year,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !editForm) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('employees')
        .update({ ...editForm, updated_at: new Date().toISOString() })
        .eq('id', employee.id);
      if (error) throw error;
      const { data: refreshed } = await supabase
        .from('employees')
        .select('*, departments(name)')
        .eq('id', employee.id)
        .single();
      if (refreshed) setEmployee(refreshed as any);
      setEditModalOpen(false);
      setSaveToast('Employee profile updated successfully');
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err: any) {
      setSaveToast('Error: ' + (err.message || 'Failed to save'));
      setTimeout(() => setSaveToast(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleSimulate = async () => {
    if (!employee) return;
    setSimulating(true);
    try {
      const inputData = {
        Age: employee.age,
        BusinessTravel: employee.business_travel,
        DailyRate: employee.daily_rate,
        Department: employee.departments?.name || 'Research & Development',
        DistanceFromHome: employee.distance_from_home,
        Education: employee.education,
        EducationField: employee.education_field,
        EnvironmentSatisfaction: employee.environment_satisfaction,
        Gender: employee.gender,
        HourlyRate: employee.hourly_rate,
        JobInvolvement: employee.job_involvement,
        JobLevel: employee.job_level,
        JobRole: employee.job_role,
        JobSatisfaction: employee.job_satisfaction,
        MaritalStatus: employee.marital_status,
        MonthlyIncome: employee.monthly_income,
        MonthlyRate: employee.monthly_rate,
        NumCompaniesWorked: employee.num_companies_worked,
        OverTime: employee.over_time,
        PercentSalaryHike: employee.percent_salary_hike,
        PerformanceRating: employee.performance_rating,
        RelationshipSatisfaction: employee.relationship_satisfaction,
        StockOptionLevel: employee.stock_option_level,
        TotalWorkingYears: employee.total_working_years,
        TrainingTimesLastYear: employee.training_times_last_year,
        WorkLifeBalance: employee.work_life_balance,
        YearsAtCompany: employee.years_at_company,
        YearsInCurrentRole: employee.years_in_current_role,
        YearsSinceLastPromotion: employee.years_since_last_promotion,
        YearsWithCurrManager: employee.years_with_curr_manager,
      };

      const result = await runInterventions(inputData as any);
      setSimulator(result);
    } catch (error) {
      console.error("Simulation failed:", error);
    } finally {
      setSimulating(false);
    }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2);

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-[200px] bg-muted rounded-xl w-full"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-muted rounded-xl"></div>
          <div className="h-96 bg-muted rounded-xl"></div>
        </div>
        <div className="h-[600px] bg-muted rounded-xl"></div>
      </div>
    </div>;
  }

  if (!employee) return <div>Employee not found</div>;

  const latestPrediction = predictions.length > 0 ? predictions[predictions.length - 1] : null;
  const trendData: RiskTrendData[] = predictions.map(p => ({
    date: new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    risk: Number(p.risk_score)
  }));

  const formatCurrency = (num: number) => `₹${num.toLocaleString('en-IN')}`;

  const parseMeetingNotes = (notes: string | null) => {
    if (!notes) return { description: '' };
    try { return JSON.parse(notes); } catch { return { description: notes }; }
  };

  return (
    <div className="space-y-6 pb-12 relative">
      {saveToast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border flex items-center animate-fade-in ${
          saveToast.startsWith('Error') 
            ? 'bg-destructive-light border-destructive/20 text-destructive' 
            : 'bg-success-light border-success/20 text-success'
        }`}>
          {saveToast.startsWith('Error') ? <AlertTriangle className="w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
          <span className="font-medium text-sm">{saveToast}</span>
        </div>
      )}

      {/* Header Profile Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-sm">
        <div className="h-24 bg-gradient-to-r from-primary/80 to-indigo-500/80"></div>
        <div className="px-6 sm:px-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-12 relative">
            <div className="h-24 w-24 rounded-2xl bg-background flex items-center justify-center p-1.5 shadow-md">
              <div className="h-full w-full bg-primary text-primary-foreground rounded-xl flex items-center justify-center text-3xl font-extrabold tracking-tight">
                {getInitials(employee.name)}
              </div>
            </div>
            
            <div className="flex-1 pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{employee.name}</h1>
                  <p className="text-muted-foreground font-medium flex items-center mt-1.5">
                    <Briefcase className="w-4 h-4 mr-1.5" />
                    {employee.job_role} <span className="mx-2">•</span> {employee.departments?.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <a href={`mailto:${employee.name.replace(' ', '.').toLowerCase()}@example.com`} className="btn-secondary h-10 px-4">Message</a>
                  <button onClick={handleOpenEdit} className="btn-primary h-10 px-4 shadow-sm flex items-center">
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 border-t border-border pt-6">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Current Risk</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-foreground">{employee.risk_score ? employee.risk_score.toFixed(1) : 'N/A'}%</span>
                <RiskBadge level={employee.risk_level} />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Tenure</p>
              <p className="text-lg font-bold text-foreground">{employee.years_at_company} <span className="text-muted-foreground text-sm font-medium">Years</span></p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Base Pay</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(employee.monthly_income)}<span className="text-muted-foreground text-sm font-medium">/mo</span></p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Performance</p>
              <div className="flex items-center">
                <span className="text-lg font-bold text-foreground">{employee.performance_rating}</span>
                <span className="text-muted-foreground text-sm font-medium ml-1">/ 4 Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Main Column: Analytics & Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Risk Factors */}
          {latestPrediction && latestPrediction.risk_factors && (
            <div className="card p-6 border-l-4 border-l-warning">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <h2 className="text-xl font-bold text-foreground">Top Risk Factors</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {latestPrediction.risk_factors.map((factor, idx) => (
                  <div key={idx} className="flex items-start bg-muted/30 p-3.5 rounded-xl border border-border/50">
                    <div className="mt-1 mr-3 flex-shrink-0">
                      {factor.impact === 'high' ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                      ) : factor.impact === 'medium' ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-0.5">{factor.factor}</p>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{factor.impact} impact</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Intervention Simulator */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-primary" /> What-If Simulator
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Preview how different actions could reduce flight risk.</p>
              </div>
              <button onClick={handleSimulate} disabled={simulating} className="btn-primary flex items-center h-10 px-5 shadow-sm">
                {simulating ? <span className="flex items-center"><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" /> Simulating...</span> : 'Run Simulations'}
              </button>
            </div>

            {simulator ? (
              <div className="space-y-4">
                {simulator.interventions.map((inv) => (
                  <div key={inv.id} className="relative overflow-hidden bg-card border border-border rounded-xl p-5 transition-all hover:border-primary/30 shadow-sm group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{inv.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{inv.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 bg-muted/40 px-4 py-3 rounded-xl border border-border/50 sm:w-auto w-full justify-between sm:justify-start">
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Current</p>
                          <p className="text-base font-black text-foreground">{inv.original_risk.toFixed(1)}%</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Predicted</p>
                          <p className={`text-base font-black ${inv.delta < 0 ? 'text-success' : 'text-foreground'}`}>
                            {inv.new_risk.toFixed(1)}%
                          </p>
                        </div>
                        <div className={`ml-2 flex items-center text-xs font-bold px-2.5 py-1 rounded-md ${inv.delta < 0 ? 'bg-success/10 text-success border border-success/20' : 'bg-muted text-muted-foreground'}`}>
                          <TrendingDown className="w-3.5 h-3.5 mr-1" />
                          {Math.abs(inv.delta).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 bg-muted/20 rounded-xl border border-dashed border-border">
                <Shield className="w-12 h-12 text-primary/30 mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-1">No Simulation Run</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">Run the AI simulator to see predicted risk reductions for standard HR interventions.</p>
                <button onClick={handleSimulate} className="btn-primary h-10 shadow-sm">Run ML Simulation</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Trend Chart */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-foreground mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-muted-foreground" /> Historical Trend
              </h2>
              {trendData.length > 1 ? (
                <IndividualRiskTrendChart data={trendData} />
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground text-sm bg-muted/20 rounded-xl border border-dashed border-border">
                  <p>Not enough history to chart.</p>
                </div>
              )}
            </div>

            {/* Profile Deep Dive */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-foreground mb-6 flex items-center">
                <Award className="w-5 h-5 mr-2 text-primary" /> Career Summary
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-sm font-medium text-muted-foreground">Time in Current Role</span>
                  <span className="text-sm font-bold text-foreground">{employee.years_in_current_role} Years</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-sm font-medium text-muted-foreground">Time with Manager</span>
                  <span className="text-sm font-bold text-foreground">{employee.years_with_curr_manager} Years</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-sm font-medium text-muted-foreground">Since Last Promotion</span>
                  <span className="text-sm font-bold text-foreground">{employee.years_since_last_promotion} Years</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-sm font-medium text-muted-foreground">Total Working Yrs</span>
                  <span className="text-sm font-bold text-foreground">{employee.total_working_years} Years</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Previous Companies</span>
                  <span className="text-sm font-bold text-foreground">{employee.num_companies_worked}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Satisfaction Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Job</p>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4].map(i => <div key={i} className={`h-2 flex-1 rounded-full ${i <= employee.job_satisfaction ? 'bg-primary' : 'bg-muted'}`} />)}
                  </div>
                  <p className="text-xs font-medium text-right mt-1">{employee.job_satisfaction}/4</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Environment</p>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4].map(i => <div key={i} className={`h-2 flex-1 rounded-full ${i <= employee.environment_satisfaction ? 'bg-primary' : 'bg-muted'}`} />)}
                  </div>
                  <p className="text-xs font-medium text-right mt-1">{employee.environment_satisfaction}/4</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Work-Life</p>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4].map(i => <div key={i} className={`h-2 flex-1 rounded-full ${i <= employee.work_life_balance ? 'bg-primary' : 'bg-muted'}`} />)}
                  </div>
                  <p className="text-xs font-medium text-right mt-1">{employee.work_life_balance}/4</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Relationship</p>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4].map(i => <div key={i} className={`h-2 flex-1 rounded-full ${i <= employee.relationship_satisfaction ? 'bg-primary' : 'bg-muted'}`} />)}
                  </div>
                  <p className="text-xs font-medium text-right mt-1">{employee.relationship_satisfaction}/4</p>
                </div>
              </div>
          </div>

        </div>

        {/* Right Column: Timeline / History */}
        <div className="space-y-6">
          <div className="card p-6 h-full border-t-4 border-t-primary">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center">
              <History className="w-5 h-5 mr-2 text-primary" /> Activity Timeline
            </h2>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              
              {followups.map(fup => (
                <div key={`fup-${fup.id}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-card bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-sm text-foreground">{fup.action_type}</p>
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                        fup.status === 'Completed' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                      }`}>{fup.status}</span>
                    </div>
                    <time className="block text-xs font-medium text-muted-foreground mb-2">
                       {fup.status === 'Completed' ? `Done: ${new Date(fup.completed_at || '').toLocaleDateString()}` : `Due: ${new Date(fup.due_date || '').toLocaleDateString()}`}
                    </time>
                    <p className="text-xs text-muted-foreground">{fup.notes}</p>
                  </div>
                </div>
              ))}

              {meetings.map(m => {
                const notes = parseMeetingNotes(m.notes);
                return (
                <div key={`mtg-${m.id}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-card bg-secondary text-secondary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border p-4 rounded-xl shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-sm text-foreground leading-tight">{notes.title || m.meeting_type}</p>
                        {notes.google_event_id && (
                           <span className="flex items-center text-[10px] text-success font-bold mt-1">
                             <CheckCircle2 className="w-3 h-3 mr-1" /> Google Synced
                           </span>
                        )}
                      </div>
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                        m.status === 'Completed' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                      }`}>{m.status}</span>
                    </div>
                    <time className="block text-xs font-medium text-muted-foreground mb-3 flex items-center">
                       <Clock className="w-3.5 h-3.5 mr-1.5" />
                       {new Date(m.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </time>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 bg-muted/30 p-2 rounded-lg">{notes.description || 'No description provided.'}</p>
                    
                    <div className="flex gap-2">
                      {notes.meeting_link && m.status !== 'Completed' && (
                        isValidLink(notes.meeting_link) ? (
                          <a href={notes.meeting_link} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs py-1.5 px-3 flex-1 flex justify-center items-center shadow-sm">
                            <Video className="w-3.5 h-3.5 mr-1.5" /> Join {notes.platform === 'Google Meet' ? 'Meet' : 'Meeting'}
                          </a>
                        ) : (
                          <button type="button" className="btn-secondary text-xs py-1.5 px-3 flex-1 flex justify-center items-center text-warning-DEFAULT cursor-not-allowed opacity-80" title="Invalid meeting link">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Invalid Link
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )})}

              {followups.length === 0 && meetings.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground w-full">
                  No activities recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Employee Modal */}
      {editModalOpen && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-border my-8 animate-in zoom-in-95">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="text-xl font-bold text-foreground flex items-center">
                <Edit2 className="w-5 h-5 mr-2 text-primary" /> Edit Employee Details
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-muted-foreground hover:bg-muted p-1.5 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-foreground border-b border-border pb-2">Compensation & Rules</h4>
                        <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Monthly Income (₹)</label>
                        <input type="number" className="input-field" value={editForm.monthly_income}
                            onChange={e => setEditForm({...editForm, monthly_income: Number(e.target.value)})}
                            min={1000} />
                        </div>
                        <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Overtime</label>
                        <select className="input-field" value={editForm.over_time}
                            onChange={e => setEditForm({...editForm, over_time: e.target.value})}>
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                        </select>
                        </div>
                        <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Stock Option Level (0-3)</label>
                        <select className="input-field" value={editForm.stock_option_level}
                            onChange={e => setEditForm({...editForm, stock_option_level: Number(e.target.value)})}>
                            <option value={0}>0 – None</option>
                            <option value={1}>1 – Low</option>
                            <option value={2}>2 – Medium</option>
                            <option value={3}>3 – High</option>
                        </select>
                        </div>
                        <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Training Times Last Year</label>
                        <input type="number" className="input-field" value={editForm.training_times_last_year}
                            onChange={e => setEditForm({...editForm, training_times_last_year: Number(e.target.value)})}
                            min={0} max={10} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-foreground border-b border-border pb-2">Satisfaction Surveys</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Job Sat.</label>
                            <select className="input-field" value={editForm.job_satisfaction}
                                onChange={e => setEditForm({...editForm, job_satisfaction: Number(e.target.value)})}>
                                <option value={1}>1 – Low</option>
                                <option value={2}>2 – Medium</option>
                                <option value={3}>3 – High</option>
                                <option value={4}>4 – Very High</option>
                            </select>
                            </div>
                            <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Env Sat.</label>
                            <select className="input-field" value={editForm.environment_satisfaction}
                                onChange={e => setEditForm({...editForm, environment_satisfaction: Number(e.target.value)})}>
                                <option value={1}>1 – Low</option>
                                <option value={2}>2 – Medium</option>
                                <option value={3}>3 – High</option>
                                <option value={4}>4 – Very High</option>
                            </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Work-Life</label>
                            <select className="input-field" value={editForm.work_life_balance}
                                onChange={e => setEditForm({...editForm, work_life_balance: Number(e.target.value)})}>
                                <option value={1}>1 – Bad</option>
                                <option value={2}>2 – Good</option>
                                <option value={3}>3 – Better</option>
                                <option value={4}>4 – Best</option>
                            </select>
                            </div>
                            <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Relations</label>
                            <select className="input-field" value={editForm.relationship_satisfaction}
                                onChange={e => setEditForm({...editForm, relationship_satisfaction: Number(e.target.value)})}>
                                <option value={1}>1 – Low</option>
                                <option value={2}>2 – Medium</option>
                                <option value={3}>3 – High</option>
                                <option value={4}>4 – Very High</option>
                            </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <h4 className="text-sm font-bold text-foreground border-b border-border pb-2">Career History</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Years at Company</label>
                        <input type="number" className="input-field" value={editForm.years_at_company}
                            onChange={e => setEditForm({...editForm, years_at_company: Number(e.target.value)})}
                            min={0} max={40} />
                        </div>
                        <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Years in Role</label>
                        <input type="number" className="input-field" value={editForm.years_in_current_role}
                            onChange={e => setEditForm({...editForm, years_in_current_role: Number(e.target.value)})}
                            min={0} max={20} />
                        </div>
                        <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Yrs Since Promotion</label>
                        <input type="number" className="input-field" value={editForm.years_since_last_promotion}
                            onChange={e => setEditForm({...editForm, years_since_last_promotion: Number(e.target.value)})}
                            min={0} max={15} />
                        </div>
                    </div>
                </div>

              <div className="pt-6 mt-6 border-t border-border flex justify-end gap-3">
                <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary h-10 px-6">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary h-10 px-8 flex items-center shadow-md">
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />Saving...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Save Changes</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

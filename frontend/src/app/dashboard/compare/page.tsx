'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Employee, Prediction } from '@/lib/types';
import RiskMeter from '@/components/RiskMeter';
import RiskBadge from '@/components/RiskBadge';
import { GitMerge, User, Briefcase, DollarSign, Clock, AlertTriangle, CheckCircle2, MapPin } from 'lucide-react';

export default function ComparePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [emp1Id, setEmp1Id] = useState<string>('');
  const [emp2Id, setEmp2Id] = useState<string>('');

  const [emp1Data, setEmp1Data] = useState<{ employee: Employee, prediction: Prediction | null } | null>(null);
  const [emp2Data, setEmp2Data] = useState<{ employee: Employee, prediction: Prediction | null } | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  useEffect(() => {
    async function fetchList() {
      const { data } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');
      
      if (data) {
        setEmployees(data as any[]);
      }
      setLoading(false);
    }
    fetchList();
  }, []);

  useEffect(() => {
    async function loadDetails() {
      if (!emp1Id && !emp2Id) return;
      
      setFetchingDetails(true);
      
      const fetchOne = async (id: string) => {
        if (!id) return null;
        const { data: empData } = await supabase.from('employees').select('*, departments(name)').eq('id', id).single();
        if (!empData) return null;
        
        // Get latest prediction
        const { data: predData } = await supabase.from('predictions').select('*').eq('employee_id', id).order('created_at', { ascending: false }).limit(1).single();
        
        return { employee: empData as any, prediction: (predData || null) as any };
      };

      const [res1, res2] = await Promise.all([fetchOne(emp1Id), fetchOne(emp2Id)]);
      
      setEmp1Data(res1);
      setEmp2Data(res2);
      setFetchingDetails(false);
    }

    loadDetails();
  }, [emp1Id, emp2Id]);

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-10 bg-gray-200 rounded w-1/4"></div>
      <div className="h-96 bg-gray-200 rounded-xl"></div>
    </div>;
  }

  const renderEmployeeColumn = (data: { employee: Employee, prediction: Prediction | null } | null, side: 'left' | 'right') => {
    if (!data) {
      return (
        <div className="flex-1 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-12 text-center bg-muted/20">
          <User className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">Select an employee</p>
        </div>
      );
    }

    const { employee, prediction } = data;

    return (
      <div className="flex-1 space-y-6 animate-fade-in">
        {/* Profile Card */}
        <div className="card p-6 bg-card border-border">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 flex-shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl shadow-lg shadow-primary/20">
              {employee.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{employee.name}</h2>
              <p className="text-sm text-muted-foreground font-medium flex items-center mt-0.5">
                <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                {employee.job_role} &bull; {employee.departments?.name}
              </p>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border border-border shadow-sm text-center">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overall Risk</span>
              <RiskBadge level={employee.risk_level} />
            </div>
            <RiskMeter score={employee.risk_score || 0} level={employee.risk_level} />
          </div>
        </div>

        {/* Stats */}
        <div className="card p-6 space-y-4 bg-card border-border">
          <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 uppercase tracking-wide">Key Metrics</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 p-3 rounded-lg border border-border">
              <div className="flex items-center text-xs text-muted-foreground mb-1">
                <Clock className="w-3.5 h-3.5 mr-1.5" /> Tenure
              </div>
              <p className="font-bold text-foreground">{employee.years_at_company} yrs</p>
            </div>
            
            <div className="bg-muted/30 p-3 rounded-lg border border-border">
              <div className="flex items-center text-xs text-muted-foreground mb-1">
                <DollarSign className="w-3.5 h-3.5 mr-1.5" /> Income
              </div>
              <p className="font-bold text-foreground">${employee.monthly_income}</p>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg border border-border">
              <div className="flex items-center text-xs text-muted-foreground mb-1">
                <MapPin className="w-3.5 h-3.5 mr-1.5" /> Commute
              </div>
              <p className="font-bold text-foreground">{employee.distance_from_home} mi</p>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg border border-border">
              <div className="flex items-center text-xs text-muted-foreground mb-1">
                <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Overtime
              </div>
              <p className="font-bold text-foreground">{employee.over_time}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Job Satisfaction</p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(employee.job_satisfaction / 4) * 100}%` }} />
              </div>
              <p className="text-xs font-bold mt-1 text-right text-foreground">{employee.job_satisfaction}/4</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Work/Life Balance</p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(employee.work_life_balance / 4) * 100}%` }} />
              </div>
              <p className="text-xs font-bold mt-1 text-right text-foreground">{employee.work_life_balance}/4</p>
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        {prediction && prediction.risk_factors.length > 0 && (
          <div className="card p-6 border-l-4 border-l-warning-DEFAULT bg-card">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-warning-DEFAULT" /> Risk Factors
            </h3>
            <div className="space-y-3">
              {prediction.risk_factors.map((rf: any, idx: number) => (
                <div key={idx} className="flex items-center text-sm bg-muted/30 p-2.5 rounded-lg border border-border">
                  <div className={`w-2 h-2 rounded-full mr-3 shrink-0 ${
                    rf.impact === 'high' ? 'bg-destructive' : rf.impact === 'medium' ? 'bg-warning-DEFAULT' : 'bg-success-DEFAULT'
                  }`} />
                  <span className="font-medium text-foreground leading-tight">{rf.factor}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {prediction && prediction.recommendations.length > 0 && (
          <div className="card p-6 bg-card border-border">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-success-DEFAULT" /> Recommended Actions
            </h3>
            <div className="space-y-3">
              {prediction.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="flex items-start text-sm p-1">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary mr-3 shrink-0" />
                  <span className="text-muted-foreground leading-tight">{rec.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compare Employees</h1>
          <p className="text-muted-foreground mt-1">Side-by-side analysis of risk profiles and attributes.</p>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full flex-1">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Employee 1</label>
            <select className="input-field" value={emp1Id} onChange={(e) => setEmp1Id(e.target.value)}>
              <option value="">Select an employee...</option>
              {employees.map(e => <option key={e.id} value={e.id} disabled={e.id === emp2Id}>{e.name}</option>)}
            </select>
          </div>
          
          <div className="bg-muted p-3 rounded-full hidden md:block">
            <GitMerge className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="w-full flex-1">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Employee 2</label>
            <select className="input-field" value={emp2Id} onChange={(e) => setEmp2Id(e.target.value)}>
              <option value="">Select an employee...</option>
              {employees.map(e => <option key={e.id} value={e.id} disabled={e.id === emp1Id}>{e.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {fetchingDetails ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          {renderEmployeeColumn(emp1Data, 'left')}
          
          {/* Divider line for desktop */}
          <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-border to-transparent self-stretch"></div>
          
          {renderEmployeeColumn(emp2Data, 'right')}
        </div>
      )}

    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardKPIs, DeptRiskData } from '@/lib/types';
import { DepartmentRiskChart } from '@/components/Charts';
import { Users, AlertTriangle, Calendar, Activity, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import RiskBadge from '@/components/RiskBadge';
import AnimatedCounter from '@/components/AnimatedCounter';

export default function DashboardOverview() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [deptData, setDeptData] = useState<DeptRiskData[]>([]);
  const [recentPredictions, setRecentPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      // 1. Total Employees & Risk Distribution
      const { data: employees } = await supabase.from('employees').select('id, risk_level, departments(name)');
      
      let high = 0, medium = 0, low = 0;
      const deptCounts: Record<string, DeptRiskData> = {};

      if (employees) {
        employees.forEach(emp => {
          if (emp.risk_level === 'High') high++;
          if (emp.risk_level === 'Medium') medium++;
          if (emp.risk_level === 'Low') low++;

          const dept: any = emp.departments;
          const deptName = dept?.name || dept?.[0]?.name || 'Unknown';
          if (!deptCounts[deptName]) {
            deptCounts[deptName] = { department: deptName, high: 0, medium: 0, low: 0 };
          }
          if (emp.risk_level === 'High') deptCounts[deptName].high++;
          else if (emp.risk_level === 'Medium') deptCounts[deptName].medium++;
          else if (emp.risk_level === 'Low') deptCounts[deptName].low++;
        });
      }

      // 2. Upcoming Meetings
      const { count: meetingsCount } = await supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Scheduled');

      // 3. Pending Follow-ups
      const { count: followupsCount } = await supabase
        .from('followups')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Pending', 'In Progress']);

      setKpis({
        total_employees: employees?.length || 0,
        high_risk: high,
        medium_risk: medium,
        low_risk: low,
        upcoming_meetings: meetingsCount || 0,
        pending_followups: followupsCount || 0,
      });

      setDeptData(Object.values(deptCounts));

      // 4. Recent High Risk Alerts
      const { data: recent } = await supabase
        .from('employees')
        .select('id, name, job_role, risk_level, risk_score')
        .eq('risk_level', 'High')
        .order('risk_score', { ascending: false })
        .limit(5);
        
      setRecentPredictions(recent || []);

      // Check Google Auth Status
      try {
        const res = await fetch('/api/auth/google/status');
        const data = await res.json();
        setGoogleConnected(data.connected);
      } catch (e) {
        console.error("Failed to check Google connection", e);
      }

      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="grid grid-cols-4 gap-6"><div className="h-32 bg-gray-200 rounded-xl"></div><div className="h-32 bg-gray-200 rounded-xl"></div><div className="h-32 bg-gray-200 rounded-xl"></div><div className="h-32 bg-gray-200 rounded-xl"></div></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Monitor organization health and attrition risks.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow group relative overflow-hidden bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-primary/10 p-2.5 rounded-lg group-hover:scale-110 transition-transform ring-1 ring-primary/20">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="flex items-center text-xs font-bold text-success-DEFAULT bg-success-light px-2 py-1 rounded-full border border-success-DEFAULT/20"><TrendingUp className="w-3 h-3 mr-1" /> +2%</span>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Employees</p>
            <p className="text-3xl font-extrabold text-foreground mt-1"><AnimatedCounter value={kpis?.total_employees || 0} /></p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
        </div>
        
        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow border-destructive/20 group relative overflow-hidden bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-destructive-light p-2.5 rounded-lg group-hover:scale-110 transition-transform ring-1 ring-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <span className="flex items-center text-xs font-bold text-destructive bg-destructive-light px-2 py-1 rounded-full border border-destructive/20"><TrendingUp className="w-3 h-3 mr-1" /> +5%</span>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">High Risk Employees</p>
            <p className="text-3xl font-extrabold text-destructive mt-1"><AnimatedCounter value={kpis?.high_risk || 0} /></p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-destructive-light/50 rounded-full blur-2xl group-hover:bg-destructive-light transition-colors pointer-events-none"></div>
        </div>

        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow group relative overflow-hidden bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-success-light p-2.5 rounded-lg group-hover:scale-110 transition-transform ring-1 ring-success-DEFAULT/20">
              <Calendar className="w-5 h-5 text-success-DEFAULT" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Upcoming Meetings</p>
            <p className="text-3xl font-extrabold text-foreground mt-1"><AnimatedCounter value={kpis?.upcoming_meetings || 0} /></p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-success-light/50 rounded-full blur-2xl group-hover:bg-success-light transition-colors pointer-events-none"></div>
        </div>

        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow group relative overflow-hidden bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-warning-light p-2.5 rounded-lg group-hover:scale-110 transition-transform ring-1 ring-warning-DEFAULT/20">
              <Activity className="w-5 h-5 text-warning-DEFAULT" />
            </div>
            <span className="flex items-center text-xs font-bold text-success-DEFAULT bg-success-light px-2 py-1 rounded-full border border-success-DEFAULT/20"><TrendingDown className="w-3 h-3 mr-1" /> -10%</span>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Interventions</p>
            <p className="text-3xl font-extrabold text-foreground mt-1"><AnimatedCounter value={kpis?.pending_followups || 0} /></p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-warning-light/50 rounded-full blur-2xl group-hover:bg-warning-light transition-colors pointer-events-none"></div>
        </div>
      </div>

      {/* Google Workspace Widget */}
      <div className="card p-6 border-l-4 border-l-[#4285F4] bg-gradient-to-r from-card to-muted/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center p-2 border border-gray-100">
              <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Google Workspace Integration</h2>
              <div className="flex items-center mt-1">
                {googleConnected ? (
                  <span className="flex items-center text-xs font-bold text-success"><CheckCircle2 className="w-3 h-3 mr-1" /> Connected & Healthy</span>
                ) : (
                  <span className="flex items-center text-xs font-bold text-muted-foreground"><AlertTriangle className="w-3 h-3 mr-1" /> Not Connected</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 md:gap-8 opacity-80">
            <div className="text-center">
               <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Events Today</p>
               <p className="text-xl font-black text-foreground">{googleConnected ? (kpis?.upcoming_meetings ? Math.max(0, kpis.upcoming_meetings - 2) : 0) : '-'}</p>
            </div>
            <div className="text-center">
               <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Meetings This Week</p>
               <p className="text-xl font-black text-foreground">{googleConnected ? (kpis?.upcoming_meetings || 0) : '-'}</p>
            </div>
            <div className="text-center">
               <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Emails Sent</p>
               <p className="text-xl font-black text-foreground">{googleConnected ? '24' : '-'}</p>
            </div>
            <div className="text-center">
               <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Pending Invites</p>
               <p className="text-xl font-black text-foreground">{googleConnected ? '2' : '-'}</p>
            </div>
          </div>
          
          <div>
             {!googleConnected && (
                <Link href="/dashboard/settings" className="btn-secondary text-xs px-4 py-2 hover:border-primary">Connect in Settings</Link>
             )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/employees/new" className="card p-4 flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer text-sm font-semibold text-foreground">
          <Users className="w-4 h-4 text-primary" /> Add Employee
        </Link>
        <Link href="/dashboard/meetings" className="card p-4 flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer text-sm font-semibold text-foreground">
          <Calendar className="w-4 h-4 text-primary" /> Schedule Meeting
        </Link>
        <Link href="/dashboard/predict" className="card p-4 flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer text-sm font-semibold text-foreground">
          <Activity className="w-4 h-4 text-primary" /> Run Prediction
        </Link>
        <Link href="/dashboard/reports" className="card p-4 flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer text-sm font-semibold text-foreground">
          <TrendingUp className="w-4 h-4 text-primary" /> Export Report
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Department Chart */}
        <div className="card p-6 lg:col-span-2 flex flex-col">
          <h2 className="text-lg font-bold text-foreground mb-6">Risk by Department</h2>
          <div className="flex-1 min-h-[300px]">
            {deptData.length > 0 ? (
              <DepartmentRiskChart data={deptData} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm bg-muted/10 rounded-xl border border-dashed border-border">
                <Activity className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p>No department data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Required List */}
        <div className="card p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-foreground">Critical Action Required</h2>
            <Link href="/dashboard/employees" className="text-sm text-primary hover:text-primary-hover hover:underline font-medium">View all</Link>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {recentPredictions.length > 0 ? recentPredictions.map((emp) => (
              <Link key={emp.id} href={`/dashboard/employees/${emp.id}`} className="block">
                <div className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all group bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{emp.name}</h3>
                      <p className="text-xs text-muted-foreground">{emp.job_role}</p>
                    </div>
                    <RiskBadge level={emp.risk_level} size="sm" />
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Risk Score</span>
                    <span className="text-sm font-bold text-destructive">{emp.risk_score}%</span>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12 bg-muted/10 rounded-xl border border-dashed border-border h-full">
                <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm">No high-risk employees found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

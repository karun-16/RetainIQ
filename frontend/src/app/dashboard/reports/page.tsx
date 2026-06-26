'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Download, FileText, Activity, Users, AlertTriangle, TrendingDown, Search, User, ChevronDown, CheckCircle, Clock } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#9ca3af']; // High, Medium, Low, Unknown

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'org' | 'emp'>('org');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Org Stats
  const [stats, setStats] = useState({
    totalEmployees: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    avgRiskScore: 0
  });
  const [deptData, setDeptData] = useState<any[]>([]);
  const [riskData, setRiskData] = useState<any[]>([]);
  const orgReportRef = useRef<HTMLDivElement>(null);

  // Employee Reports
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedEmpData, setSelectedEmpData] = useState<any>(null);
  const empReportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      // Fetch organization wide data
      const { data: employees } = await supabase.from('employees').select('*, departments(name)');
      if (employees) {
        // Analytics calculations
        const high = employees.filter(e => e.risk_level === 'High').length;
        const med = employees.filter(e => e.risk_level === 'Medium').length;
        const low = employees.filter(e => e.risk_level === 'Low').length;
        const unk = employees.filter(e => e.risk_level === 'Unknown').length;
        const scores = employees.filter(e => e.risk_score != null).map(e => e.risk_score);
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        setStats({ totalEmployees: employees.length, highRisk: high, mediumRisk: med, lowRisk: low, avgRiskScore: avg });
        setRiskData([
          { name: 'High Risk', value: high },
          { name: 'Medium Risk', value: med },
          { name: 'Low Risk', value: low },
          { name: 'Unknown', value: unk }
        ].filter(d => d.value > 0));

        const dMap: Record<string, any> = {};
        employees.forEach(e => {
          const dName = e.departments?.name || 'Unassigned';
          if (!dMap[dName]) dMap[dName] = { name: dName, High: 0, Medium: 0, Low: 0 };
          if (e.risk_level === 'High') dMap[dName].High++;
          else if (e.risk_level === 'Medium') dMap[dName].Medium++;
          else if (e.risk_level === 'Low') dMap[dName].Low++;
        });
        setDeptData(Object.values(dMap));
        setEmployeesList(employees);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedEmpId) {
      setSelectedEmpData(null);
      return;
    }
    async function fetchEmployeeDetails() {
      const { data: profile } = await supabase.from('employees').select('*, departments(name)').eq('id', selectedEmpId).single();
      const { data: meetings } = await supabase.from('meetings').select('*').eq('employee_id', selectedEmpId).order('scheduled_at', { ascending: false });
      const { data: followups } = await supabase.from('followups').select('*').eq('employee_id', selectedEmpId).order('created_at', { ascending: false });
      const { data: predictions } = await supabase.from('predictions').select('*').eq('employee_id', selectedEmpId).order('created_at', { ascending: false });

      setSelectedEmpData({
        profile,
        meetings: meetings || [],
        followups: followups || [],
        predictions: predictions || []
      });
    }
    fetchEmployeeDetails();
  }, [selectedEmpId]);

  const generatePDF = async (ref: React.RefObject<HTMLDivElement | null>, title: string) => {
    if (!ref.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Header Background
      pdf.setFillColor(250, 250, 250);
      pdf.rect(0, 0, pdfWidth, 30, 'F');
      
      // Branding
      pdf.setFontSize(22);
      pdf.setTextColor(17, 24, 39);
      pdf.text('RetainIQ', 15, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Predict. Prevent. Retain.', 15, 26);
      
      // Right side metadata
      pdf.setFontSize(10);
      pdf.setTextColor(17, 24, 39);
      const dateStr = `Date: ${new Date().toLocaleDateString()}`;
      pdf.text(dateStr, pdfWidth - 15 - pdf.getTextWidth(dateStr), 20);
      const docIdStr = `Doc ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      pdf.text(docIdStr, pdfWidth - 15 - pdf.getTextWidth(docIdStr), 26);
      
      // Separator Line
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.5);
      pdf.line(15, 32, pdfWidth - 15, 32);

      // Watermark
      pdf.setFontSize(60);
      pdf.setTextColor(243, 244, 246);
      pdf.text('CONFIDENTIAL', pdfWidth / 2, 150, { angle: 45, align: 'center' });
      
      // Content
      const contentYOffset = 38;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, contentYOffset, pdfWidth, pdfHeight);
      
      // Footer
      const totalPages = Math.ceil((pdfHeight + contentYOffset) / pdf.internal.pageSize.getHeight());
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text(
          `Generated by RetainIQ Enterprise - Page ${i} of ${totalPages}`,
          15,
          pdf.internal.pageSize.getHeight() - 10
        );
      }

      pdf.save(`${title}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Failed to generate PDF.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportOrgCSV = () => {
    const headers = ['Name', 'Role', 'Department', 'Risk Level', 'Risk Score'];
    const rows = employeesList.map(e => [
      `"${e.name}"`, `"${e.job_role}"`, `"${e.departments?.name || 'N/A'}"`, e.risk_level, e.risk_score || ''
    ]);
    downloadCSV(headers, rows, 'organization_report.csv');
  };

  const handleExportEmpCSV = () => {
    if (!selectedEmpData?.profile) return;
    const p = selectedEmpData.profile;
    const headers = [
      'Name', 'Employee_ID', 'Department', 'Job_Role', 'Age', 'Gender', 'Marital_Status', 'Education', 
      'Monthly_Income', 'Daily_Rate', 'Monthly_Rate', 'Hourly_Rate', 'Salary_Hike', 'Stock_Option',
      'Total_Working_Years', 'Num_Companies_Worked', 'Years_At_Company', 'Years_In_Current_Role', 'Years_Since_Promotion', 'Years_With_Manager',
      'Overtime', 'Business_Travel', 'Work_Life_Balance', 'Job_Satisfaction', 'Environment_Satisfaction', 'Relationship_Satisfaction', 'Performance_Rating', 'Training_Times',
      'Risk_Score', 'Risk_Level'
    ];
    const rows = [[
      `"${p.name}"`, `"${p.id}"`, `"${p.departments?.name || ''}"`, `"${p.job_role}"`, p.age, `"${p.gender}"`, `"${p.marital_status}"`, p.education,
      p.monthly_income, p.daily_rate, p.monthly_rate, p.hourly_rate, p.percent_salary_hike, p.stock_option_level,
      p.total_working_years, p.num_companies_worked, p.years_at_company, p.years_in_current_role, p.years_since_last_promotion, p.years_with_curr_manager,
      `"${p.over_time}"`, `"${p.business_travel}"`, p.work_life_balance, p.job_satisfaction, p.environment_satisfaction, p.relationship_satisfaction, p.performance_rating, p.training_times_last_year,
      p.risk_score || '', `"${p.risk_level}"`
    ]];
    downloadCSV(headers, rows, `employee_${p.id}_report.csv`);
  };

  const downloadCSV = (headers: string[], rows: any[][], filename: string) => {
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredEmployees = employeesList.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.job_role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-10 bg-gray-200 rounded w-1/4"></div>
      <div className="h-[600px] bg-gray-200 rounded"></div>
    </div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Enterprise-level insights and individual employee reporting.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('org')} 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'org' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Organization Reports
          </button>
          <button 
            onClick={() => setActiveTab('emp')} 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'emp' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Employee Reports
          </button>
        </div>
      </div>

      {activeTab === 'org' && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            <button onClick={handleExportOrgCSV} className="btn-secondary flex items-center">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
            <button onClick={() => generatePDF(orgReportRef, 'Organization_Report')} disabled={exporting} className="btn-primary flex items-center">
              {exporting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <FileText className="w-4 h-4 mr-2" />}
              {exporting ? 'Generating...' : 'Export PDF'}
            </button>
          </div>

          <div ref={orgReportRef} className="space-y-6 bg-card p-4 rounded-xl border border-border">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-6 border border-border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Headcount</h3>
                  <Users className="w-5 h-5 text-muted-foreground/50" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.totalEmployees}</p>
              </div>
              <div className="card p-6 border border-border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-destructive uppercase tracking-wider">High Risk</h3>
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.highRisk}</p>
                <p className="text-sm text-muted-foreground mt-1">{((stats.highRisk / stats.totalEmployees) * 100 || 0).toFixed(1)}% of total</p>
              </div>
              <div className="card p-6 border border-border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-warning-DEFAULT uppercase tracking-wider">Medium Risk</h3>
                  <Activity className="w-5 h-5 text-warning-DEFAULT" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.mediumRisk}</p>
                <p className="text-sm text-muted-foreground mt-1">{((stats.mediumRisk / stats.totalEmployees) * 100 || 0).toFixed(1)}% of total</p>
              </div>
              <div className="card p-6 border border-border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Avg Risk Score</h3>
                  <TrendingDown className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.avgRiskScore.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground mt-1">Enterprise average</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card p-6 border border-border bg-card lg:col-span-1 min-h-[400px]">
                <h3 className="text-lg font-bold text-foreground mb-6">Risk Distribution</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={riskData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                        {riskData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card p-6 border border-border bg-card lg:col-span-2 min-h-[400px]">
                <h3 className="text-lg font-bold text-foreground mb-6">Risk by Department</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                      <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }} />
                      <Legend />
                      <Bar dataKey="High" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="Medium" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Low" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'emp' && (
        <div className="space-y-6">
          <div className="card p-6 border border-border bg-card">
            <h2 className="text-lg font-bold text-foreground mb-4">Search Employee</h2>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select 
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="">-- Select an Employee --</option>
                {employeesList.map(e => (
                  <option key={e.id} value={e.id}>{e.name} - {e.job_role}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {selectedEmpData && (
            <>
              <div className="flex justify-end gap-2">
                <button onClick={handleExportEmpCSV} className="btn-secondary flex items-center">
                  <Download className="w-4 h-4 mr-2" /> Export CSV
                </button>
                <button onClick={() => generatePDF(empReportRef, `Employee_Report_${selectedEmpData.profile.id}`)} disabled={exporting} className="btn-primary flex items-center">
                  {exporting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <FileText className="w-4 h-4 mr-2" />}
                  {exporting ? 'Generating...' : 'Export PDF'}
                </button>
              </div>

              <div ref={empReportRef} className="space-y-6 bg-card p-8 rounded-xl border border-border">
                {/* Employee Header */}
                <div className="border-b border-border pb-6 flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedEmpData.profile.name}</h2>
                    <p className="text-muted-foreground">{selectedEmpData.profile.job_role} • {selectedEmpData.profile.departments?.name}</p>
                    <div className="mt-2 flex gap-4">
                      <span className="text-sm text-muted-foreground">ID: {selectedEmpData.profile.id}</span>
                      <span className="text-sm text-muted-foreground">Age: {selectedEmpData.profile.age}</span>
                      <span className="text-sm text-muted-foreground">Gender: {selectedEmpData.profile.gender}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* ML Prediction */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">ML Risk Prediction</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">Retention Risk Score</span>
                        <span className={`text-sm font-bold ${selectedEmpData.profile.risk_level === 'High' ? 'text-destructive' : selectedEmpData.profile.risk_level === 'Medium' ? 'text-warning-DEFAULT' : 'text-primary'}`}>
                          {selectedEmpData.profile.risk_score?.toFixed(1)}% ({selectedEmpData.profile.risk_level})
                        </span>
                      </div>
                      <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${selectedEmpData.profile.risk_level === 'High' ? 'bg-destructive' : selectedEmpData.profile.risk_level === 'Medium' ? 'bg-warning-DEFAULT' : 'bg-primary'}`} 
                          style={{ width: `${selectedEmpData.profile.risk_score || 0}%` }}
                        />
                      </div>
                    </div>
                    {selectedEmpData.predictions.length > 0 && selectedEmpData.predictions[0].risk_factors && (
                      <div className="space-y-2 mt-4">
                        <span className="text-sm font-bold text-foreground">Top Risk Factors:</span>
                        <ul className="list-disc pl-5 space-y-1">
                          {selectedEmpData.predictions[0].risk_factors.map((rf: any, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground">{rf.factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Compensation & Career */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">Compensation & Career</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                      <div className="text-sm"><span className="text-muted-foreground">Monthly Income:</span> <span className="font-medium">₹{selectedEmpData.profile.monthly_income.toLocaleString('en-IN')}</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">Salary Hike:</span> <span className="font-medium">{selectedEmpData.profile.percent_salary_hike}%</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">Stock Options:</span> <span className="font-medium">Level {selectedEmpData.profile.stock_option_level}</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">Total Exp:</span> <span className="font-medium">{selectedEmpData.profile.total_working_years} yrs</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">At Company:</span> <span className="font-medium">{selectedEmpData.profile.years_at_company} yrs</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">In Role:</span> <span className="font-medium">{selectedEmpData.profile.years_in_current_role} yrs</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">Since Promoted:</span> <span className="font-medium">{selectedEmpData.profile.years_since_last_promotion} yrs</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">With Manager:</span> <span className="font-medium">{selectedEmpData.profile.years_with_curr_manager} yrs</span></div>
                    </div>
                  </div>

                  {/* Work environment */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">Work Environment</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                      <div className="text-sm"><span className="text-muted-foreground">Overtime:</span> <span className="font-medium">{selectedEmpData.profile.over_time}</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">Business Travel:</span> <span className="font-medium">{selectedEmpData.profile.business_travel.replace(/_/g, ' ')}</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">Work-Life Balance:</span> <span className="font-medium">{selectedEmpData.profile.work_life_balance}/4</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">Job Satisfaction:</span> <span className="font-medium">{selectedEmpData.profile.job_satisfaction}/4</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">Environment Sat.:</span> <span className="font-medium">{selectedEmpData.profile.environment_satisfaction}/4</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">Performance:</span> <span className="font-medium">{selectedEmpData.profile.performance_rating}/4</span></div>
                    </div>
                  </div>

                  {/* History */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">Activity History</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-bold text-foreground block mb-1">Recent Meetings ({selectedEmpData.meetings.length})</span>
                        {selectedEmpData.meetings.slice(0, 3).map((m: any) => (
                          <div key={m.id} className="text-sm flex items-center gap-2 mb-1">
                            {m.status === 'Completed' ? <CheckCircle className="w-3 h-3 text-primary" /> : <Clock className="w-3 h-3 text-warning-DEFAULT" />}
                            <span className="text-muted-foreground">{new Date(m.scheduled_at).toLocaleDateString()}</span>
                            <span className="font-medium">{m.meeting_type}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-foreground block mb-1">Interventions ({selectedEmpData.followups.length})</span>
                        {selectedEmpData.followups.slice(0, 3).map((f: any) => (
                          <div key={f.id} className="text-sm mb-1 text-muted-foreground">
                            • {f.action_type} - <span className="font-medium text-foreground">{f.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

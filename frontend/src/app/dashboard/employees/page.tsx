'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Employee } from '@/lib/types';
import RiskBadge from '@/components/RiskBadge';
import { Search, Filter, ChevronRight, ArrowUpDown, UserPlus, Trash2 } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [filterDept, setFilterDept] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('risk_score_desc');

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
      try {
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) throw error;
        setEmployees(employees.filter(emp => emp.id !== id));
      } catch (err) {
        console.error("Failed to delete employee", err);
        alert("Failed to delete employee");
      }
    }
  };

  useEffect(() => {
    async function fetchEmployees() {
      const { data } = await supabase
        .from('employees')
        .select(`
          id, name, job_role, risk_level, risk_score, department_id,
          departments (name)
        `)
        .order('risk_score', { ascending: false });
        
      if (data) {
        setEmployees(data as any);
      }
      setLoading(false);
    }
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || 
                          emp.job_role.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = filterRisk === 'All' || emp.risk_level === filterRisk;
    const matchesDept = filterDept === 'All' || (emp.departments?.name === filterDept);
    return matchesSearch && matchesRisk && matchesDept;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (sortBy === 'risk_score_desc') {
      return (b.risk_score || 0) - (a.risk_score || 0);
    } else if (sortBy === 'risk_score_asc') {
      return (a.risk_score || 0) - (b.risk_score || 0);
    } else if (sortBy === 'name_asc') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'name_desc') {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees Directory</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor employee retention risks.</p>
        </div>
        <Link href="/dashboard/employees/new" className="btn-primary flex items-center">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Employee
        </Link>
      </div>

      <div className="card">
        <div className="p-4 border-b border-border flex flex-col lg:flex-row gap-4 bg-muted/20">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by name or role..." 
              className="input-field pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            {/* Department Filter */}
            <div className="relative w-full sm:w-48 flex-1 sm:flex-initial">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select 
                className="input-field pl-9 appearance-none bg-background cursor-pointer"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
              >
                <option value="All">All Departments</option>
                <option value="Sales">Sales</option>
                <option value="Research & Development">R&D</option>
                <option value="Human Resources">HR</option>
              </select>
            </div>

            {/* Risk Level Filter */}
            <div className="relative w-full sm:w-48 flex-1 sm:flex-initial">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select 
                className="input-field pl-9 appearance-none bg-background cursor-pointer"
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
              >
                <option value="All">All Risks</option>
                <option value="High">High Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="Low">Low Risk</option>
              </select>
            </div>

            {/* Sort Select */}
            <div className="relative w-full sm:w-48 flex-1 sm:flex-initial">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select 
                className="input-field pl-9 appearance-none bg-background cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="risk_score_desc">Risk Score: High to Low</option>
                <option value="risk_score_asc">Risk Score: Low to High</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto rounded-b-xl border-t border-border">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-md z-10 shadow-sm">
              <tr className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 border-b border-border">Employee</th>
                <th className="px-6 py-4 border-b border-border">Department</th>
                <th className="px-6 py-4 border-b border-border">Risk Level</th>
                <th className="px-6 py-4 border-b border-border text-right">Risk Score</th>
                <th className="px-6 py-4 border-b border-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-pulse space-y-4 max-w-sm mx-auto">
                      <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                      <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                    </div>
                  </td>
                </tr>
              ) : sortedEmployees.length > 0 ? (
                sortedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-muted/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm ring-1 ring-primary/20">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{emp.name}</div>
                          <div className="text-xs text-muted-foreground">{emp.job_role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border/50 shadow-sm">
                        {emp.departments?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge level={emp.risk_level} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-bold ${emp.risk_score && emp.risk_score > 70 ? 'text-destructive' : emp.risk_score && emp.risk_score > 30 ? 'text-warning-DEFAULT' : 'text-success-DEFAULT'}`}>
                        {emp.risk_score ? `${emp.risk_score}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link 
                          href={`/dashboard/employees/${emp.id}`}
                          className="btn-secondary h-8 px-3 text-xs"
                        >
                          View Profile
                        </Link>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground bg-muted/20">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-12 h-12 mb-4 text-muted-foreground/30" />
                      <h3 className="text-lg font-bold text-foreground mb-1">No employees found</h3>
                      <p className="text-sm mb-4">Try adjusting your search filters or add a new employee.</p>
                      <button onClick={() => { setSearch(''); setFilterDept('All'); setFilterRisk('All'); }} className="btn-secondary">
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Followup, Employee } from '@/lib/types';
import { CheckSquare, Plus, Clock, Edit2, Trash2, X, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function FollowupsPage() {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFollowup, setEditingFollowup] = useState<Followup | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    employee_id: '',
    action_type: 'Salary Review',
    status: 'Pending',
    due_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: followupsData } = await supabase
      .from('followups')
      .select('*, employees(id, name, job_role, risk_level, risk_score)')
      .order('due_date', { ascending: true });

    if (followupsData) setFollowups(followupsData as any);

    const { data: empData } = await supabase
      .from('employees')
      .select('id, name, risk_score')
      .order('name');
      
    if (empData) setEmployees(empData as any);
    
    setLoading(false);
  }

  const handleOpenModal = (followup?: Followup) => {
    if (followup) {
      setEditingFollowup(followup);
      setFormData({
        employee_id: followup.employee_id,
        action_type: followup.action_type,
        status: followup.status,
        due_date: followup.due_date || '',
        notes: followup.notes || ''
      });
    } else {
      setEditingFollowup(null);
      setFormData({
        employee_id: employees.length > 0 ? employees[0].id : '',
        action_type: 'Salary Review',
        status: 'Pending',
        due_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingFollowup(null);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const payload: any = {
        employee_id: formData.employee_id,
        action_type: formData.action_type,
        status: formData.status,
        due_date: formData.due_date ? formData.due_date : null,
        notes: formData.notes
      };

      if (editingFollowup) {
        // If changing to Completed, snapshot the risk score
        if (formData.status === 'Completed' && editingFollowup.status !== 'Completed') {
          const emp = employees.find(e => e.id === formData.employee_id);
          payload.risk_score_after = emp?.risk_score || null;
          payload.completed_at = new Date().toISOString();
        }

        const { error } = await supabase.from('followups').update(payload).eq('id', editingFollowup.id);
        if (error) throw error;
        showToast('success', 'Follow-up updated successfully');
      } else {
        // New Followup - snapshot current risk score as 'before'
        const emp = employees.find(e => e.id === formData.employee_id);
        payload.risk_score_before = emp?.risk_score || null;
        
        if (formData.status === 'Completed') {
          payload.risk_score_after = emp?.risk_score || null;
          payload.completed_at = new Date().toISOString();
        }

        const { error } = await supabase.from('followups').insert([payload]);
        if (error) throw error;
        showToast('success', 'Follow-up created successfully');
      }
      
      await fetchData();
      handleCloseModal();
    } catch (err: any) {
      showToast('error', err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this follow-up?')) return;
    
    try {
      const { error } = await supabase.from('followups').delete().eq('id', id);
      if (error) throw error;
      showToast('success', 'Follow-up deleted successfully');
      await fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string, empId: string) => {
    try {
      const payload: any = { status: newStatus };
      if (newStatus === 'Completed') {
        const emp = employees.find(e => e.id === empId);
        payload.risk_score_after = emp?.risk_score || null;
        payload.completed_at = new Date().toISOString();
      }
      const { error } = await supabase.from('followups').update(payload).eq('id', id);
      if (error) throw error;
      showToast('success', `Status updated to ${newStatus}`);
      await fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update status');
    }
  };

  const activeFollowups = followups.filter(f => f.status !== 'Completed' && f.status !== 'Cancelled');
  const pastFollowups = followups.filter(f => f.status === 'Completed' || f.status === 'Cancelled').reverse();

  return (
    <div className="space-y-6 pb-12 relative">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border flex items-center transition-all animate-fade-in ${
          toast.type === 'success' ? 'bg-success-light border-success-DEFAULT/20 text-success-DEFAULT' : 'bg-destructive-light border-destructive/20 text-destructive'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertTriangle className="w-5 h-5 mr-2" />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Retention Follow-ups</h1>
          <p className="text-muted-foreground mt-1">Track retention actions, intervention progress, and risk improvement.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" /> New Follow-up
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Follow-ups */}
        <div className="card p-6 min-h-[400px] border-border bg-card">
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-warning-DEFAULT" /> Active Interventions
          </h2>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-xl"></div>)}
            </div>
          ) : activeFollowups.length > 0 ? (
            <div className="space-y-4">
              {activeFollowups.map(fup => (
                <div key={fup.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-foreground">{fup.employees?.name || 'Unknown Employee'}</h3>
                      <p className="text-sm font-medium text-primary mt-0.5">{fup.action_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleOpenModal(fup)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors bg-muted/50 rounded-md">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(fup.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors bg-muted/50 rounded-md">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{fup.notes}</p>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground font-medium">
                      {fup.due_date ? `Due: ${new Date(fup.due_date).toLocaleDateString()}` : 'No due date'}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      fup.status === 'In Progress' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {fup.status}
                    </span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border flex gap-2">
                    <button onClick={() => handleStatusChange(fup.id, 'In Progress', fup.employee_id)} className="flex-1 py-1.5 text-xs font-bold bg-primary/10 text-primary rounded-md hover:bg-primary hover:text-primary-foreground transition-colors">
                      Mark In Progress
                    </button>
                    <button onClick={() => handleStatusChange(fup.id, 'Completed', fup.employee_id)} className="flex-1 py-1.5 text-xs font-bold bg-success-light text-success-DEFAULT rounded-md hover:bg-success-DEFAULT hover:text-success-foreground transition-colors">
                      Mark Completed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 h-full flex flex-col items-center justify-center text-center py-12">
              <CheckSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">No active follow-ups</p>
              <button onClick={() => handleOpenModal()} className="mt-4 text-sm text-primary font-medium hover:underline">Create an action item</button>
            </div>
          )}
        </div>

        {/* Follow-up History & Progress */}
        <div className="card p-6 min-h-[400px] border-border bg-card">
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-success-DEFAULT" /> Timeline & Progress
          </h2>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl"></div>)}
            </div>
          ) : pastFollowups.length > 0 ? (
            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {pastFollowups.map((fup, index) => (
                <div key={fup.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                  
                  {/* Timeline dot */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${
                    fup.status === 'Completed' ? 'bg-success-DEFAULT' : 'bg-muted-foreground'
                  }`}>
                    {fup.status === 'Completed' ? <CheckCircle2 className="w-4 h-4 text-success-foreground" /> : <X className="w-4 h-4 text-muted" />}
                  </div>
                  
                  {/* Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-foreground text-sm">{fup.employees?.name}</p>
                      <time className="text-xs text-muted-foreground/70">{fup.completed_at ? new Date(fup.completed_at).toLocaleDateString() : 'N/A'}</time>
                    </div>
                    <p className="text-sm font-medium text-primary mb-2">{fup.action_type}</p>
                    
                    {fup.status === 'Completed' && fup.risk_score_before !== null && fup.risk_score_after !== null && (
                      <div className="bg-muted/30 rounded border border-border p-2 mt-2 flex items-center justify-center gap-3">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Before</p>
                          <p className="text-sm font-bold text-foreground">{fup.risk_score_before}%</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">After</p>
                          <p className={`text-sm font-bold ${fup.risk_score_after < fup.risk_score_before ? 'text-success-DEFAULT' : 'text-destructive'}`}>
                            {fup.risk_score_after}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 h-full flex flex-col items-center justify-center text-center py-12">
              <p className="text-muted-foreground font-medium">No completed follow-ups yet.</p>
            </div>
          )}
        </div>

      </div>

      {/* Schedule/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-border">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">{editingFollowup ? 'Edit Follow-up' : 'New Follow-up'}</h3>
              <button onClick={handleCloseModal} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Employee</label>
                <select 
                  className="input-field" 
                  value={formData.employee_id} 
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  required
                >
                  <option value="" disabled>Select an employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Action Type</label>
                <select 
                  className="input-field" 
                  value={formData.action_type} 
                  onChange={(e) => setFormData({...formData, action_type: e.target.value})}
                  required
                >
                  <option value="Salary Review">Salary Review</option>
                  <option value="Workload Reduction">Workload Reduction</option>
                  <option value="Career Discussion">Career Discussion</option>
                  <option value="Mentorship Assignment">Mentorship Assignment</option>
                  <option value="Internal Transfer">Internal Transfer</option>
                  <option value="Flexible Hours">Flexible Hours</option>
                  <option value="Training Program">Training Program</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={formData.due_date} 
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                  <select 
                    className="input-field" 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                <textarea 
                  className="input-field min-h-[80px]" 
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Details about the action..."
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : editingFollowup ? 'Update Follow-up' : 'Create Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

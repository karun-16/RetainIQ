'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, Clock, Video, Mail, Search, Plus, 
  Trash2, X, AlertTriangle, Link as LinkIcon, 
  Copy, Edit2, User, FileText, CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { Meeting, Employee } from '@/lib/types';
import jsPDF from 'jspdf';
import * as ics from 'ics';

type MeetingFormData = {
  employee_id: string;
  meeting_type: string;
  title: string;
  reason: string;
  description: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  meeting_platform: string;
  meeting_link: string;
  priority: string;
  status: string;
  send_email: boolean;
  attach_pdf: boolean;
  attach_ics: boolean;
};

const initialFormData: MeetingFormData = {
  employee_id: '',
  meeting_type: 'Retention Discussion',
  title: '',
  reason: 'High Attrition Risk',
  description: '',
  scheduled_date: new Date().toISOString().split('T')[0],
  scheduled_time: '10:00',
  duration_minutes: 30,
  meeting_platform: 'Google Meet',
  meeting_link: '',
  priority: 'High',
  status: 'Scheduled',
  send_email: true,
  attach_pdf: true,
  attach_ics: true,
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isValidLink = (link: string | undefined | null) => {
    if (!link) return false;
    try {
      const url = new URL(link);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };
  const [formData, setFormData] = useState<MeetingFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    checkGoogleAuth();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  async function checkGoogleAuth() {
    try {
      const res = await fetch('/api/auth/google/status');
      const data = await res.json();
      setGoogleConnected(data.connected);
    } catch {
      setGoogleConnected(false);
    }
  }

  async function fetchData() {
    setLoading(true);
    const { data: meetingsData, error: meetingsError } = await supabase
      .from('meetings')
      .select('*, employees(id, name, job_role, risk_score, risk_level, performance_rating, department_id, departments(name))')
      .order('scheduled_at', { ascending: false });
    
    if (meetingsError) {
      console.error('Meetings fetch error:', meetingsError);
    }
    if (meetingsData) setMeetings(meetingsData as any[]);

    const { data: empData, error: empError } = await supabase
      .from('employees')
      .select('id, name, job_role, risk_level, risk_score, department_id, departments(name), performance_rating')
      .order('name');
      
    if (empError) {
      console.error('Employees fetch error:', empError);
    }
    if (empData) setEmployees(empData as any[]);
    setLoading(false);
  }

  const handleOpenModal = (meeting?: Meeting) => {
    if (meeting) {
      setEditingMeeting(meeting);
      const d = new Date(meeting.scheduled_at);
      const notes = parseNotes(meeting.notes);
      setFormData({
        employee_id: meeting.employee_id,
        meeting_type: meeting.meeting_type,
        title: notes.title || meeting.meeting_type,
        reason: notes.reason || 'Routine Check-in',
        description: notes.description || '',
        scheduled_date: d.toISOString().split('T')[0],
        scheduled_time: d.toTimeString().substring(0,5),
        duration_minutes: notes.duration || 30,
        meeting_platform: notes.platform || 'Google Meet',
        meeting_link: notes.meeting_link || '',
        priority: notes.priority || 'Medium',
        status: meeting.status,
        send_email: false,
        attach_pdf: false,
        attach_ics: false,
      });
    } else {
      setEditingMeeting(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingMeeting(null);
    setFormData(initialFormData);
  }

  const parseNotes = (notes: string | null) => {
    if (!notes) return {};
    try {
      return JSON.parse(notes);
    } catch {
      return { description: notes };
    }
  };

  const generatePDFBase64 = (emp: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text('RetainIQ Employee Report', 20, 20);
        
        doc.setFontSize(14);
        doc.text(`Employee: ${emp.name}`, 20, 40);
        doc.text(`Role: ${emp.job_role}`, 20, 50);
        
        doc.setFontSize(12);
        doc.text(`Risk Score: ${emp.risk_score}% (${emp.risk_level})`, 20, 70);
        doc.text(`Performance Rating: ${emp.performance_rating}/4`, 20, 80);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Generated for internal HR retention meetings.', 20, 100);
        doc.text('CONFIDENTIAL', 20, 110);
        
        const base64String = btoa(doc.output());
        resolve(base64String);
      } catch (e) {
        reject(e);
      }
    });
  };

  const generateICSBase64 = (empName: string, empEmail: string, dateStr: string, timeStr: string, duration: number, title: string, desc: string, link: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hour, minute] = timeStr.split(':').map(Number);

      const event: ics.EventAttributes = {
        title,
        description: desc + (link ? `\n\nMeeting Link: ${link}` : ''),
        location: link || 'Remote',
        ...(link ? { url: link } : {}),
        start: [year, month, day, hour, minute],
        duration: { minutes: duration },
        status: 'CONFIRMED',
        organizer: { name: 'HR Department', email: 'hr@retainiq.example.com' },
        attendees: [
          { name: empName, email: empEmail, rsvp: true, role: 'REQ-PARTICIPANT' as const }
        ]
      };

      const { error, value } = ics.createEvent(event);
      if (error || !value) {
        reject(error);
      } else {
        resolve(btoa(unescape(encodeURIComponent(value))));
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.scheduled_date || !formData.scheduled_time) {
        throw new Error("Date and Time are required.");
      }

      const scheduled_at = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`).toISOString();
      const end_at = new Date(new Date(scheduled_at).getTime() + formData.duration_minutes * 60000).toISOString();
      
      const emp = employees.find(e => e.id === formData.employee_id);
      if (!emp) throw new Error("Employee not found");

      let finalMeetLink = formData.meeting_link;
      let eventId = '';

      // If Google Workspace is connected and this is a new meeting, create Calendar & Meet via API
      if (!editingMeeting && googleConnected && (formData.meeting_platform === 'Google Meet' || formData.send_email)) {
        
        let pdfAttachmentBase64 = '';
        let icsAttachmentBase64 = '';
        
        if (formData.attach_pdf) {
          pdfAttachmentBase64 = await generatePDFBase64(emp);
        }
        if (formData.attach_ics) {
          const empEmail = emp.email || `${emp.name.replace(/\s+/g, '.').toLowerCase()}@retainiq.example.com`;
          icsAttachmentBase64 = await generateICSBase64(emp.name, empEmail, formData.scheduled_date, formData.scheduled_time, formData.duration_minutes, formData.title || formData.meeting_type, formData.description, finalMeetLink);
        }

        const res = await fetch('/api/google/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeName: emp.name,
            employeeEmail: emp.email || `${emp.name.replace(/\s+/g, '.').toLowerCase()}@retainiq.example.com`,
            title: formData.title || formData.meeting_type,
            reason: formData.reason,
            description: formData.description,
            startDateTime: scheduled_at,
            endDateTime: end_at,
            platform: formData.meeting_platform,
            sendEmail: formData.send_email,
            pdfAttachmentBase64,
            icsAttachmentBase64
          })
        });

        const data = await res.json();
        if (!res.ok) {
          const errMsg = data.error || '';
          if (errMsg.includes('invalid') || errMsg.includes('regex')) {
            throw new Error("Unable to schedule: Please verify the meeting details and try again.");
          }
          throw new Error(errMsg || 'Failed to schedule via Google Workspace');
        }

        if (data.meetLink) finalMeetLink = data.meetLink;
        if (data.eventId) eventId = data.eventId;
      } else if (!googleConnected && formData.meeting_platform === 'Google Meet') {
        throw new Error("Google account disconnected. Reconnect to continue using Calendar, Meet and Gmail.");
      }

      const notesObj = {
        title: formData.title,
        reason: formData.reason,
        description: formData.description,
        platform: formData.meeting_platform,
        meeting_link: finalMeetLink,
        priority: formData.priority,
        duration: formData.duration_minutes,
        google_event_id: eventId
      };

      const meetingData = {
        employee_id: formData.employee_id,
        meeting_type: formData.meeting_type,
        scheduled_at,
        status: editingMeeting ? formData.status : 'Scheduled',
        notes: JSON.stringify(notesObj)
      };

      if (editingMeeting) {
        const { error } = await supabase
          .from('meetings')
          .update(meetingData)
          .eq('id', editingMeeting.id);
        if (error) throw error;
        showToast('Meeting updated successfully.');
      } else {
        const { error } = await supabase
          .from('meetings')
          .insert([meetingData]);
        if (error) throw error;
        showToast('Meeting scheduled & invites sent successfully.');
      }

      await fetchData();
      handleCloseModal();
    } catch (error: any) {
      showToast(error.message || 'An error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, notesString: string | null) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    try {
      const notes = parseNotes(notesString);
      // In a full implementation, we'd also delete the Google Calendar event here using `/api/google/calendar/delete`
      const { error } = await supabase.from('meetings').delete().eq('id', id);
      if (error) throw error;
      showToast('Meeting deleted.');
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete meeting', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast('Meeting link copied to clipboard.');
  };

  const filteredMeetings = meetings.filter(m => 
    m.employees?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.meeting_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (parseNotes(m.notes).title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?';

  return (
    <div className="space-y-6 pb-12 relative">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border flex items-center animate-fade-in ${
          toast.type === 'error' 
            ? 'bg-destructive-light border-destructive/20 text-destructive' 
            : 'bg-success-light border-success/20 text-success'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage retention discussions with Google Workspace integration.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center h-10 px-4">
          <Plus className="w-4 h-4 mr-2" /> Schedule Meeting
        </button>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center">
        <Search className="w-5 h-5 text-muted-foreground mr-3" />
        <input 
          type="text"
          placeholder="Search by employee name or meeting title..."
          className="bg-transparent border-none focus:outline-none flex-1 text-sm text-foreground"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMeetings.map(meeting => {
            const notes = parseNotes(meeting.notes);
            const emp = meeting.employees;
            const d = new Date(meeting.scheduled_at);
            const isPast = d < new Date() && meeting.status !== 'Completed';

            return (
              <div key={meeting.id} className="card p-0 flex flex-col hover:border-primary/30 transition-colors group">
                <div className="p-5 border-b border-border/50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-1">{notes.title || meeting.meeting_type}</h3>
                      <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">{notes.reason || 'General'}</p>
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${
                      meeting.status === 'Completed' ? 'bg-success/10 text-success' : 
                      isPast ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                    }`}>
                      {isPast ? 'Overdue' : meeting.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                      {getInitials(emp?.name || '')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{emp?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{emp?.job_role || 'Employee'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-muted/10 flex-1 space-y-3">
                  <div className="flex items-center text-sm text-foreground">
                    <Calendar className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span className="font-medium">{d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center text-sm text-foreground">
                    <Clock className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span className="font-medium">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({notes.duration || 30}m)</span>
                  </div>
                  <div className="flex items-center text-sm text-foreground">
                    <Video className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span className="font-medium">{notes.platform || 'Google Meet'}</span>
                  </div>
                  {notes.google_event_id && (
                    <div className="flex items-center text-sm text-success">
                      <CheckCircle2 className="w-4 h-4 mr-3 text-success" />
                      <span className="font-medium text-xs">Google Calendar Synced</span>
                    </div>
                  )}
                  {notes.priority && (
                    <div className="flex items-center text-sm text-foreground">
                      <AlertTriangle className={`w-4 h-4 mr-3 ${notes.priority === 'High' ? 'text-destructive' : 'text-warning'}`} />
                      <span className="font-medium">{notes.priority} Priority</span>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-border flex flex-wrap gap-2 justify-between bg-card rounded-b-xl">
                  {notes.meeting_link && meeting.status !== 'Completed' ? (
                    isValidLink(notes.meeting_link) ? (
                      <a href={notes.meeting_link} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs py-1.5 px-3 flex-1 flex justify-center">
                        <Video className="w-3.5 h-3.5 mr-1.5" /> Join {notes.platform === 'Google Meet' ? 'Meet' : 'Meeting'}
                      </a>
                    ) : (
                      <button type="button" className="btn-secondary text-xs py-1.5 px-3 flex-1 flex justify-center items-center text-warning cursor-not-allowed opacity-80" title="Invalid meeting link provided">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Invalid Link
                      </button>
                    )
                  ) : (
                    <button disabled className="btn-secondary text-xs py-1.5 px-3 flex-1 opacity-50 cursor-not-allowed">
                      {meeting.status === 'Completed' ? 'Completed' : 'No Link'}
                    </button>
                  )}
                  
                  <button onClick={() => copyToClipboard(notes.meeting_link)} className="btn-secondary text-xs py-1.5 px-2.5" title="Copy Link">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleOpenModal(meeting)} className="btn-secondary text-xs py-1.5 px-2.5" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(meeting.id, meeting.notes)} className="btn-secondary text-xs py-1.5 px-2.5 text-destructive hover:bg-destructive/10 border-destructive/20" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredMeetings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-dashed border-border rounded-xl">
          <Calendar className="w-16 h-16 text-muted mb-4" />
          <h3 className="text-lg font-bold text-foreground">No meetings found</h3>
          <p className="text-muted-foreground mt-2 mb-6">Schedule a meeting to proactively discuss retention with at-risk employees.</p>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            Schedule First Meeting
          </button>
        </div>
      )}

      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div ref={modalRef} className="bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-full animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border bg-muted/10 sticky top-0 z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                    {editingMeeting ? 'Edit Meeting' : 'Schedule Meeting'}
                  </h2>
                  <p className="text-sm text-muted-foreground">Setup a retention or performance discussion.</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {!googleConnected && (
                 <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-warning text-sm">Google Workspace Disconnected</h4>
                      <p className="text-xs text-warning/80 mt-1">Automatic calendar invites and Meet links are disabled. Please connect your Google account in Settings.</p>
                    </div>
                 </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-5 rounded-xl border border-border/50">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                      Employee <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      {loading ? (
                        <div className="input-field pl-10 flex items-center bg-muted/50 text-muted-foreground pointer-events-none">Loading employees...</div>
                      ) : employees.length === 0 ? (
                        <div className="input-field pl-10 flex items-center bg-muted/50 text-muted-foreground pointer-events-none">No employees found</div>
                      ) : (
                        <select 
                          className="input-field pl-10 appearance-none bg-background" 
                          value={formData.employee_id} 
                          onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                          required
                          disabled={!!editingMeeting}
                        >
                          <option value="">-- Select Employee --</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.departments?.name ? `${emp.departments.name} / ` : ''}{emp.job_role})</option>
                          ))}
                        </select>
                      )}
                      {!loading && employees.length > 0 && <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                      Meeting Type
                    </label>
                    <select 
                      className="input-field bg-background" 
                      value={formData.meeting_type} 
                      onChange={(e) => setFormData({...formData, meeting_type: e.target.value})}
                    >
                      <option value="Retention Discussion">Retention Discussion</option>
                      <option value="Stay Interview">Stay Interview</option>
                      <option value="Performance Review">Performance Review</option>
                      <option value="1-on-1 Check-in">1-on-1 Check-in</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                      Reason
                    </label>
                    <select 
                      className="input-field bg-background" 
                      value={formData.reason} 
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    >
                      <option value="High Attrition Risk">High Attrition Risk</option>
                      <option value="Compensation Concern">Compensation Concern</option>
                      <option value="Career Growth">Career Growth</option>
                      <option value="Routine Check-in">Routine Check-in</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                      Priority
                    </label>
                    <select 
                      className="input-field bg-background" 
                      value={formData.priority} 
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Meeting Details</h3>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Meeting Title <span className="text-destructive">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Q3 Career Growth Discussion"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Agenda & Description
                  </label>
                  <textarea 
                    className="input-field min-h-[100px] resize-y leading-relaxed" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Outline the talking points for this meeting..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Scheduling</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                      Date <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        type="date" 
                        className="input-field pl-10" 
                        value={formData.scheduled_date} 
                        onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                      Time <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        type="time" 
                        className="input-field pl-10" 
                        value={formData.scheduled_time} 
                        onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                      Duration
                    </label>
                    <select 
                      className="input-field" 
                      value={formData.duration_minutes} 
                      onChange={(e) => setFormData({...formData, duration_minutes: Number(e.target.value)})}
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>1 Hour</option>
                      <option value={90}>1.5 Hours</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Location</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                      Platform
                    </label>
                    <select 
                      className="input-field" 
                      value={formData.meeting_platform} 
                      onChange={(e) => setFormData({...formData, meeting_platform: e.target.value, meeting_link: e.target.value === 'Offline' ? '' : formData.meeting_link})}
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Offline">Offline / In-Person</option>
                    </select>
                  </div>
                  {formData.meeting_platform !== 'Offline' && (
                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          Meeting Link
                        </label>
                        {formData.meeting_platform === 'Google Meet' && (
                          <span className="text-xs text-muted-foreground font-medium flex items-center">
                            <Video className="w-3 h-3 mr-1" /> {googleConnected ? 'Auto-generated by Google' : 'Manual Link'}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                          type="url"
                          className="input-field pl-10" 
                          value={formData.meeting_link} 
                          onChange={(e) => setFormData({...formData, meeting_link: e.target.value})}
                          placeholder={formData.meeting_platform === 'Google Meet' ? "Leave blank to auto-generate Meet URL" : "https://..."}
                          readOnly={googleConnected && formData.meeting_platform === 'Google Meet' && !editingMeeting}
                          required={formData.meeting_platform === 'Zoom' || formData.meeting_platform === 'Microsoft Teams'}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!editingMeeting && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Communication</h3>
                  <div className="bg-muted/10 border border-border rounded-xl p-4 space-y-4">
                    <label className="flex items-start cursor-pointer group">
                      <div className="flex items-center h-5">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-input text-primary focus:ring-primary bg-background"
                          checked={formData.send_email}
                          onChange={(e) => setFormData({...formData, send_email: e.target.checked})}
                          disabled={!googleConnected}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors block mb-0.5">Send Automatic Invite via Gmail API</span>
                        <span className="text-muted-foreground block leading-snug">Automatically emails the employee using your connected Google account.</span>
                      </div>
                    </label>

                    {formData.send_email && googleConnected && (
                      <div className="ml-7 space-y-3 pl-3 border-l-2 border-border/50">
                        <label className="flex items-start cursor-pointer group">
                          <div className="flex items-center h-5">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-input text-primary focus:ring-primary bg-background"
                              checked={formData.attach_pdf}
                              onChange={(e) => setFormData({...formData, attach_pdf: e.target.checked})}
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <span className="font-medium text-foreground block">Attach Employee Report (.pdf)</span>
                          </div>
                        </label>
                        <label className="flex items-start cursor-pointer group">
                          <div className="flex items-center h-5">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-input text-primary focus:ring-primary bg-background"
                              checked={formData.attach_ics}
                              onChange={(e) => setFormData({...formData, attach_ics: e.target.checked})}
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <span className="font-medium text-foreground block">Attach Calendar Invite (.ics)</span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editingMeeting && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Status Update</h3>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Current Status</label>
                    <select 
                      className="input-field max-w-xs" 
                      value={formData.status} 
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Rescheduled">Rescheduled</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              )}

            </form>

            <div className="p-6 border-t border-border bg-muted/10 rounded-b-2xl flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={handleCloseModal} 
                className="btn-secondary h-10 px-6 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSubmit} 
                disabled={submitting} 
                className="btn-primary h-10 px-8 shadow-md w-full sm:w-auto flex items-center justify-center"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" /> Saving...</>
                ) : editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

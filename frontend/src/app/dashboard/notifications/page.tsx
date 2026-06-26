'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, AlertTriangle, Calendar, CheckSquare, Clock, X, Check, Trash2 } from 'lucide-react';
import Link from 'next/link';

type NotificationItem = {
  id: string;
  type: 'risk' | 'meeting' | 'followup';
  title: string;
  message: string;
  date: Date;
  link: string;
  priority: 'high' | 'medium' | 'low';
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'risk' | 'meeting' | 'followup'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load state from local storage
    const savedRead = localStorage.getItem('retainiq_read_notifications');
    const savedDeleted = localStorage.getItem('retainiq_deleted_notifications');
    if (savedRead) setReadIds(new Set(JSON.parse(savedRead)));
    if (savedDeleted) setDeletedIds(new Set(JSON.parse(savedDeleted)));

    async function fetchNotifications() {
      const items: NotificationItem[] = [];
      const now = new Date();

      // 1. High Risk Alerts
      const { data: highRisk } = await supabase
        .from('employees')
        .select('id, name, risk_score')
        .eq('risk_level', 'High');
        
      if (highRisk) {
        highRisk.forEach(emp => {
          items.push({
            id: `risk-${emp.id}`,
            type: 'risk',
            title: `High Attrition Risk Detected`,
            message: `${emp.name} has a critical risk score of ${emp.risk_score}%. Intervention recommended.`,
            date: new Date(),
            link: `/dashboard/employees/${emp.id}`,
            priority: 'high'
          });
        });
      }

      // 2. Upcoming Meetings (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      
      const { data: meetings } = await supabase
        .from('meetings')
        .select('id, scheduled_at, meeting_type, employees(name)')
        .eq('status', 'Scheduled')
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', nextWeek.toISOString());

      if (meetings) {
        meetings.forEach((m: any) => {
          items.push({
            id: `mtg-${m.id}`,
            type: 'meeting',
            title: `Upcoming: ${m.meeting_type}`,
            message: `Scheduled meeting with ${m.employees?.name} on ${new Date(m.scheduled_at).toLocaleDateString()}.`,
            date: new Date(m.scheduled_at),
            link: '/dashboard/meetings',
            priority: 'medium'
          });
        });
      }

      // 3. Overdue or Due Soon Follow-ups
      const { data: followups } = await supabase
        .from('followups')
        .select('id, action_type, due_date, status, employees(name)')
        .in('status', ['Pending', 'In Progress']);

      if (followups) {
        followups.forEach((f: any) => {
          if (!f.due_date) return;
          const dueDate = new Date(f.due_date);
          const isOverdue = dueDate < now;
          
          if (isOverdue || dueDate <= nextWeek) {
            items.push({
              id: `fup-${f.id}`,
              type: 'followup',
              title: isOverdue ? 'Overdue Action Item' : 'Action Item Due Soon',
              message: `${f.action_type} for ${f.employees?.name} is due ${isOverdue ? 'and past its deadline' : 'soon'}.`,
              date: dueDate,
              link: '/dashboard/followups',
              priority: isOverdue ? 'high' : 'medium'
            });
          }
        });
      }

      items.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        return b.date.getTime() - a.date.getTime();
      });

      setNotifications(items);
      setLoading(false);
    }

    fetchNotifications();
  }, []);

  const markAsRead = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newSet = new Set(readIds);
    newSet.add(id);
    setReadIds(newSet);
    localStorage.setItem('retainiq_read_notifications', JSON.stringify(Array.from(newSet)));
  };

  const markAllAsRead = () => {
    const newSet = new Set(readIds);
    notifications.forEach(n => newSet.add(n.id));
    setReadIds(newSet);
    localStorage.setItem('retainiq_read_notifications', JSON.stringify(Array.from(newSet)));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newSet = new Set(deletedIds);
    newSet.add(id);
    setDeletedIds(newSet);
    localStorage.setItem('retainiq_deleted_notifications', JSON.stringify(Array.from(newSet)));
  };

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-10 bg-muted rounded w-1/4"></div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-xl"></div>)}
      </div>
    </div>;
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'risk': return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'meeting': return <Calendar className="w-5 h-5 text-primary" />;
      case 'followup': return <CheckSquare className="w-5 h-5 text-warning-DEFAULT" />;
      default: return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const visibleNotifications = notifications
    .filter(n => !deletedIds.has(n.id))
    .filter(n => activeCategory === 'all' || n.type === activeCategory);

  const unreadCount = visibleNotifications.filter(n => !readIds.has(n.id)).length;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Smart alerts for risk changes, upcoming meetings, and overdue actions.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-secondary flex items-center text-sm py-1.5 px-3">
            <Check className="w-4 h-4 mr-1.5" /> Mark all as read
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'risk', label: 'Risk Alerts' },
          { id: 'meeting', label: 'Meetings' },
          { id: 'followup', label: 'Action Items' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              activeCategory === cat.id 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="card p-2 sm:p-6 bg-muted/20">
        {visibleNotifications.length > 0 ? (
          <div className="space-y-3">
            {visibleNotifications.map(note => {
              const isRead = readIds.has(note.id);
              return (
                <Link key={note.id} href={note.link} className={`block p-4 rounded-xl border hover:shadow-md transition-all group ${
                  isRead ? 'bg-background/60 border-border opacity-70' : 'bg-background border-border shadow-sm'
                }`}>
                  <div className="flex gap-4">
                    <div className={`mt-1 p-2 rounded-full h-fit flex-shrink-0 ${
                      note.type === 'risk' ? 'bg-destructive-light' :
                      note.type === 'meeting' ? 'bg-primary/10' :
                      'bg-warning-light'
                    }`}>
                      {getIcon(note.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold ${note.priority === 'high' && !isRead ? 'text-destructive' : 'text-foreground'}`}>
                            {note.title}
                          </h3>
                          {!isRead && <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {note.date.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {note.message}
                      </p>
                      
                      {/* Action buttons (appear on hover) */}
                      <div className="flex gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isRead && (
                          <button onClick={(e) => markAsRead(note.id, e)} className="text-xs font-medium text-primary hover:underline flex items-center">
                            <Check className="w-3 h-3 mr-1" /> Mark as read
                          </button>
                        )}
                        <button onClick={(e) => deleteNotification(note.id, e)} className="text-xs font-medium text-destructive hover:underline flex items-center">
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="w-16 h-16 text-muted mb-4" />
            <h3 className="text-lg font-bold text-foreground">You're all caught up!</h3>
            <p className="text-muted-foreground mt-2">No new alerts or pending items in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

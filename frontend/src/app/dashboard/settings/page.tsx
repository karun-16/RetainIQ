'use client';

import { useState, useEffect } from 'react';
import { Settings, Server, Bell, Shield, Key, Save, CheckCircle2 } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string, type?: 'success' | 'error' } | null>(null);
  const { theme, setTheme } = useTheme();

  // Google Integration State
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleUser, setGoogleUser] = useState<{ email?: string, name?: string, picture?: string } | null>(null);
  const [checkingGoogle, setCheckingGoogle] = useState(true);

  // Settings State
  const [formData, setFormData] = useState({
    fastapiUrl: 'http://localhost:8000',
    modelThresholdHigh: 70,
    modelThresholdMedium: 40,
    emailAlerts: true,
    weeklyReport: true,
    twoFactorAuth: false
  });

  useEffect(() => {
    // Load from localStorage if exists
    const stored = localStorage.getItem('retainiq_settings');
    if (stored) {
      try {
        setFormData(prev => ({ ...prev, ...JSON.parse(stored) }));
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }

    // Check Google Auth Status
    fetch('/api/auth/google/status')
      .then(res => res.json())
      .then(data => {
        if (data.connected) {
          setGoogleConnected(true);
          setGoogleUser(data.user);
        }
      })
      .catch(console.error)
      .finally(() => setCheckingGoogle(false));

    // Check URL for callback messages
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_sync') === 'success') {
      setToast({ message: 'Google account connected successfully', type: 'success' });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('error')) {
      setToast({ message: `Google connect failed: ${params.get('error')}`, type: 'error' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    setLoading(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'theme') {
      setTheme(value);
      return;
    }

    let finalValue: any = value;
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = Number(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    
    localStorage.setItem('retainiq_settings', JSON.stringify(formData));
    
    setSaving(false);
    setToast({ message: 'Settings saved successfully', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGoogleConnect = () => {
    window.location.href = '/api/auth/google';
  };

  const handleGoogleDisconnect = async () => {
    try {
      await fetch('/api/auth/google/disconnect', { method: 'POST' });
      setGoogleConnected(false);
      setGoogleUser(null);
      setToast({ message: 'Google account disconnected', type: 'success' });
    } catch (e) {
      setToast({ message: 'Failed to disconnect', type: 'error' });
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-10 bg-muted rounded w-1/4"></div>
      <div className="h-[500px] bg-muted rounded-xl"></div>
    </div>;
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'ml', label: 'ML Model & API', icon: Server },
    { id: 'integrations', label: 'Integrations', icon: Server }, // Using Server as placeholder for Integration icon, we can import another
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto relative">
      
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 border rounded-lg shadow-lg flex items-center transition-all animate-fade-in ${
          toast.type === 'error' ? 'bg-destructive-light border-destructive/20 text-destructive' : 'bg-success-light border-success/20 text-success'
        }`}>
          <CheckCircle2 className="w-5 h-5 mr-2" />
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage system preferences, ML model thresholds, and integrations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="card p-2 flex flex-row md:flex-col gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <tab.icon className={`w-5 h-5 mr-3 ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <form onSubmit={handleSave} className="card p-6 min-h-[500px]">
            
            <div className="mb-8 flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-foreground">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <button type="submit" disabled={saving} className="btn-primary flex items-center px-6">
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {activeTab === 'general' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">Company Name</label>
                  <input type="text" className="input-field max-w-md" defaultValue="Acme Corp" disabled />
                  <p className="text-xs text-muted-foreground mt-1">Managed by SSO provider.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">Theme Preference</label>
                  <select name="theme" value={theme} onChange={handleChange} className="input-field max-w-md bg-background">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">Language</label>
                  <select className="input-field max-w-md bg-background" defaultValue="en">
                    <option value="en">English (US)</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'ml' && (
              <div className="space-y-8 animate-fade-in">
                
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide border-b pb-2 mb-4">FastAPI Inference Server</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-1 flex items-center">
                        <Key className="w-4 h-4 mr-2 text-muted-foreground" /> Endpoint URL
                      </label>
                      <input 
                        type="url" name="fastapiUrl" 
                        value={formData.fastapiUrl} onChange={handleChange} 
                        className="input-field max-w-md font-mono text-sm bg-background" 
                      />
                      <p className="text-xs text-muted-foreground mt-1">URL of the FastAPI server running the ML model (`/predict`, `/whatif`).</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide border-b pb-2 mb-4 mt-8">Risk Thresholds</h3>
                  <p className="text-sm text-muted-foreground mb-4">Define the percentage at which an employee is flagged for specific risk bands.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                    <div className="bg-destructive-light p-4 rounded-xl border border-destructive/20">
                      <label className="block text-sm font-bold text-destructive mb-2">High Risk Threshold (%)</label>
                      <input 
                        type="number" name="modelThresholdHigh" 
                        value={formData.modelThresholdHigh} onChange={handleChange} 
                        min="50" max="100" className="input-field border-destructive/20 bg-background" 
                      />
                      <p className="text-xs text-muted-foreground mt-2">Any score above this triggers urgent alerts.</p>
                    </div>

                    <div className="bg-warning-light p-4 rounded-xl border border-warning/20">
                      <label className="block text-sm font-bold text-warning mb-2">Medium Risk Threshold (%)</label>
                      <input 
                        type="number" name="modelThresholdMedium" 
                        value={formData.modelThresholdMedium} onChange={handleChange} 
                        min="20" max="80" className="input-field border-warning/20 bg-background" 
                      />
                      <p className="text-xs text-muted-foreground mt-2">Scores above this are flagged for monitoring.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-8 animate-fade-in">
                
                <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow flex items-center justify-center p-2 border border-gray-100">
                        {/* Placeholder for Google Logo */}
                        <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Google Workspace</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Connect Calendar, Meet, and Gmail for automated scheduling.</p>
                      </div>
                    </div>
                    {checkingGoogle ? (
                      <div className="text-sm text-muted-foreground animate-pulse">Checking...</div>
                    ) : googleConnected ? (
                      <span className="px-3 py-1 bg-success/10 text-success text-xs font-bold uppercase tracking-wide rounded-full border border-success/20">Connected</span>
                    ) : (
                      <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wide rounded-full border border-border">Not Connected</span>
                    )}
                  </div>

                  {googleConnected && googleUser ? (
                    <div className="bg-muted/10 border border-border rounded-lg p-4 mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {googleUser.picture ? (
                          <img src={googleUser.picture} alt="Profile" className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {googleUser.email?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-foreground text-sm">{googleUser.name}</p>
                          <p className="text-xs text-muted-foreground">{googleUser.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-success">✓ Calendar Synced</p>
                        <p className="text-xs font-bold text-success">✓ Meet Enabled</p>
                        <p className="text-xs font-bold text-success">✓ Gmail Authorized</p>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    {googleConnected ? (
                      <>
                        <button type="button" onClick={handleGoogleConnect} className="btn-secondary px-4 py-2 text-sm">
                          Reconnect
                        </button>
                        <button type="button" onClick={handleGoogleDisconnect} className="btn-secondary px-4 py-2 text-sm text-destructive hover:bg-destructive-light border-destructive/20">
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={handleGoogleConnect} className="btn-primary px-6 py-2">
                        Connect Google Account
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-start bg-secondary/50 p-4 rounded-xl border max-w-2xl">
                  <div className="flex items-center h-5">
                    <input 
                      id="emailAlerts" name="emailAlerts" type="checkbox" 
                      checked={formData.emailAlerts} onChange={handleChange} 
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded bg-background" 
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="emailAlerts" className="font-bold text-foreground cursor-pointer">Immediate Email Alerts</label>
                    <p className="text-muted-foreground mt-0.5">Receive an email immediately when an employee&apos;s risk score crosses into the High Risk threshold.</p>
                  </div>
                </div>

                <div className="flex items-start bg-secondary/50 p-4 rounded-xl border max-w-2xl">
                  <div className="flex items-center h-5">
                    <input 
                      id="weeklyReport" name="weeklyReport" type="checkbox" 
                      checked={formData.weeklyReport} onChange={handleChange} 
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded bg-background" 
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="weeklyReport" className="font-bold text-foreground cursor-pointer">Weekly Digest Report</label>
                    <p className="text-muted-foreground mt-0.5">Receive a summary of organizational risk trends and upcoming action items every Monday morning.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-start bg-secondary/50 p-4 rounded-xl border max-w-2xl">
                  <div className="flex items-center h-5">
                    <input 
                      id="twoFactorAuth" name="twoFactorAuth" type="checkbox" 
                      checked={formData.twoFactorAuth} onChange={handleChange} 
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded bg-background" 
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="twoFactorAuth" className="font-bold text-foreground cursor-pointer">Two-Factor Authentication (2FA)</label>
                    <p className="text-muted-foreground mt-0.5">Require an additional security code when logging in to protect sensitive employee HR data.</p>
                  </div>
                </div>

                <div className="pt-6 border-t max-w-2xl">
                  <h3 className="text-sm font-bold text-foreground mb-2">Active Sessions</h3>
                  <p className="text-sm text-muted-foreground mb-4">You are currently logged in on this device. For security purposes, you can log out of all other active sessions.</p>
                  <button type="button" className="btn-secondary text-destructive border-destructive/20 hover:bg-destructive/10">
                    Revoke Other Sessions
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
        
      </div>
    </div>
  );
}

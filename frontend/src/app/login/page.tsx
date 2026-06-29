'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Mail, Lock, Loader2, Rocket, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('invalid login') || msg.toLowerCase().includes('invalid email') || msg.toLowerCase().includes('invalid credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setError('Please verify your email address before signing in.');
      } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(msg || 'Failed to sign in. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL;
    const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

    if (!demoEmail || !demoPassword) {
      setError('Demo account is not configured. Please contact the administrator.');
      return;
    }

    setDemoLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email: demoEmail, password: demoPassword });
      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('invalid login') || msg.toLowerCase().includes('invalid credentials')) {
        setError('Demo account is unavailable. Please contact the administrator.');
      } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Demo account is currently unavailable. Please try again later.');
      }
      setDemoLoading(false);
    }
  };

  const isAnyLoading = loading || demoLoading;

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Left panel — branding ───────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
      >
        {/* Animated orbs */}
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', animation: 'pulse 6s ease-in-out infinite' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)', animation: 'pulse 8s ease-in-out infinite reverse' }} />
        <div className="absolute top-[40%] right-[10%] w-[250px] h-[250px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', animation: 'pulse 5s ease-in-out infinite' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #2563eb)' }}>
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">RetainIQ</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-indigo-300 border border-indigo-500/30"
              style={{ background: 'rgba(99,102,241,0.1)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              AI-Powered HR Intelligence
            </div>
            <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              Predict attrition<br />
              <span style={{ background: 'linear-gradient(90deg, #818cf8, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                before it happens
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              RetainIQ gives HR teams real-time insights to identify at-risk employees and take action before it&apos;s too late.
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '94%', label: 'Prediction Accuracy' },
              { value: '3×', label: 'Faster Decisions' },
              { value: '40%', label: 'Reduced Turnover' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl p-4 border border-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-slate-500">© 2025 RetainIQ · Predict. Prevent. Retain.</p>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────────── */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-6 py-12 sm:px-12 bg-white relative overflow-hidden">
        {/* Subtle background */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-40 -translate-y-1/2 translate-x-1/2"
          style={{ background: 'radial-gradient(circle, #eff6ff 0%, transparent 70%)' }} />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #2563eb)' }}>
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">RetainIQ</span>
        </div>

        <div className="relative z-10 w-full max-w-sm mx-auto">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to your HR Portal to continue</p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl p-3.5 text-sm border border-red-200 bg-red-50 text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isAnyLoading}
                  placeholder="you@company.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isAnyLoading}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isAnyLoading}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: isAnyLoading ? '#6366f1' : 'linear-gradient(135deg, #6366f1 0%, #2563eb 100%)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Signing In...</>
              ) : (
                <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Demo button */}
            <button
              type="button"
              disabled={isAnyLoading}
              onClick={handleDemoLogin}
              className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-indigo-200 text-indigo-600 bg-indigo-50 transition-all hover:bg-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {demoLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Loading Demo...</>
              ) : (
                <><Rocket className="h-4 w-4" />Try Demo Account</>
              )}
            </button>

            {/* Register link */}
            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                Create New Account
              </Link>
            </p>
          </form>
        </div>

        {/* Bottom note */}
        <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-slate-400">
          Authorized HR personnel only. Contact IT for access.
        </p>
      </div>
    </div>
  );
}

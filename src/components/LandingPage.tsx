import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Database, Shield, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient';
import { LoadingState } from './LoadingState';
import { AppLogo } from './AppLogo';

export const LandingPage: React.FC = () => {
  const { loading, user } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);
  const [authPending, setAuthPending] = useState<string | null>(null);

  const handleSocialSignIn = async (provider: 'google' | 'apple' | 'azure') => {
    if (!hasSupabaseConfig || !supabase) {
      setAuthError('Social authentication is unavailable until Supabase is configured.');
      return;
    }

    setAuthError(null);
    setAuthPending(provider);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The sign-in flow was canceled or failed.';
      setAuthError(message);
      setAuthPending(null);
    }
  };

  if (loading) {
    return <LoadingState label="Preparing your workspace" subLabel="Checking your session before we continue." />;
  }

  if (user) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#111827_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12 lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Secure multi-user access with admin approval
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Modern inventory operations with <span className="text-emerald-300">OmniPay</span>, built for confident teams.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Manage terminals, merchant deployments, and reconciliation activity from one polished workspace with dependable role-based access.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Sign in
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">Continue with</p>
                <span className="text-xs text-slate-400">Secure access options</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <button onClick={() => void handleSocialSignIn('google')} disabled={Boolean(authPending)} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.2 2.8-7.2 0-.7-.1-1.4-.2-2.1H12z"/><path fill="#4285F4" d="M12 22c2.6 0 4.8-.8 6.4-2.2l-3.1-2.4c-.8.5-1.9.9-3.3.9-2.5 0-4.7-1.7-5.4-4H3.3v2.5C4.9 19.9 8.2 22 12 22z"/><path fill="#FBBC05" d="M6.6 13.3c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.2H3.3c-.7 1.4-1.1 3-1.1 4.7 0 1.7.4 3.3 1.1 4.7l3.3-2.6z"/><path fill="#34A853" d="M12 6.2c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 3.4 14.6 2.4 12 2.4c-3.8 0-7.1 2.1-8.7 5.2l3.3 2.6c.7-2.3 2.9-4 5.4-4z"/></svg>
                  {authPending === 'google' ? 'Connecting…' : 'Continue with Google'}
                </button>
                <button onClick={() => void handleSocialSignIn('apple')} disabled={Boolean(authPending)} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="currentColor" d="M16.8 12.2c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.6-1.6-3.2-1.6-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.7 1.1 8.9.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.8 3-.8 1.4 0 1.8.8 3 .8 1.2 0 2-.9 2.8-2.2.9-1.3 1.2-2.6 1.2-2.7-.1-.1-2.2-.8-2.2-3.2zM14.8 5.2c.6-.7 1.1-1.7.9-2.7-.9.1-2 .6-2.6 1.4-.6.6-1.1 1.6-.9 2.5.9.1 2-.5 2.6-1.2z"/></svg>
                  {authPending === 'apple' ? 'Connecting…' : 'Continue with Apple'}
                </button>
                <button onClick={() => void handleSocialSignIn('azure')} disabled={Boolean(authPending)} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="#F25022" d="M3 3h8v8H3z"/><path fill="#00A4EF" d="M13 3h8v8h-8z"/><path fill="#7FBA00" d="M3 13h8v8H3z"/><path fill="#FFB900" d="M13 13h8v8h-8z"/></svg>
                  {authPending === 'microsoft' ? 'Connecting…' : 'Continue with Microsoft'}
                </button>
              </div>
              {authError && <p className="mt-3 text-sm text-rose-300">{authError}</p>}
              <p className="mt-3 text-sm text-slate-400">Email sign-in remains available for existing approved teams and admins.</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-8 shadow-2xl shadow-black/20">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-emerald-400">Your data</p>
                    <h3 className="mt-3 text-xl font-semibold text-white">Centralized, secure, and approval-gated</h3>
                  </div>
                  <Database className="h-10 w-10 text-emerald-400" />
                </div>
                <p className="mt-4 text-slate-400">Only approved users can view the dashboard and inventory while admins retain control of sensitive workflows.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-emerald-400" />
                    <p className="font-semibold text-white">Role-based access</p>
                  </div>
                  <p className="mt-3 text-slate-400">Admin can restrict import and reconciliation to trusted users only.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-emerald-400" />
                    <p className="font-semibold text-white">Self-admin onboarding</p>
                  </div>
                  <p className="mt-3 text-slate-400">The first registered user becomes admin automatically, so you can own approvals immediately.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

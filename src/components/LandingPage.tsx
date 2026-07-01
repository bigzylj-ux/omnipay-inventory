import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Database, Shield, Sparkles, UserCheck } from 'lucide-react';

export const LandingPage: React.FC = () => {
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
                Modern inventory operations, built for confident teams.
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
                <Link to="/register" className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-white">
                  Continue with Google
                </Link>
                <Link to="/register" className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-white">
                  Continue with Apple
                </Link>
                <Link to="/register" className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-white">
                  Continue with Microsoft
                </Link>
              </div>
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

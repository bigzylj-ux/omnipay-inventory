import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, Database, UserCheck } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-12">
      <div className="max-w-6xl w-full grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full bg-emerald-500/15 px-4 py-2 text-emerald-300 text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            New: Secure multi-user access with admin approval
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              OmniPay Inventory Dashboard with secure access and shared data
            </h1>
            <p className="text-slate-300 max-w-2xl leading-8">
              A modern inventory experience with role-based permissions. Admins can approve users, manage data imports, and control who can access dashboards, inventory, and vendor records.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
            >
              Create account
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              Login
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white">Shared Data</h2>
              <p className="mt-3 text-slate-300">
                Store inventory centrally so every colleague sees the same dashboard and records without repeated uploads.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white">Admin Approval</h2>
              <p className="mt-3 text-slate-300">
                Registration requires admin approval before users can access the protected dashboard and inventory views.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-900/90 border border-slate-700 p-8 shadow-2xl shadow-black/20">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-emerald-400">Your data</p>
                  <h3 className="mt-3 text-xl font-semibold text-white">Centralized, secure, and approval-gated</h3>
                </div>
                <Database className="w-10 h-10 text-emerald-400" />
              </div>
              <p className="mt-4 text-slate-400">Only approved users can view the dashboard and inventory. Admin-only pages are hidden from regular users.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <p className="font-semibold text-white">Role-based access</p>
                </div>
                <p className="mt-3 text-slate-400">Admin can restrict import and reconciliation to trusted users only.</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  <p className="font-semibold text-white">Self-admin onboarding</p>
                </div>
                <p className="mt-3 text-slate-400">The first registered user becomes admin automatically, so you can own approvals immediately.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

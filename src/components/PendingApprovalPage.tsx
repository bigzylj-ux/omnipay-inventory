import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const PendingApprovalPage: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 shadow-2xl shadow-black/40 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-400">Pending approval</p>
        <h1 className="mt-5 text-3xl font-semibold">Your account is awaiting admin approval</h1>
        <p className="mt-4 text-slate-400">
          {user?.email ? `Registered as ${user.email}.` : 'Your registration is still being processed.'}
        </p>
        <p className="mt-3 text-slate-400">You will receive access once an admin approves your account.</p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex rounded-2xl border border-slate-700 bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to home
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex rounded-2xl bg-rose-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-rose-400"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

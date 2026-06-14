import React from 'react';
import { Link } from 'react-router-dom';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl rounded-[2rem] border border-slate-800 bg-slate-900/95 p-12 text-center shadow-2xl shadow-black/40">
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-400">Access denied</p>
        <h1 className="mt-5 text-4xl font-bold">You do not have permission to view this page.</h1>
        <p className="mt-4 text-slate-400">If you believe this is an error, please contact your administrator or login with an approved account.</p>
        <Link
          to="/dashboard"
          className="mt-8 inline-flex rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  );
};

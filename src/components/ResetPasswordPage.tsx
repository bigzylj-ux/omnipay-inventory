import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ResetPasswordPage: React.FC = () => {
  const { resetPassword, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);

    const success = await resetPassword(email);
    if (success) {
      setSuccessMessage('If that email exists, a password reset link has been sent. Please check your inbox.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 shadow-2xl shadow-black/40">
        <Link to="/" className="mb-6 inline-flex items-center text-sm font-medium text-emerald-300 transition hover:text-emerald-200">
          ← Back to home
        </Link>
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-400">Reset password</p>
          <h1 className="mt-4 text-3xl font-semibold">Forgot your password?</h1>
          <p className="mt-3 text-slate-400">Enter your email and we’ll send a password reset link.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {(error || successMessage) && (
            <div className={`rounded-2xl p-3 text-sm ${error ? 'bg-rose-500/10 border border-rose-500/20 text-rose-200' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200'}`}>
              {error || successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Sending reset link…' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Remembered your password?{' '}
          <Link to="/login" className="font-semibold text-white hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

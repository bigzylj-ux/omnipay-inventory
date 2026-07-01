import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { signIn, loading, error, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await signIn(email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  if (user) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 shadow-2xl shadow-black/40">
        <Link to="/" className="mb-6 inline-flex items-center text-sm font-medium text-emerald-300 transition hover:text-emerald-200">
          ← Back to home
        </Link>
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-400">Welcome back</p>
          <h1 className="mt-4 text-3xl font-semibold">Login to your OmniPay workspace</h1>
          <p className="mt-3 text-slate-400">Approved users can access inventory, vendors and dashboards instantly.</p>
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
          <div>
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-emerald-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-200">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don’t have an account?{' '}
          <Link to="/register" className="font-semibold text-white hover:text-emerald-300">
            Register here
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-slate-400">
          Forgot your password?{' '}
          <Link to="/reset-password" className="font-semibold text-white hover:text-emerald-300">
            Reset it here
          </Link>
        </p>
      </div>
    </div>
  );
};

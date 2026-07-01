import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Upload, Database, Activity, FileSpreadsheet, MapPin, Users, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AppLogo } from './AppLogo';
import { ThemeSwitcher } from './ThemeSwitcher';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'user'] },
  { path: '/inventory', label: 'Inventory', icon: Database, roles: ['admin', 'user'] },
  { path: '/tracking', label: 'Tracking', icon: MapPin, roles: ['admin', 'user'] },
  { path: '/vendors', label: 'Vendors', icon: Users, roles: ['admin'], allowVendorAccess: true },
  { path: '/import', label: 'Daily Import', icon: Upload, roles: ['admin'] },
  { path: '/reconciliation', label: 'Reconciliation', icon: Activity, roles: ['admin'] },
  { path: '/admin/users', label: 'User Approvals', icon: ShieldCheck, roles: ['admin'] },
];

export const Layout: React.FC = () => {
  const location = useLocation();
  const { user, signOut, sessionWarningVisible, timeRemaining, extendSession } = useAuth();

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    if (item.roles.includes(user.role)) {
      return true;
    }
    if (item.allowVendorAccess && user.role === 'user' && user.vendorAccess) {
      return true;
    }
    return false;
  });

  const minutesRemaining = Math.max(1, Math.ceil(timeRemaining / 60));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 overflow-auto">
        <div className="p-6 border-b border-slate-700">
          <AppLogo compact />
          <p className="text-xs text-slate-400 mt-1">POS Inventory System</p>
          <p className="text-xs text-slate-400 mt-1">© OmniPay</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-3">
          <div className="text-xs text-slate-400">
            <p>{user ? `${user.role.toUpperCase()} access` : 'Not signed in'}</p>
            <p className="mt-2">v1.0.0</p>
          </div>
          <ThemeSwitcher />
        </div>
      </aside>

      <main className="flex-1 ml-64 overflow-auto">
        {sessionWarningVisible && user && (
          <div className="sticky top-0 z-[60] border-b border-amber-200 bg-amber-50 px-6 py-3 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-amber-800">
                Your session will expire in about {minutesRemaining} minute{minutesRemaining > 1 ? 's' : ''}. Keep working to stay signed in.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={extendSession}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Stay signed in
                </button>
                <button
                  onClick={() => void signOut('You signed out before your session expired.')}
                  className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
                >
                  Sign out now
                </button>
              </div>
            </div>
          </div>
        )}

        <header className="bg-slate-800 text-slate-100 border-b border-slate-700 shadow-sm">
          <div className="px-4 sm:px-8 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">
                {filteredNavItems.find((n) => n.path === location.pathname)?.label || 'OmniPay Inventory'}
              </h2>
              <p className="text-sm text-slate-300 mt-1 hidden md:block">Your inventory overview and analytics dashboard</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-sm text-slate-300 text-right">
                <div>{user?.email}</div>
                <div className="text-xs text-slate-400">{user?.approved ? 'Approved user' : 'Pending approval'}</div>
              </div>
              <button
                onClick={() => void signOut()}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-8 min-h-[calc(100vh-5rem)] bg-gray-50">
          <Outlet />

          <footer className="mt-8 bg-slate-100 text-slate-600 p-4 rounded-md text-sm">
            © {new Date().getFullYear()} OmniPay — Digitizing Payment Solution - Simplifying B2B Trade Payments
          </footer>
        </div>
      </main>
    </div>
  );
};

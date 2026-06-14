import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, Database, Activity, FileSpreadsheet, MapPin, Users } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory', icon: Database },
  { path: '/import', label: 'Daily Import', icon: Upload },
  { path: '/reconciliation', label: 'Reconciliation', icon: Activity },
  { path: '/tracking', label: 'Tracking', icon: MapPin },
  { path: '/vendors', label: 'Vendors', icon: Users },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 overflow-auto">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            OmniPay
          </h1>
          <p className="text-xs text-slate-400 mt-1">POS Inventory System</p>
          <p className="text-xs text-slate-400 mt-1">© OmniPay</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
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

        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-400">
            <p>v1.0.0</p>
            <p>Local Mode</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 overflow-auto">
        <header className="fixed top-0 left-64 right-0 z-50 bg-slate-800 text-slate-100 border-b border-slate-700 shadow-sm">
          <div className="px-8 h-20 flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold">
                {navItems.find(n => n.path === location.pathname)?.label || 'OmniPay Inventory'}
              </h2>
              <p className="text-sm text-slate-300 mt-1 hidden md:block">Your inventory overview and analytics dashboard</p>
            </div>
            <div className="text-sm text-slate-300">
              {new Date().toLocaleDateString('en-NG', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </header>
        <div className="p-8 pt-20 min-h-[calc(100vh-5rem)] bg-gray-50">
          {children}

          <footer className="mt-8 bg-slate-100 text-slate-600 p-4 rounded-md text-sm">
            © {new Date().getFullYear()} OmniPay — Digitizing Payment Solution - Simplifying B2B Trade Payments
          </footer>
        </div>
      </main>
    </div>
  );
};

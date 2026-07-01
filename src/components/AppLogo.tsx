import React from 'react';

interface AppLogoProps {
  compact?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ compact = false }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/40">
        <img src="/logo.svg" alt="OmniPay Inventory logo" className="h-7 w-7" />
      </div>
      <div>
        <p className={`font-semibold ${compact ? 'text-lg text-white' : 'text-lg text-slate-900'}`}>OmniPay</p>
        {!compact && <p className="text-xs text-slate-500">Inventory Management</p>}
      </div>
    </div>
  );
};

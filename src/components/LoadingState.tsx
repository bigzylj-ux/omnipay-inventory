import React from 'react';

interface LoadingStateProps {
  label?: string;
  subLabel?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading your workspace',
  subLabel = 'Preparing the latest inventory insights for you.',
}) => {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-sm">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 shadow-sm">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">{label}</p>
          <p className="text-sm text-slate-500">{subLabel}</p>
        </div>
      </div>
    </div>
  );
};

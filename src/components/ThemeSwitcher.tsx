import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const themeModes = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor },
];

const themePresets = [
  { value: 'default' as const, label: 'Default' },
  { value: 'midnight' as const, label: 'Midnight' },
  { value: 'emerald' as const, label: 'Emerald' },
];

export const ThemeSwitcher: React.FC = () => {
  const { themeMode, themePreset, setThemeMode, setThemePreset } = useTheme();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Theme</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {themeModes.map((mode) => {
            const Icon = mode.icon;
            const active = themeMode === mode.value;
            return (
              <button
                key={mode.value}
                onClick={() => setThemeMode(mode.value)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Preset</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {themePresets.map((preset) => {
            const active = themePreset === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => setThemePreset(preset.value)}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

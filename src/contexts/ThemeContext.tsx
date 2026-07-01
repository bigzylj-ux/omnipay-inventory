import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemePreset = 'default' | 'midnight' | 'emerald';

interface ThemeContextValue {
  themeMode: ThemeMode;
  themePreset: ThemePreset;
  resolvedTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  setThemePreset: (preset: ThemePreset) => void;
}

interface ThemePresetConfig {
  name: string;
  accent: string;
  surface: string;
  surfaceAlt: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
}

const themePresets: Record<ThemePreset, ThemePresetConfig> = {
  default: {
    name: 'Default',
    accent: '#10b981',
    surface: '#ffffff',
    surfaceAlt: '#f8fafc',
    surfaceMuted: '#e2e8f0',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
  },
  midnight: {
    name: 'Midnight',
    accent: '#34d399',
    surface: '#111827',
    surfaceAlt: '#1f2937',
    surfaceMuted: '#374151',
    text: '#f9fafb',
    textMuted: '#9ca3af',
    border: '#374151',
  },
  emerald: {
    name: 'Emerald',
    accent: '#0f766e',
    surface: '#ecfdf5',
    surfaceAlt: '#d1fae5',
    surfaceMuted: '#a7f3d0',
    text: '#052e16',
    textMuted: '#166534',
    border: '#86efac',
  },
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [themePreset, setThemePresetState] = useState<ThemePreset>('default');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const key = user?.email ? `omni-theme-${user.email}` : 'omni-theme';
    const saved = window.localStorage.getItem(key);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { mode?: ThemeMode; preset?: ThemePreset };
        if (parsed.mode) {
          setThemeModeState(parsed.mode);
        }
        if (parsed.preset) {
          setThemePresetState(parsed.preset);
        }
      } catch (error) {
        console.error('Failed to parse saved theme preference', error);
      }
    }
  }, [user?.email]);

  const resolvedTheme = themeMode === 'system' ? getSystemTheme() : themeMode;
  const activePreset = themePresets[themePreset];

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const key = user?.email ? `omni-theme-${user.email}` : 'omni-theme';
    window.localStorage.setItem(key, JSON.stringify({ mode: themeMode, preset: themePreset }));

    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.style.setProperty('--app-accent', activePreset.accent);
    root.style.setProperty('--app-surface', activePreset.surface);
    root.style.setProperty('--app-surface-alt', activePreset.surfaceAlt);
    root.style.setProperty('--app-surface-muted', activePreset.surfaceMuted);
    root.style.setProperty('--app-text', activePreset.text);
    root.style.setProperty('--app-text-muted', activePreset.textMuted);
    root.style.setProperty('--app-border', activePreset.border);
    root.style.colorScheme = resolvedTheme;
  }, [activePreset, resolvedTheme, themeMode, themePreset, user?.email]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const setThemePreset = (preset: ThemePreset) => {
    setThemePresetState(preset);
  };

  const value = useMemo(
    () => ({
      themeMode,
      themePreset,
      resolvedTheme,
      setThemeMode,
      setThemePreset,
    }),
    [resolvedTheme, themeMode, themePreset]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

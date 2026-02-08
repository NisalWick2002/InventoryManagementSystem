import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = 'ims_theme_mode';

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'system' || value === 'light' || value === 'dark';

export const getStoredThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isThemeMode(raw) ? raw : 'system';
  } catch {
    return 'system';
  }
};

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const resolveTheme = (mode: ThemeMode): ResolvedTheme => (mode === 'system' ? getSystemTheme() : mode);

const applyTheme = (mode: ThemeMode): ResolvedTheme => {
  const resolved = resolveTheme(mode);
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolved);
  }
  return resolved;
};

const setStoredThemeMode = (mode: ThemeMode) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Ignore storage failures.
  }
};

const subscribeSystemTheme = (onChange: (theme: ResolvedTheme) => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => undefined;
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => onChange(mediaQuery.matches ? 'dark' : 'light');
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
  mediaQuery.addListener(handler);
  return () => mediaQuery.removeListener(handler);
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredThemeMode());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(mode));

  useEffect(() => {
    setStoredThemeMode(mode);
    setResolvedTheme(applyTheme(mode));
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return () => undefined;
    return subscribeSystemTheme((theme) => {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
      setResolvedTheme(theme);
    });
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      resolvedTheme,
      setMode: (nextMode: ThemeMode) => setModeState(nextMode),
    }),
    [mode, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

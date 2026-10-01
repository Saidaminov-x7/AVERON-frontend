"use client";

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

const STORAGE_KEY = 'ijara_theme_preference';

function subscribeToColorScheme(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

function getSystemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getServerSystemPrefersDark() {
  return false;
}

function subscribeToStoredTheme() {
  return () => {};
}

function getStoredTheme(): Theme {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    return savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system'
      ? savedTheme
      : 'system';
  } catch {
    return 'system';
  }
}

function getServerStoredTheme(): Theme {
  return 'system';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeOverride, setThemeState] = useState<Theme | null>(null);
  const storedTheme = useSyncExternalStore(subscribeToStoredTheme, getStoredTheme, getServerStoredTheme);
  const theme = themeOverride ?? storedTheme;
  const systemPrefersDark = useSyncExternalStore(
    subscribeToColorScheme,
    getSystemPrefersDark,
    getServerSystemPrefersDark,
  );
  const resolvedTheme = theme === 'system'
    ? systemPrefersDark ? 'dark' : 'light'
    : theme;

  // Применение темы к <html> и отслеживание системной темы
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Игнорируем ошибки
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
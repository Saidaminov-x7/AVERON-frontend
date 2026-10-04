'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { useIsHydrated } from '@/hooks/useIsHydrated';

const BTN_CLASS =
  'averon-control-button averon-icon-button h-11 shrink-0';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isHydrated = useIsHydrated();

  if (!isHydrated) {
    return <div className="h-11 w-11 shrink-0" aria-hidden />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Light theme' : 'Dark theme'}
      className={BTN_CLASS}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
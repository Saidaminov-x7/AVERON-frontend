'use client';

import { useEffect } from 'react';

interface ThemeTokens {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  fontFamily: string;
}

const DEFAULTS: ThemeTokens = {
  primaryColor: '#2563eb',
  secondaryColor: '#1d4ed8',
  backgroundColor: '#f6f8fb',
  textColor: '#111827',
  borderRadius: '0.75rem',
  fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif',
};

// Sanitize theme values from DB to prevent dirty green/teal tints
// that occur when legacy ThemeSettings contain #151812 or similar greenish-blacks
function sanitizeThemeToken(key: keyof ThemeTokens, value: string): string {
  if (!value) return DEFAULTS[key];
  // Block known dirty green/teal near-blacks used in old ThemeSettings
  const dirtyGreenPattern = /^#1[0-7][0-2][0-8][0-1][0-9a-f]$/i;
  if ((key === 'secondaryColor' || key === 'textColor' || key === 'backgroundColor') && dirtyGreenPattern.test(value)) {
    return DEFAULTS[key];
  }
  return value;
}

function applyTokensToDom(tokens: ThemeTokens) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--color-primary', tokens.primaryColor);
  root.style.setProperty('--color-secondary', tokens.secondaryColor);
  root.style.setProperty('--color-bg', tokens.backgroundColor);
  root.style.setProperty('--color-text', tokens.textColor);
  root.style.setProperty('--border-radius', tokens.borderRadius);
  root.style.setProperty('--font-family', tokens.fontFamily);
  if (tokens.fontFamily && document.body) {
    document.body.style.fontFamily = tokens.fontFamily;
  }
}

export function DesignTokensInjector() {
  useEffect(() => {
    applyTokensToDom(DEFAULTS);
  }, []);

  return null;
}

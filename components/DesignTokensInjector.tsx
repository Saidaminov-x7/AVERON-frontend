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
  primaryColor: '#0f766e',
  secondaryColor: '#115e59',
  backgroundColor: '#f9fafb',
  textColor: '#111827',
  borderRadius: '0.75rem',
  fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif',
};

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

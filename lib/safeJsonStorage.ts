import type { StateStorage } from 'zustand/middleware';

/**
 * Protects the app from broken or empty values left in localStorage by an
 * older build. Zustand will then hydrate the store with its initial state.
 */
export const safeJsonStorage: StateStorage = {
  getItem(name) {
    if (typeof window === 'undefined') return null;
    const value = window.localStorage.getItem(name);
    if (!value) return null;
    try {
      JSON.parse(value);
      return value;
    } catch {
      window.localStorage.removeItem(name);
      return null;
    }
  },
  setItem(name, value) {
    if (typeof window !== 'undefined') window.localStorage.setItem(name, value);
  },
  removeItem(name) {
    if (typeof window !== 'undefined') window.localStorage.removeItem(name);
  },
};

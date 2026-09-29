import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  ids: string[];
  toggle: (id: string | number) => void;
  isFavorite: (id: string | number) => boolean;
}

/**
 * Избранные товары. Персистится в localStorage.
 * При обновлении структуры (версия 2) сбрасывает устаревшие числовые/квартирные ID.
 */
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const value = String(id);
        set((s) => ({
          ids: s.ids.includes(value) ? s.ids.filter((x) => x !== value) : [...s.ids, value],
        }));
      },
      isFavorite: (id) => get().ids.includes(String(id)),
    }),
    {
      name: 'averon-favorites',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          return { ids: [] };
        }
        const state = persistedState as FavoritesState;
        // Filter out any purely numeric legacy apartment IDs
        const validIds = Array.isArray(state?.ids)
          ? state.ids.filter((id) => typeof id === 'string' && !/^\d+$/.test(id))
          : [];
        return { ...state, ids: validIds };
      },
    }
  )
);

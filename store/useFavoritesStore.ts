import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  ids: string[];
  toggle: (id: string | number) => void;
  isFavorite: (id: string | number) => boolean;
}

/**
 * Избранные объявления. Персистится в localStorage,
 * поэтому список сохраняется между визитами без бэкенда.
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
    { name: 'averon-favorites' }
  )
);

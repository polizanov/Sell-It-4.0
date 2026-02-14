import { create } from 'zustand';
import { favouriteService } from '../services/favouriteService';

interface FavouritesState {
  favouriteIds: Set<string>;
  isLoaded: boolean;
  isFavourite: (id: string) => boolean;
  loadFavouriteIds: () => Promise<void>;
  toggleFavourite: (id: string) => Promise<void>;
  clearFavourites: () => void;
}

export const useFavouritesStore = create<FavouritesState>((set, get) => ({
  favouriteIds: new Set<string>(),
  isLoaded: false,

  isFavourite: (id: string) => get().favouriteIds.has(id),

  loadFavouriteIds: async () => {
    try {
      const ids = await favouriteService.getIds();
      set({ favouriteIds: new Set(ids), isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  toggleFavourite: async (id: string) => {
    const { favouriteIds } = get();
    const wasFavourited = favouriteIds.has(id);

    // Optimistic update
    const newIds = new Set(favouriteIds);
    if (wasFavourited) {
      newIds.delete(id);
    } else {
      newIds.add(id);
    }
    set({ favouriteIds: newIds });

    try {
      if (wasFavourited) {
        await favouriteService.remove(id);
      } else {
        await favouriteService.add(id);
      }
    } catch {
      // Revert on error
      const revertIds = new Set(get().favouriteIds);
      if (wasFavourited) {
        revertIds.add(id);
      } else {
        revertIds.delete(id);
      }
      set({ favouriteIds: revertIds });
    }
  },

  clearFavourites: () => {
    set({ favouriteIds: new Set<string>(), isLoaded: false });
  },
}));

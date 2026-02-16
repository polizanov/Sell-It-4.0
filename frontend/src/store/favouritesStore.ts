import { create } from 'zustand';
import { favouriteService } from '../services/favouriteService';

interface FavouritesState {
  favouriteIds: Set<string>;
  isLoaded: boolean;
  error: string | null;
  isFavourite: (id: string) => boolean;
  loadFavouriteIds: () => Promise<void>;
  toggleFavourite: (id: string) => Promise<void>;
  clearFavourites: () => void;
  clearError: () => void;
}

export const useFavouritesStore = create<FavouritesState>((set, get) => ({
  favouriteIds: new Set<string>(),
  isLoaded: false,
  error: null,

  isFavourite: (id: string) => get().favouriteIds.has(id),

  loadFavouriteIds: async () => {
    try {
      const ids = await favouriteService.getIds();
      set({ favouriteIds: new Set(ids), isLoaded: true, error: null });
    } catch (err) {
      const errorMsg = 'Failed to load favourites. Please refresh the page.';
      set({ isLoaded: true, error: errorMsg });
      console.error('Favourite load error:', err);
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
    } catch (err) {
      // Revert on error
      const revertIds = new Set(get().favouriteIds);
      if (wasFavourited) {
        revertIds.add(id);
      } else {
        revertIds.delete(id);
      }
      const errorMsg = wasFavourited
        ? 'Failed to remove from favourites. Please try again.'
        : 'Failed to add to favourites. Please try again.';
      set({ favouriteIds: revertIds, error: errorMsg });
      console.error('Favourite toggle error:', err);
    }
  },

  clearFavourites: () => {
    set({ favouriteIds: new Set<string>(), isLoaded: false, error: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));

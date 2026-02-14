import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../src/mocks/server';
import { useFavouritesStore } from '../../src/store/favouritesStore';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

describe('favouritesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useFavouritesStore.setState({ favouriteIds: new Set<string>(), isLoaded: false });
  });

  describe('isFavourite', () => {
    it('returns false when favouriteIds is empty', () => {
      const result = useFavouritesStore.getState().isFavourite('some-id');
      expect(result).toBe(false);
    });

    it('returns true when product ID is in favouriteIds', () => {
      useFavouritesStore.setState({ favouriteIds: new Set(['prod-1', 'prod-2']), isLoaded: true });

      expect(useFavouritesStore.getState().isFavourite('prod-1')).toBe(true);
      expect(useFavouritesStore.getState().isFavourite('prod-2')).toBe(true);
    });

    it('returns false when product ID is not in favouriteIds', () => {
      useFavouritesStore.setState({ favouriteIds: new Set(['prod-1']), isLoaded: true });

      expect(useFavouritesStore.getState().isFavourite('prod-999')).toBe(false);
    });
  });

  describe('loadFavouriteIds', () => {
    it('populates favouriteIds Set from API', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.get(`${API_BASE}/favourites/ids`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Favourite IDs retrieved successfully',
            data: ['prod-1', 'prod-2', 'prod-3'],
          });
        }),
      );

      await useFavouritesStore.getState().loadFavouriteIds();

      const state = useFavouritesStore.getState();
      expect(state.isLoaded).toBe(true);
      expect(state.favouriteIds.size).toBe(3);
      expect(state.favouriteIds.has('prod-1')).toBe(true);
      expect(state.favouriteIds.has('prod-2')).toBe(true);
      expect(state.favouriteIds.has('prod-3')).toBe(true);
    });

    it('sets isLoaded to true even on API error', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.get(`${API_BASE}/favourites/ids`, () => {
          return HttpResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 },
          );
        }),
      );

      await useFavouritesStore.getState().loadFavouriteIds();

      const state = useFavouritesStore.getState();
      expect(state.isLoaded).toBe(true);
      expect(state.favouriteIds.size).toBe(0);
    });
  });

  describe('toggleFavourite', () => {
    it('adds product ID when not present (optimistic update)', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.post(`${API_BASE}/favourites/:productId`, () => {
          return HttpResponse.json(
            {
              success: true,
              message: 'Product added to favourites',
              data: { id: 'fav-1', productId: 'prod-1', createdAt: new Date().toISOString() },
            },
            { status: 201 },
          );
        }),
      );

      await useFavouritesStore.getState().toggleFavourite('prod-1');

      const state = useFavouritesStore.getState();
      expect(state.favouriteIds.has('prod-1')).toBe(true);
    });

    it('removes product ID when present (optimistic update)', async () => {
      localStorage.setItem('token', 'mock-jwt-token');
      useFavouritesStore.setState({
        favouriteIds: new Set(['prod-1']),
        isLoaded: true,
      });

      server.use(
        http.delete(`${API_BASE}/favourites/:productId`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Product removed from favourites',
          });
        }),
      );

      await useFavouritesStore.getState().toggleFavourite('prod-1');

      const state = useFavouritesStore.getState();
      expect(state.favouriteIds.has('prod-1')).toBe(false);
    });

    it('reverts optimistic add on API error', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.post(`${API_BASE}/favourites/:productId`, () => {
          return HttpResponse.json(
            { success: false, message: 'Product not found' },
            { status: 404 },
          );
        }),
      );

      await useFavouritesStore.getState().toggleFavourite('prod-1');

      const state = useFavouritesStore.getState();
      expect(state.favouriteIds.has('prod-1')).toBe(false);
    });

    it('reverts optimistic remove on API error', async () => {
      localStorage.setItem('token', 'mock-jwt-token');
      useFavouritesStore.setState({
        favouriteIds: new Set(['prod-1']),
        isLoaded: true,
      });

      server.use(
        http.delete(`${API_BASE}/favourites/:productId`, () => {
          return HttpResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 },
          );
        }),
      );

      await useFavouritesStore.getState().toggleFavourite('prod-1');

      const state = useFavouritesStore.getState();
      expect(state.favouriteIds.has('prod-1')).toBe(true);
    });
  });

  describe('clearFavourites', () => {
    it('empties the Set and sets isLoaded to false', () => {
      useFavouritesStore.setState({
        favouriteIds: new Set(['prod-1', 'prod-2']),
        isLoaded: true,
      });

      useFavouritesStore.getState().clearFavourites();

      const state = useFavouritesStore.getState();
      expect(state.favouriteIds.size).toBe(0);
      expect(state.isLoaded).toBe(false);
    });
  });
});

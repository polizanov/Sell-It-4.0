import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../src/mocks/server';
import { favouriteService } from '../../src/services/favouriteService';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

describe('favouriteService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'mock-jwt-token');
  });

  describe('getAll', () => {
    it('returns mapped products with pagination', async () => {
      server.use(
        http.get(`${API_BASE}/favourites`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Favourites retrieved successfully',
            data: {
              products: [
                {
                  id: 'fav-prod-1',
                  title: 'Favourite Product One',
                  description: 'A favourite product description',
                  price: 49.99,
                  images: ['https://images.unsplash.com/photo-1.jpg'],
                  category: 'Electronics',
                  condition: 'New',
                  seller: { _id: 'seller-1', name: 'John Smith', username: 'johnsmith' },
                  createdAt: '2024-01-15T10:30:00.000Z',
                },
                {
                  id: 'fav-prod-2',
                  title: 'Favourite Product Two',
                  description: 'Another favourite product',
                  price: 99.99,
                  images: ['https://images.unsplash.com/photo-2.jpg'],
                  category: 'Clothing',
                  condition: 'Good',
                  seller: { _id: 'seller-2', name: 'Jane Doe', username: 'janedoe' },
                  createdAt: '2024-02-20T10:30:00.000Z',
                },
              ],
              pagination: {
                currentPage: 1,
                totalPages: 1,
                totalProducts: 2,
                limit: 12,
                hasMore: false,
              },
            },
          });
        }),
      );

      const result = await favouriteService.getAll();

      // Check pagination metadata
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.totalProducts).toBe(2);
      expect(result.pagination.limit).toBe(12);
      expect(result.pagination.hasMore).toBe(false);

      // Check mapped products
      expect(result.products).toHaveLength(2);

      const first = result.products[0];
      expect(first.id).toBe('fav-prod-1');
      expect(first.title).toBe('Favourite Product One');
      expect(first.sellerId).toBe('seller-1');
      expect(first.sellerName).toBe('John Smith');
      expect(first.sellerUsername).toBe('johnsmith');
      // Ensure the seller object is flattened
      expect((first as unknown as Record<string, unknown>).seller).toBeUndefined();
    });
  });

  describe('getIds', () => {
    it('returns array of product ID strings', async () => {
      server.use(
        http.get(`${API_BASE}/favourites/ids`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Favourite IDs retrieved successfully',
            data: ['prod-1', 'prod-2', 'prod-3'],
          });
        }),
      );

      const ids = await favouriteService.getIds();

      expect(ids).toEqual(['prod-1', 'prod-2', 'prod-3']);
      expect(ids).toHaveLength(3);
    });
  });

  describe('add', () => {
    it('returns 201 on success', async () => {
      server.use(
        http.post(`${API_BASE}/favourites/:productId`, () => {
          return HttpResponse.json(
            {
              success: true,
              message: 'Product added to favourites',
              data: {
                id: 'fav-1',
                productId: 'prod-1',
                createdAt: new Date().toISOString(),
              },
            },
            { status: 201 },
          );
        }),
      );

      const response = await favouriteService.add('prod-1');

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toBe('Product added to favourites');
    });

    it('throws 403 for own product', async () => {
      server.use(
        http.post(`${API_BASE}/favourites/:productId`, () => {
          return HttpResponse.json(
            { success: false, message: 'You cannot favourite your own product' },
            { status: 403 },
          );
        }),
      );

      try {
        await favouriteService.add('own-product-id');
        expect.fail('Expected request to throw');
      } catch (error: unknown) {
        const axiosError = error as {
          response: { status: number; data: { message: string } };
        };
        expect(axiosError.response.status).toBe(403);
        expect(axiosError.response.data.message).toBe(
          'You cannot favourite your own product',
        );
      }
    });
  });

  describe('remove', () => {
    it('returns 200 on success', async () => {
      server.use(
        http.delete(`${API_BASE}/favourites/:productId`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Product removed from favourites',
          });
        }),
      );

      const response = await favouriteService.remove('prod-1');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toBe('Product removed from favourites');
    });

    it('throws 404 when favourite not found', async () => {
      server.use(
        http.delete(`${API_BASE}/favourites/:productId`, () => {
          return HttpResponse.json(
            { success: false, message: 'Favourite not found' },
            { status: 404 },
          );
        }),
      );

      try {
        await favouriteService.remove('nonexistent-id');
        expect.fail('Expected request to throw');
      } catch (error: unknown) {
        const axiosError = error as {
          response: { status: number; data: { message: string } };
        };
        expect(axiosError.response.status).toBe(404);
        expect(axiosError.response.data.message).toBe('Favourite not found');
      }
    });
  });
});

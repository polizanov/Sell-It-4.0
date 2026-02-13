import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { productService } from '../../src/services/productService';
import { server } from '../../src/mocks/server';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

describe('productService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('create', () => {
    it('sends FormData and returns success response with product data', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.post(`${API_BASE}/products`, () => {
          return HttpResponse.json(
            {
              success: true,
              message: 'Product created successfully',
              data: {
                id: '1',
                title: 'Vintage Camera',
                description: 'A beautiful vintage camera in great condition',
                price: 49.99,
                images: ['https://picsum.photos/seed/mock1/400/300'],
                category: 'Electronics',
                condition: 'Good',
                seller: { _id: '1', name: 'Test User' },
                createdAt: new Date().toISOString(),
              },
            },
            { status: 201 },
          );
        }),
      );

      const file = new File(['image-data'], 'test.jpg', { type: 'image/jpeg' });

      const response = await productService.create({
        title: 'Vintage Camera',
        description: 'A beautiful vintage camera in great condition',
        price: '49.99',
        category: 'Electronics',
        condition: 'Good',
        images: [file],
      });

      expect(response.data.success).toBe(true);
      expect(response.data.message).toBe('Product created successfully');
      expect(response.data.data?.title).toBe('Vintage Camera');
      expect(response.data.data?.description).toBe(
        'A beautiful vintage camera in great condition',
      );
      expect(response.data.data?.price).toBe(49.99);
      expect(response.data.data?.category).toBe('Electronics');
      expect(response.data.data?.condition).toBe('Good');
      expect(response.data.data?.id).toBe('1');
    });

    it('returns 401 when not authenticated', async () => {
      // No token in localStorage

      server.use(
        http.post(`${API_BASE}/products`, ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return HttpResponse.json(
              { success: false, message: 'Not authorized' },
              { status: 401 },
            );
          }
          return HttpResponse.json(
            { success: true, message: 'Product created successfully' },
            { status: 201 },
          );
        }),
      );

      const file = new File(['image-data'], 'test.jpg', { type: 'image/jpeg' });

      try {
        await productService.create({
          title: 'Test Product',
          description: 'Test description',
          price: '10.00',
          category: 'Electronics',
          condition: 'New',
          images: [file],
        });
        expect.fail('Expected request to throw');
      } catch (error: unknown) {
        const axiosError = error as {
          response: { status: number; data: { message: string } };
        };
        expect(axiosError.response.status).toBe(401);
        expect(axiosError.response.data.message).toBe('Not authorized');
      }
    });

    it('returns 400 for validation errors (missing fields)', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.post(`${API_BASE}/products`, () => {
          return HttpResponse.json(
            { success: false, message: 'All fields are required' },
            { status: 400 },
          );
        }),
      );

      const file = new File(['image-data'], 'test.jpg', { type: 'image/jpeg' });

      try {
        await productService.create({
          title: '',
          description: 'Test description',
          price: '10.00',
          category: 'Electronics',
          condition: 'New',
          images: [file],
        });
        expect.fail('Expected request to throw');
      } catch (error: unknown) {
        const axiosError = error as {
          response: { status: number; data: { message: string } };
        };
        expect(axiosError.response.status).toBe(400);
        expect(axiosError.response.data.message).toBe('All fields are required');
      }
    });
  });

  describe('getCategories', () => {
    it('returns array of category strings', async () => {
      server.use(
        http.get(`${API_BASE}/products/categories`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Categories retrieved',
            data: [
              'Books',
              'Clothing',
              'Electronics',
              'Home & Garden',
              'Musical Instruments',
              'Sports',
              'Toys & Games',
            ],
          });
        }),
      );

      const response = await productService.getCategories();

      expect(response.data.success).toBe(true);
      expect(response.data.message).toBe('Categories retrieved');
      expect(response.data.data).toEqual([
        'Books',
        'Clothing',
        'Electronics',
        'Home & Garden',
        'Musical Instruments',
        'Sports',
        'Toys & Games',
      ]);
      expect(response.data.data).toHaveLength(7);
    });

    it('returns empty array when no categories exist', async () => {
      server.use(
        http.get(`${API_BASE}/products/categories`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Categories retrieved',
            data: [],
          });
        }),
      );

      const response = await productService.getCategories();

      expect(response.data.success).toBe(true);
      expect(response.data.data).toEqual([]);
      expect(response.data.data).toHaveLength(0);
    });
  });
});

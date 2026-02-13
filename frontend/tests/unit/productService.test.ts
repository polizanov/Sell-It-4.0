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

  describe('getById', () => {
    it('returns a mapped Product with flat sellerId and sellerName', async () => {
      server.use(
        http.get(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Product retrieved successfully',
            data: {
              id: 'abc123',
              title: 'Test Camera',
              description: 'A beautiful test camera for photography.',
              price: 199.99,
              images: [
                'https://images.unsplash.com/photo-1.jpg',
                'https://images.unsplash.com/photo-2.jpg',
              ],
              category: 'Electronics',
              condition: 'Good',
              seller: { _id: 'seller-id-456', name: 'Jane Doe' },
              createdAt: '2024-06-15T10:30:00.000Z',
            },
          });
        }),
      );

      const product = await productService.getById('abc123');

      expect(product.id).toBe('abc123');
      expect(product.title).toBe('Test Camera');
      expect(product.description).toBe('A beautiful test camera for photography.');
      expect(product.price).toBe(199.99);
      expect(product.images).toEqual([
        'https://images.unsplash.com/photo-1.jpg',
        'https://images.unsplash.com/photo-2.jpg',
      ]);
      expect(product.category).toBe('Electronics');
      expect(product.condition).toBe('Good');
      // Verify the seller object is mapped to flat fields
      expect(product.sellerId).toBe('seller-id-456');
      expect(product.sellerName).toBe('Jane Doe');
      expect(product.createdAt).toBe('2024-06-15T10:30:00.000Z');
      // Ensure there is no nested seller property on the returned Product
      expect((product as unknown as Record<string, unknown>).seller).toBeUndefined();
    });

    it('throws on 404 (product not found)', async () => {
      server.use(
        http.get(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json(
            { success: false, message: 'Product not found' },
            { status: 404 },
          );
        }),
      );

      await expect(productService.getById('000000000000000000000000')).rejects.toThrow();
    });

    it('throws on 400 (invalid ID)', async () => {
      server.use(
        http.get(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json(
            { success: false, message: 'Invalid product ID' },
            { status: 400 },
          );
        }),
      );

      await expect(productService.getById('invalid-id')).rejects.toThrow();
    });
  });
});

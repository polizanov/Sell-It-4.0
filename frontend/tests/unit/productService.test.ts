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
                seller: { _id: '1', name: 'Test User', username: 'testuser' },
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

  describe('getAll', () => {
    it('returns mapped products with flat sellerId/sellerName and pagination metadata', async () => {
      server.use(
        http.get(`${API_BASE}/products`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Products retrieved successfully',
            data: {
              products: [
                {
                  id: 'prod-1',
                  title: 'Test Product',
                  description: 'A test product description',
                  price: 49.99,
                  images: ['https://images.unsplash.com/photo-1.jpg'],
                  category: 'Electronics',
                  condition: 'New',
                  seller: { _id: 'seller-1', name: 'John Smith', username: 'johnsmith' },
                  createdAt: '2024-01-15T10:30:00.000Z',
                },
                {
                  id: 'prod-2',
                  title: 'Another Product',
                  description: 'Another product for testing',
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

      const result = await productService.getAll();

      // Check pagination metadata
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.totalProducts).toBe(2);
      expect(result.pagination.limit).toBe(12);
      expect(result.pagination.hasMore).toBe(false);

      // Check mapped products
      expect(result.products).toHaveLength(2);

      const first = result.products[0];
      expect(first.id).toBe('prod-1');
      expect(first.title).toBe('Test Product');
      expect(first.sellerId).toBe('seller-1');
      expect(first.sellerName).toBe('John Smith');
      expect(first.sellerUsername).toBe('johnsmith');
      expect((first as unknown as Record<string, unknown>).seller).toBeUndefined();

      const second = result.products[1];
      expect(second.id).toBe('prod-2');
      expect(second.sellerId).toBe('seller-2');
      expect(second.sellerName).toBe('Jane Doe');
      expect(second.sellerUsername).toBe('janedoe');
    });

    it('sends query parameters correctly', async () => {
      let capturedUrl = '';

      server.use(
        http.get(`${API_BASE}/products`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            success: true,
            message: 'Products retrieved successfully',
            data: {
              products: [],
              pagination: {
                currentPage: 2,
                totalPages: 5,
                totalProducts: 50,
                limit: 10,
                hasMore: true,
              },
            },
          });
        }),
      );

      await productService.getAll({
        page: 2,
        limit: 10,
        category: 'Electronics',
        search: 'camera',
        sort: 'price_asc',
      });

      const url = new URL(capturedUrl);
      expect(url.searchParams.get('page')).toBe('2');
      expect(url.searchParams.get('limit')).toBe('10');
      expect(url.searchParams.get('category')).toBe('Electronics');
      expect(url.searchParams.get('search')).toBe('camera');
      expect(url.searchParams.get('sort')).toBe('price_asc');
    });

    it('returns empty products array when no results', async () => {
      server.use(
        http.get(`${API_BASE}/products`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Products retrieved successfully',
            data: {
              products: [],
              pagination: {
                currentPage: 1,
                totalPages: 1,
                totalProducts: 0,
                limit: 12,
                hasMore: false,
              },
            },
          });
        }),
      );

      const result = await productService.getAll({ category: 'NonExistent' });

      expect(result.products).toEqual([]);
      expect(result.products).toHaveLength(0);
      expect(result.pagination.totalProducts).toBe(0);
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
              seller: { _id: 'seller-id-456', name: 'Jane Doe', username: 'janedoe' },
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
      expect(product.sellerUsername).toBe('janedoe');
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

  describe('update', () => {
    it('sends FormData via PUT and returns updated product', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.put(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Product updated successfully',
            data: {
              id: 'prod-1',
              title: 'Updated Camera',
              description: 'An updated vintage camera description',
              price: 59.99,
              images: [
                'https://res.cloudinary.com/test/existing-image.jpg',
                'https://res.cloudinary.com/test/new-image.jpg',
              ],
              category: 'Electronics',
              condition: 'Like New',
              seller: { _id: '1', name: 'Test User', username: 'testuser' },
              createdAt: '2024-01-15T10:30:00.000Z',
            },
          });
        }),
      );

      const file = new File(['image-data'], 'new-image.jpg', { type: 'image/jpeg' });

      const response = await productService.update('prod-1', {
        title: 'Updated Camera',
        description: 'An updated vintage camera description',
        price: '59.99',
        category: 'Electronics',
        condition: 'Like New',
        existingImages: ['https://res.cloudinary.com/test/existing-image.jpg'],
        newImages: [file],
      });

      expect(response.data.success).toBe(true);
      expect(response.data.message).toBe('Product updated successfully');
      expect(response.data.data?.title).toBe('Updated Camera');
      expect(response.data.data?.price).toBe(59.99);
      expect(response.data.data?.images).toHaveLength(2);
      expect(response.data.data?.condition).toBe('Like New');
      expect(response.data.data?.id).toBe('prod-1');
    });

    it('handles 401 unauthorized error', async () => {
      // No token in localStorage

      server.use(
        http.put(`${API_BASE}/products/:id`, ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return HttpResponse.json(
              { success: false, message: 'Not authorized' },
              { status: 401 },
            );
          }
          return HttpResponse.json(
            { success: true, message: 'Product updated successfully' },
          );
        }),
      );

      const file = new File(['image-data'], 'test.jpg', { type: 'image/jpeg' });

      try {
        await productService.update('prod-1', {
          title: 'Test Product',
          description: 'Test description',
          price: '10.00',
          category: 'Electronics',
          condition: 'New',
          existingImages: [],
          newImages: [file],
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

    it('handles 403 non-owner error', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.put(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json(
            { success: false, message: 'You are not authorized to edit this product' },
            { status: 403 },
          );
        }),
      );

      const file = new File(['image-data'], 'test.jpg', { type: 'image/jpeg' });

      try {
        await productService.update('prod-1', {
          title: 'Test Product',
          description: 'Test description',
          price: '10.00',
          category: 'Electronics',
          condition: 'New',
          existingImages: [],
          newImages: [file],
        });
        expect.fail('Expected request to throw');
      } catch (error: unknown) {
        const axiosError = error as {
          response: { status: number; data: { message: string } };
        };
        expect(axiosError.response.status).toBe(403);
        expect(axiosError.response.data.message).toBe(
          'You are not authorized to edit this product',
        );
      }
    });
  });

  describe('getByUsername', () => {
    it('returns user info and mapped products with pagination', async () => {
      server.use(
        http.get(`${API_BASE}/products/user/:username`, () => {
          return HttpResponse.json({
            success: true,
            message: 'User products retrieved successfully',
            data: {
              user: { name: 'John Smith', username: 'johnsmith', memberSince: '2024-01-01T00:00:00.000Z' },
              products: [
                {
                  id: 'prod-1',
                  title: 'Test Product',
                  description: 'A test product description',
                  price: 49.99,
                  images: ['https://images.unsplash.com/photo-1.jpg'],
                  category: 'Electronics',
                  condition: 'New',
                  seller: { _id: 'seller-1', name: 'John Smith', username: 'johnsmith' },
                  createdAt: '2024-01-15T10:30:00.000Z',
                },
              ],
              pagination: {
                currentPage: 1,
                totalPages: 1,
                totalProducts: 1,
                limit: 12,
                hasMore: false,
              },
            },
          });
        }),
      );

      const result = await productService.getByUsername('johnsmith');

      expect(result.user.name).toBe('John Smith');
      expect(result.user.username).toBe('johnsmith');
      expect(result.user.memberSince).toBe('2024-01-01T00:00:00.000Z');
      expect(result.products).toHaveLength(1);
      expect(result.products[0].sellerId).toBe('seller-1');
      expect(result.products[0].sellerName).toBe('John Smith');
      expect(result.products[0].sellerUsername).toBe('johnsmith');
      expect(result.pagination.totalProducts).toBe(1);
    });

    it('throws 404 for non-existent username', async () => {
      server.use(
        http.get(`${API_BASE}/products/user/:username`, () => {
          return HttpResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 },
          );
        }),
      );

      await expect(productService.getByUsername('nonexistent')).rejects.toThrow();
    });

    it('sends page parameter correctly', async () => {
      let capturedUrl = '';

      server.use(
        http.get(`${API_BASE}/products/user/:username`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            success: true,
            message: 'User products retrieved successfully',
            data: {
              user: { name: 'John', username: 'john', memberSince: '2024-01-01T00:00:00.000Z' },
              products: [],
              pagination: {
                currentPage: 2,
                totalPages: 3,
                totalProducts: 30,
                limit: 12,
                hasMore: true,
              },
            },
          });
        }),
      );

      await productService.getByUsername('john', { page: 2 });

      const url = new URL(capturedUrl);
      expect(url.searchParams.get('page')).toBe('2');
    });
  });
});

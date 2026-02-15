import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import Home from '../../src/pages/Home';
import { useAuthStore } from '../../src/store/authStore';
import { server } from '../../src/mocks/server';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const featuredProducts = [
  {
    id: 'feat-1',
    title: 'Featured Camera',
    description: 'Top-of-the-line camera equipment.',
    price: 599.99,
    images: ['https://images.unsplash.com/photo-1.jpg'],
    category: 'Electronics',
    condition: 'New',
    seller: { _id: 'seller-1', name: 'Alice' },
    createdAt: '2024-02-20T10:30:00.000Z',
  },
  {
    id: 'feat-2',
    title: 'Featured Sneakers',
    description: 'Limited edition sneakers.',
    price: 250.0,
    images: ['https://images.unsplash.com/photo-2.jpg'],
    category: 'Clothing',
    condition: 'New',
    seller: { _id: 'seller-2', name: 'Bob' },
    createdAt: '2024-02-19T10:30:00.000Z',
  },
  {
    id: 'feat-3',
    title: 'Featured Guitar',
    description: 'Professional acoustic guitar.',
    price: 450.0,
    images: ['https://images.unsplash.com/photo-3.jpg'],
    category: 'Musical Instruments',
    condition: 'Like New',
    seller: { _id: 'seller-1', name: 'Alice' },
    createdAt: '2024-02-18T10:30:00.000Z',
  },
  {
    id: 'feat-4',
    title: 'Featured Desk Lamp',
    description: 'Modern LED desk lamp.',
    price: 89.99,
    images: ['https://images.unsplash.com/photo-4.jpg'],
    category: 'Home & Garden',
    condition: 'New',
    seller: { _id: 'seller-3', name: 'Charlie' },
    createdAt: '2024-02-17T10:30:00.000Z',
  },
];

const renderHome = () => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Home />
    </MemoryRouter>,
  );
};

describe('Home Page — Product Listing', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('fetches and displays all products with pagination', async () => {
    let capturedUrl = '';

    server.use(
      http.get(`${API_BASE}/products`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          success: true,
          message: 'Products retrieved successfully',
          data: {
            products: featuredProducts,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalProducts: 4,
              limit: 12,
              hasMore: false,
            },
          },
        });
      }),
      http.get(`${API_BASE}/products/categories`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Categories retrieved successfully',
          data: ['Electronics', 'Clothing', 'Musical Instruments', 'Home & Garden'],
        });
      }),
    );

    renderHome();

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Featured Camera')).toBeInTheDocument();
    });

    expect(screen.getByText('Featured Sneakers')).toBeInTheDocument();
    expect(screen.getByText('Featured Guitar')).toBeInTheDocument();
    expect(screen.getByText('Featured Desk Lamp')).toBeInTheDocument();

    // Verify that the API was called with pagination page
    const url = new URL(capturedUrl);
    expect(url.searchParams.get('page')).toBe('1');
    // Note: limit is not sent explicitly, uses backend default
  });

  it('shows skeleton while loading products', async () => {
    server.use(
      http.get(`${API_BASE}/products`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json({
          success: true,
          message: 'Products retrieved successfully',
          data: {
            products: featuredProducts,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalProducts: 4,
              limit: 12,
              hasMore: false,
            },
          },
        });
      }),
      http.get(`${API_BASE}/products/categories`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Categories retrieved successfully',
          data: ['Electronics', 'Clothing', 'Musical Instruments', 'Home & Garden'],
        });
      }),
    );

    const { container } = renderHome();

    // Skeleton should be visible (animate-pulse elements)
    const skeletonElements = container.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Featured Camera')).toBeInTheDocument();
    });

    // Skeletons should be gone after loading
    const skeletonsAfterLoad = container.querySelectorAll('.animate-pulse');
    expect(skeletonsAfterLoad.length).toBe(0);
  });

  it('gracefully handles API error for products', async () => {
    server.use(
      http.get(`${API_BASE}/products`, () => {
        return HttpResponse.json(
          { success: false, message: 'Internal server error' },
          { status: 500 },
        );
      }),
      http.get(`${API_BASE}/products/categories`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Categories retrieved successfully',
          data: ['Electronics', 'Clothing', 'Musical Instruments', 'Home & Garden'],
        });
      }),
    );

    renderHome();

    // The page should still render without crashing
    await waitFor(() => {
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
    });

    // The "No Products Found" message should appear since products failed to load
    expect(screen.getByText('No Products Found')).toBeInTheDocument();

    // The hero section should still be visible for non-authenticated users
    expect(screen.getByText('Browse Products')).toBeInTheDocument();
  });
});

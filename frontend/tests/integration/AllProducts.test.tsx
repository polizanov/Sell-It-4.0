import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import AllProducts from '../../src/pages/AllProducts';
import { server } from '../../src/mocks/server';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const mockProducts = [
  {
    id: 'prod-1',
    title: 'Vintage Camera',
    description: 'Classic film camera in excellent condition.',
    price: 249.99,
    images: ['https://images.unsplash.com/photo-1.jpg'],
    category: 'Electronics',
    condition: 'Good',
    seller: { _id: 'seller-1', name: 'John Smith' },
    createdAt: '2024-01-15T10:30:00.000Z',
  },
  {
    id: 'prod-2',
    title: 'Running Shoes',
    description: 'High-performance running shoes, size 10.',
    price: 75.0,
    images: ['https://images.unsplash.com/photo-2.jpg'],
    category: 'Sports',
    condition: 'Like New',
    seller: { _id: 'seller-2', name: 'Jane Doe' },
    createdAt: '2024-02-05T10:30:00.000Z',
  },
  {
    id: 'prod-3',
    title: 'Designer Jacket',
    description: 'Limited edition leather jacket.',
    price: 399.99,
    images: ['https://images.unsplash.com/photo-3.jpg'],
    category: 'Clothing',
    condition: 'New',
    seller: { _id: 'seller-1', name: 'John Smith' },
    createdAt: '2024-02-10T10:30:00.000Z',
  },
];

const renderAllProducts = () => {
  return render(
    <MemoryRouter initialEntries={['/products']}>
      <AllProducts />
    </MemoryRouter>,
  );
};

describe('AllProducts Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders products after API fetch', async () => {
    server.use(
      http.get(`${API_BASE}/products`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Products retrieved successfully',
          data: {
            products: mockProducts,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalProducts: 3,
              limit: 12,
              hasMore: false,
            },
          },
        });
      }),
    );

    renderAllProducts();

    await waitFor(() => {
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });

    expect(screen.getByText('Running Shoes')).toBeInTheDocument();
    expect(screen.getByText('Designer Jacket')).toBeInTheDocument();
  });

  it('shows skeleton loader while loading', async () => {
    // Use a delayed response to observe the skeleton state
    server.use(
      http.get(`${API_BASE}/products`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json({
          success: true,
          message: 'Products retrieved successfully',
          data: {
            products: mockProducts,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalProducts: 3,
              limit: 12,
              hasMore: false,
            },
          },
        });
      }),
    );

    const { container } = renderAllProducts();

    // Skeleton should be visible (animate-pulse elements)
    const skeletonElements = container.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);

    // Also check loading text
    expect(screen.getByText('Loading products...')).toBeInTheDocument();

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });
  });

  it('shows "No Products Found" for empty results', async () => {
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

    renderAllProducts();

    await waitFor(() => {
      expect(screen.getByText('No Products Found')).toBeInTheDocument();
    });
  });

  it('shows "Showing X of Y products" count', async () => {
    server.use(
      http.get(`${API_BASE}/products`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Products retrieved successfully',
          data: {
            products: mockProducts,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalProducts: 3,
              limit: 12,
              hasMore: false,
            },
          },
        });
      }),
    );

    renderAllProducts();

    await waitFor(() => {
      expect(screen.getByText('Showing 3 of 3 products')).toBeInTheDocument();
    });
  });

  it('filters by category via API', async () => {
    let capturedUrl = '';

    server.use(
      http.get(`${API_BASE}/products`, ({ request }) => {
        capturedUrl = request.url;
        const url = new URL(request.url);
        const category = url.searchParams.get('category') || '';

        const filtered = category
          ? mockProducts.filter((p) => p.category === category)
          : mockProducts;

        return HttpResponse.json({
          success: true,
          message: 'Products retrieved successfully',
          data: {
            products: filtered,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalProducts: filtered.length,
              limit: 12,
              hasMore: false,
            },
          },
        });
      }),
    );

    renderAllProducts();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });

    // Select a category from the dropdown
    const user = userEvent.setup();
    const categorySelect = screen.getByRole('combobox');
    await user.selectOptions(categorySelect, 'Electronics');

    // Wait for the filtered results
    await waitFor(() => {
      const url = new URL(capturedUrl);
      expect(url.searchParams.get('category')).toBe('Electronics');
    });
  });

  it('shows error state when API fails', async () => {
    server.use(
      http.get(`${API_BASE}/products`, () => {
        return HttpResponse.json(
          { success: false, message: 'Internal server error' },
          { status: 500 },
        );
      }),
    );

    renderAllProducts();

    await waitFor(() => {
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
    });
  });
});

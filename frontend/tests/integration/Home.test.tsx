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

  it('renders features section with white background for non-authenticated users', async () => {
    server.use(
      http.get(`${API_BASE}/products`, () => {
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

    // Wait for page to fully render
    await waitFor(() => {
      expect(screen.getByText('Featured Camera')).toBeInTheDocument();
    });

    // Verify "Why Choose Sell-It" section header is present
    expect(screen.getByText('Why Choose Sell-It')).toBeInTheDocument();

    // Verify all three feature cards are present
    expect(screen.getByText('Easy to Sell')).toBeInTheDocument();
    expect(screen.getByText('Secure Trading')).toBeInTheDocument();
    expect(screen.getByText('Growing Community')).toBeInTheDocument();

    // Verify feature card descriptions
    expect(screen.getByText('List your items in minutes and reach buyers instantly')).toBeInTheDocument();
    expect(screen.getByText('Safe and secure platform for all your transactions')).toBeInTheDocument();
    expect(screen.getByText('Join thousands of buyers and sellers today')).toBeInTheDocument();

    // Verify features section has white background
    const featuresSection = container.querySelector('.bg-white');
    expect(featuresSection).toBeInTheDocument();

    // Verify icon containers with gradient backgrounds exist
    const iconGlowElements = container.querySelectorAll('.bg-gradient-icon-glow');
    expect(iconGlowElements.length).toBeGreaterThanOrEqual(3);

    // Verify animation classes are applied
    const fadeInUpElements = container.querySelectorAll('.animate-fade-in-up');
    expect(fadeInUpElements.length).toBe(3); // Three feature cards
  });

  it('renders MouseFollowGradient in hero section with always mode', async () => {
    server.use(
      http.get(`${API_BASE}/products`, () => {
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

    // Wait for page to fully render
    await waitFor(() => {
      expect(screen.getByText('Featured Camera')).toBeInTheDocument();
    });

    // Verify hero section exists
    expect(screen.getByText('Welcome to')).toBeInTheDocument();

    // Verify gradient overlay is rendered (pointer-events-none indicates the gradient overlay)
    const gradientOverlays = container.querySelectorAll('.pointer-events-none');
    expect(gradientOverlays.length).toBeGreaterThan(0);

    // Hero gradient should be visible immediately (always mode, opacity: 1)
    const heroSection = container.querySelector('.bg-gradient-hero');
    expect(heroSection).toBeInTheDocument();

    // The gradient overlay in always mode should be visible
    const heroGradientOverlay = heroSection?.querySelector('.pointer-events-none') as HTMLElement;
    expect(heroGradientOverlay).toBeTruthy();
    expect(heroGradientOverlay?.style.opacity).toBe('1');
  });

  it('renders MouseFollowGradient in product section with hover mode', async () => {
    server.use(
      http.get(`${API_BASE}/products`, () => {
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

    // Wait for page to fully render
    await waitFor(() => {
      expect(screen.getByText('Featured Camera')).toBeInTheDocument();
    });

    // Verify product section exists
    const productSection = container.querySelector('.bg-dark-bg');
    expect(productSection).toBeInTheDocument();

    // The product section gradient should be in hover mode (initially opacity: 0)
    const productGradientOverlay = productSection?.querySelector('.pointer-events-none') as HTMLElement;
    expect(productGradientOverlay).toBeTruthy();
    expect(productGradientOverlay?.style.opacity).toBe('0');
  });

  it('hides hero and features sections for authenticated users', async () => {
    useAuthStore.setState({
      user: { id: '1', name: 'Test User', username: 'testuser', email: 'test@example.com', isVerified: true },
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
    });

    server.use(
      http.get(`${API_BASE}/products`, () => {
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

    await waitFor(() => {
      expect(screen.getByText('Featured Camera')).toBeInTheDocument();
    });

    // Hero section should NOT be present for authenticated users
    expect(screen.queryByText('Browse Products')).not.toBeInTheDocument();
    expect(screen.queryByText('Start Selling')).not.toBeInTheDocument();

    // Features section should NOT be present for authenticated users
    expect(screen.queryByText('Why Choose Sell-It')).not.toBeInTheDocument();
    expect(screen.queryByText('Easy to Sell')).not.toBeInTheDocument();
    expect(screen.queryByText('Secure Trading')).not.toBeInTheDocument();
    expect(screen.queryByText('Growing Community')).not.toBeInTheDocument();

    // Product listing should still be visible
    expect(screen.getByText('All Products')).toBeInTheDocument();
  });
});

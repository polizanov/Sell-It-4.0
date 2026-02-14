import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { http, HttpResponse } from 'msw';
import ProductDetail from '../../src/pages/ProductDetail';
import { server } from '../../src/mocks/server';
import { useAuthStore } from '../../src/store/authStore';
import { useFavouritesStore } from '../../src/store/favouritesStore';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Renders ProductDetail inside a MemoryRouter configured with the /products/:id route.
 * @param id - The product ID to place in the URL
 */
const renderProductDetail = (id: string) => {
  return render(
    <MemoryRouter initialEntries={[`/products/${id}`]}>
      <Routes>
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/products" element={<div>All Products Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('ProductDetail Page', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    useFavouritesStore.setState({ favouriteIds: new Set<string>(), isLoaded: false });
  });

  it('renders product details after successful fetch', async () => {
    server.use(
      http.get(`${API_BASE}/products/:id`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Product retrieved successfully',
          data: {
            id: '507f1f77bcf86cd799439011',
            title: 'Vintage Camera',
            description:
              'Classic film camera in excellent condition. Perfect for photography enthusiasts.',
            price: 249.99,
            images: [
              'https://images.unsplash.com/photo-1.jpg',
              'https://images.unsplash.com/photo-2.jpg',
            ],
            category: 'Electronics',
            condition: 'Good',
            seller: { _id: 'seller-001', name: 'John Smith', username: 'johnsmith' },
            createdAt: '2024-01-15T10:30:00.000Z',
          },
        });
      }),
    );

    renderProductDetail('507f1f77bcf86cd799439011');

    // Wait for the product title to appear (indicates loading finished)
    await waitFor(() => {
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });

    // Verify price
    expect(screen.getByText('$249.99')).toBeInTheDocument();

    // Verify description
    expect(
      screen.getByText(
        'Classic film camera in excellent condition. Perfect for photography enthusiasts.',
      ),
    ).toBeInTheDocument();

    // Verify category (appears in badges and in the details section)
    const categoryElements = screen.getAllByText('Electronics');
    expect(categoryElements.length).toBeGreaterThanOrEqual(1);

    // Verify condition (appears in badges and in the details section)
    const conditionElements = screen.getAllByText('Good');
    expect(conditionElements.length).toBeGreaterThanOrEqual(1);

    // Verify seller name
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('shows "Product Not Found" when API returns 404', async () => {
    // Use the special not-found ID that the MSW handler recognizes
    renderProductDetail('000000000000000000000000');

    await waitFor(() => {
      expect(screen.getByText('Product Not Found')).toBeInTheDocument();
    });

    expect(
      screen.getByText("Sorry, the product you're looking for doesn't exist."),
    ).toBeInTheDocument();

    // Verify the "Back to Products" button is present
    expect(screen.getByText('Back to Products')).toBeInTheDocument();
  });

  it('shows error message when API returns 500', async () => {
    server.use(
      http.get(`${API_BASE}/products/:id`, () => {
        return HttpResponse.json(
          { success: false, message: 'Internal server error' },
          { status: 500 },
        );
      }),
    );

    renderProductDetail('some-id');

    await waitFor(() => {
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    });

    expect(screen.getByText('Internal server error')).toBeInTheDocument();
  });

  it('"Back to Products" link navigates to /products', async () => {
    // Use the 404 path so we get the "not found" UI with the back link
    renderProductDetail('000000000000000000000000');

    await waitFor(() => {
      expect(screen.getByText('Product Not Found')).toBeInTheDocument();
    });

    // The "Back to Products" text is inside a Link > Button
    const backLink = screen.getByText('Back to Products').closest('a');
    expect(backLink).toHaveAttribute('href', '/products');
  });

  it('Contact Seller button links to seller profile', async () => {
    server.use(
      http.get(`${API_BASE}/products/:id`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Product retrieved successfully',
          data: {
            id: '507f1f77bcf86cd799439011',
            title: 'Test Product',
            description: 'A test product for contact seller test.',
            price: 99.99,
            images: ['https://images.unsplash.com/photo-1.jpg'],
            category: 'Electronics',
            condition: 'New',
            seller: { _id: 'seller-001', name: 'John Smith', username: 'johnsmith' },
            createdAt: '2024-01-15T10:30:00.000Z',
          },
        });
      }),
    );

    renderProductDetail('507f1f77bcf86cd799439011');

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    const contactButton = screen.getByText('Contact Seller');
    const link = contactButton.closest('a');
    expect(link).toHaveAttribute('href', '/profile/johnsmith');
  });

  // --------------------------------------------------------------------------
  // Favourite Button Tests
  // --------------------------------------------------------------------------
  describe('Favourite button', () => {
    const productData = {
      id: '507f1f77bcf86cd799439011',
      title: 'Test Favourite Product',
      description: 'A product to test the favourite button visibility.',
      price: 149.99,
      images: ['https://images.unsplash.com/photo-1.jpg'],
      category: 'Electronics',
      condition: 'Good',
      seller: { _id: 'seller-001', name: 'John Smith', username: 'johnsmith' },
      createdAt: '2024-01-15T10:30:00.000Z',
    };

    beforeEach(() => {
      server.use(
        http.get(`${API_BASE}/products/:id`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Product retrieved successfully',
            data: productData,
          });
        }),
      );
    });

    it('shows heart button for authenticated non-owner user', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-123',
          name: 'Test User',
          username: 'testuser',
          email: 'test@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });
      useFavouritesStore.setState({ favouriteIds: new Set<string>(), isLoaded: true });

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Favourite Product')).toBeInTheDocument();
      });

      const heartButton = screen.getByRole('button', { name: /favourites/i });
      expect(heartButton).toBeInTheDocument();
    });

    it('does NOT show heart button for unauthenticated user', async () => {
      // Auth store is already cleared in beforeEach

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Favourite Product')).toBeInTheDocument();
      });

      const heartButton = screen.queryByRole('button', { name: /favourites/i });
      expect(heartButton).not.toBeInTheDocument();
    });

    it('does NOT show heart button for product owner', async () => {
      // Set user ID to match the seller._id
      useAuthStore.setState({
        user: {
          id: 'seller-001',
          name: 'John Smith',
          username: 'johnsmith',
          email: 'john@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Favourite Product')).toBeInTheDocument();
      });

      const heartButton = screen.queryByRole('button', { name: /favourites/i });
      expect(heartButton).not.toBeInTheDocument();
    });

    it('shows filled heart when product is in favourites', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-123',
          name: 'Test User',
          username: 'testuser',
          email: 'test@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });
      useFavouritesStore.setState({
        favouriteIds: new Set(['507f1f77bcf86cd799439011']),
        isLoaded: true,
      });

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Favourite Product')).toBeInTheDocument();
      });

      const heartButton = screen.getByRole('button', { name: /remove from favourites/i });
      expect(heartButton).toBeInTheDocument();
    });

    it('shows outline heart when product is not in favourites', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-123',
          name: 'Test User',
          username: 'testuser',
          email: 'test@test.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });
      useFavouritesStore.setState({
        favouriteIds: new Set<string>(),
        isLoaded: true,
      });

      renderProductDetail('507f1f77bcf86cd799439011');

      await waitFor(() => {
        expect(screen.getByText('Test Favourite Product')).toBeInTheDocument();
      });

      const heartButton = screen.getByRole('button', { name: /add to favourites/i });
      expect(heartButton).toBeInTheDocument();
    });
  });
});

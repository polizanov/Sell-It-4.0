import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { http, HttpResponse } from 'msw';
import UserProfile from '../../src/pages/UserProfile';
import { server } from '../../src/mocks/server';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const renderUserProfile = (username: string) => {
  return render(
    <MemoryRouter initialEntries={[`/profile/${username}`]}>
      <Routes>
        <Route path="/profile/:username" element={<UserProfile />} />
        <Route path="/products" element={<div>All Products Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('UserProfile Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders user info and products on success', async () => {
    server.use(
      http.get(`${API_BASE}/products/user/:username`, () => {
        return HttpResponse.json({
          success: true,
          message: 'User products retrieved successfully',
          data: {
            user: { name: 'John Smith', username: 'johnsmith', memberSince: '2024-01-15T00:00:00.000Z' },
            products: [
              {
                id: 'prod-1',
                title: 'Vintage Camera',
                description: 'Classic film camera.',
                price: 249.99,
                images: ['https://images.unsplash.com/photo-1.jpg'],
                category: 'Electronics',
                condition: 'Good',
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

    renderUserProfile('johnsmith');

    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    expect(screen.getByText('@johnsmith')).toBeInTheDocument();
    expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    expect(screen.getByText('1 listing')).toBeInTheDocument();
  });

  it('shows "User Not Found" on 404', async () => {
    server.use(
      http.get(`${API_BASE}/products/user/:username`, () => {
        return HttpResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 },
        );
      }),
    );

    renderUserProfile('nonexistent');

    await waitFor(() => {
      expect(screen.getByText('User Not Found')).toBeInTheDocument();
    });

    expect(
      screen.getByText("Sorry, the user you're looking for doesn't exist."),
    ).toBeInTheDocument();
  });

  it('shows empty state for user with 0 products', async () => {
    server.use(
      http.get(`${API_BASE}/products/user/:username`, () => {
        return HttpResponse.json({
          success: true,
          message: 'User products retrieved successfully',
          data: {
            user: { name: 'Empty User', username: 'emptyuser', memberSince: '2024-06-01T00:00:00.000Z' },
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

    renderUserProfile('emptyuser');

    await waitFor(() => {
      expect(screen.getByText('Empty User')).toBeInTheDocument();
    });

    expect(screen.getByText('No Products Found')).toBeInTheDocument();
    expect(screen.getByText("This user hasn't listed any products yet.")).toBeInTheDocument();
    expect(screen.getByText('0 listings')).toBeInTheDocument();
  });
});

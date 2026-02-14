import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { http, HttpResponse } from 'msw';
import MyFavourites from '../../src/pages/MyFavourites';
import { server } from '../../src/mocks/server';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const renderMyFavourites = () => {
  return render(
    <MemoryRouter initialEntries={['/favourites']}>
      <Routes>
        <Route path="/favourites" element={<MyFavourites />} />
        <Route path="/products" element={<div>All Products Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('MyFavourites Page', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'mock-jwt-token');
  });

  it('renders favourited products after fetch', async () => {
    server.use(
      http.get(`${API_BASE}/favourites`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Favourites retrieved successfully',
          data: {
            products: [
              {
                id: 'fav-1',
                title: 'Favourite Camera',
                description: 'A nice camera',
                price: 249.99,
                images: ['https://images.unsplash.com/photo-1.jpg'],
                category: 'Electronics',
                condition: 'Good',
                seller: { _id: 'seller-1', name: 'John Smith', username: 'johnsmith' },
                createdAt: '2024-01-15T10:30:00.000Z',
              },
              {
                id: 'fav-2',
                title: 'Favourite Guitar',
                description: 'A nice guitar',
                price: 180.5,
                images: ['https://images.unsplash.com/photo-2.jpg'],
                category: 'Musical Instruments',
                condition: 'Like New',
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

    renderMyFavourites();

    await waitFor(() => {
      expect(screen.getByText('Favourite Camera')).toBeInTheDocument();
    });
    expect(screen.getByText('Favourite Guitar')).toBeInTheDocument();
  });

  it('shows empty state when no favourites', async () => {
    server.use(
      http.get(`${API_BASE}/favourites`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Favourites retrieved successfully',
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

    renderMyFavourites();

    await waitFor(() => {
      expect(screen.getByText('No favourites yet')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Browse products and tap the heart icon to save them here.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Browse Products')).toBeInTheDocument();
  });

  it('shows error on API failure', async () => {
    server.use(
      http.get(`${API_BASE}/favourites`, () => {
        return HttpResponse.json(
          { success: false, message: 'Internal server error' },
          { status: 500 },
        );
      }),
    );

    renderMyFavourites();

    await waitFor(() => {
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from '../../src/store/authStore';
import { server } from '../../src/mocks/server';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

describe('authStore', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  afterEach(() => {
    consoleSpy.mockClear();
  });

  describe('login', () => {
    it('sets user, token, and isAuthenticated to true', () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        isVerified: true,
        phone: '+359888123456',
        isPhoneVerified: true,
      };

      useAuthStore.getState().login(mockUser, 'test-token');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('test-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('saves token to localStorage', () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        isVerified: true,
        phone: '+359888123456',
        isPhoneVerified: true,
      };

      useAuthStore.getState().login(mockUser, 'test-token');

      expect(localStorage.getItem('token')).toBe('test-token');
    });
  });

  describe('logout', () => {
    it('clears user, token, and isAuthenticated', () => {
      // First login
      const mockUser = {
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        isVerified: true,
        phone: '+359888123456',
        isPhoneVerified: true,
      };
      useAuthStore.getState().login(mockUser, 'test-token');

      // Then logout
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('removes token from localStorage', () => {
      localStorage.setItem('token', 'test-token');

      useAuthStore.getState().logout();

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('setUser', () => {
    it('sets the user without changing other state', () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        isVerified: true,
        phone: '+359888123456',
        isPhoneVerified: true,
      };

      useAuthStore.getState().setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      // Other state should remain unchanged
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('initializeAuth', () => {
    it('restores user when valid token is in localStorage and /me succeeds', async () => {
      localStorage.setItem('token', 'mock-jwt-token');
      useAuthStore.setState({ isLoading: true });

      // Set up MSW handler for this test to return a known user
      server.use(
        http.get(`${API_BASE}/auth/me`, ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          if (authHeader === 'Bearer mock-jwt-token') {
            return HttpResponse.json({
              success: true,
              message: 'User profile retrieved',
              data: {
                id: '1',
                name: 'Test User',
                username: 'testuser',
                email: 'test@example.com',
                isVerified: true,
                phone: '+359888123456',
                isPhoneVerified: true,
              },
            });
          }
          return HttpResponse.json(
            { success: false, message: 'Not authorized' },
            { status: 401 },
          );
        }),
      );

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.user).toEqual({
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        isVerified: true,
        phone: '+359888123456',
        isPhoneVerified: true,
      });
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('sets isPhoneVerified and phone from /me response', async () => {
      localStorage.setItem('token', 'mock-jwt-token');
      useAuthStore.setState({ isLoading: true });

      server.use(
        http.get(`${API_BASE}/auth/me`, ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          if (authHeader === 'Bearer mock-jwt-token') {
            return HttpResponse.json({
              success: true,
              message: 'User profile retrieved',
              data: {
                id: '2',
                name: 'Phone User',
                username: 'phoneuser',
                email: 'phone@example.com',
                isVerified: true,
                phone: '+359888999888',
                isPhoneVerified: false,
              },
            });
          }
          return HttpResponse.json(
            { success: false, message: 'Not authorized' },
            { status: 401 },
          );
        }),
      );

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.user?.phone).toBe('+359888999888');
      expect(state.user?.isPhoneVerified).toBe(false);
      expect(state.isAuthenticated).toBe(true);
    });

    it('clears state and localStorage when token is invalid or expired', async () => {
      localStorage.setItem('token', 'invalid-token');
      useAuthStore.setState({ isLoading: true });

      // The default /me handler will return 401 for invalid tokens.
      // But since the in-memory users array is empty after reset,
      // any token will fail. We override to be explicit:
      server.use(
        http.get(`${API_BASE}/auth/me`, () => {
          return HttpResponse.json(
            { success: false, message: 'Not authorized' },
            { status: 401 },
          );
        }),
      );

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('sets isLoading to false and isAuthenticated to false when no token exists', async () => {
      // No token in localStorage
      useAuthStore.setState({ isLoading: true });

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });
});

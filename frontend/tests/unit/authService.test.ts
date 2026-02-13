import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { authService } from '../../src/services/authService';
import { server } from '../../src/mocks/server';

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('register', () => {
    it('calls POST /api/auth/register and returns success response', async () => {
      server.use(
        http.post('/api/auth/register', async ({ request }) => {
          const body = (await request.json()) as {
            name: string;
            email: string;
            password: string;
          };
          return HttpResponse.json(
            {
              success: true,
              message: 'Registration successful.',
              data: {
                id: '1',
                name: body.name,
                email: body.email,
              },
            },
            { status: 201 },
          );
        }),
      );

      const response = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.data.success).toBe(true);
      expect(response.data.data?.name).toBe('Test User');
      expect(response.data.data?.email).toBe('test@example.com');
    });

    it('returns error response for duplicate email', async () => {
      server.use(
        http.post('/api/auth/register', () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'User already exists with this email',
            },
            { status: 400 },
          );
        }),
      );

      try {
        await authService.register({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123',
        });
        // Should not reach here
        expect.fail('Expected request to throw');
      } catch (error: unknown) {
        const axiosError = error as {
          response: { status: number; data: { message: string } };
        };
        expect(axiosError.response.status).toBe(400);
        expect(axiosError.response.data.message).toBe(
          'User already exists with this email',
        );
      }
    });
  });

  describe('login', () => {
    it('calls POST /api/auth/login and returns success with token', async () => {
      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json({
            success: true,
            message: 'Login successful',
            data: {
              id: '1',
              name: 'Test User',
              email: 'test@example.com',
              isVerified: true,
              token: 'mock-jwt-token',
            },
          });
        }),
      );

      const response = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.data.success).toBe(true);
      expect(response.data.message).toBe('Login successful');
      expect(response.data.data?.token).toBe('mock-jwt-token');
      expect(response.data.data?.email).toBe('test@example.com');
    });

    it('returns 401 for invalid credentials', async () => {
      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json(
            { success: false, message: 'Invalid email or password' },
            { status: 401 },
          );
        }),
      );

      try {
        await authService.login({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        });
        expect.fail('Expected request to throw');
      } catch (error: unknown) {
        const axiosError = error as {
          response: { status: number; data: { message: string } };
        };
        expect(axiosError.response.status).toBe(401);
        expect(axiosError.response.data.message).toBe(
          'Invalid email or password',
        );
      }
    });
  });

  describe('verifyEmail', () => {
    it('calls GET /api/auth/verify-email/:token and returns success', async () => {
      server.use(
        http.get('/api/auth/verify-email/:token', () => {
          return HttpResponse.json({
            success: true,
            message: 'Email verified successfully',
          });
        }),
      );

      const response = await authService.verifyEmail(
        'mock-verification-token',
      );

      expect(response.data.success).toBe(true);
      expect(response.data.message).toBe('Email verified successfully');
    });

    it('returns error for invalid token', async () => {
      server.use(
        http.get('/api/auth/verify-email/:token', () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Invalid or expired verification token',
            },
            { status: 400 },
          );
        }),
      );

      try {
        await authService.verifyEmail('invalid-token');
        expect.fail('Expected request to throw');
      } catch (error: unknown) {
        const axiosError = error as {
          response: { status: number; data: { message: string } };
        };
        expect(axiosError.response.status).toBe(400);
        expect(axiosError.response.data.message).toBe(
          'Invalid or expired verification token',
        );
      }
    });
  });

  describe('getMe', () => {
    it('calls GET /api/auth/me with Bearer token and returns user data', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.get('/api/auth/me', ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          if (authHeader === 'Bearer mock-jwt-token') {
            return HttpResponse.json({
              success: true,
              message: 'User profile retrieved',
              data: {
                id: '1',
                name: 'Test User',
                email: 'test@example.com',
                isVerified: true,
              },
            });
          }
          return HttpResponse.json(
            { success: false, message: 'Not authorized' },
            { status: 401 },
          );
        }),
      );

      const response = await authService.getMe();

      expect(response.data.success).toBe(true);
      expect(response.data.data?.name).toBe('Test User');
      expect(response.data.data?.email).toBe('test@example.com');
    });

    it('returns 401 when no token is set', async () => {
      // No token in localStorage
      server.use(
        http.get('/api/auth/me', () => {
          return HttpResponse.json(
            { success: false, message: 'Not authorized' },
            { status: 401 },
          );
        }),
      );

      try {
        await authService.getMe();
        expect.fail('Expected request to throw');
      } catch (error: unknown) {
        const axiosError = error as {
          response: { status: number; data: { message: string } };
        };
        expect(axiosError.response.status).toBe(401);
      }
    });
  });
});

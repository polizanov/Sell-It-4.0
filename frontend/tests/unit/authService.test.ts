import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { authService } from '../../src/services/authService';
import { server } from '../../src/mocks/server';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('register', () => {
    it('calls POST /api/auth/register and returns success response', async () => {
      server.use(
        http.post(`${API_BASE}/auth/register`, async ({ request }) => {
          const body = (await request.json()) as {
            name: string;
            username: string;
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
                username: body.username,
                email: body.email,
              },
            },
            { status: 201 },
          );
        }),
      );

      const response = await authService.register({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        phone: '+359888123456',
        password: 'password123',
      });

      expect(response.data.success).toBe(true);
      expect(response.data.data?.name).toBe('Test User');
      expect(response.data.data?.username).toBe('testuser');
      expect(response.data.data?.email).toBe('test@example.com');
    });

    it('returns error response for duplicate email', async () => {
      server.use(
        http.post(`${API_BASE}/auth/register`, () => {
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
          username: 'testuser',
          email: 'existing@example.com',
          phone: '+359888123456',
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
        http.post(`${API_BASE}/auth/login`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Login successful',
            data: {
              id: '1',
              name: 'Test User',
              username: 'testuser',
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
        http.post(`${API_BASE}/auth/login`, () => {
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
        http.get(`${API_BASE}/auth/verify-email/:token`, () => {
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
        http.get(`${API_BASE}/auth/verify-email/:token`, () => {
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

  describe('sendPhoneVerification', () => {
    it('calls POST /api/auth/send-phone-verification and returns success', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.post(`${API_BASE}/auth/send-phone-verification`, ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          if (authHeader === 'Bearer mock-jwt-token') {
            return HttpResponse.json({
              success: true,
              message: 'Verification code sent to your phone',
            });
          }
          return HttpResponse.json(
            { success: false, message: 'Not authorized' },
            { status: 401 },
          );
        }),
      );

      const response = await authService.sendPhoneVerification();

      expect(response.data.success).toBe(true);
      expect(response.data.message).toBe('Verification code sent to your phone');
    });

    it('returns 401 when no token is set', async () => {
      server.use(
        http.post(`${API_BASE}/auth/send-phone-verification`, () => {
          return HttpResponse.json(
            { success: false, message: 'Not authorized' },
            { status: 401 },
          );
        }),
      );

      try {
        await authService.sendPhoneVerification();
        expect.fail('Expected request to throw');
      } catch (error: unknown) {
        const axiosError = error as {
          response: { status: number; data: { message: string } };
        };
        expect(axiosError.response.status).toBe(401);
      }
    });
  });

  describe('verifyPhone', () => {
    it('calls POST /api/auth/verify-phone with code and returns success', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.post(`${API_BASE}/auth/verify-phone`, async ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          if (authHeader !== 'Bearer mock-jwt-token') {
            return HttpResponse.json(
              { success: false, message: 'Not authorized' },
              { status: 401 },
            );
          }

          const body = (await request.json()) as { code: string };
          if (body.code === '123456') {
            return HttpResponse.json({
              success: true,
              message: 'Phone number verified successfully',
            });
          }

          return HttpResponse.json(
            { success: false, message: 'Invalid verification code' },
            { status: 400 },
          );
        }),
      );

      const response = await authService.verifyPhone('123456');

      expect(response.data.success).toBe(true);
      expect(response.data.message).toBe('Phone number verified successfully');
    });

    it('returns error for invalid code', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.post(`${API_BASE}/auth/verify-phone`, async ({ request }) => {
          const body = (await request.json()) as { code: string };
          if (body.code !== '123456') {
            return HttpResponse.json(
              { success: false, message: 'Invalid verification code' },
              { status: 400 },
            );
          }
          return HttpResponse.json({
            success: true,
            message: 'Phone number verified successfully',
          });
        }),
      );

      try {
        await authService.verifyPhone('000000');
        expect.fail('Expected request to throw');
      } catch (error: unknown) {
        const axiosError = error as {
          response: { status: number; data: { message: string } };
        };
        expect(axiosError.response.status).toBe(400);
        expect(axiosError.response.data.message).toBe('Invalid verification code');
      }
    });
  });

  describe('getMe', () => {
    it('calls GET /api/auth/me with Bearer token and returns user data', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

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
      expect(response.data.data?.username).toBe('testuser');
      expect(response.data.data?.email).toBe('test@example.com');
    });

    it('returns 401 when no token is set', async () => {
      // No token in localStorage
      server.use(
        http.get(`${API_BASE}/auth/me`, () => {
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

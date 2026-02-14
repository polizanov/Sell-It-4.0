// CRITICAL: Set all environment variables BEFORE any imports of app code.
// The Zod validation in environment.ts runs at import time and will exit the process
// if required env vars are missing.
process.env.PORT = '5001';
process.env.MONGODB_URI = 'mongodb://localhost:27017/sellit-test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '7d';
process.env.GMAIL_USER = 'test@gmail.com';
process.env.GMAIL_APP_PASSWORD = 'test-app-password';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

// Mock the email service to prevent real emails from being sent during tests.
jest.mock('../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';

describe('Auth Endpoints', () => {
  // Shared state across sequential tests
  let authToken: string;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI!);
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  // --------------------------------------------------------------------------
  // POST /api/auth/register
  // --------------------------------------------------------------------------
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Registration successful');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Test User');
      expect(res.body.data.username).toBe('testuser');
      expect(res.body.data.email).toBe('test@example.com');
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app).post('/api/auth/register').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Bad Email',
        username: 'bademail',
        email: 'not-an-email',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for password shorter than 6 characters', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Short Pass',
        username: 'shortpass',
        email: 'short@example.com',
        password: '12345',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for name shorter than 2 characters', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'A',
        username: 'shortname',
        email: 'shortname@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when registering with a duplicate email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User Dupe',
        username: 'testuserdupe',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should return 400 for username shorter than 3 characters', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Short Username',
        username: 'ab',
        email: 'shortusername@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for username with invalid characters', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Invalid Username',
        username: 'test-user',
        email: 'invalidusername@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when registering with a duplicate username', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate Username',
        username: 'testuser',
        email: 'dupeusername@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists|username/i);
    });
  });

  // --------------------------------------------------------------------------
  // GET /api/auth/verify-email/:token
  // --------------------------------------------------------------------------
  describe('GET /api/auth/verify-email/:token', () => {
    it('should verify email with a valid verification token', async () => {
      // Retrieve the verification token directly from the database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).not.toBeNull();
      expect(user!.verificationToken).toBeDefined();

      const res = await request(app).get(
        `/api/auth/verify-email/${user!.verificationToken}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/verified/i);
    });

    it('should return 400 for an invalid verification token', async () => {
      const res = await request(app).get(
        '/api/auth/verify-email/invalid-token-value',
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // POST /api/auth/login
  // --------------------------------------------------------------------------
  describe('POST /api/auth/login', () => {
    it('should login a verified user with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.isVerified).toBe(true);
      expect(res.body.data.name).toBe('Test User');
      expect(res.body.data.username).toBe('testuser');
      expect(res.body.data.email).toBe('test@example.com');

      // Save the token for the GET /me tests
      authToken = res.body.data.token;
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for a non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow an unverified user to login with isVerified=false', async () => {
      // Register a new user (unverified by default)
      await request(app).post('/api/auth/register').send({
        name: 'Unverified User',
        username: 'unverifieduser',
        email: 'unverified@example.com',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'unverified@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.isVerified).toBe(false);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app).post('/api/auth/login').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'not-an-email',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // GET /api/auth/me
  // --------------------------------------------------------------------------
  describe('GET /api/auth/me', () => {
    it('should return the user profile with a valid JWT', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name', 'Test User');
      expect(res.body.data).toHaveProperty('username', 'testuser');
      expect(res.body.data).toHaveProperty('email', 'test@example.com');
      expect(res.body.data).toHaveProperty('isVerified', true);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 when an invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-jwt-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

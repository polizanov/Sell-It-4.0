// CRITICAL: Set all environment variables BEFORE any imports of app code.
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

// Mock the email service
jest.mock('../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

// Mock the SMS service
jest.mock('../src/services/smsService', () => ({
  sendVerificationSMS: jest.fn().mockResolvedValue(undefined),
  generateOTP: jest.fn().mockReturnValue('123456'),
}));

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import crypto from 'crypto';

describe('Auth Edge Cases', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI!);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Verification Token Expiration', () => {
    it('should reject expired verification tokens', async () => {
      // Create user with expired token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

      const user = await User.create({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '+12125552001',
        verificationToken: hashedToken,
        verificationTokenExpiry: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      const response = await request(app)
        .get(`/api/auth/verify-email/${verificationToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    it('should accept valid non-expired verification tokens', async () => {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

      const user = await User.create({
        name: 'Test User',
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'Password123!',
        phone: '+12125552002',
        verificationToken: hashedToken,
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
      });

      const response = await request(app)
        .get(`/api/auth/verify-email/${verificationToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified');
    });
  });

  describe('Resend Verification Email', () => {
    it('should not reveal if user exists', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('If an account exists');
    });

    it('should reject resend for already verified users', async () => {
      const user = await User.create({
        name: 'Verified User',
        username: 'verifieduser',
        email: 'verified@example.com',
        password: 'Password123!',
        phone: '+12125552003',
        isVerified: true,
      });

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'verified@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already verified');
    });

    it('should enforce rate limiting', async () => {
      const user = await User.create({
        name: 'Test User',
        username: 'ratelimituser',
        email: 'ratelimit@example.com',
        password: 'Password123!',
        phone: '+12125552004',
        isVerified: false,
      });

      // Make requests until we hit rate limit
      // Note: Previous tests may have already made requests, so we check for 429
      let hitRateLimit = false;
      let successCount = 0;

      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/auth/resend-verification')
          .send({ email: 'ratelimit@example.com' });

        if (response.status === 429) {
          hitRateLimit = true;
          expect(response.body.message).toContain('Too many');
          break;
        } else {
          successCount++;
        }
      }

      // We should have hit the rate limit at some point
      expect(hitRateLimit).toBe(true);
      // And had at least one successful request
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('Password Requirements', () => {
    it('should reject passwords without uppercase letters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123!',
          phone: '+12125552005',
        })
        .expect(400);

      expect(response.body.message).toContain('uppercase');
    });

    it('should reject passwords without numbers', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password!',
          phone: '+12125552006',
        })
        .expect(400);

      expect(response.body.message).toContain('number');
    });

    it('should reject passwords without special characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123',
          phone: '+12125552007',
        })
        .expect(400);

      expect(response.body.message).toContain('special character');
    });

    it('should reject passwords shorter than 8 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          password: 'Pass1!',
          phone: '+12125552008',
        })
        .expect(400);

      expect(response.body.message).toContain('8 characters');
    });
  });
});

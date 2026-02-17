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
import crypto from 'crypto';
import app from '../src/app';
import { User } from '../src/models/User';
import * as smsService from '../src/services/smsService';

describe('Phone Verification Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI!);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});

    // Register a user (auto-verified in test mode)
    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Phone Test User',
      username: 'phonetestuser',
      email: 'phonetest@example.com',
      password: 'Password123!',
      phone: '+17185556001',
    });

    userId = registerRes.body.data.id;

    // Login to get a token
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'phonetest@example.com',
      password: 'Password123!',
    });

    authToken = loginRes.body.data.token;
  });

  // --------------------------------------------------------------------------
  // POST /api/auth/send-phone-verification
  // --------------------------------------------------------------------------
  describe('POST /api/auth/send-phone-verification', () => {
    it('should send OTP successfully when phone is not verified', async () => {
      // Set phone as unverified
      await User.updateOne(
        { email: 'phonetest@example.com' },
        { $set: { isPhoneVerified: false } },
      );

      const res = await request(app)
        .post('/api/auth/send-phone-verification')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/verification code sent/i);

      // Verify the SMS service mock was called
      expect(smsService.sendVerificationSMS).toHaveBeenCalled();
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post('/api/auth/send-phone-verification');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if phone is already verified', async () => {
      // Phone is already verified from test-mode auto-verification
      const res = await request(app)
        .post('/api/auth/send-phone-verification')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already verified/i);
    });
  });

  // --------------------------------------------------------------------------
  // POST /api/auth/verify-phone
  // --------------------------------------------------------------------------
  describe('POST /api/auth/verify-phone', () => {
    it('should verify phone with valid code', async () => {
      // Set phone as unverified with a known OTP code
      const plainCode = '654321';
      const hashedCode = crypto.createHash('sha256').update(plainCode).digest('hex');

      await User.updateOne(
        { email: 'phonetest@example.com' },
        {
          $set: {
            isPhoneVerified: false,
            phoneVerificationCode: hashedCode,
            phoneVerificationExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
          },
        },
      );

      const res = await request(app)
        .post('/api/auth/verify-phone')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ code: plainCode });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/phone verified/i);

      // Verify the user is now phone-verified in the database
      const user = await User.findOne({ email: 'phonetest@example.com' });
      expect(user?.isPhoneVerified).toBe(true);
      expect(user?.phoneVerificationCode).toBeUndefined();
      expect(user?.phoneVerificationExpiry).toBeUndefined();
    });

    it('should return 400 for invalid (wrong) code', async () => {
      const plainCode = '654321';
      const hashedCode = crypto.createHash('sha256').update(plainCode).digest('hex');

      await User.updateOne(
        { email: 'phonetest@example.com' },
        {
          $set: {
            isPhoneVerified: false,
            phoneVerificationCode: hashedCode,
            phoneVerificationExpiry: new Date(Date.now() + 10 * 60 * 1000),
          },
        },
      );

      const res = await request(app)
        .post('/api/auth/verify-phone')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ code: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('should return 400 for expired code', async () => {
      const plainCode = '654321';
      const hashedCode = crypto.createHash('sha256').update(plainCode).digest('hex');

      await User.updateOne(
        { email: 'phonetest@example.com' },
        {
          $set: {
            isPhoneVerified: false,
            phoneVerificationCode: hashedCode,
            phoneVerificationExpiry: new Date(Date.now() - 1000), // Expired 1 second ago
          },
        },
      );

      const res = await request(app)
        .post('/api/auth/verify-phone')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ code: plainCode });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/expired/i);
    });

    it('should return 400 if phone is already verified', async () => {
      // Phone is already verified from test-mode auto-verification
      const res = await request(app)
        .post('/api/auth/verify-phone')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ code: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already verified/i);
    });

    it('should return 400 for non-6-digit code (Zod validation)', async () => {
      // Set phone as unverified so we hit Zod validation, not the "already verified" check
      await User.updateOne(
        { email: 'phonetest@example.com' },
        { $set: { isPhoneVerified: false } },
      );

      const res = await request(app)
        .post('/api/auth/verify-phone')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ code: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for non-numeric code (Zod validation)', async () => {
      await User.updateOne(
        { email: 'phonetest@example.com' },
        { $set: { isPhoneVerified: false } },
      );

      const res = await request(app)
        .post('/api/auth/verify-phone')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ code: 'abcdef' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-phone')
        .send({ code: '123456' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

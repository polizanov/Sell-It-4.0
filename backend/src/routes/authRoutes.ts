import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { register, login, verifyEmail, getMe, resendVerificationEmail } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { protect } from '../middleware/authMiddleware';
import { User } from '../models/User';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const resendVerificationSchema = z.object({
  email: z.string().email(),
});

// Rate limiter for resend verification (5 requests per 15 minutes)
const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification requests, please try again later' }
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/resend-verification', resendLimiter, validate(resendVerificationSchema), resendVerificationEmail);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', protect, getMe);

// Test-only: set user verification status (for E2E tests)
if (process.env.NODE_ENV === 'test') {
  router.post('/test-set-verified', async (req, res) => {
    const { email, isVerified } = req.body;
    await User.findOneAndUpdate(
      { email },
      { isVerified, verificationToken: undefined, verificationTokenExpiry: undefined }
    );
    res.json({ success: true });
  });
}

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { register, login, verifyEmail, getMe } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { protect } from '../middleware/authMiddleware';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', protect, getMe);

export default router;

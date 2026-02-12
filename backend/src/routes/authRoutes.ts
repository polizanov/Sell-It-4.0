import { Router } from 'express';
import { z } from 'zod';
import { register, login, verifyEmail } from '../controllers/authController';
import { validate } from '../middleware/validate';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(50),
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

export default router;

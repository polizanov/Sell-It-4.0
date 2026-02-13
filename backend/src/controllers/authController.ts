import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { env } from '../config/environment';
import { sendVerificationEmail } from '../services/emailService';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as string,
  } as jwt.SignOptions);
};

export const register = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, username, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User already exists with this email', 400);
  }

  const existingUsername = await User.findOne({ username: username.toLowerCase() });
  if (existingUsername) {
    throw new AppError('Username is already taken', 400);
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');

  const user = await User.create({
    name,
    username,
    email,
    password,
    verificationToken,
  });

  await sendVerificationEmail(email, verificationToken);

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    data: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
    },
  });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isVerified) {
    throw new AppError('Please verify your email before logging in', 403);
  }

  const token = generateToken(String(user._id), user.email);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
      token,
    },
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'User profile retrieved',
    data: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
    },
  });
});

export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { token } = req.params;

  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
});

import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Favourite } from '../models/Favourite';
import { env } from '../config/environment';
import { sendVerificationEmail } from '../services/emailService';
import { generateOTP, sendVerificationSMS } from '../services/smsService';
import { uploadToCloudinary } from '../middleware/upload';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as string,
  } as jwt.SignOptions);
};

/**
 * Register a new user account
 *
 * @route POST /api/auth/register
 * @param {string} name - User's full name (2-50 characters)
 * @param {string} username - Unique username (3-30 characters, alphanumeric + underscore)
 * @param {string} email - Valid email address
 * @param {string} password - Password (min 8 chars, 1 uppercase, 1 number, 1 special char)
 *
 * @returns {Object} response
 * @returns {boolean} response.success - Operation success status
 * @returns {string} response.message - Response message
 * @returns {Object} response.data - User data (without sensitive info)
 * @returns {string} response.data.id - User ID
 * @returns {string} response.data.name - User's name
 * @returns {string} response.data.username - Username
 * @returns {string} response.data.email - Email address
 *
 * @throws {400} User already exists or validation error
 *
 * @example
 * // Request: POST /api/auth/register
 * // Body: { name, username, email, password }
 * // Response:
 * {
 *   "success": true,
 *   "message": "Registration successful. Please check your email to verify your account.",
 *   "data": {
 *     "id": "123",
 *     "name": "John Doe",
 *     "username": "johndoe",
 *     "email": "john@example.com"
 *   }
 * }
 */
export const register = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, username, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User already exists with this email', 400);
  }

  const existingUsername = await User.findOne({ username: username.toLowerCase() });
  if (existingUsername) {
    throw new AppError('Username is already taken', 400);
  }

  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    throw new AppError('User already exists with this phone number', 400);
  }

  // In test environment, auto-verify users to simplify E2E testing
  const isTestEnv = process.env.NODE_ENV === 'test';

  let user;
  if (isTestEnv) {
    user = await User.create({
      name,
      username,
      email,
      password,
      phone,
      isVerified: true,
      isPhoneVerified: true,
    });
  } else {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Generate phone OTP
    const phoneOTP = generateOTP();
    const hashedPhoneOTP = crypto.createHash('sha256').update(phoneOTP).digest('hex');

    user = await User.create({
      name,
      username,
      email,
      password,
      phone,
      verificationToken: hashedToken,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      phoneVerificationCode: hashedPhoneOTP,
      phoneVerificationExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await sendVerificationEmail(email, verificationToken);
    await sendVerificationSMS(phone, phoneOTP);
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    data: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isPhoneVerified: user.isPhoneVerified,
    },
  });
});

/**
 * Login to user account
 *
 * @route POST /api/auth/login
 * @param {string} email - User's email address
 * @param {string} password - User's password
 *
 * @returns {Object} response
 * @returns {boolean} response.success - Operation success status
 * @returns {string} response.message - Response message
 * @returns {Object} response.data - User data with JWT token
 * @returns {string} response.data.id - User ID
 * @returns {string} response.data.name - User's name
 * @returns {string} response.data.username - Username
 * @returns {string} response.data.email - Email address
 * @returns {boolean} response.data.isVerified - Email verification status
 * @returns {string} response.data.token - JWT authentication token
 *
 * @throws {401} Invalid credentials
 *
 * @example
 * // Request: POST /api/auth/login
 * // Body: { email: "john@example.com", password: "Password123!" }
 * // Response:
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "id": "123",
 *     "name": "John Doe",
 *     "username": "johndoe",
 *     "email": "john@example.com",
 *     "isVerified": true,
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 */
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

  const token = generateToken(String(user._id), user.email);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      isPhoneVerified: user.isPhoneVerified,
      profilePhoto: user.profilePhoto,
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
      phone: user.phone,
      isVerified: user.isVerified,
      isPhoneVerified: user.isPhoneVerified,
      profilePhoto: user.profilePhoto,
    },
  });
});

export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const token = String(req.params.token);

  // Hash the incoming token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({ verificationToken: hashedToken });
  if (!user) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  // Check if token has expired
  if (!user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) {
    throw new AppError('Verification token has expired', 400);
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
});

export const sendPhoneVerification = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isPhoneVerified) {
      throw new AppError('Phone number is already verified', 400);
    }

    // Generate OTP, hash with SHA-256, store with 10-minute expiry
    const code = generateOTP();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    user.phoneVerificationCode = hashedCode;
    user.phoneVerificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendVerificationSMS(user.phone, code);

    res.json({
      success: true,
      message: 'Verification code sent to your phone',
    });
  },
);

export const verifyPhone = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { code } = req.body;

    const user = await User.findById(req.user!.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isPhoneVerified) {
      throw new AppError('Phone number is already verified', 400);
    }

    if (!user.phoneVerificationCode || !user.phoneVerificationExpiry) {
      throw new AppError('No verification code found. Please request a new one.', 400);
    }

    // Check if code has expired
    if (user.phoneVerificationExpiry < new Date()) {
      throw new AppError('Verification code has expired. Please request a new one.', 400);
    }

    // Hash input code with SHA-256 and compare with stored hash
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    if (hashedCode !== user.phoneVerificationCode) {
      throw new AppError('Invalid verification code', 400);
    }

    // Mark phone as verified and clear verification fields
    user.isPhoneVerified = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Phone verified successfully',
    });
  },
);

export const resendVerificationEmail = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists for security
    res.json({
      success: true,
      message: 'If an account exists with this email, a verification link has been sent'
    });
    return;
  }

  if (user.isVerified) {
    throw new AppError('Account is already verified', 400);
  }

  // Generate new token with expiry
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  user.verificationToken = hashedToken;
  user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await user.save();

  await sendVerificationEmail(user.email, verificationToken);

  res.json({
    success: true,
    message: 'Verification email sent successfully',
  });
});

/**
 * Change the authenticated user's password
 *
 * @route POST /api/auth/change-password
 * @access Protected - Requires authentication
 * @param {string} currentPassword - The user's current password
 * @param {string} newPassword - The new password (min 8 chars, 1 uppercase, 1 number, 1 special char)
 * @param {string} confirmNewPassword - Must match newPassword
 *
 * @returns {Object} response
 * @returns {boolean} response.success - Operation success status
 * @returns {string} response.message - Response message
 *
 * @throws {400} Current password is incorrect
 */
export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user!.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  },
);

/**
 * Delete the authenticated user's account and all associated data
 *
 * @route DELETE /api/auth/account
 * @access Protected - Requires authentication
 * @param {string} password - The user's password for confirmation
 *
 * @returns {Object} response
 * @returns {boolean} response.success - Operation success status
 * @returns {string} response.message - Response message
 *
 * @throws {400} Password is incorrect
 */
export const deleteAccount = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { password } = req.body;

    const user = await User.findById(req.user!.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Password is incorrect', 400);
    }

    // Cascade delete: favourites, products, then user
    await Favourite.deleteMany({ user: user._id });
    await Product.deleteMany({ seller: user._id });
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  },
);

/**
 * Upload or update the authenticated user's profile photo
 *
 * @route POST /api/auth/profile-photo
 * @access Protected - Requires authentication
 * @param {File} photo - Single image file (multipart/form-data)
 *
 * @returns {Object} response
 * @returns {boolean} response.success - Operation success status
 * @returns {string} response.message - Response message
 * @returns {Object} response.data - Updated profile photo data
 * @returns {string} response.data.profilePhoto - Cloudinary URL of the uploaded photo
 *
 * @throws {400} No image file provided
 */
export const uploadProfilePhoto = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const file = req.file;
    if (!file) {
      throw new AppError('No image file provided', 400);
    }

    const photoUrl = await uploadToCloudinary(file.buffer, 'profile-photos');

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { profilePhoto: photoUrl },
      { new: true },
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      data: {
        profilePhoto: user.profilePhoto,
      },
    });
  },
);

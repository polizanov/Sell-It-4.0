import crypto from 'crypto';
import twilio from 'twilio';
import { env } from '../config/environment';
import { logger } from '../utils/logger';

/**
 * Generate a cryptographically random 6-digit OTP code
 */
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send a verification SMS with the given OTP code
 *
 * - test mode (NODE_ENV === 'test'): no-op
 * - dev mode (NODE_ENV === 'development'): logs OTP to console
 * - production: sends SMS via Twilio SDK
 */
export const sendVerificationSMS = async (to: string, code: string): Promise<void> => {
  if (env.NODE_ENV === 'test') {
    return;
  }

  if (env.NODE_ENV === 'development') {
    logger.info(`[SMS] Verification code for ${to}: ${code}`);
    return;
  }

  // Production: send via Twilio
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
    logger.error('Twilio credentials are not configured');
    throw new Error('SMS service is not configured');
  }

  const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

  try {
    await client.messages.create({
      body: `Your Sell-It verification code is: ${code}. It expires in 10 minutes.`,
      from: env.TWILIO_PHONE_NUMBER,
      to,
    });
    logger.info(`Verification SMS sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send verification SMS:', error);
    throw error;
  }
};

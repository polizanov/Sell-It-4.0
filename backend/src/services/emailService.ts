import nodemailer from 'nodemailer';
import { env } from '../config/environment';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
});

export const sendVerificationEmail = async (
  to: string,
  token: string,
): Promise<void> => {
  const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Sell-It" <${env.GMAIL_USER}>`,
    to,
    subject: 'Verify Your Email - Sell-It',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #333; text-align: center;">Welcome to Sell-It!</h1>
        <p style="color: #666; font-size: 16px;">Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">
            Verify Email
          </a>
        </div>
        <p style="color: #999; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    throw error;
  }
};

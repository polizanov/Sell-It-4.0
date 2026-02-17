import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import type { ApiError } from '@/types';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: () => void;
}

const maskPhone = (phone: string): string => {
  if (phone.length <= 6) return phone;
  const start = phone.slice(0, 4);
  const end = phone.slice(-3);
  return `${start}${'*'.repeat(phone.length - 7)}${end}`;
};

export const PhoneVerificationModal = ({
  isOpen,
  onClose,
  onVerified,
}: PhoneVerificationModalProps) => {
  const { user, setUser } = useAuthStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCode('');
      setError('');
      setResendMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCodeChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(numericValue);
    setError('');
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await authService.verifyPhone(code);
      if (user) {
        setUser({ ...user, isPhoneVerified: true });
      }
      onVerified?.();
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(axiosError.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage('');
    setError('');

    try {
      await authService.sendPhoneVerification();
      setResendMessage('Code sent!');
      setTimeout(() => setResendMessage(''), 3000);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(axiosError.response?.data?.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  const maskedPhone = user?.phone ? maskPhone(user.phone) : 'your phone';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-verify-title"
        className="relative bg-dark-surface border border-dark-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-black/50"
      >
        {/* Phone Icon */}
        <div className="mx-auto w-12 h-12 rounded-full bg-orange/10 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 text-orange"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
            />
          </svg>
        </div>

        {/* Title */}
        <h2
          id="phone-verify-title"
          className="mt-4 text-lg font-bold text-text-primary text-center"
        >
          Verify Your Phone Number
        </h2>

        {/* Phone number display */}
        <p className="mt-2 text-sm text-text-secondary text-center">
          Enter the 6-digit code sent to {maskedPhone}
        </p>

        {/* Code Input */}
        <div className="mt-6">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="000000"
            className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-text-primary text-center text-2xl tracking-[0.5em] font-mono placeholder:text-text-muted placeholder:tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent transition-all duration-200"
            autoFocus
          />
        </div>

        {/* Error Message */}
        {error && (
          <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
        )}

        {/* Resend Message */}
        {resendMessage && (
          <p className="mt-3 text-sm text-green-400 text-center">{resendMessage}</p>
        )}

        {/* Verify Button */}
        <div className="mt-6">
          <Button
            variant="primary"
            fullWidth
            onClick={handleVerify}
            disabled={isVerifying || code.length !== 6}
          >
            {isVerifying ? 'Verifying...' : 'Verify'}
          </Button>
        </div>

        {/* Resend Link */}
        <div className="mt-4 text-center">
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-sm text-orange hover:text-orange-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
};

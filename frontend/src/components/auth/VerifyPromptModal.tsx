import { useEffect } from 'react';
import { Button } from '@/components/common/Button';

interface VerifyPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  needsEmail: boolean;
  needsPhone: boolean;
  onVerifyPhone: () => void;
}

export const VerifyPromptModal = ({
  isOpen,
  onClose,
  needsEmail,
  needsPhone,
  onVerifyPhone,
}: VerifyPromptModalProps) => {
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

  const handleVerifyPhone = () => {
    onVerifyPhone();
    onClose();
  };

  // Determine icon and messaging
  const showPhoneIcon = needsPhone;
  const showEmailIcon = needsEmail && !needsPhone;

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
        aria-labelledby="verify-prompt-title"
        className="relative bg-dark-surface border border-dark-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-black/50"
      >
        {/* Icon */}
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
          {showPhoneIcon ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-amber-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
              />
            </svg>
          ) : showEmailIcon ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-amber-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          ) : null}
        </div>

        {/* Title */}
        <h2
          id="verify-prompt-title"
          className="mt-4 text-lg font-bold text-text-primary text-center"
        >
          Verification Required
        </h2>

        {/* Messages */}
        <div className="mt-2 text-sm text-text-secondary text-center space-y-3">
          {needsEmail && needsPhone && (
            <>
              <p>You need to verify both your email and phone number to add a product.</p>
              <p>Check your inbox for the email verification link.</p>
            </>
          )}
          {needsEmail && !needsPhone && (
            <>
              <p>Verify your email to add a product.</p>
              <p>Check your inbox for the verification link.</p>
            </>
          )}
          {!needsEmail && needsPhone && (
            <p>Verify your phone number to add a product.</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-3">
          {needsPhone && (
            <Button variant="primary" fullWidth onClick={handleVerifyPhone}>
              Verify Now
            </Button>
          )}
          <Button variant="secondary" fullWidth onClick={onClose}>
            {needsPhone ? 'Cancel' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
};

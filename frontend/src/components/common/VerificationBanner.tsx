import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

export const VerificationBanner = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isAuthenticated || user?.isVerified !== false || isDismissed) {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed top-[73px] md:top-[73px] left-0 right-0 z-40 bg-amber-900/90 backdrop-blur-sm border-b border-amber-500"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <svg
            className="w-5 h-5 text-amber-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-amber-100 text-sm font-medium">
            Your email is not verified. Please check your inbox to verify your email and unlock all
            features.
          </p>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 p-1 text-amber-300 hover:text-amber-100 transition-colors"
          aria-label="Dismiss verification warning"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

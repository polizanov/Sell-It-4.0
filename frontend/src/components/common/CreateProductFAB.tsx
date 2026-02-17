import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { CreateProductModal } from '../product/CreateProductModal';
import { VerifyPromptModal } from '../auth/VerifyPromptModal';
import { PhoneVerificationModal } from '../auth/PhoneVerificationModal';

export const CreateProductFAB = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVerifyPopupOpen, setIsVerifyPopupOpen] = useState(false);
  const [isPhoneVerifyModalOpen, setIsPhoneVerifyModalOpen] = useState(false);

  // Only show FAB for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  const handleClick = () => {
    const isFullyVerified =
      user?.isVerified !== false && user?.isPhoneVerified !== false;

    if (isFullyVerified) {
      setIsModalOpen(true);
    } else {
      setIsVerifyPopupOpen(true);
    }
  };

  const handleVerifyPhone = () => {
    setIsVerifyPopupOpen(false);
    setIsPhoneVerifyModalOpen(true);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleClick}
        className="fixed bottom-8 left-8 md:bottom-8 md:left-8 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-cta shadow-fab hover:shadow-fab-hover hover:scale-110 transition-all duration-300 ease-out flex items-center justify-center group focus:outline-none focus:ring-4 focus:ring-orange focus:ring-offset-4 focus:ring-offset-dark-bg"
        aria-label="Create new product listing"
        aria-haspopup="dialog"
        aria-expanded={isModalOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 text-white group-hover:rotate-45 transition-transform duration-300 ease-out"
        >
          <path
            fillRule="evenodd"
            d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Verify Prompt Modal */}
      <VerifyPromptModal
        isOpen={isVerifyPopupOpen}
        onClose={() => setIsVerifyPopupOpen(false)}
        needsEmail={user?.isVerified === false}
        needsPhone={user?.isPhoneVerified === false}
        onVerifyPhone={handleVerifyPhone}
      />

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={isPhoneVerifyModalOpen}
        onClose={() => setIsPhoneVerifyModalOpen(false)}
      />
    </>
  );
};

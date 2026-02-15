import { useEffect, useRef } from 'react';
import { EditProductForm } from './EditProductForm';
import { useAuthStore } from '../../store/authStore';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productData: {
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    images: string[];
    sellerId: string;
  };
  onSuccess: () => void;
}

export const EditProductModal = ({ isOpen, onClose, productId, productData, onSuccess }: EditProductModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  // Check ownership
  const isOwner = user?.id === productData.sellerId;

  useEffect(() => {
    if (!isOpen) return;

    // Handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Focus trap logic
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      handleKeyDown(e);
      handleTabKey(e);
    };

    document.addEventListener('keydown', handleKeyPress);

    // Focus on modal when opened
    if (modalRef.current) {
      const firstInput = modalRef.current.querySelector('input') as HTMLElement;
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }

    // Prevent background scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 animate-[fadeIn_200ms_ease-out]"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal Container - Orange Gradient Frame */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-product-modal-title"
        className="relative bg-gradient-cta rounded-none sm:rounded-xl shadow-2xl shadow-orange/40 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-hidden animate-scale-in"
      >
        {/* White Card Inside */}
        <div className="bg-white rounded-none sm:rounded-lg m-0 sm:m-1 h-full sm:h-auto sm:max-h-[calc(90vh-8px)] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Icon */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-cta flex items-center justify-center shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
              </div>

              {/* Title */}
              <h2
                id="edit-product-modal-title"
                className="text-xl sm:text-2xl font-bold text-gray-900"
              >
                Edit Product
              </h2>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <div className="px-4 py-4 sm:px-8 sm:py-6">
            {!isOwner ? (
              <div className="text-center py-8">
                <h3 className="text-2xl font-bold text-red-500 mb-4">Not Authorized</h3>
                <p className="text-gray-700 mb-6">
                  You are not authorized to edit this product.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-base font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100"
                >
                  Close
                </button>
              </div>
            ) : (
              <EditProductForm
                productId={productId}
                initialData={{
                  title: productData.title,
                  description: productData.description,
                  price: productData.price,
                  category: productData.category,
                  condition: productData.condition,
                  existingImages: productData.images,
                }}
                onSuccess={handleSuccess}
                onCancel={onClose}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

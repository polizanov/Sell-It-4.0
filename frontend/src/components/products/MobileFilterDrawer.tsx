import { useEffect } from 'react';
import { FilterSidebar } from './FilterSidebar';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sort: string;
  onSortChange: (sort: string) => void;
  selectedConditions: string[];
  onConditionsChange: (conditions: string[]) => void;
  conditionCounts: Record<string, number>;
}

export const MobileFilterDrawer = ({
  isOpen,
  onClose,
  sort,
  onSortChange,
  selectedConditions,
  onConditionsChange,
  conditionCounts,
}: MobileFilterDrawerProps) => {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-in Drawer Panel */}
      <div
        data-testid="filter-drawer"
        className={`fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-dark-surface border-r border-dark-border z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-dark-border">
            <h2 className="text-lg font-semibold text-text-primary">Filters</h2>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-orange rounded-lg transition-colors"
              aria-label="Close filters"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <FilterSidebar
              sort={sort}
              onSortChange={onSortChange}
              selectedConditions={selectedConditions}
              onConditionsChange={onConditionsChange}
              conditionCounts={conditionCounts}
            />
          </div>
        </div>
      </div>
    </>
  );
};

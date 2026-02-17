import PhoneInputLib from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string | undefined) => void;
  error?: string;
  variant?: 'dark' | 'light';
}

export const PhoneInput = ({
  label,
  value,
  onChange,
  error,
  variant = 'light',
}: PhoneInputProps) => {
  const inputId = label?.toLowerCase().replace(/\s+/g, '-');

  const labelClasses =
    variant === 'light'
      ? 'block text-sm font-medium text-gray-700 mb-2'
      : 'block text-sm font-medium text-text-secondary mb-2';

  const wrapperClasses =
    variant === 'light'
      ? `phone-input-wrapper phone-input-light w-full px-4 py-3 bg-white border rounded-lg transition-all duration-200 ${
          error
            ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500'
            : 'border-gray-300 focus-within:ring-2 focus-within:ring-orange focus-within:border-transparent'
        }`
      : `phone-input-wrapper phone-input-dark w-full px-4 py-3 bg-dark-elevated border rounded-lg transition-all duration-200 ${
          error
            ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500'
            : 'border-dark-border focus-within:ring-2 focus-within:ring-orange focus-within:border-transparent'
        }`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
        </label>
      )}
      <div className={wrapperClasses}>
        <PhoneInputLib
          id={inputId}
          international
          defaultCountry="BG"
          value={value}
          onChange={onChange}
          className="phone-input-field"
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <style>{`
        .phone-input-wrapper .PhoneInput {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .phone-input-wrapper .PhoneInputCountry {
          display: flex;
          align-items: center;
        }
        .phone-input-wrapper .PhoneInputCountryIcon {
          width: 24px;
          height: 18px;
        }
        .phone-input-wrapper .PhoneInputCountrySelectArrow {
          margin-left: 4px;
          opacity: 0.6;
        }
        .phone-input-light .PhoneInputCountrySelectArrow {
          color: #374151;
        }
        .phone-input-dark .PhoneInputCountrySelectArrow {
          color: #9ca3af;
        }
        .phone-input-wrapper .PhoneInputInput {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 1rem;
          line-height: 1.5;
        }
        .phone-input-light .PhoneInputInput {
          color: #111827;
        }
        .phone-input-light .PhoneInputInput::placeholder {
          color: #9ca3af;
        }
        .phone-input-dark .PhoneInputInput {
          color: #f3f4f6;
        }
        .phone-input-dark .PhoneInputInput::placeholder {
          color: #6b7280;
        }
        .phone-input-wrapper .PhoneInputCountrySelect {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          z-index: 1;
          border: 0;
          opacity: 0;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

import { useState } from 'react';
import { Link } from 'react-router';
import { PageContainer } from '../layout/PageContainer';
import { Card } from './Card';
import { Button } from './Button';
import { PhoneVerificationModal } from '../auth/PhoneVerificationModal';

interface VerificationRequiredProps {
  message?: string;
  backTo?: string;
  backLabel?: string;
  type?: 'email' | 'phone';
}

export const VerificationRequired = ({
  message,
  backTo = '/',
  backLabel = 'Go to Homepage',
  type = 'email',
}: VerificationRequiredProps) => {
  const [isPhoneVerifyOpen, setIsPhoneVerifyOpen] = useState(false);

  const defaultMessage =
    type === 'phone'
      ? 'You need to verify your phone number before you can access this feature.'
      : 'You need to verify your email address before you can access this feature. Please check your inbox for a verification link.';

  const displayMessage = message || defaultMessage;

  const heading =
    type === 'phone' ? 'Phone Verification Required' : 'Email Verification Required';

  return (
    <PageContainer>
      <div className="max-w-md mx-auto">
        <Card>
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                {type === 'phone' ? (
                  <svg
                    className="w-8 h-8 text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8 text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                )}
              </div>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-3">{heading}</h1>
            <p className="text-text-secondary mb-8">{displayMessage}</p>
            <div className="flex flex-col gap-3 items-center">
              {type === 'phone' && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsPhoneVerifyOpen(true)}
                >
                  Verify Now
                </Button>
              )}
              <Link to={backTo}>
                <Button variant={type === 'phone' ? 'secondary' : 'primary'} size="md">
                  {backLabel}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {type === 'phone' && (
        <PhoneVerificationModal
          isOpen={isPhoneVerifyOpen}
          onClose={() => setIsPhoneVerifyOpen(false)}
        />
      )}
    </PageContainer>
  );
};

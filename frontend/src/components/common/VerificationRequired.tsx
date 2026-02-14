import { Link } from 'react-router';
import { PageContainer } from '../layout/PageContainer';
import { Card } from './Card';
import { Button } from './Button';

interface VerificationRequiredProps {
  message?: string;
  backTo?: string;
  backLabel?: string;
}

export const VerificationRequired = ({
  message = 'You need to verify your email address before you can access this feature. Please check your inbox for a verification link.',
  backTo = '/',
  backLabel = 'Go to Homepage',
}: VerificationRequiredProps) => {
  return (
    <PageContainer>
      <div className="max-w-md mx-auto">
        <Card>
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
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
              </div>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-3">
              Email Verification Required
            </h1>
            <p className="text-text-secondary mb-8">{message}</p>
            <Link to={backTo}>
              <Button variant="primary" size="md">
                {backLabel}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

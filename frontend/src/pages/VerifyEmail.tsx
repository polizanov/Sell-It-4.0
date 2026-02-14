import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AxiosError } from 'axios';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/common/Card';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import type { ApiError } from '../types';

type VerifyStatus = 'loading' | 'success' | 'error';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerifyStatus>(token ? 'loading' : 'error');
  const [errorMessage, setErrorMessage] = useState(
    token ? '' : 'Invalid verification link'
  );
  const verificationAttempted = useRef(false);
  const { isAuthenticated, user, setUser } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        if (user) {
          setUser({ ...user, isVerified: true });
        }
        setStatus('success');
      } catch (error) {
        const axiosError = error as AxiosError<ApiError>;
        const message =
          axiosError.response?.data?.message || 'Verification failed';
        setErrorMessage(message);
        setStatus('error');
      }
    };

    verify();
  }, [token]);

  return (
    <PageContainer>
      <div className="max-w-md mx-auto">
        <Card>
          <div className="text-center py-4">
            {status === 'loading' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange" />
                </div>
                <p className="text-text-secondary text-lg">
                  Verifying your email...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <h1 className="text-3xl font-bold text-text-primary mb-4">
                  Email Verified!
                </h1>
                <p className="text-text-secondary mb-8">
                  Your email has been successfully verified. You now have full access to all features.
                </p>
                <Link
                  to={isAuthenticated ? '/' : '/login'}
                  className="inline-block bg-orange text-white hover:bg-orange-hover font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  {isAuthenticated ? 'Go to Homepage' : 'Go to Login'}
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <h1 className="text-3xl font-bold text-red-500 mb-4">
                  Verification Failed
                </h1>
                <p className="text-text-secondary mb-8">{errorMessage}</p>
                <Link
                  to="/login"
                  className="inline-block bg-orange text-white hover:bg-orange-hover font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Go to Login
                </Link>
              </>
            )}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default VerifyEmail;

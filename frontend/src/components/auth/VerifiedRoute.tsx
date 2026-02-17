import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { VerificationRequired } from '../common/VerificationRequired';

interface VerifiedRouteProps {
  children: ReactNode;
  requirePhone?: boolean;
}

export const VerifiedRoute = ({ children, requirePhone = false }: VerifiedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.isVerified === false) {
    return <VerificationRequired />;
  }

  if (requirePhone && user?.isPhoneVerified === false) {
    return <VerificationRequired type="phone" />;
  }

  return <>{children}</>;
};

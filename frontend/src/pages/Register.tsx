import { useState, FormEvent } from 'react';
import { Link } from 'react-router';
import { AxiosError } from 'axios';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { MouseFollowGradient } from '../components/common/MouseFollowGradient';
import { authService } from '../services/authService';
import type { ApiError } from '../types';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    general: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Reset errors
    setErrors({ name: '', username: '', email: '', password: '', confirmPassword: '', general: '' });

    // Validation
    let hasErrors = false;
    const newErrors = { name: '', username: '', email: '', password: '', confirmPassword: '', general: '' };

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      hasErrors = true;
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      hasErrors = true;
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      hasErrors = true;
    } else if (formData.username.trim().length > 30) {
      newErrors.username = 'Username must be at most 30 characters';
      hasErrors = true;
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
      hasErrors = true;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      hasErrors = true;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      hasErrors = true;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      hasErrors = true;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      hasErrors = true;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      hasErrors = true;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.register({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      setRegistrationSuccess(true);
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const message =
        axiosError.response?.data?.message || 'An unexpected error occurred. Please try again.';
      setErrors((prev) => ({ ...prev, general: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen relative bg-white">
        <MouseFollowGradient
          activationMode="hover"
          gradientColor="rgba(255, 87, 34, 0.08)"
          gradientSize={70}
          disableOnMobile={true}
        >
          <PageContainer className="relative z-10">
            <div className="max-w-md mx-auto">
              <Card className="bg-white border-green-500/50 shadow-xl">
                <div className="text-center py-8">
                  {/* Success Icon with scale-in animation */}
                  <div className="w-24 h-24 bg-gradient-success-icon rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/50 animate-scale-in">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Check Your Email
                  </h1>
                  <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                    We've sent a verification link to your email. Please check your inbox and click the link to verify your account.
                  </p>
                  <Link
                    to="/login"
                    className="inline-block bg-gradient-cta hover:bg-gradient-cta-hover text-white font-medium px-8 py-4 rounded-lg transition-all duration-300 shadow-xl shadow-orange/40 hover:shadow-2xl hover:shadow-orange/50"
                  >
                    Go to Login
                  </Link>
                </div>
              </Card>
            </div>
          </PageContainer>
        </MouseFollowGradient>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-white">
      <MouseFollowGradient
        activationMode="hover"
        gradientColor="rgba(255, 87, 34, 0.08)"
        gradientSize={70}
        disableOnMobile={true}
      >
        <PageContainer className="relative z-10">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-icon-glow rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Create Account
              </h1>
              <p className="text-gray-600 text-lg">
                Join Sell-It and start trading today
              </p>
            </div>

            <Card className="bg-white border-gray-200 hover:border-orange/30 shadow-xl transition-all duration-500">
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                  <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-600 text-sm">
                    {errors.general}
                  </div>
                )}

                <Input
                  type="text"
                  label="Full Name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  variant="light"
                />

                <Input
                  type="text"
                  label="Username"
                  placeholder="your_username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  error={errors.username}
                  variant="light"
                />

                <Input
                  type="text"
                  label="Email Address"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  variant="light"
                />

                <Input
                  type="password"
                  label="Password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                  variant="light"
                />

                <Input
                  type="password"
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  error={errors.confirmPassword}
                  variant="light"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  gradient={true}
                  disabled={isSubmitting}
                  className="shadow-xl shadow-orange/40 hover:shadow-2xl hover:shadow-orange/50 transition-shadow duration-300"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-orange hover:text-orange-hover font-medium transition-colors">
                    Login here
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        </PageContainer>
      </MouseFollowGradient>
    </div>
  );
};

export default Register;

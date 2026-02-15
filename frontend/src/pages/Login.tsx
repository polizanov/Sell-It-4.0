import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { AxiosError } from 'axios';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { MouseFollowGradient } from '../components/common/MouseFollowGradient';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import type { ApiError } from '../types';

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Reset errors
    setErrors({ email: '', password: '', general: '' });

    // Validation
    let hasErrors = false;
    const newErrors = { email: '', password: '', general: '' };

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
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      const { data } = response.data;
      if (data && data.token) {
        login(
          {
            id: data.id,
            name: data.name,
            username: data.username,
            email: data.email,
            isVerified: data.isVerified,
          },
          data.token
        );
        navigate('/');
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const message =
        axiosError.response?.data?.message || 'An unexpected error occurred. Please try again.';
      setErrors((prev) => ({ ...prev, general: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen relative bg-white overflow-hidden">
      <MouseFollowGradient
        activationMode="always"
        gradientColor="rgba(255, 87, 34, 0.08)"
        gradientSize={70}
        disableOnMobile={true}
      >
        <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
          <div className="w-full max-w-md pt-28 pb-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-icon-glow rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Welcome Back
              </h1>
              <p className="text-gray-600 text-lg">
                Login to your Sell-It account
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
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
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
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-orange hover:text-orange-hover font-medium transition-colors">
                    Register here
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </MouseFollowGradient>
    </section>
  );
};

export default Login;

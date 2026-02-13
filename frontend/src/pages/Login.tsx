import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { AxiosError } from 'axios';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
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
    <PageContainer>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Welcome Back
          </h1>
          <p className="text-text-secondary">
            Login to your Sell-It account
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500 text-sm">
                {errors.general}
              </div>
            )}

            <Input
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              required
            />

            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              required
            />

            <Button type="submit" variant="primary" size="md" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary">
              Don't have an account?{' '}
              <Link to="/register" className="text-orange hover:text-orange-hover font-medium transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Login;

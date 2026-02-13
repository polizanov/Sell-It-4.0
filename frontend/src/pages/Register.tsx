import { useState, FormEvent } from 'react';
import { Link } from 'react-router';
import { AxiosError } from 'axios';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { authService } from '../services/authService';
import type { ApiError } from '../types';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    name: '',
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
    setErrors({ name: '', email: '', password: '', confirmPassword: '', general: '' });

    // Validation
    let hasErrors = false;
    const newErrors = { name: '', email: '', password: '', confirmPassword: '', general: '' };

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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
      <PageContainer>
        <div className="max-w-md mx-auto">
          <Card>
            <div className="text-center py-4">
              <h1 className="text-3xl font-bold text-text-primary mb-4">
                Check Your Email
              </h1>
              <p className="text-text-secondary mb-8">
                We've sent a verification link to your email. Please check your inbox and click the link to verify your account.
              </p>
              <Link
                to="/login"
                className="inline-block bg-orange text-white hover:bg-orange-hover font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Go to Login
              </Link>
            </div>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Create Account
          </h1>
          <p className="text-text-secondary">
            Join Sell-It and start trading today
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
              type="text"
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              required
            />

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
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              required
            />

            <Input
              type="password"
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              required
            />

            <Button type="submit" variant="primary" size="md" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-orange hover:text-orange-hover font-medium transition-colors">
                Login here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Register;

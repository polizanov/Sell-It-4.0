import { useState, FormEvent } from 'react';
import { Link } from 'react-router';
import { AxiosError } from 'axios';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { PhoneInput } from '../components/common/PhoneInput';
import { Button } from '../components/common/Button';
import { MouseFollowGradient } from '../components/common/MouseFollowGradient';
import { authService } from '../services/authService';
import type { ApiError } from '../types';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
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
    setErrors({ name: '', username: '', email: '', phone: '', password: '', confirmPassword: '', general: '' });

    // Validation
    let hasErrors = false;
    const newErrors = { name: '', username: '', email: '', phone: '', password: '', confirmPassword: '', general: '' };

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

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
      hasErrors = true;
    } else if (!isValidPhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
      hasErrors = true;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      hasErrors = true;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      hasErrors = true;
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
      hasErrors = true;
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
      hasErrors = true;
    } else if (!/[^a-zA-Z0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
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
        phone: formData.phone,
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
      <section className="min-h-screen relative bg-white overflow-hidden">
        <MouseFollowGradient
          activationMode="always"
          gradientColor="rgba(255, 87, 34, 0.08)"
          gradientSize={70}
          disableOnMobile={true}
        >
          <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
            <div className="w-full max-w-md pt-28 pb-8">
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
                  <p className="text-gray-600 text-lg mb-4 leading-relaxed">
                    We've sent a verification link to your email. Please check your inbox and click the link to verify your account.
                  </p>
                  <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                    You'll also need to verify your phone number after logging in.
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
          </div>
        </MouseFollowGradient>
      </section>
    );
  }

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

                <PhoneInput
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(value) => setFormData({ ...formData, phone: value || '' })}
                  error={errors.phone}
                  variant="light"
                />

                <Input
                  type="password"
                  label="Password"
                  placeholder="8+ chars, uppercase, number, special char"
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
        </div>
      </MouseFollowGradient>
    </section>
  );
};

export default Register;

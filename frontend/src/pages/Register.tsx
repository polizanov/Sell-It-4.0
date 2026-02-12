import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../store/authStore';

const Register = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: FormEvent) => {
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

    // For now, just log the form data (API integration later)
    console.log('Register form submitted:', {
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });

    // Simulate successful registration and login (for demo purposes)
    login(
      {
        id: '1',
        name: formData.name,
        email: formData.email,
      },
      'demo-token-12345'
    );

    // Redirect to home page
    navigate('/');
  };

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

            <Button type="submit" variant="primary" size="md" fullWidth>
              Create Account
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

import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { authService } from '@/services/authService';
import type { ApiError } from '@/types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    general: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setErrors({ currentPassword: '', newPassword: '', confirmNewPassword: '', general: '' });
      setSuccessMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
      general: '',
    };
    let hasErrors = false;

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
      hasErrors = true;
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
      hasErrors = true;
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
      hasErrors = true;
    } else if (!/[A-Z]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter';
      hasErrors = true;
    } else if (!/[0-9]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number';
      hasErrors = true;
    } else if (!/[^a-zA-Z0-9]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one special character';
      hasErrors = true;
    }

    if (!formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Please confirm your new password';
      hasErrors = true;
    } else if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Passwords do not match';
      hasErrors = true;
    }

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, general: '' }));

    try {
      await authService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmNewPassword: formData.confirmNewPassword,
      });
      setSuccessMessage('Password changed successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setErrors((prev) => ({
        ...prev,
        general: axiosError.response?.data?.message || 'Failed to change password. Please try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="relative bg-dark-surface border border-dark-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-black/50"
      >
        {/* Lock Icon */}
        <div className="mx-auto w-12 h-12 rounded-full bg-orange/10 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 text-orange"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2
          id="change-password-title"
          className="mt-4 text-lg font-bold text-text-primary text-center"
        >
          Change Password
        </h2>

        <p className="mt-2 text-sm text-text-secondary text-center">
          Enter your current password and choose a new one
        </p>

        {/* Success Message */}
        {successMessage && (
          <div className="mt-4 bg-green-900/20 border border-green-500/30 rounded-lg px-4 py-3">
            <p className="text-green-400 text-sm text-center">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {errors.general && (
          <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3">
            <p className="text-red-400 text-sm text-center">{errors.general}</p>
          </div>
        )}

        {/* Form Fields */}
        <div className="mt-6 space-y-4">
          <Input
            variant="dark"
            type="password"
            label="Current Password"
            placeholder="Enter current password"
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            error={errors.currentPassword}
          />

          <Input
            variant="dark"
            type="password"
            label="New Password"
            placeholder="8+ chars, uppercase, number, special char"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            error={errors.newPassword}
          />

          <Input
            variant="dark"
            type="password"
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={formData.confirmNewPassword}
            onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
            error={errors.confirmNewPassword}
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </div>
    </div>
  );
};

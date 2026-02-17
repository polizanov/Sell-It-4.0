import { useState, useEffect, useRef } from 'react';
import { AxiosError } from 'axios';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import type { ApiError } from '@/types';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfilePhotoModal = ({ isOpen, onClose }: ProfilePhotoModalProps) => {
  const { user, setUser } = useAuthStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreview(null);
      setError('');
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

  useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccessMessage('');
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const response = await authService.uploadProfilePhoto(selectedFile);
      const profilePhoto = response.data.data.profilePhoto;

      if (user) {
        setUser({ ...user, profilePhoto });
      }

      setSuccessMessage('Profile photo updated successfully');
      setSelectedFile(null);
      setPreview(null);

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(
        axiosError.response?.data?.message || 'Failed to upload photo. Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
        aria-labelledby="profile-photo-title"
        className="relative bg-dark-surface border border-dark-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-black/50"
      >
        {/* Camera Icon */}
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
              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2
          id="profile-photo-title"
          className="mt-4 text-lg font-bold text-text-primary text-center"
        >
          Change Profile Photo
        </h2>

        <p className="mt-2 text-sm text-text-secondary text-center">
          Upload a new profile photo
        </p>

        {/* Preview Area */}
        <div className="mt-6 flex justify-center">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-dark-border flex items-center justify-center bg-dark-elevated">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-text-secondary">{initials}</span>
            )}
          </div>
        </div>

        {/* File Input */}
        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3 bg-dark-elevated border border-dark-border border-dashed rounded-lg text-text-secondary hover:text-text-primary hover:border-text-muted transition-all duration-200 text-sm text-center"
          >
            {selectedFile ? selectedFile.name : 'Click to select an image'}
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mt-4 bg-green-900/20 border border-green-500/30 rounded-lg px-4 py-3">
            <p className="text-green-400 text-sm text-center">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
        </div>
      </div>
    </div>
  );
};

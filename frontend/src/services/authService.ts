import api from './api';
import type { AuthResponse } from '../types';

interface RegisterData {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  register: (data: RegisterData) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: LoginData) =>
    api.post<AuthResponse>('/auth/login', data),

  verifyEmail: (token: string) =>
    api.get<AuthResponse>(`/auth/verify-email/${token}`),

  getMe: () =>
    api.get<AuthResponse>('/auth/me'),

  sendPhoneVerification: () =>
    api.post<{ success: boolean; message: string }>('/auth/send-phone-verification'),

  verifyPhone: (code: string) =>
    api.post<{ success: boolean; message: string }>('/auth/verify-phone', { code }),
};

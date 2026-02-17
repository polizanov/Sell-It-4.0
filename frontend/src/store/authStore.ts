import { create } from 'zustand';
import type { User } from '../types';
import { authService } from '../services/authService';
import { useFavouritesStore } from './favouritesStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: !!localStorage.getItem('token'),
  login: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true, isLoading: false });
    useFavouritesStore.getState().loadFavouriteIds();
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    useFavouritesStore.getState().clearFavourites();
  },
  setUser: (user) => set({ user }),
  initializeAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const response = await authService.getMe();
      const data = response.data.data;
      if (data) {
        set({
          user: {
            id: data.id,
            name: data.name,
            username: data.username,
            email: data.email,
            isVerified: data.isVerified,
            phone: data.phone,
            isPhoneVerified: data.isPhoneVerified,
            profilePhoto: data.profilePhoto,
          },
          isAuthenticated: true,
          isLoading: false,
        });
        useFavouritesStore.getState().loadFavouriteIds();
      }
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

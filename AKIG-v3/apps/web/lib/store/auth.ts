'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Secure storage wrapper
const secureStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      // Basic tampering check
      const [value, signature] = item.split('.');
      const expectedSig = btoa(value).slice(0, 16);
      if (signature !== expectedSig) {
        console.warn('⚠️ Storage tampering detected');
        localStorage.removeItem(key);
        return null;
      }
      return atob(value);
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    const encoded = btoa(value);
    const signature = encoded.slice(0, 16);
    localStorage.setItem(key, `${encoded}.${signature}`);
  },
  
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await apiClient.post('/api/v1/auth/login', {
            email,
            password,
          });
          
          const user = jwtDecode<User>(data.accessToken);
          
          set({
            user,
            token: data.accessToken,
            refreshToken: data.refreshToken,
            isLoading: false,
          });

          // Set httpOnly cookie via API route
          if (typeof window !== 'undefined') {
            await fetch('/api/auth/set-cookie', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: data.accessToken }),
            });
          }

        } catch (err: any) {
          const errorMessage = err.response?.data?.message || 'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        const token = get().token;
        
        // Call logout API
        if (token) {
          try {
            await apiClient.post('/api/v1/auth/logout', {}, {
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch (err) {
            console.error('Logout API call failed', err);
          }
        }
        
        // Clear cookie
        if (typeof window !== 'undefined') {
          await fetch('/api/auth/clear-cookie', { method: 'POST' });
        }
        
        // Clear store
        set({
          user: null,
          token: null,
          refreshToken: null,
          error: null,
        });
      },

      refresh: async () => {
        const refreshToken = get().refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const { data } = await apiClient.post('/api/v1/auth/refresh', {
            refreshToken,
          });
          
          const user = jwtDecode<User>(data.accessToken);
          
          set({
            token: data.accessToken,
            user,
          });

          // Update cookie
          if (typeof window !== 'undefined') {
            await fetch('/api/auth/set-cookie', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: data.accessToken }),
            });
          }
        } catch (err) {
          // Refresh failed, logout
          get().logout();
          throw err;
        }
      },

      setUser: (user) => set({ user }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'akig-auth-storage',
      storage: secureStorage,
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);

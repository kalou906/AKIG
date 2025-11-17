import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, createApiClient } from '../lib/api';

const STORAGE_KEY = 'akig.auth';

export type AuthUser = {
  id: number;
  email: string;
  name?: string | null;
  role?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

function readStoredAuth(): { token: string | null; user: AuthUser | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse auth storage', error);
    return { token: null, user: null };
  }
}

function persistAuth(token: string | null, user: AuthUser | null) {
  if (!token) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [{ token: storedToken, user: storedUser }] = useState(readStoredAuth);
  const [token, setToken] = useState<string | null>(storedToken);
  const [user, setUser] = useState<AuthUser | null>(storedUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest<{ ok: boolean; data: { user: AuthUser } }>(
          '/auth/me',
          token,
          { authenticated: true }
        );

        if (!cancelled) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Failed to bootstrap session', error);
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    persistAuth(token, user);
  }, [token, user]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<{
      ok: boolean;
      data: { token: string; user: AuthUser };
    }>(
      '/auth/login',
      null,
      {
        method: 'POST',
        authenticated: false,
        body: { email, password },
      }
    );

    setToken(result.data.token);
    setUser(result.data.user);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const response = await apiRequest<{ ok: boolean; data: { user: AuthUser } }>(
      '/auth/me',
      token,
      { authenticated: true }
    );
    setUser(response.data.user);
  }, [token]);

  const value = useMemo<AuthState>(() => ({
    user,
    token,
    loading,
    login,
    logout,
    refreshProfile,
  }), [user, token, loading, login, logout, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useApiClient() {
  const { token, logout } = useAuth();
  const client = useMemo(() => createApiClient(token), [token]);

  const guardedClient = useMemo(() => ({
    async get<T>(path: string, options?: Parameters<typeof client.get<T>>[1]) {
      try {
        return await client.get<T>(path, options);
      } catch (error) {
        if ((error as any)?.status === 401) logout();
        throw error;
      }
    },
    async post<T>(path: string, body?: unknown, options?: Parameters<typeof client.post<T>>[2]) {
      try {
        return await client.post<T>(path, body, options);
      } catch (error) {
        if ((error as any)?.status === 401) logout();
        throw error;
      }
    },
    async put<T>(path: string, body?: unknown, options?: Parameters<typeof client.put<T>>[2]) {
      try {
        return await client.put<T>(path, body, options);
      } catch (error) {
        if ((error as any)?.status === 401) logout();
        throw error;
      }
    },
    async del<T>(path: string, options?: Parameters<typeof client.del<T>>[1]) {
      try {
        return await client.del<T>(path, options);
      } catch (error) {
        if ((error as any)?.status === 401) logout();
        throw error;
      }
    },
  }), [client, logout]);

  return guardedClient;
}

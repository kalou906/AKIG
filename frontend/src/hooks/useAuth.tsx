import React from 'react';

/**
 * Types pour l'authentification
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role?: 'admin' | 'manager' | 'user';
  avatar?: string;
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

/**
 * Contexte d'authentification
 */
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Charger l'utilisateur au démarrage
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Appeler l'API pour valider le token
          const response = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem('auth_token');
          }
        }
      } catch (err) {
        console.error('Erreur au chargement du profil:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Identifiants incorrects');
      }

      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement');
      }

      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur d\'enregistrement';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      const updated = await response.json();
      setUser(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    updateProfile,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook pour utiliser l'authentification
 */
export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  }
  return context;
}

/**
 * Composant protégé (accès seulement aux utilisateurs authentifiés)
 */
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
}: ProtectedRouteProps): React.ReactElement {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : <div className="p-8 text-center">Accès refusé</div>;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return fallback ? <>{fallback}</> : <div className="p-8 text-center">Permissions insuffisantes</div>;
  }

  return <>{children}</>;
}

/**
 * Composant d'avatar utilisateur
 */
export interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ size = 'md', className = '' }: UserAvatarProps): React.ReactElement {
  const { user } = useAuth();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  if (!user) return <div />;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-blue-500 text-white font-semibold flex items-center justify-center ${className}`}
      title={user.name}
    >
      {user.avatar ? <img src={user.avatar} alt={user.name} /> : initials}
    </div>
  );
}

/**
 * Composant de menu utilisateur
 */
export interface UserMenuProps {
  onLogout?: () => void;
}

export function UserMenu({ onLogout }: UserMenuProps): React.ReactElement {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  if (!user) return <div />;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 transition"
      >
        <UserAvatar size="sm" />
        <span className="text-sm text-gray-700">{user.name}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded shadow-lg z-10 w-48">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="font-semibold text-sm">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>

          <a
            href="/profile"
            className="block px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
            onClick={() => setIsOpen(false)}
          >
            Mon profil
          </a>

          <a
            href="/settings"
            className="block px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 border-b border-gray-200"
            onClick={() => setIsOpen(false)}
          >
            Paramètres
          </a>

          <button
            onClick={() => {
              handleLogout();
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600"
          >
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Hook pour gérer la session (auto-logout après inactivité)
 */
export function useSessionTimeout(timeout: number = 30 * 60 * 1000) {
  const { logout } = useAuth();
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        logout();
      }, timeout);
    };

    // Événements qui réinitialisent le timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [logout, timeout]);
}

/**
 * Hook pour envoyer les tokens aux requêtes
 */
export function useFetch() {
  const { logout } = useAuth();

  const fetchWithAuth = React.useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = localStorage.getItem('auth_token');

      const requestOptions: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      if (token && typeof requestOptions.headers === 'object') {
        (requestOptions.headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, requestOptions);

      // Si le token est expiré
      if (response.status === 401) {
        await logout();
        throw new Error('Session expirée');
      }

      return response;
    },
    [logout]
  );

  return fetchWithAuth;
}

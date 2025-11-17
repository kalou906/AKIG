import React from 'react';

/**
 * Gestionnaire de cache avec localStorage
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn?: number; // millisecondes
}

export class CacheManager {
  private prefix = 'app_cache_';

  set<T>(key: string, data: T, expiresIn?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresIn,
    };
    localStorage.setItem(this.prefix + key, JSON.stringify(entry));
  }

  get<T>(key: string): T | null {
    try {
      const json = localStorage.getItem(this.prefix + key);
      if (!json) return null;

      const entry: CacheEntry<T> = JSON.parse(json);

      // Vérifier l'expiration
      if (entry.expiresIn) {
        const age = Date.now() - entry.timestamp;
        if (age > entry.expiresIn) {
          this.remove(key);
          return null;
        }
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  keys(): string[] {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(this.prefix))
      .map((k) => k.replace(this.prefix, ''));
  }
}

/**
 * Instance globale du cache
 */
export const cache = new CacheManager();

/**
 * Hook pour gérer le cache avec React
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    expiresIn?: number;
    skip?: boolean;
  }
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [data, setData] = React.useState<T | null>(() => {
    const cached = cache.get<T>(key);
    return cached || null;
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const refresh = React.useCallback(async () => {
    if (options?.skip) return;

    setIsLoading(true);
    try {
      const result = await fetcher();
      cache.set(key, result, options?.expiresIn);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, options?.expiresIn, options?.skip]);

  React.useEffect(() => {
    const cached = cache.get<T>(key);
    if (cached) {
      setData(cached);
    } else if (!options?.skip) {
      refresh();
    }
  }, [key, options?.skip, refresh]);

  return { data, isLoading, error, refresh };
}

/**
 * Hook pour stocker l'état local avec localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (err) {
      console.error('Erreur localStorage:', err);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook pour gérer les préférences utilisateur
 */
export interface UserPreferences {
  theme?: 'light' | 'dark';
  language?: string;
  pageSize?: number;
  sidebarCollapsed?: boolean;
  defaultYear?: number;
  [key: string]: any;
}

export function useUserPreferences() {
  const [prefs, setPrefs] = useLocalStorage<UserPreferences>('user_preferences', {
    theme: 'light',
    language: 'fr-GN',
    pageSize: 25,
    sidebarCollapsed: false,
  });

  const updatePref = (key: string, value: any) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  const resetPreferences = () => {
    setPrefs({
      theme: 'light',
      language: 'fr-GN',
      pageSize: 25,
      sidebarCollapsed: false,
    });
  };

  return {
    preferences: prefs,
    updatePref,
    resetPreferences,
  };
}

/**
 * Hook pour gérer le state de session (survit à la fermeture du composant)
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (err) {
      console.error('Erreur sessionStorage:', err);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook pour synchroniser l'état entre plusieurs onglets
 */
export function useSyncStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, boolean] {
  const [value, setValue] = useLocalStorage(key, initialValue);
  const [isSynced, setIsSynced] = React.useState(true);

  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const newValue = JSON.parse(e.newValue);
          setValue(newValue);
          setIsSynced(true);
        } catch {
          setIsSynced(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, setValue]);

  const setSyncValue = (newValue: T | ((val: T) => T)) => {
    setValue(newValue);
  };

  return [value, setSyncValue, isSynced];
}

/**
 * Composant pour afficher le statut de synchronisation
 */
export interface SyncStatusProps {
  isSynced: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function SyncStatus({
  isSynced,
  position = 'bottom-right',
}: SyncStatusProps): React.ReactElement | null {
  const [visible, setVisible] = React.useState(!isSynced);

  React.useEffect(() => {
    if (isSynced) {
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [isSynced]);

  if (!visible) return null;

  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={`fixed ${positions[position]} px-3 py-2 rounded text-sm font-medium ${
        isSynced
          ? 'bg-green-100 text-green-700'
          : 'bg-yellow-100 text-yellow-700'
      } shadow transition`}
    >
      {isSynced ? '✓ Synchronisé' : '⟳ Synchronisation...'}
    </div>
  );
}

/**
 * Contexte global pour le cache
 */
export interface CacheContextType {
  cache: CacheManager;
  clearCache: () => void;
}

export const CacheContext = React.createContext<CacheContextType | undefined>(undefined);

export interface CacheProviderProps {
  children: React.ReactNode;
}

export function CacheProvider({ children }: CacheProviderProps): React.ReactElement {
  const clearCache = () => {
    cache.clear();
  };

  return (
    <CacheContext.Provider value={{ cache, clearCache }}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCacheContext(): CacheContextType {
  const context = React.useContext(CacheContext);
  if (!context) {
    throw new Error('useCacheContext doit être utilisé dans <CacheProvider>');
  }
  return context;
}

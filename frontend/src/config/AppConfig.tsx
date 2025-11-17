import React from 'react';
import { AuthProvider } from '../hooks/useAuth';
import { NotificationProvider, NotificationContainer } from '../hooks/useNotification';
import { CacheProvider } from '../hooks/useCache';
import ErrorBoundaryRobust from '../components/ErrorBoundaryRobust';

/**
 * AppProviders - Wrapper avec tous les contextes globaux
 * 
 * Utilisation au top niveau (main.tsx ou App.tsx):
 * 
 * <AppProviders>
 *   <App />
 * </AppProviders>
 */
export function AppProviders({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <ErrorBoundaryRobust>
      <CacheProvider>
        <AuthProvider>
          <NotificationProvider>
            {children}
            <NotificationContainer position="top-right" />
          </NotificationProvider>
        </AuthProvider>
      </CacheProvider>
    </ErrorBoundaryRobust>
  );
}

/**
 * AppLayout - Layout principal avec Navbar et Sidebar
 * 
 * Utilisation:
 * 
 * <AppLayout>
 *   <MainContent />
 * </AppLayout>
 */
export interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showNavbar?: boolean;
}

export function AppLayout({
  children,
  showSidebar = true,
  showNavbar = true,
}: AppLayoutProps): React.ReactElement {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Navbar */}
      {showNavbar && (
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100 rounded lg:hidden"
              >
                ☰
              </button>
              <h1 className="text-lg font-bold text-gray-900">AKIG</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded">🔔</button>
              <button className="p-2 hover:bg-gray-100 rounded">⚙️</button>
            </div>
          </div>
        </nav>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <aside
            className={`bg-gray-900 text-white transition-all duration-300 ${
              sidebarCollapsed ? 'w-16' : 'w-64'
            } overflow-y-auto`}
          >
            <nav className="p-4 space-y-2">
              <NavLink to="/dashboard" collapsed={sidebarCollapsed}>
                📊 Dashboard
              </NavLink>
              <NavLink to="/tenants" collapsed={sidebarCollapsed}>
                👥 Locataires
              </NavLink>
              <NavLink to="/payments" collapsed={sidebarCollapsed}>
                💰 Paiements
              </NavLink>
              <NavLink to="/import-csv" collapsed={sidebarCollapsed}>
                📥 Import
              </NavLink>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  collapsed?: boolean;
}

function NavLink({ to, children, collapsed = false }: NavLinkProps): React.ReactElement {
  return (
    <a
      href={to}
      className={`block px-4 py-2 rounded hover:bg-gray-800 transition ${
        collapsed ? 'text-center' : ''
      }`}
      title={collapsed ? String(children) : undefined}
    >
      {collapsed ? String(children).charAt(0) : children}
    </a>
  );
}

/**
 * AppConfig - Configuration centralisée
 */
export const AppConfig = {
  // API
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  
  // Authentification
  AUTH: {
    TOKEN_KEY: 'auth_token',
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    REFRESH_TOKEN_KEY: 'refresh_token',
  },

  // Cache
  CACHE: {
    DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
    MAX_SIZE: 1000,
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 25,
    MAX_PAGE_SIZE: 100,
  },

  // Notifications
  NOTIFICATIONS: {
    DEFAULT_DURATION: 4000,
    POSITION: 'top-right' as const,
  },

  // Logging
  LOGGING: {
    LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    MAX_LOGS: 1000,
  },
};

/**
 * Thème Tailwind personnalisé
 */
export const AppTheme = {
  colors: {
    primary: '#0f2557', // Bleu foncé
    secondary: '#1e40af', // Bleu
    success: '#16a34a', // Vert
    warning: '#ea580c', // Orange
    danger: '#dc2626', // Rouge
    info: '#0284c7', // Bleu clair
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};

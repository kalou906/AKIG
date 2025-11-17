/**
 * App.tsx - Composant racine de l'application
 * 
 * Les providers sont gérés dans main.tsx
 */

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppLayout } from './config/AppConfig';
import AppRoutes from './routes';

function App(): React.ReactElement {
  return (
    <Router>
      <AppLayout showSidebar showNavbar>
        <AppRoutes />
      </AppLayout>
    </Router>
  );
}

export default App;

/**
 * Structure de l'application:
 * 
 * Root (main.tsx)
 *   ├── ErrorBoundary
 *   ├── AppProviders
 *   │   ├── CacheProvider
 *   │   ├── AuthProvider
 *   │   ├── NotificationProvider
 *   │   └── NotificationContainer
 *   └── App (ce fichier)
 *       ├── Router
 *       ├── AppLayout
 *       │   ├── Navbar
 *       │   ├── Sidebar
 *       │   └── Main Content
 *       └── AppRoutes
 *           ├── Dashboard
 *           ├── TenantsList
 *           ├── TenantDetail
 *           ├── ImportCsv
 *           └── 404
 */

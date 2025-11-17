/**
 * main.tsx - Point d'entrée de l'application
 * 
 * Configuration centralisée de tous les providers et setup initial
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Imports des providers
import { AppProviders } from './config/AppConfig';
import ErrorBoundaryRobust from './components/ErrorBoundaryRobust';

/**
 * Root Component avec tous les providers
 */
function Root() {
  return (
    <ErrorBoundaryRobust>
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundaryRobust>
  );
}

// Render
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

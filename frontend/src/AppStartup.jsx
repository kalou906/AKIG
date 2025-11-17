/**
 * ============================================================
 * src/AppStartup.jsx - App robuste avec toutes routes, flags
 * ErrorBoundary, RequireAuth, Layout, 404 handling
 * ============================================================
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import { flags } from './lib/flags';

// Pages
import Dashboard from './pages/Dashboard';
import Contrats from './pages/Contrats';
import Paiements from './pages/Paiements';
import Proprietes from './pages/Proprietes';
import Locataires from './pages/Locataires';
import Rapports from './pages/Rapports';
import Rappels from './pages/Rappels';
import Preavis from './pages/Preavis';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Route qui peut être désactivée par flag
function FlaggedRoute({ flag, element }) {
  if (!flag) {
    return <Navigate to="/404" replace />;
  }
  return element;
}

export default function AppStartup() {
  const [apiHealth, setApiHealth] = useState(null);

  useEffect(() => {
    // Vérifier santé API au démarrage
    fetch('/api/health')
      .then(r => r.json())
      .then(data => {
        console.log('✅ [AppStartup] API Health:', data);
        setApiHealth(data);
      })
      .catch(err => {
        console.error('❌ [AppStartup] API indisponible:', err);
        setApiHealth({ ready: false, error: err.message });
      });
  }, []);

  if (apiHealth === null) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>⏳ Initialisation...</p>
      </div>
    );
  }

  if (!apiHealth.ready) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#fff3cd',
        color: '#856404',
        borderRadius: '4px',
        textAlign: 'center'
      }}>
        <h2>⚠️ API Indisponible</h2>
        <p>Le serveur API n'est pas prêt. Vérifiez que le backend est lancé.</p>
        <p style={{ fontSize: '12px' }}>{apiHealth.error && `Erreur: ${apiHealth.error}`}</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Layout principal avec nav */}
          <Route element={<Layout />}>

            {/* Routes protégées par auth */}
            <Route element={<RequireAuth />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/contrats" element={<FlaggedRoute flag={flags.contrats} element={<Contrats />} />} />
              <Route path="/paiements" element={<FlaggedRoute flag={flags.paiements} element={<Paiements />} />} />
              <Route path="/proprietes" element={<FlaggedRoute flag={flags.proprietes} element={<Proprietes />} />} />
              <Route path="/locataires" element={<FlaggedRoute flag={flags.locataires} element={<Locataires />} />} />
              <Route path="/rapports" element={<FlaggedRoute flag={flags.rapports} element={<Rapports />} />} />
              <Route path="/rappels" element={<FlaggedRoute flag={flags.rappels} element={<Rappels />} />} />
              <Route path="/preavis" element={<FlaggedRoute flag={flags.preavis} element={<Preavis />} />} />
            </Route>

            {/* Routes publiques */}
            <Route path="/login" element={<Login />} />
            <Route path="/404" element={<NotFound />} />

            {/* Fallback 404 */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

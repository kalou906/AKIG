/**
 * ============================================================
 * App.jsx - Routes consolidées AKIG
 * Architecture stable: ErrorBoundary → Layout → RequireAuth → Pages
 * ============================================================
 */

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout & Auth Components
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import ErrorBoundary from './components/ErrorBoundary';

// Pages - Route par module
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contrats from './pages/Contrats';
import Paiements from './pages/Paiements';
import Proprietes from './pages/Proprietes';
import Locataires from './pages/Locataires';
import Rapports from './pages/Rapports';
import Rappels from './pages/Rappels';
import Preavis from './pages/Preavis';
import NotFound from './pages/NotFound';

// Fallback loading
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="spinner"></div>
    <p>Chargement...</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Layout wrapper pour toutes les routes */}
          <Route element={<Layout />}>
            {/* Route de login - pas d'auth requis */}
            <Route path="/login" element={<Login />} />

            {/* Routes protégées - nécessite authentification */}
            <Route element={<RequireAuth />}>
              <Route
                path="/"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Dashboard />
                  </Suspense>
                }
              />
              <Route
                path="/contrats"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Contrats />
                  </Suspense>
                }
              />
              <Route
                path="/paiements"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Paiements />
                  </Suspense>
                }
              />
              <Route
                path="/proprietes"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Proprietes />
                  </Suspense>
                }
              />
              <Route
                path="/locataires"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Locataires />
                  </Suspense>
                }
              />
              <Route
                path="/rapports"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Rapports />
                  </Suspense>
                }
              />
              <Route
                path="/rappels"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Rappels />
                  </Suspense>
                }
              />
              <Route
                path="/preavis"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Preavis />
                  </Suspense>
                }
              />
            </Route>

            {/* 404 - Route explicite pour inconnues */}
            <Route path="/404" element={<NotFound />} />

            {/* Catch-all: redirige vers 404 */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

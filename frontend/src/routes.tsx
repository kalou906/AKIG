import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

// MVP Pages unified
import Dashboard from './pages/Dashboard';
import TenantsPage from './pages/TenantsPage';
import TenantDetailPage from './pages/TenantDetailPage';
import Properties from './pages/Properties';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import ImportCsvPayments from './pages/ImportCsvPayments';
import Login from './pages/Login';

export function AppRoutes(): React.ReactElement {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<MainLayout />}> {/* Protected shell */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/tenant/:tenantId" element={<TenantDetailPage />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/import-csv" element={<ImportCsvPayments />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App(): React.ReactElement {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

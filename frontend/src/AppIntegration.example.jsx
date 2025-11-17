/**
 * App.jsx Modifications
 * Phase 8-10 Integration: Add routes for Candidatures, Attachments, Reports
 * 
 * Add to your existing App.jsx:
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Existing imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Locataires from './pages/Locataires';
import Contracts from './pages/Contracts';
import Payments from './pages/Payments';
import Proprietaires from './pages/Proprietaires';
import Settings from './pages/Settings';

// Phase 8-10 imports (NEW)
import Candidatures from './pages/Candidatures';
import Reports from './pages/Reports';

// Components
import Navbar from './components/Navbar';

// Protected Route Component
function ProtectedRoute({ element, requiredRole }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && (!user || user.role !== requiredRole)) {
    return <Navigate to="/dashboard" />;
  }

  return element;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <div className="pt-16">
                  <Routes>
                    {/* Existing Routes */}
                    <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
                    <Route path="/properties" element={<ProtectedRoute element={<Properties />} />} />
                    <Route path="/locataires" element={<ProtectedRoute element={<Locataires />} />} />
                    <Route path="/contracts" element={<ProtectedRoute element={<Contracts />} />} />
                    <Route path="/payments" element={<ProtectedRoute element={<Payments />} />} />
                    <Route path="/proprietaires" element={<ProtectedRoute element={<Proprietaires />} />} />
                    <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />

                    {/* Phase 8-10 Routes (NEW) */}
                    <Route path="/candidatures" element={<ProtectedRoute element={<Candidatures />} />} />
                    <Route path="/reports" element={<ProtectedRoute element={<Reports />} requiredRole="admin" />} />

                    {/* Attachment route (used within other pages) */}
                    {/* No dedicated page, integrated via FileUploader & MediaGallery components */}

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </div>
              </>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

/**
 * Navbar.jsx Modifications
 * Add menu items for Phase 8-10
 * 
 * Add these menu items to your existing navigation:
 */

/*
// In Navbar.jsx, add to menu items array:

const menuItems = [
  { label: 'Tableau de bord', icon: 'LayoutGrid', path: '/dashboard' },
  { label: 'Propriétés', icon: 'Building2', path: '/properties' },
  { label: 'Propriétaires', icon: 'Users', path: '/proprietaires' },
  { label: 'Locataires', icon: 'Users2', path: '/locataires' },
  { label: 'Contrats', icon: 'FileText', path: '/contracts' },
  { label: 'Paiements', icon: 'CreditCard', path: '/payments' },
  
  // Phase 8-10 Menu Items (NEW)
  { label: 'Candidatures', icon: 'ClipboardList', path: '/candidatures' },
  { label: 'Pièces jointes', icon: 'Paperclip', path: '/attachments' }, // OR use within context
  { label: 'Rapports', icon: 'BarChart3', path: '/reports', adminOnly: true },
  
  { label: 'Paramètres', icon: 'Settings', path: '/settings' }
];
*/

/**
 * INTEGRATION CHECKLIST
 * 
 * 1. ✅ Created Candidatures.jsx (Phase 8 page)
 * 2. ✅ Created CandidatureForm.jsx (Phase 8 modal)
 * 3. ✅ Created FileUploader.jsx (Phase 9 component)
 * 4. ✅ Created MediaGallery.jsx (Phase 9 component)
 * 5. ✅ Created Reports.jsx (Phase 10 page)
 * 6. ✅ Created phase8-10.services.js (API services)
 * 7. ⏳ Update App.jsx with routes (see above)
 * 8. ⏳ Update Navbar.jsx with menu items (see comments)
 * 9. ⏳ Import FileUploader & MediaGallery in entity detail pages
 * 10. ⏳ Run: npm test (backend tests)
 * 11. ⏳ Run: npm run dev (frontend dev server)
 * 12. ⏳ Test Phase 8-10 workflows end-to-end
 * 
 * USAGE EXAMPLES IN EXISTING PAGES
 * ================================
 * 
 * In Properties.jsx (detail view):
 * import FileUploader from '../components/FileUploader';
 * import MediaGallery from '../components/MediaGallery';
 * 
 * <button onClick={() => setShowUploader(true)}>Ajouter fichiers</button>
 * {showUploader && (
 *   <FileUploader
 *     entityType="property"
 *     entityId={propertyId}
 *     onSuccess={() => fetchProperty()}
 *     onClose={() => setShowUploader(false)}
 *   />
 * )}
 * 
 * {showGallery && (
 *   <MediaGallery
 *     entityType="property"
 *     entityId={propertyId}
 *     onClose={() => setShowGallery(false)}
 *   />
 * )}
 * 
 * In Candidatures.jsx (already included):
 * import FileUploader from '../components/FileUploader';
 * import MediaGallery from '../components/MediaGallery';
 * // Files auto-loaded for candidature entity
 * 
 */

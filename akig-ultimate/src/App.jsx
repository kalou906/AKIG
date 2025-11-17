import { Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider } from "./contexts/RoleContext";
import Layout from "./components/Layout";
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import DashboardPDG from "./pages/DashboardPDG";
import DashboardComptable from "./pages/DashboardComptable";
import DashboardAgent from "./pages/DashboardAgent";
import AIInterface from "./pages/AIInterface";
import IAModule from "./pages/IAModule";
import SettingsPage from "./pages/SettingsPage";
import Locataires from "./pages/Locataires";
import Contrats from "./pages/Contrats";
import Immeubles from "./pages/Immeubles";
import Charges from "./pages/Charges";
import Revenus from "./pages/Revenus";
import Rapports from "./pages/Rapports";
import Parametres from "./pages/Parametres";
import Saisonniere from "./pages/Saisonniere";
import Recouvrement from "./pages/Recouvrement";
import Maintenance from "./pages/Maintenance";
import Proprietaires from "./pages/Proprietaires";
import EspaceClient from "./pages/EspaceClient";

export default function App() {
  return (
    <RoleProvider>
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <Routes>
          {/* Dashboard par Rôle */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard-pdg" element={<DashboardPDG />} />
          <Route path="/dashboard-comptable" element={<DashboardComptable />} />
          <Route path="/dashboard-agent" element={<DashboardAgent />} />

          {/* IA & Analytics */}
          <Route path="/ia" element={<IAModule />} />
          <Route path="/ia/chat" element={<AIInterface />} />

          {/* Paramètres */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* Pages Classiques */}
          <Route path="/layout" element={<Layout><Dashboard /></Layout>} />
          <Route path="/locataires" element={<Layout><Locataires /></Layout>} />
          <Route path="/contrats" element={<Layout><Contrats /></Layout>} />
          <Route path="/immeubles" element={<Layout><Immeubles /></Layout>} />
          <Route path="/charges" element={<Layout><Charges /></Layout>} />
          <Route path="/revenus" element={<Layout><Revenus /></Layout>} />
          <Route path="/saisonniere" element={<Layout><Saisonniere /></Layout>} />
          <Route path="/recouvrement" element={<Layout><Recouvrement /></Layout>} />
          <Route path="/maintenance" element={<Layout><Maintenance /></Layout>} />
          <Route path="/espace-client" element={<Layout><EspaceClient /></Layout>} />
          <Route path="/proprietaires" element={<Layout><Proprietaires /></Layout>} />
          <Route path="/rapports" element={<Layout><Rapports /></Layout>} />
          <Route path="/parametres" element={<Layout><Parametres /></Layout>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </RoleProvider>
  );
}

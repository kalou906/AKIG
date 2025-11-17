import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AIInterface from './pages/AIInterface';
import IAModule from './pages/IAModule';
import './styles/ai-premium.css';

// Import des autres pages existantes
// import Gestion from './pages/Gestion';
// import Reporting from './pages/Reporting';
// ... etc

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Dashboard principal */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Routes IA */}
        <Route path="/ia" element={<IAModule />} />
        <Route path="/ia/chat" element={<AIInterface />} />
        <Route path="/chatbot" element={<AIInterface />} />
        
        {/* Routes des autres modules */}
        {/* <Route path="/gestion" element={<Gestion />} />
        <Route path="/reporting" element={<Reporting />} />
        ... */}
      </Routes>
    </Router>
  );
}

/* ====================================================================
   Notes d'intégration:
   
   1. Les composants IA utilisent les couleurs:
      - Bleu: #0056B3
      - Rouge: #CC0000
      - Blanc: #FFFFFF
   
   2. Les fichiers créés:
      - src/pages/AIInterface.jsx (Chat IA)
      - src/pages/IAModule.jsx (Page module IA)
      - src/components/AICompanion.jsx (Widget insights)
      - src/pages/Dashboard.jsx (Dashboard amélioré)
      - src/styles/ai-premium.css (Styles)
   
   3. Pour utiliser dans d'autres pages:
      import AICompanion from '../components/AICompanion';
      <AICompanion />
   
   4. Variables CSS disponibles:
      --color-blue-primary: #0056B3
      --color-red-primary: #CC0000
      --color-white: #FFFFFF
      --gradient-accent: linear-gradient(135deg, #0056B3 0%, #CC0000 100%)
   
   ==================================================================== */

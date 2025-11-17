require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Fichier temporaire pour tester sans DB
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Import routes principales
const authRoutes = require('./routes/auth');
const contractRoutes = require('./routes/contracts');
const paymentRoutes = require('./routes/payments');
const usersRoutes = require('./routes/users');
const rolesRoutes = require('./routes/roles');

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'AKIG Backend is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Info
app.get('/api/info', (req, res) => {
  res.json({
    name: 'AKIG',
    version: '1.0.0',
    description: 'Plateforme Immobilière Intelligente',
    modules: [
      'Gestion Immobilière',
      'Recouvrement & Paiements',
      'Opérations & Maintenance',
      'Reporting & Analytics',
      'Portails Client',
      'Administration',
      'IA & Recherche',
      'Cartographie'
    ],
    endpoints: {
      auth: '/api/auth',
      contracts: '/api/contracts',
      payments: '/api/payments',
      users: '/api/users',
      roles: '/api/roles'
    }
  });
});

// Mock endpoints pour demo sans DB
app.get('/api/auth/users', (req, res) => {
  res.json({
    ok: true,
    users: [
      { id: 1, name: 'Admin', email: 'admin@akig.local' },
      { id: 2, name: 'John Doe', email: 'john@akig.local' },
      { id: 3, name: 'Jane Smith', email: 'jane@akig.local' },
    ]
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                  🚀 AKIG BACKEND DÉMARRÉ                         ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ✓ Serveur Express actif                                         ║
║  ✓ API REST disponible sur : http://localhost:${PORT}             ║
║  ✓ Health Check: http://localhost:${PORT}/api/health            ║
║  ✓ Infos: http://localhost:${PORT}/api/info                     ║
║                                                                    ║
║  📊 Modules disponibles :                                         ║
║     • Auth (Authentification)                                    ║
║     • Contracts (Contrats)                                       ║
║     • Payments (Paiements)                                       ║
║     • Users (Utilisateurs)                                       ║
║     • Roles (Rôles & Permissions)                               ║
║                                                                    ║
║  🔌 Frontend: http://localhost:5173                              ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
  `);
});

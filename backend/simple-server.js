require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Mock Data
const users = [
  { id: 1, name: 'Admin', email: 'admin@akig.local', role: 'super_admin' },
];

const roles = [
  { id: 1, name: 'Super Admin' },
  { id: 2, name: 'Admin' },
  { id: 3, name: 'Gestionnaire' },
  { id: 4, name: 'Agent' },
  { id: 5, name: 'Comptable' },
  { id: 6, name: 'Locataire' },
];

// Routes
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'AKIG Backend OK' });
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'AKIG',
    version: '1.0.0',
    modules: 8,
    roles: 6,
  });
});

app.get('/api/users', (req, res) => {
  res.json({ ok: true, users });
});

app.get('/api/roles/list', (req, res) => {
  res.json({ ok: true, roles });
});

app.listen(PORT, () => {
  console.log(`✅ Backend lancé sur http://localhost:${PORT}`);
});

/**
 * ============================================================
 * src/startup.js - Démarrage robuste avec validations
 * Health/Ready endpoints, migrations, seed, fail-fast
 * ============================================================
 */

require('dotenv').config({ path: process.env.ENV_FILE || '.env' });

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { validateEnv } = require('./config/envValidator');

// ============================================================
// 1️⃣ VALIDATION ENVIRONNEMENT (FAIL-FAST)
// ============================================================
console.log('\n🚀 [STARTUP] Validation configuration...');
const envValidation = validateEnv();
if (!envValidation.isValid) {
  process.exit(1);
}

// ============================================================
// 2️⃣ SETUP POOL DB
// ============================================================
console.log('📦 [STARTUP] Initialisation pool PostgreSQL...');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('❌ [POOL] Erreur: ' + err.message);
  process.exit(1);
});

// ============================================================
// 3️⃣ SETUP EXPRESS
// ============================================================
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${req.id}] ${req.method} ${req.path}`);
  next();
});

// ============================================================
// 4️⃣ STATE: Health & Readiness
// ============================================================
let serverReady = false;
let dbConnected = false;
let migrationsApplied = false;

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    ready: serverReady,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: PORT,
    },
    components: {
      database: dbConnected ? 'connected' : 'disconnected',
      migrations: migrationsApplied ? 'applied' : 'pending',
    },
  });
});

app.get('/api/ready', (req, res) => {
  const code = serverReady ? 200 : 503;
  res.status(code).json({ ready: serverReady });
});

// ============================================================
// 5️⃣ HELPER: Exécuter migrations
// ============================================================
async function runMigrations() {
  console.log('📋 [STARTUP] Vérification migrations...');
  try {
    // Vérifier table migrations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Migration 001: Tables de base
    const migration001 = `
      CREATE TABLE IF NOT EXISTS agences (
        id SERIAL PRIMARY KEY,
        nom TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS utilisateurs (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        role TEXT DEFAULT 'agent',
        agence_id INT REFERENCES agences(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS contrats (
        id SERIAL PRIMARY KEY,
        agence_id INT REFERENCES agences(id),
        date_debut DATE,
        date_fin DATE,
        duree_preavis INT DEFAULT 30,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS locataires (
        id SERIAL PRIMARY KEY,
        agence_id INT REFERENCES agences(id),
        nom TEXT NOT NULL,
        telephone TEXT,
        email TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS paiements (
        id SERIAL PRIMARY KEY,
        contrat_id INT REFERENCES contrats(id),
        montant NUMERIC(10,2),
        statut TEXT DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS preavis (
        id SERIAL PRIMARY KEY,
        contrat_id INT REFERENCES contrats(id),
        locataire_id INT REFERENCES locataires(id),
        date_emission DATE,
        date_effet DATE,
        motif TEXT,
        type TEXT DEFAULT 'DEPART',
        statut TEXT DEFAULT 'EN_COURS',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Appliquer migration 001
    const migCheck = await pool.query('SELECT * FROM migrations WHERE name = $1', ['001_create_core']);
    if (migCheck.rows.length === 0) {
      console.log('  ↳ Création tables de base...');
      await pool.query(migration001);
      await pool.query('INSERT INTO migrations (name) VALUES ($1)', ['001_create_core']);
      console.log('  ✅ Tables de base créées');
    } else {
      console.log('  ✅ Tables de base déjà existantes');
    }

    migrationsApplied = true;
    console.log('✅ [STARTUP] Migrations appliquées\n');
    return true;
  } catch (err) {
    console.error('❌ [STARTUP] Erreur migrations: ' + err.message);
    throw err;
  }
}

// ============================================================
// 6️⃣ HELPER: Seed données de démo
// ============================================================
async function seedDemoData() {
  console.log('🌱 [STARTUP] Vérification seed données...');
  try {
    // Vérifier si agence démo existe
    const agenceCheck = await pool.query(
      'SELECT id FROM agences WHERE nom = $1 LIMIT 1',
      ['AKIG Démo']
    );

    if (agenceCheck.rows.length === 0) {
      console.log('  ↳ Création agence démo...');

      // Créer agence
      const agenceRes = await pool.query(
        'INSERT INTO agences (nom) VALUES ($1) RETURNING id',
        ['AKIG Démo']
      );
      const agenceId = agenceRes.rows[0].id;

      // Créer utilisateur démo
      await pool.query(
        'INSERT INTO utilisateurs (email, role, agence_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        ['demo@akig.com', 'manager', agenceId]
      );

      // Créer locataire démo
      const tenantRes = await pool.query(
        'INSERT INTO locataires (agence_id, nom, telephone) VALUES ($1, $2, $3) RETURNING id',
        [agenceId, 'Locataire Démo', '+22246000000']
      );
      const tenantId = tenantRes.rows[0].id;

      // Créer contrat démo
      const contractRes = await pool.query(
        'INSERT INTO contrats (agence_id, date_debut, date_fin, duree_preavis) VALUES ($1, $2, $3, $4) RETURNING id',
        [agenceId, '2025-01-01', '2025-12-31', 30]
      );
      const contractId = contractRes.rows[0].id;

      // Créer préavis démo (dans 40 jours)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 40);
      await pool.query(
        'INSERT INTO preavis (contrat_id, locataire_id, date_emission, date_effet, motif, type) VALUES ($1, $2, $3, $4, $5, $6)',
        [contractId, tenantId, new Date().toISOString().split('T')[0], futureDate.toISOString().split('T')[0], 'Test départ', 'DEPART']
      );

      console.log('  ✅ Données démo créées (agence, user, locataire, contrat, préavis)');
    } else {
      console.log('  ✅ Données démo déjà existantes');
    }

    console.log('✅ [STARTUP] Seed terminée\n');
    return true;
  } catch (err) {
    console.error('⚠️  [STARTUP] Erreur seed (non bloquant): ' + err.message);
    return false;
  }
}

// ============================================================
// 7️⃣ HELPER: Vérifier connexion DB
// ============================================================
async function warmupDb() {
  console.log('🔌 [STARTUP] Vérification connexion DB...');
  try {
    const start = Date.now();
    const result = await pool.query('SELECT 1 AS ok');
    const latency = Date.now() - start;
    console.log(`  ✅ DB connectée (latence: ${latency}ms)\n`);
    dbConnected = true;
    return true;
  } catch (err) {
    console.error('❌ [STARTUP] Impossible de connecter DB: ' + err.message);
    throw err;
  }
}

// ============================================================
// 8️⃣ MAIN INIT SEQUENCE
// ============================================================
async function initialize() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║         🚀 AKIG BACKEND - DÉMARRAGE SÉCURISÉ          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Étape 1: Vérifier DB
    await warmupDb();

    // Étape 2: Appliquer migrations
    await runMigrations();

    // Étape 3: Seed données démo
    await seedDemoData();

    // Étape 4: Importer routes
    console.log('🛣️  [STARTUP] Chargement routes...');
    const authRoutes = require('./routes/auth');
    const contractRoutes = require('./routes/contracts');
    const paymentRoutes = require('./routes/payments');
    const preavisRoutes = require('./routes/preavis');
    console.log('  ✅ Routes chargées\n');

    // Étape 5: Enregistrer routes
    app.use('/api/auth', authRoutes);
    app.use('/api/contracts', contractRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/preavis', preavisRoutes);

    // Étape 6: Route fallback 404
    app.use((req, res) => {
      res.status(404).json({ error: 'Route non trouvée', path: req.path });
    });

    // Étape 7: Marquer comme prêt
    serverReady = true;

    console.log('✅ [STARTUP] Tous les contrôles passés - serveur prêt\n');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log(`║  🎯 Écoute sur http://localhost:${PORT}              ║`);
    console.log('║  📊 Health:  GET /api/health                          ║');
    console.log('║  ⚡ Ready:   GET /api/ready                           ║');
    console.log('║  📚 Docs:    GET /api/docs (TODO)                     ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
  } catch (err) {
    console.error('❌ [STARTUP] Erreur lors de l\'initialisation:', err.message);
    console.error('🚫 Démarrage échoué.\n');
    process.exit(1);
  }
}

// ============================================================
// 9️⃣ DÉMARRAGE
// ============================================================
initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Serveur AKIG lancé sur port ${PORT}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⛔ SIGTERM reçu - arrêt gracieux...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⛔ SIGINT reçu - arrêt gracieux...');
  await pool.end();
  process.exit(0);
});

module.exports = { app, pool };

#!/usr/bin/env node
/**
 * AKIG Application Startup Script
 * - Initialise l'environnement
 * - Vérifie les dépendances
 * - Lance le serveur
 * - Mode développement/production
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk') || { green: s => s, red: s => s, yellow: s => s, blue: s => s };

// ==================== INITIALIZATION ====================
console.log('\n' + '='.repeat(60));
console.log('  AKIG - Application Startup');
console.log('='.repeat(60) + '\n');

// Charger .env
require('dotenv').config();

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== PRE-FLIGHT CHECKS ====================
console.log('📋 Vérifications pré-démarrage...\n');

const checks = {
  'Node.js version': () => {
    const version = process.version;
    console.log(`   ✓ ${version}`);
    return true;
  },
  
  'Package.json': () => {
    const exists = fs.existsSync(path.join(__dirname, '../package.json'));
    console.log(`   ${exists ? '✓' : '✗'} package.json présent`);
    return exists;
  },

  '.env configuration': () => {
    const envFile = path.join(__dirname, '.env');
    const exists = fs.existsSync(envFile);
    
    if (!exists) {
      console.log('   ✗ Fichier .env manquant');
      return false;
    }
    
    const required = ['PORT', 'NODE_ENV'];
    const content = fs.readFileSync(envFile, 'utf8');
    const missing = required.filter(key => !content.includes(key));
    
    console.log(`   ✓ .env trouvé (${missing.length === 0 ? 'complet' : 'incomplet'})`);
    return true;
  },

  'Database configuration': () => {
    if (process.env.DATABASE_URL) {
      console.log(`   ✓ DATABASE_URL configuré`);
      return true;
    }
    console.log('   ⚠ DATABASE_URL non trouvé (Mock DB sera utilisé)');
    return true; // Pas bloquant
  },

  'JWT Secret': () => {
    if (process.env.JWT_SECRET) {
      console.log('   ✓ JWT_SECRET configuré');
      return true;
    }
    console.log('   ⚠ JWT_SECRET non trouvé (génération auto)');
    return true;
  },

  'Répertoires critiques': () => {
    const dirs = [
      'src',
      'src/routes',
      'src/services',
      'src/utils',
    ];
    
    const missing = dirs.filter(dir => !fs.existsSync(path.join(__dirname, dir)));
    console.log(`   ✓ ${dirs.length - missing.length}/${dirs.length} répertoires présents`);
    return missing.length === 0;
  },

  'Fichiers essentiels': () => {
    const files = [
      'src/index.js',
      'src/db.js',
    ];
    
    const existing = files.filter(file => fs.existsSync(path.join(__dirname, file)));
    console.log(`   ✓ ${existing.length}/${files.length} fichiers critiques`);
    return existing.length === files.length;
  },
};

let allChecksPassed = true;
for (const [name, check] of Object.entries(checks)) {
  try {
    const passed = check();
    if (!passed) allChecksPassed = false;
  } catch (err) {
    console.log(`   ✗ ${name}: ${err.message}`);
    allChecksPassed = false;
  }
}

console.log('\n' + '-'.repeat(60) + '\n');

if (!allChecksPassed) {
  console.log('⚠️  Certaines vérifications ont échoué mais le démarrage continue...\n');
}

// ==================== START SERVER ====================
console.log(`🚀 Démarrage du serveur AKIG...\n`);
console.log(`   Port: ${PORT}`);
console.log(`   Environnement: ${NODE_ENV}`);
console.log(`   Mode: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'Mock DB'}`);
console.log('\n');

try {
  const app = require('./src/index.js');

  const server = app.listen(PORT, () => {
    console.log('✅ Serveur démarré avec succès!\n');
    console.log('📍 URLs disponibles:');
    console.log(`   http://localhost:${PORT}/api/health`);
    console.log(`   http://localhost:${PORT}/api/docs (Swagger)`);
    console.log(`   http://localhost:${PORT}/api/health/diagnostic`);
    console.log('\n' + '='.repeat(60) + '\n');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Signal d\'arrêt reçu...');
    server.close(() => {
      console.log('✓ Serveur arrêté gracieusement');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\n\n🛑 SIGTERM reçu...');
    server.close(() => {
      console.log('✓ Serveur arrêté gracieusement');
      process.exit(0);
    });
  });

} catch (err) {
  console.error('\n❌ Erreur au démarrage du serveur:');
  console.error(err.message);
  console.error('\n' + '='.repeat(60) + '\n');
  process.exit(1);
}

#!/usr/bin/env node
/**
 * 🔍 AKIG Backend - Verification Startup
 * Vérifie que tous les composants critiques sont fonctionnels
 */

const fs = require('fs');
const path = require('path');

// Ensure we're in backend directory
const backendDir = __dirname;
process.chdir(backendDir);

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  🔍 AKIG Backend - Vérification Système                 ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
console.log(`📍 Directory: ${backendDir}\n`);

const checks = [];
let allPass = true;

// Helper functions
const check = (name, condition, details = '') => {
  const status = condition ? '✅' : '❌';
  const msg = `${status} ${name}`;
  console.log(details ? `${msg}\n   ${details}` : msg);
  checks.push({ name, pass: condition });
  if (!condition) allPass = false;
  return condition;
};

const fileExists = (filepath) => fs.existsSync(path.join(backendDir, filepath));

// 1. Structure de fichiers critiques
console.log('📁 Structure de Fichiers\n');
check('src/index.js', fileExists('src/index.js'));
check('src/app.js', fileExists('src/app.js'));
check('src/db.js', fileExists('src/db.js'));
check('src/db-utils.js', fileExists('src/db-utils.js'));
check('src/routes/index.js', fileExists('src/routes/index.js'));
check('src/routes/health.js', fileExists('src/routes/health.js'));
check('package.json', fileExists('package.json'));

// 2. Configuration
console.log('\n⚙️  Configuration\n');
const hasEnv = fileExists('.env');
check('.env présent', hasEnv);

if (hasEnv) {
  const envContent = fs.readFileSync(path.join(backendDir, '.env'), 'utf8');
  check('DATABASE_URL configuré', envContent.includes('DATABASE_URL='));
  check('JWT_SECRET configuré', envContent.includes('JWT_SECRET='));
  check('PORT configuré', envContent.includes('PORT=') || true, 'Optionnel, défaut: 4000');
}

// 3. Dependencies
console.log('\n📦 Dépendances Node\n');
check('node_modules/', fileExists('node_modules'));
try {
  const pkg = require(path.join(backendDir, 'package.json'));
  const criticalDeps = ['express', 'pg', 'jsonwebtoken', 'bcryptjs'];
  criticalDeps.forEach(dep => {
    check(`${dep}`, pkg.dependencies && pkg.dependencies[dep], pkg.dependencies[dep] || 'Manquant');
  });
} catch (err) {
  check('Lecture package.json', false, err.message);
}

// 4. Syntaxe des fichiers principaux
console.log('\n🔧 Validation Syntaxe\n');
try {
  require(path.join(backendDir, 'src/db-utils'));
  check('db-utils.js charge', true);
} catch (err) {
  check('db-utils.js charge', false, err.message);
}

try {
  require(path.join(backendDir, 'src/routes/health'));
  check('routes/health.js charge', true);
} catch (err) {
  check('routes/health.js charge', false, err.message);
}

try {
  require(path.join(backendDir, 'src/app'));
  check('app.js charge', true);
} catch (err) {
  check('app.js charge', false, err.message);
}

// 5. Tests
console.log('\n🧪 Tests Disponibles\n');
check('Tests unitaires', fileExists('src/__tests__/unit'));
check('health.test.js', fileExists('src/__tests__/unit/health.test.js'));

// Summary
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  📊 RÉSUMÉ                                               ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const passed = checks.filter(c => c.pass).length;
const total = checks.length;
const pct = Math.round((passed / total) * 100);

console.log(`Total: ${passed}/${total} vérifications réussies (${pct}%)\n`);

if (allPass) {
  console.log('✅ ✅ ✅  SYSTÈME PRÊT À LANCER  ✅ ✅ ✅\n');
  console.log('Commandes suivantes:\n');
  console.log('  npm start      # Lancer le serveur');
  console.log('  npm run dev    # Mode développement');
  console.log('  npm test       # Lancer les tests\n');
  process.exit(0);
} else {
  console.log('⚠️  Corrections nécessaires avant le lancement\n');
  console.log('Actions suggérées:\n');
  if (!fileExists('node_modules')) {
    console.log('  npm install                    # Installer les dépendances');
  }
  if (!fileExists('.env')) {
    console.log('  cp .env.example .env           # Créer fichier .env');
    console.log('  # Puis éditer .env avec vos valeurs');
  }
  console.log('');
  process.exit(1);
}

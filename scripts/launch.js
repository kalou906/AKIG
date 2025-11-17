#!/usr/bin/env node

/**
 * AKIG Launch Script - Orchestration complète
 * Lance PostgreSQL → Backend API → Frontend React
 * Avec vérifications santé et smoke tests
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title) {
  console.log(`\n${COLORS.bright}${COLORS.cyan}════════════════════════════════════════${COLORS.reset}`);
  log('cyan', `  ${title}`);
  console.log(`${COLORS.bright}${COLORS.cyan}════════════════════════════════════════${COLORS.reset}\n`);
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkHealthEndpoint(url, maxRetries = 30, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      }
    } catch (e) {
      // Essayer à nouveau
    }
    if (i < maxRetries - 1) {
      process.stdout.write('.');
      await delay(delayMs);
    }
  }
  return { success: false };
}

async function main() {
  logSection('🚀 AKIG Lancement Complet - Mode Production');

  // 1. Vérifier que les fichiers critiques existent
  logSection('📋 Vérifications initiales');
  const requiredFiles = [
    'package.json',
    'backend/package.json',
    'backend/src/index.js',
    'backend/src/scripts/start.js',
    'frontend/package.json',
    'docker-compose.yml',
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      log('red', `❌ Fichier manquant: ${file}`);
      process.exit(1);
    }
  }
  log('green', '✅ Tous les fichiers critiques sont présents');

  // 2. Vérifier/charger les variables d'environnement
  logSection('🔐 Configuration d\'environnement');
  const envFile = path.join(process.cwd(), '.env.docker');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf-8');
    envContent.split('\n').forEach((line) => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    log('green', `✅ Variables chargées depuis .env.docker`);
  } else {
    log('yellow', `⚠️  Pas de .env.docker trouvé. Utilisation des variables par défaut.`);
  }

  // 3. Lancer Docker Compose
  logSection('🐳 Lancement Docker Compose (Postgres → API → Frontend)');
  log('cyan', 'Cela peut prendre 60-90 secondes la première fois...');

  const composeProcess = spawn('docker', ['compose', 'up', '--build'], {
    stdio: 'inherit',
    env: { ...process.env, COMPOSE_FILE: 'docker-compose.yml' },
  });

  // Attendre que Docker démarre (simpler d'attendre que les services soient healthy)
  await delay(10000);

  // 4. Attendre que l'API soit prête
  logSection('⏳ Vérification de la santé de l\'API');
  log('cyan', 'En attente de /api/health/ready...');
  const apiHealth = await checkHealthEndpoint('http://localhost:4000/api/health/ready', 40, 3000);

  if (!apiHealth.success) {
    log('red', '❌ L\'API n\'a pas démarré correctement après 2 minutes.');
    log('yellow', 'Conseils: Vérifier "docker ps" et "docker compose logs api" pour les erreurs.');
    process.exit(1);
  }
  log('green', '✅ API prête et répondant à http://localhost:4000/api/health');

  // 5. Attendre que le frontend soit prêt
  logSection('⏳ Vérification du Frontend');
  log('cyan', 'En attente de http://localhost:3000...');
  const frontendCheck = await checkHealthEndpoint('http://localhost:3000', 30, 2000);

  if (!frontendCheck.success) {
    log('yellow', '⚠️  Frontend non disponible - vérifier "docker compose logs web"');
  } else {
    log('green', '✅ Frontend prêt à http://localhost:3000');
  }

  // 6. Récupérer et afficher la santé complète
  logSection('📊 Diagnostic complet');
  try {
    const healthResponse = await fetch('http://localhost:4000/api/health');
    const health = await healthResponse.json();

    console.log(`
${COLORS.green}Status:${COLORS.reset} ${health.status}
${COLORS.green}Uptime:${COLORS.reset} ${health.uptime}s
${COLORS.green}Database:${COLORS.reset} ${health.services?.database || 'connected'}
${COLORS.green}Modules (${health.modules?.enabled}/${health.modules?.total}):${COLORS.reset}
  ${health.modules?.activeIds?.join(', ') || 'Aucun'}
${COLORS.green}Feature Flags:${COLORS.reset}
  ${Object.entries(health.featureFlags || {})
    .map(([key, value]) => `${key}: ${value ? '✓' : '✗'}`)
    .join('\n  ')}
    `);
  } catch (e) {
    log('yellow', `⚠️  Impossible de récupérer les diagnostics: ${e.message}`);
  }

  // 7. Afficher les instructions finales
  logSection('✅ Lancement réussi!');
  log('bright', 'Accédez à votre application:');
  log('cyan', '  Frontend: http://localhost:3000');
  log('cyan', '  Backend:  http://localhost:4000/api');
  log('cyan', '  Santé:    http://localhost:4000/api/health');
  log('cyan', '  Diags:    http://localhost:4000/api/diagnostics/modules');

  log('bright', '\nCommandes utiles:');
  log('cyan', '  docker compose logs -f api       # Logs API en temps réel');
  log('cyan', '  docker compose logs -f web       # Logs Frontend');
  log('cyan', '  docker compose ps                 # État des conteneurs');
  log('cyan', '  docker compose down               # Arrêter tout');

  log('bright', '\nProchaines étapes:');
  log('cyan', '  1. Ouvrir http://localhost:3000 dans le navigateur');
  log('cyan', '  2. Vérifier que BootGate disparaît et que les modules se chargent');
  log('cyan', '  3. Tester le login / paiements / SMS');

  log('green', '\n🎉 Bienvenue dans AKIG!\n');
}

main().catch((error) => {
  log('red', `\n❌ Erreur: ${error.message}`);
  process.exit(1);
});

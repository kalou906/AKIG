#!/usr/bin/env node

/**
 * TEST COMPLET DU SYSTÈME - VERSION SIMPLIFIÉE
 * =============================================
 * Tests: Backend, Frontend, Database, Security, Integration
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let passed = 0, failed = 0;

const log = {
  success: (msg) => { console.log(`${colors.green}✓ ${msg}${colors.reset}`); passed++; },
  error: (msg) => { console.log(`${colors.red}✗ ${msg}${colors.reset}`); failed++; },
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`),
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
};

function checkFile(filePath, expectedContent = null) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    if (expectedContent) {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes(expectedContent);
    }
    return true;
  } catch {
    return false;
  }
}

function request(hostname, port, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname, port, path, method: 'GET' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    });
    req.on('error', reject);
    req.setTimeout(3000, () => reject(new Error('Timeout')));
    req.end();
  });
}

async function runTests() {
  console.log(`
${colors.bright}${colors.blue}╔════════════════════════════════════════════╗
║  SYSTÈME TEST COMPLET - AKIG                 ║
║  Backend + Frontend + Database + Security    ║
╚════════════════════════════════════════════╝${colors.reset}
`);

  // === TEST 1: Frontend HTML ===
  log.title('1️⃣  FRONTEND HTML');
  
  const htmlPath = path.join(process.cwd(), 'frontend/public/index.html');
  const hasRootDiv = checkFile(htmlPath, '<div id="root"></div>');
  hasRootDiv ? log.success('Root div présent') : log.error('Root div manquant!');
  
  const hasScript = checkFile(htmlPath, '<script type="module" src="/src/index.tsx"></script>');
  hasScript ? log.success('Script tag présent') : log.error('Script tag manquant!');

  // === TEST 2: Frontend Structure ===
  log.title('2️⃣  STRUCTURE FRONTEND');
  
  checkFile(path.join(process.cwd(), 'frontend/src/index.tsx')) 
    ? log.success('index.tsx existe')
    : log.error('index.tsx manquant');
    
  checkFile(path.join(process.cwd(), 'frontend/src/App.tsx'))
    ? log.success('App.tsx existe')
    : log.error('App.tsx manquant');

  // === TEST 3: Backend Structure ===
  log.title('3️⃣  STRUCTURE BACKEND');
  
  checkFile(path.join(process.cwd(), 'backend/src/index.js'))
    ? log.success('Backend index.js existe')
    : log.error('Backend index.js manquant');

  // === TEST 4: Database Migrations ===
  log.title('4️⃣  MIGRATIONS DATABASE');
  
  checkFile(path.join(process.cwd(), 'backend/database/migrations/000_init_all.sql'))
    ? log.success('Init migration existe')
    : log.error('Init migration manquante');
    
  checkFile(path.join(process.cwd(), 'backend/database/migrations/015_add_indexes.sql'))
    ? log.success('Indexes migration existe')
    : log.error('Indexes migration manquante');

  // === TEST 5: Frontend Config ===
  log.title('5️⃣  CONFIGURATION FRONTEND');
  
  checkFile(path.join(process.cwd(), 'frontend/src/setupProxy.js'), 'localhost:4000')
    ? log.success('setupProxy.js configure pour :4000')
    : log.error('setupProxy.js pas configuré');

  // === TEST 6: Backend API ===
  log.title('6️⃣  BACKEND API (localhost:4000)');
  
  try {
    const res = await request('localhost', 4000, '/api/health');
    if (res.status === 200) {
      log.success(`Health check: ${res.status} OK`);
    } else {
      log.error(`Health check: ${res.status}`);
    }
  } catch (e) {
    log.error(`Backend not responding: ${e.message}`);
    log.info('Assurez-vous que le backend est lancé: cd backend && npm start');
  }

  // === TEST 7: Security Headers ===
  log.title('7️⃣  HEADERS DE SÉCURITÉ BACKEND');
  
  try {
    const res = await request('localhost', 4000, '/api/health');
    const headers = res.headers;
    
    headers['content-security-policy'] ? log.success('CSP header présent') : log.error('CSP manquant');
    headers['x-frame-options'] ? log.success('X-Frame-Options présent') : log.error('X-Frame-Options manquant');
    headers['x-content-type-options'] ? log.success('X-Content-Type-Options présent') : log.error('X-Content-Type-Options manquant');
    headers['strict-transport-security'] ? log.success('HSTS présent') : log.error('HSTS manquant');
  } catch (e) {
    log.error(`Cannot check headers: ${e.message}`);
  }

  // === TEST 8: Packages ===
  log.title('8️⃣  DÉPENDANCES NPM');
  
  const backendPkg = checkFile(path.join(process.cwd(), 'backend/package.json'), '"express"');
  backendPkg ? log.success('Backend package.json OK') : log.error('Backend package.json problème');
  
  const frontendPkg = checkFile(path.join(process.cwd(), 'frontend/package.json'), '"react"');
  frontendPkg ? log.success('Frontend package.json OK') : log.error('Frontend package.json problème');

  // === SUMMARY ===
  log.title('📊 RÉSUMÉ');
  
  const total = passed + failed;
  const score = Math.round((passed / total) * 100);
  
  console.log(`${colors.green}✓ Succès: ${passed}${colors.reset}`);
  console.log(`${colors.red}✗ Échoués: ${failed}${colors.reset}`);
  console.log(`\n${colors.bright}Score: ${score}/100${colors.reset}`);

  if (failed === 0) {
    console.log(`\n${colors.bright}${colors.green}🎉 SYSTÈME PRÊT POUR L'INTÉGRATION!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}⚠ Vérifiez les erreurs ci-dessus${colors.reset}\n`);
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

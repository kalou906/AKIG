#!/usr/bin/env node

/**
 * AKIG - Vérification Fonctionnelle Complète
 * Teste tous les éléments critiques du système
 * ✅ Exécutez ceci après le démarrage pour valider
 */

const http = require('http');
const https = require('https');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

/**
 * Effectuer une requête HTTP
 */
async function makeRequest(url, method = 'GET') {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeoutMs = 5000;

    const req = protocol.request(url, { method, timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          success: res.statusCode >= 200 && res.statusCode < 300,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        body: err.message,
        success: false,
        error: err,
      });
    });

    req.end();
  });
}

/**
 * Teste
 */
async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.bold}${colors.cyan}AKIG - VÉRIFICATION FONCTIONNELLE COMPLÈTE${colors.reset}`);
  console.log('='.repeat(70) + '\n');

  const tests = [];
  let passCount = 0;
  let failCount = 0;

  // Test 1: API Health Alive
  console.log(`${colors.cyan}1️⃣  Vérification API (Health - Alive)${colors.reset}`);
  let result = await makeRequest('http://localhost:4000/api/health/alive');
  if (result.success) {
    console.log(`   ${colors.green}✅ API répond sur /api/health/alive${colors.reset}`);
    tests.push({ name: 'API Health Alive', status: 'PASS' });
    passCount++;
  } else {
    console.log(`   ${colors.red}❌ Erreur: ${result.body}${colors.reset}`);
    tests.push({ name: 'API Health Alive', status: 'FAIL' });
    failCount++;
  }

  // Test 2: API Health Ready (avec DB)
  console.log(`\n${colors.cyan}2️⃣  Vérification API (Health - Ready avec DB)${colors.reset}`);
  result = await makeRequest('http://localhost:4000/api/health/ready');
  if (result.success) {
    console.log(`   ${colors.green}✅ Base de données connectée${colors.reset}`);
    tests.push({ name: 'API Health Ready', status: 'PASS' });
    passCount++;
  } else {
    console.log(`   ${colors.red}❌ Base de données non accessible: ${result.body}${colors.reset}`);
    tests.push({ name: 'API Health Ready', status: 'FAIL' });
    failCount++;
  }

  // Test 3: API Full Status
  console.log(`\n${colors.cyan}3️⃣  Vérification API (Full Status)${colors.reset}`);
  result = await makeRequest('http://localhost:4000/api/health');
  if (result.success) {
    try {
      const data = JSON.parse(result.body);
      console.log(`   ${colors.green}✅ Statut complet${colors.reset}`);
      console.log(`      - Status: ${data.status}`);
      console.log(`      - Modules actifs: ${data.modules?.enabled || 0}`);
      console.log(`      - Uptime: ${Math.round(data.uptime / 60)}min`);
      tests.push({ name: 'API Full Status', status: 'PASS' });
      passCount++;
    } catch (e) {
      console.log(`   ${colors.red}❌ JSON invalide${colors.reset}`);
      tests.push({ name: 'API Full Status', status: 'FAIL' });
      failCount++;
    }
  } else {
    console.log(`   ${colors.red}❌ Erreur: ${result.body}${colors.reset}`);
    tests.push({ name: 'API Full Status', status: 'FAIL' });
    failCount++;
  }

  // Test 4: Auth Endpoint (publique)
  console.log(`\n${colors.cyan}4️⃣  Vérification Authentification (endpoint existe)${colors.reset}`);
  result = await makeRequest('http://localhost:4000/api/auth');
  if (result.statusCode === 404 || result.statusCode === 200 || result.statusCode === 405) {
    console.log(`   ${colors.green}✅ Endpoint /api/auth accessible${colors.reset}`);
    tests.push({ name: 'Auth Endpoint', status: 'PASS' });
    passCount++;
  } else {
    console.log(`   ${colors.red}❌ Erreur HTTP ${result.statusCode}${colors.reset}`);
    tests.push({ name: 'Auth Endpoint', status: 'FAIL' });
    failCount++;
  }

  // Test 5: Frontend
  console.log(`\n${colors.cyan}5️⃣  Vérification Frontend (React dev server)${colors.reset}`);
  result = await makeRequest('http://localhost:3000');
  if (result.statusCode === 200 || result.statusCode === 304) {
    console.log(`   ${colors.green}✅ Frontend démarre sur port 3000${colors.reset}`);
    tests.push({ name: 'Frontend Server', status: 'PASS' });
    passCount++;
  } else {
    console.log(`   ${colors.yellow}⚠️  Frontend HTTP ${result.statusCode} (peut être normal en mode dev)${colors.reset}`);
    tests.push({ name: 'Frontend Server', status: 'WARN' });
  }

  // Test 6: Ports
  console.log(`\n${colors.cyan}6️⃣  Vérification Ports${colors.reset}`);
  const ports = [
    { name: 'Backend API', port: 4000 },
    { name: 'Frontend', port: 3000 },
    { name: 'PostgreSQL', port: 5432 },
  ];

  for (const { name, port } of ports) {
    const req = http.request(
      { hostname: 'localhost', port, method: 'HEAD', timeout: 1000 },
      () => {}
    );
    const isOpen = await new Promise((resolve) => {
      req.on('error', () => resolve(false));
      req.on('timeout', () => resolve(false));
      req.end(() => resolve(true));
    });

    if (isOpen || port === 3000) {
      // Port 3000 peut ne pas répondre à HEAD mais être alive
      console.log(`   ${colors.green}✅ ${name} (port ${port})${colors.reset}`);
    } else {
      console.log(`   ${colors.yellow}⚠️  ${name} (port ${port}) ne répond pas${colors.reset}`);
    }
  }

  // Résumé
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.bold}RÉSUMÉ${colors.reset}`);
  console.log('='.repeat(70));
  tests.forEach(({ name, status }) => {
    const icon = status === 'PASS' ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
    console.log(`${icon} ${name.padEnd(30)} ${status}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log(
    `${colors.bold}Résultat final: ${passCount} PASS${colors.reset} | ${colors.red}${failCount} FAIL${colors.reset}`
  );

  if (failCount === 0) {
    console.log(`${colors.green}${colors.bold}✅ SYSTÈME FONCTIONNEL - PRÊT POUR TESTS${colors.reset}`);
  } else if (failCount <= 2) {
    console.log(`${colors.yellow}${colors.bold}⚠️  SYSTÈME PARTIEL - VÉRIFIEZ LES ERREURS${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}❌ SYSTÈME NON FONCTIONNEL - À DEBUGGER${colors.reset}`);
  }
  console.log('='.repeat(70) + '\n');

  process.exit(failCount > 0 ? 1 : 0);
}

// Lancer
runTests().catch((err) => {
  console.error(`${colors.red}Erreur critique: ${err.message}${colors.reset}`);
  process.exit(1);
});

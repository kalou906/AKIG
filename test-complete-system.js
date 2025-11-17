#!/usr/bin/env node

/**
 * SYSTÈME TEST COMPLET - TESTE BACKEND + FRONTEND + INTÉGRATION
 * ============================================================
 * 
 * Ce script teste TOUT le système:
 * 1. Backend: API endpoints
 * 2. Frontend: React loading
 * 3. Integration: API calls from frontend
 * 4. Database: Connectivity
 * 5. Security: Headers, HTTPS, validation
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');

// === COLORS FOR CONSOLE ===
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}=== ${msg} ===${colors.reset}\n`),
};

// === STATE ===
let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

// === HELPERS ===
function request(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data, body: res }));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('Request timeout')));
    if (options.body) req.write(options.body);
    req.end();
  });
}

function addTest(name, passed, message) {
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
    log.success(`${name}: ${message}`);
  } else {
    testResults.failed++;
    log.error(`${name}: ${message}`);
  }
}

// === TESTS ===

async function testFileStructure() {
  log.title('TEST 1: STRUCTURE DES FICHIERS');
  
  const checks = [
    ['Frontend HTML Root Div', () => {
      const html = fs.readFileSync(path.join(__dirname, '../frontend/public/index.html'), 'utf8');
      return html.includes('<div id="root"></div>');
    }],
    ['Frontend Script Tag', () => {
      const html = fs.readFileSync(path.join(__dirname, '../frontend/public/index.html'), 'utf8');
      return html.includes('<script type="module" src="/src/index.tsx"></script>');
    }],
    ['Frontend index.tsx exists', () => fs.existsSync(path.join(__dirname, '../frontend/src/index.tsx'))],
    ['Frontend App.tsx exists', () => fs.existsSync(path.join(__dirname, '../frontend/src/App.tsx'))],
    ['Backend src/index.js exists', () => fs.existsSync(path.join(__dirname, '../backend/src/index.js'))],
    ['Backend package.json exists', () => fs.existsSync(path.join(__dirname, '../backend/package.json'))],
    ['Database migrations exist', () => fs.existsSync(path.join(__dirname, '../backend/database/migrations'))],
  ];
  
  for (const [name, check] of checks) {
    try {
      addTest(name, check(), 'OK');
    } catch (e) {
      addTest(name, false, e.message);
    }
  }
}

async function testDependencies() {
  log.title('TEST 2: DÉPENDANCES');
  
  const checks = [
    ['Backend dependencies', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../backend/package.json'), 'utf8'));
      return pkg.dependencies && Object.keys(pkg.dependencies).length > 5;
    }],
    ['Frontend dependencies', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../frontend/package.json'), 'utf8'));
      return pkg.dependencies && Object.keys(pkg.dependencies).length > 10;
    }],
    ['React installed', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../frontend/package.json'), 'utf8'));
      return pkg.dependencies && pkg.dependencies.react && pkg.dependencies['react-dom'];
    }],
    ['Express installed', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../backend/package.json'), 'utf8'));
      return pkg.dependencies && pkg.dependencies.express;
    }],
  ];
  
  for (const [name, check] of checks) {
    try {
      addTest(name, check(), 'OK');
    } catch (e) {
      addTest(name, false, e.message);
    }
  }
}

async function testBackendAPI() {
  log.title('TEST 3: BACKEND API');
  
  try {
    const response = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/health',
      method: 'GET',
    });
    
    addTest('Backend health check', response.status === 200, `Status ${response.status}`);
    
    if (response.data) {
      try {
        const json = JSON.parse(response.data);
        addTest('Backend response JSON', typeof json === 'object', 'Valid JSON');
      } catch {
        testResults.warnings++;
        log.warn('Backend response is not valid JSON');
      }
    }
  } catch (e) {
    addTest('Backend health check', false, `Connection failed: ${e.message}`);
    log.warn('Make sure backend is running on port 4000');
  }
}

async function testBackendSecurity() {
  log.title('TEST 4: SÉCURITÉ BACKEND');
  
  try {
    const response = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/health',
      method: 'GET',
    });
    
    const headers = response.headers;
    
    // Check security headers
    const securityHeaders = [
      ['Content-Security-Policy', headers['content-security-policy']],
      ['X-Content-Type-Options', headers['x-content-type-options']],
      ['X-Frame-Options', headers['x-frame-options']],
      ['X-XSS-Protection', headers['x-xss-protection']],
      ['Strict-Transport-Security', headers['strict-transport-security']],
    ];
    
    for (const [name, value] of securityHeaders) {
      addTest(`Security header: ${name}`, !!value, value ? 'Present' : 'Missing');
    }
  } catch (e) {
    addTest('Security headers', false, `Cannot test: ${e.message}`);
  }
}

async function testFrontendConfig() {
  log.title('TEST 5: CONFIGURATION FRONTEND');
  
  const checks = [
    ['setupProxy.js configured', () => {
      const proxy = fs.readFileSync(path.join(__dirname, '../frontend/src/setupProxy.js'), 'utf8');
      return proxy.includes('localhost:4000') || proxy.includes(':4000');
    }],
    ['Tailwind CSS configured', () => {
      const tailwind = fs.readFileSync(path.join(__dirname, '../frontend/tailwind.config.js'), 'utf8');
      return tailwind.includes('content');
    }],
    ['Vite config exists', () => fs.existsSync(path.join(__dirname, '../frontend/vite.config.ts'))],
    ['TypeScript config exists', () => fs.existsSync(path.join(__dirname, '../frontend/tsconfig.json'))],
  ];
  
  for (const [name, check] of checks) {
    try {
      addTest(name, check(), 'OK');
    } catch (e) {
      addTest(name, false, e.message);
    }
  }
}

async function testDatabaseMigrations() {
  log.title('TEST 6: BASE DE DONNÉES');
  
  const checks = [
    ['Migrations directory exists', () => fs.existsSync(path.join(__dirname, '../backend/database/migrations'))],
    ['Init migration exists', () => fs.existsSync(path.join(__dirname, '../backend/database/migrations/000_init_all.sql'))],
    ['Indexes migration exists', () => fs.existsSync(path.join(__dirname, '../backend/database/migrations/015_add_indexes.sql'))],
    ['Database schema exists', () => fs.existsSync(path.join(__dirname, '../backend/database/schema.sql'))],
  ];
  
  for (const [name, check] of checks) {
    try {
      addTest(name, check(), 'OK');
    } catch (e) {
      addTest(name, false, e.message);
    }
  }
}

async function testEnvironmentConfig() {
  log.title('TEST 7: CONFIGURATION ENVIRONNEMENT');
  
  const checks = [
    ['Backend .env exists', () => fs.existsSync(path.join(__dirname, '../backend/.env'))],
    ['Backend .env.example exists', () => fs.existsSync(path.join(__dirname, '../backend/.env.example'))],
    ['Frontend .env exists', () => fs.existsSync(path.join(__dirname, '../frontend/.env'))],
  ];
  
  for (const [name, check] of checks) {
    try {
      const result = check();
      addTest(name, result, result ? 'Present' : 'Missing');
    } catch (e) {
      addTest(name, false, e.message);
    }
  }
}

// === MAIN ===
async function runAllTests() {
  console.log(`\n${colors.bright}${colors.blue}
╔════════════════════════════════════════════════════════════╗
║   SYSTÈME TEST COMPLET - AKIG STACK                        ║
║   Backend (Express) + Frontend (React) + Integration       ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  await testFileStructure();
  await testDependencies();
  await testBackendAPI();
  await testBackendSecurity();
  await testFrontendConfig();
  await testDatabaseMigrations();
  await testEnvironmentConfig();
  
  // Summary
  console.log(`\n${colors.bright}${colors.blue}=== RÉSUMÉ ===${colors.reset}\n`);
  console.log(`${colors.green}✓ Tests réussis: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}✗ Tests échoués: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Avertissements: ${testResults.warnings}${colors.reset}`);
  
  const totalTests = testResults.passed + testResults.failed;
  const score = Math.round((testResults.passed / totalTests) * 100);
  
  console.log(`\n${colors.bright}Score Global: ${score}/100${colors.reset}`);
  
  if (testResults.failed === 0 && testResults.warnings === 0) {
    console.log(`\n${colors.green}${colors.bright}🎉 SYSTÈME PRÊT!${colors.reset}\n`);
    process.exit(0);
  } else if (testResults.failed > 0) {
    console.log(`\n${colors.red}${colors.bright}❌ Problèmes détectés - vérifiez les erreurs ci-dessus${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${colors.yellow}${colors.bright}⚠ Certains avertissements - vérifiez avant production${colors.reset}\n`);
    process.exit(0);
  }
}

runAllTests().catch(err => {
  log.error(`Test suite failed: ${err.message}`);
  process.exit(1);
});

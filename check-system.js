#!/usr/bin/env node
/**
 * AKIG — Vérification Rapide du Système
 * Exécutez après le démarrage pour confirmer que tout fonctionne
 */

const http = require('http');

const tests = {
  'API Health (alive)': 'http://localhost:4000/api/health/alive',
  'API Health (ready)': 'http://localhost:4000/api/health/ready',
  'API Full Status': 'http://localhost:4000/api/health',
  'Frontend': 'http://localhost:3000',
  'API Docs': 'http://localhost:4000/api/docs',
};

async function checkUrl(url) {
  return new Promise((resolve) => {
    const req = http.request(url, { timeout: 3000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 300);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
}

async function main() {
  console.log('\n╔═════════════════════════════════════════╗');
  console.log('║  AKIG — Vérification Rapide Système   ║');
  console.log('╚═════════════════════════════════════════╝\n');

  let passed = 0;
  for (const [name, url] of Object.entries(tests)) {
    const ok = await checkUrl(url);
    const status = ok ? '✅' : '❌';
    console.log(`${status} ${name.padEnd(25)} ${url}`);
    if (ok) passed++;
  }

  console.log(`\n${passed}/${Object.keys(tests).length} vérifications réussies\n`);

  if (passed === Object.keys(tests).length) {
    console.log('🎉 SYSTÈME OPÉRATIONNEL\n');
    process.exit(0);
  } else {
    console.log('⚠️  Certains services ne répondent pas\n');
    process.exit(1);
  }
}

main();

#!/usr/bin/env node

const http = require('http');

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:4000';

function fetchJson(path) {
  const url = `${BASE_URL}${path}`;
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        raw += chunk;
      });
      response.on('end', () => {
        if (response.statusCode !== 200) {
          return reject(new Error(`HTTP ${response.statusCode} (${url})`));
        }
        try {
          resolve(JSON.parse(raw));
        } catch (error) {
          reject(new Error(`Réponse invalide depuis ${url}: ${error.message}`));
        }
      });
    });

    request.on('error', (error) => {
      reject(new Error(`Échec de la requête ${url}: ${error.message}`));
    });
  });
}

(async () => {
  try {
    const health = await fetchJson('/api/health');
    if (health.status !== 'ok') {
      throw new Error('Healthcheck renvoie un statut non OK.');
    }

  const modulesResponse = await fetchJson('/api/diagnostics/modules');
    const modules = Array.isArray(modulesResponse?.modules)
      ? modulesResponse.modules
      : [];

    if (modules.length === 0) {
      throw new Error('Aucun module actif détecté.');
    }

    console.log('✅ Smoke tests réussis.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Smoke tests échoués:', error.message);
    process.exit(1);
  }
})();

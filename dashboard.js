#!/usr/bin/env node

/**
 * 🚀 AKIG System Dashboard
 * Affiche l'état complet du système
 */

const http = require('http');
const https = require('https');
const chalk = require('chalk').default;

// Définir les défauts pour chalk si non disponible
const colors = {
  success: (text) => `✅ ${text}`,
  error: (text) => `❌ ${text}`,
  warning: (text) => `⚠️  ${text}`,
  info: (text) => `ℹ️  ${text}`,
  loading: (text) => `⏳ ${text}`,
};

// Services à vérifier
const services = [
  {
    name: 'Backend API',
    url: 'http://localhost:4002/api/health',
    description: 'Node.js/Express API Server'
  },
  {
    name: 'Frontend',
    url: 'http://localhost:5173',
    description: 'Vite React/Vue Frontend'
  },
  {
    name: 'PostgreSQL',
    url: 'postgresql://localhost:5432',
    description: 'PostgreSQL Database'
  },
];

// Fonctions utilitaires
const checkUrl = (url) => {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const timeout = setTimeout(() => {
      resolve({ status: 'offline', code: 0 });
    }, 3000);
    
    protocol
      .get(url, (res) => {
        clearTimeout(timeout);
        resolve({ status: 'online', code: res.statusCode });
      })
      .on('error', () => {
        clearTimeout(timeout);
        resolve({ status: 'offline', code: 0 });
      });
  });
};

const formatDate = () => {
  return new Date().toLocaleString('fr-FR');
};

const printBox = (title, content) => {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`║ ${title.padEnd(68)} ║`);
  console.log(`${'═'.repeat(70)}`);
  console.log(content);
  console.log(`${'═'.repeat(70)}\n`);
};

const printServiceStatus = (services) => {
  let output = '';
  services.forEach((service) => {
    const icon = service.status === 'online' ? '✅' : '❌';
    const status = service.status === 'online' ? 'EN LIGNE' : 'HORS LIGNE';
    const code = service.code ? `(${service.code})` : '';
    
    output += `${icon} ${service.name.padEnd(20)} ${status.padEnd(15)} ${code}\n`;
    output += `   └─ ${service.description}\n`;
    output += `   └─ ${service.url}\n\n`;
  });
  return output;
};

// Fonction principale
async function main() {
  console.clear();
  
  // Bannière
  console.log(`
    ╔══════════════════════════════════════════════════════════╗
    ║          🏢 AKIG - Tableau de Bord Système 🏢            ║
    ║                   Version 2.0.0                          ║
    ╚══════════════════════════════════════════════════════════╝
  `);
  
  console.log(`⏳ Vérification de l'état des services...\n`);
  
  // Vérifier chaque service
  const results = [];
  for (const service of services) {
    if (service.url.startsWith('postgresql')) {
      // PostgreSQL - vérifier avec pg
      try {
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: service.url });
        
        const res = await pool.query('SELECT NOW()');
        pool.end();
        
        results.push({
          ...service,
          status: 'online',
          code: 200
        });
      } catch (e) {
        results.push({
          ...service,
          status: 'offline',
          code: 0
        });
      }
    } else {
      // HTTP/HTTPS
      const res = await checkUrl(service.url);
      results.push({
        ...service,
        status: res.status,
        code: res.code
      });
    }
  }
  
  // Afficher le statut
  printBox('📊 STATUT DES SERVICES', printServiceStatus(results));
  
  // Résumé
  const onlineCount = results.filter(s => s.status === 'online').length;
  const offlineCount = results.filter(s => s.status === 'offline').length;
  
  console.log(`📈 RÉSUMÉ`);
  console.log(`   ${colors.success(`Services en ligne: ${onlineCount}/${results.length}`)}`);
  if (offlineCount > 0) {
    console.log(`   ${colors.error(`Services hors ligne: ${offlineCount}`)}`);
  }
  console.log(`\n🕐 Vérifié à: ${formatDate()}\n`);
  
  // Instructions
  if (offlineCount > 0) {
    console.log(`\n📝 Instructions pour démarrer:`);
    console.log(`\n   Pour Windows:     powershell .\\LAUNCH.ps1`);
    console.log(`   Pour Linux/Mac:   bash LAUNCH.sh`);
    console.log(`\n`);
  }
  
  // URLs utiles
  console.log(`\n🔗 URLs UTILES:`);
  console.log(`   📱 Interface:    http://localhost:5173`);
  console.log(`   🔌 API:          http://localhost:4002/api`);
  console.log(`   📚 Documentation: http://localhost:4002/api-docs`);
  console.log(`   ✅ Santé:        http://localhost:4002/api/health`);
  console.log(`\n`);
  
  // Liens directs
  console.log(`\n⚡ ACTIONS RAPIDES:`);
  console.log(`   • Propriétaires:    http://localhost:5173/owners`);
  console.log(`   • Propriétés:       http://localhost:5173/properties`);
  console.log(`   • Contrats:         http://localhost:5173/contracts`);
  console.log(`   • Paiements:        http://localhost:5173/payments`);
  console.log(`   • Arriérés:         http://localhost:5173/arrears`);
  console.log(`   • Maintenance:      http://localhost:5173/maintenance`);
  console.log(`   • Rapports:         http://localhost:5173/analytics`);
  console.log(`\n`);
}

// Lancer
main().catch(console.error);

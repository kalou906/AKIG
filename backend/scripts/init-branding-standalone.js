#!/usr/bin/env node

/**
 * 🎨 Script Standalone - Initialiser Branding AKIG
 * Utilisation: node init-branding-standalone.js
 * Crée: CSS, Logos, Répertoires, Configuration
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;

// Importer services
const { initializeBranding } = require('../src/utils/init-branding');

// Logger simple
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`)
};

/**
 * Main
 */
async function main() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🎨 INITIALISATION SYSTÈME BRANDING AKIG');
    console.log('='.repeat(60) + '\n');

    // Initialiser branding
    const result = await initializeBranding();

    if (result.success) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 SUCCÈS - Système branding initialisé!');
      console.log('='.repeat(60));
      console.log('\n📍 Ressources générées:\n');
      
      if (result.results.css) {
        console.log(`   CSS:   ${result.results.css.url}`);
      }
      
      if (result.results.logos && result.results.logos.logos) {
        console.log('\n   Logos:');
        Object.keys(result.results.logos.logos).forEach(logo => {
          console.log(`   - ${logo}`);
        });
      }

      console.log('\n📚 Documentation: docs/BRANDING_COLORS_GUIDE.md');
      console.log('📄 Résumé setup: docs/BRANDING_SETUP_SUMMARY.md\n');
    } else {
      log.error('Initialisation échouée');
      process.exit(1);
    }
  } catch (err) {
    log.error(err.message);
    console.error(err);
    process.exit(1);
  }
}

// Exécuter
if (require.main === module) {
  main();
}

module.exports = { main };

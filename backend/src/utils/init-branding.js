/**
 * 🎨 Script Initialisation Branding AKIG
 * Génère CSS, Logos, et Configuration
 * backend/src/utils/init-branding.js
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../services/logger');
const { saveBrandingCSS } = require('../services/branding-colors.service');
const { saveAllLogos } = require('../services/logo-generator.service');

const BRANDING_DIR = path.join(__dirname, '../../public/branding');
const DOCUMENTS_DIR = path.join(__dirname, '../../public/documents');

/**
 * Créer structure répertoires
 */
async function createDirectories() {
  try {
    const dirs = [
      BRANDING_DIR,
      path.join(DOCUMENTS_DIR, 'agency'),
      path.join(DOCUMENTS_DIR, 'agency/rental_contracts'),
      path.join(DOCUMENTS_DIR, 'agency/management_contracts'),
      path.join(DOCUMENTS_DIR, 'agency/audit_reports'),
      path.join(DOCUMENTS_DIR, 'agency/references'),
      path.join(DOCUMENTS_DIR, 'templates')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
      logger.info(`📁 Répertoire créé: ${dir}`);
    }

    return { success: true, message: 'Répertoires créés' };
  } catch (err) {
    logger.error('Erreur création répertoires:', err);
    throw err;
  }
}

/**
 * Générer fichier info branding
 */
async function createBrandingInfo() {
  try {
    const info = {
      name: 'AKIG',
      description: 'Agence Immobilière Guinéenne',
      brandingColors: 'Bleu/Blanc/Rouge',
      locale: 'fr_GN',
      timezone: 'Africa/Conakry',
      currency: 'GNF',
      market: 'Guinée - Conakry',
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };

    const infoPath = path.join(BRANDING_DIR, 'branding-info.json');
    await fs.writeFile(infoPath, JSON.stringify(info, null, 2), 'utf-8');
    logger.info(`📄 Fichier info branding créé`);

    return info;
  } catch (err) {
    logger.error('Erreur création info branding:', err);
    throw err;
  }
}

/**
 * Initialiser tout
 */
async function initializeBranding() {
  try {
    logger.info('🎨 INITIALISATION SYSTÈME BRANDING AKIG');
    logger.info('=====================================');

    // 1. Créer répertoires
    logger.info('1️⃣ Création répertoires...');
    const dirsResult = await createDirectories();
    logger.info(`✅ ${dirsResult.message}`);

    // 2. Créer info branding
    logger.info('2️⃣ Création configuration branding...');
    const info = await createBrandingInfo();
    logger.info(`✅ Configuration créée: ${info.name}`);

    // 3. Générer CSS
    logger.info('3️⃣ Génération CSS couleurs bleu/blanc/rouge...');
    const cssResult = await saveBrandingCSS();
    logger.info(`✅ CSS généré: ${cssResult.url}`);

    // 4. Générer logos
    logger.info('4️⃣ Génération logos SVG (5 variantes)...');
    const logosResult = await saveAllLogos();
    logger.info(`✅ Logos générés:`);
    Object.entries(logosResult.logos).forEach(([name, data]) => {
      logger.info(`   - ${name}: ${data.url}`);
    });

    logger.info('=====================================');
    logger.info('🎉 SYSTÈME BRANDING INITIALISÉ AVEC SUCCÈS!');
    logger.info('');
    logger.info('📍 Assets disponibles:');
    logger.info(`   CSS: ${cssResult.url}`);
    logger.info(`   Logos: /api/branding/logos/{type}`);
    logger.info(`   Palette: /api/branding/colors/palette`);
    logger.info('');

    return {
      success: true,
      results: {
        directories: dirsResult,
        info,
        css: cssResult,
        logos: logosResult
      }
    };
  } catch (err) {
    logger.error('❌ Erreur initialisation branding:', err);
    throw err;
  }
}

module.exports = {
  initializeBranding,
  createDirectories,
  createBrandingInfo
};

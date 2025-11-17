/**
 * 🎨 Service Logo Génération SVG
 * Logo dynamique avec couleurs bleu/blanc/rouge
 * backend/src/services/logo-generator.service.js
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const { GUINEAN_PALETTE } = require('./branding-colors.service');

const BRANDING_DIR = path.join(__dirname, '../../public/branding');

/**
 * Générer SVG logo par défaut (Bleu/Blanc/Rouge)
 */
function generateDefaultLogoSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Fond blanc -->
  <rect width="200" height="200" fill="${GUINEAN_PALETTE.neutral.white}"/>
  
  <!-- Cercle externe - Bleu foncé -->
  <circle cx="100" cy="100" r="95" fill="none" stroke="${GUINEAN_PALETTE.blue.darkest}" stroke-width="3"/>
  
  <!-- Bandes verticales - Drapeaux guinéen inspiration -->
  <rect x="30" y="60" width="15" height="80" fill="${GUINEAN_PALETTE.blue.primary}" rx="3"/>
  <rect x="92.5" y="60" width="15" height="80" fill="${GUINEAN_PALETTE.neutral.white}" stroke="${GUINEAN_PALETTE.blue.primary}" stroke-width="1" rx="3"/>
  <rect x="155" y="60" width="15" height="80" fill="${GUINEAN_PALETTE.red.primary}" rx="3"/>
  
  <!-- Maison/Propriété en centre -->
  <g transform="translate(100, 100)">
    <!-- Toit - Rouge -->
    <polygon points="0,-30 -25,-5 25,-5" fill="${GUINEAN_PALETTE.red.primary}"/>
    
    <!-- Murs - Blanc avec bordure bleu -->
    <rect x="-20" y="-5" width="40" height="35" fill="${GUINEAN_PALETTE.neutral.white}" stroke="${GUINEAN_PALETTE.blue.darkest}" stroke-width="2"/>
    
    <!-- Porte - Bleu -->
    <rect x="-8" y="10" width="16" height="20" fill="${GUINEAN_PALETTE.blue.primary}"/>
    <circle cx="-3" cy="20" r="2" fill="${GUINEAN_PALETTE.gold}"/>
    
    <!-- Fenêtre gauche - Bleu -->
    <rect x="-16" y="2" width="10" height="10" fill="${GUINEAN_PALETTE.blue.light}"/>
    <line x1="-11" y1="2" x2="-11" y2="12" stroke="${GUINEAN_PALETTE.blue.darkest}" stroke-width="0.5"/>
    <line x1="-16" y1="7" x2="-6" y2="7" stroke="${GUINEAN_PALETTE.blue.darkest}" stroke-width="0.5"/>
    
    <!-- Fenêtre droite - Bleu -->
    <rect x="6" y="2" width="10" height="10" fill="${GUINEAN_PALETTE.blue.light}"/>
    <line x1="11" y1="2" x2="11" y2="12" stroke="${GUINEAN_PALETTE.blue.darkest}" stroke-width="0.5"/>
    <line x1="6" y1="7" x2="16" y2="7" stroke="${GUINEAN_PALETTE.blue.darkest}" stroke-width="0.5"/>
  </g>
  
  <!-- Texte "AKIG" en bas -->
  <text x="100" y="160" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
        text-anchor="middle" fill="${GUINEAN_PALETTE.blue.darkest}">AKIG</text>
  
  <!-- Texte "Agence Immobilière" en très petit -->
  <text x="100" y="175" font-family="Arial, sans-serif" font-size="8" 
        text-anchor="middle" fill="${GUINEAN_PALETTE.red.primary}">Agence Immobilière</text>
</svg>`;
}

/**
 * Générer logo simplifié (pour favicon)
 */
function generateFaviconLogoSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <!-- Fond bleu -->
  <rect width="64" height="64" fill="${GUINEAN_PALETTE.blue.primary}" rx="8"/>
  
  <!-- "A" blanc en centre -->
  <text x="32" y="48" font-family="Arial, sans-serif" font-size="36" font-weight="bold"
        text-anchor="middle" fill="${GUINEAN_PALETTE.neutral.white}">A</text>
</svg>`;
}

/**
 * Générer logo avec dégradé bleu/rouge
 */
function generateGradientLogoSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="blueRedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${GUINEAN_PALETTE.blue.primary};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${GUINEAN_PALETTE.neutral.white};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${GUINEAN_PALETTE.red.primary};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fond avec dégradé -->
  <rect width="200" height="200" fill="url(#blueRedGradient)" rx="12"/>
  
  <!-- Texte AKIG en blanc -->
  <text x="100" y="120" font-family="Arial, sans-serif" font-size="48" font-weight="bold"
        text-anchor="middle" fill="${GUINEAN_PALETTE.neutral.white}">AKIG</text>
</svg>`;
}

/**
 * Générer logo hexagone (moderne)
 */
function generateHexagonLogoSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Hexagone externe - Bleu -->
  <polygon points="100,20 170,55 170,145 100,180 30,145 30,55"
           fill="${GUINEAN_PALETTE.blue.darkest}" stroke="${GUINEAN_PALETTE.red.primary}" stroke-width="2"/>
  
  <!-- Hexagone interne - Blanc -->
  <polygon points="100,40 155,70 155,130 100,160 45,130 45,70"
           fill="${GUINEAN_PALETTE.neutral.white}"/>
  
  <!-- Maison en centre -->
  <g transform="translate(100, 100)">
    <!-- Toit - Rouge -->
    <polygon points="0,-18 -15,-5 15,-5" fill="${GUINEAN_PALETTE.red.primary}"/>
    
    <!-- Corps - Bleu -->
    <rect x="-12" y="-5" width="24" height="20" fill="${GUINEAN_PALETTE.blue.primary}"/>
    
    <!-- Porte - Or -->
    <rect x="-4" y="5" width="8" height="10" fill="${GUINEAN_PALETTE.accents.gold}"/>
    
    <!-- Fenêtres -->
    <rect x="-9" y="0" width="5" height="5" fill="${GUINEAN_PALETTE.blue.light}"/>
    <rect x="4" y="0" width="5" height="5" fill="${GUINEAN_PALETTE.blue.light}"/>
  </g>
  
  <!-- Texte AKIG -->
  <text x="100" y="190" font-family="Arial, sans-serif" font-size="14" font-weight="bold"
        text-anchor="middle" fill="${GUINEAN_PALETTE.blue.darkest}">AKIG</text>
</svg>`;
}

/**
 * Générer logo moderne minimaliste
 */
function generateMinimalLogoSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Trois lignes verticales - Bleu/Blanc/Rouge -->
  <rect x="40" y="30" width="20" height="140" fill="${GUINEAN_PALETTE.blue.primary}" rx="4"/>
  <rect x="70" y="30" width="20" height="140" fill="${GUINEAN_PALETTE.neutral.white}" stroke="${GUINEAN_PALETTE.blue.darkest}" stroke-width="1" rx="4"/>
  <rect x="100" y="30" width="20" height="140" fill="${GUINEAN_PALETTE.red.primary}" rx="4"/>
  
  <!-- Maison stylisée au centre -->
  <g transform="translate(130, 70)">
    <polygon points="0,-12 -12,-2 12,-2" fill="${GUINEAN_PALETTE.blue.darkest}"/>
    <rect x="-10" y="-2" width="20" height="16" fill="${GUINEAN_PALETTE.red.primary}"/>
    <circle cx="-4" cy="4" r="1.5" fill="${GUINEAN_PALETTE.neutral.white}"/>
    <circle cx="4" cy="4" r="1.5" fill="${GUINEAN_PALETTE.neutral.white}"/>
  </g>
  
  <!-- Texte -->
  <text x="100" y="195" font-family="Arial, sans-serif" font-size="12" font-weight="bold"
        text-anchor="middle" fill="${GUINEAN_PALETTE.blue.darkest}">AKIG</text>
</svg>`;
}

/**
 * Sauvegarder tous les logos
 */
async function saveAllLogos() {
  try {
    await fs.mkdir(BRANDING_DIR, { recursive: true });
    
    const logos = {
      'logo-default.svg': generateDefaultLogoSVG(),
      'logo-favicon.svg': generateFaviconLogoSVG(),
      'logo-gradient.svg': generateGradientLogoSVG(),
      'logo-hexagon.svg': generateHexagonLogoSVG(),
      'logo-minimal.svg': generateMinimalLogoSVG()
    };

    const results = {};

    for (const [filename, content] of Object.entries(logos)) {
      const filePath = path.join(BRANDING_DIR, filename);
      await fs.writeFile(filePath, content, 'utf-8');
      results[filename] = {
        path: filePath,
        url: `/public/branding/${filename}`
      };
      logger.info(`Logo sauvegardé: ${filename}`);
    }

    return {
      success: true,
      logos: results,
      message: 'Tous les logos générés avec succès'
    };
  } catch (err) {
    logger.error('Erreur génération logos:', err);
    throw err;
  }
}

/**
 * Obtenir SVG logo par type
 */
function getLogoSVG(type = 'default') {
  const generators = {
    default: generateDefaultLogoSVG,
    favicon: generateFaviconLogoSVG,
    gradient: generateGradientLogoSVG,
    hexagon: generateHexagonLogoSVG,
    minimal: generateMinimalLogoSVG
  };

  const generator = generators[type] || generators.default;
  return generator();
}

module.exports = {
  generateDefaultLogoSVG,
  generateFaviconLogoSVG,
  generateGradientLogoSVG,
  generateHexagonLogoSVG,
  generateMinimalLogoSVG,
  saveAllLogos,
  getLogoSVG
};

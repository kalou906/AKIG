/**
 * 🎨 Palette Couleurs AKIG - Bleu/Blanc/Rouge
 * Système de design cohérent pour agence immobilière guinéenne
 * 
 * backend/src/services/branding-colors.service.js
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

const BRANDING_DIR = path.join(__dirname, '../../public/branding');

/**
 * Palette de couleurs primaire: Bleu/Blanc/Rouge
 * Inspirée du drapeau guinéen et design moderne
 */
const GUINEAN_PALETTE = {
  // Bleu Principal (élégance, confiance, profondeur)
  blue: {
    darkest: '#001F3F',   // Bleu marine foncé
    dark: '#003D82',      // Bleu foncé
    primary: '#0056B3',   // Bleu principal
    medium: '#1E90FF',    // Bleu moyen
    light: '#4DAAFF',     // Bleu clair
    lighter: '#B3D9FF',   // Bleu très clair
    lightest: '#E6F2FF'   // Bleu ultra clair (fond)
  },

  // Rouge Principal (énergie, action, accent)
  red: {
    darkest: '#660000',   // Rouge très foncé
    dark: '#990000',      // Rouge foncé
    primary: '#CC0000',   // Rouge principal
    medium: '#FF3333',    // Rouge moyen
    light: '#FF6666',     // Rouge clair
    lighter: '#FFB3B3',   // Rouge très clair
    lightest: '#FFE6E6'   // Rouge ultra clair (fond)
  },

  // Blanc & Neutres
  neutral: {
    white: '#FFFFFF',
    offWhite: '#F8F9FA',
    lightGray: '#E9ECEF',
    gray: '#DEE2E6',
    mediumGray: '#ADB5BD',
    darkGray: '#495057',
    charcoal: '#212529'
  },

  // Accents supplémentaires
  accents: {
    gold: '#FFD700',       // Accent or
    success: '#28A745',    // Vert succès
    warning: '#FFC107',    // Jaune avertissement
    danger: '#DC3545',     // Rouge danger
    info: '#17A2B8'        // Cyan info
  }
};

/**
 * Générer CSS personnalisé avec palette bleu/blanc/rouge
 */
async function generateBrandingCSS() {
  const css = `
/* ============================================
   🎨 AKIG BRANDING SYSTEM - BLEU/BLANC/ROUGE
   Couleurs du drapeau guinéen + design moderne
   ============================================ */

:root {
  /* PRIMARY COLORS - Bleu/Blanc/Rouge */
  --color-blue-darkest: ${GUINEAN_PALETTE.blue.darkest};
  --color-blue-dark: ${GUINEAN_PALETTE.blue.dark};
  --color-blue-primary: ${GUINEAN_PALETTE.blue.primary};
  --color-blue-medium: ${GUINEAN_PALETTE.blue.medium};
  --color-blue-light: ${GUINEAN_PALETTE.blue.light};
  --color-blue-lighter: ${GUINEAN_PALETTE.blue.lighter};
  --color-blue-lightest: ${GUINEAN_PALETTE.blue.lightest};

  --color-red-darkest: ${GUINEAN_PALETTE.red.darkest};
  --color-red-dark: ${GUINEAN_PALETTE.red.dark};
  --color-red-primary: ${GUINEAN_PALETTE.red.primary};
  --color-red-medium: ${GUINEAN_PALETTE.red.medium};
  --color-red-light: ${GUINEAN_PALETTE.red.light};
  --color-red-lighter: ${GUINEAN_PALETTE.red.lighter};
  --color-red-lightest: ${GUINEAN_PALETTE.red.lightest};

  /* NEUTRAL COLORS */
  --color-white: ${GUINEAN_PALETTE.neutral.white};
  --color-off-white: ${GUINEAN_PALETTE.neutral.offWhite};
  --color-light-gray: ${GUINEAN_PALETTE.neutral.lightGray};
  --color-gray: ${GUINEAN_PALETTE.neutral.gray};
  --color-medium-gray: ${GUINEAN_PALETTE.neutral.mediumGray};
  --color-dark-gray: ${GUINEAN_PALETTE.neutral.darkGray};
  --color-charcoal: ${GUINEAN_PALETTE.neutral.charcoal};

  /* ACCENTS */
  --color-gold: ${GUINEAN_PALETTE.accents.gold};
  --color-success: ${GUINEAN_PALETTE.accents.success};
  --color-warning: ${GUINEAN_PALETTE.accents.warning};
  --color-danger: ${GUINEAN_PALETTE.accents.danger};
  --color-info: ${GUINEAN_PALETTE.accents.info};

  /* SEMANTIC */
  --primary: var(--color-blue-primary);
  --secondary: var(--color-red-primary);
  --accent: var(--color-gold);
  --background: var(--color-off-white);
  --surface: var(--color-white);
  --on-surface: var(--color-charcoal);
  --border: var(--color-light-gray);
}

/* ============================================
   TYPOGRAPHY
   ============================================ */

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: var(--color-charcoal);
  background-color: var(--color-off-white);
}

h1, h2, h3, h4, h5, h6 {
  color: var(--color-blue-darkest);
  font-weight: 700;
}

a {
  color: var(--color-blue-primary);
  text-decoration: none;
  transition: color 0.3s ease;
}

a:hover {
  color: var(--color-red-primary);
  text-decoration: underline;
}

/* ============================================
   BUTTONS - Système cohérent
   ============================================ */

/* Button Primary - Bleu */
.btn-primary,
button.primary,
.button-primary {
  background-color: var(--color-blue-primary);
  color: var(--color-white);
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover,
button.primary:hover,
.button-primary:hover {
  background-color: var(--color-blue-dark);
  box-shadow: 0 4px 12px rgba(0, 86, 179, 0.3);
  transform: translateY(-2px);
}

.btn-primary:active,
button.primary:active,
.button-primary:active {
  background-color: var(--color-blue-darkest);
  transform: translateY(0);
}

/* Button Secondary - Rouge */
.btn-secondary,
button.secondary,
.button-secondary {
  background-color: var(--color-red-primary);
  color: var(--color-white);
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover,
button.secondary:hover,
.button-secondary:hover {
  background-color: var(--color-red-dark);
  box-shadow: 0 4px 12px rgba(204, 0, 0, 0.3);
  transform: translateY(-2px);
}

.btn-secondary:active,
button.secondary:active,
.button-secondary:active {
  background-color: var(--color-red-darkest);
  transform: translateY(0);
}

/* Button Outline - Bleu/Blanc */
.btn-outline,
button.outline,
.button-outline {
  background-color: var(--color-white);
  color: var(--color-blue-primary);
  border: 2px solid var(--color-blue-primary);
  padding: 10px 22px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-outline:hover,
button.outline:hover,
.button-outline:hover {
  background-color: var(--color-blue-lightest);
  border-color: var(--color-blue-dark);
  color: var(--color-blue-dark);
}

/* Button Success */
.btn-success,
.button-success {
  background-color: var(--color-success);
  color: var(--color-white);
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-success:hover,
.button-success:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

/* ============================================
   CARDS & CONTAINERS
   ============================================ */

.card,
.card-container {
  background-color: var(--color-white);
  border: 1px solid var(--color-light-gray);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover,
.card-container:hover {
  box-shadow: 0 8px 24px rgba(0, 86, 179, 0.15);
  border-color: var(--color-blue-light);
  transform: translateY(-4px);
}

.card-header {
  border-bottom: 3px solid var(--color-blue-primary);
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.card-header h3 {
  color: var(--color-blue-darkest);
  margin: 0;
}

.card-footer {
  border-top: 1px solid var(--color-light-gray);
  padding-top: 12px;
  margin-top: 16px;
}

/* ============================================
   INPUTS & FORMS
   ============================================ */

input[type="text"],
input[type="email"],
input[type="password"],
input[type="number"],
textarea,
select {
  border: 2px solid var(--color-light-gray);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  background-color: var(--color-white);
}

input[type="text"]:focus,
input[type="email"]:focus,
input[type="password"]:focus,
input[type="number"]:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--color-blue-primary);
  box-shadow: 0 0 0 3px var(--color-blue-lightest);
  background-color: var(--color-off-white);
}

label {
  color: var(--color-charcoal);
  font-weight: 500;
  margin-bottom: 6px;
  display: block;
}

.form-group {
  margin-bottom: 16px;
}

/* ============================================
   ALERTS & NOTIFICATIONS
   ============================================ */

.alert,
.notification {
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid;
  margin-bottom: 16px;
}

.alert-info,
.notification-info {
  background-color: var(--color-blue-lightest);
  border-color: var(--color-blue-primary);
  color: var(--color-blue-dark);
}

.alert-success,
.notification-success {
  background-color: #D4EDDA;
  border-color: var(--color-success);
  color: #155724;
}

.alert-warning,
.notification-warning {
  background-color: #FFF3CD;
  border-color: var(--color-warning);
  color: #856404;
}

.alert-danger,
.alert-error,
.notification-danger,
.notification-error {
  background-color: var(--color-red-lightest);
  border-color: var(--color-red-primary);
  color: var(--color-red-dark);
}

/* ============================================
   BADGES & TAGS
   ============================================ */

.badge,
.tag {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.badge-primary,
.tag-primary {
  background-color: var(--color-blue-lightest);
  color: var(--color-blue-dark);
}

.badge-secondary,
.tag-secondary {
  background-color: var(--color-red-lightest);
  color: var(--color-red-dark);
}

.badge-success,
.tag-success {
  background-color: #D4EDDA;
  color: #155724;
}

/* ============================================
   NAVIGATION & HEADERS
   ============================================ */

nav,
.navbar,
header {
  background: linear-gradient(135deg, var(--color-blue-darkest) 0%, var(--color-blue-primary) 100%);
  color: var(--color-white);
  padding: 16px 0;
  box-shadow: 0 2px 8px rgba(0, 31, 63, 0.2);
}

nav a,
.navbar a,
header a {
  color: var(--color-white);
  margin: 0 16px;
  font-weight: 500;
  transition: color 0.3s ease;
}

nav a:hover,
.navbar a:hover,
header a:hover {
  color: var(--color-gold);
}

/* ============================================
   FOOTER
   ============================================ */

footer {
  background-color: var(--color-blue-darkest);
  color: var(--color-white);
  padding: 40px 20px;
  margin-top: 60px;
  text-align: center;
}

footer a {
  color: var(--color-gold);
}

footer a:hover {
  color: var(--color-red-light);
}

/* ============================================
   TABLES
   ============================================ */

table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--color-white);
}

thead {
  background-color: var(--color-blue-primary);
  color: var(--color-white);
}

th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

td {
  padding: 12px;
  border-bottom: 1px solid var(--color-light-gray);
}

tbody tr:hover {
  background-color: var(--color-blue-lightest);
}

/* ============================================
   PROGRESS & STATUS
   ============================================ */

.progress {
  background-color: var(--color-light-gray);
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin: 12px 0;
}

.progress-bar {
  background: linear-gradient(90deg, var(--color-blue-primary) 0%, var(--color-red-primary) 100%);
  height: 100%;
  transition: width 0.3s ease;
}

/* ============================================
   RESPONSIVE DESIGN
   ============================================ */

@media (max-width: 768px) {
  .btn-primary,
  .btn-secondary,
  .btn-outline {
    display: block;
    width: 100%;
    margin-bottom: 8px;
  }

  nav a,
  .navbar a {
    margin: 0 8px;
    font-size: 14px;
  }

  .card,
  .card-container {
    padding: 16px;
  }
}

/* ============================================
   ANIMATIONS
   ============================================ */

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-slide-in {
  animation: slideInFromLeft 0.3s ease;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease;
}

.animate-pulse {
  animation: pulse 2s infinite;
}

/* ============================================
   UTILITY CLASSES
   ============================================ */

.text-primary { color: var(--color-blue-primary); }
.text-secondary { color: var(--color-red-primary); }
.text-success { color: var(--color-success); }
.text-danger { color: var(--color-danger); }
.text-warning { color: var(--color-warning); }
.text-muted { color: var(--color-medium-gray); }

.bg-primary { background-color: var(--color-blue-primary); }
.bg-secondary { background-color: var(--color-red-primary); }
.bg-light { background-color: var(--color-light-gray); }
.bg-dark { background-color: var(--color-charcoal); }
.bg-white { background-color: var(--color-white); }

.border-primary { border: 1px solid var(--color-blue-primary); }
.border-secondary { border: 1px solid var(--color-red-primary); }

.shadow-sm { box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
.shadow-md { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
.shadow-lg { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); }

.rounded { border-radius: 6px; }
.rounded-lg { border-radius: 12px; }
.rounded-full { border-radius: 50%; }

.p-1 { padding: 4px; }
.p-2 { padding: 8px; }
.p-3 { padding: 12px; }
.p-4 { padding: 16px; }
.p-5 { padding: 20px; }

.m-1 { margin: 4px; }
.m-2 { margin: 8px; }
.m-3 { margin: 12px; }
.m-4 { margin: 16px; }
.m-5 { margin: 20px; }

.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.mt-5 { margin-top: 20px; }

.mb-1 { margin-bottom: 4px; }
.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mb-5 { margin-bottom: 20px; }

.flex { display: flex; }
.flex-center { display: flex; justify-content: center; align-items: center; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-column { display: flex; flex-direction: column; }

.grid { display: grid; }
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

.text-center { text-align: center; }
.text-right { text-align: right; }
.text-left { text-align: left; }

.w-full { width: 100%; }
.h-full { height: 100%; }

.hidden { display: none; }
.visible { display: block; }

.opacity-50 { opacity: 0.5; }
.opacity-75 { opacity: 0.75; }
`;

  return css;
}

/**
 * Sauvegarder CSS dans fichier
 */
async function saveBrandingCSS() {
  try {
    const css = await generateBrandingCSS();
    const cssPath = path.join(BRANDING_DIR, 'branding-colors.css');
    
    await fs.mkdir(BRANDING_DIR, { recursive: true });
    await fs.writeFile(cssPath, css, 'utf-8');
    
    logger.info('CSS branding sauvegardé:', cssPath);
    return {
      success: true,
      path: cssPath,
      url: '/public/branding/branding-colors.css'
    };
  } catch (err) {
    logger.error('Erreur sauvegarde CSS branding:', err);
    throw err;
  }
}

/**
 * Obtenir palette de couleurs
 */
function getPalette() {
  return GUINEAN_PALETTE;
}

/**
 * Obtenir couleur par clé
 */
function getColor(colorPath) {
  const keys = colorPath.split('.');
  let value = GUINEAN_PALETTE;
  
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key];
    } else {
      return null;
    }
  }
  
  return value;
}

/**
 * Obtenir configuration couleurs
 */
function getBrandingConfig() {
  return {
    palette: GUINEAN_PALETTE,
    primary: GUINEAN_PALETTE.blue.primary,
    secondary: GUINEAN_PALETTE.red.primary,
    accent: GUINEAN_PALETTE.accents.gold,
    neutral: GUINEAN_PALETTE.neutral.white,
    cssUrl: '/public/branding/branding-colors.css'
  };
}

module.exports = {
  GUINEAN_PALETTE,
  generateBrandingCSS,
  saveBrandingCSS,
  getPalette,
  getColor,
  getBrandingConfig
};

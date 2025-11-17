/**
 * 🎨 Système Branding AKIG
 * Gestion Logo, Couleurs, Polices, Thèmes
 * 
 * backend/src/services/branding.service.js
 */

const fs = require('fs').promises;
const path = require('path');
const pool = require('../db');
const logger = require('./logger');

const BRANDING_DIR = path.join(__dirname, '../../public/branding');

const BrandingService = {
  /**
   * Initialiser répertoire branding
   */
  async initialize() {
    try {
      await fs.mkdir(BRANDING_DIR, { recursive: true });
      await fs.mkdir(path.join(BRANDING_DIR, 'logos'), { recursive: true });
      await fs.mkdir(path.join(BRANDING_DIR, 'images'), { recursive: true });
      logger.info('Répertoire branding initialisé');
    } catch (err) {
      logger.error('Erreur init branding', err);
    }
  },

  /**
   * Télécharger logo agence
   * @param {Object} file - Fichier logo
   * @returns {Promise<Object>} Info logo enregistré
   */
  async uploadLogo(file) {
    try {
      const timestamp = Date.now();
      const logoName = `logo-${timestamp}${path.extname(file.originalname)}`;
      const logoPath = path.join(BRANDING_DIR, 'logos', logoName);

      // Sauvegarder fichier
      await fs.writeFile(logoPath, file.buffer);

      // Enregistrer en BD
      const result = await pool.query(
        `INSERT INTO branding_assets 
         (asset_type, asset_name, file_path, file_url, uploaded_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        ['logo', logoName, logoPath, `/public/branding/logos/${logoName}`]
      );

      logger.info('Logo téléchargé', { logoName });
      return result.rows[0];
    } catch (err) {
      logger.error('Erreur téléchargement logo', err);
      throw err;
    }
  },

  /**
   * Configurer thème couleurs
   * @param {Object} colors - { primary, secondary, accent, background, text }
   */
  async setColorTheme(colors) {
    try {
      const themeId = `theme-${Date.now()}`;
      
      const result = await pool.query(
        `INSERT INTO branding_themes 
         (theme_id, theme_type, colors, is_active, created_at)
         VALUES ($1, $2, $3, TRUE, NOW())
         ON CONFLICT (is_active) DO UPDATE SET 
           colors = EXCLUDED.colors, 
           updated_at = NOW()
         RETURNING *`,
        [themeId, 'color', JSON.stringify(colors)]
      );

      logger.info('Thème couleurs configuré', { colors });
      return result.rows[0];
    } catch (err) {
      logger.error('Erreur configuration thème', err);
      throw err;
    }
  },

  /**
   * Récupérer configuration branding actuelle
   */
  async getActiveBranding() {
    try {
      const logoResult = await pool.query(
        `SELECT * FROM branding_assets 
         WHERE asset_type = 'logo' 
         ORDER BY uploaded_at DESC LIMIT 1`
      );

      const themeResult = await pool.query(
        `SELECT * FROM branding_themes 
         WHERE is_active = TRUE 
         LIMIT 1`
      );

      return {
        logo: logoResult.rows[0] || null,
        theme: themeResult.rows[0] || {
          colors: {
            primary: '#FF6B35',      // Orange chaud (guinéen)
            secondary: '#004E89',    // Bleu profond
            accent: '#F77F00',       // Orange accent
            background: '#FFFFFF',
            text: '#2C3E50'
          }
        }
      };
    } catch (err) {
      logger.error('Erreur récupération branding', err);
      throw err;
    }
  },

  /**
   * Générer CSS personnalisé avec couleurs
   */
  async generateCustomCSS() {
    try {
      const branding = await this.getActiveBranding();
      const colors = branding.theme?.colors || {};

      const css = `
/* 🎨 AKIG Custom Branding CSS */

:root {
  --color-primary: ${colors.primary || '#FF6B35'};
  --color-secondary: ${colors.secondary || '#004E89'};
  --color-accent: ${colors.accent || '#F77F00'};
  --color-background: ${colors.background || '#FFFFFF'};
  --color-text: ${colors.text || '#2C3E50'};
}

/* Boutons */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: var(--color-secondary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Logo intégration */
.logo-container {
  background-color: var(--color-background);
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Thème global */
body {
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: 'Poppins', sans-serif;
}

/* Navigation */
nav {
  background-color: var(--color-primary);
  color: white;
}

/* Cards */
.card {
  border: 1px solid var(--color-primary);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Accents */
.accent-text {
  color: var(--color-accent);
  font-weight: 600;
}
`;

      logger.info('CSS personnalisé généré');
      return css;
    } catch (err) {
      logger.error('Erreur génération CSS', err);
      throw err;
    }
  },

  /**
   * Exporter configuration branding complète
   */
  async exportBrandingConfig() {
    try {
      const branding = await this.getActiveBranding();
      const css = await this.generateCustomCSS();

      return {
        branding,
        customCSS: css,
        exportDate: new Date().toISOString()
      };
    } catch (err) {
      logger.error('Erreur export branding', err);
      throw err;
    }
  }
};

module.exports = BrandingService;

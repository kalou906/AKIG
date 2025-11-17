/**
 * Routes Branding & Documents Agence
 * Gestion logo SVG, documents, contrats, exportation
 * backend/src/routes/branding.routes.js
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const BrandingService = require('../services/branding.service');
const { generateBrandingCSS, saveBrandingCSS, getBrandingConfig } = require('../services/branding-colors.service');
const { generateDefaultLogoSVG, saveAllLogos, getLogoSVG } = require('../services/logo-generator.service');
const logger = require('../services/logger');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// Répertoires
const BRANDING_DIR = path.join(__dirname, '../../public/branding');
const DOCUMENTS_DIR = path.join(__dirname, '../../public/documents/agency');

/**
 * GET /api/branding/config
 * Récupérer configuration branding actuelle
 */
router.get('/config', async (req, res) => {
  try {
    const config = await BrandingService.getActiveBranding();
    res.json(config);
  } catch (err) {
    logger.error('Erreur config branding', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/branding/css
 * Récupérer CSS personnalisé avec branding
 */
router.get('/css', async (req, res) => {
  try {
    const css = await BrandingService.generateCustomCSS();
    res.set('Content-Type', 'text/css');
    res.send(css);
  } catch (err) {
    logger.error('Erreur CSS branding', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/branding/logo
 * Récupérer logo SVG de l'agence
 */
router.get('/logo', async (req, res) => {
  try {
    const logoPath = path.join(BRANDING_DIR, 'logo.svg');
    
    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath, 'utf8');
      res.set('Content-Type', 'image/svg+xml');
      res.send(logoData);
    } else {
      // Logo par défaut
      const defaultLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FF6B35;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#004E89;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="200" height="100" fill="white"/>
        <path d="M 50 50 L 80 20 L 110 50 L 110 80 L 50 80 Z" fill="url(#grad1)" stroke="#FF6B35" stroke-width="2"/>
        <rect x="65" y="55" width="30" height="25" fill="white"/>
        <text x="130" y="35" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#FF6B35">AKIG</text>
        <text x="130" y="55" font-family="Arial, sans-serif" font-size="10" fill="#004E89">Immobilier</text>
        <text x="130" y="75" font-family="Arial, sans-serif" font-size="8" fill="#666">Guinée</text>
      </svg>`;

      res.set('Content-Type', 'image/svg+xml');
      res.send(defaultLogo);
    }
  } catch (err) {
    logger.error('Erreur récupération logo', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/branding/logo/upload
 * Télécharger nouveau logo SVG
 */
router.post('/logo/upload', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (!req.files || !req.files.logo) {
      return res.status(400).json({ error: 'Fichier logo requis' });
    }

    const logoFile = req.files.logo;
    const logoPath = path.join(BRANDING_DIR, 'logo.svg');

    // Sauvegarder logo
    logoFile.mv(logoPath, (err) => {
      if (err) {
        logger.error('Erreur upload logo', err);
        return res.status(500).json({ error: err.message });
      }

      logger.info('Logo uploadé avec succès');
      res.json({
        message: 'Logo uploadé avec succès',
        path: '/branding/logo',
        size: logoFile.size
      });
    });
  } catch (err) {
    logger.error('Erreur traitement logo', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/branding/documents
 * Lister tous les documents agence
 */
router.get('/documents', async (req, res) => {
  try {
    const documents = {
      rental_contracts: [],
      management_contracts: [],
      audit_reports: [],
      references: [],
      templates: []
    };

    // Scanner répertoires
    const scanDir = (dirPath, category) => {
      try {
        if (fs.existsSync(dirPath)) {
          fs.readdirSync(dirPath).forEach(file => {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            documents[category].push({
              name: file,
              size: stat.size,
              created: stat.birthtime,
              modified: stat.mtime,
              url: `/api/branding/documents/${category}/${file}`
            });
          });
        }
      } catch (err) {
        logger.warn(`Répertoire non trouvé: ${dirPath}`);
      }
    };

    scanDir(path.join(DOCUMENTS_DIR, 'rental_contracts'), 'rental_contracts');
    scanDir(path.join(DOCUMENTS_DIR, 'management_contracts'), 'management_contracts');
    scanDir(path.join(DOCUMENTS_DIR, 'audit_reports'), 'audit_reports');
    scanDir(path.join(DOCUMENTS_DIR, 'references'), 'references');
    scanDir(path.join(DOCUMENTS_DIR, 'templates'), 'templates');

    res.json(documents);
  } catch (err) {
    logger.error('Erreur listage documents', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/branding/documents/:category/:filename
 * Télécharger document spécifique
 */
router.get('/documents/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;

    // Sécurité: éviter traversée répertoires
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Nom de fichier invalide' });
    }

    const docPath = path.join(DOCUMENTS_DIR, category, filename);

    if (!fs.existsSync(docPath)) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    res.download(docPath, filename);
  } catch (err) {
    logger.error('Erreur téléchargement document', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/branding/documents/upload
 * Télécharger document agence
 */
router.post('/documents/upload', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { category } = req.body;

    if (!req.files || !req.files.document) {
      return res.status(400).json({ error: 'Fichier document requis' });
    }

    if (!category || !['rental_contracts', 'management_contracts', 'audit_reports', 'references', 'templates'].includes(category)) {
      return res.status(400).json({ error: 'Catégorie invalide' });
    }

    const docFile = req.files.document;
    const docDir = path.join(DOCUMENTS_DIR, category);

    // Créer répertoire si absent
    if (!fs.existsSync(docDir)) {
      fs.mkdirSync(docDir, { recursive: true });
    }

    const docPath = path.join(docDir, docFile.name);

    docFile.mv(docPath, (err) => {
      if (err) {
        logger.error('Erreur upload document', err);
        return res.status(500).json({ error: err.message });
      }

      logger.info('Document uploadé', { category, filename: docFile.name });
      res.json({
        message: 'Document uploadé avec succès',
        category,
        filename: docFile.name,
        url: `/api/branding/documents/${category}/${docFile.name}`
      });
    });
  } catch (err) {
    logger.error('Erreur traitement document', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/branding/documents/export
 * Exporter documents agence complets
 */
router.post('/documents/export', authenticate, authorize('admin'), async (req, res) => {
  try {
    const JSZip = require('jszip');
    const zip = new JSZip();

    // Ajouter documents au zip
    const addFilesToZip = (dirPath, zipFolder) => {
      try {
        if (fs.existsSync(dirPath)) {
          fs.readdirSync(dirPath).forEach(file => {
            const filePath = path.join(dirPath, file);
            const fileData = fs.readFileSync(filePath);
            zipFolder.file(file, fileData);
          });
        }
      } catch (err) {
        logger.warn(`Erreur ajout fichiers: ${dirPath}`);
      }
    };

    addFilesToZip(path.join(DOCUMENTS_DIR, 'rental_contracts'), zip.folder('Contrats_Location'));
    addFilesToZip(path.join(DOCUMENTS_DIR, 'management_contracts'), zip.folder('Contrats_Gerance'));
    addFilesToZip(path.join(DOCUMENTS_DIR, 'audit_reports'), zip.folder('Rapports_Audit'));
    addFilesToZip(path.join(DOCUMENTS_DIR, 'references'), zip.folder('References'));
    addFilesToZip(path.join(DOCUMENTS_DIR, 'templates'), zip.folder('Templates'));

    // Générer zip
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename="AKIG-Documents.zip"');
    res.send(zipBuffer);

    logger.info('Documents agence exportés');
  } catch (err) {
    logger.error('Erreur export documents', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/branding/export
 * Exporter configuration branding complète
 */
router.get('/export', async (req, res) => {
  try {
    const config = await BrandingService.exportBrandingConfig();
    res.json(config);
  } catch (err) {
    logger.error('Erreur export branding', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/branding/colors/palette
 * Récupérer palette de couleurs complète
 */
router.get('/colors/palette', (req, res) => {
  try {
    const config = getBrandingConfig();
    res.json({
      success: true,
      palette: config,
      message: 'Palette couleurs bleu/blanc/rouge AKIG'
    });
  } catch (err) {
    logger.error('Erreur palette couleurs', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/branding/colors/css
 * Récupérer fichier CSS branding
 */
router.get('/colors/css', async (req, res) => {
  try {
    const css = await generateBrandingCSS();
    res.set('Content-Type', 'text/css; charset=utf-8');
    res.send(css);
  } catch (err) {
    logger.error('Erreur CSS branding', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/branding/colors/generate
 * Générer et sauvegarder CSS branding
 */
router.post('/colors/generate', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await saveBrandingCSS();
    logger.info('CSS branding généré');
    res.json({
      success: true,
      result,
      message: 'CSS branding généré et sauvegardé'
    });
  } catch (err) {
    logger.error('Erreur génération CSS', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/branding/logos/list
 * Lister tous les logos disponibles
 */
router.get('/logos/list', (req, res) => {
  try {
    const logos = {
      default: '/api/branding/logos/default',
      favicon: '/api/branding/logos/favicon',
      gradient: '/api/branding/logos/gradient',
      hexagon: '/api/branding/logos/hexagon',
      minimal: '/api/branding/logos/minimal'
    };
    res.json({
      success: true,
      logos,
      message: 'Logos disponibles'
    });
  } catch (err) {
    logger.error('Erreur liste logos', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/branding/logos/:type
 * Récupérer logo SVG par type
 */
router.get('/logos/:type', (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['default', 'favicon', 'gradient', 'hexagon', 'minimal'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: `Type invalide. Valides: ${validTypes.join(', ')}`
      });
    }

    const svg = getLogoSVG(type);
    res.set('Content-Type', 'image/svg+xml; charset=utf-8');
    res.send(svg);
  } catch (err) {
    logger.error('Erreur récupération logo', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/branding/logos/generate
 * Générer et sauvegarder tous les logos
 */
router.post('/logos/generate', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await saveAllLogos();
    logger.info('Tous les logos générés');
    res.json({
      success: true,
      result,
      message: 'Logos générés et sauvegardés'
    });
  } catch (err) {
    logger.error('Erreur génération logos', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/branding/init
 * Initialiser tout le système branding (CSS + Logos)
 */
router.post('/init', authenticate, authorize('admin'), async (req, res) => {
  try {
    logger.info('Initialisation système branding');
    
    // Générer CSS
    const cssResult = await saveBrandingCSS();
    
    // Générer logos
    const logosResult = await saveAllLogos();
    
    res.json({
      success: true,
      results: {
        css: cssResult,
        logos: logosResult
      },
      message: 'Système branding initialisé complètement'
    });
  } catch (err) {
    logger.error('Erreur init branding', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

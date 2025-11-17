/**
 * Routes pour les préférences utilisateur
 * Endpoints pour gérer les préférences, widgets et filtres sauvegardés
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const {
  getPreferences,
  updatePreferences,
  updateWidgets,
  saveFilter,
  deleteFilter,
} = require('../services/userPreferences');

/**
 * GET /api/user/preferences
 * Récupère les préférences de l'utilisateur connecté
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const preferences = await getPreferences(pool, req.user.id);
    
    res.json({
      ok: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Erreur récupération préférences:', error);
    res.status(500).json({
      ok: false,
      error: 'Erreur récupération des préférences',
      code: 'PREF_FETCH_ERROR',
    });
  }
});

/**
 * PUT /api/user/preferences
 * Met à jour les préférences de l'utilisateur
 * 
 * Body:
 * {
 *   locale?: 'fr' | 'en' | 'es',
 *   theme?: 'light' | 'dark' | 'auto',
 *   notif_channel?: 'email' | 'sms' | 'push' | 'none',
 *   notif_email?: boolean,
 *   notif_sms?: boolean,
 *   notif_push?: boolean,
 *   notif_frequency?: 'immediate' | 'daily' | 'weekly' | 'never'
 * }
 */
router.put('/', requireAuth, async (req, res) => {
  try {
    const {
      locale,
      theme,
      notif_channel,
      notif_email,
      notif_sms,
      notif_push,
      notif_frequency,
    } = req.body;

    // Construire l'objet updates
    const updates = {};
    
    if (locale !== undefined) updates.locale = locale;
    if (theme !== undefined) updates.theme = theme;
    if (notif_channel !== undefined) updates.notif_channel = notif_channel;
    if (notif_email !== undefined) updates.notif_email = notif_email;
    if (notif_sms !== undefined) updates.notif_sms = notif_sms;
    if (notif_push !== undefined) updates.notif_push = notif_push;
    if (notif_frequency !== undefined) updates.notif_frequency = notif_frequency;

    // Pas de champs à mettre à jour
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Aucun champ à mettre à jour',
        code: 'NO_UPDATES',
      });
    }

    const updated = await updatePreferences(pool, req.user.id, updates);

    res.json({
      ok: true,
      message: 'Préférences mises à jour',
      data: updated,
    });
  } catch (error) {
    console.error('Erreur mise à jour préférences:', error);
    
    // Erreur de validation
    if (error.message.includes('invalide') || error.message.includes('Locale')) {
      return res.status(400).json({
        ok: false,
        error: error.message,
        code: 'VALIDATION_ERROR',
      });
    }

    res.status(500).json({
      ok: false,
      error: 'Erreur mise à jour des préférences',
      code: 'PREF_UPDATE_ERROR',
    });
  }
});

/**
 * GET /api/user/preferences/widgets
 * Récupère les widgets configurés de l'utilisateur
 */
router.get('/widgets', requireAuth, async (req, res) => {
  try {
    const preferences = await getPreferences(pool, req.user.id);
    
    res.json({
      ok: true,
      data: preferences.widgets || [],
    });
  } catch (error) {
    console.error('Erreur récupération widgets:', error);
    res.status(500).json({
      ok: false,
      error: 'Erreur récupération des widgets',
      code: 'WIDGETS_FETCH_ERROR',
    });
  }
});

/**
 * PUT /api/user/preferences/widgets
 * Mets à jour la configuration des widgets du dashboard
 * 
 * Body:
 * {
 *   widgets: [
 *     { id: 'occupancy', type: 'chart' },
 *     { id: 'revenue', type: 'stat' }
 *   ]
 * }
 */
router.put('/widgets', requireAuth, async (req, res) => {
  try {
    const { widgets } = req.body;

    if (!widgets) {
      return res.status(400).json({
        ok: false,
        error: 'Champ "widgets" requis',
        code: 'MISSING_WIDGETS',
      });
    }

    const updated = await updateWidgets(pool, req.user.id, widgets);

    res.json({
      ok: true,
      message: 'Widgets mis à jour',
      data: updated,
    });
  } catch (error) {
    console.error('Erreur mise à jour widgets:', error);
    
    // Erreur de validation
    if (error.message.includes('array') || error.message.includes('invalide')) {
      return res.status(400).json({
        ok: false,
        error: error.message,
        code: 'VALIDATION_ERROR',
      });
    }

    res.status(500).json({
      ok: false,
      error: 'Erreur mise à jour des widgets',
      code: 'WIDGETS_UPDATE_ERROR',
    });
  }
});

/**
 * GET /api/user/preferences/filters
 * Récupère les filtres sauvegardés de l'utilisateur
 */
router.get('/filters', requireAuth, async (req, res) => {
  try {
    const preferences = await getPreferences(pool, req.user.id);
    
    res.json({
      ok: true,
      data: preferences.saved_filters || {},
    });
  } catch (error) {
    console.error('Erreur récupération filtres:', error);
    res.status(500).json({
      ok: false,
      error: 'Erreur récupération des filtres',
      code: 'FILTERS_FETCH_ERROR',
    });
  }
});

/**
 * POST /api/user/preferences/filters/:filterName
 * Sauvegarde un nouveau filtre ou met à jour un filtre existant
 * 
 * Body:
 * {
 *   config: {
 *     status?: string,
 *     period?: string,
 *     minAmount?: number,
 *     ...
 *   }
 * }
 */
router.post('/filters/:filterName', requireAuth, async (req, res) => {
  try {
    const { filterName } = req.params;
    const { config } = req.body;

    // Valider le nom du filtre
    if (!filterName || filterName.length < 1 || filterName.length > 100) {
      return res.status(400).json({
        ok: false,
        error: 'Nom de filtre invalide (1-100 caractères)',
        code: 'INVALID_FILTER_NAME',
      });
    }

    // Valider la configuration
    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        ok: false,
        error: 'Configuration de filtre requise',
        code: 'MISSING_CONFIG',
      });
    }

    const saved = await saveFilter(pool, req.user.id, filterName, config);

    res.json({
      ok: true,
      message: `Filtre "${filterName}" sauvegardé`,
      data: saved,
    });
  } catch (error) {
    console.error('Erreur sauvegarde filtre:', error);
    res.status(500).json({
      ok: false,
      error: 'Erreur sauvegarde du filtre',
      code: 'FILTER_SAVE_ERROR',
    });
  }
});

/**
 * DELETE /api/user/preferences/filters/:filterName
 * Supprime un filtre sauvegardé
 */
router.delete('/filters/:filterName', requireAuth, async (req, res) => {
  try {
    const { filterName } = req.params;

    if (!filterName) {
      return res.status(400).json({
        ok: false,
        error: 'Nom de filtre requis',
        code: 'MISSING_FILTER_NAME',
      });
    }

    const updated = await deleteFilter(pool, req.user.id, filterName);

    res.json({
      ok: true,
      message: `Filtre "${filterName}" supprimé`,
      data: updated,
    });
  } catch (error) {
    console.error('Erreur suppression filtre:', error);
    
    // Filtre non trouvé
    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        ok: false,
        error: error.message,
        code: 'FILTER_NOT_FOUND',
      });
    }

    res.status(500).json({
      ok: false,
      error: 'Erreur suppression du filtre',
      code: 'FILTER_DELETE_ERROR',
    });
  }
});

/**
 * GET /api/user/preferences/filters/:filterName
 * Récupère un filtre sauvegardé spécifique
 */
router.get('/filters/:filterName', requireAuth, async (req, res) => {
  try {
    const { filterName } = req.params;

    const preferences = await getPreferences(pool, req.user.id);
    const filters = preferences.saved_filters || {};

    if (!filters[filterName]) {
      return res.status(404).json({
        ok: false,
        error: `Filtre "${filterName}" non trouvé`,
        code: 'FILTER_NOT_FOUND',
      });
    }

    res.json({
      ok: true,
      data: filters[filterName],
    });
  } catch (error) {
    console.error('Erreur récupération filtre:', error);
    res.status(500).json({
      ok: false,
      error: 'Erreur récupération du filtre',
      code: 'FILTER_FETCH_ERROR',
    });
  }
});

/**
 * POST /api/user/preferences/reset
 * Réinitialise toutes les préférences aux valeurs par défaut
 */
router.post('/reset', requireAuth, async (req, res) => {
  try {
    const defaultPreferences = {
      locale: 'fr',
      theme: 'light',
      notif_channel: 'email',
      notif_email: true,
      notif_sms: false,
      notif_push: false,
      notif_frequency: 'immediate',
      widgets: [],
      saved_filters: {},
    };

    await updatePreferences(pool, req.user.id, defaultPreferences);

    res.json({
      ok: true,
      message: 'Préférences réinitialisées aux valeurs par défaut',
      data: defaultPreferences,
    });
  } catch (error) {
    console.error('Erreur réinitialisation préférences:', error);
    res.status(500).json({
      ok: false,
      error: 'Erreur réinitialisation des préférences',
      code: 'PREF_RESET_ERROR',
    });
  }
});

module.exports = router;

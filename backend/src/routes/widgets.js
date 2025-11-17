/**
 * Widgets Routes
 * backend/src/routes/widgets.js
 * 
 * API pour la gestion des widgets personnalisables du tableau de bord
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const logger = require('../services/logger');
const audit = require('../services/audit');
const widgetsService = require('../services/widgets');

/**
 * GET /api/widgets
 * Récupère tous les widgets de l'utilisateur
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, type, title, position, config, 
              is_visible, size, created_at, updated_at
       FROM user_widgets 
       WHERE user_id = $1 
       ORDER BY position ASC, created_at ASC`,
      [req.user.id]
    );

    await audit.logAccess('widgets_list', {
      userId: req.user.id,
      widgetCount: rows.length,
    });

    res.json(rows);
  } catch (error) {
    logger.error('Error fetching widgets', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors de la récupération des widgets' });
  }
});

/**
 * GET /api/widgets/available
 * Récupère la liste des widgets disponibles
 */
router.get('/available', requireAuth, async (req, res) => {
  try {
    const availableWidgets = [
      {
        id: 'overview',
        name: 'Vue d\'ensemble',
        description: 'Résumé des propriétés et revenus',
        icon: 'dashboard',
        defaultSize: 'large',
        configurable: true,
      },
      {
        id: 'cashflow',
        name: 'Flux de trésorerie',
        description: 'Analyse mensuelle des entrées/sorties',
        icon: 'trending_up',
        defaultSize: 'large',
        configurable: true,
      },
      {
        id: 'properties',
        name: 'Propriétés',
        description: 'Liste de vos propriétés',
        icon: 'home',
        defaultSize: 'medium',
        configurable: true,
      },
      {
        id: 'tenants',
        name: 'Locataires',
        description: 'Gestion des locataires actifs',
        icon: 'people',
        defaultSize: 'medium',
        configurable: false,
      },
      {
        id: 'payments',
        name: 'Paiements',
        description: 'Historique et suivi des paiements',
        icon: 'payment',
        defaultSize: 'medium',
        configurable: true,
      },
      {
        id: 'maintenance',
        name: 'Maintenance',
        description: 'Demandes de maintenance en cours',
        icon: 'build',
        defaultSize: 'small',
        configurable: false,
      },
      {
        id: 'documents',
        name: 'Documents',
        description: 'Accès rapide aux documents récents',
        icon: 'description',
        defaultSize: 'small',
        configurable: false,
      },
      {
        id: 'alerts',
        name: 'Alertes',
        description: 'Notifications et alertes importantes',
        icon: 'notification_important',
        defaultSize: 'small',
        configurable: false,
      },
      {
        id: 'feedback',
        name: 'Retours',
        description: 'Retours des locataires et analyses',
        icon: 'comment',
        defaultSize: 'medium',
        configurable: true,
      },
    ];

    res.json(availableWidgets);
  } catch (error) {
    logger.error('Error fetching available widgets', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la récupération des widgets disponibles' });
  }
});

/**
 * GET /api/widgets/:id/data
 * Récupère les données dynamiques d'un widget
 */
router.get('/:id/data', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer la configuration du widget
    const { rows: widgetRows } = await pool.query(
      `SELECT type, config FROM user_widgets WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (widgetRows.length === 0) {
      return res.status(404).json({ error: 'Widget non trouvé' });
    }

    const widget = widgetRows[0];
    const config = typeof widget.config === 'string' ? JSON.parse(widget.config) : widget.config;

    // Récupérer les données du widget
    const data = await widgetsService.getWidgetData(req.user.id, widget.type, config);

    await audit.logAccess('widget_data_fetch', {
      userId: req.user.id,
      widgetId: id,
      widgetType: widget.type,
    });

    res.json({
      id,
      type: widget.type,
      config,
      data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching widget data', { error: error.message, widgetId: req.params.id });
    res.status(500).json({ error: 'Erreur lors de la récupération des données du widget' });
  }
});

/**
 * GET /api/widgets/:id
 * Récupère un widget spécifique
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT id, user_id, type, title, position, config, 
              is_visible, size, created_at, updated_at
       FROM user_widgets 
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Widget non trouvé' });
    }

    await audit.logAccess('widget_view', {
      userId: req.user.id,
      widgetId: id,
      widgetType: rows[0].type,
    });

    res.json(rows[0]);
  } catch (error) {
    logger.error('Error fetching widget', { error: error.message, widgetId: req.params.id });
    res.status(500).json({ error: 'Erreur lors de la récupération du widget' });
  }
});

/**
 * POST /api/widgets
 * Crée un nouveau widget
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { type, title, position, config, size } = req.body;

    // Validation
    if (!type) {
      return res.status(400).json({ error: 'Le type du widget est requis' });
    }

    // Récupérer la position par défaut si non spécifiée
    let finalPosition = position;
    if (finalPosition === undefined) {
      const { rows } = await pool.query(
        `SELECT MAX(position) as max_pos FROM user_widgets WHERE user_id = $1`,
        [req.user.id]
      );
      finalPosition = (rows[0].max_pos || 0) + 1;
    }

    const { rows } = await pool.query(
      `INSERT INTO user_widgets (user_id, type, title, position, config, size, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, user_id, type, title, position, config, is_visible, size, created_at, updated_at`,
      [
        req.user.id,
        type,
        title || type,
        finalPosition,
        JSON.stringify(config || {}),
        size || 'medium',
      ]
    );

    const widget = rows[0];
    widget.config = JSON.parse(widget.config);

    await audit.logCreate('widget_create', {
      userId: req.user.id,
      widgetId: widget.id,
      widgetType: type,
    });

    logger.info('Widget created', { userId: req.user.id, widgetType: type, widgetId: widget.id });

    res.status(201).json(widget);
  } catch (error) {
    logger.error('Error creating widget', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors de la création du widget' });
  }
});

/**
 * PATCH /api/widgets/:id
 * Met à jour un widget
 */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, position, config, is_visible, size } = req.body;

    // Vérifier que le widget appartient à l'utilisateur
    const { rows: checkRows } = await pool.query(
      `SELECT id FROM user_widgets WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({ error: 'Widget non trouvé' });
    }

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (position !== undefined) {
      updates.push(`position = $${paramCount++}`);
      values.push(position);
    }
    if (config !== undefined) {
      updates.push(`config = $${paramCount++}`);
      values.push(JSON.stringify(config));
    }
    if (is_visible !== undefined) {
      updates.push(`is_visible = $${paramCount++}`);
      values.push(is_visible);
    }
    if (size !== undefined) {
      updates.push(`size = $${paramCount++}`);
      values.push(size);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE user_widgets 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, user_id, type, title, position, config, is_visible, size, created_at, updated_at`,
      values
    );

    const widget = rows[0];
    widget.config = JSON.parse(widget.config);

    await audit.logUpdate('widget_update', {
      userId: req.user.id,
      widgetId: id,
      changes: { title, position, config, is_visible, size },
    });

    logger.info('Widget updated', { userId: req.user.id, widgetId: id });

    res.json(widget);
  } catch (error) {
    logger.error('Error updating widget', { error: error.message, widgetId: req.params.id });
    res.status(500).json({ error: 'Erreur lors de la mise à jour du widget' });
  }
});

/**
 * DELETE /api/widgets/:id
 * Supprime un widget
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le widget appartient à l'utilisateur
    const { rows: checkRows } = await pool.query(
      `SELECT id, type FROM user_widgets WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({ error: 'Widget non trouvé' });
    }

    const widgetType = checkRows[0].type;

    await pool.query(`DELETE FROM user_widgets WHERE id = $1`, [id]);

    await audit.logDelete('widget_delete', {
      userId: req.user.id,
      widgetId: id,
      widgetType: widgetType,
    });

    logger.info('Widget deleted', { userId: req.user.id, widgetId: id });

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting widget', { error: error.message, widgetId: req.params.id });
    res.status(500).json({ error: 'Erreur lors de la suppression du widget' });
  }
});

/**
 * POST /api/widgets/reorder
 * Réordonne les widgets
 */
router.post('/reorder', requireAuth, async (req, res) => {
  try {
    const { widgetOrder } = req.body;

    if (!Array.isArray(widgetOrder)) {
      return res.status(400).json({ error: 'widgetOrder doit être un tableau' });
    }

    // Vérifier que tous les widgets appartiennent à l'utilisateur
    const widgetIds = widgetOrder.map((w) => w.id);
    const { rows: checkRows } = await pool.query(
      `SELECT COUNT(*) as count FROM user_widgets WHERE user_id = $1 AND id = ANY($2)`,
      [req.user.id, widgetIds]
    );

    if (checkRows[0].count !== widgetIds.length) {
      return res.status(403).json({ error: 'Accès non autorisé à certains widgets' });
    }

    // Mettre à jour les positions
    for (let i = 0; i < widgetOrder.length; i++) {
      await pool.query(`UPDATE user_widgets SET position = $1 WHERE id = $2`, [i, widgetOrder[i].id]);
    }

    await audit.logUpdate('widget_reorder', {
      userId: req.user.id,
      widgetCount: widgetIds.length,
    });

    logger.info('Widgets reordered', { userId: req.user.id, count: widgetIds.length });

    res.json({ success: true, message: 'Widgets réordonnés' });
  } catch (error) {
    logger.error('Error reordering widgets', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors de la réorganisation des widgets' });
  }
});

/**
 * POST /api/widgets/reset
 * Réinitialise les widgets par défaut
 */
router.post('/reset', requireAuth, async (req, res) => {
  try {
    // Supprimer les widgets existants
    await pool.query(`DELETE FROM user_widgets WHERE user_id = $1`, [req.user.id]);

    // Créer les widgets par défaut
    const defaultWidgets = [
      { type: 'overview', title: 'Vue d\'ensemble', position: 0, size: 'large' },
      { type: 'cashflow', title: 'Flux de trésorerie', position: 1, size: 'large' },
      { type: 'properties', title: 'Propriétés', position: 2, size: 'medium' },
      { type: 'payments', title: 'Paiements', position: 3, size: 'medium' },
      { type: 'alerts', title: 'Alertes', position: 4, size: 'small' },
    ];

    const createdWidgets = [];

    for (const widget of defaultWidgets) {
      const { rows } = await pool.query(
        `INSERT INTO user_widgets (user_id, type, title, position, size, is_visible, config)
         VALUES ($1, $2, $3, $4, $5, true, $6)
         RETURNING id, user_id, type, title, position, config, is_visible, size`,
        [req.user.id, widget.type, widget.title, widget.position, widget.size, '{}']
      );

      const newWidget = rows[0];
      newWidget.config = JSON.parse(newWidget.config);
      createdWidgets.push(newWidget);
    }

    await audit.logUpdate('widget_reset', {
      userId: req.user.id,
      widgetCount: defaultWidgets.length,
    });

    logger.info('Widgets reset to defaults', { userId: req.user.id, count: defaultWidgets.length });

    res.json({
      success: true,
      message: 'Widgets réinitialisés',
      widgets: createdWidgets,
    });
  } catch (error) {
    logger.error('Error resetting widgets', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Erreur lors de la réinitialisation des widgets' });
  }
});

/**
 * POST /api/widgets/toggle/:id
 * Active/désactive un widget
 */
router.post('/toggle/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le widget appartient à l'utilisateur
    const { rows: checkRows } = await pool.query(
      `SELECT is_visible FROM user_widgets WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({ error: 'Widget non trouvé' });
    }

    const newVisibility = !checkRows[0].is_visible;

    const { rows } = await pool.query(
      `UPDATE user_widgets SET is_visible = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
       RETURNING id, user_id, type, title, position, config, is_visible, size, created_at, updated_at`,
      [newVisibility, id]
    );

    const widget = rows[0];
    widget.config = JSON.parse(widget.config);

    await audit.logUpdate('widget_toggle', {
      userId: req.user.id,
      widgetId: id,
      visibility: newVisibility,
    });

    logger.info('Widget toggled', { userId: req.user.id, widgetId: id, visible: newVisibility });

    res.json(widget);
  } catch (error) {
    logger.error('Error toggling widget', { error: error.message, widgetId: req.params.id });
    res.status(500).json({ error: 'Erreur lors du basculement du widget' });
  }
});

module.exports = router;

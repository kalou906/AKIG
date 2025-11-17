/**
 * ============================================================
 * routes/preavis.js - API Préavis (Notices)
 * CRUD + Statut tracking + Workflow préavis
 * ============================================================
 */

const express = require('express');
const { pool } = require('../db');

const router = express.Router();

/**
 * POST /api/preavis - Créer un nouveau préavis
 */
router.post('/', async (req, res) => {
  const { contrat_id, locataire_id, date_emission, date_effet, motif, type } = req.body;

  // Validation
  if (!contrat_id || !locataire_id || !date_emission || !date_effet) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO preavis 
       (contrat_id, locataire_id, date_emission, date_effet, motif, type, statut, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'EN_COURS', now())
       RETURNING *`,
      [contrat_id, locataire_id, date_emission, date_effet, motif || null, type || 'DEPART']
    );

    const preavis = result.rows[0];
    console.log(`[Preavis] Created: ${preavis.id}`);

    res.status(201).json({
      success: true,
      data: preavis,
      message: `Préavis #${preavis.id} créé`,
    });
  } catch (e) {
    console.error('[Preavis] Create error:', e.message);
    res.status(500).json({ error: 'Erreur création préavis', details: e.message });
  }
});

/**
 * GET /api/preavis - Lister tous les préavis avec filtrage
 */
router.get('/', async (req, res) => {
  const { statut, locataire_id, contrat_id, tri } = req.query;

  try {
    let query = `
      SELECT 
        p.*,
        c.adresse as contrat_adresse,
        l.nom as locataire_nom,
        l.email as locataire_email
      FROM preavis p
      LEFT JOIN contrats c ON p.contrat_id = c.id
      LEFT JOIN locataires l ON p.locataire_id = l.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (statut) {
      query += ` AND p.statut = $${paramIndex}`;
      params.push(statut);
      paramIndex++;
    }

    if (locataire_id) {
      query += ` AND p.locataire_id = $${paramIndex}`;
      params.push(locataire_id);
      paramIndex++;
    }

    if (contrat_id) {
      query += ` AND p.contrat_id = $${paramIndex}`;
      params.push(contrat_id);
      paramIndex++;
    }

    // Tri par date_effet (défaut: DESC)
    const triValide = ['ASC', 'DESC'].includes(tri?.toUpperCase()) ? tri.toUpperCase() : 'DESC';
    query += ` ORDER BY p.date_effet ${triValide}, p.created_at ${triValide}`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (e) {
    console.error('[Preavis] List error:', e.message);
    res.status(500).json({ error: 'Erreur récupération préavis', details: e.message });
  }
});

/**
 * GET /api/preavis/:id - Détails d'un préavis
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        p.*,
        c.adresse as contrat_adresse,
        l.nom as locataire_nom,
        l.email as locataire_email
      FROM preavis p
      LEFT JOIN contrats c ON p.contrat_id = c.id
      LEFT JOIN locataires l ON p.locataire_id = l.id
      WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Préavis non trouvé' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (e) {
    console.error('[Preavis] Get error:', e.message);
    res.status(500).json({ error: 'Erreur récupération préavis', details: e.message });
  }
});

/**
 * PUT /api/preavis/:id - Mettre à jour un préavis
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { statut, motif, date_effet } = req.body;

  // Valider statut
  const statutsValides = ['EN_COURS', 'ENVOYE', 'ACCEPTE', 'CONTESTE', 'ARCHIVE'];
  if (statut && !statutsValides.includes(statut)) {
    return res.status(400).json({ error: `Statut invalide. Valides: ${statutsValides.join(', ')}` });
  }

  try {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (statut !== undefined) {
      updates.push(`statut = $${paramIndex}`);
      params.push(statut);
      paramIndex++;
    }
    if (motif !== undefined) {
      updates.push(`motif = $${paramIndex}`);
      params.push(motif);
      paramIndex++;
    }
    if (date_effet !== undefined) {
      updates.push(`date_effet = $${paramIndex}`);
      params.push(date_effet);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification à appliquer' });
    }

    updates.push(`updated_at = now()`);
    params.push(id);

    const query = `UPDATE preavis SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Préavis non trouvé' });
    }

    console.log(`[Preavis] Updated: ${id}`);
    res.json({
      success: true,
      data: result.rows[0],
      message: `Préavis #${id} mis à jour`,
    });
  } catch (e) {
    console.error('[Preavis] Update error:', e.message);
    res.status(500).json({ error: 'Erreur mise à jour préavis', details: e.message });
  }
});

/**
 * DELETE /api/preavis/:id - Supprimer un préavis
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM preavis WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Préavis non trouvé' });
    }

    console.log(`[Preavis] Deleted: ${id}`);
    res.json({
      success: true,
      message: `Préavis #${id} supprimé`,
    });
  } catch (e) {
    console.error('[Preavis] Delete error:', e.message);
    res.status(500).json({ error: 'Erreur suppression préavis', details: e.message });
  }
});

/**
 * GET /api/preavis/:id/alerts - Générer alertes IA pour un préavis
 */
router.get('/:id/alerts', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM preavis WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Préavis non trouvé' });
    }

    const preavis = result.rows[0];
    const alerts = generateAlertsForPreavis(preavis);

    res.json({
      success: true,
      preavis_id: id,
      alerts,
    });
  } catch (e) {
    console.error('[Preavis] Alerts error:', e.message);
    res.status(500).json({ error: 'Erreur génération alertes', details: e.message });
  }
});

/**
 * GET /api/preavis/status/dashboard - Dashboard alertes temps réel
 */
router.get('/status/dashboard', async (req, res) => {
  try {
    // Récupérer tous préavis EN_COURS
    const result = await pool.query(
      `SELECT * FROM preavis WHERE statut = 'EN_COURS' ORDER BY date_effet ASC`
    );

    const allPreavis = result.rows;
    const allAlerts = [];

    // Générer alertes pour chaque préavis
    allPreavis.forEach((p) => {
      const alerts = generateAlertsForPreavis(p);
      allAlerts.push(...alerts);
    });

    // Grouper par criticité
    const alertsByPriority = {
      critical: allAlerts.filter((a) => a.priority === 'critical'),
      high: allAlerts.filter((a) => a.priority === 'high'),
      medium: allAlerts.filter((a) => a.priority === 'medium'),
      low: allAlerts.filter((a) => a.priority === 'low'),
    };

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      total_preavis: allPreavis.length,
      total_alerts: allAlerts.length,
      by_priority: alertsByPriority,
      all_alerts: allAlerts,
    });
  } catch (e) {
    console.error('[Preavis] Dashboard error:', e.message);
    res.status(500).json({ error: 'Erreur dashboard alertes', details: e.message });
  }
});

/**
 * ============================================================
 * HELPER FUNCTIONS
 * ============================================================
 */

/**
 * Générer les alertes IA pour un préavis
 */
function generateAlertsForPreavis(preavis) {
  const alerts = [];
  const today = new Date();
  const dateEffet = new Date(preavis.date_effet);
  const daysRemaining = Math.floor((dateEffet - today) / (1000 * 60 * 60 * 24));

  const baseAlert = {
    preavis_id: preavis.id,
    contrat_id: preavis.contrat_id,
    locataire_id: preavis.locataire_id,
    date_effet: preavis.date_effet,
    timestamp: new Date().toISOString(),
  };

  // Alerte J-30
  if (daysRemaining <= 30 && daysRemaining > 15 && preavis.statut === 'EN_COURS') {
    alerts.push({
      ...baseAlert,
      type: 'J-30',
      window: 'J-30',
      message: `Préavis #${preavis.id}: Préparation nécessaire (${daysRemaining} jours restants)`,
      priority: 'medium',
      action: 'Vérifier documents et délais légaux',
      recipient: 'agent',
    });
  }

  // Alerte J-15
  if (daysRemaining <= 15 && daysRemaining > 7 && preavis.statut === 'EN_COURS') {
    alerts.push({
      ...baseAlert,
      type: 'J-15',
      window: 'J-15',
      message: `Préavis #${preavis.id}: Révision requise (${daysRemaining} jours restants)`,
      priority: 'medium',
      action: 'Valider conformité juridique',
      recipient: 'agent',
    });
  }

  // Alerte J-7
  if (daysRemaining <= 7 && daysRemaining > 3 && preavis.statut === 'EN_COURS') {
    alerts.push({
      ...baseAlert,
      type: 'J-7',
      window: 'J-7',
      message: `⚠️ URGENT: Préavis #${preavis.id} à envoyer (${daysRemaining} jours)`,
      priority: 'high',
      action: 'Envoyer immédiatement par recommandé + SMS/Email',
      recipient: 'agent',
    });
  }

  // Alerte J-3
  if (daysRemaining <= 3 && daysRemaining > 0 && preavis.statut === 'EN_COURS') {
    alerts.push({
      ...baseAlert,
      type: 'J-3',
      window: 'J-3',
      message: `🚨 CRITIQUE: Préavis #${preavis.id} DOIT être envoyé (${daysRemaining} jours)`,
      priority: 'critical',
      action: 'Escalade manager - Risque légal imminent',
      recipient: 'manager',
    });
  }

  // Alerte J-1
  if (daysRemaining <= 1 && daysRemaining >= 0 && preavis.statut === 'EN_COURS') {
    alerts.push({
      ...baseAlert,
      type: 'J-1',
      window: 'J-1',
      message: `🚨 CRITIQUE: Préavis #${preavis.id} DERNIER JOUR (${daysRemaining} jour)`,
      priority: 'critical',
      action: 'Escalade légale - Implication juridique directe',
      recipient: 'manager',
    });
  }

  // Alerte EXPIRED
  if (daysRemaining < 0) {
    alerts.push({
      ...baseAlert,
      type: 'EXPIRED',
      window: 'EXPIRED',
      message: `❌ DÉPASSÉ: Préavis #${preavis.id} n'a pas été envoyé à temps`,
      priority: 'critical',
      action: 'Consulter service juridique - Options limitées',
      recipient: 'manager',
    });
  }

  return alerts;
}

module.exports = router;

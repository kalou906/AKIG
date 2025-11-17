/**
 * Routes: maintenance.js
 * Gestion des maintenances, réparations et appels d'offre
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Middleware de validation
const validateMaintenance = [
  body('property_id').isInt({ min: 1 }).toInt().withMessage('ID propriété invalide'),
  body('unit_id').optional().isInt({ min: 1 }).toInt(),
  body('title').trim().notEmpty().withMessage('Titre requis'),
  body('description').trim().notEmpty().withMessage('Description requise'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Priorité invalide'),
  body('type').isIn(['preventive', 'corrective', 'emergency']).withMessage('Type invalide'),
  body('estimated_cost').isFloat({ min: 0 }).toFloat().withMessage('Coût invalide'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/maintenance
 * Liste les demandes de maintenance
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = '1', pageSize = '20', property_id = '', status = 'all', priority = '' } = req.query;

    const pageNum = Math.max(1, Number(page));
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize)));
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = '1=1';
    const queryParams = [];

    if (property_id) {
      queryParams.push(Number(property_id));
      whereClause += ` AND m.property_id = $${queryParams.length}`;
    }

    if (status !== 'all') {
      queryParams.push(status);
      whereClause += ` AND m.status = $${queryParams.length}`;
    }

    if (priority) {
      queryParams.push(priority);
      whereClause += ` AND m.priority = $${queryParams.length}`;
    }

    // Récupérer le total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM maintenance m WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].total);

    // Récupérer les maintenances
    queryParams.push(pageSizeNum);
    queryParams.push(offset);
    const result = await pool.query(
      `SELECT 
        m.id, m.property_id, m.unit_id, m.title, m.description, m.priority, m.type,
        m.status, m.estimated_cost, m.actual_cost, m.requested_date, m.start_date, m.end_date,
        p.name as property_name,
        u.unit_number,
        (SELECT COUNT(*) FROM maintenance_quotes WHERE maintenance_id = m.id) as quote_count,
        (SELECT MIN(amount) FROM maintenance_quotes WHERE maintenance_id = m.id) as min_quote
       FROM maintenance m
       LEFT JOIN properties p ON m.property_id = p.id
       LEFT JOIN units u ON m.unit_id = u.id
       WHERE ${whereClause}
       ORDER BY m.priority DESC, m.requested_date DESC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    res.json({
      items: result.rows,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/maintenance
 * Crée une demande de maintenance
 */
router.post('/', requireAuth, validateMaintenance, handleValidationErrors, async (req, res) => {
  try {
    const {
      property_id,
      unit_id,
      title,
      description,
      priority,
      type,
      estimated_cost,
      notes,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO maintenance (
        property_id, unit_id, title, description, priority, type,
        estimated_cost, status, requested_date, notes, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, NOW())
      RETURNING id, property_id, title, priority, status, estimated_cost`,
      [
        property_id,
        unit_id || null,
        title,
        description,
        priority,
        type,
        estimated_cost,
        'pending',
        notes || null,
        req.user.id,
      ]
    );

    res.status(201).json({
      message: 'Demande de maintenance créée',
      maintenance: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/maintenance/:id
 * Met à jour une demande de maintenance
 */
router.put('/:id', requireAuth, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actual_cost, start_date, end_date, notes } = req.body;

    const result = await pool.query(
      `UPDATE maintenance 
       SET status = COALESCE($1, status),
           actual_cost = COALESCE($2, actual_cost),
           start_date = COALESCE($3, start_date),
           end_date = COALESCE($4, end_date),
           notes = COALESCE($5, notes),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, status, actual_cost, start_date, end_date`,
      [status || null, actual_cost || null, start_date || null, end_date || null, notes || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance non trouvée' });
    }

    res.json({
      message: 'Maintenance mise à jour',
      maintenance: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/maintenance/:id/quotes
 * Ajoute un appel d'offre pour une maintenance
 */
router.post('/:id/quotes', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { contractor_name, contractor_email, contractor_phone, amount, description, validity_days } = req.body;

    // Vérifier que la maintenance existe
    const maintenanceExists = await pool.query('SELECT id FROM maintenance WHERE id = $1', [id]);
    if (maintenanceExists.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance non trouvée' });
    }

    const validity_date = new Date();
    validity_date.setDate(validity_date.getDate() + (validity_days || 30));

    const result = await pool.query(
      `INSERT INTO maintenance_quotes (
        maintenance_id, contractor_name, contractor_email, contractor_phone,
        amount, description, validity_date, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, contractor_name, amount, status, validity_date`,
      [
        id,
        contractor_name,
        contractor_email || null,
        contractor_phone || null,
        amount,
        description || null,
        validity_date,
        'pending',
      ]
    );

    res.status(201).json({
      message: 'Appel d\'offre ajouté',
      quote: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/maintenance/:id/quotes
 * Récupère les appels d'offre pour une maintenance
 */
router.get('/:id/quotes', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, maintenance_id, contractor_name, contractor_email, contractor_phone,
              amount, description, validity_date, status, created_at
       FROM maintenance_quotes
       WHERE maintenance_id = $1
       ORDER BY amount ASC`,
      [id]
    );

    res.json({
      quotes: result.rows,
      count: result.rows.length,
      lowestBid: result.rows.length > 0 ? result.rows[0].amount : null,
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/maintenance/:maintenanceId/quotes/:quoteId/accept
 * Accepte un appel d'offre
 */
router.post('/:maintenanceId/quotes/:quoteId/accept', requireAuth, authorize(['admin', 'owner', 'manager']), async (req, res) => {
  try {
    const { maintenanceId, quoteId } = req.params;

    // Rejeter les autres appels d'offre
    await pool.query(
      `UPDATE maintenance_quotes SET status = 'rejected' 
       WHERE maintenance_id = $1 AND id != $2`,
      [maintenanceId, quoteId]
    );

    // Accepter l'appel d'offre sélectionné
    const result = await pool.query(
      `UPDATE maintenance_quotes SET status = 'accepted', accepted_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [quoteId]
    );

    // Mettre à jour la maintenance
    await pool.query(
      `UPDATE maintenance SET status = 'approved', actual_cost = $1
       WHERE id = $2`,
      [result.rows[0].amount, maintenanceId]
    );

    res.json({
      message: 'Appel d\'offre accepté',
      quote: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/maintenance/statistics
 * Statistiques sur les maintenances
 */
router.get('/statistics/overview', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_count,
        COALESCE(SUM(estimated_cost), 0) as estimated_budget,
        COALESCE(SUM(actual_cost), 0) as spent,
        COALESCE(AVG(actual_cost), 0) as avg_cost
       FROM maintenance`
    );

    res.json({
      statistics: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

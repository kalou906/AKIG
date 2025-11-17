/**
 * Routes: tasks.js
 * Gestion des tâches, reminders et suivi
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation
const validateTask = [
  body('title').trim().notEmpty().withMessage('Titre requis'),
  body('due_date').isISO8601().withMessage('Date invalide'),
  body('task_type').isIn(['reminder', 'follow_up', 'maintenance', 'payment_reminder', 'other']).withMessage('Type invalide'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/tasks
 * Liste les tâches
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status = 'pending', assigned_to = '', page = '1', pageSize = '20' } = req.query;

    const pageNum = Math.max(1, Number(page));
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize)));
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = 'status = $1';
    const queryParams = [status];

    if (assigned_to) {
      queryParams.push(Number(assigned_to));
      whereClause += ` AND assigned_to = $${queryParams.length}`;
    }

    // Récupérer le total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM tasks WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].total);

    // Récupérer les tâches
    queryParams.push(pageSizeNum);
    queryParams.push(offset);
    const result = await pool.query(
      `SELECT 
        t.id, t.title, t.description, t.task_type, t.due_date, t.priority,
        t.status, t.completion_date, t.related_entity_type, t.related_entity_id,
        u.name as assigned_to_name, u.email as assigned_to_email,
        CASE 
          WHEN t.status = 'completed' THEN 'TERMINÉE'
          WHEN NOW()::date > t.due_date THEN 'RETARDÉE'
          WHEN (t.due_date - NOW()::date) <= 3 THEN 'URGENTE'
          ELSE 'À VENIR'
        END as urgency
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE ${whereClause}
       ORDER BY t.due_date ASC, t.priority DESC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    res.json({
      items: result.rows,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/tasks
 * Crée une nouvelle tâche
 */
router.post('/', requireAuth, validateTask, handleValidationErrors, async (req, res) => {
  try {
    const {
      title,
      description,
      task_type,
      assigned_to,
      due_date,
      priority,
      related_entity_type,
      related_entity_id,
      notes,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO tasks (
        title, description, task_type, assigned_to, due_date, priority,
        related_entity_type, related_entity_id, notes, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING id, title, task_type, due_date, status`,
      [
        title,
        description || null,
        task_type,
        assigned_to || null,
        due_date,
        priority || 'medium',
        related_entity_type || null,
        related_entity_id || null,
        notes || null,
        req.user.id,
      ]
    );

    res.status(201).json({
      message: 'Tâche créée',
      task: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/tasks/:id
 * Met à jour une tâche
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completion_date, notes } = req.body;

    const result = await pool.query(
      `UPDATE tasks 
       SET status = COALESCE($1, status),
           completion_date = CASE WHEN $1 = 'completed' THEN NOW() ELSE completion_date END,
           notes = COALESCE($2, notes),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, status, completion_date`,
      [status || null, notes || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    res.json({
      message: 'Tâche mise à jour',
      task: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Supprime une tâche
 */
router.delete('/:id', requireAuth, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    res.json({ message: 'Tâche supprimée' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/tasks/overdue
 * Récupère les tâches retardées
 */
router.get('/overdue/list', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        t.id, t.title, t.task_type, t.due_date, t.priority, t.assigned_to,
        u.name as assigned_to_name,
        EXTRACT(DAY FROM NOW()::date - t.due_date) as days_overdue
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.status != 'completed' AND NOW()::date > t.due_date
       ORDER BY t.due_date ASC`
    );

    res.json({
      overdue: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

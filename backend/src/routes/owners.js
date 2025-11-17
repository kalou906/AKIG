/**
 * Routes: owners.js
 * Gestion complète des propriétaires
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, authorize } = require('../middleware/auth');
const { body, validationResult, param } = require('express-validator');

// Middleware de validation
const validateOwner = [
  body('name').trim().notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('postal_code').optional().trim(),
  body('country').optional().trim(),
  body('company_name').optional().trim(),
  body('tax_id').optional().trim(),
  body('bank_account').optional().trim(),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/owners
 * Récupère la liste des propriétaires
 */
router.get('/', requireAuth, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { query = '', page = '1', pageSize = '20', status = 'all' } = req.query;

    const pageNum = Math.max(1, Number(page));
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize)));
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = "role = 'owner'";
    const queryParams = [];

    if (query) {
      queryParams.push(`%${query}%`);
      whereClause += ` AND (name ILIKE $1 OR email ILIKE $1 OR company_name ILIKE $1)`;
    }

    if (status === 'active') {
      queryParams.push(true);
      whereClause += ` AND is_active = $${queryParams.length}`;
    } else if (status === 'inactive') {
      queryParams.push(false);
      whereClause += ` AND is_active = $${queryParams.length}`;
    }

    // Récupérer le total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].total);

    // Récupérer les propriétaires
    queryParams.push(pageSizeNum);
    queryParams.push(offset);
    const result = await pool.query(
      `SELECT 
        id, name, email, phone, address, city, postal_code, country,
        company_name, tax_id, bank_account, is_active, created_at,
        (SELECT COUNT(*) FROM properties WHERE owner_id = users.id) as property_count
      FROM users 
      WHERE ${whereClause}
      ORDER BY name ASC
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
    console.error('Erreur lors de la récupération des propriétaires:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/owners/:id
 * Récupère les détails d'un propriétaire
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer les informations du propriétaire
    const ownerResult = await pool.query(
      `SELECT * FROM users WHERE id = $1 AND role = 'owner'`,
      [id]
    );

    if (ownerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Propriétaire non trouvé' });
    }

    const owner = ownerResult.rows[0];

    // Récupérer les propriétés du propriétaire
    const propertiesResult = await pool.query(
      `SELECT id, name, address, city, property_type, number_of_units, status
       FROM properties WHERE owner_id = $1
       ORDER BY name ASC`,
      [id]
    );

    // Récupérer les statistiques
    const statsResult = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM properties WHERE owner_id = $1) as property_count,
        (SELECT COUNT(*) FROM units WHERE property_id IN (SELECT id FROM properties WHERE owner_id = $1)) as unit_count,
        (SELECT COUNT(*) FROM contracts WHERE property_id IN (SELECT id FROM properties WHERE owner_id = $1) AND status = 'active') as active_contracts,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE contract_id IN (SELECT id FROM contracts WHERE property_id IN (SELECT id FROM properties WHERE owner_id = $1)) AND paid_at >= DATE_TRUNC('month', CURRENT_DATE)) as revenue_this_month
       FROM users WHERE id = $1`,
      [id]
    );

    const stats = statsResult.rows[0];

    res.json({
      owner,
      properties: propertiesResult.rows,
      stats,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du propriétaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/owners
 * Crée un nouveau propriétaire
 */
router.post('/', requireAuth, authorize(['admin']), validateOwner, handleValidationErrors, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      name,
      email,
      phone,
      address,
      city,
      postal_code,
      country,
      company_name,
      tax_id,
      bank_account,
      notes,
    } = req.body;

    // Vérifier que l'email n'existe pas
    const existingEmail = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Cet email existe déjà' });
    }

    // Créer l'utilisateur propriétaire
    const result = await client.query(
      `INSERT INTO users (
        name, email, phone, address, city, postal_code, country,
        company_name, tax_id, bank_account, role, is_active, notes, password_hash, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING id, name, email, phone, address, city, postal_code, country, 
                company_name, tax_id, bank_account, is_active, created_at`,
      [
        name,
        email,
        phone || null,
        address || null,
        city || null,
        postal_code || null,
        country || 'Guinée',
        company_name || null,
        tax_id || null,
        bank_account || null,
        'owner',
        true,
        notes || null,
        '', // Password hash vide pour les propriétaires
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Propriétaire créé avec succès',
      owner: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la création du propriétaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/owners/:id
 * Met à jour un propriétaire
 */
router.put('/:id', requireAuth, authorize(['admin']), validateOwner, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      city,
      postal_code,
      country,
      company_name,
      tax_id,
      bank_account,
      is_active,
      notes,
    } = req.body;

    // Vérifier que le propriétaire existe
    const ownerExists = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [id, 'owner']
    );

    if (ownerExists.rows.length === 0) {
      return res.status(404).json({ error: 'Propriétaire non trouvé' });
    }

    // Mettre à jour
    const result = await pool.query(
      `UPDATE users 
       SET name = $1, email = $2, phone = $3, address = $4, city = $5,
           postal_code = $6, country = $7, company_name = $8, tax_id = $9,
           bank_account = $10, is_active = $11, notes = $12, updated_at = NOW()
       WHERE id = $13
       RETURNING id, name, email, phone, address, city, postal_code, country,
                 company_name, tax_id, bank_account, is_active, created_at, updated_at`,
      [
        name,
        email,
        phone || null,
        address || null,
        city || null,
        postal_code || null,
        country || 'Guinée',
        company_name || null,
        tax_id || null,
        bank_account || null,
        is_active !== undefined ? is_active : true,
        notes || null,
        id,
      ]
    );

    res.json({
      message: 'Propriétaire mis à jour avec succès',
      owner: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du propriétaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/owners/:id
 * Supprime un propriétaire (archivage en fait)
 */
router.delete('/:id', requireAuth, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le propriétaire existe
    const ownerExists = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [id, 'owner']
    );

    if (ownerExists.rows.length === 0) {
      return res.status(404).json({ error: 'Propriétaire non trouvé' });
    }

    // Archiver au lieu de supprimer
    await pool.query('UPDATE users SET is_active = false WHERE id = $1', [id]);

    res.json({
      message: 'Propriétaire archivé avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du propriétaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/owners/:id/properties
 * Récupère toutes les propriétés d'un propriétaire
 */
router.get('/:id/properties', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        p.id, p.name, p.description, p.address, p.city, p.property_type, 
        p.total_area, p.year_built, p.number_of_units, p.status, p.created_at,
        (SELECT COUNT(*) FROM units WHERE property_id = p.id) as total_units,
        (SELECT COUNT(*) FROM units WHERE property_id = p.id AND status = 'rented') as rented_units
       FROM properties p
       WHERE p.owner_id = $1
       ORDER BY p.name ASC`,
      [id]
    );

    res.json({
      properties: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des propriétés:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

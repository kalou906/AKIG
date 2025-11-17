/**
 * Routes: units.js
 * Gestion complète des locaux/unités de location
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Middleware de validation
const validateUnit = [
  body('property_id').isInt({ min: 1 }).toInt().withMessage('ID propriété invalide'),
  body('unit_number').trim().notEmpty().withMessage('Le numéro du local est requis'),
  body('unit_type').isIn(['apartment', 'room', 'office', 'shop', 'warehouse', 'other']).withMessage('Type de local invalide'),
  body('floor_number').optional().isInt().toInt(),
  body('area').optional().isFloat({ min: 0 }).toFloat(),
  body('bedrooms').optional().isInt({ min: 0 }).toInt(),
  body('bathrooms').optional().isInt({ min: 0 }).toInt(),
  body('furnished').optional().isBoolean().toBoolean(),
  body('rent_amount').isFloat({ min: 0 }).toFloat().withMessage('Montant du loyer invalide'),
  body('deposit_amount').optional().isFloat({ min: 0 }).toFloat(),
  body('maintenance_fee').optional().isFloat({ min: 0 }).toFloat(),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/units
 * Récupère la liste des unités
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const {
      query = '',
      page = '1',
      pageSize = '20',
      property_id = '',
      status = 'all',
      unit_type = '',
    } = req.query;

    const pageNum = Math.max(1, Number(page));
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize)));
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = '1=1';
    const queryParams = [];

    if (query) {
      queryParams.push(`%${query}%`);
      whereClause += ` AND (u.unit_number ILIKE $${queryParams.length} OR p.name ILIKE $${queryParams.length})`;
    }

    if (property_id) {
      queryParams.push(Number(property_id));
      whereClause += ` AND u.property_id = $${queryParams.length}`;
    }

    if (status !== 'all') {
      queryParams.push(status);
      whereClause += ` AND u.status = $${queryParams.length}`;
    }

    if (unit_type) {
      queryParams.push(unit_type);
      whereClause += ` AND u.unit_type = $${queryParams.length}`;
    }

    // Récupérer le total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM units u JOIN properties p ON u.property_id = p.id WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].total);

    // Récupérer les unités
    queryParams.push(pageSizeNum);
    queryParams.push(offset);
    const result = await pool.query(
      `SELECT 
        u.id, u.unit_number, u.unit_type, u.floor_number, u.area, u.bedrooms, u.bathrooms,
        u.furnished, u.rent_amount, u.deposit_amount, u.maintenance_fee, u.status, u.created_at,
        p.id as property_id, p.name as property_name, p.address as property_address, p.city,
        (SELECT COUNT(*) FROM contracts WHERE unit_id = u.id AND status = 'active') as active_contracts
       FROM units u
       JOIN properties p ON u.property_id = p.id
       WHERE ${whereClause}
       ORDER BY p.name ASC, u.unit_number ASC
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
    console.error('Erreur lors de la récupération des unités:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/units/:id
 * Récupère les détails d'une unité
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer l'unité
    const unitResult = await pool.query(
      `SELECT u.*, p.id as property_id, p.name as property_name, p.address as property_address, p.city, p.owner_id
       FROM units u
       JOIN properties p ON u.property_id = p.id
       WHERE u.id = $1`,
      [id]
    );

    if (unitResult.rows.length === 0) {
      return res.status(404).json({ error: 'Unité non trouvée' });
    }

    const unit = unitResult.rows[0];

    // Récupérer le contrat actif s'il existe
    const contractResult = await pool.query(
      `SELECT c.id, c.start_date, c.end_date, c.monthly_rent, c.status,
              t.name as tenant_name, t.email as tenant_email, t.phone as tenant_phone
       FROM contracts c
       LEFT JOIN users t ON c.tenant_id = t.id
       WHERE c.unit_id = $1 AND c.status = 'active'
       LIMIT 1`,
      [id]
    );

    const activeContract = contractResult.rows[0] || null;

    // Récupérer les paiements récents
    const paymentsResult = await pool.query(
      `SELECT paid_at, amount, payment_method, status FROM payments
       WHERE contract_id IN (SELECT id FROM contracts WHERE unit_id = $1)
       ORDER BY paid_at DESC
       LIMIT 12`,
      [id]
    );

    res.json({
      unit,
      activeContract,
      recentPayments: paymentsResult.rows,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'unité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/units
 * Crée une nouvelle unité
 */
router.post('/', requireAuth, authorize(['admin', 'owner', 'manager']), validateUnit, handleValidationErrors, async (req, res) => {
  try {
    const {
      property_id,
      unit_number,
      unit_type,
      floor_number,
      area,
      bedrooms,
      bathrooms,
      furnished,
      rent_amount,
      deposit_amount,
      maintenance_fee,
      description,
      photo_url,
      amenities,
      notes,
    } = req.body;

    // Vérifier que la propriété existe
    const propExists = await pool.query('SELECT id FROM properties WHERE id = $1', [property_id]);
    if (propExists.rows.length === 0) {
      return res.status(404).json({ error: 'Propriété non trouvée' });
    }

    // Vérifier l'unicité unit_number par propriété
    const duplicateUnit = await pool.query(
      'SELECT id FROM units WHERE property_id = $1 AND unit_number = $2',
      [property_id, unit_number]
    );
    if (duplicateUnit.rows.length > 0) {
      return res.status(409).json({ error: 'Ce numéro d\'unité existe déjà dans cette propriété' });
    }

    const result = await pool.query(
      `INSERT INTO units (
        property_id, unit_number, unit_type, floor_number, area, bedrooms, bathrooms,
        furnished, rent_amount, deposit_amount, maintenance_fee, description, 
        photo_url, amenities, notes, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING id, unit_number, unit_type, rent_amount, deposit_amount, status, created_at`,
      [
        property_id,
        unit_number,
        unit_type,
        floor_number || null,
        area || null,
        bedrooms || null,
        bathrooms || null,
        furnished || false,
        rent_amount,
        deposit_amount || null,
        maintenance_fee || 0,
        description || null,
        photo_url || null,
        amenities ? JSON.stringify(amenities) : null,
        notes || null,
        'available',
      ]
    );

    res.status(201).json({
      message: 'Unité créée avec succès',
      unit: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'unité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/units/:id
 * Met à jour une unité
 */
router.put('/:id', requireAuth, validateUnit, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      unit_number,
      unit_type,
      floor_number,
      area,
      bedrooms,
      bathrooms,
      furnished,
      rent_amount,
      deposit_amount,
      maintenance_fee,
      description,
      photo_url,
      amenities,
      notes,
      status,
    } = req.body;

    // Vérifier que l'unité existe
    const unitExists = await pool.query('SELECT property_id FROM units WHERE id = $1', [id]);
    if (unitExists.rows.length === 0) {
      return res.status(404).json({ error: 'Unité non trouvée' });
    }

    const result = await pool.query(
      `UPDATE units 
       SET unit_number = $1, unit_type = $2, floor_number = $3, area = $4, bedrooms = $5,
           bathrooms = $6, furnished = $7, rent_amount = $8, deposit_amount = $9,
           maintenance_fee = $10, description = $11, photo_url = $12, amenities = $13,
           notes = $14, status = $15, updated_at = NOW()
       WHERE id = $16
       RETURNING id, unit_number, unit_type, rent_amount, status, updated_at`,
      [
        unit_number,
        unit_type,
        floor_number || null,
        area || null,
        bedrooms || null,
        bathrooms || null,
        furnished || false,
        rent_amount,
        deposit_amount || null,
        maintenance_fee || 0,
        description || null,
        photo_url || null,
        amenities ? JSON.stringify(amenities) : null,
        notes || null,
        status || 'available',
        id,
      ]
    );

    res.json({
      message: 'Unité mise à jour avec succès',
      unit: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'unité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/units/:id
 * Supprime une unité
 */
router.delete('/:id', requireAuth, authorize(['admin', 'owner']), async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier qu'il n'y a pas de contrats actifs
    const contracts = await pool.query(
      'SELECT id FROM contracts WHERE unit_id = $1 AND status = $2',
      [id, 'active']
    );

    if (contracts.rows.length > 0) {
      return res.status(409).json({ error: 'Impossible de supprimer une unité avec des contrats actifs' });
    }

    // Archiver au lieu de supprimer
    await pool.query('UPDATE units SET status = $1, updated_at = NOW() WHERE id = $2', ['archived', id]);

    res.json({
      message: 'Unité archivée avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'unité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

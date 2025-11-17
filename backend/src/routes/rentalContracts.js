/**
 * Routes: rentalContracts.js
 * Gestion complète des contrats de location
 */

const express = require('express');
const { validationResult, body } = require('express-validator');
const pool = require('../db');
const { requireAuth, authenticate, authorize } = require('../middleware/auth');
const logger = require('../services/logger');
const ReceiptGenerator = require('../services/receiptGenerator');

const router = express.Router();

// Middleware de validation
const validateRentalContract = [
  body('unit_id').isInt({ min: 1 }).toInt().withMessage('ID unité invalide'),
  body('tenant_id').isInt({ min: 1 }).toInt().withMessage('ID locataire invalide'),
  body('property_id').isInt({ min: 1 }).toInt().withMessage('ID propriété invalide'),
  body('start_date').isISO8601().withMessage('Date de début invalide'),
  body('end_date').isISO8601().withMessage('Date de fin invalide'),
  body('monthly_rent').isFloat({ min: 0 }).toFloat().withMessage('Loyer mensuel invalide'),
  body('deposit_amount').isFloat({ min: 0 }).toFloat().withMessage('Montant caution invalide'),
  body('payment_frequency').isIn(['monthly', 'quarterly', 'semi-annual', 'annual']).withMessage('Fréquence invalide'),
];

// Middleware to validate request
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/rental-contracts - List all rental contracts
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, owner_id, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT rc.*, 
             p.name as property_name,
             t.first_name as tenant_first_name, t.last_name as tenant_last_name,
             o.company_name, o.first_name as owner_first_name, o.last_name as owner_last_name
      FROM rental_contracts rc
      JOIN properties p ON rc.property_id = p.id
      JOIN tenants t ON rc.tenant_id = t.id
      JOIN owners o ON rc.owner_id = o.id
      WHERE o.user_id = $1
    `;
    let params = [req.user.id];

    if (search) {
      query += ` AND (p.name ILIKE $${params.length + 1} OR t.first_name ILIKE $${params.length + 1} OR t.last_name ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (owner_id) {
      query += ` AND rc.owner_id = $${params.length + 1}`;
      params.push(owner_id);
    }

    if (status) {
      query += ` AND rc.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY rc.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) FROM rental_contracts rc
      JOIN owners o ON rc.owner_id = o.id
      WHERE o.user_id = $1
    `;
    let countParams = [req.user.id];

    if (search) {
      countQuery += ` AND (rc.id::text LIKE $2)`;
      countParams.push(`%${search}%`);
    }

    if (owner_id) {
      countQuery += ` AND rc.owner_id = $${countParams.length + 1}`;
      countParams.push(owner_id);
    }

    if (status) {
      countQuery += ` AND rc.status = $${countParams.length + 1}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Error fetching rental contracts:', error);
    res.status(500).json({ success: false, message: 'Error fetching rental contracts' });
  }
});

/**
 * GET /api/rental-contracts/:id - Get specific rental contract
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rc.*,
              p.name as property_name, p.address as property_address,
              t.first_name as tenant_first_name, t.last_name as tenant_last_name, t.email as tenant_email,
              o.company_name, o.first_name as owner_first_name, o.last_name as owner_last_name
       FROM rental_contracts rc
       JOIN properties p ON rc.property_id = p.id
       JOIN tenants t ON rc.tenant_id = t.id
       JOIN owners o ON rc.owner_id = o.id
       WHERE rc.id = $1 AND o.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Rental contract not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching rental contract:', error);
    res.status(500).json({ success: false, message: 'Error fetching rental contract' });
  }
});

/**
 * POST /api/rental-contracts - Create new rental contract
 */
router.post(
  '/',
  authenticate,
  body('property_id').isInt().withMessage('Valid property ID required'),
  body('tenant_id').isInt().withMessage('Valid tenant ID required'),
  body('owner_id').isInt().withMessage('Valid owner ID required'),
  body('start_date').isISO8601().withMessage('Valid start date required'),
  body('monthly_rent').isFloat({ min: 0 }).withMessage('Valid monthly rent required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        property_id,
        tenant_id,
        owner_id,
        start_date,
        end_date,
        monthly_rent,
        deposit_amount,
        utilities_included,
        utilities_amount,
        parking_included,
        parking_amount,
        notes,
      } = req.body;

      // Verify owner belongs to user
      const ownerCheck = await pool.query('SELECT id FROM owners WHERE id = $1 AND user_id = $2', [owner_id, req.user.id]);
      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Owner not found or unauthorized' });
      }

      // Verify property belongs to owner
      const propertyCheck = await pool.query('SELECT id FROM properties WHERE id = $1 AND owner_id = $2', [property_id, owner_id]);
      if (propertyCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Property not found or unauthorized' });
      }

      const result = await pool.query(
        `INSERT INTO rental_contracts 
        (property_id, tenant_id, owner_id, start_date, end_date, monthly_rent, deposit_amount, utilities_included, utilities_amount, parking_included, parking_amount, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [property_id, tenant_id, owner_id, start_date, end_date, monthly_rent, deposit_amount, utilities_included, utilities_amount, parking_included, parking_amount, notes]
      );

      // Generate deposit receipt if deposit is provided
      if (deposit_amount && deposit_amount > 0) {
        try {
          await ReceiptService.generateDepositReceipt(result.rows[0].id, tenant_id, owner_id, deposit_amount);
        } catch (error) {
          logger.warn('Failed to generate deposit receipt:', error.message);
        }
      }

      logger.info(`Rental contract created: ${result.rows[0].id}`);
      res.status(201).json({ success: true, data: result.rows[0], message: 'Rental contract created successfully' });
    } catch (error) {
      logger.error('Error creating rental contract:', error);
      res.status(500).json({ success: false, message: 'Error creating rental contract' });
    }
  }
);

/**
 * PUT /api/rental-contracts/:id - Update rental contract
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    // Verify contract belongs to user
    const contractCheck = await pool.query(
      `SELECT rc.* FROM rental_contracts rc
       JOIN owners o ON rc.owner_id = o.id
       WHERE rc.id = $1 AND o.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (contractCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Rental contract not found' });
    }

    const { end_date, monthly_rent, utilities_included, utilities_amount, parking_included, parking_amount, status, notes } = req.body;

    const result = await pool.query(
      `UPDATE rental_contracts 
      SET end_date = COALESCE($1, end_date),
          monthly_rent = COALESCE($2, monthly_rent),
          utilities_included = COALESCE($3, utilities_included),
          utilities_amount = COALESCE($4, utilities_amount),
          parking_included = COALESCE($5, parking_included),
          parking_amount = COALESCE($6, parking_amount),
          status = COALESCE($7, status),
          notes = COALESCE($8, notes),
          updated_at = NOW()
      WHERE id = $9
      RETURNING *`,
      [end_date, monthly_rent, utilities_included, utilities_amount, parking_included, parking_amount, status, notes, req.params.id]
    );

    logger.info(`Rental contract updated: ${req.params.id}`);
    res.json({ success: true, data: result.rows[0], message: 'Rental contract updated successfully' });
  } catch (error) {
    logger.error('Error updating rental contract:', error);
    res.status(500).json({ success: false, message: 'Error updating rental contract' });
  }
});

/**
 * DELETE /api/rental-contracts/:id - Delete rental contract
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    // Verify contract belongs to user
    const contractCheck = await pool.query(
      `SELECT rc.id FROM rental_contracts rc
       JOIN owners o ON rc.owner_id = o.id
       WHERE rc.id = $1 AND o.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (contractCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Rental contract not found' });
    }

    await pool.query('DELETE FROM rental_contracts WHERE id = $1', [req.params.id]);

    logger.info(`Rental contract deleted: ${req.params.id}`);
    res.json({ success: true, message: 'Rental contract deleted successfully' });
  } catch (error) {
    logger.error('Error deleting rental contract:', error);
    res.status(500).json({ success: false, message: 'Error deleting rental contract' });
  }
});

module.exports = router;

/**
 * Routes: deposits.js
 * Gestion des dépôts de caution avec génération de reçus
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const ReceiptGenerator = require('../services/receiptGenerator');
const fs = require('fs');

// Middleware de validation
const validateDeposit = [
  body('contract_id').isInt({ min: 1 }).toInt().withMessage('ID contrat invalide'),
  body('tenant_id').isInt({ min: 1 }).toInt().withMessage('ID locataire invalide'),
  body('amount').isFloat({ min: 0 }).toFloat().withMessage('Montant invalide'),
  body('received_date').isISO8601().withMessage('Date invalide'),
  body('payment_method').isIn(['cash', 'bank_transfer', 'check', 'card', 'other']).withMessage('Méthode invalide'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/deposits
 * Récupère la liste des dépôts de caution
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const {
      query = '',
      page = '1',
      pageSize = '20',
      contract_id = '',
      status = 'all',
    } = req.query;

    const pageNum = Math.max(1, Number(page));
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize)));
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = '1=1';
    const queryParams = [];

    if (query) {
      queryParams.push(`%${query}%`);
      whereClause += ` AND (t.name ILIKE $${queryParams.length} OR d.receipt_number ILIKE $${queryParams.length})`;
    }

    if (contract_id) {
      queryParams.push(Number(contract_id));
      whereClause += ` AND d.contract_id = $${queryParams.length}`;
    }

    if (status !== 'all') {
      queryParams.push(status);
      whereClause += ` AND d.status = $${queryParams.length}`;
    }

    // Récupérer le total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM deposits d 
       LEFT JOIN users t ON d.tenant_id = t.id
       WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].total);

    // Récupérer les dépôts
    queryParams.push(pageSizeNum);
    queryParams.push(offset);
    const result = await pool.query(
      `SELECT 
        d.id, d.contract_id, d.tenant_id, d.amount, d.received_date, d.payment_method,
        d.status, d.receipt_number, d.reference_number, d.refund_date, d.refund_amount,
        t.name as tenant_name, t.email as tenant_email, t.phone as tenant_phone,
        c.start_date as contract_start, c.end_date as contract_end,
        u.unit_number
       FROM deposits d
       LEFT JOIN users t ON d.tenant_id = t.id
       LEFT JOIN contracts c ON d.contract_id = c.id
       LEFT JOIN units u ON c.unit_id = u.id
       WHERE ${whereClause}
       ORDER BY d.received_date DESC
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
    console.error('Erreur lors de la récupération des dépôts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/deposits/:id
 * Récupère les détails d'un dépôt
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const depositResult = await pool.query(
      `SELECT d.*, t.name as tenant_name, t.email as tenant_email, t.phone as tenant_phone,
              c.monthly_rent, prop.name as property_name, u.unit_number,
              o.name as owner_name, o.email as owner_email
       FROM deposits d
       LEFT JOIN users t ON d.tenant_id = t.id
       LEFT JOIN contracts c ON d.contract_id = c.id
       LEFT JOIN properties prop ON c.property_id = prop.id
       LEFT JOIN units u ON c.unit_id = u.id
       LEFT JOIN users o ON prop.owner_id = o.id
       WHERE d.id = $1`,
      [id]
    );

    if (depositResult.rows.length === 0) {
      return res.status(404).json({ error: 'Dépôt non trouvé' });
    }

    res.json({
      deposit: depositResult.rows[0],
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du dépôt:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/deposits
 * Crée un nouveau dépôt de caution et génère un reçu
 */
router.post('/', requireAuth, validateDeposit, handleValidationErrors, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      contract_id,
      tenant_id,
      amount,
      received_date,
      payment_method,
      reference_number,
      notes,
    } = req.body;

    // Vérifier que le contrat existe
    const contractResult = await client.query(
      'SELECT id, unit_id, property_id FROM contracts WHERE id = $1',
      [contract_id]
    );

    if (contractResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Contrat non trouvé' });
    }

    // Générer le numéro de reçu de caution
    const depositSeqResult = await client.query("SELECT NEXTVAL('deposit_receipt_seq') as seq");
    const sequenceNum = depositSeqResult.rows[0].seq;
    const year = new Date().getFullYear();
    const receiptNumber = `RC-${year}-${String(sequenceNum).padStart(6, '0')}`;

    // Créer le dépôt
    const depositResult = await client.query(
      `INSERT INTO deposits (
        contract_id, tenant_id, amount, received_date, payment_method,
        reference_number, receipt_number, status, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, contract_id, tenant_id, amount, received_date, receipt_number, status`,
      [
        contract_id,
        tenant_id,
        amount,
        received_date,
        payment_method,
        reference_number || null,
        receiptNumber,
        'held',
        notes || null,
      ]
    );

    const depositId = depositResult.rows[0].id;

    // Générer le PDF du reçu de caution
    try {
      const pdfPath = await ReceiptGenerator.generateDepositReceipt({
        receipt_number: receiptNumber,
        contract_id,
        tenant_id,
        amount,
        received_date,
        payment_method,
        reference_number,
      });

      // Mettre à jour le chemin du PDF (dans une colonne pdf_path si elle existe)
      // On peut la stocker dans une table séparée de reçus si nécessaire
    } catch (pdfError) {
      console.error('Erreur lors de la génération du PDF de caution:', pdfError);
      // Continuer sans le PDF
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Dépôt de caution enregistré et reçu généré avec succès',
      deposit: depositResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la création du dépôt:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/deposits/:id/refund
 * Enregistre le remboursement d'une caution
 */
router.put('/:id/refund', requireAuth, authorize(['admin', 'owner', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { refund_amount, refund_date, refund_reason, refund_method } = req.body;

    // Vérifier que le dépôt existe
    const depositExists = await pool.query('SELECT amount FROM deposits WHERE id = $1', [id]);

    if (depositExists.rows.length === 0) {
      return res.status(404).json({ error: 'Dépôt non trouvé' });
    }

    const depositAmount = depositExists.rows[0].amount;
    const actualRefundAmount = refund_amount || depositAmount;

    // Déterminer le nouveau statut
    let newStatus = 'held';
    if (actualRefundAmount >= depositAmount) {
      newStatus = 'refunded';
    } else if (actualRefundAmount > 0) {
      newStatus = 'partially_refunded';
    }

    const result = await pool.query(
      `UPDATE deposits 
       SET status = $1, refund_amount = $2, refund_date = $3, 
           refund_reason = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, status, refund_amount, refund_date`,
      [newStatus, actualRefundAmount, refund_date || new Date(), refund_reason || null, id]
    );

    res.json({
      message: 'Remboursement enregistré avec succès',
      deposit: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du remboursement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/deposits/:id/dispute
 * Marquer une caution comme contestée
 */
router.put('/:id/dispute', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { dispute_reason } = req.body;

    const result = await pool.query(
      `UPDATE deposits 
       SET status = 'disputed', notes = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, status`,
      [dispute_reason || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dépôt non trouvé' });
    }

    res.json({
      message: 'Caution marquée comme contestée',
      deposit: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

/**
 * Routes: arrears.js
 * Gestion des arriérés et dettes de loyers
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, authorize } = require('../middleware/auth');

/**
 * GET /api/arrears
 * Récupère la liste de tous les arriérés
 */
router.get('/', requireAuth, authorize(['admin', 'owner', 'manager']), async (req, res) => {
  try {
    const {
      page = '1',
      pageSize = '20',
      property_id = '',
      status = 'all',
      min_amount = '0',
    } = req.query;

    const pageNum = Math.max(1, Number(page));
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize)));
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = 'pr.balance > 0';
    const queryParams = [];

    if (property_id) {
      queryParams.push(Number(property_id));
      whereClause += ` AND pr.property_id = $${queryParams.length}`;
    }

    if (status !== 'all') {
      queryParams.push(status);
      whereClause += ` AND pr.status = $${queryParams.length}`;
    }

    if (min_amount && Number(min_amount) > 0) {
      queryParams.push(Number(min_amount));
      whereClause += ` AND pr.balance >= $${queryParams.length}`;
    }

    // Récupérer le total et montant total des arriérés
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total, 
              COALESCE(SUM(balance), 0) as total_arrears,
              COUNT(DISTINCT contract_id) as affected_contracts
       FROM payment_reports 
       WHERE ${whereClause}`,
      queryParams
    );

    const totals = totalResult.rows[0];

    // Récupérer les arriérés détaillés
    queryParams.push(pageSizeNum);
    queryParams.push(offset);
    const result = await pool.query(
      `SELECT 
        pr.id, pr.contract_id, pr.property_id, pr.tenant_id,
        pr.month, pr.year, pr.due_date, pr.amount_due, pr.amount_paid,
        pr.balance, pr.status, pr.payment_date,
        c.monthly_rent, t.name as tenant_name, t.email as tenant_email, t.phone as tenant_phone,
        u.unit_number, p.name as property_name,
        EXTRACT(DAY FROM NOW() - pr.due_date) as days_overdue,
        CASE 
          WHEN pr.status = 'overdue' THEN 'CRITIQUE'
          WHEN EXTRACT(DAY FROM NOW() - pr.due_date) > 90 THEN 'TRÈS GRAVE'
          WHEN EXTRACT(DAY FROM NOW() - pr.due_date) > 30 THEN 'GRAVE'
          ELSE 'MODÉRÉ'
        END as urgency_level
       FROM payment_reports pr
       LEFT JOIN contracts c ON pr.contract_id = c.id
       LEFT JOIN users t ON pr.tenant_id = t.id
       LEFT JOIN units u ON c.unit_id = u.id
       LEFT JOIN properties p ON pr.property_id = p.id
       WHERE ${whereClause}
       ORDER BY pr.balance DESC, pr.due_date ASC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    res.json({
      items: result.rows,
      summary: {
        total: parseInt(totals.total),
        totalArrears: parseFloat(totals.total_arrears),
        affectedContracts: parseInt(totals.affected_contracts),
        averageArrears:
          parseInt(totals.total) > 0
            ? parseFloat((totals.total_arrears / totals.total).toFixed(2))
            : 0,
      },
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(totals.total / pageSizeNum),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des arriérés:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/arrears/contract/:contractId
 * Récupère les arriérés pour un contrat spécifique
 */
router.get('/contract/:contractId', requireAuth, async (req, res) => {
  try {
    const { contractId } = req.params;

    const result = await pool.query(
      `SELECT 
        pr.*, c.monthly_rent, t.name as tenant_name, t.email, t.phone,
        u.unit_number, p.name as property_name,
        EXTRACT(DAY FROM NOW() - pr.due_date) as days_overdue,
        COALESCE(SUM(pr.balance) OVER (PARTITION BY pr.contract_id), 0) as total_arrears
       FROM payment_reports pr
       LEFT JOIN contracts c ON pr.contract_id = c.id
       LEFT JOIN users t ON pr.tenant_id = t.id
       LEFT JOIN units u ON c.unit_id = u.id
       LEFT JOIN properties p ON pr.property_id = p.id
       WHERE pr.contract_id = $1 AND pr.balance > 0
       ORDER BY pr.year DESC, pr.month DESC`,
      [contractId]
    );

    if (result.rows.length === 0) {
      return res.json({
        contract_id: contractId,
        arrears: [],
        totalArrears: 0,
        message: 'Aucun arriéré pour ce contrat',
      });
    }

    const totalArrears = result.rows.reduce((sum, row) => sum + parseFloat(row.balance), 0);

    res.json({
      contract_id: contractId,
      arrears: result.rows,
      totalArrears: parseFloat(totalArrears.toFixed(2)),
      affectedMonths: result.rows.length,
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/arrears/tenant/:tenantId
 * Récupère tous les arriérés d'un locataire
 */
router.get('/tenant/:tenantId', requireAuth, async (req, res) => {
  try {
    const { tenantId } = req.params;

    const result = await pool.query(
      `SELECT 
        pr.*, c.id as contract_id, c.monthly_rent,
        u.unit_number, p.name as property_name,
        EXTRACT(DAY FROM NOW() - pr.due_date) as days_overdue
       FROM payment_reports pr
       LEFT JOIN contracts c ON pr.contract_id = c.id
       LEFT JOIN units u ON c.unit_id = u.id
       LEFT JOIN properties p ON pr.property_id = p.id
       WHERE pr.tenant_id = $1 AND pr.balance > 0
       ORDER BY pr.year DESC, pr.month DESC`,
      [tenantId]
    );

    const totalArrears = result.rows.reduce((sum, row) => sum + parseFloat(row.balance), 0);

    res.json({
      tenant_id: tenantId,
      arrears: result.rows,
      totalArrears: parseFloat(totalArrears.toFixed(2)),
      affectedContracts: new Set(result.rows.map((r) => r.contract_id)).size,
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/arrears/:arrearsId/payment-plan
 * Crée un plan de paiement pour les arriérés
 */
router.post('/:arrearsId/payment-plan', requireAuth, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { arrearsId } = req.params;
    const { monthly_payment, start_date, duration_months } = req.body;

    // Récupérer l'arriéré
    const arrearsResult = await pool.query(
      `SELECT * FROM payment_reports WHERE id = $1`,
      [arrearsId]
    );

    if (arrearsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Arriéré non trouvé' });
    }

    const arrears = arrearsResult.rows[0];

    // Vérifier que le paiement mensuel est viable
    const totalPayment = monthly_payment * duration_months;
    if (totalPayment < arrears.balance) {
      return res.status(400).json({
        error: 'Le plan de paiement ne couvre pas la totalité de la dette',
        totalArrears: arrears.balance,
        proposedPayment: totalPayment,
      });
    }

    // Créer les enregistrements de plan de paiement
    const paymentPlan = [];
    let currentDate = new Date(start_date);

    for (let i = 0; i < duration_months; i++) {
      paymentPlan.push({
        arrearsId,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        amount: i === duration_months - 1 ? arrears.balance - monthly_payment * (duration_months - 1) : monthly_payment,
        dueDate: new Date(currentDate),
        status: 'pending',
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    res.json({
      message: 'Plan de paiement créé avec succès',
      originalArrears: arrears.balance,
      paymentPlan,
      totalMonths: duration_months,
      monthlyAmount: monthly_payment,
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/arrears/statistics
 * Statistiques globales sur les arriérés
 */
router.get('/statistics/overview', requireAuth, authorize(['admin', 'owner', 'manager']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_arrears,
        COUNT(DISTINCT contract_id) as affected_contracts,
        COUNT(DISTINCT tenant_id) as affected_tenants,
        COALESCE(SUM(balance), 0) as total_amount,
        COALESCE(AVG(balance), 0) as avg_arrears,
        MAX(balance) as max_arrears,
        EXTRACT(DAY FROM NOW() - MIN(due_date)) as oldest_overdue_days,
        COUNT(CASE WHEN EXTRACT(DAY FROM NOW() - due_date) > 90 THEN 1 END) as critical_count,
        COUNT(CASE WHEN EXTRACT(DAY FROM NOW() - due_date) > 30 AND EXTRACT(DAY FROM NOW() - due_date) <= 90 THEN 1 END) as serious_count,
        COUNT(CASE WHEN EXTRACT(DAY FROM NOW() - due_date) > 0 AND EXTRACT(DAY FROM NOW() - due_date) <= 30 THEN 1 END) as moderate_count
       FROM payment_reports 
       WHERE balance > 0`
    );

    res.json({
      overview: result.rows[0],
      criticalityBreakdown: {
        critical: parseFloat(result.rows[0].critical_count),
        serious: parseFloat(result.rows[0].serious_count),
        moderate: parseFloat(result.rows[0].moderate_count),
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

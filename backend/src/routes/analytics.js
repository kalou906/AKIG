/**
 * Routes: analytics.js
 * Rapports financiers, statistiques et KPIs
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, authorize } = require('../middleware/auth');
const { formatGNF } = require('../utils/currency');

/**
 * @openapi
 * /analytics/revenue:
 *   get:
 *     tags: [Analytics]
 *     summary: Get revenue analytics by period
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: property_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Revenue data with GNF formatting
 */
router.get('/revenue', requireAuth, async (req, res) => {
  try {
    const { startDate = '', endDate = '', property_id = '', owner_id = '' } = req.query;

    const startD = startDate || '2025-01-01';
    const endD = endDate || new Date().toISOString().split('T')[0];

    let whereClause = 'p.paid_at::date BETWEEN $1 AND $2';
    const queryParams = [startD, endD];

    if (property_id) {
      queryParams.push(Number(property_id));
      whereClause += ` AND c.property_id = $${queryParams.length}`;
    }

    if (owner_id) {
      queryParams.push(Number(owner_id));
      whereClause += ` AND prop.owner_id = $${queryParams.length}`;
    }

    // Revenus globaux
    const result = await pool.query(
      `SELECT 
        COUNT(*) as payment_count,
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(AVG(amount), 0) as avg_payment,
        MAX(amount) as max_payment,
        MIN(amount) as min_payment,
        COUNT(DISTINCT contract_id) as unique_contracts,
        COUNT(DISTINCT c.tenant_id) as unique_tenants,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments
       FROM payments p
       LEFT JOIN contracts c ON p.contract_id = c.id
       LEFT JOIN properties prop ON c.property_id = prop.id
       WHERE ${whereClause}`,
      queryParams
    );

    // Revenus par mois
    const monthlyResult = await pool.query(
      `SELECT 
        DATE_TRUNC('month', p.paid_at) as month,
        COALESCE(SUM(amount), 0) as revenue,
        COUNT(*) as transaction_count
       FROM payments p
       LEFT JOIN contracts c ON p.contract_id = c.id
       LEFT JOIN properties prop ON c.property_id = prop.id
       WHERE ${whereClause}
       GROUP BY DATE_TRUNC('month', p.paid_at)
       ORDER BY month DESC`,
      queryParams
    );

    // Revenus par propriété
    const propertyRevenueResult = await pool.query(
      `SELECT 
        prop.id, prop.name, 
        COALESCE(SUM(p.amount), 0) as revenue,
        COUNT(*) as payment_count,
        COUNT(DISTINCT c.tenant_id) as tenant_count
       FROM payments p
       LEFT JOIN contracts c ON p.contract_id = c.id
       LEFT JOIN properties prop ON c.property_id = prop.id
       WHERE ${whereClause}
       GROUP BY prop.id, prop.name
       ORDER BY revenue DESC`,
      queryParams
    );

    res.json({
      period: { start: startD, end: endD },
      summary: result.rows[0],
      monthlyRevenue: monthlyResult.rows,
      propertyRevenue: propertyRevenueResult.rows,
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @openapi
 * /analytics/occupancy:
 *   get:
 *     tags: [Analytics]
 *     summary: Get property occupancy rate
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: property_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Occupancy statistics
 */
router.get('/occupancy', requireAuth, async (req, res) => {
  try {
    const { property_id = '' } = req.query;

    let whereClause = '1=1';
    const queryParams = [];

    if (property_id) {
      queryParams.push(Number(property_id));
      whereClause += ` AND u.property_id = $${queryParams.length}`;
    }

    const result = await pool.query(
      `SELECT 
        p.id, p.name,
        COUNT(u.id) as total_units,
        COUNT(CASE WHEN u.status = 'rented' THEN 1 END) as rented_units,
        COUNT(CASE WHEN u.status = 'available' THEN 1 END) as available_units,
        ROUND(100.0 * COUNT(CASE WHEN u.status = 'rented' THEN 1 END) / COUNT(u.id), 2) as occupancy_rate,
        COUNT(DISTINCT c.tenant_id) as active_tenants,
        COALESCE(SUM(u.rent_amount), 0) as expected_monthly_revenue,
        COALESCE(SUM(CASE WHEN u.status = 'rented' THEN u.rent_amount ELSE 0 END), 0) as actual_monthly_revenue
       FROM properties p
       LEFT JOIN units u ON p.id = u.property_id
       LEFT JOIN contracts c ON u.id = c.unit_id AND c.status = 'active'
       WHERE ${whereClause}
       GROUP BY p.id, p.name
       ORDER BY occupancy_rate DESC`,
      queryParams
    );

    res.json({
      properties: result.rows,
      averageOccupancy:
        result.rows.length > 0
          ? (result.rows.reduce((sum, p) => sum + parseFloat(p.occupancy_rate), 0) / result.rows.length).toFixed(2)
          : 0,
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/analytics/payment-performance
 * Statistiques de performance des paiements
 */
router.get('/payment-performance', requireAuth, async (req, res) => {
  try {
    const { month = '', year = '' } = req.query;

    const currentDate = new Date();
    const queryMonth = month || currentDate.getMonth() + 1;
    const queryYear = year || currentDate.getFullYear();

    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_due,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'partial' THEN 1 END) as partial_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
        ROUND(100.0 * COUNT(CASE WHEN status = 'paid' THEN 1 END) / COUNT(*), 2) as payment_rate,
        COALESCE(SUM(amount_due), 0) as total_due_amount,
        COALESCE(SUM(amount_paid), 0) as total_paid_amount,
        COALESCE(SUM(balance), 0) as total_balance
       FROM payment_reports
       WHERE month = $1 AND year = $2`,
      [queryMonth, queryYear]
    );

    res.json({
      period: { month: queryMonth, year: queryYear },
      statistics: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/analytics/tenant-performance
 * Performance des locataires (paiements à temps)
 */
router.get('/tenant-performance', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        t.id, t.name, t.email,
        COUNT(DISTINCT c.id) as active_contracts,
        COUNT(pr.id) as total_payments_due,
        COUNT(CASE WHEN pr.status = 'paid' THEN 1 END) as on_time_payments,
        COUNT(CASE WHEN pr.status = 'overdue' THEN 1 END) as late_payments,
        ROUND(100.0 * COUNT(CASE WHEN pr.status = 'paid' THEN 1 END) / COUNT(pr.id), 2) as payment_rate,
        COALESCE(SUM(pr.balance), 0) as current_arrears,
        MAX(EXTRACT(DAY FROM NOW() - pr.due_date)) as max_days_overdue
       FROM users t
       LEFT JOIN contracts c ON t.id = c.tenant_id AND c.status = 'active'
       LEFT JOIN payment_reports pr ON c.id = pr.contract_id
       WHERE t.role = 'tenant'
       GROUP BY t.id, t.name, t.email
       ORDER BY payment_rate ASC, current_arrears DESC`
    );

    res.json({
      tenants: result.rows,
      topPerformers: result.rows.slice(0, 5),
      problematicTenants: result.rows.filter((t) => parseFloat(t.payment_rate) < 80),
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/analytics/owner-summary
 * Résumé pour un propriétaire
 */
router.get('/owner-summary/:ownerId', requireAuth, async (req, res) => {
  try {
    const { ownerId } = req.params;

    // Propriétés du propriétaire
    const propertiesResult = await pool.query(
      `SELECT COUNT(*) as total FROM properties WHERE owner_id = $1`,
      [ownerId]
    );

    // Unités totales
    const unitsResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'rented' THEN 1 END) as rented,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available
       FROM units u
       WHERE u.property_id IN (SELECT id FROM properties WHERE owner_id = $1)`,
      [ownerId]
    );

    // Revenus du propriétaire ce mois-ci
    const revenueResult = await pool.query(
      `SELECT 
        COALESCE(SUM(p.amount), 0) as revenue_this_month,
        COUNT(*) as payment_count,
        COALESCE(SUM(CASE WHEN pr.status = 'paid' THEN pr.amount_due ELSE 0 END), 0) as expected_revenue
       FROM payments p
       LEFT JOIN contracts c ON p.contract_id = c.id
       LEFT JOIN payment_reports pr ON c.id = pr.contract_id
       WHERE c.property_id IN (SELECT id FROM properties WHERE owner_id = $1)
       AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW())`,
      [ownerId]
    );

    // Arriérés du propriétaire
    const arrearResult = await pool.query(
      `SELECT COALESCE(SUM(balance), 0) as total_arrears
       FROM payment_reports
       WHERE contract_id IN (SELECT id FROM contracts WHERE property_id IN (SELECT id FROM properties WHERE owner_id = $1))
       AND balance > 0`,
      [ownerId]
    );

    res.json({
      summary: {
        properties: propertiesResult.rows[0],
        units: unitsResult.rows[0],
        revenue: revenueResult.rows[0],
        arrears: arrearResult.rows[0],
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/analytics/dashboard
 * Tableau de bord global
 */
router.get('/dashboard', requireAuth, authorize(['admin']), async (req, res) => {
  try {
    // Statistiques globales
    const globalStats = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM properties) as total_properties,
        (SELECT COUNT(*) FROM units) as total_units,
        (SELECT COUNT(*) FROM contracts WHERE status = 'active') as active_contracts,
        (SELECT COUNT(*) FROM users WHERE role = 'tenant') as total_tenants,
        (SELECT COUNT(*) FROM users WHERE role = 'owner') as total_owners
      `
    );

    // Revenue ce mois-ci
    const monthRevenue = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as revenue
       FROM payments
       WHERE DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', NOW())`
    );

    // Arriérés totaux
    const totalArrears = await pool.query(
      `SELECT COALESCE(SUM(balance), 0) as total FROM payment_reports WHERE balance > 0`
    );

    // Taux de collecte
    const collectionRate = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
        COUNT(*) as total
       FROM payment_reports
       WHERE DATE_TRUNC('month', due_date) = DATE_TRUNC('month', NOW())`
    );

    // Propriétés par performance
    const topProperties = await pool.query(
      `SELECT 
        p.id, p.name,
        COALESCE(SUM(payments.amount), 0) as revenue,
        COUNT(DISTINCT c.tenant_id) as tenants
       FROM properties p
       LEFT JOIN contracts c ON p.id = c.property_id AND c.status = 'active'
       LEFT JOIN payments ON c.id = payments.contract_id AND DATE_TRUNC('month', payments.paid_at) = DATE_TRUNC('month', NOW())
       GROUP BY p.id, p.name
       ORDER BY revenue DESC
       LIMIT 5`
    );

    res.json({
      timestamp: new Date(),
      statistics: globalStats.rows[0],
      monthRevenue: monthRevenue.rows[0],
      arrears: totalArrears.rows[0],
      collectionRate: collectionRate.rows[0],
      topProperties: topProperties.rows,
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

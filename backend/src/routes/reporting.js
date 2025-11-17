// ============================================================================
// src/routes/reporting.js - Reporting financier multi-périodes
// ============================================================================

const express = require('express');
const { requireRole, authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/reporting/finance?agency_id=1&range=1m|3m|6m|12m
 * Reporting financier sur périodes: 1 mois, 3 mois, 6 mois, 1 année
 * Inclut: revenus, coûts (salaires, frais, maintenance), net
 * Rôles: MANAGER, ADMIN, COMPTABLE
 */
router.get('/finance', authMiddleware, requireRole('MANAGER', 'ADMIN', 'COMPTABLE'), async (req, res) => {
  const pool = req.app.get('pool');
  const { agency_id, range = '1m' } = req.query;

  try {
    if (!agency_id) {
      return res.status(400).json({ error: 'agency_id required' });
    }

    const ranges = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 };
    const months = ranges[range] || 1;

    // Calculer période
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);

    // Query 1: Revenus (paiements confirmés)
    const incomeQuery = `
      SELECT 
        SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END) as total_income,
        COUNT(CASE WHEN p.status = 'PAID' THEN 1 END) as payment_count,
        COUNT(CASE WHEN p.status = 'LATE' THEN 1 END) as late_count,
        COUNT(CASE WHEN p.status = 'PARTIAL' THEN 1 END) as partial_count
      FROM payments p
      WHERE p.paid_date >= $1 AND p.paid_date <= $2
        AND p.contract_id IN (
          SELECT id FROM contracts
          WHERE property_id IN (
            SELECT id FROM properties WHERE agency_id = $3
          )
        )
    `;

    const incomeResult = await pool.query(incomeQuery, [startStr, endStr, agency_id]);

    // Query 2: Coûts (frais de gestion, salaires, maintenance)
    const costsQuery = `
      SELECT 
        SUM(COALESCE(management_fee, 0)) as total_management_fee,
        SUM(COALESCE(salaries, 0)) as total_salaries,
        SUM(COALESCE(maintenance_cost, 0)) as total_maintenance,
        SUM(COALESCE(utilities, 0)) as total_utilities,
        SUM(COALESCE(other_costs, 0)) as total_other_costs,
        SUM(COALESCE(management_fee, 0) + COALESCE(salaries, 0) + COALESCE(maintenance_cost, 0) + COALESCE(utilities, 0) + COALESCE(other_costs, 0)) as total_costs,
        COUNT(*) as cost_records
      FROM agency_costs
      WHERE agency_id = $1 AND month >= $2
    `;

    const costsResult = await pool.query(costsQuery, [agency_id, startStr]);

    // Calculs
    const income = incomeResult.rows[0];
    const costs = costsResult.rows[0];

    const totalIncome = Number(income.total_income || 0);
    const totalMgmtFee = Number(costs.total_management_fee || 0);
    const totalSalaries = Number(costs.total_salaries || 0);
    const totalMaintenance = Number(costs.total_maintenance || 0);
    const totalUtilities = Number(costs.total_utilities || 0);
    const totalOtherCosts = Number(costs.total_other_costs || 0);
    const totalCosts = Number(costs.total_costs || 0);

    const net = totalIncome - totalCosts;

    res.json({
      period: {
        range,
        months,
        start_date: startStr,
        end_date: endStr
      },
      income: {
        total: totalIncome,
        payment_count: income.payment_count || 0,
        late_count: income.late_count || 0,
        partial_count: income.partial_count || 0
      },
      costs: {
        management_fee: totalMgmtFee,
        salaries: totalSalaries,
        maintenance: totalMaintenance,
        utilities: totalUtilities,
        other_costs: totalOtherCosts,
        total: totalCosts
      },
      summary: {
        total_income: totalIncome,
        total_costs: totalCosts,
        net_revenue: net,
        margin_percent: totalIncome > 0 ? Math.round((net / totalIncome) * 100) : 0
      }
    });
  } catch (err) {
    console.error('[REPORTING] Finance error:', err.message);
    res.status(500).json({ error: 'Failed to generate finance report', details: err.message });
  }
});

/**
 * GET /api/reporting/agent-performance?agency_id=1
 * Performance des agents: encaissements, délais, taux réussite
 * Rôles: MANAGER, ADMIN
 */
router.get('/agent-performance', authMiddleware, requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  const pool = req.app.get('pool');
  const { agency_id } = req.query;

  try {
    if (!agency_id) {
      return res.status(400).json({ error: 'agency_id required' });
    }

    const query = `
      SELECT 
        a.id,
        u.name as agent_name,
        u.email,
        COALESCE(SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END), 0) as total_collected,
        COUNT(CASE WHEN p.status = 'PAID' THEN 1 END) as payments_ok,
        COUNT(CASE WHEN p.status = 'LATE' THEN 1 END) as late_count,
        COUNT(CASE WHEN p.status = 'PARTIAL' THEN 1 END) as partial_count,
        ROUND(
          COUNT(CASE WHEN p.status = 'PAID' THEN 1 END)::float 
          / NULLIF(COUNT(p.id), 0) * 100
        )::int as success_rate_percent,
        a.score,
        a.goals
      FROM agents a
      JOIN users u ON u.id = a.user_id
      LEFT JOIN properties pr ON pr.agency_id = $1
      LEFT JOIN contracts c ON c.property_id = pr.id
      LEFT JOIN payments p ON p.contract_id = c.id AND p.paid_date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE a.active = true AND u.agency_id = $1
      GROUP BY a.id, u.name, u.email, a.score, a.goals
      ORDER BY total_collected DESC
    `;

    const result = await pool.query(query, [agency_id]);

    res.json({
      count: result.rowCount,
      agents: result.rows.map(r => ({
        ...r,
        total_collected: Number(r.total_collected),
        goals: r.goals || { monthly_target: 0 }
      }))
    });
  } catch (err) {
    console.error('[REPORTING] Agent performance error:', err.message);
    res.status(500).json({ error: 'Failed to generate agent report', details: err.message });
  }
});

/**
 * GET /api/reporting/tenant-payments?agency_id=1&tenant_id=5
 * Détail paiements locataire: calendrier, retards, montants, moyens
 * Rôles: AGENT, MANAGER, COMPTABLE
 */
router.get('/tenant-payments', authMiddleware, requireRole('AGENT', 'MANAGER', 'COMPTABLE'), async (req, res) => {
  const pool = req.app.get('pool');
  const { tenant_id, agency_id } = req.query;

  try {
    if (!tenant_id || !agency_id) {
      return res.status(400).json({ error: 'tenant_id and agency_id required' });
    }

    const query = `
      SELECT 
        p.id,
        p.due_date,
        p.paid_date,
        p.amount,
        p.method,
        p.status,
        p.ref,
        p.notes,
        c.monthly_rent,
        pr.quartier,
        pr.address,
        CASE WHEN p.paid_date > p.due_date 
             THEN EXTRACT(DAY FROM p.paid_date - p.due_date)
             ELSE 0 
        END as days_late
      FROM payments p
      JOIN contracts c ON c.id = p.contract_id
      JOIN properties pr ON pr.id = c.property_id
      WHERE c.tenant_id = $1 AND pr.agency_id = $2
      ORDER BY p.due_date DESC
      LIMIT 50
    `;

    const result = await pool.query(query, [tenant_id, agency_id]);

    // Statistiques
    const totalPayments = result.rowCount;
    const paidCount = result.rows.filter(r => r.status === 'PAID').length;
    const lateCount = result.rows.filter(r => r.status === 'LATE').length;
    const partialCount = result.rows.filter(r => r.status === 'PARTIAL').length;
    const totalAmount = result.rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    res.json({
      tenant_id,
      statistics: {
        total_payments: totalPayments,
        paid_count: paidCount,
        late_count: lateCount,
        partial_count: partialCount,
        reliability_percent: totalPayments > 0 ? Math.round((paidCount / totalPayments) * 100) : 0,
        total_amount: totalAmount
      },
      payments: result.rows.map(r => ({
        ...r,
        amount: Number(r.amount),
        monthly_rent: Number(r.monthly_rent)
      }))
    });
  } catch (err) {
    console.error('[REPORTING] Tenant payments error:', err.message);
    res.status(500).json({ error: 'Failed to generate tenant report', details: err.message });
  }
});

/**
 * GET /api/reporting/agency-monthly
 * Vue mensuelle consolidée: revenus vs coûts vs net
 * Rôles: MANAGER, ADMIN, COMPTABLE
 */
router.get('/agency-monthly', authMiddleware, requireRole('MANAGER', 'ADMIN', 'COMPTABLE'), async (req, res) => {
  const pool = req.app.get('pool');
  const { agency_id } = req.query;

  try {
    if (!agency_id) {
      return res.status(400).json({ error: 'agency_id required' });
    }

    const query = `
      SELECT 
        DATE_TRUNC('month', p.paid_date)::date as month,
        COUNT(p.id) as payment_count,
        SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END)::bigint as revenue,
        COALESCE((SELECT SUM(management_fee + salaries + maintenance_cost + utilities + other_costs)
                  FROM agency_costs ac
                  WHERE ac.agency_id = $1 
                    AND ac.month = DATE_TRUNC('month', p.paid_date)::date), 0)::bigint as costs,
        SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END)::bigint
        - COALESCE((SELECT SUM(management_fee + salaries + maintenance_cost + utilities + other_costs)
                    FROM agency_costs ac
                    WHERE ac.agency_id = $1 
                      AND ac.month = DATE_TRUNC('month', p.paid_date)::date), 0)::bigint as net
      FROM payments p
      WHERE p.contract_id IN (
        SELECT id FROM contracts WHERE property_id IN (
          SELECT id FROM properties WHERE agency_id = $1
        )
      )
      AND p.paid_date IS NOT NULL
      GROUP BY DATE_TRUNC('month', p.paid_date)::date
      ORDER BY month DESC
      LIMIT 24
    `;

    const result = await pool.query(query, [agency_id]);

    res.json({
      agency_id,
      months: result.rows
    });
  } catch (err) {
    console.error('[REPORTING] Agency monthly error:', err.message);
    res.status(500).json({ error: 'Failed to generate monthly report', details: err.message });
  }
});

module.exports = router;

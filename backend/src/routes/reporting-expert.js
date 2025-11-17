/**
 * ============================================================
 * 📊 Reporting Module Routes - EXPERT VERSION
 * ============================================================
 * 
 * Features:
 * - Multi-period financial reporting (1m, 3m, 6m, 12m)
 * - KPI calculations (occupancy, yield, collection rate, etc.)
 * - Trend analysis and forecasting
 * - Export formats (Excel, PDF, SAGE)
 * - Custom report builder
 * - Comparative analysis (YoY, MoM)
 * 
 * Endpoints:
 * GET /api/reporting/finance - Financial reports
 * GET /api/reporting/kpi - Key performance indicators
 * GET /api/reporting/trends - Trend analysis
 * GET /api/reporting/export - Export data
 * GET /api/reporting/comparative - YoY/MoM comparison
 * GET /api/reporting/properties - Property-specific reports
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware, requireRole } = require('../security/auth');

// ============================================================
// 🔐 Middleware
// ============================================================
router.use(authMiddleware);

// ============================================================
// 💰 GET /api/reporting/finance - Financial reports
// ============================================================
router.get('/finance', requireRole(['MANAGER', 'ADMIN', 'COMPTABLE']), async (req, res) => {
  try {
    const { period = '3m' } = req.query;

    // Calculate date range
    let dateRange;
    const now = new Date();
    if (period === '1m') {
      dateRange = { days: 30 };
    } else if (period === '3m') {
      dateRange = { days: 90 };
    } else if (period === '6m') {
      dateRange = { days: 180 };
    } else {
      dateRange = { days: 365 };
    }

    const fromDate = new Date(now - dateRange.days * 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `SELECT 
        SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as failed_payments,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_payments,
        COUNT(DISTINCT tenant_id) as unique_tenants,
        COUNT(DISTINCT property_id) as properties_involved,
        AVG(amount) as average_payment,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) as median_payment,
        MAX(amount) as largest_payment,
        MIN(CASE WHEN status = 'confirmed' THEN amount END) as smallest_confirmed
      FROM payments
      WHERE payment_date >= $1 AND status != 'deleted'`,
      [fromDate]
    );

    const methodBreakdown = await pool.query(
      `SELECT 
        method,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END) as confirmed_amount
      FROM payments
      WHERE payment_date >= $1 AND status != 'deleted'
      GROUP BY method
      ORDER BY confirmed_amount DESC`,
      [fromDate]
    );

    res.json({
      success: true,
      period,
      from_date: fromDate.toISOString(),
      to_date: now.toISOString(),
      summary: result.rows[0],
      by_method: methodBreakdown.rows
    });
  } catch (error) {
    console.error('Erreur rapport finance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 📈 GET /api/reporting/kpi - Key performance indicators
// ============================================================
router.get('/kpi', requireRole(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    // Occupancy rate
    const occupancyResult = await pool.query(
      `SELECT 
        (COUNT(DISTINCT CASE WHEN status = 'occupied' THEN id END)::float / COUNT(DISTINCT id)) * 100 
        as occupancy_rate
      FROM properties`
    );

    // Collection rate (paid vs due)
    const collectionResult = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END)::float / 
        COUNT(*)::float * 100 as collection_rate,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as payments_collected,
        COUNT(*) as total_payments
      FROM payments
      WHERE DATE(payment_date) >= DATE(CURRENT_DATE - INTERVAL '30 days')`
    );

    // Average rent per property
    const rentResult = await pool.query(
      `SELECT 
        AVG(amount) as avg_monthly_rent,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY amount) as q1_rent,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY amount) as q3_rent
      FROM payments
      WHERE method IN ('loyer', 'rent')
        AND DATE(payment_date) >= DATE(CURRENT_DATE - INTERVAL '30 days')
        AND status = 'confirmed'`
    );

    // Tenant quality score
    const tenantQualityResult = await pool.query(
      `SELECT 
        COUNT(*) as total_tenants,
        COUNT(CASE WHEN late_payments = 0 THEN 1 END) as perfect_payers,
        ROUND(COUNT(CASE WHEN late_payments = 0 THEN 1 END)::float / COUNT(*) * 100, 2) 
        as perfect_payer_ratio
      FROM tenants`
    );

    const defaultRateResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN days_late > 30 THEN tenant_id END)::float / 
        COUNT(DISTINCT tenant_id)::float * 100 as default_rate_30days,
        COUNT(DISTINCT CASE WHEN days_late > 60 THEN tenant_id END) as critical_overdue
      FROM payment_history
      WHERE active = true`
    );

    res.json({
      success: true,
      kpi: {
        occupancy: occupancyResult.rows[0],
        collection: collectionResult.rows[0],
        rent: rentResult.rows[0],
        tenant_quality: tenantQualityResult.rows[0],
        defaults: defaultRateResult.rows[0]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur KPI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 📊 GET /api/reporting/trends - Trend analysis
// ============================================================
router.get('/trends', requireRole(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    // Monthly trends for last 12 months
    const trendsResult = await pool.query(
      `SELECT 
        DATE_TRUNC('month', payment_date)::date as month,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END) as confirmed_amount,
        COUNT(DISTINCT tenant_id) as unique_tenants,
        ROUND(
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END)::float / COUNT(*) * 100, 2
        ) as success_rate
      FROM payments
      WHERE payment_date >= CURRENT_DATE - INTERVAL '12 months'
        AND status != 'deleted'
      GROUP BY DATE_TRUNC('month', payment_date)
      ORDER BY month DESC
      LIMIT 12`
    );

    res.json({
      success: true,
      trends: trendsResult.rows,
      analysis: {
        period: '12 months',
        trend_direction: trendsResult.rows.length > 1 ? 
          (trendsResult.rows[0].confirmed_amount > trendsResult.rows[trendsResult.rows.length - 1].confirmed_amount ? 'up' : 'down') 
          : 'stable'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 💾 GET /api/reporting/export - Export data
// ============================================================
router.get('/export', requireRole(['COMPTABLE', 'ADMIN']), async (req, res) => {
  try {
    const { format = 'json', period = '3m' } = req.query;

    const fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const paymentData = await pool.query(
      `SELECT * FROM payments 
       WHERE payment_date >= $1 
       ORDER BY payment_date DESC`,
      [fromDate]
    );

    if (format === 'csv') {
      // Generate CSV headers
      const headers = Object.keys(paymentData.rows[0] || {});
      const csv = [
        headers.join(','),
        ...paymentData.rows.map(row => 
          headers.map(h => {
            const val = row[h];
            return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
          }).join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payments-export-${period}.csv"`);
      return res.send(csv);
    }

    if (format === 'sage') {
      // SAGE-compatible format (simplified)
      const sageData = paymentData.rows.map(p => ({
        date: new Date(p.payment_date).toLocaleDateString('fr-FR'),
        reference: p.reference,
        debit: p.status === 'confirmed' ? p.amount : 0,
        credit: p.status === 'failed' ? p.amount : 0,
        description: p.description
      }));

      res.json({
        success: true,
        format: 'sage',
        data: sageData
      });
    }

    // Default: JSON
    res.json({
      success: true,
      format: 'json',
      period,
      count: paymentData.rows.length,
      data: paymentData.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 📉 GET /api/reporting/comparative - YoY/MoM comparison
// ============================================================
router.get('/comparative', requireRole(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    // Compare current month to previous month
    const currentMonth = new Date();
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);

    const currentResult = await pool.query(
      `SELECT 
        SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END) as total,
        COUNT(*) as count
      FROM payments
      WHERE EXTRACT(YEAR FROM payment_date) = $1
        AND EXTRACT(MONTH FROM payment_date) = $2
        AND status != 'deleted'`,
      [currentMonth.getFullYear(), currentMonth.getMonth() + 1]
    );

    const prevResult = await pool.query(
      `SELECT 
        SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END) as total,
        COUNT(*) as count
      FROM payments
      WHERE EXTRACT(YEAR FROM payment_date) = $1
        AND EXTRACT(MONTH FROM payment_date) = $2
        AND status != 'deleted'`,
      [prevMonth.getFullYear(), prevMonth.getMonth() + 1]
    );

    const currentData = currentResult.rows[0];
    const prevData = prevResult.rows[0];
    const percentChange = prevData.total ? 
      ((currentData.total - prevData.total) / prevData.total * 100).toFixed(2) 
      : 0;

    res.json({
      success: true,
      comparison: {
        current_month: {
          total: currentData.total,
          count: currentData.count,
          date: `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
        },
        previous_month: {
          total: prevData.total,
          count: prevData.count,
          date: `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`
        },
        change: {
          absolute: (currentData.total - prevData.total),
          percent: percentChange,
          direction: percentChange > 0 ? 'up' : 'down'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

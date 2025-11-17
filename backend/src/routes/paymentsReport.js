/**
 * Payments Reporting API Routes
 * Reports and queries on payment data with various groupings and filters
 */

const express = require('express');

const router = express.Router();

/**
 * GET /api/reports/payments/by-owner-site
 * Get payment summary grouped by owner and site
 *
 * Query Parameters:
 *   - year: optional number (if provided, filters to that year)
 *
 * Response:
 * [
 *   {
 *     "owner": "Owner Name",
 *     "site": "Site Name",
 *     "payments_count": 50,
 *     "total_paid": 2500000
 *   }
 * ]
 */
router.get('/payments/by-owner-site', async (req, res) => {
  try {
    const pool = req.app.get('pool');
    if (!pool) {
      return res.status(500).json({
        error: 'DB_NOT_AVAILABLE',
        message: 'Database connection not available',
      });
    }

    const { year } = req.query;

    let yearCond = '';
    let args = [];

    if (year) {
      yearCond = `AND date_part('year', p.paid_at) = $1`;
      args = [Number(year)];
    }

    const result = await pool.query(
      `
      SELECT o.name as owner, s.name as site,
             COUNT(*) as payments_count,
             COALESCE(SUM(p.amount),0) as total_paid
      FROM payments p
      LEFT JOIN owners o ON p.owner_id=o.id
      LEFT JOIN sites s ON p.site_id=s.id
      WHERE 1=1 ${yearCond}
      GROUP BY o.name, s.name
      ORDER BY o.name, s.name
      `,
      args
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Payment report error:', error);
    res.status(500).json({
      error: 'QUERY_FAILED',
      message: error instanceof Error ? error.message : 'Failed to generate payment report',
    });
  }
});

/**
 * GET /api/contracts/:id/payments
 * Get all payments for a specific contract
 *
 * Path Parameters:
 *   - id: contract ID
 *
 * Query Parameters:
 *   - year: optional number (if provided, filters to that year)
 *
 * Response:
 * [
 *   {
 *     "paid_at": "2024-01-15T00:00:00Z",
 *     "amount": 500000,
 *     "mode": "cash",
 *     "allocation": "loyer T3 2024",
 *     "channel": "guichet",
 *     "comment": "Payment for January"
 *   }
 * ]
 */
router.get('/:id/payments', async (req, res) => {
  try {
    const pool = req.app.get('pool');
    if (!pool) {
      return res.status(500).json({
        error: 'DB_NOT_AVAILABLE',
        message: 'Database connection not available',
      });
    }

    const { id } = req.params;
    const { year } = req.query;

    const contractId = Number(id);
    if (!contractId) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Invalid contract ID',
      });
    }

    let yearCond = '';
    let args = [contractId];

    if (year) {
      yearCond = `AND date_part('year', paid_at)=$2`;
      args.push(Number(year));
    }

    const result = await pool.query(
      `
      SELECT paid_at, amount, mode, allocation, channel, comment
      FROM payments 
      WHERE contract_id=$1 ${yearCond}
      ORDER BY paid_at DESC
      `,
      args
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get contract payments error:', error);
    res.status(500).json({
      error: 'QUERY_FAILED',
      message: error instanceof Error ? error.message : 'Failed to retrieve contract payments',
    });
  }
});

/**
 * GET /api/contracts/:id/status
 * Get yearly payment status snapshot for a contract
 *
 * Path Parameters:
 *   - id: contract ID
 *
 * Response: Array of payment_status_year rows
 * [
 *   {
 *     "contract_id": 123,
 *     "year": 2024,
 *     "period_from": "2024-01-01T00:00:00Z",
 *     "period_to": "2024-12-31T00:00:00Z",
 *     "due_amount": 6000000,
 *     "paid_amount": 4500000,
 *     "arrears_amount": 1500000,
 *     "arrears_months": 3,
 *     "pressure_level": "pressure",
 *     "last_update": "2024-01-15T10:00:00Z"
 *   }
 * ]
 */
router.get('/:id/status', async (req, res) => {
  try {
    const pool = req.app.get('pool');
    if (!pool) {
      return res.status(500).json({
        error: 'DB_NOT_AVAILABLE',
        message: 'Database connection not available',
      });
    }

    const { id } = req.params;

    const contractId = Number(id);
    if (!contractId) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Invalid contract ID',
      });
    }

    const result = await pool.query(
      `SELECT * FROM payment_status_year WHERE contract_id=$1 ORDER BY year DESC`,
      [contractId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get contract status error:', error);
    res.status(500).json({
      error: 'QUERY_FAILED',
      message: error instanceof Error ? error.message : 'Failed to retrieve contract status',
    });
  }
});

module.exports = router;

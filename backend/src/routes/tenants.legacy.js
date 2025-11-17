/**
 * Tenants API Routes
 * Lists tenants with payment status, filtering, and pagination
 * Supports year-based filtering for multi-year payment status
 */

const express = require('express');

const router = express.Router();

/**
 * GET /api/tenants
 * List all tenants with payment status and arrears information
 *
 * Query Parameters:
 *   - query: string (searches tenant name and phone)
 *   - page: number (default: 1)
 *   - pageSize: number (default: 20, max: 100)
 *   - site: string (filter by site name)
 *   - owner: string (filter by owner name)
 *   - status: string (filter by contract status: active, terminated, etc.)
 *   - year: number (optional - filters payment status to specific year, default: current year)
 *
 * Response:
 * {
 *   "items": [
 *     {
 *       "id": 1,
 *       "full_name": "John Doe",
 *       "phone": "+224612345678",
 *       "site": "Site A",
 *       "owner": "Owner Name",
 *       "contract_id": 123,
 *       "monthly_rent": 500000,
 *       "periodicity": "monthly",
 *       "frequency_note": null,
 *       "arrears_amount": 1500000,
 *       "arrears_months": 3,
 *       "pressure_level": "pressure",
 *       "status": "active"
 *     }
 *   ],
 *   "total": 150
 * }
 */
router.get('/', async (req, res) => {
  try {
    const pool = req.app.get('pool');
    if (!pool) {
      return res.status(500).json({
        error: 'DB_NOT_AVAILABLE',
        message: 'Database connection not available',
      });
    }

    const {
      query = '',
      page = '1',
      pageSize = '20',
      site = '',
      owner = '',
      status = '',
      year = '',
    } = req.query;

    // Validation
    const pageNum = Math.max(1, Number(page));
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize)));
    const offset = (pageNum - 1) * pageSizeNum;

    // Build WHERE conditions
    const where = [];
    const args = [];

    if (query) {
      args.push(`%${query}%`);
      where.push(`(t.full_name ILIKE $${args.length} OR t.phone ILIKE $${args.length})`);
    }

    if (site) {
      args.push(site);
      where.push(`s.name = $${args.length}`);
    }

    if (owner) {
      args.push(owner);
      where.push(`o.name = $${args.length}`);
    }

    if (status) {
      args.push(status);
      where.push(`c.status = $${args.length}`);
    }

    // Year filter for payment_status_year
    let yearJoin = '';
    if (year) {
      args.push(Number(year));
      yearJoin = `LEFT JOIN payment_status_year psy ON psy.contract_id = c.id AND psy.year = $${args.length}`;
    } else {
      yearJoin = `LEFT JOIN payment_status_year psy ON psy.contract_id = c.id AND psy.year = EXTRACT(YEAR FROM NOW())::INT`;
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // Main data query
    const sql = `
      SELECT t.id, t.full_name, t.phone, s.name as site, o.name as owner,
             c.id as contract_id, c.monthly_rent, c.periodicity, c.frequency_note,
             COALESCE(psy.arrears_amount,0) as arrears_amount,
             COALESCE(psy.arrears_months,0) as arrears_months,
             COALESCE(psy.pressure_level,'none') as pressure_level,
             c.status
      FROM tenants t
      LEFT JOIN sites s ON t.current_site_id = s.id
      LEFT JOIN owners o ON s.owner_id = o.id
      LEFT JOIN contracts c ON c.tenant_id = t.id AND c.site_id = s.id
      ${yearJoin}
      ${whereSql}
      ORDER BY o.name, s.name, t.full_name
      LIMIT $${args.length + 1} OFFSET $${args.length + 2}
    `;

    // Count query (for total)
    const countSql = `
      SELECT COUNT(*) as total
      FROM tenants t
      LEFT JOIN sites s ON t.current_site_id = s.id
      LEFT JOIN owners o ON s.owner_id = o.id
      LEFT JOIN contracts c ON c.tenant_id = t.id AND c.site_id = s.id
      ${whereSql}
    `;

    // Execute both queries
    const [dataResult, countResult] = await Promise.all([
      pool.query(sql, [...args, pageSizeNum, offset]),
      pool.query(countSql, args),
    ]);

    res.json({
      items: dataResult.rows,
      total: Number(countResult.rows[0]?.total || 0),
      page: pageNum,
      pageSize: pageSizeNum,
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      error: 'QUERY_FAILED',
      message: error instanceof Error ? error.message : 'Failed to retrieve tenants',
    });
  }
});

module.exports = router;

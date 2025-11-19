/**
 * AKIG - Consolidated Tenants Route
 * All tenant operations: CRUD + Advanced features
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

// =========================================
// GET /api/tenants - List all tenants
// =========================================
router.get('/', requireAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, property_id } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM tenants';
        const params = [];
        const conditions = [];

        if (status) {
            conditions.push(`status = $${params.length + 1}`);
            params.push(status);
        }

        if (property_id) {
            conditions.push(`property_id = $${params.length + 1}`);
            params.push(property_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM tenants';
        if (conditions.length > 0) {
            const countParams = params.slice(0, -2);
            countQuery += ' WHERE ' + conditions.join(' AND ');
            const countResult = await pool.query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].count);

            return res.json({
                success: true,
                data: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        }

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('GET /tenants error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// GET /api/tenants/:id - Get tenant details
// =========================================
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tenants WHERE id = $1', [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('GET /tenants/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// POST /api/tenants - Create new tenant
// =========================================
router.post('/', requireAuth, async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            property_id,
            contract_id,
            monthlyAmount,
            startDate,
            endDate,
            status = 'active'
        } = req.body;

        // Validation
        if (!firstName || !lastName || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await pool.query(
            `INSERT INTO tenants (
        first_name, last_name, email, phone, property_id, contract_id,
        monthly_amount, start_date, end_date, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *`,
            [firstName, lastName, email, phone, property_id, contract_id, monthlyAmount, startDate, endDate, status]
        );

        res.status(201).json({
            success: true,
            message: 'Tenant created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('POST /tenants error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// PUT /api/tenants/:id - Update tenant
// =========================================
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Build dynamic update query
        const allowedFields = [
            'first_name', 'last_name', 'email', 'phone',
            'property_id', 'monthly_amount', 'status'
        ];

        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key) && value !== undefined) {
                setClauses.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        values.push(id);

        const query = `
      UPDATE tenants
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        res.json({
            success: true,
            message: 'Tenant updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('PUT /tenants/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// DELETE /api/tenants/:id - Delete tenant
// =========================================
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM tenants WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        res.json({
            success: true,
            message: 'Tenant deleted successfully'
        });
    } catch (error) {
        console.error('DELETE /tenants/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// GET /api/tenants/:id/contracts - Tenant contracts
// =========================================
router.get('/:id/contracts', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM contracts WHERE tenant_id = $1 ORDER BY id DESC',
            [req.params.id]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('GET /tenants/:id/contracts error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// GET /api/tenants/:id/payments - Tenant payment history
// =========================================
router.get('/:id/payments', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM payments WHERE tenant_id = $1 ORDER BY payment_date DESC',
            [req.params.id]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('GET /tenants/:id/payments error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

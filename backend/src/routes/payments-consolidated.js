/**
 * AKIG - Consolidated Payments Route
 * All payment operations: CRUD + Payment tracking + Reports
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

// =========================================
// GET /api/payments - List all payments
// =========================================
router.get('/', requireAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, tenant_id, startDate, endDate } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM payments';
        const params = [];
        const conditions = [];

        if (status) {
            conditions.push(`status = $${params.length + 1}`);
            params.push(status);
        }

        if (tenant_id) {
            conditions.push(`tenant_id = $${params.length + 1}`);
            params.push(tenant_id);
        }

        if (startDate) {
            conditions.push(`payment_date >= $${params.length + 1}`);
            params.push(startDate);
        }

        if (endDate) {
            conditions.push(`payment_date <= $${params.length + 1}`);
            params.push(endDate);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY payment_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('GET /payments error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// GET /api/payments/:id - Get payment details
// =========================================
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM payments WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('GET /payments/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// POST /api/payments - Record new payment
// =========================================
router.post('/', requireAuth, async (req, res) => {
    try {
        const {
            tenant_id,
            contract_id,
            amount,
            paymentDate,
            paymentMethod,
            description,
            reference,
            status = 'completed'
        } = req.body;

        if (!tenant_id || !amount || !paymentDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await pool.query(
            `INSERT INTO payments (
        tenant_id, contract_id, amount, payment_date, payment_method,
        description, reference, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *`,
            [tenant_id, contract_id, amount, paymentDate, paymentMethod, description, reference, status]
        );

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('POST /payments error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// PUT /api/payments/:id - Update payment
// =========================================
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const allowedFields = [
            'amount', 'payment_date', 'payment_method', 'description',
            'reference', 'status'
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
      UPDATE payments
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json({
            success: true,
            message: 'Payment updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('PUT /payments/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// DELETE /api/payments/:id - Delete payment
// =========================================
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM payments WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json({
            success: true,
            message: 'Payment deleted successfully'
        });
    } catch (error) {
        console.error('DELETE /payments/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// GET /api/payments/stats/monthly - Monthly payment stats
// =========================================
router.get('/stats/monthly', requireAuth, async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;

        const result = await pool.query(
            `SELECT 
        DATE_TRUNC('month', payment_date) as month,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average,
        MAX(amount) as max,
        MIN(amount) as min
      FROM payments
      WHERE EXTRACT(YEAR FROM payment_date) = $1 AND status = 'completed'
      GROUP BY month
      ORDER BY month DESC`,
            [year]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('GET /payments/stats/monthly error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// GET /api/payments/tenant/:tenant_id - Get tenant payments
// =========================================
router.get('/tenant/:tenant_id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM payments WHERE tenant_id = $1 ORDER BY payment_date DESC',
            [req.params.tenant_id]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('GET /payments/tenant/:tenant_id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// POST /api/payments/bulk - Bulk payment import
// =========================================
router.post('/bulk', requireAuth, async (req, res) => {
    try {
        const { payments } = req.body;

        if (!Array.isArray(payments) || payments.length === 0) {
            return res.status(400).json({ error: 'Invalid payments array' });
        }

        const results = [];
        for (const payment of payments) {
            const { tenant_id, amount, paymentDate, paymentMethod } = payment;

            if (!tenant_id || !amount || !paymentDate) {
                continue;
            }

            const result = await pool.query(
                `INSERT INTO payments (
          tenant_id, amount, payment_date, payment_method, status, created_at
        ) VALUES ($1, $2, $3, $4, 'completed', NOW())
        RETURNING *`,
                [tenant_id, amount, paymentDate, paymentMethod]
            );

            results.push(result.rows[0]);
        }

        res.status(201).json({
            success: true,
            message: `${results.length} payments imported successfully`,
            data: results
        });
    } catch (error) {
        console.error('POST /payments/bulk error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

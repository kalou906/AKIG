/**
 * AKIG - Consolidated Contracts Route
 * All contract operations: CRUD + Full management
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

// =========================================
// GET /api/contracts - List all contracts
// =========================================
router.get('/', requireAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, property_id } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM contracts';
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

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('GET /contracts error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// GET /api/contracts/:id - Get contract details
// =========================================
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM contracts WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('GET /contracts/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// POST /api/contracts - Create new contract
// =========================================
router.post('/', requireAuth, async (req, res) => {
    try {
        const {
            contractNumber,
            tenant_id,
            property_id,
            startDate,
            endDate,
            monthlyRent,
            depositAmount,
            status = 'active',
            terms,
            notes
        } = req.body;

        if (!contractNumber || !tenant_id || !property_id || !startDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await pool.query(
            `INSERT INTO contracts (
        contract_number, tenant_id, property_id, start_date, end_date,
        monthly_rent, deposit_amount, status, terms, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *`,
            [contractNumber, tenant_id, property_id, startDate, endDate, monthlyRent, depositAmount, status, terms, notes]
        );

        res.status(201).json({
            success: true,
            message: 'Contract created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('POST /contracts error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// PUT /api/contracts/:id - Update contract
// =========================================
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const allowedFields = [
            'start_date', 'end_date', 'monthly_rent', 'deposit_amount',
            'status', 'terms', 'notes'
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
      UPDATE contracts
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        res.json({
            success: true,
            message: 'Contract updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('PUT /contracts/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// DELETE /api/contracts/:id - Delete contract
// =========================================
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM contracts WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        res.json({
            success: true,
            message: 'Contract deleted successfully'
        });
    } catch (error) {
        console.error('DELETE /contracts/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// PUT /api/contracts/:id/renew - Renew contract
// =========================================
router.put('/:id/renew', requireAuth, async (req, res) => {
    try {
        const { newEndDate } = req.body;

        if (!newEndDate) {
            return res.status(400).json({ error: 'newEndDate is required' });
        }

        const result = await pool.query(
            `UPDATE contracts
       SET end_date = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
            [newEndDate, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        res.json({
            success: true,
            message: 'Contract renewed successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('PUT /contracts/:id/renew error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// PUT /api/contracts/:id/terminate - Terminate contract
// =========================================
router.put('/:id/terminate', requireAuth, async (req, res) => {
    try {
        const { terminationDate, reason } = req.body;

        const result = await pool.query(
            `UPDATE contracts
       SET status = 'terminated', end_date = $1, notes = notes || ' | Terminated: ' || $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
            [terminationDate, reason, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        res.json({
            success: true,
            message: 'Contract terminated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('PUT /contracts/:id/terminate error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

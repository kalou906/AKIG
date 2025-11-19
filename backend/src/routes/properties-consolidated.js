/**
 * AKIG - Consolidated Properties Route
 * All property operations: CRUD + Search + Stats
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

// =========================================
// GET /api/properties - List all properties
// =========================================
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, status, type, city } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM properties';
        const params = [];
        const conditions = [];

        if (status) {
            conditions.push(`status = $${params.length + 1}`);
            params.push(status);
        }

        if (type) {
            conditions.push(`property_type = $${params.length + 1}`);
            params.push(type);
        }

        if (city) {
            conditions.push(`city = $${params.length + 1}`);
            params.push(city);
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
        console.error('GET /properties error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// GET /api/properties/:id - Get property details
// =========================================
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM properties WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('GET /properties/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// POST /api/properties - Create new property
// =========================================
router.post('/', requireAuth, async (req, res) => {
    try {
        const {
            address,
            city,
            district,
            propertyType,
            bedrooms,
            bathrooms,
            area,
            price,
            description,
            status = 'available'
        } = req.body;

        if (!address || !city) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await pool.query(
            `INSERT INTO properties (
        address, city, district, property_type, bedrooms, bathrooms,
        area, price, description, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *`,
            [address, city, district, propertyType, bedrooms, bathrooms, area, price, description, status]
        );

        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('POST /properties error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// PUT /api/properties/:id - Update property
// =========================================
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const allowedFields = [
            'address', 'city', 'district', 'property_type', 'bedrooms',
            'bathrooms', 'area', 'price', 'description', 'status'
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
      UPDATE properties
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json({
            success: true,
            message: 'Property updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('PUT /properties/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// DELETE /api/properties/:id - Delete property
// =========================================
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM properties WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json({
            success: true,
            message: 'Property deleted successfully'
        });
    } catch (error) {
        console.error('DELETE /properties/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// GET /api/properties/search - Search properties
// =========================================
router.get('/search/advanced', async (req, res) => {
    try {
        const { q, type, minPrice, maxPrice, bedrooms } = req.query;

        let query = 'SELECT * FROM properties WHERE 1=1';
        const params = [];

        if (q) {
            query += ` AND (address ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
            params.push(`%${q}%`);
        }

        if (type) {
            query += ` AND property_type = $${params.length + 1}`;
            params.push(type);
        }

        if (minPrice) {
            query += ` AND price >= $${params.length + 1}`;
            params.push(minPrice);
        }

        if (maxPrice) {
            query += ` AND price <= $${params.length + 1}`;
            params.push(maxPrice);
        }

        if (bedrooms) {
            query += ` AND bedrooms = $${params.length + 1}`;
            params.push(bedrooms);
        }

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('GET /properties/search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// GET /api/properties/:id/tenants - Property tenants
// =========================================
router.get('/:id/tenants', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM tenants WHERE property_id = $1',
            [req.params.id]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('GET /properties/:id/tenants error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

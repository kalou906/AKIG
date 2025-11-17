const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @openapi
 * /contracts:
 *   get:
 *     tags: [Contracts]
 *     summary: Get all contracts
 *     responses:
 *       200:
 *         description: List of contracts
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contracts ORDER BY id DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @openapi
 * /contracts:
 *   post:
 *     tags: [Contracts]
 *     summary: Create a new contract
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               party:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Contract created
 */
router.post('/', requireAuth, async (req, res) => {
  const { title, party, start_date, end_date, amount } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO contracts (title, party, start_date, end_date, amount, owner_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [title, party, start_date || null, end_date || null, amount || null, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
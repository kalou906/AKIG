const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');

/**
 * @openapi
 * /mobile-money/initiate:
 *   post:
 *     tags: [Mobile Money]
 *     summary: Initiate a mobile money payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *                 example: ORANGE
 *               amount:
 *                 type: number
 *                 example: 100000
 *               currency:
 *                 type: string
 *                 example: GNF
 *               metadata:
 *                 type: object
 *     responses:
 *       202:
 *         description: Accepted, transaction created
 */
// Initiate a mobile money payment (stub)
router.post('/initiate', requireAuth, async (req, res) => {
  const { provider, amount, currency = 'GNF', metadata } = req.body || {};
  if (!provider || !amount) {
    return res.status(400).json({ error: 'provider and amount are required' });
  }
  // Stub: return a fake transaction reference to be polled/callbacked later
  const txRef = `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  return res.status(202).json({ status: 'pending', provider, amount, currency, txRef, metadata });
});

/**
 * @openapi
 * /mobile-money/callback/{provider}:
 *   post:
 *     tags: [Mobile Money]
 *     summary: Provider callback webhook
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               txRef:
 *                 type: string
 *               status:
 *                 type: string
 *                 example: success
 *     responses:
 *       200:
 *         description: Acknowledged
 */
// Callback webhook for providers (stub)
router.post('/callback/:provider', async (req, res) => {
  const { provider } = req.params;
  const { txRef, status = 'success' } = req.body || {};
  if (!txRef) return res.status(400).json({ error: 'txRef is required' });
  // Stub: acknowledge receipt; real implementation would verify signatures and update DB
  return res.status(200).json({ ok: true, provider, txRef, status });
});

module.exports = router;

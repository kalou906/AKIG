const express = require('express');
const PDFDocument = require('pdfkit');
const pool = require('../db');
const { formatGNF } = require('../utils/currency');

const router = express.Router();

/**
 * @openapi
 * /payments:
 *   get:
 *     tags: [Payments]
 *     summary: Get all payments
 *     responses:
 *       200:
 *         description: List of payments with GNF formatting
 */
router.get('/', async (req, res) => {
  try {
    const payments = await pool.query(`
      SELECT p.*, c.property_name, c.tenant_name 
      FROM payments p 
      JOIN contracts c ON p.contract_id = c.id 
      ORDER BY p.paid_at DESC
    `);
    const formatted = payments.rows.map(p => ({
      ...p,
      amount_gnf: formatGNF(p.amount)
    }));
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @openapi
 * /payments:
 *   post:
 *     tags: [Payments]
 *     summary: Create a new payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contract_id:
 *                 type: integer
 *               paid_at:
 *                 type: string
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *               receipt_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment created
 */
router.post('/', async (req, res) => {
  try {
    const { contract_id, paid_at, amount, method, receipt_number } = req.body;
    
    const newPayment = await pool.query(
      `INSERT INTO payments (contract_id, paid_at, amount, method, receipt_number) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [contract_id, paid_at, amount, method, receipt_number]
    );

    res.json(newPayment.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @openapi
 * /payments/{id}/receipt:
 *   get:
 *     tags: [Payments]
 *     summary: Generate PDF receipt for payment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PDF receipt
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/receipt', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer les données du paiement
    const payment = await pool.query(`
      SELECT p.*, c.property_name, c.tenant_name, c.monthly_rent 
      FROM payments p 
      JOIN contracts c ON p.contract_id = c.id 
      WHERE p.id = $1
    `, [id]);

    if (payment.rows.length === 0) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    const paymentData = payment.rows[0];

    // Créer le PDF
    const doc = new PDFDocument();
    
    // En-têtes pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${paymentData.receipt_number}.pdf`);

    doc.pipe(res);

    // Contenu du PDF
    doc.fontSize(20).text('REÇU DE LOYER', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Numéro de reçu: ${paymentData.receipt_number}`);
    doc.text(`Date de paiement: ${new Date(paymentData.paid_at).toLocaleDateString()}`);
    doc.text(`Propriété: ${paymentData.property_name}`);
    doc.text(`Locataire: ${paymentData.tenant_name}`);
    doc.text(`Montant: ${paymentData.amount} €`);
    doc.text(`Méthode: ${paymentData.method}`);
    doc.moveDown();
    doc.text('Merci pour votre paiement !', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
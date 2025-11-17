const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

router.get('/monthly', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT date_trunc('month', paid_at) as mois,
             SUM(amount) as total
      FROM payments
      GROUP BY mois
      ORDER BY mois DESC
      LIMIT 6
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/export/csv', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.id, p.contract_id, p.paid_at, p.amount, p.method, p.receipt_number
      FROM payments p
      ORDER BY p.paid_at DESC
      LIMIT 50
    `);
    const parser = new Parser();
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('rapport.csv');
    return res.send(csv);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/export/pdf', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.id, p.contract_id, p.paid_at, p.amount, p.method, p.receipt_number
      FROM payments p
      ORDER BY p.paid_at DESC
      LIMIT 20
    `);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(18).text('Rapport Paiements AKIG', { align: 'center' });
    doc.moveDown();

    rows.forEach(r => {
      doc.fontSize(12).text(
        `#${r.id} | Contrat ${r.contract_id} | ${r.paid_at.toISOString().slice(0,10)} | ${r.amount} GNF | ${r.method} | ${r.receipt_number}`
      );
    });

    doc.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
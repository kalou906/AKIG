const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/dashboard - Stats pour le tableau de bord
router.get('/', async (req, res) => {
  try {
    // 1. Nombre de contrats actifs
    const activeContracts = await pool.query(
      'SELECT COUNT(*) as count FROM contracts WHERE status = $1',
      ['actif']
    );

    // 2. Nombre de paiements en attente (pas encore traités)
    const pendingPayments = await pool.query(
      'SELECT COUNT(*) as count FROM payments WHERE status = $1',
      ['pending']
    );

    // 3. Revenus du mois en cours
    const monthlyRevenue = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    // 4. Revenus par propriétaire pour le mois en cours
    const revenueByOwner = await pool.query(`
      SELECT c.owner_id, COALESCE(SUM(p.amount), 0) as total
      FROM contracts c
      LEFT JOIN payments p ON p.contract_id = c.id
      WHERE DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY c.owner_id
      ORDER BY total DESC
    `);

    res.json({
      activeContracts: activeContracts.rows[0].count,
      pendingPayments: pendingPayments.rows[0].count,
      monthlyRevenue: monthlyRevenue.rows[0].total,
      revenueByOwner: revenueByOwner.rows
    });

  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
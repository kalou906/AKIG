/**
 * Routes: search.js
 * Recherche avancée multi-critères dans tout le système
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

/**
 * GET /api/search
 * Recherche multi-critères sur tous les types d'entités
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { q = '', type = 'all', limit = 50 } = req.query;

    if (q.length < 2) {
      return res.json({
        results: [],
        message: 'Entrez au moins 2 caractères pour la recherche',
      });
    }

    const searchPattern = `%${q}%`;
    const results = {
      owners: [],
      properties: [],
      units: [],
      tenants: [],
      contracts: [],
      payments: [],
    };

    // Rechercher les propriétaires
    if (type === 'all' || type === 'owners') {
      const ownersResult = await pool.query(
        `SELECT id, name, email, phone, company_name, is_active
         FROM users WHERE role = 'owner' AND (name ILIKE $1 OR email ILIKE $1 OR company_name ILIKE $1)
         LIMIT $2`,
        [searchPattern, limit]
      );
      results.owners = ownersResult.rows;
    }

    // Rechercher les propriétés
    if (type === 'all' || type === 'properties') {
      const propsResult = await pool.query(
        `SELECT p.id, p.name, p.address, p.city, p.property_type, p.status,
                u.name as owner_name, (SELECT COUNT(*) FROM units WHERE property_id = p.id) as unit_count
         FROM properties p LEFT JOIN users u ON p.owner_id = u.id
         WHERE p.name ILIKE $1 OR p.address ILIKE $1 OR p.city ILIKE $1
         LIMIT $2`,
        [searchPattern, limit]
      );
      results.properties = propsResult.rows;
    }

    // Rechercher les unités
    if (type === 'all' || type === 'units') {
      const unitsResult = await pool.query(
        `SELECT u.id, u.unit_number, u.unit_type, u.rent_amount, u.status,
                p.name as property_name, p.city
         FROM units u JOIN properties p ON u.property_id = p.id
         WHERE u.unit_number ILIKE $1 OR p.name ILIKE $1
         LIMIT $2`,
        [searchPattern, limit]
      );
      results.units = unitsResult.rows;
    }

    // Rechercher les locataires
    if (type === 'all' || type === 'tenants') {
      const tenantsResult = await pool.query(
        `SELECT id, name, email, phone, address, city
         FROM users WHERE role = 'tenant' AND (name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1)
         LIMIT $2`,
        [searchPattern, limit]
      );
      results.tenants = tenantsResult.rows;
    }

    // Rechercher les contrats
    if (type === 'all' || type === 'contracts') {
      const contractsResult = await pool.query(
        `SELECT c.id, c.start_date, c.end_date, c.monthly_rent, c.status,
                t.name as tenant_name, u.unit_number, p.name as property_name
         FROM contracts c
         LEFT JOIN users t ON c.tenant_id = t.id
         LEFT JOIN units u ON c.unit_id = u.id
         LEFT JOIN properties p ON c.property_id = p.id
         WHERE t.name ILIKE $1 OR u.unit_number ILIKE $1 OR p.name ILIKE $1
         LIMIT $2`,
        [searchPattern, limit]
      );
      results.contracts = contractsResult.rows;
    }

    // Rechercher les paiements
    if (type === 'all' || type === 'payments') {
      const paymentsResult = await pool.query(
        `SELECT p.id, p.paid_at, p.amount, p.payment_method, p.status,
                t.name as tenant_name, r.receipt_number
         FROM payments p
         LEFT JOIN users t ON p.tenant_id = t.id
         LEFT JOIN receipts r ON p.id = r.payment_id
         WHERE r.receipt_number ILIKE $1 OR t.name ILIKE $1
         LIMIT $2`,
        [searchPattern, limit]
      );
      results.payments = paymentsResult.rows;
    }

    res.json({
      query: q,
      results,
      totalResults: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
    });
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

/**
 * Routes API Exports PDF
 * Génération quittances, rapports, contrats
 * backend/src/routes/pdf.routes.js
 */

const express = require('express');
const PdfService = require('../services/pdf.service');
const pool = require('../db');
const authorize = require('../middleware/authorize');
const logger = require('../services/logger');

const router = express.Router();

/**
 * GET /api/pdf/quittance/:quittanceId
 * Générer quittance PDF
 */
router.get('/quittance/:quittanceId', authorize, async (req, res) => {
  try {
    const { quittanceId } = req.params;

    // Récupérer quittance
    const quittanceResult = await pool.query(
      'SELECT * FROM quittances WHERE id = $1',
      [quittanceId]
    );

    if (quittanceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quittance non trouvée' });
    }

    const quittance = quittanceResult.rows[0];

    // Récupérer tenant
    const tenantResult = await pool.query(
      'SELECT * FROM tenants WHERE id = $1',
      [quittance.tenant_id]
    );

    const tenant = tenantResult.rows[0] || { nom: 'Inconnu' };

    // Récupérer propriété
    const propertyResult = await pool.query(
      'SELECT * FROM properties LIMIT 1'
    );

    const property = propertyResult.rows[0] || { nom: 'Propriété' };

    // Générer PDF
    const filepath = await PdfService.generateQuittance(quittance, tenant, property);

    // Envoyer fichier
    res.download(filepath, `quittance-${quittanceId}.pdf`, (err) => {
      if (err) logger.error('Erreur téléchargement PDF', err);
    });
  } catch (err) {
    logger.error('Erreur génération quittance PDF', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pdf/rapport-impayes
 * Générer rapport impayés PDF
 */
router.get('/rapport-impayes', authorize, async (req, res) => {
  try {
    const { month, year } = req.query;

    // Récupérer impayés ouverts
    const result = await pool.query(`
      SELECT 
        i.id, i.montant, i.periode, i.statut, i.created_at,
        t.nom as nomTenant
      FROM impayes i
      JOIN tenants t ON i.tenant_id = t.id
      WHERE i.statut IN ('ouvert', 'partiel')
      ORDER BY i.montant DESC
    `);

    // Générer PDF
    const filepath = await PdfService.generateArrearsReport(
      result.rows,
      { year: parseInt(year), month: parseInt(month) }
    );

    // Envoyer fichier
    res.download(filepath, 'rapport-impayes.pdf', (err) => {
      if (err) logger.error('Erreur téléchargement rapport', err);
    });
  } catch (err) {
    logger.error('Erreur génération rapport PDF', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pdf/contrat/:contractId
 * Générer contrat PDF
 */
router.get('/contrat/:contractId', authorize, async (req, res) => {
  try {
    const { contractId } = req.params;

    // Récupérer contrat
    const contractResult = await pool.query(
      'SELECT * FROM contrats WHERE id = $1',
      [contractId]
    );

    if (contractResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contrat non trouvé' });
    }

    const contract = contractResult.rows[0];

    // Récupérer tenant
    const tenantResult = await pool.query(
      'SELECT * FROM tenants WHERE id = $1',
      [contract.tenant_id]
    );

    const tenant = tenantResult.rows[0] || { nom: 'Inconnu' };

    // Récupérer propriété
    const propertyResult = await pool.query(
      'SELECT * FROM properties LIMIT 1'
    );

    const property = propertyResult.rows[0] || { nom: 'Propriété' };

    // Générer PDF
    const filepath = await PdfService.generateContract(contract, tenant, property);

    // Envoyer fichier
    res.download(filepath, `contrat-${contractId}.pdf`, (err) => {
      if (err) logger.error('Erreur téléchargement contrat', err);
    });
  } catch (err) {
    logger.error('Erreur génération contrat PDF', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pdf/bordereau-paiements
 * Générer bordereau paiements PDF
 */
router.get('/bordereau-paiements', authorize, async (req, res) => {
  try {
    const { dateStart, dateEnd } = req.query;

    // Récupérer paiements
    let query = `
      SELECT 
        p.id, p.date, p.montant, p.methode, p.reference,
        t.nom as nomTenant
      FROM payments p
      JOIN tenants t ON p.tenant_id = t.id
      WHERE p.statut = 'confirmé'
    `;

    const params = [];

    if (dateStart) {
      query += ` AND p.date >= $${params.length + 1}`;
      params.push(new Date(dateStart));
    }

    if (dateEnd) {
      query += ` AND p.date <= $${params.length + 1}`;
      params.push(new Date(dateEnd));
    }

    query += ' ORDER BY p.date DESC';

    const result = await pool.query(query, params);

    // Générer PDF
    const filepath = await PdfService.generatePaymentSlip(result.rows);

    // Envoyer fichier
    res.download(filepath, 'bordereau-paiements.pdf', (err) => {
      if (err) logger.error('Erreur téléchargement bordereau', err);
    });
  } catch (err) {
    logger.error('Erreur génération bordereau PDF', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

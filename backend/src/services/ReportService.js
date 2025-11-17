/**
 * ReportService.js
 * Phase 10: Services pour 6 types de rapports
 * Paiements, fiscal, occupation, revenus/dépenses, réconciliation, honoraires
 */

const pool = require('../db');
const PDFDocument = require('pdfkit');

class ReportService {
  /**
   * Rapport Paiements
   * @param {Object} filters - {date_from, date_to, proprietaire_id, statut}
   * @returns {Promise<Array>}
   */
  async getPaymentReport(filters = {}) {
    let query = `
      SELECT 
        p.id, p.date_payment, p.montant, p.statut,
        pr.nom as proprietaire,
        l.nom as locataire,
        c.montant_loyer
      FROM payments p
      LEFT JOIN properties pr ON p.proprietaire_id = pr.id
      LEFT JOIN locataires l ON p.locataire_id = l.id
      LEFT JOIN contracts c ON p.contract_id = c.id
      WHERE p.deleted_at IS NULL
    `;
    
    let params = [];
    let paramCount = 1;

    if (filters.date_from) {
      query += ` AND p.date_payment >= $${paramCount++}`;
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      query += ` AND p.date_payment <= $${paramCount++}`;
      params.push(filters.date_to);
    }
    if (filters.proprietaire_id) {
      query += ` AND p.proprietaire_id = $${paramCount++}`;
      params.push(filters.proprietaire_id);
    }
    if (filters.statut) {
      query += ` AND p.statut = $${paramCount++}`;
      params.push(filters.statut);
    }

    query += ` ORDER BY p.date_payment DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Rapport Fiscal
   * @param {Object} filters - {annee, proprietaire_id}
   * @returns {Promise<Object>}
   */
  async getFiscalReport(filters = {}) {
    const year = filters.annee || new Date().getFullYear();
    
    let query = `
      SELECT 
        EXTRACT(MONTH FROM p.date_payment) as mois,
        SUM(p.montant) as revenus_bruts,
        COUNT(DISTINCT p.locataire_id) as nb_locataires,
        (SELECT SUM(montant) FROM charges 
         WHERE YEAR(date) = $1) as charges_deductibles,
        (SELECT SUM(montant) FROM expenses 
         WHERE YEAR(date) = $1) as depenses
      FROM payments p
      WHERE YEAR(p.date_payment) = $1 AND p.deleted_at IS NULL
    `;

    let params = [year];
    let paramCount = 2;

    if (filters.proprietaire_id) {
      query += ` AND p.proprietaire_id = $${paramCount++}`;
      params.push(filters.proprietaire_id);
    }

    query += ` GROUP BY mois ORDER BY mois`;

    const result = await pool.query(query, params);
    
    // Calculer impôt estimé (exemple simplifié)
    const data = result.rows.map(row => ({
      ...row,
      resultat_net: row.revenus_bruts - row.charges_deductibles - row.depenses,
      impot_estime: (row.revenus_bruts - row.charges_deductibles - row.depenses) * 0.33 // 33% TVA FR
    }));

    return data;
  }

  /**
   * Rapport Occupation
   * @param {Object} filters - {date_from, date_to}
   * @returns {Promise<Object>}
   */
  async getOccupancyReport(filters = {}) {
    const dateFrom = filters.date_from || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const dateTo = filters.date_to || new Date().toISOString().split('T')[0];

    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM properties WHERE deleted_at IS NULL) as total_properties,
        (SELECT COUNT(DISTINCT p.id) FROM properties p
         INNER JOIN contracts c ON c.local_id = p.id
         WHERE c.date_debut <= $2 AND c.date_fin >= $1
         AND c.deleted_at IS NULL) as occupied_properties,
        (SELECT COUNT(DISTINCT proprietaire_id) FROM contracts 
         WHERE date_debut <= $2 AND date_fin >= $1
         AND deleted_at IS NULL) as active_proprietaires,
        (SELECT COUNT(*) FROM locataires WHERE deleted_at IS NULL) as total_locataires
    `, [dateFrom, dateTo]);

    const row = result.rows[0];
    return {
      ...row,
      occupation_rate: row.total_properties > 0 
        ? Math.round((row.occupied_properties / row.total_properties) * 100) 
        : 0
    };
  }

  /**
   * Rapport Revenus/Dépenses
   * @param {Object} filters - {date_from, date_to, proprietaire_id}
   * @returns {Promise<Object>}
   */
  async getIncomeExpenseReport(filters = {}) {
    let incomeQuery = `
      SELECT 
        SUM(montant) as total_revenus,
        COUNT(*) as nb_paiements
      FROM payments
      WHERE deleted_at IS NULL AND statut = 'payé'
    `;

    let expenseQuery = `
      SELECT 
        SUM(montant) as total_depenses,
        COUNT(*) as nb_charges
      FROM charges
      WHERE deleted_at IS NULL
    `;

    let params = [];
    let paramCount = 1;

    if (filters.date_from) {
      incomeQuery += ` AND date_payment >= $${paramCount}`;
      expenseQuery += ` AND date >= $${paramCount}`;
      params.push(filters.date_from);
      paramCount++;
    }

    if (filters.date_to) {
      incomeQuery += ` AND date_payment <= $${paramCount}`;
      expenseQuery += ` AND date <= $${paramCount}`;
      params.push(filters.date_to);
      paramCount++;
    }

    if (filters.proprietaire_id) {
      incomeQuery += ` AND proprietaire_id = $${paramCount}`;
      params.push(filters.proprietaire_id);
    }

    const income = await pool.query(incomeQuery, params);
    const expense = await pool.query(expenseQuery, params);

    const incomeTotal = parseFloat(income.rows[0].total_revenus || 0);
    const expenseTotal = parseFloat(expense.rows[0].total_depenses || 0);

    return {
      revenus: incomeTotal,
      depenses: expenseTotal,
      resultat: incomeTotal - expenseTotal,
      ratio_resultat: incomeTotal > 0 ? Math.round((expenseTotal / incomeTotal) * 100) : 0,
      nb_paiements: income.rows[0].nb_paiements,
      nb_charges: expense.rows[0].nb_charges
    };
  }

  /**
   * Rapport Réconciliation Bancaire
   * @param {Object} filters - {date_from, date_to, bank_account_id}
   * @returns {Promise<Array>}
   */
  async getReconciliationReport(filters = {}) {
    let query = `
      SELECT 
        p.id,
        p.date_payment,
        p.montant,
        p.statut,
        COALESCE(b.matched, false) as matched_banking,
        b.date as bank_date,
        b.reference as bank_reference
      FROM payments p
      LEFT JOIN bank_transactions b ON p.id = b.payment_id
      WHERE p.deleted_at IS NULL
    `;

    let params = [];
    let paramCount = 1;

    if (filters.date_from) {
      query += ` AND p.date_payment >= $${paramCount++}`;
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      query += ` AND p.date_payment <= $${paramCount++}`;
      params.push(filters.date_to);
    }

    query += ` ORDER BY p.date_payment DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Rapport Honoraires
   * @param {Object} filters - {date_from, date_to, proprietaire_id}
   * @returns {Promise<Array>}
   */
  async getFeeReport(filters = {}) {
    let query = `
      SELECT 
        h.id,
        h.date,
        h.montant_locataire,
        h.montant_proprietaire,
        h.type,
        pr.nom as proprietaire,
        p.nom as local
      FROM honoraires h
      LEFT JOIN proprietaires pr ON h.proprietaire_id = pr.id
      LEFT JOIN properties p ON h.local_id = p.id
      WHERE h.deleted_at IS NULL
    `;

    let params = [];
    let paramCount = 1;

    if (filters.date_from) {
      query += ` AND h.date >= $${paramCount++}`;
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      query += ` AND h.date <= $${paramCount++}`;
      params.push(filters.date_to);
    }
    if (filters.proprietaire_id) {
      query += ` AND h.proprietaire_id = $${paramCount++}`;
      params.push(filters.proprietaire_id);
    }

    query += ` ORDER BY h.date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Exporter rapport en PDF
   * @param {string} reportType - Type de rapport
   * @param {Array} data - Données rapport
   * @param {Object} filters - Filtres utilisés
   * @returns {Promise<Buffer>}
   */
  async exportToPDF(reportType, data, filters = {}) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text(`Rapport: ${reportType}`, { align: 'center' });
      doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });

      if (Object.keys(filters).length > 0) {
        doc.fontSize(9).text(`Filtres: ${JSON.stringify(filters)}`, { align: 'left' });
      }

      doc.moveDown();

      // Table
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        doc.fontSize(10);
        doc.text(headers.join(' | '));

        data.slice(0, 100).forEach(row => {
          doc.text(headers.map(h => row[h] || '-').join(' | '));
        });

        if (data.length > 100) {
          doc.text(`... et ${data.length - 100} autres lignes`);
        }
      }

      doc.end();
    });
  }

  /**
   * Exporter rapport en CSV
   * @param {string} reportType - Type de rapport
   * @param {Array} data - Données rapport
   * @returns {string}
   */
  exportToCSV(reportType, data) {
    if (!Array.isArray(data) || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`)
        .join(',')
    );

    return `${headers.join(',')}\n${rows.join('\n')}`;
  }
}

module.exports = new ReportService();

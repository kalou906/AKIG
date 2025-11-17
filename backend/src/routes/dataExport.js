/**
 * Routes: dataExport.js
 * Export des données en Excel, PDF, CSV
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, authorize } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const exportsDir = path.join(__dirname, '..', '..', 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

/**
 * POST /api/export/properties
 * Exporte la liste des propriétés
 */
router.post('/properties', requireAuth, authorize(['admin', 'owner', 'manager']), async (req, res) => {
  try {
    const { format = 'excel' } = req.body;

    const result = await pool.query(
      `SELECT 
        p.id, p.name, p.address, p.city, p.postal_code, p.property_type,
        p.total_area, p.year_built, p.number_of_units, p.status,
        u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
        (SELECT COUNT(*) FROM units WHERE property_id = p.id) as unit_count,
        (SELECT COUNT(*) FROM units WHERE property_id = p.id AND status = 'rented') as rented_units
       FROM properties p
       LEFT JOIN users u ON p.owner_id = u.id
       ORDER BY p.name ASC`
    );

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Propriétés');

      // Headers
      sheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Nom', key: 'name', width: 25 },
        { header: 'Adresse', key: 'address', width: 30 },
        { header: 'Ville', key: 'city', width: 15 },
        { header: 'Code Postal', key: 'postal_code', width: 12 },
        { header: 'Type', key: 'property_type', width: 15 },
        { header: 'Surface', key: 'total_area', width: 12 },
        { header: 'Année', key: 'year_built', width: 10 },
        { header: 'Unités', key: 'unit_count', width: 10 },
        { header: 'Louées', key: 'rented_units', width: 10 },
        { header: 'Propriétaire', key: 'owner_name', width: 20 },
        { header: 'Email', key: 'owner_email', width: 25 },
        { header: 'Statut', key: 'status', width: 12 },
      ];

      result.rows.forEach((row) => {
        sheet.addRow(row);
      });

      // Style du header
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };

      const filename = `properties-${new Date().toISOString().split('T')[0]}.xlsx`;
      const filepath = path.join(exportsDir, filename);

      await workbook.xlsx.writeFile(filepath);
      res.download(filepath, filename);
    } else if (format === 'csv') {
      let csv = 'ID,Nom,Adresse,Ville,Type,Unités,Louées,Propriétaire,Statut\n';
      result.rows.forEach((row) => {
        csv += `${row.id},"${row.name}","${row.address}","${row.city}","${row.property_type}",${row.unit_count},${row.rented_units},"${row.owner_name}","${row.status}"\n`;
      });

      const filename = `properties-${new Date().toISOString().split('T')[0]}.csv`;
      const filepath = path.join(exportsDir, filename);
      fs.writeFileSync(filepath, csv, 'utf-8');
      res.download(filepath, filename);
    }
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
});

/**
 * POST /api/export/payments
 * Exporte l'historique des paiements
 */
router.post('/payments', requireAuth, async (req, res) => {
  try {
    const { format = 'excel', startDate = '', endDate = '' } = req.body;

    const startD = startDate || '2025-01-01';
    const endD = endDate || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT 
        p.id, p.paid_at, p.amount, p.payment_method, p.status, p.reference_number,
        t.name as tenant_name, u.unit_number, prop.name as property_name,
        r.receipt_number
       FROM payments p
       LEFT JOIN users t ON p.tenant_id = t.id
       LEFT JOIN units u ON p.unit_id = u.id
       LEFT JOIN properties prop ON u.property_id = prop.id
       LEFT JOIN receipts r ON p.id = r.payment_id
       WHERE p.paid_at::date BETWEEN $1 AND $2
       ORDER BY p.paid_at DESC`,
      [startD, endD]
    );

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Paiements');

      sheet.columns = [
        { header: 'Date', key: 'paid_at', width: 15 },
        { header: 'Quittance', key: 'receipt_number', width: 20 },
        { header: 'Montant', key: 'amount', width: 12 },
        { header: 'Méthode', key: 'payment_method', width: 15 },
        { header: 'Statut', key: 'status', width: 12 },
        { header: 'Locataire', key: 'tenant_name', width: 20 },
        { header: 'Local', key: 'unit_number', width: 12 },
        { header: 'Propriété', key: 'property_name', width: 25 },
        { header: 'Référence', key: 'reference_number', width: 15 },
      ];

      result.rows.forEach((row) => {
        sheet.addRow(row);
      });

      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' },
      };

      const filename = `payments-${startD}-${endD}.xlsx`;
      const filepath = path.join(exportsDir, filename);
      await workbook.xlsx.writeFile(filepath);
      res.download(filepath, filename);
    } else if (format === 'csv') {
      let csv = 'Date,Quittance,Montant,Méthode,Statut,Locataire,Local,Propriété\n';
      result.rows.forEach((row) => {
        csv += `${row.paid_at},"${row.receipt_number}",${row.amount},"${row.payment_method}","${row.status}","${row.tenant_name}","${row.unit_number}","${row.property_name}"\n`;
      });

      const filename = `payments-${startD}-${endD}.csv`;
      const filepath = path.join(exportsDir, filename);
      fs.writeFileSync(filepath, csv, 'utf-8');
      res.download(filepath, filename);
    }
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
});

/**
 * POST /api/export/arrears-report
 * Exporte le rapport des arriérés
 */
router.post('/arrears-report', requireAuth, authorize(['admin', 'owner', 'manager']), async (req, res) => {
  try {
    const { format = 'excel' } = req.body;

    const result = await pool.query(
      `SELECT 
        pr.id, pr.month, pr.year, pr.due_date, pr.amount_due, pr.amount_paid,
        pr.balance, pr.status,
        t.name as tenant_name, t.phone as tenant_phone,
        u.unit_number, prop.name as property_name,
        EXTRACT(DAY FROM NOW() - pr.due_date) as days_overdue
       FROM payment_reports pr
       LEFT JOIN users t ON pr.tenant_id = t.id
       LEFT JOIN units u ON (SELECT unit_id FROM contracts WHERE id = pr.contract_id LIMIT 1) = u.id
       LEFT JOIN properties prop ON pr.property_id = prop.id
       WHERE pr.balance > 0
       ORDER BY pr.balance DESC`
    );

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Arriérés');

      sheet.columns = [
        { header: 'Période', key: 'period', width: 12 },
        { header: 'Montant Dû', key: 'amount_due', width: 12 },
        { header: 'Montant Payé', key: 'amount_paid', width: 12 },
        { header: 'Balance', key: 'balance', width: 12 },
        { header: 'Jours Retard', key: 'days_overdue', width: 12 },
        { header: 'Locataire', key: 'tenant_name', width: 20 },
        { header: 'Téléphone', key: 'tenant_phone', width: 15 },
        { header: 'Local', key: 'unit_number', width: 12 },
        { header: 'Propriété', key: 'property_name', width: 25 },
        { header: 'Statut', key: 'status', width: 12 },
      ];

      result.rows.forEach((row) => {
        sheet.addRow({
          period: `${row.month}/${row.year}`,
          amount_due: row.amount_due,
          amount_paid: row.amount_paid,
          balance: row.balance,
          days_overdue: row.days_overdue,
          tenant_name: row.tenant_name,
          tenant_phone: row.tenant_phone,
          unit_number: row.unit_number,
          property_name: row.property_name,
          status: row.status,
        });
      });

      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC00000' },
      };

      const filename = `arrears-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      const filepath = path.join(exportsDir, filename);
      await workbook.xlsx.writeFile(filepath);
      res.download(filepath, filename);
    }
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
});

/**
 * POST /api/export/monthly-report
 * Exporte le rapport mensuel complet
 */
router.post('/monthly-report', requireAuth, authorize(['admin', 'owner', 'manager']), async (req, res) => {
  try {
    const { month, year, property_id = '' } = req.body;

    let whereClause = 'pr.month = $1 AND pr.year = $2';
    const queryParams = [month, year];

    if (property_id) {
      queryParams.push(Number(property_id));
      whereClause += ` AND pr.property_id = $${queryParams.length}`;
    }

    const result = await pool.query(
      `SELECT 
        prop.name as property_name, prop.address, prop.city,
        COUNT(pr.id) as payment_count,
        COALESCE(SUM(pr.amount_due), 0) as expected_revenue,
        COALESCE(SUM(pr.amount_paid), 0) as collected_revenue,
        COALESCE(SUM(pr.balance), 0) as pending_balance,
        COUNT(CASE WHEN pr.status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN pr.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN pr.status = 'overdue' THEN 1 END) as overdue_count
       FROM payment_reports pr
       LEFT JOIN properties prop ON pr.property_id = prop.id
       WHERE ${whereClause}
       GROUP BY prop.name, prop.address, prop.city
       ORDER BY prop.name`,
      queryParams
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Rapport Mensuel');

    // Ajouter le titre
    sheet.mergeCells('A1:J1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `RAPPORT MENSUEL - ${month}/${year}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Headers
    sheet.columns = [
      { header: 'Propriété', key: 'property_name', width: 25 },
      { header: 'Adresse', key: 'address', width: 30 },
      { header: 'Ville', key: 'city', width: 15 },
      { header: 'Revenus Attendus', key: 'expected_revenue', width: 15 },
      { header: 'Revenus Collectés', key: 'collected_revenue', width: 15 },
      { header: 'En Attente', key: 'pending_balance', width: 15 },
      { header: 'Payés', key: 'paid_count', width: 10 },
      { header: 'En Attente', key: 'pending_count', width: 10 },
      { header: 'Retardés', key: 'overdue_count', width: 10 },
    ];

    result.rows.forEach((row) => {
      sheet.addRow(row);
    });

    sheet.getRow(2).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    const filename = `monthly-report-${month}-${year}.xlsx`;
    const filepath = path.join(exportsDir, filename);
    await workbook.xlsx.writeFile(filepath);
    res.download(filepath, filename);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
});

module.exports = router;

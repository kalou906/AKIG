/**
 * 📊 Service Rapports Fiscaux - ImmobilierLoyer
 * Génère déclarations fiscales et rapports financiers
 * Devise: GNF (Franc Guinéen) + EUR/USD conversion
 */

const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class FiscalReportService {
  constructor(pool) {
    this.pool = pool;
    this.exportDir = path.join(__dirname, '../../exports/fiscal');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  /**
   * 📋 Générer rapport fiscal annuel
   */
  async generateFiscalReport(landlordId, year) {
    try {
      console.log(`📊 Génération rapport fiscal ${year} pour propriétaire ${landlordId}`);

      // 1. Revenus locatifs bruts
      const incomeResult = await this.pool.query(`
        SELECT 
          COUNT(DISTINCT rc.id) as active_contracts,
          SUM(rc.monthly_rent * 12) as annual_rent_expected,
          SUM(
            COALESCE((SELECT SUM(amount_gnf) FROM payments py 
              WHERE py.contract_id = rc.id 
              AND EXTRACT(YEAR FROM py.date) = $2), 0)
          ) as annual_rent_collected,
          SUM(COALESCE((SELECT SUM(amount_gnf) FROM contract_charges cc
            WHERE cc.contract_id = rc.id 
            AND EXTRACT(YEAR FROM cc.start_date) = $2), 0)) as total_charges
        FROM rental_contracts rc
        WHERE rc.landlord_id = $1 AND rc.status IN ('active', 'terminated')
      `, [landlordId, year]);

      const income = incomeResult.rows[0];

      // 2. Dépenses déductibles
      const expensesResult = await this.pool.query(`
        SELECT 
          SUM(CASE WHEN type = 'maintenance' THEN amount_gnf ELSE 0 END) as maintenance,
          SUM(CASE WHEN type = 'repairs' THEN amount_gnf ELSE 0 END) as repairs,
          SUM(CASE WHEN type = 'insurance' THEN amount_gnf ELSE 0 END) as insurance,
          SUM(CASE WHEN type = 'property_tax' THEN amount_gnf ELSE 0 END) as property_tax,
          SUM(CASE WHEN type = 'agency_fee' THEN amount_gnf ELSE 0 END) as agency_fee,
          SUM(amount_gnf) as total_expenses
        FROM rental_expenses
        WHERE landlord_id = $1 AND EXTRACT(YEAR FROM expense_date) = $2
      `, [landlordId, year]);

      const expenses = expensesResult.rows[0] || {};

      // 3. Revenus nets imposables
      const rentCollected = parseFloat(income.annual_rent_collected) || 0;
      const totalExpenses = parseFloat(expenses.total_expenses) || 0;
      const netIncome = rentCollected - totalExpenses;

      // 4. Taxes (exemple: 15% pour Guinée)
      const taxRate = 0.15;
      const estimatedTax = Math.round(netIncome * taxRate);

      // 5. Regrouper par propriété
      const propertyResult = await this.pool.query(`
        SELECT 
          p.reference as property_ref,
          p.title,
          p.type,
          p.address,
          COUNT(rc.id) as num_contracts,
          SUM(rc.monthly_rent * 12) as expected_annual_rent,
          SUM(COALESCE((SELECT SUM(amount_gnf) FROM payments py 
            WHERE py.contract_id = rc.id 
            AND EXTRACT(YEAR FROM py.date) = $2), 0)) as collected_rent
        FROM rental_contracts rc
        JOIN properties p ON rc.property_id = p.id
        WHERE rc.landlord_id = $1 AND rc.status IN ('active', 'terminated')
        GROUP BY p.id, p.reference, p.title, p.type, p.address
      `, [landlordId, year]);

      const report = {
        landlordId,
        year,
        generatedAt: new Date(),
        income: {
          activeContracts: income.active_contracts,
          expectedAnnualRent: Math.round(parseFloat(income.annual_rent_expected) * 100) / 100,
          collectedAnnualRent: Math.round(rentCollected * 100) / 100,
          totalCharges: Math.round(parseFloat(income.total_charges) * 100) / 100
        },
        expenses: {
          maintenance: Math.round((expenses.maintenance || 0) * 100) / 100,
          repairs: Math.round((expenses.repairs || 0) * 100) / 100,
          insurance: Math.round((expenses.insurance || 0) * 100) / 100,
          propertyTax: Math.round((expenses.property_tax || 0) * 100) / 100,
          agencyFee: Math.round((expenses.agency_fee || 0) * 100) / 100,
          totalExpenses: Math.round(totalExpenses * 100) / 100
        },
        netIncome: Math.round(netIncome * 100) / 100,
        tax: {
          rate: taxRate,
          estimatedAmount: estimatedTax,
          netAfterTax: Math.round((netIncome - estimatedTax) * 100) / 100
        },
        properties: propertyResult.rows
      };

      return report;
    } catch (err) {
      console.error('❌ Erreur génération rapport fiscal:', err.message);
      throw err;
    }
  }

  /**
   * 📄 Exporter rapport en PDF
   */
  async exportFiscalReportPDF(landlordId, year) {
    try {
      const report = await this.generateFiscalReport(landlordId, year);

      const doc = new PDFDocument();
      const filename = `rapport_fiscal_${landlordId}_${year}.pdf`;
      const filepath = path.join(this.exportDir, filename);

      doc.pipe(fs.createWriteStream(filepath));

      // En-tête
      doc.fontSize(20).text('📊 RAPPORT FISCAL ANNUEL', 100, 50);
      doc.fontSize(12).text(`Année: ${year}`, 100, 80);
      doc.text(`Généré: ${new Date().toLocaleDateString('fr-FR')}`, 100, 100);

      // Section Revenus
      doc.fontSize(14).text('💰 REVENUS LOCATIFS', 100, 140);
      doc.fontSize(10)
        .text(`Contrats actifs: ${report.income.activeContracts}`, 120, 165)
        .text(`Loyers attendus: ${report.income.expectedAnnualRent} GNF`, 120, 185)
        .text(`Loyers collectés: ${report.income.collectedAnnualRent} GNF`, 120, 205)
        .text(`Charges totales: ${report.income.totalCharges} GNF`, 120, 225);

      // Section Dépenses
      doc.fontSize(14).text('📉 DÉPENSES DÉDUCTIBLES', 100, 260);
      doc.fontSize(10)
        .text(`Maintenance: ${report.expenses.maintenance} GNF`, 120, 285)
        .text(`Réparations: ${report.expenses.repairs} GNF`, 120, 305)
        .text(`Assurance: ${report.expenses.insurance} GNF`, 120, 325)
        .text(`Taxe foncière: ${report.expenses.propertyTax} GNF`, 120, 345)
        .text(`Frais agence: ${report.expenses.agencyFee} GNF`, 120, 365)
        .text(`Total: ${report.expenses.totalExpenses} GNF`, 120, 385);

      // Section Résultat
      doc.fontSize(14).text('📊 RÉSULTAT NET', 100, 420);
      doc.fontSize(10)
        .text(`Revenu net (avant impôt): ${report.netIncome} GNF`, 120, 445)
        .text(`Taux d'impôt: ${(report.tax.rate * 100).toFixed(1)}%`, 120, 465)
        .text(`Impôt estimé: ${report.tax.estimatedAmount} GNF`, 120, 485)
        .text(`Revenu net (après impôt): ${report.tax.netAfterTax} GNF`, 120, 505);

      // Détail par propriété
      doc.fontSize(14).text('🏠 DÉTAIL PAR PROPRIÉTÉ', 100, 540);
      let yPos = 570;
      
      for (const prop of report.properties) {
        doc.fontSize(10)
          .text(`${prop.property_ref} - ${prop.title}`, 120, yPos)
          .text(`  Type: ${prop.type} | Contrats: ${prop.num_contracts}`, 130, yPos + 20)
          .text(`  Loyers: ${prop.collected_rent} / ${prop.expected_annual_rent} GNF`, 130, yPos + 40);
        yPos += 70;

        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
      }

      doc.end();

      return {
        success: true,
        filename,
        filepath,
        size: fs.statSync(filepath).size
      };
    } catch (err) {
      console.error('❌ Erreur export PDF fiscal:', err.message);
      throw err;
    }
  }

  /**
   * 📊 Exporter rapport en Excel
   */
  async exportFiscalReportExcel(landlordId, year) {
    try {
      const report = await this.generateFiscalReport(landlordId, year);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Rapport Fiscal');

      // Styles
      const headerStyle = {
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      // En-tête
      worksheet.merge('A1:D1');
      worksheet.getCell('A1').value = `Rapport Fiscal ${year}`;
      worksheet.getCell('A1').font = { bold: true, size: 14 };

      // Section Revenus
      worksheet.getCell('A3').value = 'REVENUS LOCATIFS';
      worksheet.getCell('A3').font = { bold: true };

      worksheet.columns = [
        { header: 'Catégorie', key: 'category', width: 25 },
        { header: 'Valeur', key: 'value', width: 20 },
        { header: 'GNF', key: 'currency', width: 10 },
      ];

      worksheet.addRow({ 
        category: 'Contrats actifs', 
        value: report.income.activeContracts,
        currency: '-'
      });

      worksheet.addRow({ 
        category: 'Loyers attendus', 
        value: report.income.expectedAnnualRent,
        currency: 'GNF'
      });

      worksheet.addRow({ 
        category: 'Loyers collectés', 
        value: report.income.collectedAnnualRent,
        currency: 'GNF'
      });

      worksheet.addRow({ 
        category: 'Charges', 
        value: report.income.totalCharges,
        currency: 'GNF'
      });

      worksheet.addRows([
        { category: '', value: '', currency: '' },
        { category: 'DÉPENSES DÉDUCTIBLES', value: '', currency: '' }
      ]);

      worksheet.addRow({ 
        category: 'Maintenance', 
        value: report.expenses.maintenance,
        currency: 'GNF'
      });

      worksheet.addRow({ 
        category: 'Réparations', 
        value: report.expenses.repairs,
        currency: 'GNF'
      });

      worksheet.addRow({ 
        category: 'Assurance', 
        value: report.expenses.insurance,
        currency: 'GNF'
      });

      worksheet.addRow({ 
        category: 'Total Dépenses', 
        value: report.expenses.totalExpenses,
        currency: 'GNF'
      });

      worksheet.addRows([
        { category: '', value: '', currency: '' },
        { category: 'RÉSULTAT NET', value: '', currency: '' }
      ]);

      worksheet.addRow({ 
        category: 'Revenu net', 
        value: report.netIncome,
        currency: 'GNF'
      });

      worksheet.addRow({ 
        category: `Impôt (${(report.tax.rate * 100).toFixed(1)}%)`, 
        value: report.tax.estimatedAmount,
        currency: 'GNF'
      });

      worksheet.addRow({ 
        category: 'Revenu net après impôt', 
        value: report.tax.netAfterTax,
        currency: 'GNF'
      });

      const filename = `rapport_fiscal_${landlordId}_${year}.xlsx`;
      const filepath = path.join(this.exportDir, filename);

      await workbook.xlsx.writeFile(filepath);

      return {
        success: true,
        filename,
        filepath,
        size: fs.statSync(filepath).size
      };
    } catch (err) {
      console.error('❌ Erreur export Excel fiscal:', err.message);
      throw err;
    }
  }

  /**
   * 📈 Rapport financier multi-années
   */
  async getMultiYearReport(landlordId, startYear, endYear) {
    try {
      const reports = [];

      for (let year = startYear; year <= endYear; year++) {
        const report = await this.generateFiscalReport(landlordId, year);
        reports.push({
          year,
          netIncome: report.netIncome,
          totalExpenses: report.expenses.totalExpenses,
          collectedRent: report.income.collectedAnnualRent,
          estimatedTax: report.tax.estimatedAmount
        });
      }

      // Totaux
      const totalIncome = reports.reduce((sum, r) => sum + r.collectedRent, 0);
      const totalExpenses = reports.reduce((sum, r) => sum + r.totalExpenses, 0);
      const totalNetIncome = reports.reduce((sum, r) => sum + r.netIncome, 0);
      const totalTax = reports.reduce((sum, r) => sum + r.estimatedTax, 0);

      return {
        period: { startYear, endYear },
        yearsReports: reports,
        totals: {
          collectedRent: Math.round(totalIncome * 100) / 100,
          expenses: Math.round(totalExpenses * 100) / 100,
          netIncome: Math.round(totalNetIncome * 100) / 100,
          estimatedTax: totalTax,
          averageYearlyIncome: Math.round((totalNetIncome / (endYear - startYear + 1)) * 100) / 100
        }
      };
    } catch (err) {
      console.error('❌ Erreur rapport multi-années:', err.message);
      throw err;
    }
  }

  /**
   * 🔍 Audit trail fiscal
   */
  async getFiscalAudit(landlordId, year) {
    try {
      const result = await this.pool.query(`
        SELECT 
          id, user_id, action, entity_type, entity_id,
          old_values, new_values, created_at
        FROM audit_logs
        WHERE user_id = $1 
          AND EXTRACT(YEAR FROM created_at) = $2
          AND entity_type IN ('rental_contract', 'payment', 'rental_expense')
        ORDER BY created_at DESC
      `, [landlordId, year]);

      return result.rows;
    } catch (err) {
      console.error('❌ Erreur audit fiscal:', err.message);
      throw err;
    }
  }
}

module.exports = FiscalReportService;

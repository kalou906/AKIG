/**
 * 📤 Service Export Universel - AKIG
 * 
 * Gestion centralisée exports PDF, Excel, CSV
 * ✅ Blob correctement géré
 * ✅ Téléchargement correct
 * ✅ Tous les formats supportés
 */

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const stream = require('stream');

class UniversalExportService {
  constructor() {
    this.exportDir = path.join(__dirname, '../../exports');
    this.ensureExportDir();
  }

  ensureExportDir() {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  /**
   * Générer PDF - Retourner Buffer (blob)
   */
  async generatePDF(title, data, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const pdf = new PDFDocument({
          size: options.size || 'A4',
          margin: options.margin || 50
        });

        // Accumulator pour buffer
        const chunks = [];
        pdf.on('data', chunk => chunks.push(chunk));
        pdf.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            filename: options.filename || `${title}-${Date.now()}.pdf`,
            contentType: 'application/pdf'
          });
        });
        pdf.on('error', reject);

        // Header
        pdf.fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
        pdf.moveDown();

        // Date
        pdf.fontSize(10).font('Helvetica').text(`Généré: ${new Date().toLocaleString('fr-FR')}`, { align: 'right' });
        pdf.moveDown();

        // Content
        if (typeof data === 'string') {
          pdf.fontSize(12).text(data);
        } else if (Array.isArray(data)) {
          this._addTableToPDF(pdf, data, options);
        } else if (typeof data === 'object') {
          this._addObjectToPDF(pdf, data, options);
        }

        // Footer
        pdf.fontSize(8).text(`© AKIG 2025 - Système Immobilier Guinée`, { align: 'center' }, pdf.page.height - 30);

        pdf.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Ajouter table au PDF
   */
  _addTableToPDF(pdf, data, options) {
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    const columnWidth = (pdf.page.width - 100) / columns.length;

    // Headers
    pdf.fontSize(10).font('Helvetica-Bold');
    columns.forEach(col => {
      pdf.text(col, { width: columnWidth, continued: true });
    });
    pdf.moveDown();

    // Rows
    pdf.font('Helvetica').fontSize(9);
    data.forEach(row => {
      columns.forEach(col => {
        const value = row[col] || '';
        pdf.text(String(value).substring(0, 20), { width: columnWidth, continued: true });
      });
      pdf.moveDown();
    });
  }

  /**
   * Ajouter objet au PDF
   */
  _addObjectToPDF(pdf, obj, options) {
    pdf.fontSize(12).font('Helvetica');
    Object.entries(obj).forEach(([key, value]) => {
      pdf.text(`${key}: ${value}`);
      pdf.moveDown(0.5);
    });
  }

  /**
   * Générer Excel - Retourner Buffer (blob)
   */
  async generateExcel(title, data, options = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(options.sheetName || title);

      // Add title row
      if (options.addTitle) {
        worksheet.mergeCells('A1', `H1`);
        worksheet.getCell('A1').value = title;
        worksheet.getCell('A1').font = { bold: true, size: 14 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };
        worksheet.addRow([]);
      }

      // Add headers
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);

        // Style headers
        worksheet.getRow(options.addTitle ? 3 : 1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(options.addTitle ? 3 : 1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };

        // Add data rows
        data.forEach(row => {
          worksheet.addRow(Object.values(row));
        });

        // Auto-fit columns
        headers.forEach((header, idx) => {
          worksheet.getColumn(idx + 1).width = 15;
        });
      } else if (typeof data === 'object') {
        // Si données simple clé-valeur
        Object.entries(data).forEach(([key, value]) => {
          worksheet.addRow([key, value]);
        });
      }

      // Write to buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return {
        buffer,
        filename: options.filename || `${title}-${Date.now()}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    } catch (error) {
      throw new Error(`Erreur Excel: ${error.message}`);
    }
  }

  /**
   * Générer CSV - Retourner Buffer (blob)
   */
  async generateCSV(title, data, options = {}) {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('CSV nécessite un array de données');
      }

      const csv = new Parser({
        fields: Object.keys(data[0]),
        delimiter: options.delimiter || ',',
        header: true
      }).parse(data);

      const buffer = Buffer.from(csv, 'utf-8');
      return {
        buffer,
        filename: options.filename || `${title}-${Date.now()}.csv`,
        contentType: 'text/csv'
      };
    } catch (error) {
      throw new Error(`Erreur CSV: ${error.message}`);
    }
  }

  /**
   * Exporter multiples formats à la fois
   */
  async exportMultiple(title, data, formats = ['pdf', 'excel', 'csv']) {
    const results = {};

    try {
      if (formats.includes('pdf')) {
        results.pdf = await this.generatePDF(title, data);
      }
      if (formats.includes('excel') || formats.includes('xlsx')) {
        results.excel = await this.generateExcel(title, data);
      }
      if (formats.includes('csv')) {
        results.csv = await this.generateCSV(title, data);
      }
      return results;
    } catch (error) {
      throw new Error(`Erreur export multiple: ${error.message}`);
    }
  }

  /**
   * Créer réponse HTTP avec blob pour téléchargement
   */
  createDownloadResponse(res, buffer, filename, contentType) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    
    // IMPORTANT: Envoyer directement le buffer
    return res.end(buffer);
  }

  /**
   * Sauvegarder fichier sur disque
   */
  async saveFile(filename, buffer) {
    const filepath = path.join(this.exportDir, filename);
    return new Promise((resolve, reject) => {
      fs.writeFile(filepath, buffer, (err) => {
        if (err) reject(err);
        else resolve(filepath);
      });
    });
  }

  /**
   * Lister fichiers exportés
   */
  listExports() {
    try {
      const files = fs.readdirSync(this.exportDir);
      return files.map(file => {
        const filepath = path.join(this.exportDir, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          type: path.extname(file)
        };
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Nettoyer fichiers anciens (>7 jours)
   */
  cleanupOldFiles(daysOld = 7) {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const files = fs.readdirSync(this.exportDir);
    
    files.forEach(file => {
      const filepath = path.join(this.exportDir, file);
      const stats = fs.statSync(filepath);
      
      if (stats.birthtime.getTime() < cutoffTime) {
        fs.unlinkSync(filepath);
      }
    });
  }
}

module.exports = new UniversalExportService();

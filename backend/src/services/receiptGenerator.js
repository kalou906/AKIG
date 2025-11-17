/**
 * Service: receiptGenerator.js
 * Génère les quittances de paiement en PDF avec tous les détails
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const pool = require('../db');

class ReceiptGenerator {
  /**
   * Génère une quittance de paiement en PDF
   * @param {Object} paymentData - Données du paiement
   * @returns {Promise<string>} - Chemin du fichier PDF généré
   */
  static async generatePaymentReceipt(paymentData) {
    try {
      const {
        receipt_number,
        payment_id,
        contract_id,
        tenant_id,
        amount_paid,
        payment_date,
        payment_method,
        period_start_date,
        period_end_date,
        reference_number,
      } = paymentData;

      // Récupérer les informations détaillées
      const tenantResult = await pool.query(
        'SELECT id, name, email, phone, address, city, postal_code FROM users WHERE id = $1',
        [tenant_id]
      );
      const tenant = tenantResult.rows[0];

      const contractResult = await pool.query(
        `SELECT c.*, u.name as unit_name, p.name as property_name, p.address, p.city 
         FROM contracts c 
         LEFT JOIN units u ON c.unit_id = u.id
         LEFT JOIN properties p ON c.property_id = p.id
         WHERE c.id = $1`,
        [contract_id]
      );
      const contract = contractResult.rows[0];

      // Créer le répertoire des quittances s'il n'existe pas
      const receiptsDir = path.join(__dirname, '..', '..', 'receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      // Créer le document PDF
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
      });

      const filename = `${receipt_number}-${new Date().getTime()}.pdf`;
      const filepath = path.join(receiptsDir, filename);
      const writeStream = fs.createWriteStream(filepath);

      doc.pipe(writeStream);

      // En-tête professionnel
      this.addHeader(doc);

      // Titre
      doc.fontSize(24).font('Helvetica-Bold').text('QUITTANCE DE PAIEMENT', 50, 100);

      // Numéro et date
      doc.fontSize(11)
        .font('Helvetica')
        .text(`Numéro: ${receipt_number}`, 50, 150)
        .text(`Date d'émission: ${new Date(payment_date).toLocaleDateString('fr-FR')}`, 50, 170);

      // Section tenant
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('LOCATAIRE:', 50, 210)
        .font('Helvetica')
        .fontSize(10)
        .text(`${tenant.name || 'N/A'}`, 50, 230)
        .text(`Email: ${tenant.email || 'N/A'}`, 50, 248)
        .text(`Téléphone: ${tenant.phone || 'N/A'}`, 50, 266)
        .text(`Adresse: ${tenant.address || 'N/A'}, ${tenant.city || 'N/A'} ${tenant.postal_code || ''}`, 50, 284);

      // Section propriété
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('PROPRIÉTÉ:', 300, 210)
        .font('Helvetica')
        .fontSize(10)
        .text(`${contract?.property_name || 'N/A'}`, 300, 230)
        .text(`Local: ${contract?.unit_name || 'N/A'}`, 300, 248)
        .text(`Adresse: ${contract?.address || 'N/A'}`, 300, 266)
        .text(`Ville: ${contract?.city || 'N/A'}`, 300, 284);

      // Section contrat
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('CONTRAT:', 50, 330)
        .font('Helvetica')
        .fontSize(10)
        .text(`ID Contrat: ${contract_id}`, 50, 350)
        .text(`Loyer mensuel: ${(contract?.monthly_rent || 0).toLocaleString('fr-FR')} GNF`, 50, 368);

      // Période du paiement
      if (period_start_date || period_end_date) {
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .text('PÉRIODE COUVERTE:', 50, 410)
          .font('Helvetica')
          .fontSize(10)
          .text(`Du: ${new Date(period_start_date).toLocaleDateString('fr-FR')}`, 50, 430)
          .text(`Au: ${new Date(period_end_date).toLocaleDateString('fr-FR')}`, 50, 448);
      }

      // Détails du paiement
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('DÉTAILS DU PAIEMENT:', 50, 490)
        .font('Helvetica')
        .fontSize(10);

      const tableTop = 510;
      const col1 = 50;
      const col2 = 300;

      doc.text('Montant payé:', col1, tableTop);
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text(`${amount_paid.toLocaleString('fr-FR')} GNF`, col2, tableTop);

      doc.fontSize(10)
        .font('Helvetica')
        .text('Mode de paiement:', col1, tableTop + 30)
        .text(this.formatPaymentMethod(payment_method), col2, tableTop + 30);

      if (reference_number) {
        doc.text('Référence:', col1, tableTop + 60).text(reference_number, col2, tableTop + 60);
      }

      // Statut
      doc.text('Statut:', col1, tableTop + 90).font('Helvetica-Bold').text('PAYÉ', col2, tableTop + 90);

      // Pied de page
      const pageHeight = doc.page.height;
      doc.fontSize(9)
        .font('Helvetica')
        .text('Cette quittance certifie que le paiement a été reçu. Veuillez la conserver pour vos dossiers.', 50, pageHeight - 100, {
          align: 'center',
          width: 495,
        })
        .text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 50, pageHeight - 50, {
          align: 'center',
          width: 495,
        });

      // Finaliser le document
      doc.end();

      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(filepath));
        writeStream.on('error', reject);
      });
    } catch (error) {
      console.error('Erreur lors de la génération de la quittance:', error);
      throw error;
    }
  }

  /**
   * Génère un reçu de caution
   * @param {Object} depositData - Données du dépôt
   * @returns {Promise<string>} - Chemin du fichier PDF généré
   */
  static async generateDepositReceipt(depositData) {
    try {
      const {
        receipt_number,
        contract_id,
        tenant_id,
        amount,
        received_date,
        payment_method,
        reference_number,
      } = depositData;

      // Récupérer les informations détaillées
      const tenantResult = await pool.query(
        'SELECT id, name, email, phone, address, city, postal_code FROM users WHERE id = $1',
        [tenant_id]
      );
      const tenant = tenantResult.rows[0];

      const contractResult = await pool.query(
        `SELECT c.*, u.name as unit_name, p.name as property_name, p.address, p.city, o.name as owner_name
         FROM contracts c 
         LEFT JOIN units u ON c.unit_id = u.id
         LEFT JOIN properties p ON c.property_id = p.id
         LEFT JOIN users o ON p.owner_id = o.id
         WHERE c.id = $1`,
        [contract_id]
      );
      const contract = contractResult.rows[0];

      // Créer le répertoire des quittances s'il n'existe pas
      const receiptsDir = path.join(__dirname, '..', '..', 'receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      // Créer le document PDF
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
      });

      const filename = `${receipt_number}-${new Date().getTime()}.pdf`;
      const filepath = path.join(receiptsDir, filename);
      const writeStream = fs.createWriteStream(filepath);

      doc.pipe(writeStream);

      // En-tête professionnel
      this.addHeader(doc);

      // Titre
      doc.fontSize(24).font('Helvetica-Bold').text('REÇU DE CAUTION', 50, 100);

      // Numéro et date
      doc.fontSize(11)
        .font('Helvetica')
        .text(`Numéro: ${receipt_number}`, 50, 150)
        .text(`Date de réception: ${new Date(received_date).toLocaleDateString('fr-FR')}`, 50, 170);

      // Section tenant
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('LOCATAIRE:', 50, 210)
        .font('Helvetica')
        .fontSize(10)
        .text(`${tenant.name || 'N/A'}`, 50, 230)
        .text(`Email: ${tenant.email || 'N/A'}`, 50, 248)
        .text(`Téléphone: ${tenant.phone || 'N/A'}`, 50, 266)
        .text(`Adresse: ${tenant.address || 'N/A'}, ${tenant.city || 'N/A'} ${tenant.postal_code || ''}`, 50, 284);

      // Section propriétaire
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('PROPRIÉTAIRE:', 300, 210)
        .font('Helvetica')
        .fontSize(10)
        .text(`${contract?.owner_name || 'N/A'}`, 300, 230)
        .text(`Propriété: ${contract?.property_name || 'N/A'}`, 300, 248)
        .text(`Local: ${contract?.unit_name || 'N/A'}`, 300, 266);

      // Détails de la caution
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('DÉTAILS DE LA CAUTION:', 50, 330)
        .font('Helvetica')
        .fontSize(10);

      const tableTop = 360;
      const col1 = 50;
      const col2 = 300;

      doc.text('Montant de la caution:', col1, tableTop);
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text(`${amount.toLocaleString('fr-FR')} GNF`, col2, tableTop);

      doc.fontSize(10)
        .font('Helvetica')
        .text('Mode de paiement:', col1, tableTop + 30)
        .text(this.formatPaymentMethod(payment_method), col2, tableTop + 30);

      if (reference_number) {
        doc.text('Référence:', col1, tableTop + 60).text(reference_number, col2, tableTop + 60);
      }

      // Statut
      doc.text('Statut:', col1, tableTop + 90)
        .font('Helvetica-Bold')
        .text('CONSERVÉE EN DÉPÔT', col2, tableTop + 90)
        .font('Helvetica');

      // Conditions importantes
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('CONDITIONS IMPORTANTES:', 50, tableTop + 150);

      doc.fontSize(9)
        .font('Helvetica')
        .text(
          '• Cette caution sera conservée pendant toute la durée du contrat de location.',
          50,
          tableTop + 175
        )
        .text(
          '• La caution sera restituée à la fin du contrat, déduction faite des éventuels dégâts ou arriérés de loyer.',
          50,
          tableTop + 200
        )
        .text(
          '• Le locataire doit conserver ce reçu comme preuve du dépôt de la caution.',
          50,
          tableTop + 225
        );

      // Pied de page
      const pageHeight = doc.page.height;
      doc.fontSize(9)
        .font('Helvetica')
        .text('Reçu officiel de caution de location. Veuillez le conserver pour vos dossiers.', 50, pageHeight - 100, {
          align: 'center',
          width: 495,
        })
        .text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 50, pageHeight - 50, {
          align: 'center',
          width: 495,
        });

      // Finaliser le document
      doc.end();

      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(filepath));
        writeStream.on('error', reject);
      });
    } catch (error) {
      console.error('Erreur lors de la génération du reçu de caution:', error);
      throw error;
    }
  }

  /**
   * Ajoute un en-tête professionnel au document
   */
  static addHeader(doc) {
    // Titre du système
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text('AKIG - Gestion de Propriétés', 50, 20, {
        width: 495,
        align: 'center',
      });

    // Sous-titre
    doc.fontSize(10)
      .font('Helvetica')
      .text('Système de gestion complète de locations immobilières', 50, 37, {
        width: 495,
        align: 'center',
      })
      .moveTo(50, 55)
      .lineTo(545, 55)
      .stroke();
  }

  /**
   * Formate le mode de paiement
   */
  static formatPaymentMethod(method) {
    const methods = {
      cash: 'Espèces',
      bank_transfer: 'Virement bancaire',
      check: 'Chèque',
      card: 'Carte bancaire',
      online: 'Paiement en ligne',
      other: 'Autre',
    };
    return methods[method] || method;
  }

  /**
   * Génère un rapport de paiement pour une période
   */
  static async generatePaymentReport(contractId, month, year) {
    try {
      const result = await pool.query(
        `SELECT pr.*, c.monthly_rent, u.name as unit_name, t.name as tenant_name
         FROM payment_reports pr
         LEFT JOIN contracts c ON pr.contract_id = c.id
         LEFT JOIN units u ON c.unit_id = u.id
         LEFT JOIN users t ON pr.tenant_id = t.id
         WHERE pr.contract_id = $1 AND pr.month = $2 AND pr.year = $3`,
        [contractId, month, year]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      throw error;
    }
  }
}

module.exports = ReceiptGenerator;

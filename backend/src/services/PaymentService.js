/**
 * 💳 Service Paiement & Génération Reçus
 * Gestion des paiements de loyers et génération de documents PDF
 */

const Payment = require('../models/Payment');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PaymentService {
  constructor(pool) {
    this.pool = pool;
    this.pdfDir = path.join(process.cwd(), 'exports', 'receipts');
    this.ensureReceiptDirectory();
  }

  ensureReceiptDirectory() {
    if (!fs.existsSync(this.pdfDir)) {
      fs.mkdirSync(this.pdfDir, { recursive: true });
    }
  }

  /**
   * Enregistrer un paiement
   */
  async recordPayment(data) {
    try {
      const payment = new Payment(data);
      const validation = payment.validate();
      
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const query = `
        INSERT INTO payments (
          reference, transaction_id, date, due_date, recorded_date,
          amount_gross, amount_deductions, amount_net, amount_fees, amount_actual,
          contract_id, contract_reference, tenant_id, tenant_name,
          landlord_id, landlord_name, property_id, property_title,
          period, description, payment_method, payment_gateway,
          account_number, account_holder, payment_reference, cheque_number, cheque_bank,
          status, applied_to, applied_amount, remaining_amount, application_date,
          verified, verified_by, verification_date, verification_notes,
          receipt_issued, receipt_number, created_by, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17, $18,
          $19, $20, $21, $22,
          $23, $24, $25, $26, $27,
          $28, $29, $30, $31, $32,
          $33, $34, $35, $36,
          $37, $38, $39, $40
        ) RETURNING *
      `;

      const values = [
        data.reference || `PAYM-${Date.now()}`,
        data.transactionId,
        data.date || new Date(),
        data.dueDate,
        new Date(),
        payment.amount.gross,
        payment.amount.deductions,
        payment.amount.net,
        payment.amount.fees,
        payment.amount.actualAmount,
        payment.details.contractId,
        payment.details.contractReference,
        payment.details.tenantId,
        payment.details.tenantName,
        payment.details.landlordId,
        payment.details.landlordName,
        payment.details.propertyId,
        payment.details.propertyTitle,
        payment.details.period,
        payment.details.description,
        payment.paymentMethod.type,
        payment.paymentMethod.gateway,
        payment.paymentMethod.accountNumber,
        payment.paymentMethod.accountHolder,
        payment.paymentMethod.reference,
        payment.paymentMethod.chequeNumber,
        payment.paymentMethod.chequeBank,
        'pending',
        'current_rent',
        0,
        payment.amount.gross,
        new Date(),
        false,
        null,
        null,
        null,
        false,
        null,
        data.createdBy || 'system',
        new Date()
      ];

      const result = await this.pool.query(query, values);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('❌ Erreur enregistrement paiement:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Appliquer un paiement à un contrat
   */
  async applyPayment(paymentId, contractId, appliedBy) {
    try {
      // Obtenir le paiement
      const paymentQuery = 'SELECT * FROM payments WHERE id = $1';
      const paymentResult = await this.pool.query(paymentQuery, [paymentId]);
      if (!paymentResult.rows[0]) return { success: false, error: 'Paiement non trouvé' };

      const payment = paymentResult.rows[0];

      // Obtenir le contrat
      const contractQuery = 'SELECT * FROM rental_contracts WHERE id = $1';
      const contractResult = await this.pool.query(contractQuery, [contractId]);
      if (!contractResult.rows[0]) return { success: false, error: 'Contrat non trouvé' };

      const contract = contractResult.rows[0];

      // Appliquer le paiement
      const updatePaymentQuery = `
        UPDATE payments SET
          status = 'completed',
          applied_amount = $1,
          application_date = NOW(),
          applied_by = $2,
          verified = true,
          verified_date = NOW()
        WHERE id = $3
        RETURNING *
      `;

      await this.pool.query(updatePaymentQuery, [payment.amount_gross, appliedBy, paymentId]);

      // Mettre à jour le contrat
      const newArrears = Math.max(0, (contract.arrears || 0) - payment.amount_gross);
      const updateContractQuery = `
        UPDATE rental_contracts SET
          paid_amount = paid_amount + $1,
          outstanding_amount = outstanding_amount - $1,
          arrears = $2,
          last_payment_date = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const updatedContract = await this.pool.query(updateContractQuery, 
        [payment.amount_gross, newArrears, contractId]);

      return { success: true, data: { payment: payment, contract: updatedContract.rows[0] } };
    } catch (error) {
      console.error('❌ Erreur application paiement:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Générer un reçu PDF
   */
  async generateReceipt(paymentId) {
    try {
      const query = `
        SELECT p.*, 
               rc.tenant_name, rc.landlord_name, rc.property_title,
               rc.monthly_rent, c.full_name, c.email
        FROM payments p
        LEFT JOIN rental_contracts rc ON p.contract_id = rc.id
        LEFT JOIN clients c ON p.tenant_id = c.id
        WHERE p.id = $1
      `;

      const result = await this.pool.query(query, [paymentId]);
      if (!result.rows[0]) return { success: false, error: 'Paiement non trouvé' };

      const payment = result.rows[0];
      const receiptNumber = `RCP-${new Date().getFullYear()}-${String(payment.id).padStart(6, '0')}`;
      const receiptPath = path.join(this.pdfDir, `${receiptNumber}.pdf`);

      // Créer le PDF
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      const stream = fs.createWriteStream(receiptPath);
      doc.pipe(stream);

      // En-tête
      doc.fontSize(20).font('Helvetica-Bold').text('REÇU DE PAIEMENT', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('Agence Immobilière AKIG', { align: 'center' });
      doc.text('Guinée - Conakry', { align: 'center' });
      doc.moveTo(50, 100).lineTo(550, 100).stroke();

      // Infos paiement
      doc.fontSize(10).text(`Reçu N°: ${receiptNumber}`, 50);
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`);
      doc.text(`Montant: ${payment.amount_gross.toLocaleString('fr-FR')} GNF`);
      doc.text(`Devise: Franc Guinéen (GNF)`);

      doc.moveTo(50, 150).lineTo(550, 150).stroke();

      // Détails du paiement
      doc.fontSize(12).font('Helvetica-Bold').text('DÉTAILS DU PAIEMENT', 50, 160);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Contrat: ${payment.contract_reference || 'N/A'}`, 50, 185);
      doc.text(`Locataire: ${payment.tenant_name || 'N/A'}`);
      doc.text(`Propriété: ${payment.property_title || 'N/A'}`);
      doc.text(`Période: ${payment.period || 'N/A'}`);
      doc.text(`Méthode de paiement: ${payment.payment_method}`);

      doc.moveTo(50, 270).lineTo(550, 270).stroke();

      // Détails financiers
      doc.fontSize(12).font('Helvetica-Bold').text('DÉTAILS FINANCIERS', 50, 280);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Montant brut: ${payment.amount_gross.toLocaleString('fr-FR')} GNF`, 50, 305);
      if (payment.amount_deductions > 0) {
        doc.text(`Retenues: ${payment.amount_deductions.toLocaleString('fr-FR')} GNF`);
      }
      if (payment.amount_fees > 0) {
        doc.text(`Frais: ${payment.amount_fees.toLocaleString('fr-FR')} GNF`);
      }
      doc.fontSize(11).font('Helvetica-Bold').text(`Montant net: ${payment.amount_actual.toLocaleString('fr-FR')} GNF`);

      doc.moveTo(50, 380).lineTo(550, 380).stroke();

      // Signature
      doc.fontSize(10).font('Helvetica').text('Signé électroniquement', 50, 400);
      doc.text(`Le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 350);
      doc.text('Agence Immobilière AKIG', 350, 430);

      // Pied de page
      doc.fontSize(8).text('Ce reçu est établi à titre de justification de paiement.', 50, 750, { align: 'center' });
      doc.text('Veuillez conserver ce reçu.', { align: 'center' });

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          // Mettre à jour le paiement pour indiquer que le reçu a été généré
          this.pool.query(
            'UPDATE payments SET receipt_issued = true, receipt_number = $1 WHERE id = $2',
            [receiptNumber, paymentId]
          );
          resolve({ success: true, receiptPath, receiptNumber });
        });
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('❌ Erreur génération reçu PDF:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les paiements en retard
   */
  async getOverduePayments() {
    try {
      const query = `
        SELECT p.*, 
               EXTRACT(DAY FROM NOW() - p.due_date)::INTEGER as days_overdue
        FROM payments p
        WHERE p.status != 'completed'
        AND p.due_date < NOW()
        AND p.deleted_at IS NULL
        ORDER BY p.due_date ASC
      `;

      const result = await this.pool.query(query);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Erreur paiements en retard:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les statistiques de paiement
   */
  async getPaymentStats() {
    try {
      const query = `
        SELECT
          COUNT(*) as total_payments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
          SUM(amount_actual) as total_amount_collected,
          SUM(CASE WHEN status = 'pending' THEN amount_gross ELSE 0 END) as pending_amount,
          AVG(amount_gross) as avg_payment_amount
        FROM payments
        WHERE deleted_at IS NULL
      `;

      const result = await this.pool.query(query);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('❌ Erreur stats paiements:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Générer un rapport de paiements (PDF)
   */
  async generatePaymentReport(filters = {}) {
    try {
      let query = 'SELECT * FROM payments WHERE deleted_at IS NULL';
      
      if (filters.startDate) query += ` AND date >= '${filters.startDate}'`;
      if (filters.endDate) query += ` AND date <= '${filters.endDate}'`;
      if (filters.status) query += ` AND status = '${filters.status}'`;

      const result = await this.pool.query(query);
      const payments = result.rows;

      const reportPath = path.join(this.pdfDir, `rapport_paiements_${Date.now()}.pdf`);
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(reportPath);
      doc.pipe(stream);

      // En-tête
      doc.fontSize(16).font('Helvetica-Bold').text('RAPPORT DE PAIEMENTS', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`Agence Immobilière AKIG`, { align: 'center' });
      doc.text(`Période: ${filters.startDate || 'N/A'} à ${filters.endDate || 'N/A'}`, { align: 'center' });
      doc.moveTo(50, 100).lineTo(550, 100).stroke();

      let yPosition = 120;
      let totalAmount = 0;

      // Tableau des paiements
      payments.forEach(payment => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc.fontSize(9).text(
          `${payment.reference} | ${new Date(payment.date).toLocaleDateString('fr-FR')} | ${payment.amount_actual.toLocaleString('fr-FR')} GNF | ${payment.status}`,
          50, yPosition
        );
        yPosition += 15;
        totalAmount += payment.amount_actual;
      });

      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      doc.fontSize(11).font('Helvetica-Bold').text(`TOTAL: ${totalAmount.toLocaleString('fr-FR')} GNF`, 50, yPosition + 10);

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve({ success: true, reportPath });
        });
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('❌ Erreur rapport paiements:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = PaymentService;

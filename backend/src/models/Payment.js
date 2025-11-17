/**
 * 💳 Modèle Paiement & Transaction
 * Gestion complète des paiements de loyers (Guinée - GNF/USD)
 */

class Payment {
  constructor(data = {}) {
    this.id = data.id;
    this.reference = data.reference; // PAYM-2025-001
    this.transactionId = data.transactionId; // ID transaction externe
    
    // 📅 Dates
    this.date = data.date || new Date();
    this.dueDate = data.dueDate;
    this.recordedDate = data.recordedDate || new Date();

    // 💰 Montants (GNF)
    this.amount = {
      currency: 'GNF',
      gross: data.gross || 0, // Montant brut
      deductions: data.deductions || 0, // Retenues
      net: data.net || 0, // Montant net
      fees: data.fees || 0, // Frais transaction
      actualAmount: data.actualAmount || 0, // Montant reçu
    };

    // 📝 Détails du paiement
    this.details = {
      contractId: data.contractId,
      contractReference: data.contractReference,
      tenantId: data.tenantId,
      tenantName: data.tenantName,
      landlordId: data.landlordId,
      landlordName: data.landlordName,
      propertyId: data.propertyId,
      propertyTitle: data.propertyTitle,
      period: data.period, // Période couverte (ex: '2025-01')
      description: data.description || '',
    };

    // 💳 Méthode de paiement
    this.paymentMethod = {
      type: data.paymentMethod || 'bank_transfer', // bank_transfer, cash, cheque, mobile_money, card
      gateway: data.paymentGateway, // Ex: MTN_Momo, Orange_Money, Bank_XYZ
      accountNumber: data.accountNumber,
      accountHolder: data.accountHolder,
      reference: data.paymentReference,
      chequeNumber: data.chequeNumber,
      chequeBank: data.chequeBank,
    };

    // ✅ Status
    this.status = data.status || 'pending'; 
    // pending, processing, completed, failed, refunded, reversed, partially_applied

    // 📋 Appliquer au paiement
    this.application = {
      appliedTo: data.appliedTo || 'current_rent', // current_rent, arrears, utilities, taxes, deposit, other
      appliedAmount: data.appliedAmount || 0,
      remainingAmount: data.remainingAmount || 0,
      applicationDate: data.applicationDate,
      appliedBy: data.appliedBy, // User ID qui a appliqué le paiement
    };

    // 🔐 Verification
    this.verification = {
      verified: data.verified || false,
      verifiedBy: data.verifiedBy,
      verificationDate: data.verificationDate,
      verificationNotes: data.verificationNotes,
      bankStatement: data.bankStatement, // Lien vers relevé
      receiptIssued: data.receiptIssued || false,
      receiptNumber: data.receiptNumber,
    };

    // 📞 Contact & Communication
    this.communication = {
      confirmationSent: data.confirmationSent || false,
      confirmationDate: data.confirmationDate,
      receiptSent: data.receiptSent || false,
      receiptDate: data.receiptDate,
      contactMethod: data.contactMethod, // email, sms, whatsapp
      recipientEmail: data.recipientEmail,
      recipientPhone: data.recipientPhone,
    };

    // ⚠️ Alertes & Problèmes
    this.issues = {
      hasIssue: data.hasIssue || false,
      issueType: data.issueType, // missing_doc, incorrect_amount, bounced_cheque, fraud_risk
      issueDescription: data.issueDescription,
      resolution: data.resolution,
      resolvedDate: data.resolvedDate,
    };

    // 🔐 Audit
    this.audit = {
      createdAt: data.createdAt || new Date(),
      createdBy: data.createdBy,
      updatedAt: data.updatedAt || new Date(),
      updatedBy: data.updatedBy,
      deletedAt: data.deletedAt,
    };
  }

  // Vérifier si le paiement est en retard
  isLate() {
    if (!this.dueDate) return false;
    return new Date() > new Date(this.dueDate) && this.status === 'pending';
  }

  // Calculer le nombre de jours en retard
  getDaysLate() {
    if (!this.isLate()) return 0;
    const daysLate = Math.ceil((new Date() - new Date(this.dueDate)) / (1000 * 60 * 60 * 24));
    return daysLate;
  }

  // Convertir GNF en USD
  getAmountInUSD(rate = 0.000116) {
    return {
      gross: (this.amount.gross * rate).toFixed(2),
      net: (this.amount.net * rate).toFixed(2),
      actual: (this.amount.actualAmount * rate).toFixed(2),
    };
  }

  // Résumé pour affichage
  getSummary() {
    return {
      id: this.id,
      reference: this.reference,
      date: this.date,
      tenant: this.details.tenantName,
      property: this.details.propertyTitle,
      amount: this.amount.gross,
      currency: this.amount.currency,
      status: this.status,
      isLate: this.isLate(),
      daysLate: this.getDaysLate(),
      method: this.paymentMethod.type,
    };
  }

  // Valider avant traitement
  validate() {
    const errors = [];
    if (!this.details.contractId) errors.push('Contrat requis');
    if (!this.amount.gross || this.amount.gross <= 0) errors.push('Montant invalide');
    if (!this.dueDate) errors.push('Date d\'échéance requise');
    if (!this.paymentMethod.type) errors.push('Méthode de paiement requise');
    return { isValid: errors.length === 0, errors };
  }

  toJSON() {
    return {
      id: this.id,
      reference: this.reference,
      transactionId: this.transactionId,
      date: this.date,
      dueDate: this.dueDate,
      amount: this.amount,
      details: this.details,
      paymentMethod: this.paymentMethod,
      status: this.status,
      application: this.application,
      verification: this.verification,
      communication: this.communication,
      issues: this.issues,
      audit: this.audit,
    };
  }
}

module.exports = Payment;

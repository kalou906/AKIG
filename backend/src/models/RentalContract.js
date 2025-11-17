/**
 * 📋 Modèle Contrat de Location
 * Gestion complète des contrats de location immobilière (Guinée - GNF)
 */

class RentalContract {
  constructor(data = {}) {
    this.id = data.id;
    this.reference = data.reference; // CONT-2025-001
    this.number = data.number; // Numéro du contrat

    // 📅 Dates & Durée
    this.dates = {
      startDate: data.startDate,
      endDate: data.endDate,
      signedDate: data.signedDate || new Date(),
      renewalDate: data.renewalDate,
      terminationDate: data.terminationDate,
      duration: data.duration, // Mois (6, 12, 24, 36)
    };

    // 👥 Parties
    this.parties = {
      landlord: {
        id: data.landlordId,
        name: data.landlordName,
        phone: data.landlordPhone,
        email: data.landlordEmail,
      },
      tenant: {
        id: data.tenantId,
        name: data.tenantName,
        phone: data.tenantPhone,
        email: data.tenantEmail,
      },
      guarantor: {
        id: data.guarantorId,
        name: data.guarantorName,
        phone: data.guarantorPhone,
        email: data.guarantorEmail,
        address: data.guarantorAddress,
      },
      agent: {
        id: data.agentId,
        name: data.agentName,
        phone: data.agentPhone,
      },
    };

    // 🏠 Propriété
    this.property = {
      id: data.propertyId,
      reference: data.propertyReference,
      title: data.propertyTitle,
      address: data.propertyAddress,
      type: data.propertyType,
      characteristics: data.characteristics, // Voir model Property
    };

    // 💰 Conditions Financières (GNF)
    this.financial = {
      currency: 'GNF',
      monthlyRent: data.monthlyRent, // Loyer mensuel
      securityDeposit: data.securityDeposit, // Caution
      commissionAgency: data.commissionAgency, // Commission agence (%)
      utilities: data.utilities || 0, // Charges incluses
      taxesAndCharges: data.taxesAndCharges || 0,
      totalMonthlyObligation: 0, // Calculé
      paymentMethod: data.paymentMethod, // bank_transfer, cash, cheque, mobile_money
      paymentDayOfMonth: data.paymentDayOfMonth || 1, // Jour de paiement
    };

    // Calculer l'obligation totale mensuelle
    this.financial.totalMonthlyObligation = 
      (this.financial.monthlyRent || 0) + 
      (this.financial.utilities || 0) + 
      (this.financial.taxesAndCharges || 0);

    // 📝 Conditions & Clauses
    this.conditions = {
      renewalOption: data.renewalOption || 'automatic', // automatic, manual, none
      noticeForTermination: data.noticeForTermination || 30, // Jours de préavis
      petPolicy: data.petPolicy || 'not_allowed', // allowed, not_allowed, with_deposit
      subletAllowed: data.subletAllowed || false,
      maintenanceResponsibility: data.maintenanceResponsibility || 'tenant', // landlord, tenant, shared
      insuranceRequired: data.insuranceRequired || true,
      furnished: data.furnished || false,
      smokingAllowed: data.smokingAllowed || false,
      businessUseAllowed: data.businessUseAllowed || false,
      extraConditions: data.extraConditions || [],
    };

    // 📋 Status & Historique
    this.status = data.status || 'draft'; // draft, pending, active, suspended, terminated, expired
    this.statusHistory = data.statusHistory || [];

    // 💳 Paiements & Arriérés
    this.payments = {
      paidAmount: data.paidAmount || 0,
      outstandingAmount: data.outstandingAmount || 0,
      arrears: data.arrears || 0,
      lastPaymentDate: data.lastPaymentDate,
      nextPaymentDate: data.nextPaymentDate,
      paymentHistory: data.paymentHistory || [], // [{date, amount, method, reference, status}]
      lateFeeAccumulated: data.lateFeeAccumulated || 0,
    };

    // 🔐 Documents
    this.documents = {
      contractFile: data.contractFile, // Chemin/URL
      signedCopy: data.signedCopy,
      inventoryReport: data.inventoryReport, // État des lieux
      identification: data.identification || [],
      proofOfIncome: data.proofOfIncome,
      insurancePolicies: data.insurancePolicies || [],
      addendums: data.addendums || [], // Avenants
    };

    // ⚠️ Alertes & Incidents
    this.alerts = {
      hasArrears: data.hasArrears || false,
      arrearsAmount: data.arrearsAmount || 0,
      daysSinceLastPayment: data.daysSinceLastPayment || 0,
      maintenanceIssues: data.maintenanceIssues || [],
      disputeStatus: data.disputeStatus, // none, pending, resolved
      incidents: data.incidents || [],
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

  // Vérifier si le contrat est actif
  isActive() {
    return this.status === 'active' && 
           new Date() >= new Date(this.dates.startDate) && 
           new Date() <= new Date(this.dates.endDate);
  }

  // Calculer les jours restants
  getDaysRemaining() {
    const endDate = new Date(this.dates.endDate);
    const today = new Date();
    const diff = endDate - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // Vérifier si arrérages
  hasArrears() {
    return this.alerts.arrearsAmount > 0;
  }

  // Calculer le total du loyer pour la période
  getTotalRentForPeriod() {
    const start = new Date(this.dates.startDate);
    const end = new Date(this.dates.endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    return (this.financial.monthlyRent || 0) * months;
  }

  // Résumé du contrat
  getSummary() {
    return {
      id: this.id,
      reference: this.reference,
      property: this.property.title,
      tenant: this.parties.tenant.name,
      landlord: this.parties.landlord.name,
      startDate: this.dates.startDate,
      endDate: this.dates.endDate,
      monthlyRent: this.financial.monthlyRent,
      currency: this.financial.currency,
      status: this.status,
      isActive: this.isActive(),
      daysRemaining: this.getDaysRemaining(),
      hasArrears: this.hasArrears(),
      arrearsAmount: this.alerts.arrearsAmount,
    };
  }

  // Valider les champs obligatoires
  validate() {
    const errors = [];
    if (!this.dates.startDate) errors.push('Date de début requise');
    if (!this.dates.endDate) errors.push('Date de fin requise');
    if (!this.parties.landlord.id) errors.push('Propriétaire requis');
    if (!this.parties.tenant.id) errors.push('Locataire requis');
    if (!this.property.id) errors.push('Propriété requise');
    if (!this.financial.monthlyRent) errors.push('Loyer requis');
    if (new Date(this.dates.startDate) >= new Date(this.dates.endDate)) 
      errors.push('Date de début doit être avant date de fin');
    return { isValid: errors.length === 0, errors };
  }

  toJSON() {
    return {
      id: this.id,
      reference: this.reference,
      number: this.number,
      dates: this.dates,
      parties: this.parties,
      property: this.property,
      financial: this.financial,
      conditions: this.conditions,
      status: this.status,
      payments: this.payments,
      documents: this.documents,
      alerts: this.alerts,
      audit: this.audit,
    };
  }
}

module.exports = RentalContract;

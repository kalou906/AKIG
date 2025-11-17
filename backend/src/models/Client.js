/**
 * 👥 Modèle Client/Locataire
 * Gestion des clients, locataires et propriétaires pour agence immobilière guinéenne
 */

class Client {
  constructor(data = {}) {
    this.id = data.id;
    this.reference = data.reference; // Ref unique (CLIENT-2025-001)
    this.type = data.type; // tenant, owner, buyer, investor
    this.status = data.status || 'active'; // active, inactive, suspended, blacklisted

    // 👤 Identité
    this.identity = {
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      dateOfBirth: data.dateOfBirth,
      gender: data.gender, // M, F, Other
      nationality: data.nationality || 'Guinéenne',
      profession: data.profession,
      company: data.company,
      idNumber: data.idNumber, // CIN/Passeport
      idType: data.idType, // cin, passport, other
    };

    // 📞 Contacts
    this.contact = {
      email: data.email,
      phone: data.phone,
      mobilePhone: data.mobilePhone,
      alternatePhone: data.alternatePhone,
      countryCode: data.countryCode || '+224', // Guinée
    };

    // 🏠 Adresse
    this.address = {
      street: data.street,
      district: data.district,
      city: data.city || 'Conakry',
      region: data.region,
      country: 'Guinée',
      zipCode: data.zipCode,
    };

    // 💰 Informations financières
    this.financial = {
      salary: data.salary || 0,
      currency: 'GNF',
      employmentType: data.employmentType, // employed, self-employed, retired, student
      employmentStatus: data.employmentStatus,
      sourceOfFunds: data.sourceOfFunds,
      creditScore: data.creditScore || 0,
      paymentHistory: data.paymentHistory || [], // [{date, amount, status}]
    };

    // 🏘️ Préférences immobilières
    this.preferences = {
      propertyType: data.propertyType, // apartment, house, villa, land
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      priceRange: {
        min: data.priceMin || 0,
        max: data.priceMax || 0,
      },
      preferredArea: data.preferredArea, // Quartier préféré
      amenities: data.amenities || [],
      furnished: data.furnished,
      maxCommute: data.maxCommute, // Distance maximale travail
    };

    // 📋 Contrats associés
    this.contracts = data.contracts || [];

    // 🔐 Sécurité & Documents
    this.documents = {
      idProof: data.idProof, // Lien vers document
      proofOfIncome: data.proofOfIncome,
      proofOfResidence: data.proofOfResidence,
      guarantorInfo: data.guarantorInfo,
      bankDetails: data.bankDetails,
      verified: data.verified || false,
      verificationDate: data.verificationDate,
    };

    // ⭐ Évaluation
    this.evaluation = {
      reliability: data.reliability || 0, // 1-5
      paymentReliability: data.paymentReliability || 0, // 1-5
      comments: data.comments || '',
      incidents: data.incidents || [], // [{date, type, description}]
    };

    // 📊 Statistiques
    this.stats = {
      propertiesViewed: data.propertiesViewed || 0,
      propertiesInterested: data.propertiesInterested || 0,
      viewedDate: data.viewedDate,
      lastInteraction: data.lastInteraction,
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

  // Obtenir le nom complet
  getFullName() {
    return this.identity.fullName;
  }

  // Obtenir le numéro de téléphone avec code pays
  getPhoneWithCountryCode() {
    return `${this.contact.countryCode}${this.contact.phone}`;
  }

  // Valider les champs obligatoires
  validate() {
    const errors = [];
    if (!this.identity.firstName) errors.push('Prénom requis');
    if (!this.identity.lastName) errors.push('Nom requis');
    if (!this.contact.email) errors.push('Email requis');
    if (!this.contact.phone) errors.push('Téléphone requis');
    return { isValid: errors.length === 0, errors };
  }

  // Vérifier si client est qualifié pour un contrat
  isQualified() {
    return this.documents.verified && this.evaluation.reliability >= 3;
  }

  // Obtenir score de risque
  getRiskScore() {
    let score = 100;
    if (this.evaluation.paymentReliability < 3) score -= 40;
    if (this.evaluation.incidents.length > 0) score -= 10 * this.evaluation.incidents.length;
    if (this.financial.creditScore < 500) score -= 30;
    return Math.max(0, score);
  }

  // Résumé pour affichage
  getSummary() {
    return {
      id: this.id,
      reference: this.reference,
      name: this.getFullName(),
      type: this.type,
      email: this.contact.email,
      phone: this.getPhoneWithCountryCode(),
      city: this.address.city,
      status: this.status,
      verified: this.documents.verified,
      reliability: this.evaluation.reliability,
    };
  }

  toJSON() {
    return {
      id: this.id,
      reference: this.reference,
      type: this.type,
      status: this.status,
      identity: this.identity,
      contact: this.contact,
      address: this.address,
      financial: this.financial,
      preferences: this.preferences,
      contracts: this.contracts,
      documents: this.documents,
      evaluation: this.evaluation,
      stats: this.stats,
      audit: this.audit,
    };
  }
}

module.exports = Client;

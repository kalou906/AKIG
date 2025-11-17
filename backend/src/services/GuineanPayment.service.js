/**
 * 💳 Service Moyens de Paiement Guinée - AKIG
 * 
 * Gestion des paiements locaux:
 * - MTN Mobile Money
 * - Orange Money
 * - Virement bancaire
 * - Espèces
 * - Chèques
 */

class GuineanPaymentService {
  constructor() {
    this.PAYMENT_METHODS = {
      'mtn-mobile-money': {
        id: 'mtn-mobile-money',
        name: 'MTN Mobile Money',
        code: 'MTN',
        provider: 'MTN Guinea',
        type: 'MOBILE_MONEY',
        description: 'Paiement par téléphone MTN (614, 624, 634...)',
        minAmount: 1000,      // GNF minimum
        maxAmount: 50000000,  // GNF maximum
        fees: 2.5,            // % de frais
        processingTime: '0-5 minutes',
        supported: true,
        icon: '📱',
        color: '#FFD60A',
        contactNumber: '*1001#',
        methods: [
          'Code USSD',
          'Application MTN Mobile Money',
          'Point de vente'
        ],
        countries: ['Guinea'],
        requirements: [
          'Numéro MTN actif',
          'Compte MTN Money créé',
          'Solde suffisant'
        ],
        advantages: [
          'Instantané',
          'Disponible partout',
          'Pas de compte bancaire requis',
          'Frais réduits'
        ],
        documentation: {
          guide: 'https://...',
          helpline: '+224 622 123 456'
        }
      },

      'orange-money': {
        id: 'orange-money',
        name: 'Orange Money',
        code: 'OM',
        provider: 'Orange Guinea',
        type: 'MOBILE_MONEY',
        description: 'Paiement par téléphone Orange (657, 658, 659...)',
        minAmount: 1000,
        maxAmount: 50000000,
        fees: 2.5,
        processingTime: '0-5 minutes',
        supported: true,
        icon: '📱',
        color: '#FF6600',
        contactNumber: '*144#',
        methods: [
          'Code USSD',
          'Application Orange Money',
          'Point de vente'
        ],
        countries: ['Guinea'],
        requirements: [
          'Numéro Orange actif',
          'Compte Orange Money créé',
          'Solde suffisant'
        ],
        advantages: [
          'Instantané',
          'Réseau large',
          'Faible coût',
          'Sécurisé'
        ],
        documentation: {
          guide: 'https://...',
          helpline: '+224 635 123 456'
        }
      },

      'virement-bancaire': {
        id: 'virement-bancaire',
        name: 'Virement Bancaire',
        code: 'WIRE',
        provider: 'Banques Guinéennes',
        type: 'BANK_TRANSFER',
        description: 'Transfert entre comptes bancaires',
        minAmount: 50000,
        maxAmount: 500000000,
        fees: 1.0,
        processingTime: '24-48 heures',
        supported: true,
        icon: '🏦',
        color: '#003366',
        bankCodes: [
          'BNGU', // BNB - Banque Nationale de Guinée
          'CBGU', // Crédit du Sahel
          'SCBG', // Société Générale
          'EQBG', // Equibank
          'ADBG'  // Banque Atlantique
        ],
        methods: [
          'Via application mobile banque',
          'En agence bancaire',
          'Via système SWIFT'
        ],
        countries: ['Guinea', 'International'],
        requirements: [
          'Compte bancaire actif',
          'Relevé d\'identité bancaire (RIB)',
          'Authentification à la banque'
        ],
        advantages: [
          'Montants élevés possibles',
          'Sécurisé',
          'Traçabilité complète',
          'Adapté pour montants importants'
        ],
        documentation: {
          guide: 'https://...',
          helpline: '+224 661 123 456'
        }
      },

      'especes': {
        id: 'especes',
        name: 'Espèces',
        code: 'CASH',
        provider: 'Remise directe',
        type: 'CASH',
        description: 'Paiement en espèces (GNF)',
        minAmount: 1000,
        maxAmount: null, // Illimité
        fees: 0,
        processingTime: 'Immédiat',
        supported: true,
        icon: '💵',
        color: '#2ECC71',
        methods: [
          'Remise directe',
          'Agent de collecte',
          'Bureau de l\'agence'
        ],
        countries: ['Guinea'],
        requirements: [
          'Francs Guinéens',
          'Reçu signé'
        ],
        advantages: [
          'Gratuit',
          'Aucune trace électronique requise',
          'Immédiat',
          'Flexible'
        ],
        risks: [
          'Perte ou vol',
          'Pas de trace électronique',
          'Montants limités pratiquement'
        ],
        documentation: {
          guide: 'https://...',
          helpline: '+224 622 123 456'
        }
      },

      'cheque': {
        id: 'cheque',
        name: 'Chèque',
        code: 'CHK',
        provider: 'Banques Guinéennes',
        type: 'CHECK',
        description: 'Paiement par chèque bancaire',
        minAmount: 100000,
        maxAmount: null,
        fees: 0.5,
        processingTime: '3-5 jours',
        supported: true,
        icon: '📄',
        color: '#9B59B6',
        methods: [
          'Chèque bancaire',
          'Remise à l\'agence'
        ],
        countries: ['Guinea'],
        requirements: [
          'Compte bancaire',
          'Chéquier valide',
          'Signature autorisée'
        ],
        advantages: [
          'Sécurisé',
          'Traçabilité',
          'Montants importants possibles',
          'Accepté largement'
        ],
        risks: [
          'Chèque sans provision',
          'Délai de compensation',
          'Fraude possible'
        ],
        documentation: {
          guide: 'https://...',
          helpline: '+224 661 123 456'
        }
      }
    };

    // Ordre préféré en Guinée
    this.PREFERENCE_ORDER = [
      'mtn-mobile-money',
      'orange-money',
      'virement-bancaire',
      'especes',
      'cheque'
    ];
  }

  /**
   * Récupérer tous les moyens de paiement
   */
  getAllPaymentMethods() {
    return this.PREFERENCE_ORDER
      .map(id => this.PAYMENT_METHODS[id])
      .filter(m => m && m.supported);
  }

  /**
   * Récupérer moyen de paiement par ID
   */
  getPaymentMethodById(id) {
    return this.PAYMENT_METHODS[id];
  }

  /**
   * Filtrer par type
   */
  getPaymentsByType(type) {
    return Object.values(this.PAYMENT_METHODS).filter(
      m => m.type === type && m.supported
    );
  }

  /**
   * Vérifier si montant valide pour moyen de paiement
   */
  isAmountValid(methodId, amount) {
    const method = this.getPaymentMethodById(methodId);
    if (!method) return false;

    if (method.minAmount && amount < method.minAmount) {
      return { valid: false, reason: `Montant minimum: ${method.minAmount} GNF` };
    }

    if (method.maxAmount && amount > method.maxAmount) {
      return { valid: false, reason: `Montant maximum: ${method.maxAmount} GNF` };
    }

    return { valid: true };
  }

  /**
   * Calculer frais pour montant
   */
  calculateFees(methodId, amount) {
    const method = this.getPaymentMethodById(methodId);
    if (!method) return { error: 'Moyen de paiement introuvable' };

    const fees = Math.round(amount * (method.fees / 100));
    const total = amount + fees;

    return {
      amount,
      fees,
      feePercentage: method.fees,
      total,
      method: method.name
    };
  }

  /**
   * Moyens de paiement pour montant spécifique
   */
  recommendedMethods(amount) {
    return this.getAllPaymentMethods()
      .filter(m => {
        const check = this.isAmountValid(m.id, amount);
        return check.valid;
      })
      .sort((a, b) => a.fees - b.fees);
  }

  /**
   * Moyens mobile money (rapide)
   */
  getMobileMoneyMethods() {
    return this.getPaymentsByType('MOBILE_MONEY')
      .sort((a, b) => a.fees - b.fees);
  }

  /**
   * Moyens bancaires
   */
  getBankMethods() {
    return this.getPaymentsByType('BANK_TRANSFER');
  }

  /**
   * Créer objet transaction
   */
  createTransaction(methodId, amount, description = '') {
    const method = this.getPaymentMethodById(methodId);
    if (!method) throw new Error('Moyen de paiement introuvable');

    const validation = this.isAmountValid(methodId, amount);
    if (!validation.valid) throw new Error(validation.reason);

    const feesInfo = this.calculateFees(methodId, amount);

    return {
      id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      method: method.name,
      methodId: methodId,
      amount: amount,
      fees: feesInfo.fees,
      total: feesInfo.total,
      currency: 'GNF',
      description: description,
      status: 'PENDING',
      processingTime: method.processingTime
    };
  }

  /**
   * Export pour dashboard
   */
  getPaymentMethodsForUI() {
    return this.getAllPaymentMethods().map(m => ({
      id: m.id,
      name: m.name,
      icon: m.icon,
      color: m.color,
      type: m.type,
      fees: m.fees,
      minAmount: m.minAmount,
      processingTime: m.processingTime,
      popular: this.PREFERENCE_ORDER.slice(0, 3).includes(m.id)
    }));
  }

  /**
   * Tracer paiement selon type
   */
  async processPayment(methodId, amount, details = {}) {
    const method = this.getPaymentMethodById(methodId);
    if (!method) throw new Error('Méthode non trouvée');

    const validation = this.isAmountValid(methodId, amount);
    if (!validation.valid) throw new Error(validation.reason);

    // Simuler traitement selon type
    switch (method.type) {
      case 'MOBILE_MONEY':
        return this._processMobileMoney(method, amount, details);
      case 'BANK_TRANSFER':
        return this._processBankTransfer(method, amount, details);
      case 'CASH':
        return this._processCash(method, amount, details);
      case 'CHECK':
        return this._processCheck(method, amount, details);
      default:
        throw new Error('Type de paiement non supporté');
    }
  }

  async _processMobileMoney(method, amount, details) {
    return {
      success: true,
      method: method.name,
      amount,
      reference: `MM${Date.now()}`,
      status: 'SUCCESS',
      message: `Paiement ${amount} GNF via ${method.name} - Veuillez confirmer sur votre téléphone`,
      nextSteps: ['Confirmez le paiement sur votre téléphone', 'Conserver le reçu'],
      timestamp: new Date().toISOString()
    };
  }

  async _processBankTransfer(method, amount, details) {
    return {
      success: true,
      method: method.name,
      amount,
      reference: `BT${Date.now()}`,
      status: 'PENDING',
      message: `Virement bancaire initialisé - Crédité en 24-48 heures`,
      details: {
        bankCode: details.bankCode,
        accountNumber: details.accountNumber ? 'XX' + details.accountNumber.slice(-4) : 'N/A'
      },
      timestamp: new Date().toISOString()
    };
  }

  async _processCash(method, amount, details) {
    return {
      success: true,
      method: method.name,
      amount,
      reference: `CASH${Date.now()}`,
      status: 'SUCCESS',
      message: `Paiement en espèces confirmé - ${amount} GNF`,
      receipt: {
        generated: new Date().toISOString(),
        agentName: details.agentName || 'N/A'
      },
      timestamp: new Date().toISOString()
    };
  }

  async _processCheck(method, amount, details) {
    return {
      success: true,
      method: method.name,
      amount,
      reference: `CHK${details.checkNumber || Date.now()}`,
      status: 'PENDING',
      message: `Chèque accepté - Compensation 3-5 jours`,
      details: {
        checkNumber: details.checkNumber,
        bank: details.bank
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new GuineanPaymentService();

/**
 * 🌍 Service Internationalisation (i18n)
 * Traduction complète FR/EN du système AKIG
 * 
 * backend/src/services/i18n.service.js
 */

const translations = {
  fr: {
    // ==================== CORE ====================
    app: {
      name: 'AKIG',
      title: 'Gestion Immobilière Intelligente',
      tagline: 'Solution complète pour immobilier professionnel'
    },

    // ==================== NAVIGATION ====================
    nav: {
      dashboard: 'Tableau de Bord',
      properties: 'Propriétés',
      contracts: 'Contrats',
      payments: 'Paiements',
      clients: 'Clients',
      tenants: 'Locataires',
      fiscal: 'Rapports Fiscaux',
      charges: 'Charges',
      sci: 'Gestion SCI',
      seasonal: 'Locations Saisonnières',
      bankSync: 'Rapprochement Bancaire',
      settings: 'Paramètres',
      leads: 'Leads',
      maintenance: 'Maintenance',
      analytics: 'Analytics'
    },

    // ==================== AUTHENTIFICATION ====================
    auth: {
      login: 'Connexion',
      logout: 'Déconnexion',
      register: 'Inscription',
      email: 'Email',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer mot de passe',
      forgotPassword: 'Mot de passe oublié?',
      rememberMe: 'Se souvenir de moi',
      loginError: 'Email ou mot de passe incorrect',
      registerSuccess: 'Inscription réussie',
      logoutSuccess: 'Vous êtes déconnecté'
    },

    // ==================== PROPRIÉTÉS ====================
    properties: {
      title: 'Propriétés',
      list: 'Liste des propriétés',
      add: 'Ajouter propriété',
      edit: 'Modifier propriété',
      delete: 'Supprimer propriété',
      reference: 'Référence',
      title_label: 'Titre',
      description: 'Description',
      type: 'Type de bien',
      address: 'Adresse',
      district: 'District',
      city: 'Ville',
      surface: 'Surface (m²)',
      rooms: 'Chambres',
      bathrooms: 'Salles de bain',
      price: 'Prix',
      rent: 'Loyer mensuel',
      owner: 'Propriétaire',
      agent: 'Agent',
      status: 'Statut',
      available: 'Disponible',
      rented: 'Loué',
      sold: 'Vendu',
      maintenance: 'Maintenance',
      createdAt: 'Créé le',
      updatedAt: 'Modifié le'
    },

    // ==================== CONTRATS ====================
    contracts: {
      title: 'Contrats',
      list: 'Liste des contrats',
      add: 'Nouveau contrat',
      edit: 'Modifier contrat',
      reference: 'Numéro de contrat',
      type: 'Type de contrat',
      startDate: 'Date début',
      endDate: 'Date fin',
      duration: 'Durée',
      landlord: 'Bailleur',
      tenant: 'Locataire',
      guarantor: 'Garant',
      property: 'Propriété',
      rent: 'Loyer',
      deposit: 'Dépôt de garantie',
      status: 'Statut',
      active: 'Actif',
      expired: 'Expiré',
      terminated: 'Résilié',
      duration_months: 'mois',
      expiresIn: 'Expire dans',
      days: 'jours'
    },

    // ==================== PAIEMENTS ====================
    payments: {
      title: 'Paiements',
      list: 'Liste des paiements',
      add: 'Enregistrer paiement',
      reference: 'Référence paiement',
      amount: 'Montant',
      date: 'Date paiement',
      method: 'Méthode',
      cash: 'Espèces',
      check: 'Chèque',
      transfer: 'Virement',
      orangeMoney: 'Orange Money',
      mtn: 'MTN Money',
      wave: 'Wave',
      status: 'Statut',
      paid: 'Payé',
      pending: 'En attente',
      overdue: 'Impayé',
      tenant: 'Locataire',
      contract: 'Contrat',
      receipt: 'Reçu',
      receiptGenerated: 'Reçu généré',
      downloadReceipt: 'Télécharger reçu'
    },

    // ==================== CLIENTS ====================
    clients: {
      title: 'Clients',
      list: 'Liste des clients',
      add: 'Nouveau client',
      edit: 'Modifier client',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      type: 'Type',
      landlord: 'Bailleur',
      tenant: 'Locataire',
      investor: 'Investisseur',
      company: 'Entreprise',
      address: 'Adresse',
      properties: 'Propriétés',
      contracts: 'Contrats',
      createdAt: 'Client depuis le'
    },

    // ==================== LOCATAIRES ====================
    tenants: {
      title: 'Locataires',
      list: 'Liste des locataires',
      add: 'Ajouter locataire',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      idNumber: 'Numéro d\'identification',
      property: 'Propriété louée',
      contract: 'Contrat',
      paymentStatus: 'Statut paiement',
      riskLevel: 'Niveau de risque',
      low: 'Faible',
      medium: 'Moyen',
      high: 'Élevé'
    },

    // ==================== RAPPORTS FISCAUX ====================
    fiscal: {
      title: 'Rapports Fiscaux',
      generateReport: 'Générer rapport',
      period: 'Période',
      startDate: 'Date début',
      endDate: 'Date fin',
      property: 'Propriété',
      allProperties: 'Toutes les propriétés',
      income: 'Revenus',
      expenses: 'Dépenses',
      rent: 'Loyers collectés',
      charges: 'Charges',
      maintenance: 'Maintenance',
      utilities: 'Services',
      taxes: 'Taxes',
      insurance: 'Assurances',
      netProfit: 'Résultat net',
      exportPDF: 'Exporter en PDF',
      exportExcel: 'Exporter en Excel',
      exportCSV: 'Exporter en CSV'
    },

    // ==================== CHARGES ====================
    charges: {
      title: 'Charges',
      list: 'Gestion des charges',
      add: 'Ajouter charge',
      type: 'Type de charge',
      water: 'Eau',
      electricity: 'Électricité',
      gas: 'Gaz',
      coproperty: 'Copropriété',
      maintenance: 'Maintenance',
      insurance: 'Assurance',
      taxes: 'Taxes foncières',
      internet: 'Internet/Téléphone',
      amount: 'Montant',
      date: 'Date',
      property: 'Propriété',
      tenant: 'Locataire',
      status: 'Statut',
      paid: 'Payée',
      pending: 'En attente'
    },

    // ==================== GESTION SCI ====================
    sci: {
      title: 'Gestion SCI',
      company: 'Entreprise SCI',
      members: 'Associés',
      add: 'Créer SCI',
      addMember: 'Ajouter associé',
      siret: 'SIRET',
      name: 'Nom SCI',
      status: 'Statut',
      active: 'Active',
      shareholding: 'Part social',
      member: 'Associé',
      sharePercentage: 'Pourcentage de part',
      role: 'Rôle',
      manager: 'Gérant',
      investor: 'Investisseur'
    },

    // ==================== LOCATIONS SAISONNIÈRES ====================
    seasonal: {
      title: 'Locations Saisonnières',
      rates: 'Tarifs',
      calendar: 'Calendrier',
      bookings: 'Réservations',
      addRate: 'Ajouter tarif',
      season: 'Saison',
      highSeason: 'Haute saison',
      lowSeason: 'Basse saison',
      midSeason: 'Moyenne saison',
      pricePerNight: 'Prix par nuit',
      minimumStay: 'Séjour minimum',
      maximumOccupancy: 'Occupation max',
      startDate: 'Date début',
      endDate: 'Date fin',
      available: 'Disponible',
      booked: 'Réservé',
      pending: 'En attente'
    },

    // ==================== RAPPROCHEMENT BANCAIRE ====================
    bankSync: {
      title: 'Rapprochement Bancaire',
      synchronize: 'Synchroniser',
      transactions: 'Transactions',
      account: 'Compte bancaire',
      date: 'Date',
      description: 'Description',
      amount: 'Montant',
      status: 'Statut',
      matched: 'Rapproché',
      unmatched: 'Non rapproché',
      match: 'Rapprocher',
      unreconciled: 'Non rapprochées',
      reconcile: 'Rapprocher'
    },

    // ==================== LEADS ====================
    leads: {
      title: 'Leads',
      list: 'Gestion des leads',
      add: 'Nouveau lead',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      source: 'Source',
      website: 'Site web',
      portal: 'Portail immobilier',
      referral: 'Recommandation',
      directCall: 'Appel direct',
      status: 'Statut',
      new: 'Nouveau',
      contacted: 'Contacté',
      qualified: 'Qualifié',
      lost: 'Perdu',
      converted: 'Converti',
      score: 'Score',
      propertyType: 'Type de bien recherché',
      budget: 'Budget',
      nextAction: 'Prochaine action',
      createdAt: 'Créé le',
      followUp: 'Suivi',
      note: 'Note'
    },

    // ==================== MAINTENANCE ====================
    maintenance: {
      title: 'Maintenance',
      tickets: 'Tickets',
      addTicket: 'Nouveau ticket',
      reference: 'Référence ticket',
      property: 'Propriété',
      description: 'Description du problème',
      priority: 'Priorité',
      urgent: 'Urgent',
      high: 'Haute',
      normal: 'Normale',
      low: 'Basse',
      type: 'Type de problème',
      status: 'Statut',
      open: 'Ouvert',
      inProgress: 'En cours',
      completed: 'Complété',
      technician: 'Technicien',
      assignedDate: 'Assigné le',
      completedDate: 'Complété le',
      cost: 'Coût',
      notes: 'Notes'
    },

    // ==================== PARAMÈTRES ====================
    settings: {
      title: 'Paramètres',
      general: 'Général',
      security: 'Sécurité',
      notifications: 'Notifications',
      language: 'Langue',
      currency: 'Devise',
      timezone: 'Fuseau horaire',
      profile: 'Mon profil',
      changePassword: 'Changer mot de passe',
      enableNotifications: 'Activer notifications',
      emailNotifications: 'Notifications email',
      smsNotifications: 'Notifications SMS',
      whatsappNotifications: 'Notifications WhatsApp',
      twoFactorAuth: '2FA (Authentification à deux facteurs)',
      enable2FA: 'Activer 2FA',
      disable2FA: 'Désactiver 2FA'
    },

    // ==================== MESSAGES GÉNÉRAUX ====================
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      add: 'Ajouter',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      search: 'Rechercher',
      filter: 'Filtrer',
      sort: 'Trier',
      export: 'Exporter',
      import: 'Importer',
      download: 'Télécharger',
      print: 'Imprimer',
      loading: 'Chargement...',
      success: 'Succès!',
      error: 'Erreur',
      warning: 'Attention',
      info: 'Information',
      confirm: 'Confirmer',
      yes: 'Oui',
      no: 'Non',
      close: 'Fermer',
      actions: 'Actions',
      noData: 'Aucune donnée',
      noResults: 'Aucun résultat',
      selectAll: 'Tous',
      selected: 'Sélectionnés',
      from: 'Du',
      to: 'Au',
      of: 'de',
      per: 'par'
    },

    // ==================== VALIDATIONS ====================
    validation: {
      required: 'Ce champ est requis',
      invalidEmail: 'Email invalide',
      passwordTooShort: 'Le mot de passe doit contenir au moins 8 caractères',
      passwordMismatch: 'Les mots de passe ne correspondent pas',
      invalidPhone: 'Numéro de téléphone invalide',
      invalidAmount: 'Montant invalide',
      invalidDate: 'Date invalide',
      dateAfter: 'La date doit être après',
      dateBefore: 'La date doit être avant',
      unique: 'Cette valeur existe déjà',
      minLength: 'Minimum {{min}} caractères',
      maxLength: 'Maximum {{max}} caractères',
      pattern: 'Format invalide'
    },

    // ==================== ERREURS ====================
    errors: {
      notFound: 'Non trouvé',
      unauthorized: 'Non autorisé',
      forbidden: 'Accès refusé',
      badRequest: 'Requête invalide',
      serverError: 'Erreur serveur',
      networkError: 'Erreur réseau',
      sessionExpired: 'Votre session a expiré',
      tryAgain: 'Réessayer',
      contactSupport: 'Contacter le support'
    },

    // ==================== SUCCÈS ====================
    success: {
      created: 'Créé avec succès',
      updated: 'Modifié avec succès',
      deleted: 'Supprimé avec succès',
      saved: 'Enregistré avec succès',
      sent: 'Envoyé avec succès',
      imported: 'Importé avec succès',
      exported: 'Exporté avec succès',
      synced: 'Synchronisé avec succès'
    },

    // ==================== NOTIFICATIONS ====================
    notifications: {
      title: 'Notifications',
      paymentDue: 'Paiement dû',
      paymentOverdue: 'Paiement en retard',
      contractExpiring: 'Contrat expire bientôt',
      maintenanceRequest: 'Demande maintenance',
      newLead: 'Nouveau lead',
      bookingConfirmed: 'Réservation confirmée',
      newMessage: 'Nouveau message'
    }
  },

  en: {
    // English translations (existing)
    app: {
      name: 'AKIG',
      title: 'Smart Real Estate Management',
      tagline: 'Complete solution for professional real estate'
    },
    nav: {
      dashboard: 'Dashboard',
      properties: 'Properties',
      contracts: 'Contracts',
      payments: 'Payments',
      clients: 'Clients',
      tenants: 'Tenants',
      fiscal: 'Fiscal Reports',
      charges: 'Charges',
      sci: 'SCI Management',
      seasonal: 'Seasonal Rentals',
      bankSync: 'Bank Reconciliation',
      settings: 'Settings',
      leads: 'Leads',
      maintenance: 'Maintenance',
      analytics: 'Analytics'
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      rememberMe: 'Remember Me',
      loginError: 'Invalid email or password',
      registerSuccess: 'Registration successful',
      logoutSuccess: 'You have been logged out'
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      back: 'Back',
      loading: 'Loading...',
      success: 'Success!',
      error: 'Error',
      yes: 'Yes',
      no: 'No',
      close: 'Close'
    }
  }
};

class I18nService {
  constructor() {
    this.currentLanguage = 'en'; // Default to English
    this.translations = translations;
  }

  /**
   * Set current language
   */
  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      return true;
    }
    return false;
  }

  /**
   * Get current language
   */
  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get translation
   */
  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if not found
      }
    }

    if (typeof value === 'string') {
      // Replace parameters
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] || match;
      });
    }

    return value || key;
  }

  /**
   * Get all translations for language
   */
  getTranslations(lang = this.currentLanguage) {
    return this.translations[lang];
  }

  /**
   * Add custom translation
   */
  addTranslation(lang, key, value) {
    const keys = key.split('.');
    let target = this.translations[lang];

    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) {
        target[keys[i]] = {};
      }
      target = target[keys[i]];
    }

    target[keys[keys.length - 1]] = value;
  }

  /**
   * Format currency
   */
  formatCurrency(amount, currency = 'GNF') {
    const formatter = new Intl.NumberFormat(this.currentLanguage === 'fr' ? 'fr-GN' : 'en-US', {
      style: 'currency',
      currency: currency
    });
    return formatter.format(amount);
  }

  /**
   * Format date
   */
  formatDate(date, format = 'short') {
    const options = {
      short: { year: 'numeric', month: '2-digit', day: '2-digit' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    };

    return new Intl.DateTimeFormat(
      this.currentLanguage === 'fr' ? 'fr-GN' : 'en-US',
      options[format] || options.short
    ).format(new Date(date));
  }

  /**
   * Format number
   */
  formatNumber(num, decimals = 2) {
    return new Intl.NumberFormat(
      this.currentLanguage === 'fr' ? 'fr-GN' : 'en-US',
      { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
    ).format(num);
  }
}

module.exports = new I18nService();

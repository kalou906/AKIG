/**
 * Traductions françaises pour l'application AKIG
 * Locale: fr-GN (Français - Guinée)
 */

export const FR = {
  common: {
    appName: 'Agence Kamoula Immobilière Guinée',
    currencyGNF: 'GNF',
    rent: 'Loyer',
    site: 'Site',
    owner: 'Propriétaire',
    tenant: 'Locataire',
    phone: 'Téléphone',
    status: 'Statut',
    actions: 'Actions',
    export: 'Exporter',
    generateContract: 'Générer contrat',
    reminder: 'Relancer',
    pdf: 'PDF',
    whatsapp: 'WhatsApp',
    search: 'Recherche',
    filters: 'Filtres',
    year: 'Année',
    mode: 'Mode de paiement',
    overdue: 'En retard',
    active: 'Actif',
    terminated: 'Terminé',
    paid: 'Payé',
    due: 'Dû',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    close: 'Fermer',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    warning: 'Attention',
    info: 'Information',
  },

  statusBadge: {
    upToDate: 'À jour',
    oneMonth: '1 mois',
    overOneMonth: '> 1 mois',
    unknown: 'Inconnu',
  },

  dashboard: {
    title: 'Tableau de bord',
    paymentsVsDue: 'Paiements vs Dû',
    topOverdue: 'Top impayés',
    topPayers: 'Top bons payeurs',
    totalTenants: 'Locataires totaux',
    upToDate: 'À jour',
    overdue: 'En retard',
    totalRent: 'Loyer total',
    totalPaid: 'Total payé',
    averagePaymentRate: 'Taux de recouvrement moyen',
  },

  notifications: {
    criticalOverdue: 'Locataires avec {'>'}3 mois d\'impayés (action immédiate)',
    overdue: 'Locataires avec {'>'}1 mois d\'impayés (suivi nécessaire)',
    scheduledReminder: 'Rappels périodiques',
    noPhone: 'Locataires sans numéro de téléphone',
    allPaid: 'Tous les locataires sont à jour !',
  },

  table: {
    name: 'Nom',
    phone: 'Téléphone',
    owner: 'Propriétaire',
    site: 'Site',
    rent: 'Loyer',
    periodicity: 'Périodicité',
    lastPayment: 'Dernier paiement',
    arrears: 'Impayés',
    status: 'Statut',
    actions: 'Actions',
    noData: 'Aucune donnée',
    date: 'Date',
    mode: 'Mode',
    amount: 'Montant',
  },

  tenantDetail: {
    title: 'Détails du locataire',
    personalInfo: 'Informations personnelles',
    contractInfo: 'Informations du contrat',
    paymentsSection: 'Paiements {year}',
    notesSection: 'Notes opérationnelles',
    contractsSection: 'Historique des contrats',
    totalOverdue: 'Total impayés',
    totalPaid: 'Total payé',
    averagePayment: 'Paiement moyen',
    numberOfPayments: 'Nombre de paiements',
    paymentMethod: 'Mode de paiement',
    date: 'Date',
    amount: 'Montant',
    addNote: 'Ajouter une note',
    noteAdded: 'Note ajoutée avec succès',
    noNotes: 'Aucune note',
    noPayments: 'Aucun paiement enregistré',
  },

  csvImport: {
    title: 'Importer les paiements',
    description: 'Téléchargez un fichier CSV contenant les paiements des locataires',
    selectFile: 'Sélectionner un fichier',
    fileName: 'Nom du fichier',
    fileSize: 'Taille',
    year: 'Année',
    month: 'Mois',
    selectYear: 'Sélectionner une année',
    selectMonth: 'Sélectionner un mois',
    import: 'Importer',
    importing: 'Importation en cours...',
    importSuccess: 'Importation réussie',
    importError: 'Erreur lors de l\'importation',
    rowsProcessed: 'Lignes traitées',
    rowsSkipped: 'Lignes ignorées',
    csvFormat: 'Format CSV attendu',
    columns: 'Colonnes requises',
    download: 'Télécharger un modèle',
  },

  tenantsListYear: {
    title: 'Locataires par année',
    filterByYear: 'Filtrer par année',
    filterByStatus: 'Filtrer par statut',
    selectStatus: 'Tous les statuts',
    noTenantsFound: 'Aucun locataire trouvé',
  },

  aiSearch: {
    title: 'Recherche assistée par IA',
    description: 'Décrivez ce que vous cherchez en langage naturel',
    placeholder: 'Ex: locataires en retard {'>'}2 mois à Matam',
    analyze: 'Analyser',
    analyzing: 'Analyse...',
    suggestions: 'Suggestions',
    noSuggestions: 'Aucune suggestion disponible',
  },

  quickActions: {
    generateContract: 'Générer contrat',
    sendWhatsApp: 'Relancer WhatsApp',
    exportPdf: 'Export PDF',
    generateContractTitle: 'Générer un nouveau contrat de location',
    sendWhatsAppTitle: 'Envoyer un rappel via WhatsApp',
    exportPdfTitle: 'Exporter les informations en PDF',
    noPhone: 'Aucun numéro téléphone',
  },

  alerts: {
    criticalOverdue: '{count} locataire(s) avec {'>'}3 mois d\'impayés',
    overdue: '{count} locataire(s) avec {'>'}1 mois d\'impayés',
    noPhone: '{count} locataire(s) sans numéro de téléphone',
    allPaid: 'Tous les locataires sont à jour !',
    viewDetails: 'Voir les détails',
    sendReminders: 'Relancer',
  },

  paymentModes: {
    cash: 'Espèces',
    transfer: 'Virement',
    mobileMoney: 'Mobile Money',
    check: 'Chèque',
    card: 'Carte',
    other: 'Autre',
  },

  months: {
    january: 'Janvier',
    february: 'Février',
    march: 'Mars',
    april: 'Avril',
    may: 'Mai',
    june: 'Juin',
    july: 'Juillet',
    august: 'Août',
    september: 'Septembre',
    october: 'Octobre',
    november: 'Novembre',
    december: 'Décembre',
  },

  monthsShort: {
    jan: 'Jan',
    feb: 'Fév',
    mar: 'Mar',
    apr: 'Avr',
    may: 'Mai',
    jun: 'Jun',
    jul: 'Jul',
    aug: 'Aoû',
    sep: 'Sep',
    oct: 'Oct',
    nov: 'Nov',
    dec: 'Déc',
  },

  errors: {
    fileNotSelected: 'Veuillez sélectionner un fichier',
    invalidFileFormat: 'Format de fichier invalide',
    importFailed: 'Échec de l\'importation',
    networkError: 'Erreur réseau',
    serverError: 'Erreur serveur',
    notFound: 'Non trouvé',
    unauthorized: 'Non autorisé',
    forbidden: 'Accès refusé',
  },

  forms: {
    required: 'Champ obligatoire',
    invalidEmail: 'Email invalide',
    invalidPhone: 'Numéro de téléphone invalide',
    passwordMismatch: 'Les mots de passe ne correspondent pas',
    submit: 'Soumettre',
    reset: 'Réinitialiser',
  },
};

/**
 * Formate un nombre en devise guinéenne (GNF)
 * @param n - Nombre à formater
 * @returns Chaîne formatée ou "—" si vide
 *
 * Exemple:
 * formatGNF(5000000) => "5 000 000 GNF"
 * formatGNF(null) => "—"
 */
export function formatGNF(n?: number | null): string {
  if (!n && n !== 0) return '—';
  try {
    const formatted = Intl.NumberFormat('fr-GN').format(Number(n));
    return `${formatted} ${FR.common.currencyGNF}`;
  } catch {
    return '—';
  }
}

/**
 * Formate une date au format français
 * @param d - Date en string ou objet Date
 * @returns Chaîne de date formatée
 *
 * Exemple:
 * formatDate('2025-10-26') => "26/10/2025"
 */
export function formatDate(d: string | Date): string {
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('fr-GN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Formate une date avec heure
 * @param d - Date en string ou objet Date
 * @returns Chaîne de date et heure formatée
 *
 * Exemple:
 * formatDateTime('2025-10-26T14:30:00') => "26/10/2025 à 14:30"
 */
export function formatDateTime(d: string | Date): string {
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('fr-GN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Formate le nom du mois
 * @param monthIndex - Index du mois (0-11)
 * @returns Nom du mois
 */
export function getMonthName(monthIndex: number): string {
  const months = [
    FR.months.january,
    FR.months.february,
    FR.months.march,
    FR.months.april,
    FR.months.may,
    FR.months.june,
    FR.months.july,
    FR.months.august,
    FR.months.september,
    FR.months.october,
    FR.months.november,
    FR.months.december,
  ];
  return months[monthIndex] || '';
}

/**
 * Formate le nom court du mois
 * @param monthIndex - Index du mois (0-11)
 * @returns Nom court du mois
 */
export function getMonthShortName(monthIndex: number): string {
  const months = [
    FR.monthsShort.jan,
    FR.monthsShort.feb,
    FR.monthsShort.mar,
    FR.monthsShort.apr,
    FR.monthsShort.may,
    FR.monthsShort.jun,
    FR.monthsShort.jul,
    FR.monthsShort.aug,
    FR.monthsShort.sep,
    FR.monthsShort.oct,
    FR.monthsShort.nov,
    FR.monthsShort.dec,
  ];
  return months[monthIndex] || '';
}

/**
 * Formate le mode de paiement
 * @param mode - Code du mode de paiement
 * @returns Texte formaté
 */
export function formatPaymentMode(mode: string): string {
  const modes: Record<string, string> = {
    cash: FR.paymentModes.cash,
    transfer: FR.paymentModes.transfer,
    mobile_money: FR.paymentModes.mobileMoney,
    check: FR.paymentModes.check,
    card: FR.paymentModes.card,
    other: FR.paymentModes.other,
  };
  return modes[mode?.toLowerCase()] || mode || FR.common.mode;
}

/**
 * Traduit un message d'erreur
 * @param code - Code d'erreur
 * @returns Message d'erreur traduit
 */
export function getErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    FILE_NOT_SELECTED: FR.errors.fileNotSelected,
    INVALID_FILE_FORMAT: FR.errors.invalidFileFormat,
    IMPORT_FAILED: FR.errors.importFailed,
    NETWORK_ERROR: FR.errors.networkError,
    SERVER_ERROR: FR.errors.serverError,
    NOT_FOUND: FR.errors.notFound,
    UNAUTHORIZED: FR.errors.unauthorized,
    FORBIDDEN: FR.errors.forbidden,
  };
  return errorMessages[code] || code;
}

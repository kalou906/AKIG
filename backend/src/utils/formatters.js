/**
 * Utilitaires de formatage et parsing
 * backend/src/utils/formatters.js
 */

/**
 * Formate un montant en GNF avec séparateurs
 * Exemple: 1000000 -> "1.000.000 GNF"
 */
function formatGNF(amount) {
  if (!amount || isNaN(amount)) return '0 GNF';
  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parse un montant en GNF vers nombre
 * Exemple: "1.000.000 GNF" -> 1000000
 */
function parseGNF(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^\d]/g, '');
  return parseInt(cleaned) || 0;
}

/**
 * Formate une date ISO en date lisible
 * Exemple: "2024-10-26T10:30:00Z" -> "26/10/2024 10:30"
 */
function formatDate(date, locale = 'fr-GN', includeTime = true) {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '-';

  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  return dateObj.toLocaleDateString(locale, options);
}

/**
 * Formate une durée en texte lisible
 * Exemple: 1632000000 (ms) -> "18 jours 20 heures"
 */
function formatDuration(ms) {
  if (!ms) return '0s';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}j ${remainingHours}h`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Formate un numéro de téléphone guinéen
 * Exemple: "224617234567" -> "+224 61 72 34 567"
 */
function formatPhoneNumber(phone) {
  if (!phone) return '';

  let cleaned = String(phone).replace(/[^\d+]/g, '');

  // Ajoute +224 si absent
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('224')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('6') || cleaned.startsWith('7')) {
      cleaned = '+224' + cleaned;
    }
  }

  // Formate: +224 XX XX XX XXX
  if (cleaned.length === 13) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)} ${cleaned.substring(10)}`;
  }

  return cleaned;
}

/**
 * Génère un slug à partir d'une chaîne
 * Exemple: "Mon Titre" -> "mon-titre"
 */
function slugify(str) {
  if (!str) return '';

  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Enlève caractères spéciaux
    .replace(/[\s_-]+/g, '-') // Remplace espaces/underscores par tirets
    .replace(/^-+|-+$/g, ''); // Enlève tirets au début/fin
}

/**
 * Tronque une chaîne avec ellipsis
 * Exemple: "Hello World", 5 -> "He..."
 */
function truncate(str, length = 50, suffix = '...') {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
}

/**
 * Capitalise la première lettre
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalise chaque mot
 */
function titleCase(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Formate un pourcentage
 */
function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '0%';
  return parseFloat(value).toFixed(decimals) + '%';
}

/**
 * Formate les statistiques de paiement
 */
function formatPaymentStats(stats) {
  return {
    totalArrearsAmount: formatGNF(stats.totalArrearsAmount),
    totalReceivedAmount: formatGNF(stats.totalReceivedAmount),
    collectionRate: formatPercent(stats.collectionRate, 2),
    pendingPayments: stats.pendingPayments,
    overduePayments: stats.overduePayments,
  };
}

module.exports = {
  formatGNF,
  parseGNF,
  formatDate,
  formatDuration,
  formatPhoneNumber,
  slugify,
  truncate,
  capitalize,
  titleCase,
  formatPercent,
  formatPaymentStats,
};

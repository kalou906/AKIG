/**
 * Formatage de valeurs pour l'affichage
 */

/**
 * Formater un nombre en Francs Guinéens (FG)
 */
export function formatGNF(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0 FG';
  }

  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formater un pourcentage
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) {
    return '0%';
  }

  return `${value.toFixed(decimals)}%`;
}

/**
 * Formater une date
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return '-';
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-GN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Formater une date courte (JJ/MM/YYYY)
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) {
    return '-';
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-GN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Formater l'heure
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) {
    return '-';
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-GN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

/**
 * Formater un nombre avec séparateurs
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }

  return new Intl.NumberFormat('fr-GN').format(value);
}

/**
 * Formater un texte (première lettre majuscule)
 */
export function formatText(text: string | null | undefined): string {
  if (!text) {
    return '';
  }

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Formater un statut
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    pending: 'En attente',
    completed: 'Complété',
    cancelled: 'Annulé',
    archived: 'Archivé',
  };

  return statusMap[status] || formatText(status);
}

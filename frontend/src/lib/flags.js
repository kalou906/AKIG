/**
 * ============================================================
 * src/lib/flags.js - Feature flags pour activation progressive
 * Désactiver un module sans casser la plateforme
 * ============================================================
 */

export const flags = {
  // Modules métier
  contrats: true,
  paiements: true,
  proprietes: true,
  locataires: true,
  rapports: true,
  rappels: true,
  preavis: true,

  // Fonctionnalités avancées
  alertsIA: true,
  bulkActions: true,
  exports: true,
  notifications: true,

  // Debug/Dev
  devTools: process.env.NODE_ENV === 'development',
  mockData: false,
};

/**
 * Désactiver un flag (utile si une feature casse)
 */
export function disableFlag(flagName) {
  console.warn(`⚠️  [FLAGS] Désactivation: ${flagName}`);
  flags[flagName] = false;
}

/**
 * Réactiver un flag
 */
export function enableFlag(flagName) {
  console.log(`✅ [FLAGS] Réactivation: ${flagName}`);
  flags[flagName] = true;
}

/**
 * Obtenir état de tous les flags
 */
export function getFlagsStatus() {
  const enabled = Object.keys(flags).filter(k => flags[k]);
  const disabled = Object.keys(flags).filter(k => !flags[k]);
  return { enabled, disabled, total: Object.keys(flags).length };
}

export default flags;

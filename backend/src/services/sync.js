/**
 * Service de synchronisation avec gestion des conflits
 */

/**
 * Résout un conflit entre deux versions d'un objet
 * @param {Object} local - Version locale
 * @param {Object} remote - Version distante
 * @param {Array<string>} criticalFields - Champs critiques qui ne peuvent pas diverger
 * @returns {Object} Résultat de la résolution avec status et données
 */
function resolveConflict(local, remote, criticalFields = []) {
  if (!local || !remote) {
    return {
      status: 'error',
      message: 'Objets local et remote requis',
      data: null
    };
  }

  // Vérifier les champs critiques
  const divergingCritical = criticalFields.filter(field => {
    return local[field] !== remote[field];
  });

  if (divergingCritical.length > 0) {
    return {
      status: 'conflict',
      message: `Conflits sur champs critiques: ${divergingCritical.join(', ')}`,
      conflictingFields: divergingCritical,
      local,
      remote,
      data: null
    };
  }

  // Fusionner les objets - on garde les valeurs de remote si différentes, sinon local
  const merged = {
    ...local
  };

  for (const key in remote) {
    if (remote[key] !== local[key]) {
      merged[key] = remote[key];
    }
  }

  return {
    status: 'resolved',
    message: 'Conflits résolus',
    data: merged
  };
}

/**
 * Détecte les champs modifiés entre deux versions
 * @param {Object} before - Version antérieure
 * @param {Object} after - Version actuelle
 * @returns {Array<string>} Liste des champs modifiés
 */
function detectChanges(before, after) {
  if (!before || !after) {
    return [];
  }

  const changes = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    if (before[key] !== after[key]) {
      changes.push(key);
    }
  }

  return changes;
}

/**
 * Fusionne plusieurs versions d'un objet avec stratégie de priorité
 * @param {Array<Object>} versions - Liste des versions à fusionner
 * @param {string} strategy - Stratégie: 'latest', 'most-recent-edit', 'merge'
 * @returns {Object} Objet fusionné
 */
function mergeVersions(versions, strategy = 'merge') {
  if (!versions || versions.length === 0) {
    return {};
  }

  if (strategy === 'latest') {
    return versions[versions.length - 1];
  }

  if (strategy === 'merge') {
    return versions.reduce((acc, version) => {
      return { ...acc, ...version };
    }, {});
  }

  // Par défaut, retourner la première version
  return versions[0];
}

/**
 * Valide qu'un objet ne contient pas de données sensibles
 * @param {Object} obj - Objet à valider
 * @param {Array<string>} sensitiveFields - Champs sensibles
 * @returns {boolean} True si pas de données sensibles
 */
function isClean(obj, sensitiveFields = ['password', 'token', 'secret']) {
  if (!obj) return true;

  for (const field of sensitiveFields) {
    if (field in obj && obj[field]) {
      return false;
    }
  }

  return true;
}

module.exports = {
  resolveConflict,
  detectChanges,
  mergeVersions,
  isClean
};

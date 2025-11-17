/**
 * Utilitaires Pagination par Curseur
 * Pagination performante O(1) pour grandes datasets
 * backend/src/utils/cursor-pagination.js
 */

/**
 * Encode un curseur à partir d'un ID
 * @param {number|string} id - ID du dernier élément
 * @returns {string} Curseur encodé en base64
 */
function encodeCursor(id) {
  if (!id) return null;
  return Buffer.from(`cursor:${id}`).toString('base64');
}

/**
 * Décode un curseur pour récupérer l'ID
 * @param {string} cursor - Curseur encodé en base64
 * @returns {number|string} ID du dernier élément
 */
function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    if (decoded.startsWith('cursor:')) {
      return decoded.slice(7); // Enlever "cursor:" prefix
    }
  } catch (err) {
    return null;
  }
  return null;
}

/**
 * Génère query SQL pour pagination curseur
 * @param {Object} options - Options pagination
 * @param {number} options.limit - Nombre d'éléments à retourner
 * @param {string} options.cursor - Curseur pour reprendre après
 * @param {string} options.column - Colonne pour trier (défaut: 'id')
 * @param {string} options.order - 'ASC' ou 'DESC' (défaut: 'DESC')
 * @returns {Object} { whereClause, params, limit }
 */
function buildCursorQuery({
  limit = 20,
  cursor = null,
  column = 'id',
  order = 'DESC'
}) {
  // Valider limite
  if (limit < 1 || limit > 1000) {
    limit = 20;
  }

  const decodedId = decodeCursor(cursor);
  let whereClause = '';
  let params = [];

  if (decodedId) {
    // Construire condition basée sur direction
    if (order === 'ASC') {
      whereClause = `WHERE ${column} > $1`;
    } else {
      whereClause = `WHERE ${column} < $1`;
    }
    params.push(decodedId);
  }

  return {
    whereClause,
    params,
    limit: limit + 1 // +1 pour vérifier si y'a plus d'éléments
  };
}

/**
 * Traite les résultats pagination et ajoute métadonnées
 * @param {Array} rows - Lignes retournées de la BD
 * @param {number} limit - Limite requêtée
 * @param {string} column - Colonne d'ID utilisée
 * @returns {Object} { items, nextCursor, hasNext, count }
 */
function processCursorResults(rows, limit, column = 'id') {
  // Vérifier s'il y a plus d'éléments
  const hasNext = rows.length > limit;
  
  // Retourner seulement la limite demandée
  const items = rows.slice(0, limit);
  
  // Générer curseur suivant
  let nextCursor = null;
  if (hasNext && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = encodeCursor(lastItem[column]);
  }

  return {
    items,
    nextCursor,
    hasNext,
    count: items.length
  };
}

/**
 * Wrapper complet pour requête pagination
 * Exécute query ET traite résultats
 * @param {Object} pool - Pool PostgreSQL
 * @param {string} query - SQL query avec placeholders
 * @param {Array} params - Paramètres query
 * @param {Object} options - Options { limit, cursor, column, order }
 * @returns {Promise<Object>} { items, nextCursor, hasNext, count }
 */
async function paginate(pool, query, params, options = {}) {
  const {
    limit = 20,
    cursor = null,
    column = 'id',
    order = 'DESC'
  } = options;

  try {
    // Construire conditions curseur
    const cursorConfig = buildCursorQuery({ limit, cursor, column, order });
    
    // Combiner conditions existantes
    let finalQuery = query;
    let finalParams = [...params];

    // Ajouter conditions curseur à la fin avant ORDER BY
    if (cursorConfig.whereClause) {
      // Chercher ORDER BY et insérer avant
      const orderByIndex = finalQuery.toUpperCase().lastIndexOf('ORDER BY');
      if (orderByIndex !== -1) {
        finalQuery = 
          finalQuery.slice(0, orderByIndex).trim() + ' ' +
          cursorConfig.whereClause + ' ' +
          finalQuery.slice(orderByIndex);
      } else {
        finalQuery += ' ' + cursorConfig.whereClause;
      }
      finalParams = [...cursorConfig.params, ...params];
    }

    // Ajouter ORDER BY si absent
    if (!finalQuery.toUpperCase().includes('ORDER BY')) {
      finalQuery += ` ORDER BY ${column} ${order}`;
    }

    // Ajouter LIMIT
    finalQuery += ` LIMIT $${finalParams.length + 1}`;
    finalParams.push(cursorConfig.limit);

    // Exécuter requête
    const result = await pool.query(finalQuery, finalParams);

    // Traiter résultats
    return processCursorResults(result.rows, limit, column);
  } catch (err) {
    throw new Error(`Erreur pagination: ${err.message}`);
  }
}

/**
 * Middleware Express pour pagination
 * Ajoute req.pagination avec { limit, cursor, column, order }
 */
function paginationMiddleware(req, res, next) {
  const limit = Math.min(parseInt(req.query.limit) || 20, 1000);
  const cursor = req.query.cursor || null;
  const column = req.query.sortBy || 'id';
  const order = (req.query.order || 'DESC').toUpperCase();

  req.pagination = {
    limit,
    cursor,
    column: column.replace(/[^a-zA-Z0-9_]/g, ''), // Sécurité: éviter injection SQL
    order: order === 'ASC' ? 'ASC' : 'DESC'
  };

  res.paginationMeta = null; // À remplir après pagination

  next();
}

/**
 * Construit réponse paginée complète
 * @param {Object} data - Données paginées { items, nextCursor, hasNext, count }
 * @param {Object} meta - Métadonnées additionnelles
 * @returns {Object} Réponse formatée
 */
function formatPaginatedResponse(data, meta = {}) {
  return {
    data: data.items,
    pagination: {
      count: data.count,
      hasNext: data.hasNext,
      nextCursor: data.nextCursor
    },
    ...meta
  };
}

module.exports = {
  encodeCursor,
  decodeCursor,
  buildCursorQuery,
  processCursorResults,
  paginate,
  paginationMiddleware,
  formatPaginatedResponse
};

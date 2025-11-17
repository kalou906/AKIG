/**
 * Utilitaires pour les réponses API et pagination
 * backend/src/utils/response.js
 */

/**
 * Format une réponse JSON standard
 */
function successResponse(data, message = null, meta = null) {
  const response = {
    success: true,
    data,
  };

  if (message) response.message = message;
  if (meta) response.meta = meta;

  return response;
}

/**
 * Format une réponse avec pagination
 */
function paginatedResponse(data, total, page, limit, message = null) {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    message,
  };
}

/**
 * Récupère et valide les paramètres de pagination
 */
function getPaginationParams(req, defaultLimit = 20, maxLimit = 100) {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || defaultLimit;

  // Validation
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > maxLimit) limit = maxLimit;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Récupère les paramètres de tri
 */
function getSortParams(req, allowedFields = [], defaultSort = 'id') {
  const sort = req.query.sort || defaultSort;
  const order = (req.query.order || 'ASC').toUpperCase();

  // Validation du champ de tri
  if (allowedFields.length > 0 && !allowedFields.includes(sort)) {
    return { sort: defaultSort, order: 'ASC' };
  }

  if (!['ASC', 'DESC'].includes(order)) {
    return { sort, order: 'ASC' };
  }

  return { sort, order };
}

/**
 * Récupère et valide les paramètres de filtrage
 */
function getFilterParams(req, allowedFields = {}) {
  const filters = {};

  for (const [field, config] of Object.entries(allowedFields)) {
    if (req.query[field]) {
      const value = req.query[field];

      // Applique le type de validation si spécifié
      if (config.type === 'number') {
        filters[field] = parseInt(value);
      } else if (config.type === 'boolean') {
        filters[field] = value === 'true' || value === '1';
      } else if (config.type === 'date') {
        filters[field] = new Date(value);
      } else {
        filters[field] = String(value).trim();
      }
    }
  }

  return filters;
}

/**
 * Construit une clause WHERE pour SQL
 */
function buildWhereClause(filters, fieldMappings = {}) {
  const conditions = [];
  const params = [];

  for (const [field, value] of Object.entries(filters)) {
    const dbField = fieldMappings[field] || field;

    if (value === null || value === undefined) {
      conditions.push(`${dbField} IS NULL`);
    } else if (typeof value === 'boolean') {
      conditions.push(`${dbField} = $${params.length + 1}`);
      params.push(value);
    } else if (typeof value === 'number') {
      conditions.push(`${dbField} = $${params.length + 1}`);
      params.push(value);
    } else if (typeof value === 'string') {
      // Support pour les recherches partielles avec %
      if (value.includes('%')) {
        conditions.push(`${dbField} ILIKE $${params.length + 1}`);
      } else {
        conditions.push(`${dbField} = $${params.length + 1}`);
      }
      params.push(value);
    } else if (Array.isArray(value)) {
      const placeholders = value
        .map(() => `$${params.length + params.length + 1}`)
        .join(',');
      conditions.push(`${dbField} IN (${placeholders})`);
      params.push(...value);
    }
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

module.exports = {
  successResponse,
  paginatedResponse,
  getPaginationParams,
  getSortParams,
  getFilterParams,
  buildWhereClause,
};

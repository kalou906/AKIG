/**
 * Pagination Utility
 * Standardized pagination for all API endpoints
 */

const logger = require('../services/logger');

/**
 * Parse pagination parameters from request
 */
function parsePaginationParams(query) {
  let page = parseInt(query.page) || 1;
  let limit = parseInt(query.limit) || 20;
  let sort = query.sort || 'id:desc';
  let search = query.search || null;
  
  // Validate
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100; // Max 100 per page
  
  // Parse sort: "field:asc" or "field:desc"
  const [sortField, sortOrder] = sort.split(':');
  const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
  
  return {
    page,
    limit,
    offset: (page - 1) * limit,
    sort: `${sortField} ${validSortOrder.toUpperCase()}`,
    sortField,
    sortOrder: validSortOrder,
    search
  };
}

/**
 * Build WHERE clause for search/filters
 */
function buildWhereClause(filters, searchableFields = []) {
  const conditions = [];
  const values = [];
  let paramIndex = 1;
  
  // Add search condition if provided
  if (filters.search && searchableFields.length > 0) {
    const searchConditions = searchableFields.map(
      field => `${field} ILIKE $${paramIndex}`
    );
    conditions.push(`(${searchConditions.join(' OR ')})`);
    values.push(`%${filters.search}%`);
    paramIndex++;
  }
  
  // Add other filters
  for (const [key, value] of Object.entries(filters)) {
    if (key !== 'search' && value !== null && value !== undefined) {
      conditions.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }
  
  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values
  };
}

/**
 * Execute paginated query
 */
async function executePaginatedQuery(pool, {
  countQuery,
  dataQuery,
  params = [],
  pagination = {}
}) {
  try {
    // Get total count
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated data
    const dataResult = await pool.query(dataQuery, params);
    const data = dataResult.rows;
    
    // Calculate pagination info
    const pages = Math.ceil(total / pagination.limit);
    const hasMore = pagination.page < pages;
    
    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages,
        hasMore
      }
    };
  } catch (error) {
    logger.error(`Paginated query error: ${error.message}`);
    throw error;
  }
}

/**
 * Middleware to parse pagination parameters
 */
const paginationMiddleware = (req, res, next) => {
  req.pagination = parsePaginationParams(req.query);
  next();
};

/**
 * Format paginated response
 */
function formatPaginatedResponse(data, pagination) {
  return {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.pages,
      hasMore: pagination.hasMore
    }
  };
}

/**
 * Example usage in route:
 * 
 * router.get('/contracts', paginationMiddleware, async (req, res) => {
 *   const { page, limit, offset, sort } = req.pagination;
 *   
 *   const countQuery = `
 *     SELECT COUNT(*) as count FROM contracts
 *     WHERE tenant_id = $1
 *   `;
 *   
 *   const dataQuery = `
 *     SELECT * FROM contracts
 *     WHERE tenant_id = $1
 *     ORDER BY ${sort}
 *     LIMIT $2 OFFSET $3
 *   `;
 *   
 *   const result = await executePaginatedQuery(pool, {
 *     countQuery,
 *     dataQuery,
 *     params: [req.user.tenantId, limit, offset],
 *     pagination: req.pagination
 *   });
 *   
 *   res.json(formatPaginatedResponse(result.data, result.pagination));
 * });
 */

module.exports = {
  parsePaginationParams,
  buildWhereClause,
  executePaginatedQuery,
  paginationMiddleware,
  formatPaginatedResponse
};

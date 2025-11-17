/**
 * Exemples Pagination Curseur
 * Intégration dans les routes
 * backend/src/utils/PAGINATION_EXAMPLES.js
 */

const { 
  paginate, 
  formatPaginatedResponse,
  paginationMiddleware 
} = require('./cursor-pagination');

/**
 * EXEMPLE 1: Intégration simple dans route contrôleur
 * 
 * router.get('/api/contrats', paginationMiddleware, async (req, res) => {
 *   try {
 *     const query = `
 *       SELECT * FROM contrats
 *       WHERE actif = true
 *       ORDER BY created_at DESC
 *     `;
 *     
 *     const result = await paginate(pool, query, [true], {
 *       limit: req.pagination.limit,
 *       cursor: req.pagination.cursor,
 *       column: 'id',
 *       order: 'DESC'
 *     });
 *     
 *     res.json(formatPaginatedResponse(result, {
 *       message: 'Contrats récupérés'
 *     }));
 *   } catch (err) {
 *     res.status(500).json({ error: err.message });
 *   }
 * });
 */

/**
 * EXEMPLE 2: Pagination avec filtre tenant
 * 
 * router.get('/api/tenants/:tenantId/impayes', 
 *   paginationMiddleware, 
 *   async (req, res) => {
 *   try {
 *     const { tenantId } = req.params;
 *     
 *     const query = `
 *       SELECT * FROM impayes
 *       WHERE tenant_id = $1 AND statut = 'ouvert'
 *       ORDER BY montant DESC
 *     `;
 *     
 *     const result = await paginate(
 *       pool, 
 *       query, 
 *       [tenantId], 
 *       {
 *         limit: req.pagination.limit,
 *         cursor: req.pagination.cursor,
 *         column: 'id',
 *         order: 'DESC'
 *       }
 *     );
 *     
 *     res.json(formatPaginatedResponse(result, {
 *       tenantId,
 *       message: 'Impayes récupérés'
 *     }));
 *   } catch (err) {
 *     res.status(500).json({ error: err.message });
 *   }
 * });
 */

/**
 * EXEMPLE 3: Appel client avec curseur
 * 
 * Requête 1 (première page):
 * GET /api/contrats?limit=10
 * 
 * Réponse:
 * {
 *   "data": [ { id: 1, ... }, { id: 2, ... }, ... ],
 *   "pagination": {
 *     "count": 10,
 *     "hasNext": true,
 *     "nextCursor": "Y3Vyc29yOjEw"  // curseur encodé
 *   }
 * }
 * 
 * Requête 2 (page suivante):
 * GET /api/contrats?limit=10&cursor=Y3Vyc29yOjEw
 * 
 * Réponse: Prochains 10 éléments après l'ID 10
 */

/**
 * EXEMPLE 4: Classe wrapper pagination réutilisable
 * 
 * class PaginatedController {
 *   constructor(pool, logger) {
 *     this.pool = pool;
 *     this.logger = logger;
 *   }
 * 
 *   async getList(query, params, options = {}) {
 *     try {
 *       const result = await paginate(
 *         this.pool,
 *         query,
 *         params,
 *         {
 *           limit: options.limit || 20,
 *           cursor: options.cursor,
 *           column: options.column || 'id',
 *           order: options.order || 'DESC'
 *         }
 *       );
 *       
 *       this.logger.info('Pagination résultat', {
 *         count: result.count,
 *         hasNext: result.hasNext
 *       });
 *       
 *       return formatPaginatedResponse(result);
 *     } catch (err) {
 *       this.logger.error('Erreur pagination', err);
 *       throw err;
 *     }
 *   }
 * }
 */

/**
 * EXEMPLE 5: Test pagination curseur
 * 
 * const test = async () => {
 *   // Première page (limite 5)
 *   let response = await paginate(
 *     pool,
 *     'SELECT * FROM contrats ORDER BY id DESC',
 *     [],
 *     { limit: 5, column: 'id' }
 *   );
 *   
 *   console.log('Page 1:', response.count, 'éléments');
 *   console.log('Curseur suivant:', response.nextCursor);
 *   
 *   // Page suivante
 *   if (response.hasNext) {
 *     response = await paginate(
 *       pool,
 *       'SELECT * FROM contrats ORDER BY id DESC',
 *       [],
 *       { 
 *         limit: 5,
 *         cursor: response.nextCursor,
 *         column: 'id'
 *       }
 *     );
 *     
 *     console.log('Page 2:', response.count, 'éléments');
 *   }
 * };
 * 
 * test();
 */

/**
 * EXEMPLE 6: Frontend JavaScript pour boucle pagination
 * 
 * async function fetchAllPages(url) {
 *   const allItems = [];
 *   let cursor = null;
 *   let hasMore = true;
 *   
 *   while (hasMore) {
 *     const params = new URLSearchParams({ limit: 20 });
 *     if (cursor) params.append('cursor', cursor);
 *     
 *     const response = await fetch(`${url}?${params}`);
 *     const { data, pagination } = await response.json();
 *     
 *     allItems.push(...data);
 *     hasMore = pagination.hasNext;
 *     cursor = pagination.nextCursor;
 *   }
 *   
 *   return allItems;
 * }
 * 
 * // Utilisation:
 * const contrats = await fetchAllPages('/api/contrats');
 */

module.exports = {
  examples: 'Voir commentaires ci-dessus pour 6 exemples d\'intégration'
};

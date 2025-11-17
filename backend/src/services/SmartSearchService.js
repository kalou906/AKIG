/**
 * services/SmartSearchService.js
 * Service for intelligent search using NLP
 * Handles query parsing, semantic search, and result ranking
 */

const natural = require('natural');

class SmartSearchService {
  constructor(pool, redisClient) {
    this.pool = pool;
    this.redisClient = redisClient;
    
    // Initialize NLP tokenizer and stemmer
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
  }

  /**
   * Perform intelligent search across contracts/documents
   * @param {number} userId - User ID
   * @param {string} query - Search query
   * @param {string} searchType - Type to search ('contracts', 'invoices', 'all')
   * @param {number} limit - Max results
   * @returns {Array} Search results ranked by relevance
   */
  async search(userId, query, searchType = 'all', limit = 20) {
    try {
      if (!query || query.trim().length === 0) {
        throw new Error('Search query cannot be empty');
      }

      // Check cache first
      const cacheKey = `search:${userId}:${query}:${searchType}`;
      const cached = await this.redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Parse and normalize query
      const parsedQuery = this.parseQuery(query);
      
      // Build search SQL based on query type
      let searchResults = [];
      
      if (searchType === 'contracts' || searchType === 'all') {
        const contractResults = await this.searchContracts(
          userId,
          parsedQuery,
          limit
        );
        searchResults = [...searchResults, ...contractResults];
      }

      if (searchType === 'invoices' || searchType === 'all') {
        const invoiceResults = await this.searchInvoices(
          userId,
          parsedQuery,
          limit
        );
        searchResults = [...searchResults, ...invoiceResults];
      }

      // Rank results by relevance
      const rankedResults = this.rankResults(searchResults, parsedQuery);

      // Cache for 1 hour
      await this.redisClient.setex(
        cacheKey,
        3600,
        JSON.stringify(rankedResults)
      );

      return rankedResults.slice(0, limit);
    } catch (error) {
      console.error('Error performing search:', error);
      throw error;
    }
  }

  /**
   * Parse search query and extract keywords, filters
   * @private
   */
  parseQuery(query) {
    const tokens = this.tokenizer.tokenize(query.toLowerCase());
    
    // Remove stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been'
    ]);

    const keywords = tokens
      .filter(token => !stopWords.has(token) && token.length > 2)
      .map(token => this.stemmer.stem(token));

    // Extract filters (e.g., "type:contract", "status:active")
    const filterRegex = /(\w+):(\w+)/g;
    const filters = {};
    let match;

    while ((match = filterRegex.exec(query)) !== null) {
      filters[match[1]] = match[2];
    }

    return {
      keywords: [...new Set(keywords)],
      originalQuery: query,
      filters
    };
  }

  /**
   * Search in contracts table
   * @private
   */
  async searchContracts(userId, parsedQuery, limit) {
    try {
      const { keywords, filters } = parsedQuery;
      
      // Build dynamic WHERE clause based on keywords
      let whereConditions = [
        `user_id = $1`,
        `(title ILIKE $2 OR description ILIKE $2 OR 
          contract_number ILIKE $2 OR status ILIKE $2)`
      ];
      let queryParams = [
        userId,
        `%${parsedQuery.originalQuery}%`
      ];

      // Add filter conditions
      let paramIndex = 3;
      if (filters.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(filters.status);
        paramIndex++;
      }
      if (filters.type) {
        whereConditions.push(`contract_type = $${paramIndex}`);
        queryParams.push(filters.type);
        paramIndex++;
      }

      const query = `
        SELECT 
          id, title, contract_number, status, contract_type,
          start_date, end_date, amount, client_name, created_at,
          'contract' as entity_type
        FROM contracts
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY start_date DESC
        LIMIT $${paramIndex}
      `;

      queryParams.push(limit);
      const result = await this.pool.query(query, queryParams);

      return result.rows.map(row => ({
        ...row,
        relevanceScore: this.calculateRelevance(row, parsedQuery)
      }));
    } catch (error) {
      console.error('Error searching contracts:', error);
      return [];
    }
  }

  /**
   * Search in invoices table
   * @private
   */
  async searchInvoices(userId, parsedQuery, limit) {
    try {
      const { keywords, filters } = parsedQuery;

      let whereConditions = [
        `user_id = $1`,
        `(invoice_number ILIKE $2 OR client_name ILIKE $2 OR 
          description ILIKE $2 OR status ILIKE $2)`
      ];
      let queryParams = [
        userId,
        `%${parsedQuery.originalQuery}%`
      ];

      let paramIndex = 3;
      if (filters.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(filters.status);
        paramIndex++;
      }

      const query = `
        SELECT 
          id, invoice_number, client_name, amount, status,
          due_date, issued_date, created_at,
          'invoice' as entity_type
        FROM invoices
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY issued_date DESC
        LIMIT $${paramIndex}
      `;

      queryParams.push(limit);
      const result = await this.pool.query(query, queryParams);

      return result.rows.map(row => ({
        ...row,
        relevanceScore: this.calculateRelevance(row, parsedQuery)
      }));
    } catch (error) {
      console.error('Error searching invoices:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score for search result
   * @private
   */
  calculateRelevance(result, parsedQuery) {
    const { keywords } = parsedQuery;
    let score = 0;

    // Get searchable text from result
    const searchText = [
      result.title || result.invoice_number || '',
      result.description || result.client_name || '',
      result.contract_number || '',
      result.status || ''
    ].join(' ').toLowerCase();

    // Score based on keyword matches
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = searchText.match(regex);
      if (matches) {
        score += matches.length * 10;

        // Bonus for match at beginning
        if (searchText.startsWith(keyword)) {
          score += 5;
        }
      }
    });

    // Boost for recent items
    if (result.created_at) {
      const daysOld = (new Date() - new Date(result.created_at)) / (1000 * 60 * 60 * 24);
      if (daysOld < 7) score += 20;
      if (daysOld < 30) score += 10;
    }

    // Boost for active status
    if (result.status === 'active' || result.status === 'pending') {
      score += 5;
    }

    return score;
  }

  /**
   * Rank search results by relevance score
   * @private
   */
  rankResults(results, parsedQuery) {
    return results.sort((a, b) => {
      // Primary: relevance score (descending)
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }

      // Secondary: date (newest first)
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
  }

  /**
   * Get search suggestions based on user history
   * @param {number} userId - User ID
   * @param {string} prefix - Partial search term
   * @returns {Array} Suggested search terms
   */
  async getSuggestions(userId, prefix) {
    try {
      if (!prefix || prefix.length < 2) {
        return [];
      }

      // Check cache
      const cacheKey = `suggestions:${userId}:${prefix}`;
      const cached = await this.redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get from search history
      const result = await this.pool.query(
        `SELECT DISTINCT search_query
         FROM search_history
         WHERE user_id = $1 AND search_query ILIKE $2
         ORDER BY created_at DESC
         LIMIT 10`,
        [userId, `${prefix}%`]
      );

      const suggestions = result.rows.map(row => row.search_query);

      // Cache for 30 minutes
      await this.redisClient.setex(
        cacheKey,
        1800,
        JSON.stringify(suggestions)
      );

      return suggestions;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Log search for history tracking
   * @param {number} userId - User ID
   * @param {string} query - Search query
   * @param {number} resultsCount - Number of results
   */
  async logSearch(userId, query, resultsCount = 0) {
    try {
      await this.pool.query(
        `INSERT INTO search_history 
         (user_id, search_query, results_count, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [userId, query.trim().substring(0, 255), resultsCount]
      );
    } catch (error) {
      console.error('Error logging search:', error);
    }
  }

  /**
   * Get advanced search suggestions (trending, popular)
   * @returns {Object} Popular searches and trending
   */
  async getSearchAnalytics() {
    try {
      // Get trending searches
      const trendingResult = await this.pool.query(`
        SELECT search_query, COUNT(*) as frequency
        FROM search_history
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY search_query
        ORDER BY frequency DESC
        LIMIT 10
      `);

      return {
        trending: trendingResult.rows.map(row => ({
          query: row.search_query,
          frequency: row.frequency
        }))
      };
    } catch (error) {
      console.error('Error getting search analytics:', error);
      return { trending: [] };
    }
  }

  /**
   * Clear cache for user
   * @param {number} userId - User ID
   */
  async clearUserCache(userId) {
    try {
      const pattern = `search:${userId}:*`;
      const keys = await this.redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

module.exports = SmartSearchService;

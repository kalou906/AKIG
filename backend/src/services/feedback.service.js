/**
 * Feedback Service
 * src/services/feedback.service.js
 * 
 * Gère les opérations CRUD et l'analyse du feedback
 */

const pool = require('../db');
const logger = require('./logger');
const feedbackSentiment = require('./feedbackSentiment');

class FeedbackService {
  /**
   * Crée un nouveau feedback
   */
  static async createFeedback(feedbackData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        userId,
        agencyId,
        propertyId,
        tenantId,
        categoryId,
        typeId,
        score,
        title,
        comment,
        userAgent,
        ipAddress,
        locale,
      } = feedbackData;

      // Analyze sentiment using simplified classifier
      const sentimentAnalysis = feedbackSentiment.analyze(comment);
      const sentiment = sentimentAnalysis.sentiment;
      const sentimentScore = sentimentAnalysis.confidence;
      const keywords = sentimentAnalysis.keyPhrases;

      const query = `
        INSERT INTO feedback (
          user_id, agency_id, property_id, tenant_id, category_id, type_id,
          score, title, comment, sentiment, sentiment_score, keywords, 
          user_agent, ip_address, locale, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'new')
        RETURNING *;
      `;

      const values = [
        userId,
        agencyId,
        propertyId,
        tenantId,
        categoryId,
        typeId,
        score,
        title,
        comment,
        sentiment,
        sentimentScore,
        keywords,
        userAgent,
        ipAddress,
        locale,
      ];

      const result = await client.query(query, values);

      // Auto-set priority based on score
      if (score <= 3) {
        await client.query(
          'UPDATE feedback SET priority = $1 WHERE id = $2',
          ['critical', result.rows[0].id]
        );
      } else if (score <= 5) {
        await client.query(
          'UPDATE feedback SET priority = $1 WHERE id = $2',
          ['high', result.rows[0].id]
        );
      }

      await client.query('COMMIT');
      logger.info(`Feedback created: ${result.rows[0].id}`, { userId });

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating feedback', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Récupère un feedback par ID
   */
  static async getFeedbackById(id) {
    const query = `
      SELECT * FROM vw_feedback_with_details
      WHERE id = $1;
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Récupère tous les feedback avec pagination et filtrage
   */
  static async getAllFeedback(filters = {}) {
    const {
      userId,
      agencyId,
      status,
      sentiment,
      priority,
      categoryId,
      typeId,
      minScore,
      maxScore,
      startDate,
      endDate,
      search,
      limit = 20,
      offset = 0,
    } = filters;

    let query = 'SELECT * FROM vw_feedback_with_details WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (userId) {
      query += ` AND user_id = $${paramCount}`;
      values.push(userId);
      paramCount++;
    }

    if (agencyId) {
      query += ` AND agency_id = $${paramCount}`;
      values.push(agencyId);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (sentiment) {
      query += ` AND sentiment = $${paramCount}`;
      values.push(sentiment);
      paramCount++;
    }

    if (priority) {
      query += ` AND priority = $${paramCount}`;
      values.push(priority);
      paramCount++;
    }

    if (categoryId) {
      query += ` AND category_id = $${paramCount}`;
      values.push(categoryId);
      paramCount++;
    }

    if (typeId) {
      query += ` AND type_id = $${paramCount}`;
      values.push(typeId);
      paramCount++;
    }

    if (minScore !== undefined) {
      query += ` AND score >= $${paramCount}`;
      values.push(minScore);
      paramCount++;
    }

    if (maxScore !== undefined) {
      query += ` AND score <= $${paramCount}`;
      values.push(maxScore);
      paramCount++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramCount}`;
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramCount}`;
      values.push(endDate);
      paramCount++;
    }

    if (search) {
      query += ` AND (comment @@ plainto_tsquery('french', $${paramCount}) 
                  OR title ILIKE $${paramCount + 1})`;
      values.push(search);
      values.push(`%${search}%`);
      paramCount += 2;
    }

    query += ' ORDER BY created_at DESC';

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM (${query}) AS counted`,
      values
    );

    // Fetch paginated results
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset,
      hasMore: offset + limit < parseInt(countResult.rows[0].total),
    };
  }

  /**
   * Met à jour un feedback
   */
  static async updateFeedback(id, updateData) {
    const {
      status,
      priority,
      categoryId,
      typeId,
      sentiment,
      sentimentScore,
    } = updateData;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (priority) {
      updates.push(`priority = $${paramCount}`);
      values.push(priority);
      paramCount++;
    }

    if (categoryId) {
      updates.push(`category_id = $${paramCount}`);
      values.push(categoryId);
      paramCount++;
    }

    if (typeId) {
      updates.push(`type_id = $${paramCount}`);
      values.push(typeId);
      paramCount++;
    }

    if (sentiment) {
      updates.push(`sentiment = $${paramCount}`);
      values.push(sentiment);
      paramCount++;
    }

    if (sentimentScore !== undefined) {
      updates.push(`sentiment_score = $${paramCount}`);
      values.push(sentimentScore);
      paramCount++;
    }

    // Auto-set resolved_at if status changes to resolved
    if (status === 'resolved') {
      updates.push('resolved_at = NOW()');
    }

    if (updates.length === 0) {
      return this.getFeedbackById(id);
    }

    values.push(id);

    const query = `
      UPDATE feedback
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    logger.info(`Feedback updated: ${id}`, { changes: updateData });

    return result.rows[0] || null;
  }

  /**
   * Ajoute une réponse à un feedback
   */
  static async addResponse(feedbackId, adminId, responseText, responseType = 'reply') {
    const query = `
      INSERT INTO feedback_responses (feedback_id, admin_id, response_text, response_type)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const result = await pool.query(query, [feedbackId, adminId, responseText, responseType]);

    // Auto-update feedback status to 'acknowledged'
    await pool.query(
      'UPDATE feedback SET status = $1 WHERE id = $2 AND status = $3',
      ['acknowledged', feedbackId, 'new']
    );

    logger.info(`Response added to feedback: ${feedbackId}`, { adminId });

    return result.rows[0];
  }

  /**
   * Récupère les réponses pour un feedback
   */
  static async getFeedbackResponses(feedbackId) {
    const query = `
      SELECT 
        fr.*,
        u.first_name,
        u.last_name,
        u.email
      FROM feedback_responses fr
      LEFT JOIN users u ON fr.admin_id = u.id
      WHERE fr.feedback_id = $1
      ORDER BY fr.created_at ASC;
    `;

    const result = await pool.query(query, [feedbackId]);
    return result.rows;
  }

  /**
   * Ajoute une évaluation détaillée
   */
  static async addRatings(feedbackId, ratings) {
    const {
      npsScore,
      csatScore,
      cesScore,
      qualityScore,
      responsivenessScore,
    } = ratings;

    const query = `
      INSERT INTO feedback_ratings (
        feedback_id, nps_score, csat_score, ces_score, quality_score, responsiveness_score
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const result = await pool.query(query, [
      feedbackId,
      npsScore,
      csatScore,
      cesScore,
      qualityScore,
      responsivenessScore,
    ]);

    return result.rows[0];
  }

  /**
   * Obtient des statistiques sur le feedback
   */
  static async getFeedbackStats(filters = {}) {
    const { agencyId, startDate, endDate, groupBy = 'daily' } = filters;

    let query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        AVG(score) as avg_score,
        COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive,
        COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral,
        COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative,
        COUNT(CASE WHEN status != 'closed' THEN 1 END) as unresolved
      FROM feedback
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (agencyId) {
      query += ` AND agency_id = $${paramCount}`;
      values.push(agencyId);
      paramCount++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramCount}`;
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramCount}`;
      values.push(endDate);
      paramCount++;
    }

    query += ' GROUP BY DATE(created_at) ORDER BY date DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Obtient les feedback par catégorie
   */
  static async getFeedbackByCategory(agencyId = null) {
    let query = `
      SELECT 
        fc.id,
        fc.name,
        fc.code,
        COUNT(f.id) as count,
        AVG(f.score) as avg_score
      FROM feedback_categories fc
      LEFT JOIN feedback f ON fc.id = f.category_id
      WHERE 1=1
    `;

    const values = [];

    if (agencyId) {
      query += ` AND f.agency_id = $1`;
      values.push(agencyId);
    }

    query += ` GROUP BY fc.id ORDER BY count DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Calcule le sentiment basé sur le score
   */
  static calculateSentimentFromScore(score) {
    if (score >= 8) return 'positive';
    if (score >= 5) return 'neutral';
    return 'negative';
  }

  /**
   * Obtient les feedback non résolu
   */
  static async getUnresolvedFeedback(agencyId = null, priority = null) {
    let query = `SELECT * FROM vw_unresolved_feedback WHERE 1=1`;
    const values = [];
    let paramCount = 1;

    if (agencyId) {
      query += ` AND agency_id = $${paramCount}`;
      values.push(agencyId);
      paramCount++;
    }

    if (priority) {
      query += ` AND priority = $${paramCount}`;
      values.push(priority);
      paramCount++;
    }

    query += ` ORDER BY priority DESC, created_at ASC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Supprimer un feedback
   */
  static async deleteFeedback(id) {
    const query = 'DELETE FROM feedback WHERE id = $1 RETURNING id;';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length > 0) {
      logger.info(`Feedback deleted: ${id}`);
    }
    
    return result.rows[0] || null;
  }
}

module.exports = FeedbackService;

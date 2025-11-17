/**
 * Widgets Service
 * backend/src/services/widgets.js
 * 
 * Service pour la gestion avancée des widgets
 */

const pool = require('../db');
const logger = require('./logger');

/**
 * Récupère les données d'un widget overview
 */
async function getOverviewData(userId) {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(p.id) as property_count,
        COUNT(t.id) as tenant_count,
        SUM(p.monthly_rent) as total_monthly_rent,
        COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_contracts,
        COUNT(CASE WHEN c.status = 'ending' THEN 1 END) as ending_contracts
       FROM properties p
       LEFT JOIN tenants t ON p.id = t.property_id
       LEFT JOIN contracts c ON p.id = c.property_id
       WHERE p.agency_id = (SELECT agency_id FROM users WHERE id = $1)`,
      [userId]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting overview data', { error: error.message, userId });
    throw error;
  }
}

/**
 * Récupère les données de cashflow
 */
async function getCashflowData(userId, months = 12) {
  try {
    const result = await pool.query(
      `SELECT 
        DATE_TRUNC('month', p.paid_at)::DATE as month,
        SUM(p.amount) as income,
        COUNT(p.id) as payment_count,
        COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_count
       FROM payments p
       JOIN contracts c ON p.contract_id = c.id
       JOIN properties pr ON c.property_id = pr.id
       WHERE pr.agency_id = (SELECT agency_id FROM users WHERE id = $1)
       AND p.paid_at >= NOW() - INTERVAL '${months} months'
       GROUP BY DATE_TRUNC('month', p.paid_at)
       ORDER BY month DESC`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting cashflow data', { error: error.message, userId });
    throw error;
  }
}

/**
 * Récupère les données des propriétés
 */
async function getPropertiesData(userId, limit = 5) {
  try {
    const result = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.address,
        p.monthly_rent,
        COUNT(t.id) as tenant_count,
        COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_contracts
       FROM properties p
       LEFT JOIN tenants t ON p.id = t.property_id
       LEFT JOIN contracts c ON p.id = c.property_id
       WHERE p.agency_id = (SELECT agency_id FROM users WHERE id = $1)
       GROUP BY p.id, p.name, p.address, p.monthly_rent
       ORDER BY p.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting properties data', { error: error.message, userId });
    throw error;
  }
}

/**
 * Récupère les données de paiements
 */
async function getPaymentsData(userId, days = 30) {
  try {
    const result = await pool.query(
      `SELECT 
        p.id,
        p.amount,
        p.status,
        p.paid_at,
        p.due_date,
        c.contract_number,
        pr.name as property_name
       FROM payments p
       JOIN contracts c ON p.contract_id = c.id
       JOIN properties pr ON c.property_id = pr.id
       WHERE pr.agency_id = (SELECT agency_id FROM users WHERE id = $1)
       AND (p.paid_at >= NOW() - INTERVAL '${days} days' 
            OR (p.status = 'pending' AND p.due_date >= NOW()))
       ORDER BY p.paid_at DESC
       LIMIT 10`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting payments data', { error: error.message, userId });
    throw error;
  }
}

/**
 * Récupère les alertes
 */
async function getAlertsData(userId) {
  try {
    const result = await pool.query(
      `SELECT 
        'overdue_payment' as alert_type,
        p.id as entity_id,
        'Paiement en retard' as message,
        pr.name as entity_name,
        p.due_date as created_at
       FROM payments p
       JOIN contracts c ON p.contract_id = c.id
       JOIN properties pr ON c.property_id = pr.id
       WHERE pr.agency_id = (SELECT agency_id FROM users WHERE id = $1)
       AND p.status = 'pending' AND p.due_date < NOW()
       
       UNION ALL
       
       SELECT 
        'ending_contract' as alert_type,
        c.id as entity_id,
        'Contrat se terminant bientôt' as message,
        pr.name as entity_name,
        c.end_date as created_at
       FROM contracts c
       JOIN properties pr ON c.property_id = pr.id
       WHERE pr.agency_id = (SELECT agency_id FROM users WHERE id = $1)
       AND c.status = 'active' AND c.end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
       
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting alerts data', { error: error.message, userId });
    throw error;
  }
}

/**
 * Récupère les données de feedback
 */
async function getFeedbackData(userId, limit = 5) {
  try {
    const result = await pool.query(
      `SELECT 
        f.id,
        f.type,
        f.category,
        f.rating,
        f.sentiment,
        f.created_at,
        f.status,
        t.first_name as tenant_name
       FROM feedback f
       LEFT JOIN tenants t ON f.tenant_id = t.id
       WHERE f.agency_id = (SELECT agency_id FROM users WHERE id = $1)
       ORDER BY f.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting feedback data', { error: error.message, userId });
    throw error;
  }
}

/**
 * Récupère les données de documents
 */
async function getDocumentsData(userId, limit = 5) {
  try {
    const result = await pool.query(
      `SELECT 
        d.id,
        d.name,
        d.document_type,
        d.created_at,
        COUNT(dv.id) as version_count
       FROM documents d
       LEFT JOIN document_versions dv ON d.id = dv.document_id
       WHERE d.agency_id = (SELECT agency_id FROM users WHERE id = $1)
       GROUP BY d.id, d.name, d.document_type, d.created_at
       ORDER BY d.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting documents data', { error: error.message, userId });
    throw error;
  }
}

/**
 * Récupère les données de maintenance
 */
async function getMaintenanceData(userId, limit = 5) {
  try {
    const result = await pool.query(
      `SELECT 
        m.id,
        m.title,
        m.status,
        m.priority,
        m.created_at,
        pr.name as property_name
       FROM maintenance m
       JOIN properties pr ON m.property_id = pr.id
       WHERE pr.agency_id = (SELECT agency_id FROM users WHERE id = $1)
       AND m.status IN ('pending', 'in_progress')
       ORDER BY m.priority DESC, m.created_at ASC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting maintenance data', { error: error.message, userId });
    throw error;
  }
}

/**
 * Récupère les données de locataires
 */
async function getTenantsData(userId, limit = 5) {
  try {
    const result = await pool.query(
      `SELECT 
        t.id,
        t.first_name,
        t.last_name,
        t.email,
        t.phone,
        pr.name as property_name,
        c.contract_number
       FROM tenants t
       JOIN contracts c ON t.id = c.tenant_id
       JOIN properties pr ON c.property_id = pr.id
       WHERE pr.agency_id = (SELECT agency_id FROM users WHERE id = $1)
       AND c.status = 'active'
       ORDER BY t.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting tenants data', { error: error.message, userId });
    throw error;
  }
}

/**
 * Récupère les données pour un widget en fonction de son type
 */
async function getWidgetData(userId, widgetType, config = {}) {
  try {
    switch (widgetType) {
      case 'overview':
        return await getOverviewData(userId);

      case 'cashflow':
        return await getCashflowData(userId, config.months || 12);

      case 'properties':
        return await getPropertiesData(userId, config.limit || 5);

      case 'payments':
        return await getPaymentsData(userId, config.days || 30);

      case 'alerts':
        return await getAlertsData(userId);

      case 'feedback':
        return await getFeedbackData(userId, config.limit || 5);

      case 'documents':
        return await getDocumentsData(userId, config.limit || 5);

      case 'maintenance':
        return await getMaintenanceData(userId, config.limit || 5);

      case 'tenants':
        return await getTenantsData(userId, config.limit || 5);

      default:
        logger.warn('Unknown widget type', { widgetType });
        return null;
    }
  } catch (error) {
    logger.error('Error fetching widget data', { error: error.message, widgetType });
    throw error;
  }
}

module.exports = {
  getOverviewData,
  getCashflowData,
  getPropertiesData,
  getPaymentsData,
  getAlertsData,
  getFeedbackData,
  getDocumentsData,
  getMaintenanceData,
  getTenantsData,
  getWidgetData,
};

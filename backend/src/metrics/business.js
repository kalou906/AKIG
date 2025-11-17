/**
 * Business Metrics Service
 * Expose des métriques métier pour Prometheus
 * Immobilier: Occupation, loyers, impayés, tendances
 */

const client = require('prom-client');
const { trace } = require('@opentelemetry/api');
const logger = require('../services/logger');

const tracer = trace.getTracer('business-metrics');

// Registry personnalisé
const registry = new client.Registry();

// ============================================
// Métriques d'Occupation
// ============================================

const occupancyRate = new client.Gauge({
  name: 'akig_occupancy_rate_percent',
  help: 'Taux d\'occupation des biens immobiliers (%)',
  labelNames: ['agency_id', 'property_type'],
  registers: [registry],
});

const vacantUnits = new client.Gauge({
  name: 'akig_vacant_units_total',
  help: 'Nombre total de biens vacants',
  labelNames: ['agency_id', 'property_type'],
  registers: [registry],
});

const occupiedUnits = new client.Gauge({
  name: 'akig_occupied_units_total',
  help: 'Nombre total de biens occupés',
  labelNames: ['agency_id', 'property_type'],
  registers: [registry],
});

// ============================================
// Métriques Financières
// ============================================

const totalArrears = new client.Gauge({
  name: 'akig_arrears_total_amount',
  help: 'Montant total des loyers impayés',
  labelNames: ['agency_id'],
  registers: [registry],
});

const overdueDaysAverage = new client.Gauge({
  name: 'akig_overdue_days_average',
  help: 'Nombre moyen de jours de retard',
  labelNames: ['agency_id'],
  registers: [registry],
});

const monthlyRentExpected = new client.Gauge({
  name: 'akig_monthly_rent_expected_total',
  help: 'Montant total des loyers attendus mensuellement',
  labelNames: ['agency_id'],
  registers: [registry],
});

const monthlyRentCollected = new client.Gauge({
  name: 'akig_monthly_rent_collected_total',
  help: 'Montant total des loyers collectés',
  labelNames: ['agency_id'],
  registers: [registry],
});

const rentCollectionRate = new client.Gauge({
  name: 'akig_rent_collection_rate_percent',
  help: 'Pourcentage de loyers collectés',
  labelNames: ['agency_id'],
  registers: [registry],
});

// ============================================
// Métriques de Contrats
// ============================================

const activeContracts = new client.Gauge({
  name: 'akig_active_contracts_total',
  help: 'Nombre total de contrats actifs',
  labelNames: ['agency_id'],
  registers: [registry],
});

const contractsExpiringSoon = new client.Gauge({
  name: 'akig_contracts_expiring_soon_total',
  help: 'Contrats expirant dans 30 jours',
  labelNames: ['agency_id'],
  registers: [registry],
});

const averageLeaseLength = new client.Gauge({
  name: 'akig_average_lease_length_months',
  help: 'Durée moyenne des baux en mois',
  labelNames: ['agency_id'],
  registers: [registry],
});

// ============================================
// Métriques de Maintenance
// ============================================

const pendingRepairs = new client.Gauge({
  name: 'akig_pending_repairs_total',
  help: 'Nombre total de réparations en attente',
  labelNames: ['agency_id', 'priority'],
  registers: [registry],
});

const averageRepairCost = new client.Gauge({
  name: 'akig_average_repair_cost',
  help: 'Coût moyen des réparations',
  labelNames: ['agency_id'],
  registers: [registry],
});

const repairCompletionRate = new client.Gauge({
  name: 'akig_repair_completion_rate_percent',
  help: 'Pourcentage de réparations complétées dans le délai',
  labelNames: ['agency_id'],
  registers: [registry],
});

// ============================================
// Métriques Locataires
// ============================================

const totalTenants = new client.Gauge({
  name: 'akig_total_tenants_count',
  help: 'Nombre total de locataires',
  labelNames: ['agency_id'],
  registers: [registry],
});

const newTenants = new client.Gauge({
  name: 'akig_new_tenants_monthly',
  help: 'Nouveaux locataires ce mois',
  labelNames: ['agency_id'],
  registers: [registry],
});

const tenantsInDefault = new client.Gauge({
  name: 'akig_tenants_in_default_total',
  help: 'Locataires en défaut de paiement',
  labelNames: ['agency_id'],
  registers: [registry],
});

// ============================================
// Métriques d'Audit & Conformité
// ============================================

const auditLogEntries = new client.Counter({
  name: 'akig_audit_log_entries_total',
  help: 'Nombre total d\'entrées audit',
  labelNames: ['action', 'entity'],
  registers: [registry],
});

const documentsUploaded = new client.Counter({
  name: 'akig_documents_uploaded_total',
  help: 'Nombre total de documents uploadés',
  labelNames: ['document_type'],
  registers: [registry],
});

const complianceIssues = new client.Gauge({
  name: 'akig_compliance_issues_total',
  help: 'Nombre total de problèmes de conformité',
  labelNames: ['agency_id', 'issue_type'],
  registers: [registry],
});

// ============================================
// Histogrammes Financiers
// ============================================

const invoiceAmount = new client.Histogram({
  name: 'akig_invoice_amount_histogram',
  help: 'Distribution des montants de factures',
  labelNames: ['agency_id'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000],
  registers: [registry],
});

const paymentProcessingTime = new client.Histogram({
  name: 'akig_payment_processing_time_seconds',
  help: 'Temps de traitement des paiements',
  labelNames: ['payment_method'],
  buckets: [0.1, 0.5, 1, 5, 10],
  registers: [registry],
});

// ============================================
// Fonctions de Mise à Jour
// ============================================

/**
 * Rafraîchit les métriques d'occupation
 * @param {Pool} pool - Connection PostgreSQL
 * @param {number} agencyId - ID agence
 */
async function updateOccupancyMetrics(pool, agencyId) {
  const span = tracer.startSpan('metrics.updateOccupancyMetrics');

  try {
    // Taux d'occupation global
    const { rows: occupancyData } = await pool.query(
      `SELECT 
        ROUND((COUNT(CASE WHEN status = 'occupied' THEN 1 END)::numeric / 
               NULLIF(COUNT(*), 0) * 100), 2) AS rate,
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) AS occupied,
        COUNT(CASE WHEN status = 'vacant' THEN 1 END) AS vacant
       FROM contracts c
       WHERE c.agency_id = $1 AND c.status = 'active'`,
      [agencyId]
    );

    if (occupancyData.length > 0) {
      const data = occupancyData[0];
      occupancyRate.set({ agency_id: agencyId, property_type: 'all' }, parseFloat(data.rate) || 0);
      occupiedUnits.set({ agency_id: agencyId, property_type: 'all' }, data.occupied || 0);
      vacantUnits.set({ agency_id: agencyId, property_type: 'all' }, data.vacant || 0);

      logger.debug('Occupancy metrics updated', {
        agency_id: agencyId,
        occupancy_rate: data.rate,
        occupied_units: data.occupied,
        vacant_units: data.vacant,
      });
    }

    span.addEvent('occupancy_metrics_updated');
  } catch (error) {
    logger.error('Error updating occupancy metrics', {
      agency_id: agencyId,
      error: error.message,
    });
    span.recordException(error);
  } finally {
    span.end();
  }
}

/**
 * Rafraîchit les métriques financières
 * @param {Pool} pool - Connection PostgreSQL
 * @param {number} agencyId - ID agence
 */
async function updateFinancialMetrics(pool, agencyId) {
  const span = tracer.startSpan('metrics.updateFinancialMetrics');

  try {
    // Impayés totaux
    const { rows: arrearsData } = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_arrears
       FROM invoices
       WHERE status = 'overdue' AND agency_id = $1`,
      [agencyId]
    );

    if (arrearsData.length > 0) {
      totalArrears.set(
        { agency_id: agencyId },
        parseFloat(arrearsData[0].total_arrears) || 0
      );
    }

    // Moyenne des jours de retard
    const { rows: overdueData } = await pool.query(
      `SELECT 
        ROUND(AVG(EXTRACT(DAY FROM NOW() - due_date))::numeric, 1) AS avg_overdue_days
       FROM invoices
       WHERE status = 'overdue' AND agency_id = $1`,
      [agencyId]
    );

    if (overdueData.length > 0) {
      overdueDaysAverage.set(
        { agency_id: agencyId },
        parseFloat(overdueData[0].avg_overdue_days) || 0
      );
    }

    // Loyers attendus vs collectés
    const { rows: rentData } = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS collected,
        COALESCE(SUM(amount), 0) AS expected,
        ROUND((COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)::numeric / 
               NULLIF(SUM(amount), 0) * 100), 2) AS collection_rate
       FROM invoices
       WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
       AND agency_id = $1`,
      [agencyId]
    );

    if (rentData.length > 0) {
      monthlyRentCollected.set({ agency_id: agencyId }, parseFloat(rentData[0].collected) || 0);
      monthlyRentExpected.set({ agency_id: agencyId }, parseFloat(rentData[0].expected) || 0);
      rentCollectionRate.set(
        { agency_id: agencyId },
        parseFloat(rentData[0].collection_rate) || 0
      );
    }

    logger.debug('Financial metrics updated', {
      agency_id: agencyId,
      total_arrears: arrearsData[0]?.total_arrears,
      collection_rate: rentData[0]?.collection_rate,
    });

    span.addEvent('financial_metrics_updated');
  } catch (error) {
    logger.error('Error updating financial metrics', {
      agency_id: agencyId,
      error: error.message,
    });
    span.recordException(error);
  } finally {
    span.end();
  }
}

/**
 * Rafraîchit les métriques de contrats
 * @param {Pool} pool - Connection PostgreSQL
 * @param {number} agencyId - ID agence
 */
async function updateContractMetrics(pool, agencyId) {
  const span = tracer.startSpan('metrics.updateContractMetrics');

  try {
    // Contrats actifs
    const { rows: activeData } = await pool.query(
      `SELECT COUNT(*) AS count
       FROM contracts
       WHERE status = 'active' AND agency_id = $1`,
      [agencyId]
    );

    if (activeData.length > 0) {
      activeContracts.set({ agency_id: agencyId }, activeData[0].count || 0);
    }

    // Contrats expirant bientôt
    const { rows: expiringData } = await pool.query(
      `SELECT COUNT(*) AS count
       FROM contracts
       WHERE status = 'active' 
       AND end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
       AND agency_id = $1`,
      [agencyId]
    );

    if (expiringData.length > 0) {
      contractsExpiringSoon.set({ agency_id: agencyId }, expiringData[0].count || 0);
    }

    // Durée moyenne des baux
    const { rows: lengthData } = await pool.query(
      `SELECT 
        ROUND(AVG(EXTRACT(DAY FROM (end_date - start_date)) / 30.44)::numeric, 1) AS avg_length_months
       FROM contracts
       WHERE status = 'completed' AND agency_id = $1`,
      [agencyId]
    );

    if (lengthData.length > 0) {
      averageLeaseLength.set(
        { agency_id: agencyId },
        parseFloat(lengthData[0].avg_length_months) || 0
      );
    }

    logger.debug('Contract metrics updated', {
      agency_id: agencyId,
      active_contracts: activeData[0]?.count,
    });

    span.addEvent('contract_metrics_updated');
  } catch (error) {
    logger.error('Error updating contract metrics', {
      agency_id: agencyId,
      error: error.message,
    });
    span.recordException(error);
  } finally {
    span.end();
  }
}

/**
 * Rafraîchit les métriques de locataires
 * @param {Pool} pool - Connection PostgreSQL
 * @param {number} agencyId - ID agence
 */
async function updateTenantMetrics(pool, agencyId) {
  const span = tracer.startSpan('metrics.updateTenantMetrics');

  try {
    // Nombre total de locataires
    const { rows: totalData } = await pool.query(
      `SELECT COUNT(DISTINCT u.id) AS count
       FROM users u
       JOIN contracts c ON u.id = c.tenant_id
       WHERE c.status = 'active' AND c.agency_id = $1`,
      [agencyId]
    );

    if (totalData.length > 0) {
      totalTenants.set({ agency_id: agencyId }, totalData[0].count || 0);
    }

    // Nouveaux locataires ce mois
    const { rows: newData } = await pool.query(
      `SELECT COUNT(DISTINCT u.id) AS count
       FROM users u
       JOIN contracts c ON u.id = c.tenant_id
       WHERE DATE_TRUNC('month', c.created_at) = DATE_TRUNC('month', NOW())
       AND c.agency_id = $1`,
      [agencyId]
    );

    if (newData.length > 0) {
      newTenants.set({ agency_id: agencyId }, newData[0].count || 0);
    }

    // Locataires en défaut
    const { rows: defaultData } = await pool.query(
      `SELECT COUNT(DISTINCT u.id) AS count
       FROM users u
       JOIN contracts c ON u.id = c.tenant_id
       JOIN invoices i ON c.id = i.contract_id
       WHERE i.status = 'overdue' AND c.agency_id = $1`,
      [agencyId]
    );

    if (defaultData.length > 0) {
      tenantsInDefault.set({ agency_id: agencyId }, defaultData[0].count || 0);
    }

    logger.debug('Tenant metrics updated', {
      agency_id: agencyId,
      total_tenants: totalData[0]?.count,
    });

    span.addEvent('tenant_metrics_updated');
  } catch (error) {
    logger.error('Error updating tenant metrics', {
      agency_id: agencyId,
      error: error.message,
    });
    span.recordException(error);
  } finally {
    span.end();
  }
}

/**
 * Rafraîchit toutes les métriques métier
 * @param {Pool} pool - Connection PostgreSQL
 * @param {number|null} agencyId - ID agence (null = toutes)
 */
async function refreshAllMetrics(pool, agencyId = null) {
  const span = tracer.startSpan('metrics.refreshAllMetrics', {
    attributes: {
      'agency_id': agencyId || 'all',
    },
  });

  try {
    let agencies = [];

    if (agencyId) {
      agencies = [agencyId];
    } else {
      // Récupérer toutes les agences
      const { rows } = await pool.query(
        `SELECT DISTINCT agency_id FROM contracts WHERE agency_id IS NOT NULL`
      );
      agencies = rows.map((r) => r.agency_id);
    }

    logger.info('Refreshing business metrics', {
      agencies_count: agencies.length,
    });

    // Rafraîchir pour chaque agence
    for (const aid of agencies) {
      await Promise.all([
        updateOccupancyMetrics(pool, aid),
        updateFinancialMetrics(pool, aid),
        updateContractMetrics(pool, aid),
        updateTenantMetrics(pool, aid),
      ]);
    }

    span.addEvent('all_metrics_refreshed', {
      'agencies_count': agencies.length,
    });

    logger.info('Business metrics refresh completed', {
      agencies_refreshed: agencies.length,
    });
  } catch (error) {
    logger.error('Error refreshing metrics', {
      error: error.message,
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Enregistre un traitement de paiement
 * @param {number} durationSeconds - Durée du traitement
 * @param {string} method - Méthode de paiement
 */
function recordPaymentProcessing(durationSeconds, method = 'unknown') {
  paymentProcessingTime.observe({ payment_method: method }, durationSeconds);
}

/**
 * Enregistre l'upload d'un document
 * @param {string} documentType - Type de document
 */
function recordDocumentUpload(documentType = 'other') {
  documentsUploaded.inc({ document_type: documentType });
}

/**
 * Enregistre une action d'audit
 * @param {string} action - Action (CREATE, UPDATE, DELETE, etc.)
 * @param {string} entity - Entité (users, contracts, etc.)
 */
function recordAuditAction(action, entity) {
  auditLogEntries.inc({ action, entity });
}

/**
 * Enregistre une facture
 * @param {number} amount - Montant
 * @param {number} agencyId - ID agence
 */
function recordInvoiceAmount(amount, agencyId) {
  invoiceAmount.observe({ agency_id: agencyId }, amount);
}

module.exports = {
  registry,
  refreshAllMetrics,
  updateOccupancyMetrics,
  updateFinancialMetrics,
  updateContractMetrics,
  updateTenantMetrics,
  recordPaymentProcessing,
  recordDocumentUpload,
  recordAuditAction,
  recordInvoiceAmount,
};

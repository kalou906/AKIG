/**
 * 🎯 SERVICE COMPLET - Tout dans chaque bouton
 * Aucune limitation, toutes les données accessibles
 * 
 * backend/src/services/unified-dashboard.service.js
 */

const pool = require('../db');
const logger = require('./logger');
const AgencyDocumentsService = require('./agency-documents.service');
const BrandingService = require('./branding.service');
const AIImmobilierService = require('./ai-immobilier.service');

/**
 * Service dashboard unifié
 * Récupère TOUT via un seul endpoint
 */
const UnifiedDashboardService = {
  /**
   * Récupérer données COMPLÈTES pour dashboard
   * Zéro limitation, tout accessible
   */
  async getCompleteDataForButton(buttonType, params = {}) {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        type: buttonType,
        data: {}
      };

      switch (buttonType) {
        case 'PROPERTIES':
          data.data = await this.getAllPropertiesWithDetails(params);
          break;

        case 'TENANTS':
          data.data = await this.getAllTenantsWithAnalysis(params);
          break;

        case 'PAYMENTS':
          data.data = await this.getAllPaymentsWithReports(params);
          break;

        case 'CONTRACTS':
          data.data = await this.getAllContractsWithDocuments(params);
          break;

        case 'ARREARS':
          data.data = await this.getCompleteArrearsData(params);
          break;

        case 'ANALYTICS':
          data.data = await this.getComprehensiveAnalytics(params);
          break;

        case 'DOCUMENTS':
          data.data = await this.getAllAgencyDocuments(params);
          break;

        case 'BRANDING':
          data.data = await this.getBrandingConfiguration(params);
          break;

        case 'AI_INSIGHTS':
          data.data = await this.getAIInsights(params);
          break;

        case 'EXPORT':
          data.data = await this.prepareCompleteExport(params);
          break;

        default:
          throw new Error(`Type bouton inconnu: ${buttonType}`);
      }

      logger.info('Données complètes récupérées', { buttonType });
      return data;
    } catch (err) {
      logger.error('Erreur récupération données complètes', err);
      throw err;
    }
  },

  /**
   * PROPERTIES - Toutes les propriétés avec détails complets
   */
  async getAllPropertiesWithDetails(params = {}) {
    try {
      const query = `
        SELECT 
          p.*,
          COUNT(DISTINCT c.id) as total_contracts,
          COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_contracts,
          AVG(c.monthly_rent) as avg_rent,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'contractId', c.id,
              'tenant', t.nom,
              'status', c.status,
              'monthlyRent', c.monthly_rent,
              'startDate', c.date_debut
            )
          ) FILTER (WHERE c.id IS NOT NULL) as contracts,
          (
            SELECT COUNT(*) FROM impayes 
            WHERE property_id = p.id AND statut = 'ouvert'
          ) as open_arrears
        FROM properties p
        LEFT JOIN contrats c ON p.id = c.property_id
        LEFT JOIN tenants t ON c.tenant_id = t.id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `;

      const result = await pool.query(query);
      
      return {
        summary: {
          total: result.rows.length,
          occupied: result.rows.filter(p => p.active_contracts > 0).length,
          available: result.rows.filter(p => p.active_contracts === 0).length,
          withArrears: result.rows.filter(p => p.open_arrears > 0).length
        },
        properties: result.rows.map(p => ({
          ...p,
          occupancyRate: p.total_contracts > 0 ? ((p.active_contracts / p.total_contracts) * 100).toFixed(1) : 0,
          health: p.open_arrears > 0 ? 'AT_RISK' : 'HEALTHY'
        }))
      };
    } catch (err) {
      logger.error('Erreur récupération propriétés complètes', err);
      throw err;
    }
  },

  /**
   * TENANTS - Tous les locataires avec analyse de risque
   */
  async getAllTenantsWithAnalysis(params = {}) {
    try {
      const result = await pool.query(`
        SELECT 
          t.*,
          COUNT(DISTINCT c.id) as total_contracts,
          COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_contracts,
          SUM(CASE WHEN i.statut = 'ouvert' THEN i.montant ELSE 0 END) as total_arrears,
          COUNT(DISTINCT CASE WHEN i.statut = 'ouvert' THEN i.id END) as open_arrears_count,
          MAX(p.created_at) as last_payment_date,
          COUNT(DISTINCT p.id) as payment_count
        FROM tenants t
        LEFT JOIN contrats c ON t.id = c.tenant_id
        LEFT JOIN impayes i ON t.id = i.tenant_id
        LEFT JOIN payments p ON t.id = p.tenant_id
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `);

      const tenants = result.rows.map(tenant => ({
        ...tenant,
        riskScore: this.calculateTenantRiskScore(tenant),
        paymentReliability: tenant.payment_count > 0 ? '✓ Bon' : '? A vérifier'
      }));

      return {
        summary: {
          total: tenants.length,
          highRisk: tenants.filter(t => t.riskScore > 70).length,
          mediumRisk: tenants.filter(t => t.riskScore > 40 && t.riskScore <= 70).length,
          lowRisk: tenants.filter(t => t.riskScore <= 40).length
        },
        tenants
      };
    } catch (err) {
      logger.error('Erreur analyse locataires', err);
      throw err;
    }
  },

  /**
   * PAYMENTS - Tous les paiements avec rapports
   */
  async getAllPaymentsWithReports(params = {}) {
    try {
      const result = await pool.query(`
        SELECT 
          DATE_TRUNC('month', p.created_at) as month,
          COUNT(*) as payment_count,
          SUM(p.montant) as total_amount,
          AVG(p.montant) as avg_amount,
          COUNT(DISTINCT p.tenant_id) as unique_tenants
        FROM payments p
        WHERE p.created_at > NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', p.created_at)
        ORDER BY month DESC
      `);

      const detailResult = await pool.query(`
        SELECT 
          p.*,
          t.nom as tenant_name,
          c.property_id as property_ref
        FROM payments p
        JOIN tenants t ON p.tenant_id = t.id
        LEFT JOIN contrats c ON p.contract_id = c.id
        ORDER BY p.created_at DESC
        LIMIT 100
      `);

      const totalLastMonth = result.rows[0]?.total_amount || 0;

      return {
        summary: {
          lastMonthTotal: totalLastMonth,
          averagePayment: Math.round(result.rows[0]?.avg_amount || 0),
          paymentCount: result.rows.reduce((sum, r) => sum + r.payment_count, 0),
          trend: result.rows[0]?.total_amount > result.rows[1]?.total_amount ? 'UP' : 'DOWN'
        },
        monthlyTrend: result.rows,
        recentPayments: detailResult.rows
      };
    } catch (err) {
      logger.error('Erreur rapports paiements', err);
      throw err;
    }
  },

  /**
   * CONTRACTS - Tous les contrats avec documents
   */
  async getAllContractsWithDocuments(params = {}) {
    try {
      const result = await pool.query(`
        SELECT 
          c.*,
          t.nom as tenant_name,
          p.nom as property_name,
          COUNT(DISTINCT i.id) as arrears_count
        FROM contrats c
        JOIN tenants t ON c.tenant_id = t.id
        LEFT JOIN properties p ON c.property_id = p.id
        LEFT JOIN impayes i ON c.id = i.contract_id AND i.statut = 'ouvert'
        GROUP BY c.id, t.id, p.id
        ORDER BY c.created_at DESC
      `);

      return {
        summary: {
          total: result.rows.length,
          active: result.rows.filter(c => c.status === 'active').length,
          expired: result.rows.filter(c => c.status === 'expired').length,
          withArrears: result.rows.filter(c => c.arrears_count > 0).length
        },
        contracts: result.rows
      };
    } catch (err) {
      logger.error('Erreur récupération contrats', err);
      throw err;
    }
  },

  /**
   * ARREARS - Données complètes impayés
   */
  async getCompleteArrearsData(params = {}) {
    try {
      const result = await pool.query(`
        SELECT 
          i.*,
          t.nom as tenant_name,
          t.telephone,
          p.nom as property_name,
          c.monthly_rent as contract_rent
        FROM impayes i
        JOIN tenants t ON i.tenant_id = t.id
        LEFT JOIN properties p ON i.property_id = p.id
        LEFT JOIN contrats c ON i.contract_id = c.id
        WHERE i.statut IN ('ouvert', 'partiel')
        ORDER BY i.montant DESC, i.created_at DESC
      `);

      const totalAmount = result.rows.reduce((sum, r) => sum + (r.montant || 0), 0);
      const byTenant = {};
      
      result.rows.forEach(row => {
        if (!byTenant[row.tenant_id]) {
          byTenant[row.tenant_id] = {
            tenant: row.tenant_name,
            phone: row.telephone,
            total: 0,
            count: 0,
            cases: []
          };
        }
        byTenant[row.tenant_id].total += row.montant;
        byTenant[row.tenant_id].count += 1;
        byTenant[row.tenant_id].cases.push(row);
      });

      return {
        summary: {
          totalAmount,
          caseCount: result.rows.length,
          uniqueTenants: Object.keys(byTenant).length,
          avgByCase: Math.round(totalAmount / result.rows.length),
          critical: result.rows.filter(r => r.montant > totalAmount / result.rows.length * 2).length
        },
        byTenant,
        allCases: result.rows
      };
    } catch (err) {
      logger.error('Erreur données impayés complètes', err);
      throw err;
    }
  },

  /**
   * ANALYTICS - Analytics complètes
   */
  async getComprehensiveAnalytics(params = {}) {
    try {
      const [
        propsResult,
        tenantsResult,
        paymentsResult,
        arrearsResult,
        contractsResult
      ] = await Promise.all([
        pool.query('SELECT COUNT(*) as count, AVG(monthly_rent) as avg FROM properties'),
        pool.query('SELECT COUNT(*) as count FROM tenants'),
        pool.query('SELECT SUM(montant) as total, COUNT(*) as count FROM payments WHERE created_at > NOW() - INTERVAL \'30 days\''),
        pool.query('SELECT SUM(montant) as total FROM impayes WHERE statut = \'ouvert\''),
        pool.query('SELECT COUNT(*) as count FROM contrats WHERE status = \'active\'')
      ]);

      return {
        properties: {
          total: propsResult.rows[0].count,
          avgRent: Math.round(propsResult.rows[0].avg)
        },
        tenants: {
          total: tenantsResult.rows[0].count
        },
        payments: {
          monthlyTotal: paymentsResult.rows[0].total,
          monthlyCount: paymentsResult.rows[0].count
        },
        arrears: {
          total: arrearsResult.rows[0].total
        },
        contracts: {
          active: contractsResult.rows[0].count
        }
      };
    } catch (err) {
      logger.error('Erreur analytics complètes', err);
      throw err;
    }
  },

  /**
   * DOCUMENTS - Tous les documents agence
   */
  async getAllAgencyDocuments(params = {}) {
    try {
      return await AgencyDocumentsService.exportAllDocuments();
    } catch (err) {
      logger.error('Erreur récupération documents', err);
      throw err;
    }
  },

  /**
   * BRANDING - Configuration branding complète
   */
  async getBrandingConfiguration(params = {}) {
    try {
      return await BrandingService.exportBrandingConfig();
    } catch (err) {
      logger.error('Erreur récupération branding', err);
      throw err;
    }
  },

  /**
   * AI_INSIGHTS - Toutes les insights IA
   */
  async getAIInsights(params = {}) {
    try {
      const [
        marketReport,
        riskAssessments
      ] = await Promise.all([
        AIImmobilierService.generateMarketReport(),
        pool.query(`
          SELECT id, nom FROM tenants LIMIT 5
        `).then(result => 
          Promise.all(result.rows.map(t => 
            AIImmobilierService.assessTenantRisk(t.id)
          ))
        )
      ]);

      return {
        market: marketReport,
        tenantRisks: riskAssessments
      };
    } catch (err) {
      logger.error('Erreur insights IA', err);
      throw err;
    }
  },

  /**
   * EXPORT - Préparer export complète du système
   */
  async prepareCompleteExport(params = {}) {
    try {
      const [
        props,
        tenants,
        contracts,
        payments,
        arrears,
        documents,
        branding
      ] = await Promise.all([
        this.getAllPropertiesWithDetails(),
        this.getAllTenantsWithAnalysis(),
        this.getAllContractsWithDocuments(),
        this.getAllPaymentsWithReports(),
        this.getCompleteArrearsData(),
        this.getAllAgencyDocuments(),
        this.getBrandingConfiguration()
      ]);

      const exportFile = {
        exportDate: new Date().toISOString(),
        system: 'AKIG',
        version: '2.0.0',
        data: {
          properties: props,
          tenants,
          contracts,
          payments,
          arrears,
          documents,
          branding
        },
        statistics: {
          totalProperties: props.summary.total,
          totalTenants: tenants.summary.total,
          activeContracts: contracts.summary.active,
          totalArrears: arrears.summary.totalAmount
        }
      };

      logger.info('Export complet préparé', { 
        properties: props.summary.total,
        tenants: tenants.summary.total 
      });

      return exportFile;
    } catch (err) {
      logger.error('Erreur export complet', err);
      throw err;
    }
  },

  /**
   * Helper - Calculer score risque locataire
   */
  calculateTenantRiskScore(tenant) {
    let score = 0;
    
    const arrearsPercent = tenant.total_contracts > 0 
      ? (tenant.open_arrears_count / tenant.total_contracts) * 100 
      : 0;
    
    score += arrearsPercent * 0.4;
    if (tenant.total_arrears > 0) score += Math.min(30, tenant.total_arrears / 100000);
    if (!tenant.verified_documents) score += 15;
    
    return Math.min(score, 100);
  }
};

module.exports = UnifiedDashboardService;

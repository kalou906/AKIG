/**
 * 🤖 IA AVANCÉE - Immobilier Guinéen
 * Suggestions intelligentes, pricing, prédictions
 * 
 * backend/src/services/ai-immobilier.service.js
 */

const pool = require('../db');
const logger = require('./logger');

const AIImmobilierService = {
  /**
   * Analyser marché immobilier guinéen
   * Pricing automatique basé sur données
   */
  async analyzePricing(params) {
    try {
      const { location, squareMeters, amenities = [], propertyType } = params;

      // Récupérer prix moyens de la région
      const pricesResult = await pool.query(
        `SELECT AVG(monthly_rent) as avg_rent, 
                PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY monthly_rent) as q1,
                PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY monthly_rent) as q3
         FROM contrats 
         WHERE location LIKE $1 
         AND property_type = $2
         AND created_at > NOW() - INTERVAL '6 months'`,
        [`%${location}%`, propertyType]
      );

      if (pricesResult.rows.length === 0) {
        return { suggestion: null, message: 'Pas assez de données' };
      }

      const prices = pricesResult.rows[0];
      const pricePerM2 = prices.avg_rent / squareMeters;
      
      // Ajuster selon commodités
      let priceMultiplier = 1;
      if (amenities.includes('parking')) priceMultiplier += 0.08;
      if (amenities.includes('elevator')) priceMultiplier += 0.12;
      if (amenities.includes('garden')) priceMultiplier += 0.05;
      if (amenities.includes('furnished')) priceMultiplier += 0.15;
      if (amenities.includes('security')) priceMultiplier += 0.06;

      const suggestedPrice = Math.round(pricePerM2 * squareMeters * priceMultiplier);

      return {
        suggestedPrice,
        min: Math.round(prices.q1),
        max: Math.round(prices.q3),
        pricePerM2: Math.round(pricePerM2),
        confidence: 0.85,
        region: location,
        analysis: `Prix suggéré: ${suggestedPrice} GNF/mois basé sur ${squareMeters}m² et commodités`
      };
    } catch (err) {
      logger.error('Erreur analyse pricing', err);
      return { error: err.message };
    }
  },

  /**
   * Prédire demande locataire
   * Analyser patterns de recherche
   */
  async predictTenantDemand(location) {
    try {
      // Recherches récentes dans zone
      const searchesResult = await pool.query(
        `SELECT property_type, COUNT(*) as search_count
         FROM user_searches 
         WHERE location LIKE $1 
         AND searched_at > NOW() - INTERVAL '30 days'
         GROUP BY property_type 
         ORDER BY search_count DESC`,
        [`%${location}%`]
      );

      // Contrats récents
      const contractsResult = await pool.query(
        `SELECT property_type, COUNT(*) as contract_count
         FROM contrats 
         WHERE location LIKE $1 
         AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY property_type`,
        [`%${location}%`]
      );

      const demandAnalysis = searchesResult.rows.map(search => {
        const contracts = contractsResult.rows.find(c => c.property_type === search.property_type);
        const conversionRate = contracts 
          ? (contracts.contract_count / search.search_count * 100).toFixed(2)
          : 0;

        return {
          propertyType: search.property_type,
          searches: search.search_count,
          contracts: contracts?.contract_count || 0,
          conversionRate: `${conversionRate}%`,
          demandLevel: conversionRate > 50 ? 'HIGH' : conversionRate > 20 ? 'MEDIUM' : 'LOW'
        };
      });

      return {
        location,
        analysis: demandAnalysis,
        hotCategories: demandAnalysis.filter(a => a.demandLevel === 'HIGH').map(a => a.propertyType),
        period: 'Last 30 days'
      };
    } catch (err) {
      logger.error('Erreur prédiction demande', err);
      return { error: err.message };
    }
  },

  /**
   * Suggérer améliorations propriété
   * Pour augmenter attractivité
   */
  async suggestPropertyImprovements(propertyId) {
    try {
      const propertyResult = await pool.query(
        `SELECT * FROM properties WHERE id = $1`,
        [propertyId]
      );

      if (propertyResult.rows.length === 0) {
        throw new Error('Propriété non trouvée');
      }

      const property = propertyResult.rows[0];

      // Analyser properties similaires plus attractives
      const similarResult = await pool.query(
        `SELECT amenities, AVG(monthly_rent) as avg_rent, COUNT(*) as count
         FROM contrats 
         WHERE location = $1 
         AND property_type = $2
         AND monthly_rent > $3
         GROUP BY amenities
         ORDER BY avg_rent DESC LIMIT 5`,
        [property.location, property.type, property.monthly_rent || 0]
      );

      const suggestions = [];
      
      if (similarResult.rows.length > 0) {
        similarResult.rows.forEach(row => {
          const amenities = JSON.parse(row.amenities || '[]');
          amenities.forEach(amenity => {
            if (!JSON.stringify(property.amenities || []).includes(amenity)) {
              suggestions.push({
                amenity,
                potentialRentIncrease: `+${(row.avg_rent * 0.08).toFixed(0)} GNF/mois`,
                priorityScore: row.count
              });
            }
          });
        });
      }

      return {
        propertyId,
        currentRent: property.monthly_rent,
        suggestions: suggestions.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5),
        message: suggestions.length > 0 
          ? `${suggestions.length} améliorations recommandées pour augmenter attractivité`
          : 'Propriété déjà bien optimisée'
      };
    } catch (err) {
      logger.error('Erreur suggestions propriété', err);
      return { error: err.message };
    }
  },

  /**
   * Détecter locataires risqués
   * Scoring automatique
   */
  async assessTenantRisk(tenantId) {
    try {
      const tenantResult = await pool.query(
        `SELECT t.*, 
                COUNT(DISTINCT p.id) as property_count,
                AVG(p.duration) as avg_duration,
                COUNT(CASE WHEN p.status = 'arrears' THEN 1 END) as arrears_count
         FROM tenants t
         LEFT JOIN contrats p ON t.id = p.tenant_id
         WHERE t.id = $1
         GROUP BY t.id`,
        [tenantId]
      );

      if (tenantResult.rows.length === 0) {
        throw new Error('Locataire non trouvé');
      }

      const tenant = tenantResult.rows[0];

      // Calcul score risque (0-100)
      let riskScore = 0;

      // Historique impayés
      const arrearsPercent = tenant.property_count > 0 
        ? (tenant.arrears_count / tenant.property_count) * 100 
        : 0;
      riskScore += arrearsPercent * 0.4;

      // Durée moyenne de résidence
      if (tenant.avg_duration < 6) riskScore += 20;
      if (tenant.avg_duration < 12) riskScore += 10;

      // Documents vérifiés
      if (!tenant.verified_documents) riskScore += 15;

      // Références
      if (!tenant.references_count || tenant.references_count < 2) riskScore += 10;

      const riskLevel = riskScore > 70 ? 'HIGH' : riskScore > 40 ? 'MEDIUM' : 'LOW';

      return {
        tenantId,
        riskScore: Math.min(riskScore, 100),
        riskLevel,
        factors: {
          arrearsHistory: `${arrearsPercent.toFixed(1)}%`,
          tenureLength: tenant.avg_duration ? `${tenant.avg_duration.toFixed(1)} mois` : 'N/A',
          documentsVerified: tenant.verified_documents ? 'Oui' : 'Non',
          referencesCount: tenant.references_count || 0
        },
        recommendation: riskLevel === 'HIGH' 
          ? 'Vérification additionnelle recommandée'
          : 'Acceptable'
      };
    } catch (err) {
      logger.error('Erreur évaluation risque locataire', err);
      return { error: err.message };
    }
  },

  /**
   * Générer rapport marché immobilier guinéen
   * Tendances, statistiques, prédictions
   */
  async generateMarketReport() {
    try {
      // Statistiques générales
      const statsResult = await pool.query(`
        SELECT 
          COUNT(DISTINCT id) as total_properties,
          AVG(monthly_rent) as avg_rent,
          COUNT(DISTINCT tenant_id) as active_tenants,
          SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_count,
          SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END) as rented_count
        FROM properties
      `);

      // Top locations
      const locationsResult = await pool.query(`
        SELECT 
          location,
          COUNT(*) as property_count,
          AVG(monthly_rent) as avg_rent,
          COUNT(DISTINCT tenant_id) as active_tenants
        FROM properties
        WHERE location IS NOT NULL
        GROUP BY location
        ORDER BY property_count DESC LIMIT 10
      `);

      const stats = statsResult.rows[0];
      const occupancyRate = stats.total_properties > 0 
        ? ((stats.rented_count / stats.total_properties) * 100).toFixed(1)
        : 0;

      return {
        reportDate: new Date().toISOString(),
        summary: {
          totalProperties: stats.total_properties,
          averageRent: Math.round(stats.avg_rent),
          activeTenants: stats.active_tenants,
          occupancyRate: `${occupancyRate}%`,
          availableProperties: stats.available_count
        },
        topLocations: locationsResult.rows.map(loc => ({
          location: loc.location,
          properties: loc.property_count,
          averageRent: Math.round(loc.avg_rent),
          occupancy: loc.active_tenants
        })),
        marketTrend: occupancyRate > 85 ? 'BULLISH' : occupancyRate > 60 ? 'NEUTRAL' : 'BEARISH'
      };
    } catch (err) {
      logger.error('Erreur rapport marché', err);
      return { error: err.message };
    }
  }
};

module.exports = AIImmobilierService;

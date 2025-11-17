/**
 * 🚀 Advanced Analytics Service - AKIG
 * Real-time market intelligence, predictive analytics, trend analysis
 * backend/src/services/analytics-advanced.service.js
 */

const pool = require('../db');
const logger = require('./logger');

/**
 * Advanced Analytics Service
 * Provides cutting-edge market analysis and insights
 */
class AdvancedAnalyticsService {
  /**
   * Real-time market heatmap by location
   */
  static async getMarketHeatmap() {
    try {
      const result = await pool.query(`
        SELECT 
          location,
          COUNT(*) as property_count,
          AVG(price) as avg_price,
          AVG(price / surface) as price_per_sqm,
          MIN(price) as min_price,
          MAX(price) as max_price,
          COUNT(CASE WHEN property_type = 'villa' THEN 1 END) as villa_count,
          COUNT(CASE WHEN property_type = 'appartement' THEN 1 END) as apartment_count,
          AVG(surface) as avg_surface,
          STDDEV(price) as price_volatility,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_listings_week,
          COUNT(CASE WHEN status = 'vendu' THEN 1 END) as sold_count
        FROM properties
        GROUP BY location
        ORDER BY property_count DESC
      `);

      const heatmap = result.rows.map(row => ({
        location: row.location,
        propertyCount: parseInt(row.property_count),
        avgPrice: Math.round(row.avg_price),
        pricePerSqm: Math.round(row.price_per_sqm),
        priceRange: {
          min: Math.round(row.min_price),
          max: Math.round(row.max_price)
        },
        types: {
          villas: parseInt(row.villa_count),
          apartments: parseInt(row.apartment_count)
        },
        avgSurface: Math.round(row.avg_surface),
        volatility: row.price_volatility ? Math.round(row.price_volatility) : 0,
        newListingsThisWeek: parseInt(row.new_listings_week),
        soldCount: parseInt(row.sold_count),
        demandScore: this.calculateDemandScore(row)
      }));

      return heatmap;
    } catch (err) {
      logger.error('Erreur heatmap marché:', err);
      throw err;
    }
  }

  /**
   * Predict property price trends
   */
  static async predictPriceTrends() {
    try {
      const result = await pool.query(`
        SELECT 
          DATE_TRUNC('week', created_at)::date as week,
          location,
          AVG(price) as avg_price,
          COUNT(*) as listings_count,
          AVG(price / surface) as price_per_sqm
        FROM properties
        WHERE created_at > NOW() - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', created_at), location
        ORDER BY week DESC, location
      `);

      const groupedByLocation = {};
      result.rows.forEach(row => {
        if (!groupedByLocation[row.location]) {
          groupedByLocation[row.location] = [];
        }
        groupedByLocation[row.location].push({
          week: row.week,
          avgPrice: Math.round(row.avg_price),
          listingsCount: parseInt(row.listings_count),
          pricePerSqm: Math.round(row.price_per_sqm)
        });
      });

      // Calculate trends
      const trends = {};
      Object.entries(groupedByLocation).forEach(([location, data]) => {
        const sorted = data.sort((a, b) => new Date(b.week) - new Date(a.week));
        const recent = sorted[0]?.avgPrice || 0;
        const old = sorted[sorted.length - 1]?.avgPrice || 0;
        const change = old > 0 ? ((recent - old) / old * 100) : 0;

        trends[location] = {
          trend: change > 2 ? 'UP' : change < -2 ? 'DOWN' : 'STABLE',
          percentChange: Math.round(change * 100) / 100,
          priceHistory: sorted,
          prediction: this.predictNextWeek(sorted)
        };
      });

      return trends;
    } catch (err) {
      logger.error('Erreur prédiction tendances:', err);
      throw err;
    }
  }

  /**
   * Segment properties by investment profile
   */
  static async segmentByInvestmentProfile() {
    try {
      const result = await pool.query(`
        SELECT 
          *,
          (price / surface) as price_per_sqm,
          CASE 
            WHEN price < 8000000 THEN 'Budget'
            WHEN price < 15000000 THEN 'Mid-Range'
            WHEN price < 25000000 THEN 'Premium'
            ELSE 'Luxury'
          END as segment
        FROM properties
        WHERE status = 'disponible'
      `);

      const segments = {
        budget: [],
        midRange: [],
        premium: [],
        luxury: []
      };

      result.rows.forEach(prop => {
        const segment = prop.segment.toLowerCase().replace('-', '_');
        segments[segment].push({
          id: prop.id,
          title: prop.title,
          price: prop.price,
          location: prop.location,
          roi: this.calculateROI(prop),
          riskLevel: this.assessRisk(prop),
          investmentScore: this.calculateInvestmentScore(prop)
        });
      });

      return {
        segments,
        summary: {
          totalBudget: segments.budget.length,
          totalMidRange: segments.midRange.length,
          totalPremium: segments.premium.length,
          totalLuxury: segments.luxury.length,
          recommendation: this.getRecommendedSegment(segments)
        }
      };
    } catch (err) {
      logger.error('Erreur segmentation:', err);
      throw err;
    }
  }

  /**
   * Competitive analysis
   */
  static async competitiveAnalysis(propertyId) {
    try {
      const propResult = await pool.query(
        'SELECT * FROM properties WHERE id = $1',
        [propertyId]
      );

      if (propResult.rows.length === 0) {
        throw new Error('Propriété non trouvée');
      }

      const property = propResult.rows[0];

      // Find competitors
      const competitorsResult = await pool.query(`
        SELECT 
          *,
          ABS(price - $1) as price_diff,
          ABS(surface - $2) as surface_diff
        FROM properties
        WHERE 
          location = $3 
          AND property_type = $4
          AND id != $5
          AND ABS(price - $1) < $1 * 0.2
        ORDER BY price_diff ASC
        LIMIT 5
      `, [property.price, property.surface, property.location, property.property_type, propertyId]);

      const competitors = competitorsResult.rows.map(comp => ({
        id: comp.id,
        title: comp.title,
        price: comp.price,
        surface: comp.surface,
        pricePerSqm: Math.round(comp.price / comp.surface),
        condition: comp.condition,
        amenities: comp.amenities,
        competitivePosition: this.assessCompetitivePosition(property, comp)
      }));

      return {
        propertyId,
        competitiveAnalysis: {
          pricePosition: this.getCompetitivePricePosition(property, competitors),
          valueProposition: this.assessValueProposition(property, competitors),
          marketPosition: 'Competitive',
          recommendedPrice: this.recommendCompetitivePrice(property, competitors),
          competitors
        }
      };
    } catch (err) {
      logger.error('Erreur analyse compétitive:', err);
      throw err;
    }
  }

  /**
   * Portfolio risk assessment
   */
  static async portfolioRiskAssessment(properties) {
    try {
      let totalInvestment = 0;
      let totalROI = 0;
      let riskFactors = [];

      properties.forEach(prop => {
        totalInvestment += prop.price || 0;
        totalROI += this.calculateROI(prop);
        
        const risk = this.assessRisk(prop);
        riskFactors.push({
          propertyId: prop.id,
          riskLevel: risk,
          riskScore: this.calculateRiskScore(prop)
        });
      });

      const avgROI = totalInvestment > 0 ? (totalROI / properties.length) : 0;
      const avgRiskScore = riskFactors.length > 0 
        ? (riskFactors.reduce((sum, r) => sum + r.riskScore, 0) / riskFactors.length)
        : 0;

      return {
        portfolio: {
          totalProperties: properties.length,
          totalInvestment: Math.round(totalInvestment),
          averageROI: Math.round(avgROI * 100) / 100,
          portfolioRiskScore: Math.round(avgRiskScore),
          riskLevel: avgRiskScore > 70 ? 'HIGH' : avgRiskScore > 40 ? 'MEDIUM' : 'LOW',
          diversification: this.assessDiversification(properties),
          recommendations: this.getPortfolioRecommendations(properties, avgRiskScore)
        },
        riskFactors
      };
    } catch (err) {
      logger.error('Erreur évaluation portefeuille:', err);
      throw err;
    }
  }

  /**
   * Real-time market alerts
   */
  static async generateMarketAlerts() {
    try {
      const alerts = [];

      // Price anomalies
      const priceResult = await pool.query(`
        SELECT 
          location,
          AVG(price / surface) as avg_price_sqm,
          STDDEV(price / surface) as stddev_price_sqm
        FROM properties
        GROUP BY location
      `);

      for (const row of priceResult.rows) {
        const threshold = (row.stddev_price_sqm || 0) * 2;
        const anomaliesResult = await pool.query(`
          SELECT id, price, surface, title
          FROM properties
          WHERE location = $1
          AND ABS((price / surface) - $2) > $3
          LIMIT 3
        `, [row.location, row.avg_price_sqm, threshold]);

        if (anomaliesResult.rows.length > 0) {
          alerts.push({
            type: 'PRICE_ANOMALY',
            location: row.location,
            severity: 'MEDIUM',
            message: `${anomaliesResult.rows.length} propriétés avec prix anormal détectées`,
            affected: anomaliesResult.rows.length
          });
        }
      }

      // High demand areas
      const demandResult = await pool.query(`
        SELECT location, COUNT(*) as count
        FROM properties
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY location
        HAVING COUNT(*) > 5
      `);

      demandResult.rows.forEach(row => {
        alerts.push({
          type: 'HIGH_DEMAND',
          location: row.location,
          severity: 'LOW',
          message: `${row.count} nouvelles annonces cette semaine`,
          newListings: parseInt(row.count)
        });
      });

      return alerts;
    } catch (err) {
      logger.error('Erreur génération alertes:', err);
      throw err;
    }
  }

  /**
   * Helper methods
   */
  static calculateDemandScore(row) {
    const newListingsScore = Math.min((row.new_listings_week / 10) * 100, 100);
    const competitionScore = Math.min((row.property_count / 50) * 100, 100);
    const volatilityScore = Math.min((row.price_volatility / 5000000) * 100, 100);
    
    return Math.round((newListingsScore * 0.4 + competitionScore * 0.3 + volatilityScore * 0.3));
  }

  static calculateROI(property) {
    const estimatedAnnualYield = (property.price * 0.05) / 12;
    return (estimatedAnnualYield / property.price) * 100;
  }

  static assessRisk(property) {
    let risk = 30;
    
    if (property.condition === 'excellent') risk -= 10;
    if (property.condition === 'moyen') risk += 10;
    if (property.condition === 'à rénover') risk += 20;
    
    if (property.amenities && property.amenities.length > 5) risk -= 10;
    if (!property.amenities || property.amenities.length === 0) risk += 10;
    
    return Math.max(10, Math.min(90, risk));
  }

  static calculateRiskScore(property) {
    return this.assessRisk(property);
  }

  static calculateInvestmentScore(property) {
    const roi = this.calculateROI(property);
    const risk = 100 - this.assessRisk(property);
    const locationScore = 50; // À améliorer avec données réelles
    
    return Math.round((roi * 0.4 + risk * 0.3 + locationScore * 0.3));
  }

  static assessCompetitivePosition(property, competitor) {
    const priceDiff = property.price - competitor.price;
    const surfaceDiff = property.surface - competitor.surface;
    
    if (priceDiff < -500000 && surfaceDiff >= 0) return 'ADVANTAGE';
    if (priceDiff > 500000 && surfaceDiff <= 0) return 'DISADVANTAGE';
    return 'COMPETITIVE';
  }

  static getCompetitivePricePosition(property, competitors) {
    if (competitors.length === 0) return 'NEUTRAL';
    
    const avgCompetitorPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
    const diff = property.price - avgCompetitorPrice;
    
    if (diff < -10000) return 'UNDERPRICED';
    if (diff > 10000) return 'OVERPRICED';
    return 'FAIRLY_PRICED';
  }

  static assessValueProposition(property, competitors) {
    const avgPerformance = competitors.reduce((sum, c) => sum + (c.price / c.surface), 0) / competitors.length;
    const propertyPerformance = property.price / property.surface;
    
    return propertyPerformance < avgPerformance ? 'GOOD_VALUE' : 'PREMIUM_PRICED';
  }

  static recommendCompetitivePrice(property, competitors) {
    if (competitors.length === 0) return property.price;
    
    const avgPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
    return Math.round(avgPrice);
  }

  static assessDiversification(properties) {
    const locations = new Set(properties.map(p => p.location));
    const types = new Set(properties.map(p => p.property_type));
    
    return {
      locationDiversity: locations.size,
      typeDiversity: types.size,
      diversificationScore: Math.min((locations.size + types.size) / 10 * 100, 100)
    };
  }

  static getPortfolioRecommendations(properties, riskScore) {
    const recommendations = [];
    
    if (riskScore > 70) {
      recommendations.push('Réduire exposition au risque - Diversifier portfolio');
    }
    if (properties.length < 3) {
      recommendations.push('Augmenter nombre de propriétés pour meilleure diversification');
    }
    
    const locations = new Set(properties.map(p => p.location));
    if (locations.size < 2) {
      recommendations.push('Diversifier par localisation géographique');
    }
    
    return recommendations;
  }

  static predictNextWeek(priceHistory) {
    if (priceHistory.length < 2) return null;
    
    const recent = priceHistory[0].avgPrice;
    const previous = priceHistory[1].avgPrice;
    const trend = recent - previous;
    
    return Math.round(recent + trend);
  }

  static getRecommendedSegment(segments) {
    const counts = [
      segments.budget.length,
      segments.midRange.length,
      segments.premium.length,
      segments.luxury.length
    ];
    
    const max = Math.max(...counts);
    if (max === counts[0]) return 'Budget';
    if (max === counts[1]) return 'Mid-Range';
    if (max === counts[2]) return 'Premium';
    return 'Luxury';
  }
}

module.exports = AdvancedAnalyticsService;

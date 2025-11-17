/**
 * 🎯 Real-time Dashboard Service - AKIG
 * Live market monitoring, performance metrics, KPIs
 * backend/src/services/realtime-dashboard.service.js
 */

const pool = require('../db');
const logger = require('./logger');
const AdvancedAnalyticsService = require('./analytics-advanced.service');

class RealtimeDashboardService {
  /**
   * Get comprehensive dashboard metrics
   */
  static async getDashboardMetrics() {
    try {
      const [
        marketStats,
        topLocations,
        propertyTypeBreakdown,
        recentActivity,
        performanceMetrics,
        alerts
      ] = await Promise.all([
        this.getMarketStats(),
        this.getTopLocations(),
        this.getPropertyTypeBreakdown(),
        this.getRecentActivity(),
        this.getPerformanceMetrics(),
        AdvancedAnalyticsService.generateMarketAlerts()
      ]);

      return {
        timestamp: new Date().toISOString(),
        marketStats,
        topLocations,
        propertyTypeBreakdown,
        recentActivity,
        performanceMetrics,
        alerts,
        healthScore: this.calculateHealthScore({
          marketStats,
          performanceMetrics,
          alerts
        })
      };
    } catch (err) {
      logger.error('Erreur dashboard metrics:', err);
      throw err;
    }
  }

  /**
   * Get market statistics
   */
  static async getMarketStats() {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_properties,
          COUNT(CASE WHEN status = 'disponible' THEN 1 END) as available,
          COUNT(CASE WHEN status = 'vendu' THEN 1 END) as sold,
          COUNT(CASE WHEN status = 'en_location' THEN 1 END) as rented,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price,
          AVG(surface) as avg_surface,
          COUNT(DISTINCT location) as unique_locations,
          COUNT(DISTINCT property_type) as unique_types,
          AVG(price / surface) as avg_price_sqm
        FROM properties
      `);

      const stats = result.rows[0];
      return {
        totalProperties: parseInt(stats.total_properties),
        available: parseInt(stats.available),
        sold: parseInt(stats.sold),
        rented: parseInt(stats.rented),
        averagePrice: Math.round(stats.avg_price),
        priceRange: {
          min: Math.round(stats.min_price),
          max: Math.round(stats.max_price)
        },
        averageSurface: Math.round(stats.avg_surface),
        marketCoverage: {
          locations: parseInt(stats.unique_locations),
          propertyTypes: parseInt(stats.unique_types)
        },
        averagePricePerSqm: Math.round(stats.avg_price_sqm),
        marketHealth: this.calculateMarketHealth(stats)
      };
    } catch (err) {
      logger.error('Erreur market stats:', err);
      throw err;
    }
  }

  /**
   * Get top performing locations
   */
  static async getTopLocations() {
    try {
      const result = await pool.query(`
        SELECT 
          location,
          COUNT(*) as property_count,
          AVG(price) as avg_price,
          AVG(surface) as avg_surface,
          COUNT(CASE WHEN status = 'vendu' THEN 1 END) as sold_count,
          ROUND(COUNT(CASE WHEN status = 'vendu' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as sell_through_rate,
          AVG(price / surface) as price_per_sqm,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week,
          AVG(EXTRACT(DAY FROM (updated_at - created_at))) as avg_days_on_market
        FROM properties
        GROUP BY location
        ORDER BY property_count DESC
        LIMIT 10
      `);

      return result.rows.map(row => ({
        location: row.location,
        propertyCount: parseInt(row.property_count),
        averagePrice: Math.round(row.avg_price),
        averageSurface: Math.round(row.avg_surface),
        soldCount: parseInt(row.sold_count),
        sellThroughRate: parseFloat(row.sell_through_rate),
        pricePerSqm: Math.round(row.price_per_sqm),
        newListingsThisWeek: parseInt(row.new_this_week),
        averageDaysOnMarket: Math.round(row.avg_days_on_market),
        performance: this.rateLocationPerformance(row)
      }));
    } catch (err) {
      logger.error('Erreur top locations:', err);
      throw err;
    }
  }

  /**
   * Get property type breakdown
   */
  static async getPropertyTypeBreakdown() {
    try {
      const result = await pool.query(`
        SELECT 
          property_type,
          COUNT(*) as count,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price,
          AVG(surface) as avg_surface,
          COUNT(CASE WHEN status = 'vendu' THEN 1 END) as sold,
          ROUND(COUNT(CASE WHEN status = 'vendu' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as sell_rate
        FROM properties
        GROUP BY property_type
        ORDER BY count DESC
      `);

      return result.rows.map(row => ({
        propertyType: row.property_type,
        count: parseInt(row.count),
        averagePrice: Math.round(row.avg_price),
        priceRange: {
          min: Math.round(row.min_price),
          max: Math.round(row.max_price)
        },
        averageSurface: Math.round(row.avg_surface),
        sold: parseInt(row.sold),
        sellRate: parseFloat(row.sell_rate),
        marketShare: '0%' // Calculé après
      }));
    } catch (err) {
      logger.error('Erreur property type breakdown:', err);
      throw err;
    }
  }

  /**
   * Get recent activity
   */
  static async getRecentActivity() {
    try {
      const result = await pool.query(`
        SELECT 
          id,
          title,
          location,
          property_type,
          price,
          status,
          created_at,
          updated_at,
          'created' as event_type
        FROM properties
        WHERE created_at > NOW() - INTERVAL '30 days'
        ORDER BY created_at DESC
        LIMIT 20
      `);

      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        location: row.location,
        type: row.property_type,
        price: row.price,
        status: row.status,
        eventType: row.event_type,
        timestamp: row.created_at,
        relativeTime: this.getRelativeTime(row.created_at)
      }));
    } catch (err) {
      logger.error('Erreur recent activity:', err);
      throw err;
    }
  }

  /**
   * Get performance metrics
   */
  static async getPerformanceMetrics() {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_properties,
          COUNT(CASE WHEN status = 'vendu' THEN 1 END) as sold_count,
          AVG(EXTRACT(DAY FROM (updated_at - created_at))) as avg_days_to_sell,
          AVG(price) as avg_selling_price
        FROM properties
        WHERE status = 'vendu'
        AND created_at > NOW() - INTERVAL '90 days'
      `);

      const stats = result.rows[0];
      const avgDaysToSell = parseFloat(stats.avg_days_to_sell) || 0;
      const sellRate = stats.total_properties > 0 
        ? (parseInt(stats.sold_count) / parseInt(stats.total_properties) * 100)
        : 0;

      return {
        conversionRate: Math.round(sellRate * 100) / 100,
        averageDaysToSale: Math.round(avgDaysToSell),
        averageSellingPrice: Math.round(stats.avg_selling_price),
        totalSold90Days: parseInt(stats.sold_count),
        efficiency: this.calculateEfficiency(avgDaysToSell, sellRate)
      };
    } catch (err) {
      logger.error('Erreur performance metrics:', err);
      throw err;
    }
  }

  /**
   * Get live activity stream
   */
  static async getLiveActivityStream(limit = 50) {
    try {
      const result = await pool.query(`
        SELECT 
          id,
          title,
          location,
          price,
          property_type,
          status,
          created_at,
          updated_at
        FROM properties
        ORDER BY updated_at DESC
        LIMIT $1
      `, [limit]);

      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        location: row.location,
        price: row.price,
        type: row.property_type,
        status: row.status,
        lastUpdate: row.updated_at,
        relativeTime: this.getRelativeTime(row.updated_at)
      }));
    } catch (err) {
      logger.error('Erreur activity stream:', err);
      throw err;
    }
  }

  /**
   * Helper methods
   */
  static calculateMarketHealth(stats) {
    let score = 50;
    
    if (parseInt(stats.total_properties) > 100) score += 20;
    if (parseInt(stats.available) > parseInt(stats.sold) * 2) score += 10;
    if (parseInt(stats.unique_locations) > 3) score += 15;
    
    return Math.min(100, score);
  }

  static calculateHealthScore(data) {
    let score = 50;
    
    if (data.marketStats.marketHealth > 60) score += 15;
    if (data.performanceMetrics.conversionRate > 30) score += 15;
    if (data.alerts.length === 0) score += 10;
    else if (data.alerts.length > 5) score -= 10;
    
    return Math.min(100, Math.max(0, score));
  }

  static rateLocationPerformance(row) {
    const sellThroughRate = parseFloat(row.sell_through_rate);
    const newListings = parseInt(row.new_this_week);
    
    if (sellThroughRate > 50 && newListings > 5) return 'EXCELLENT';
    if (sellThroughRate > 30 && newListings > 2) return 'GOOD';
    if (sellThroughRate > 10) return 'FAIR';
    return 'POOR';
  }

  static calculateEfficiency(avgDaysToSell, sellRate) {
    if (avgDaysToSell < 30 && sellRate > 50) return 'EXCELLENT';
    if (avgDaysToSell < 60 && sellRate > 30) return 'GOOD';
    if (avgDaysToSell < 90) return 'FAIR';
    return 'NEEDS_IMPROVEMENT';
  }

  static getRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `Il y a ${minutes}m`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return `Il y a ${Math.floor(days / 7)}s`;
  }
}

module.exports = RealtimeDashboardService;

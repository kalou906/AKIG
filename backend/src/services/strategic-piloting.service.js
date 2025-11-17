/**
 * 📊 AKIG Strategic Piloting Module
 * Advanced KPI, Dashboard & Analytics
 * 
 * Features:
 * - Strategic KPIs (vacancy rate, deposit return time, etc)
 * - Inter-agency benchmarking
 * - Financial forecasting
 * - Trend analysis
 * - Predictive analytics
 */

const pool = require('../db');
const logger = require('./logger');
const dayjs = require('dayjs');

class StrategicPilotingService {
  /**
   * Calculate strategic KPIs for agency
   * @param {string} agencyId
   * @returns {Promise<Object>}
   */
  async calculateStrategicKPIs(agencyId) {
    try {
      const kpis = {};

      // 1. Vacancy Rate
      kpis.vacancyRate = await this.calculateVacancyRate(agencyId);

      // 2. Average Deposit Return Time
      kpis.avgDepositReturnTime = await this.calculateAvgDepositReturnTime(agencyId);

      // 3. Tenant Satisfaction Score (NPS-like)
      kpis.tenantSatisfaction = await this.calculateTenantSatisfaction(agencyId);

      // 4. Payment On-Time Rate
      kpis.paymentOnTimeRate = await this.calculatePaymentOnTimeRate(agencyId);

      // 5. Property Utilization
      kpis.propertyUtilization = await this.calculatePropertyUtilization(agencyId);

      // 6. Average Lease Duration
      kpis.avgLeaseDuration = await this.calculateAvgLeaseDuration(agencyId);

      // 7. Maintenance Cost Ratio
      kpis.maintenanceCostRatio = await this.calculateMaintenanceCostRatio(agencyId);

      // 8. Tenant Retention Rate
      kpis.tenantRetention = await this.calculateTenantRetention(agencyId);

      logger.info(`✓ Strategic KPIs calculated for agency ${agencyId}`);

      return kpis;
    } catch (err) {
      logger.error('Error calculating strategic KPIs', err);
      throw err;
    }
  }

  /**
   * Calculate vacancy rate (% of vacant properties)
   * @private
   */
  async calculateVacancyRate(agencyId) {
    const result = await pool.query(
      `SELECT 
        COUNT(CASE WHEN current_tenant_id IS NULL THEN 1 END)::float / COUNT(*)::float as rate
      FROM properties WHERE agency_id = $1`,
      [agencyId]
    );

    return Math.round(result.rows[0].rate * 100);
  }

  /**
   * Calculate average deposit return time (days)
   * @private
   */
  async calculateAvgDepositReturnTime(agencyId) {
    const result = await pool.query(
      `SELECT 
        AVG(EXTRACT(DAY FROM deposit_return_date - lease_end_date)) as avg_days
      FROM leases l
      JOIN properties p ON l.property_id = p.id
      WHERE p.agency_id = $1 
      AND deposit_return_date IS NOT NULL
      AND lease_end_date < NOW()`,
      [agencyId]
    );

    return Math.round(result.rows[0].avg_days || 0);
  }

  /**
   * Calculate tenant satisfaction (based on ratings/feedback)
   * @private
   */
  async calculateTenantSatisfaction(agencyId) {
    const result = await pool.query(
      `SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as total_ratings
      FROM tenant_feedback tf
      JOIN properties p ON tf.property_id = p.id
      WHERE p.agency_id = $1
      AND tf.created_at > NOW() - INTERVAL '6 months'`,
      [agencyId]
    );

    return {
      score: Math.round((result.rows[0].avg_rating || 0) * 10) / 10,
      respondents: result.rows[0].total_ratings || 0
    };
  }

  /**
   * Calculate on-time payment rate
   * @private
   */
  async calculatePaymentOnTimeRate(agencyId) {
    const result = await pool.query(
      `SELECT 
        COUNT(CASE WHEN paid_date <= due_date THEN 1 END)::float / COUNT(*)::float as rate
      FROM invoices i
      JOIN leases l ON i.lease_id = l.id
      JOIN properties p ON l.property_id = p.id
      WHERE p.agency_id = $1
      AND i.paid_date IS NOT NULL
      AND i.created_at > NOW() - INTERVAL '3 months'`,
      [agencyId]
    );

    return Math.round(result.rows[0].rate * 100);
  }

  /**
   * Calculate property utilization rate
   * @private
   */
  async calculatePropertyUtilization(agencyId) {
    const result = await pool.query(
      `SELECT 
        COUNT(CASE WHEN current_tenant_id IS NOT NULL THEN 1 END)::float / COUNT(*)::float as rate
      FROM properties WHERE agency_id = $1`,
      [agencyId]
    );

    return Math.round(result.rows[0].rate * 100);
  }

  /**
   * Calculate average lease duration (months)
   * @private
   */
  async calculateAvgLeaseDuration(agencyId) {
    const result = await pool.query(
      `SELECT 
        AVG(EXTRACT(MONTH FROM lease_end_date - lease_start_date)) as avg_months
      FROM leases l
      JOIN properties p ON l.property_id = p.id
      WHERE p.agency_id = $1`,
      [agencyId]
    );

    return Math.round(result.rows[0].avg_months || 0);
  }

  /**
   * Calculate maintenance cost ratio (% of total revenue)
   * @private
   */
  async calculateMaintenanceCostRatio(agencyId) {
    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(m.cost)::float, 0) / NULLIF(SUM(l.monthly_rent * 12)::float, 0) as ratio
      FROM maintenance m
      LEFT JOIN properties p ON m.property_id = p.id
      LEFT JOIN leases l ON p.id = l.property_id
      WHERE p.agency_id = $1
      AND m.created_at > NOW() - INTERVAL '1 year'`,
      [agencyId]
    );

    return Math.round((result.rows[0].ratio || 0) * 100);
  }

  /**
   * Calculate tenant retention rate
   * @private
   */
  async calculateTenantRetention(agencyId) {
    const result = await pool.query(
      `SELECT 
        COUNT(CASE WHEN renewed = true THEN 1 END)::float / COUNT(*)::float as rate
      FROM leases l
      JOIN properties p ON l.property_id = p.id
      WHERE p.agency_id = $1
      AND l.lease_end_date < NOW()`,
      [agencyId]
    );

    return Math.round(result.rows[0].rate * 100);
  }

  /**
   * Benchmark agency against others
   * @param {string} agencyId
   * @param {number} limit - number of competitors
   */
  async benchmarkAgency(agencyId, limit = 5) {
    try {
      const myKPIs = await this.calculateStrategicKPIs(agencyId);

      const result = await pool.query(
        `SELECT id FROM agencies 
         WHERE id != $1 AND status = 'ACTIVE'
         LIMIT $2`,
        [agencyId, limit]
      );

      const competitors = {};
      for (const comp of result.rows) {
        competitors[comp.id] = await this.calculateStrategicKPIs(comp.id);
      }

      // Calculate percentile rankings
      const ranking = this.calculateRankings(myKPIs, competitors);

      logger.info(`✓ Benchmarking completed for agency ${agencyId}`);

      return {
        myKPIs,
        competitors,
        ranking,
        analysis: this.generateBenchmarkAnalysis(myKPIs, competitors)
      };
    } catch (err) {
      logger.error('Error benchmarking agency', err);
      throw err;
    }
  }

  /**
   * Calculate rankings
   * @private
   */
  calculateRankings(myKPIs, competitors) {
    const rankings = {};

    for (const [kpiName, myValue] of Object.entries(myKPIs)) {
      const allValues = [myValue, ...Object.values(competitors).map(c => c[kpiName])];
      const sortedValues = allValues.sort((a, b) => b - a);
      const myRank = sortedValues.indexOf(myValue) + 1;
      const percentile = Math.round((1 - myRank / allValues.length) * 100);

      rankings[kpiName] = {
        value: myValue,
        rank: myRank,
        outOf: allValues.length,
        percentile
      };
    }

    return rankings;
  }

  /**
   * Generate benchmark analysis
   * @private
   */
  generateBenchmarkAnalysis(myKPIs, competitors) {
    const insights = [];

    // Analyze vacancy rate
    const avgVacancy = Object.values(competitors).reduce((sum, c) => sum + c.vacancyRate, 0) / Object.keys(competitors).length;
    if (myKPIs.vacancyRate > avgVacancy) {
      insights.push({
        kpi: 'Vacancy Rate',
        status: 'WARNING',
        message: `Your vacancy rate (${myKPIs.vacancyRate}%) is above average (${Math.round(avgVacancy)}%). Consider marketing strategies.`
      });
    }

    // Analyze on-time payments
    const avgPayment = Object.values(competitors).reduce((sum, c) => sum + c.paymentOnTimeRate, 0) / Object.keys(competitors).length;
    if (myKPIs.paymentOnTimeRate < avgPayment) {
      insights.push({
        kpi: 'Payment On-Time Rate',
        status: 'WARNING',
        message: `Your payment rate (${myKPIs.paymentOnTimeRate}%) is below average (${Math.round(avgPayment)}%). Review collection strategies.`
      });
    }

    // Analyze maintenance costs
    const avgMaintenance = Object.values(competitors).reduce((sum, c) => sum + c.maintenanceCostRatio, 0) / Object.keys(competitors).length;
    if (myKPIs.maintenanceCostRatio > avgMaintenance) {
      insights.push({
        kpi: 'Maintenance Cost Ratio',
        status: 'INFO',
        message: `Your maintenance costs (${myKPIs.maintenanceCostRatio}%) exceed average (${Math.round(avgMaintenance)}%). Preventive maintenance may help.`
      });
    }

    return insights;
  }

  /**
   * Forecast cash flow
   * @param {string} agencyId
   * @param {number} months - forecast period
   */
  async forecastCashFlow(agencyId, months = 12) {
    try {
      // Get historical data
      const historical = await pool.query(
        `SELECT 
          DATE_TRUNC('month', paid_date)::date as month,
          SUM(amount) as revenue
        FROM invoices i
        JOIN leases l ON i.lease_id = l.id
        JOIN properties p ON l.property_id = p.id
        WHERE p.agency_id = $1
        AND i.paid_date > NOW() - INTERVAL '24 months'
        GROUP BY DATE_TRUNC('month', paid_date)
        ORDER BY month DESC`,
        [agencyId]
      );

      // Simple forecast: use last 12 months average
      const avgMonthlyRevenue = historical.rows.length > 0
        ? historical.rows.slice(0, 12).reduce((sum, row) => sum + parseFloat(row.revenue), 0) / Math.min(12, historical.rows.length)
        : 0;

      // Generate forecast
      const forecast = [];
      for (let i = 1; i <= months; i++) {
        const forecastDate = dayjs().add(i, 'months');
        forecast.push({
          month: forecastDate.format('YYYY-MM'),
          projectedRevenue: Math.round(avgMonthlyRevenue * (1 + Math.random() * 0.1 - 0.05)), // ±5% variance
          confidence: 75 - (i * 2) // Decreasing confidence
        });
      }

      logger.info(`✓ Cash flow forecast generated for agency ${agencyId}`);

      return {
        avgMonthlyRevenue: Math.round(avgMonthlyRevenue),
        forecast,
        totalProjectedRevenue: forecast.reduce((sum, f) => sum + f.projectedRevenue, 0)
      };
    } catch (err) {
      logger.error('Error forecasting cash flow', err);
      throw err;
    }
  }
}

module.exports = new StrategicPilotingService();

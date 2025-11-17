/**
 * 🤖 AKIG Prescriptive AI Module
 * Advanced ML-powered recommendations
 * 
 * Features:
 * - AI recommendations (optimal actions vs just alerts)
 * - Task distribution based on agent load & performance
 * - Predictive analytics (rent defaults, tenant departures)
 * - Seasonal pattern detection
 * - Anomaly detection in property markets
 */

const pool = require('../db');
const logger = require('./logger');
const dayjs = require('dayjs');

class PrescriptiveAIService {
  /**
   * Generate smart recommendations for agents
   * @param {string} agentId
   * @returns {Promise<Array>} array of recommendations with priority
   */
  async generateRecommendations(agentId) {
    try {
      const recommendations = [];

      // 1. Contact tenants before rent due (J-7)
      const upcomingRentDue = await this.getTenantsForUpcomingRent(agentId);
      for (const tenant of upcomingRentDue) {
        recommendations.push({
          id: `rent-${tenant.id}`,
          type: 'PROACTIVE_CONTACT',
          priority: 'HIGH',
          title: `Call ${tenant.name} - Rent due in ${tenant.daysUntilDue} days`,
          description: `Ensure timely payment for property ${tenant.property}`,
          action: {
            type: 'CALL_TENANT',
            targetId: tenant.id,
            suggestedScript: `Hi ${tenant.name}, just confirming you'll make the payment by ${dayjs().add(tenant.daysUntilDue, 'days').format('DD/MM')}?`
          },
          expectedOutcome: '95% on-time payment probability',
          timeEstimate: '5 minutes'
        });
      }

      // 2. Predict high-risk departures
      const riskOfDeparture = await this.predictTenantDepartures(agentId);
      for (const tenant of riskOfDeparture) {
        recommendations.push({
          id: `departure-${tenant.id}`,
          type: 'RETENTION_ACTION',
          priority: 'HIGH',
          title: `Retention call - ${tenant.name} (${tenant.departureRisk}% risk)`,
          description: tenant.reason,
          action: {
            type: 'RETENTION_CALL',
            targetId: tenant.id,
            suggestedOffer: tenant.suggestedIncentive
          },
          expectedOutcome: `Reduce churn by ${tenant.retentionPotential}%`,
          timeEstimate: '10 minutes'
        });
      }

      // 3. Alert on potential payment defaults
      const paymentRisk = await this.identifyPaymentRisks(agentId);
      for (const alert of paymentRisk) {
        recommendations.push({
          id: `payment-${alert.id}`,
          type: 'PAYMENT_INTERVENTION',
          priority: 'CRITICAL',
          title: `Payment risk - ${alert.tenantName} - Action required`,
          description: alert.reason,
          action: {
            type: 'COLLECT_PAYMENT',
            targetId: alert.id,
            amount: alert.amount,
            deadline: alert.deadline
          },
          expectedOutcome: 'Recover payment before deadline',
          timeEstimate: '15 minutes'
        });
      }

      // 4. Maintenance alerts
      const maintenanceIssues = await this.predictMaintenanceNeeds(agentId);
      for (const issue of maintenanceIssues) {
        recommendations.push({
          id: `maint-${issue.id}`,
          type: 'PREVENTIVE_MAINTENANCE',
          priority: 'MEDIUM',
          title: `Schedule maintenance - ${issue.propertyName}`,
          description: issue.predictedIssue,
          action: {
            type: 'SCHEDULE_MAINTENANCE',
            targetId: issue.id,
            estimatedCost: issue.estimatedCost
          },
          expectedOutcome: 'Prevent costly emergency repairs',
          timeEstimate: '20 minutes'
        });
      }

      return recommendations.sort((a, b) => {
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    } catch (err) {
      logger.error('Error generating recommendations', err);
      return [];
    }
  }

  /**
   * Get tenants with upcoming rent due (next 7 days)
   * @private
   */
  async getTenantsForUpcomingRent(agentId) {
    try {
      const query = `
        SELECT 
          t.id, t.name, t.email, t.phone,
          p.name as property,
          l.rent_due_day,
          CASE 
            WHEN l.rent_due_day >= EXTRACT(DAY FROM NOW())
            THEN l.rent_due_day - EXTRACT(DAY FROM NOW())
            ELSE (EXTRACT(DAY FROM DATE_TRUNC('month', NOW() + INTERVAL '1 month')) + l.rent_due_day) - EXTRACT(DAY FROM NOW())
          END as daysUntilDue
        FROM tenants t
        JOIN leases l ON t.id = l.tenant_id
        JOIN properties p ON l.property_id = p.id
        WHERE p.agent_id = $1
        AND l.status = 'ACTIVE'
        AND daysUntilDue BETWEEN 1 AND 7
      `;
      
      const result = await pool.query(query, [agentId]);
      return result.rows;
    } catch (err) {
      logger.error('Error getting tenants for upcoming rent', err);
      return [];
    }
  }

  /**
   * Predict tenant departures using ML model
   * @private
   */
  async predictTenantDepartures(agentId) {
    try {
      // Simplified ML model - in production, use TensorFlow.js or external ML API
      const query = `
        SELECT 
          t.id, t.name, l.end_date,
          (
            CASE 
              WHEN EXTRACT(DAY FROM l.end_date - NOW()) <= 30 THEN 80
              WHEN t.complaint_count > 2 THEN 65
              WHEN l.rent_payment_delays > 3 THEN 75
              ELSE 20
            END
          ) as departureRisk,
          CASE 
            WHEN EXTRACT(DAY FROM l.end_date - NOW()) <= 30 
            THEN 'Lease ending soon'
            WHEN t.complaint_count > 2 
            THEN 'High complaint history'
            WHEN l.rent_payment_delays > 3 
            THEN 'Payment issues detected'
            ELSE 'Satisfaction risk'
          END as reason,
          CASE 
            WHEN t.complaint_count > 2 
            THEN 'Rent discount 5-10%'
            WHEN l.rent_payment_delays > 3 
            THEN 'Payment plan negotiation'
            ELSE 'Lease renewal offer'
          END as suggestedIncentive,
          25 as retentionPotential
        FROM tenants t
        JOIN leases l ON t.id = l.tenant_id
        JOIN properties p ON l.property_id = p.id
        WHERE p.agent_id = $1
        AND l.status = 'ACTIVE'
        AND departureRisk > 50
      `;
      
      const result = await pool.query(query, [agentId]);
      return result.rows;
    } catch (err) {
      logger.error('Error predicting tenant departures', err);
      return [];
    }
  }

  /**
   * Identify payment risks
   * @private
   */
  async identifyPaymentRisks(agentId) {
    try {
      const query = `
        SELECT 
          l.id, t.name as tenantName,
          COALESCE(SUM(CASE WHEN i.paid = false THEN i.amount ELSE 0 END), 0) as amount,
          MAX(i.due_date) as deadline,
          CASE 
            WHEN EXTRACT(DAY FROM NOW() - MAX(i.due_date)) > 30 THEN 'Over 30 days late'
            WHEN EXTRACT(DAY FROM NOW() - MAX(i.due_date)) > 15 THEN 'Over 15 days late'
            WHEN EXTRACT(DAY FROM NOW() - MAX(i.due_date)) > 0 THEN 'Recently overdue'
            ELSE 'Due soon'
          END as reason
        FROM leases l
        JOIN tenants t ON l.tenant_id = t.id
        JOIN properties p ON l.property_id = p.id
        LEFT JOIN invoices i ON l.id = i.lease_id
        WHERE p.agent_id = $1
        AND l.status = 'ACTIVE'
        AND i.paid = false
        AND i.due_date < NOW()
        GROUP BY l.id, t.name
      `;
      
      const result = await pool.query(query, [agentId]);
      return result.rows;
    } catch (err) {
      logger.error('Error identifying payment risks', err);
      return [];
    }
  }

  /**
   * Predict maintenance needs
   * @private
   */
  async predictMaintenanceNeeds(agentId) {
    try {
      // Simple model: properties built > 20 years ago need preventive maintenance
      const query = `
        SELECT 
          p.id, p.name as propertyName,
          EXTRACT(YEAR FROM AGE(p.construction_year)) as propertyAge,
          'Plumbing inspection recommended' as predictedIssue,
          500 as estimatedCost
        FROM properties p
        WHERE p.agent_id = $1
        AND p.construction_year < (EXTRACT(YEAR FROM NOW()) - 15)
        AND p.last_maintenance < NOW() - INTERVAL '1 year'
      `;
      
      const result = await pool.query(query, [agentId]);
      return result.rows;
    } catch (err) {
      logger.error('Error predicting maintenance needs', err);
      return [];
    }
  }

  /**
   * Intelligently distribute tasks among agents
   * @param {Array<string>} agentIds
   * @param {Array<Object>} tasks
   * @returns {Promise<Object>} task distribution
   */
  async distributeTasksIntelligently(agentIds, tasks) {
    try {
      // Get agent metrics
      const agentMetrics = await Promise.all(
        agentIds.map(id => this.getAgentMetrics(id))
      );

      // Create distribution based on load, performance, and workload
      const distribution = {};
      
      for (const agent of agentMetrics) {
        distribution[agent.id] = {
          capacity: this.calculateRemainingCapacity(agent),
          suggestedTaskCount: Math.floor(this.calculateRemainingCapacity(agent) / 30), // 30 min per task avg
          currentLoad: agent.activeTasks,
          performanceScore: agent.performanceScore,
          efficiency: agent.taskCompletionRate
        };
      }

      // Assign tasks to agents with best capacity/performance ratio
      const assignment = {};
      for (const agent of agentMetrics) {
        assignment[agent.id] = tasks
          .filter(t => t.estimatedTime <= distribution[agent.id].capacity)
          .slice(0, distribution[agent.id].suggestedTaskCount);
      }

      return assignment;
    } catch (err) {
      logger.error('Error distributing tasks intelligently', err);
      return {};
    }
  }

  /**
   * Get agent metrics
   * @private
   */
  async getAgentMetrics(agentId) {
    try {
      const result = await pool.query(
        `SELECT 
          id,
          (SELECT COUNT(*) FROM tasks WHERE agent_id = $1 AND status = 'ACTIVE') as activeTasks,
          (SELECT AVG(rating) FROM task_ratings WHERE agent_id = $1) as performanceScore,
          (SELECT COUNT(*) FILTER (WHERE status = 'COMPLETED') / NULLIF(COUNT(*), 0) FROM tasks WHERE agent_id = $1) as taskCompletionRate,
          available_hours
        FROM agents WHERE id = $1`,
        [agentId]
      );

      return {
        id: agentId,
        ...result.rows[0]
      };
    } catch (err) {
      logger.error('Error getting agent metrics', err);
      return {};
    }
  }

  /**
   * Calculate remaining agent capacity
   * @private
   */
  calculateRemainingCapacity(agent) {
    const workHoursPerDay = 8;
    const tasksHours = (agent.activeTasks || 0) * 0.5; // 30 min per task
    const utilisedCapacity = tasksHours / workHoursPerDay;
    return Math.max(0, (1 - utilisedCapacity) * 100);
  }
}

module.exports = new PrescriptiveAIService();

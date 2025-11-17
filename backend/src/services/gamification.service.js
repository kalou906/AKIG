/**
 * 🎮 AKIG Gamification & Organization Module
 * Advanced engagement, recognition & training
 * 
 * Features:
 * - Badges and achievements
 * - Leaderboards and rankings
 * - Performance history & analytics
 * - Integrated training modules
 * - Incident runbooks & procedures
 * - Team motivation system
 */

const pool = require('../db');
const logger = require('./logger');
const dayjs = require('dayjs');

class GamificationService {
  /**
   * Award badge to agent
   * @param {string} agentId
   * @param {string} badgeType
   */
  async awardBadge(agentId, badgeType) {
    try {
      const badges = {
        'PERFECT_MONTH': { name: '⭐ Perfect Month', description: '100% on-time payments', points: 100 },
        'QUICK_COLLECTOR': { name: '⚡ Quick Collector', description: '5 payments collected in 1 day', points: 50 },
        'TENANT_HERO': { name: '🦸 Tenant Hero', description: '10+ positive ratings', points: 75 },
        'MAINTENANCE_MASTER': { name: '🔧 Maintenance Master', description: 'Zero maintenance complaints', points: 60 },
        'TEAM_PLAYER': { name: '👥 Team Player', description: 'Helped 5+ colleagues', points: 40 },
        'INNOVATION': { name: '💡 Innovator', description: 'Implemented improvement suggestion', points: 50 },
        'TRAINING_COMPLETED': { name: '📚 Scholar', description: 'Completed 3 training modules', points: 30 },
        'STREAK': { name: '🔥 On Fire', description: '7-day perfect attendance', points: 25 }
      };

      const badge = badges[badgeType];
      if (!badge) {
        throw new Error(`Unknown badge type: ${badgeType}`);
      }

      // Check if already awarded (avoid duplicates)
      const existing = await pool.query(
        `SELECT * FROM badges WHERE agent_id = $1 AND type = $2`,
        [agentId, badgeType]
      );

      if (existing.rows.length > 0) {
        logger.warn(`Badge ${badgeType} already awarded to agent ${agentId}`);
        return { alreadyAwarded: true };
      }

      // Award badge
      await pool.query(
        `INSERT INTO badges (agent_id, type, name, points, awarded_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [agentId, badgeType, badge.name, badge.points]
      );

      logger.info(`🏆 Badge awarded: ${badge.name} to agent ${agentId}`);

      return { success: true, badge };
    } catch (err) {
      logger.error('Error awarding badge', err);
      throw err;
    }
  }

  /**
   * Check and auto-award badges based on performance
   * @param {string} agentId
   */
  async checkAndAwardBadges(agentId) {
    try {
      // Check Perfect Month
      const monthStats = await pool.query(
        `SELECT COUNT(*) as total, COUNT(CASE WHEN paid_date <= due_date THEN 1 END) as onTime
         FROM invoices i
         WHERE i.agent_id = $1 
         AND i.created_at > DATE_TRUNC('month', NOW())`,
        [agentId]
      );

      if (monthStats.rows[0].total > 0 && monthStats.rows[0].ontime === monthStats.rows[0].total) {
        await this.awardBadge(agentId, 'PERFECT_MONTH');
      }

      // Check Tenant Hero
      const ratings = await pool.query(
        `SELECT COUNT(*) as count FROM agent_ratings 
         WHERE agent_id = $1 AND rating >= 4.5
         AND created_at > NOW() - INTERVAL '30 days'`,
        [agentId]
      );

      if (ratings.rows[0].count >= 10) {
        await this.awardBadge(agentId, 'TENANT_HERO');
      }

      // Check Training Completed
      const training = await pool.query(
        `SELECT COUNT(*) as count FROM training_completion 
         WHERE agent_id = $1 AND completed_at IS NOT NULL`,
        [agentId]
      );

      if (training.rows[0].count >= 3) {
        await this.awardBadge(agentId, 'TRAINING_COMPLETED');
      }

      logger.info(`✓ Badge check completed for agent ${agentId}`);
    } catch (err) {
      logger.error('Error checking badges', err);
    }
  }

  /**
   * Get leaderboard
   * @param {string} agencyId
   * @param {string} period - 'week' | 'month' | 'year'
   * @param {number} limit
   */
  async getLeaderboard(agencyId, period = 'month', limit = 10) {
    try {
      const dateFilter = this.getDateFilter(period);

      const result = await pool.query(
        `SELECT 
          a.id, a.name, a.avatar,
          COUNT(CASE WHEN i.paid_date <= i.due_date THEN 1 END) as onTimePayments,
          COUNT(i.id) as totalPayments,
          COUNT(CASE WHEN ar.rating >= 4 THEN 1 END) as positiveRatings,
          AVG(ar.rating) as avgRating,
          COALESCE(SUM(b.points), 0) as totalPoints
        FROM agents a
        LEFT JOIN invoices i ON a.id = i.agent_id AND i.created_at > ${dateFilter}
        LEFT JOIN agent_ratings ar ON a.id = ar.agent_id AND ar.created_at > ${dateFilter}
        LEFT JOIN badges b ON a.id = b.agent_id
        WHERE a.agency_id = $1
        GROUP BY a.id, a.name, a.avatar
        ORDER BY totalPoints DESC, onTimePayments DESC
        LIMIT $2`,
        [agencyId, limit]
      );

      return result.rows.map((row, index) => ({
        rank: index + 1,
        ...row,
        medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''
      }));
    } catch (err) {
      logger.error('Error getting leaderboard', err);
      return [];
    }
  }

  /**
   * Get agent performance history
   * @param {string} agentId
   * @param {number} months
   */
  async getPerformanceHistory(agentId, months = 12) {
    try {
      const history = [];

      for (let i = months - 1; i >= 0; i--) {
        const startDate = dayjs().subtract(i, 'months').startOf('month');
        const endDate = startDate.endOf('month');

        const stats = await pool.query(
          `SELECT 
            COUNT(i.id) as totalTasks,
            COUNT(CASE WHEN i.paid_date <= i.due_date THEN 1 END) as completedOnTime,
            AVG(ar.rating) as avgRating,
            COUNT(c.id) as complaintCount
          FROM agents a
          LEFT JOIN invoices i ON a.id = i.agent_id 
            AND i.created_at >= $2 AND i.created_at <= $3
          LEFT JOIN agent_ratings ar ON a.id = ar.agent_id 
            AND ar.created_at >= $2 AND ar.created_at <= $3
          LEFT JOIN complaints c ON a.id = c.agent_id 
            AND c.created_at >= $2 AND c.created_at <= $3
          WHERE a.id = $1`,
          [agentId, startDate.toDate(), endDate.toDate()]
        );

        history.push({
          month: startDate.format('YYYY-MM'),
          ...stats.rows[0]
        });
      }

      return history;
    } catch (err) {
      logger.error('Error getting performance history', err);
      return [];
    }
  }

  /**
   * Get training modules for agent
   */
  async getTrainingModules() {
    try {
      return [
        {
          id: 'MODULE_001',
          title: '📋 Notice Management',
          description: 'Proper procedures for lease notices',
          duration: 15,
          sections: ['Legal requirements', 'Timing rules', 'Documentation'],
          quiz: [
            { question: 'How many days notice for eviction?', options: ['15', '30', '45', '60'], correct: 2 },
            { question: 'Can notice be verbal?', options: ['Yes', 'No'], correct: 1 }
          ]
        },
        {
          id: 'MODULE_002',
          title: '⚖️ Dispute Resolution',
          description: 'Handling tenant disputes and complaints',
          duration: 20,
          sections: ['Communication', 'Documentation', 'Escalation', 'Resolution']
        },
        {
          id: 'MODULE_003',
          title: '💰 Payment Collections',
          description: 'Effective payment collection strategies',
          duration: 25,
          sections: ['Follow-up', 'Negotiation', 'Legal action']
        },
        {
          id: 'MODULE_004',
          title: '🔧 Property Maintenance',
          description: 'Maintenance scheduling and vendor management',
          duration: 18,
          sections: ['Preventive maintenance', 'Emergency repairs', 'Vendor selection']
        },
        {
          id: 'MODULE_005',
          title: '📱 AKIG Platform',
          description: 'Master the AKIG system',
          duration: 30,
          sections: ['Dashboard', 'Tasks', 'Reports', 'Mobile app']
        }
      ];
    } catch (err) {
      logger.error('Error getting training modules', err);
      return [];
    }
  }

  /**
   * Mark training as completed
   * @param {string} agentId
   * @param {string} moduleId
   */
  async completeTraining(agentId, moduleId, quizScore) {
    try {
      await pool.query(
        `INSERT INTO training_completion (agent_id, module_id, quiz_score, completed_at)
         VALUES ($1, $2, $3, NOW())`,
        [agentId, moduleId, quizScore]
      );

      // Auto-award badge if 3+ modules completed
      await this.checkAndAwardBadges(agentId);

      logger.info(`✓ Training ${moduleId} completed by agent ${agentId}`);
    } catch (err) {
      logger.error('Error completing training', err);
      throw err;
    }
  }

  /**
   * Get incident runbooks
   */
  getIncidentRunbooks() {
    return {
      'SERVER_DOWN': {
        title: 'Server Outage Procedure',
        severity: 'CRITICAL',
        steps: [
          '1. Immediately notify DevOps team (Slack #ops-emergency)',
          '2. Start communication broadcast: "Service experiencing disruption"',
          '3. Begin automatic failover (check status.akig.local)',
          '4. If failover fails: activate PRA procedures',
          '5. Hourly status updates to stakeholders',
          '6. Post-mortem within 24 hours'
        ],
        contactList: ['devops-lead@akig.local', 'cto@akig.local']
      },
      'DATA_BREACH': {
        title: 'Data Breach Response',
        severity: 'CRITICAL',
        steps: [
          '1. ISOLATE: Disconnect affected system immediately',
          '2. SECURE: Change all admin passwords',
          '3. NOTIFY: Alert security team and legal',
          '4. INVESTIGATE: Collect logs and audit trail',
          '5. CONTAIN: Revoke compromised credentials',
          '6. COMMUNICATE: Notify affected users (within 72 hours)',
          '7. REMEDIATE: Patch vulnerability',
          '8. MONITOR: Enhanced monitoring for 30 days'
        ],
        contactList: ['security@akig.local', 'ciso@akig.local', 'legal@akig.local']
      },
      'TENANT_COMPLAINT': {
        title: 'Tenant Complaint Escalation',
        severity: 'HIGH',
        steps: [
          '1. Document complaint in detail with timestamps',
          '2. Acknowledge to tenant within 4 hours',
          '3. Assign to manager for review',
          '4. Investigate root cause within 24 hours',
          '5. Propose solution/compensation if warranted',
          '6. Follow-up with tenant after 7 days',
          '7. Close ticket and document resolution'
        ]
      },
      'PAYMENT_FAILURE': {
        title: 'Payment System Failure',
        severity: 'HIGH',
        steps: [
          '1. Alert finance team immediately',
          '2. Identify affected transactions (date range)',
          '3. Retry affected payments (automated)',
          '4. If manual retry needed: log in support system',
          '5. Verify all payments posted within 48 hours',
          '6. Notify tenants if payments reverved',
          '7. Root cause analysis'
        ]
      }
    };
  }

  /**
   * @private
   */
  getDateFilter(period) {
    switch (period) {
      case 'week':
        return `NOW() - INTERVAL '7 days'`;
      case 'month':
        return `NOW() - INTERVAL '30 days'`;
      case 'year':
        return `NOW() - INTERVAL '365 days'`;
      default:
        return `NOW() - INTERVAL '30 days'`;
    }
  }
}

module.exports = new GamificationService();

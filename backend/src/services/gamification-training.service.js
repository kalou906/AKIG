/**
 * Gamification & Training Service
 * Advanced gamification system with badges, leaderboards, and integrated training
 * Provides engagement and skill development through game mechanics
 */

class GamificationTrainingService {
  constructor() {
    this.badgeTypes = [
      'perfect_month',
      'quick_collector',
      'tenant_hero',
      'maintenance_master',
      'team_player',
      'innovator',
      'scholar',
      'on_fire'
    ];
    this.trainingModules = [
      'notice_management',
      'disputes',
      'collections',
      'maintenance',
      'platform'
    ];
  }

  /**
   * Get badge system configuration
   */
  getBadgeSystem() {
    return {
      badges: {
        perfect_month: {
          id: 'perfect_month',
          name: 'Perfect Month',
          description: '100% on-time payments and no complaints',
          icon: 'award',
          color: '#FFD700',
          points: 100,
          criteria: {
            onTimePayments: 100,
            complaintCount: 0,
            period: 'monthly'
          },
          rarity: 'rare'
        },
        quick_collector: {
          id: 'quick_collector',
          name: 'Quick Collector',
          description: 'Collect 50+ payments this month',
          icon: 'trending-up',
          color: '#4CAF50',
          points: 75,
          criteria: {
            paymentsCollected: 50,
            period: 'monthly'
          },
          rarity: 'common'
        },
        tenant_hero: {
          id: 'tenant_hero',
          name: 'Tenant Hero',
          description: 'Maintain 4.5+ tenant satisfaction score',
          icon: 'heart',
          color: '#FF69B4',
          points: 85,
          criteria: {
            satisfactionScore: 4.5,
            evaluationsCount: 10,
            period: 'rolling'
          },
          rarity: 'uncommon'
        },
        maintenance_master: {
          id: 'maintenance_master',
          name: 'Maintenance Master',
          description: 'Resolve 30+ maintenance requests on time',
          icon: 'wrench',
          color: '#FF6B35',
          points: 80,
          criteria: {
            maintenanceResolved: 30,
            onTimeRate: 0.9,
            period: 'monthly'
          },
          rarity: 'uncommon'
        },
        team_player: {
          id: 'team_player',
          name: 'Team Player',
          description: 'Collaborate on 10+ shared tasks',
          icon: 'users',
          color: '#00BCD4',
          points: 70,
          criteria: {
            sharedTasks: 10,
            period: 'monthly'
          },
          rarity: 'common'
        },
        innovator: {
          id: 'innovator',
          name: 'Innovator',
          description: 'Suggest 5 improvements implemented',
          icon: 'lightbulb',
          color: '#FFC107',
          points: 90,
          criteria: {
            suggestionsImplemented: 5,
            period: 'rolling'
          },
          rarity: 'rare'
        },
        scholar: {
          id: 'scholar',
          name: 'Scholar',
          description: 'Complete all 5 training modules',
          icon: 'book',
          color: '#9C27B0',
          points: 120,
          criteria: {
            trainingModulesCompleted: 5,
            score: 0.8,
            period: 'one-time'
          },
          rarity: 'epic'
        },
        on_fire: {
          id: 'on_fire',
          name: 'On Fire',
          description: 'Earn 3 badges in 1 month',
          icon: 'flame',
          color: '#FF4500',
          points: 150,
          criteria: {
            badgesInMonth: 3,
            period: 'monthly'
          },
          rarity: 'legendary'
        }
      }
    };
  }

  /**
   * Award badge to user
   */
  async awardBadge(pool, userId, badgeId, reason) {
    try {
      const badge = this.getBadgeSystem().badges[badgeId];

      if (!badge) {
        return { error: 'Badge not found' };
      }

      // Check if user already has this badge (for one-time badges)
      if (badge.criteria.period === 'one-time') {
        const existing = await pool.query(
          `SELECT id FROM user_badges 
           WHERE user_id = $1 AND badge_id = $2`,
          [userId, badgeId]
        );

        if (existing.rows.length > 0) {
          return { error: 'User already has this badge' };
        }
      }

      // Award badge
      const result = await pool.query(
        `INSERT INTO user_badges (user_id, badge_id, points, reason, awarded_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [userId, badgeId, badge.points, reason]
      );

      // Add points to user
      await pool.query(
        `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
        [badge.points, userId]
      );

      return {
        success: true,
        badge,
        pointsAwarded: badge.points
      };
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard rankings
   */
  async getLeaderboard(pool, agencyId, period = 'month', limit = 10) {
    try {
      // Determine date range
      let dateFilter = '';
      if (period === 'month') {
        dateFilter = `AND DATE_TRUNC('month', u.awarded_at) = DATE_TRUNC('month', NOW())`;
      } else if (period === 'week') {
        dateFilter = `AND u.awarded_at > NOW() - INTERVAL '7 days'`;
      }

      const result = await pool.query(
        `SELECT 
          u.id,
          u.name,
          u.email,
          SUM(b.points) as total_points,
          COUNT(DISTINCT ub.badge_id) as badge_count
         FROM users u
         LEFT JOIN user_badges ub ON u.id = ub.user_id ${dateFilter}
         LEFT JOIN badges b ON ub.badge_id = b.id
         WHERE u.agency_id = $1 AND u.role = 'agent'
         GROUP BY u.id, u.name, u.email
         ORDER BY total_points DESC, badge_count DESC
         LIMIT $2`,
        [agencyId, limit]
      );

      const leaderboard = result.rows.map((row, index) => ({
        rank: index + 1,
        ...row,
        totalPoints: row.total_points || 0,
        badgeCount: row.badge_count || 0
      }));

      return {
        success: true,
        period,
        leaderboard
      };
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get training modules
   */
  getTrainingModules() {
    return {
      notice_management: {
        id: 'notice_management',
        name: 'Notice Management',
        description: 'Proper procedures for tenant notices and communications',
        duration: '30 minutes',
        difficulty: 'beginner',
        modules: [
          {
            title: 'Legal Notice Requirements',
            content: 'Understanding notice periods and legal requirements',
            duration: 10,
            quiz: 5
          },
          {
            title: 'Notice Templates',
            content: 'Using correct notice templates',
            duration: 10,
            quiz: 5
          },
          {
            title: 'Delivery Methods',
            content: 'Proper notice delivery and documentation',
            duration: 10,
            quiz: 5
          }
        ],
        passingScore: 0.8
      },
      disputes: {
        id: 'disputes',
        name: 'Dispute Resolution',
        description: 'Handling tenant and landlord disputes professionally',
        duration: '45 minutes',
        difficulty: 'intermediate',
        modules: [
          {
            title: 'Dispute Types',
            content: 'Identifying common dispute categories',
            duration: 10,
            quiz: 5
          },
          {
            title: 'Resolution Process',
            content: 'Step-by-step dispute resolution',
            duration: 15,
            quiz: 10
          },
          {
            title: 'Documentation',
            content: 'Proper dispute documentation',
            duration: 10,
            quiz: 5
          },
          {
            title: 'Escalation',
            content: 'When and how to escalate',
            duration: 10,
            quiz: 5
          }
        ],
        passingScore: 0.75
      },
      collections: {
        id: 'collections',
        name: 'Collections & Payment',
        description: 'Effective payment collection strategies',
        duration: '40 minutes',
        difficulty: 'intermediate',
        modules: [
          {
            title: 'Payment Tracking',
            content: 'Monitoring and tracking payments',
            duration: 10,
            quiz: 5
          },
          {
            title: 'Collection Methods',
            content: 'Multiple payment collection channels',
            duration: 10,
            quiz: 5
          },
          {
            title: 'Late Payment Handling',
            content: 'Managing overdue payments',
            duration: 10,
            quiz: 5
          },
          {
            title: 'Payment Plans',
            content: 'Creating and managing payment plans',
            duration: 10,
            quiz: 5
          }
        ],
        passingScore: 0.8
      },
      maintenance: {
        id: 'maintenance',
        name: 'Maintenance Coordination',
        description: 'Managing property maintenance effectively',
        duration: '35 minutes',
        difficulty: 'beginner',
        modules: [
          {
            title: 'Request Processing',
            content: 'Handling maintenance requests',
            duration: 10,
            quiz: 5
          },
          {
            title: 'Vendor Management',
            content: 'Working with contractors and vendors',
            duration: 10,
            quiz: 5
          },
          {
            title: 'Preventive Maintenance',
            content: 'Proactive maintenance scheduling',
            duration: 10,
            quiz: 5
          },
          {
            title: 'Cost Control',
            content: 'Managing maintenance budgets',
            duration: 5,
            quiz: 3
          }
        ],
        passingScore: 0.75
      },
      platform: {
        id: 'platform',
        name: 'AKIG Platform Mastery',
        description: 'Complete guide to using AKIG platform features',
        duration: '60 minutes',
        difficulty: 'beginner',
        modules: [
          {
            title: 'Getting Started',
            content: 'Platform basics and navigation',
            duration: 10,
            quiz: 5
          },
          {
            title: 'Properties & Tenants',
            content: 'Managing properties and tenant information',
            duration: 15,
            quiz: 10
          },
          {
            title: 'Payments & Finances',
            content: 'Payment processing and financial reports',
            duration: 15,
            quiz: 10
          },
          {
            title: 'Analytics & Reports',
            content: 'Using analytics and generating reports',
            duration: 10,
            quiz: 5
          },
          {
            title: 'Mobile App',
            content: 'Mobile app features and usage',
            duration: 10,
            quiz: 5
          }
        ],
        passingScore: 0.8
      }
    };
  }

  /**
   * Track training progress
   */
  async trackTrainingProgress(pool, userId, moduleId, sectionId, score) {
    try {
      const module = this.getTrainingModules()[moduleId];

      if (!module) {
        return { error: 'Module not found' };
      }

      // Save progress
      const result = await pool.query(
        `INSERT INTO training_progress (user_id, module_id, section_id, score, completed_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, module_id, section_id)
         DO UPDATE SET score = $4, completed_at = NOW()
         RETURNING *`,
        [userId, moduleId, sectionId, score]
      );

      // Check if module completed
      const completedSections = await pool.query(
        `SELECT COUNT(*) as count FROM training_progress
         WHERE user_id = $1 AND module_id = $2 AND score >= $3`,
        [userId, moduleId, module.passingScore * 100]
      );

      const moduleProgress = result.rows[0];

      // Award Scholar badge if all modules completed
      if (completedSections.rows[0].count >= 5) {
        await this.awardBadge(pool, userId, 'scholar', 'Completed all training modules');
      }

      return {
        success: true,
        progress: moduleProgress,
        moduleCompleted: completedSections.rows[0].count >= 5
      };
    } catch (error) {
      console.error('Error tracking training progress:', error);
      throw error;
    }
  }

  /**
   * Get incident runbooks
   */
  getIncidentRunbooks() {
    return {
      server_down: {
        id: 'server_down',
        title: 'Server Down - Incident Runbook',
        severity: 'critical',
        description: 'API server or critical service is down',
        steps: [
          {
            step: 1,
            title: 'Confirm the issue',
            actions: [
              'Check monitoring dashboard',
              'Verify from multiple locations',
              'Check status page'
            ]
          },
          {
            step: 2,
            title: 'Escalate',
            actions: [
              'Page on-call DevOps engineer',
              'Notify team lead',
              'Start incident bridge'
            ]
          },
          {
            step: 3,
            title: 'Triage',
            actions: [
              'Identify root cause',
              'Check logs for errors',
              'Review recent deployments'
            ]
          },
          {
            step: 4,
            title: 'Mitigate',
            actions: [
              'Implement temporary workaround',
              'Route traffic to backup',
              'Restore from backup if needed'
            ]
          },
          {
            step: 5,
            title: 'Communicate',
            actions: [
              'Update status page',
              'Notify customers',
              'Provide ETA for resolution'
            ]
          }
        ],
        escalationContacts: ['On-Call Engineer', 'Tech Lead', 'VP Engineering']
      },
      data_breach: {
        id: 'data_breach',
        title: 'Data Breach - Incident Runbook',
        severity: 'critical',
        description: 'Potential unauthorized data access',
        steps: [
          {
            step: 1,
            title: 'Isolate',
            actions: [
              'Take affected systems offline',
              'Preserve evidence',
              'Disable compromised accounts'
            ]
          },
          {
            step: 2,
            title: 'Investigate',
            actions: [
              'Review access logs',
              'Identify affected data',
              'Determine breach scope'
            ]
          },
          {
            step: 3,
            title: 'Notify',
            actions: [
              'Notify legal team',
              'Notify affected users',
              'Prepare breach disclosure'
            ]
          },
          {
            step: 4,
            title: 'Remediate',
            actions: [
              'Reset passwords',
              'Update security',
              'Patch vulnerabilities'
            ]
          }
        ],
        escalationContacts: ['Security Lead', 'Legal', 'CEO']
      },
      tenant_complaint: {
        id: 'tenant_complaint',
        title: 'Serious Tenant Complaint - Incident Runbook',
        severity: 'high',
        description: 'Significant tenant complaint or escalation',
        steps: [
          {
            step: 1,
            title: 'Acknowledge',
            actions: [
              'Respond within 1 hour',
              'Log complaint in system',
              'Assign case number'
            ]
          },
          {
            step: 2,
            title: 'Investigate',
            actions: [
              'Review lease terms',
              'Check maintenance history',
              'Speak with all parties'
            ]
          },
          {
            step: 3,
            title: 'Resolve',
            actions: [
              'Propose solution',
              'Get approval from management',
              'Implement remedy'
            ]
          },
          {
            step: 4,
            title: 'Follow-up',
            actions: [
              'Confirm satisfaction',
              'Document resolution',
              'Schedule follow-up'
            ]
          }
        ],
        escalationContacts: ['Agency Manager', 'Legal']
      },
      payment_failure: {
        id: 'payment_failure',
        title: 'Payment Processing Failure - Incident Runbook',
        severity: 'high',
        description: 'Payment gateway or processing failure',
        steps: [
          {
            step: 1,
            title: 'Assess',
            actions: [
              'Check payment gateway status',
              'Review error logs',
              'Test payment processing'
            ]
          },
          {
            step: 2,
            title: 'Communicate',
            actions: [
              'Notify affected users',
              'Explain status',
              'Provide ETA'
            ]
          },
          {
            step: 3,
            title: 'Contact vendor',
            actions: [
              'Alert payment processor',
              'Request incident status',
              'Coordinate resolution'
            ]
          },
          {
            step: 4,
            title: 'Reconcile',
            actions: [
              'Verify all transactions',
              'Retry failed payments',
              'Confirm completeness'
            ]
          }
        ],
        escalationContacts: ['Finance Lead', 'Payment Processor Support']
      }
    };
  }

  /**
   * Get user profile with gamification stats
   */
  async getUserGamificationProfile(pool, userId) {
    try {
      const result = await pool.query(
        `SELECT 
          u.id,
          u.name,
          u.total_points,
          COUNT(DISTINCT ub.badge_id) as badge_count,
          COUNT(DISTINCT tp.module_id) as modules_completed
         FROM users u
         LEFT JOIN user_badges ub ON u.id = ub.user_id
         LEFT JOIN training_progress tp ON u.id = tp.user_id
         WHERE u.id = $1
         GROUP BY u.id, u.name, u.total_points`,
        [userId]
      );

      if (result.rows.length === 0) {
        return { error: 'User not found' };
      }

      const user = result.rows[0];

      return {
        success: true,
        profile: {
          userId: user.id,
          name: user.name,
          totalPoints: user.total_points || 0,
          badgeCount: user.badge_count,
          modulesCompleted: user.modules_completed,
          level: this.calculateLevel(user.total_points || 0)
        }
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Calculate user level based on points
   */
  calculateLevel(points) {
    if (points < 100) return { level: 1, name: 'Novice', nextThreshold: 100 };
    if (points < 500) return { level: 2, name: 'Intermediate', nextThreshold: 500 };
    if (points < 1000) return { level: 3, name: 'Advanced', nextThreshold: 1000 };
    if (points < 2000) return { level: 4, name: 'Expert', nextThreshold: 2000 };
    return { level: 5, name: 'Master', nextThreshold: null };
  }
}

module.exports = new GamificationTrainingService();

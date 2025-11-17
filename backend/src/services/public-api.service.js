/**
 * 🔌 AKIG Public API & Integration Module
 * Third-party integrations and webhook system
 * 
 * Features:
 * - REST & GraphQL APIs
 * - Webhook management
 * - OAuth2 for partners
 * - Rate limiting & API keys
 * - Integration marketplace
 * - Audit logging for APIs
 */

const pool = require('../db');
const logger = require('./logger');
const crypto = require('crypto');

class PublicAPIService {
  /**
   * Generate API key for partner
   * @param {string} partnerId
   * @param {string} name
   */
  async generateAPIKey(partnerId, name) {
    try {
      const apiKey = crypto.randomBytes(32).toString('hex');
      const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

      await pool.query(
        `INSERT INTO api_keys (partner_id, name, key_hash, created_at, last_used_at)
         VALUES ($1, $2, $3, NOW(), NULL)`,
        [partnerId, name, hashedKey]
      );

      logger.info(`API key generated for partner ${partnerId}`);

      return {
        apiKey,
        note: '⚠️ Save this key in a secure location. It will not be shown again.',
        expiresAt: '1 year from now'
      };
    } catch (err) {
      logger.error('Error generating API key', err);
      throw err;
    }
  }

  /**
   * Get OAuth2 configuration
   */
  getOAuth2Config() {
    return {
      provider: 'AKIG',
      version: '2.0',
      endpoints: {
        authorize: '/api/oauth/authorize',
        token: '/api/oauth/token',
        revoke: '/api/oauth/revoke',
        userInfo: '/api/oauth/userinfo'
      },
      grantTypes: ['authorization_code', 'client_credentials', 'refresh_token'],
      scopes: [
        'profile (read user profile)',
        'properties (read/write properties)',
        'tenants (read/write tenants)',
        'payments (read/write payments)',
        'leases (read/write leases)',
        'reports (read reports)',
        'admin (full access)'
      ],
      flows: {
        'AUTHORIZATION_CODE': {
          description: 'For apps with a backend server',
          steps: [
            '1. Redirect user to /api/oauth/authorize',
            '2. User grants permission',
            '3. Receive authorization code',
            '4. Exchange code for access token (server-side)',
            '5. Use access token to call API'
          ]
        },
        'CLIENT_CREDENTIALS': {
          description: 'For server-to-server communication',
          steps: [
            '1. Send client_id + client_secret',
            '2. Receive access token',
            '3. Use token for API calls'
          ]
        }
      }
    };
  }

  /**
   * Get REST API specification
   */
  getRESTAPISpec() {
    return {
      baseUrl: 'https://api.akig.local/v1',
      version: '1.0.0',
      authentication: 'Bearer {access_token}',
      endpoints: [
        {
          method: 'GET',
          path: '/properties',
          description: 'List all properties',
          query: { limit: 100, offset: 0, filter: 'optional' },
          response: {
            properties: [
              { id: 'uuid', address: 'string', city: 'string', country: 'string' }
            ]
          }
        },
        {
          method: 'GET',
          path: '/properties/{id}',
          description: 'Get single property',
          response: { id: 'uuid', address: 'string', area_sqm: 'number' }
        },
        {
          method: 'POST',
          path: '/properties',
          description: 'Create property',
          body: { address: 'string', city: 'string', country: 'string' },
          response: { id: 'uuid' }
        },
        {
          method: 'GET',
          path: '/tenants',
          description: 'List tenants',
          query: { property_id: 'optional', limit: 100 }
        },
        {
          method: 'POST',
          path: '/payments',
          description: 'Record payment',
          body: { lease_id: 'uuid', amount: 'number', method: 'string' }
        },
        {
          method: 'GET',
          path: '/statistics',
          description: 'Get agency statistics',
          response: { occupancy_rate: 'number', avg_rent: 'number' }
        }
      ],
      errorCodes: {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        429: 'Rate Limited',
        500: 'Server Error'
      }
    };
  }

  /**
   * Get GraphQL API specification
   */
  getGraphQLSpec() {
    return {
      endpoint: 'https://api.akig.local/graphql',
      version: '1.0.0',
      authentication: 'Bearer {access_token}',
      schema: {
        Query: {
          property: '(id: ID!): Property',
          properties: '(filter: PropertyFilter, limit: Int): [Property]',
          tenant: '(id: ID!): Tenant',
          tenants: '(filter: TenantFilter, limit: Int): [Tenant]',
          statistics: ': Statistics'
        },
        Mutation: {
          createProperty: '(input: CreatePropertyInput!): Property',
          updateProperty: '(id: ID!, input: UpdatePropertyInput!): Property',
          createTenant: '(input: CreateTenantInput!): Tenant',
          recordPayment: '(input: PaymentInput!): Payment'
        }
      },
      introspection: true,
      playgroundEnabled: true
    };
  }

  /**
   * Manage webhooks
   * @param {string} action - 'create' | 'list' | 'delete'
   */
  async manageWebhooks(action, data = {}) {
    try {
      switch (action) {
        case 'create':
          return await this.createWebhook(data);
        case 'list':
          return await this.listWebhooks(data.partnerId);
        case 'delete':
          return await this.deleteWebhook(data.webhookId);
        default:
          throw new Error('Unknown webhook action');
      }
    } catch (err) {
      logger.error('Error managing webhooks', err);
      throw err;
    }
  }

  /**
   * @private
   */
  async createWebhook(data) {
    const { partnerId, url, events, description } = data;
    const secret = crypto.randomBytes(32).toString('hex');

    await pool.query(
      `INSERT INTO webhooks (partner_id, url, events, secret, description, active, created_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW())`,
      [partnerId, url, JSON.stringify(events), secret, description]
    );

    return { secret, message: 'Webhook created successfully' };
  }

  /**
   * @private
   */
  async listWebhooks(partnerId) {
    const result = await pool.query(
      `SELECT id, url, events, active, created_at, last_triggered_at, trigger_count
       FROM webhooks WHERE partner_id = $1`,
      [partnerId]
    );

    return result.rows;
  }

  /**
   * @private
   */
  async deleteWebhook(webhookId) {
    await pool.query(`DELETE FROM webhooks WHERE id = $1`, [webhookId]);
    return { message: 'Webhook deleted' };
  }

  /**
   * Trigger webhook event
   * @param {string} event - 'payment.completed' | 'lease.created', etc
   * @param {object} payload
   */
  async triggerWebhooks(event, payload) {
    try {
      const result = await pool.query(
        `SELECT * FROM webhooks WHERE active = true AND events @> $1`,
        [JSON.stringify([event])]
      );

      const webhooks = result.rows;

      for (const webhook of webhooks) {
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(payload))
          .digest('hex');

        try {
          // Send webhook asynchronously (non-blocking)
          await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-AKIG-Signature': `sha256=${signature}`,
              'X-AKIG-Event': event
            },
            body: JSON.stringify(payload),
            timeout: 30000
          });

          // Update trigger count
          await pool.query(
            `UPDATE webhooks SET last_triggered_at = NOW(), 
             trigger_count = trigger_count + 1 WHERE id = $1`,
            [webhook.id]
          );
        } catch (err) {
          logger.warn(`Webhook delivery failed for ${webhook.url}`, err.message);
        }
      }

      logger.info(`Webhooks triggered for event: ${event}`);
    } catch (err) {
      logger.error('Error triggering webhooks', err);
    }
  }

  /**
   * Get rate limiting configuration
   */
  getRateLimitConfig() {
    return {
      'free': {
        requestsPerHour: 100,
        requestsPerDay: 1000,
        concurrentRequests: 2,
        cost: '$0/month'
      },
      'starter': {
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        concurrentRequests: 5,
        cost: '$29/month'
      },
      'pro': {
        requestsPerHour: 10000,
        requestsPerDay: 100000,
        concurrentRequests: 20,
        cost: '$99/month'
      },
      'enterprise': {
        requestsPerHour: 'Unlimited',
        requestsPerDay: 'Unlimited',
        concurrentRequests: 'Unlimited',
        cost: 'Custom pricing'
      }
    };
  }

  /**
   * Check rate limit for API key
   * @param {string} apiKey
   */
  async checkRateLimit(apiKey) {
    try {
      const result = await pool.query(
        `SELECT plan, request_count, reset_at FROM api_keys WHERE key_hash = $1`,
        [crypto.createHash('sha256').update(apiKey).digest('hex')]
      );

      if (result.rows.length === 0) {
        return { valid: false, reason: 'Invalid API key' };
      }

      const apiKeyData = result.rows[0];
      const plan = this.getRateLimitConfig()[apiKeyData.plan || 'free'];
      const now = new Date();
      const resetTime = new Date(apiKeyData.reset_at);

      if (now > resetTime) {
        // Reset counter
        await pool.query(
          `UPDATE api_keys SET request_count = 1, reset_at = $1 WHERE key_hash = $2`,
          [new Date(now.getTime() + 3600000), crypto.createHash('sha256').update(apiKey).digest('hex')]
        );
        return { valid: true, remaining: plan.requestsPerHour - 1 };
      }

      const remaining = Math.max(0, plan.requestsPerHour - apiKeyData.request_count);
      
      if (remaining <= 0) {
        return { 
          valid: false, 
          reason: 'Rate limit exceeded',
          resetAt: resetTime
        };
      }

      // Increment counter
      await pool.query(
        `UPDATE api_keys SET request_count = request_count + 1 WHERE key_hash = $1`,
        [crypto.createHash('sha256').update(apiKey).digest('hex')]
      );

      return { valid: true, remaining };
    } catch (err) {
      logger.error('Error checking rate limit', err);
      return { valid: false, reason: 'Internal error' };
    }
  }

  /**
   * Get integration marketplace
   */
  getIntegrationMarketplace() {
    return [
      {
        id: 'stripe-payments',
        name: '💳 Stripe Payments',
        category: 'Payment Processing',
        description: 'Secure payment processing for rent collection',
        rating: 4.8,
        reviews: 245,
        status: 'verified',
        documentation: '/docs/stripe'
      },
      {
        id: 'slack-notifications',
        name: '💬 Slack Integration',
        category: 'Notifications',
        description: 'Real-time alerts to Slack channels',
        rating: 4.6,
        reviews: 180,
        status: 'verified'
      },
      {
        id: 'accounting-sync',
        name: '📊 QuickBooks Sync',
        category: 'Accounting',
        description: 'Auto-sync transactions to QuickBooks',
        rating: 4.7,
        reviews: 120,
        status: 'verified'
      },
      {
        id: 'crm-integration',
        name: '👥 HubSpot CRM',
        category: 'CRM',
        description: 'Manage tenant relationships',
        rating: 4.5,
        reviews: 95,
        status: 'verified'
      },
      {
        id: 'document-signing',
        name: '✍️ DocuSign',
        category: 'E-Signature',
        description: 'Electronically sign leases and agreements',
        rating: 4.9,
        reviews: 310,
        status: 'verified'
      }
    ];
  }

  /**
   * Log API usage for audit
   * @param {string} apiKey
   * @param {string} endpoint
   * @param {string} method
   * @param {number} statusCode
   */
  async logAPIUsage(apiKey, endpoint, method, statusCode) {
    try {
      await pool.query(
        `INSERT INTO api_audit_log (api_key_hash, endpoint, method, status_code, timestamp)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          crypto.createHash('sha256').update(apiKey).digest('hex'),
          endpoint,
          method,
          statusCode
        ]
      );
    } catch (err) {
      logger.error('Error logging API usage', err);
    }
  }

  /**
   * Generate API documentation
   */
  generateAPIDocumentation() {
    return {
      title: 'AKIG Public API Documentation',
      version: '1.0.0',
      baseUrl: 'https://api.akig.local',
      getStarted: {
        step1: 'Register for API access at https://akig.local/developer',
        step2: 'Generate API key from dashboard',
        step3: 'Start making requests with Bearer token',
        step4: 'Check API usage in dashboard'
      },
      authentication: 'Bearer token in Authorization header',
      rateLimit: 'See rate limiting configuration',
      errorHandling: 'All errors return JSON with code + message',
      webhooks: 'Real-time event notifications',
      sdks: [
        'JavaScript: npm install @akig/sdk',
        'Python: pip install akig',
        'Ruby: gem install akig',
        'Go: go get github.com/akig/sdk-go'
      ]
    };
  }
}

module.exports = new PublicAPIService();

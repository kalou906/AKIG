/**
 * OpenAPI/Swagger Documentation
 * backend/src/docs/openapi.js
 * 
 * Documentation automatique de l'API AKIG
 */

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AKIG - Property Management API',
      version: '1.0.0',
      description: 'API complète pour la gestion immobilière avec support complet du RGPD',
      contact: {
        name: 'AKIG Support',
        email: 'support@akig.app',
        url: 'https://akig.app',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:4002',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token for authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin', 'super_admin'] },
            agency_id: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Document: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            path: { type: 'string' },
            version: { type: 'integer' },
            file_type: { type: 'string' },
            file_size: { type: 'integer' },
            status: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Feedback: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            score: { type: 'integer', minimum: 1, maximum: 10 },
            comment: { type: 'string' },
            sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
            category: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            actor_id: { type: 'integer' },
            action: { type: 'string' },
            entity: { type: 'string' },
            entity_id: { type: 'integer' },
            ts: { type: 'string', format: 'date-time' },
            signature: { type: 'string' },
          },
        },
        Module: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string' },
            name: { type: 'string' },
            enabled: { type: 'boolean' },
            agency_id: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            message: { type: 'string' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Feedback',
        description: 'Feedback management with sentiment analysis',
      },
      {
        name: 'Modules',
        description: 'Feature module management',
      },
      {
        name: 'Owner Portal',
        description: 'Owner dashboard and analytics',
      },
      {
        name: 'Audit',
        description: 'Audit logging and compliance',
      },
      {
        name: 'GED',
        description: 'Document management system',
      },
      {
        name: 'Archive',
        description: 'PDF/A archival and timestamping',
      },
      {
        name: 'Privacy',
        description: 'GDPR compliance endpoints',
      },
    ],
  },
  apis: [
    './src/routes/auth.js',
    './src/routes/feedback.js',
    './src/routes/modules.js',
    './src/routes/ownerPortal.js',
    './src/routes/audit.js',
    './src/routes/ged.js',
    './src/routes/archive.js',
    './src/routes/privacy.js',
    './src/routes/test.js',
  ],
};

const specs = swaggerJsDoc(options);

/**
 * Configure Swagger UI pour Express
 */
function setupSwagger(app) {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: true,
        filter: true,
        showExtensions: true,
      },
      customCss: `
        .swagger-ui .topbar {
          background-color: #0b5;
        }
        .swagger-ui .info {
          margin: 20px 0;
        }
        .swagger-ui .scheme-container {
          background-color: #f5f5f5;
          border-radius: 4px;
          padding: 10px;
        }
        .swagger-ui .btn {
          background-color: #0b5;
          border-color: #0b5;
        }
        .swagger-ui .btn:hover {
          background-color: #09a;
        }
      `,
      customSiteTitle: 'AKIG API Documentation',
    })
  );

  // Endpoint pour obtenir le spec JSON
  app.get('/api/docs/spec', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('✅ Swagger UI available at /api/docs');
}

module.exports = {
  setupSwagger,
  specs,
};

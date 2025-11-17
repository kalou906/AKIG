const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'AKIG API',
      version: '1.0.0',
      description: 'Documentation de l’API AKIG',
    },
    servers: [
      { url: process.env.API_BASE_URL || 'http://localhost:4000/api' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['src/routes/**/*.js'],
};

const specs = swaggerJsdoc(options);

router.use('/', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

module.exports = router;

// Normalized Application Entry (v1 API Contract)
// Single responsibility: configure core middleware and mount aggregated /api routes.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Middleware
const { userLimiter } = require('./middleware/rateLimitByUser');
const { metricsMiddleware, metricsEndpoint } = require('./middleware/metrics');

// Ensure mandatory environment variables
['JWT_SECRET'].forEach(k => {
  if (!process.env[k]) {
    console.warn(`Warning: Missing environment variable: ${k}`);
  }
});

const app = express();

// Trust proxy (for rate limiting / forward headers if behind ingress)
app.set('trust proxy', 1);

// Basic security + body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// CORS: locked to explicit origin or fallback localhost
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Access log
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Metrics tracking
app.use(metricsMiddleware);

// Expose Prometheus metrics endpoint
app.get('/metrics', metricsEndpoint);

// User-based rate limiting
app.use('/api', userLimiter);

// Mount Swagger docs
try {
  const swaggerRouter = require('./routes/swagger');
  app.use('/api-docs', swaggerRouter);
} catch (_) {}

// Mount aggregated API router
const apiRouter = require('./routes');
app.use('/api', apiRouter);

// 404 handler (after routes)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

module.exports = app;

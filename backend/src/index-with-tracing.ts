/**
 * Application Startup with OpenTelemetry Tracing
 * This should be imported at the VERY START of your application
 * Place this import BEFORE any other imports
 * 
 * Usage: Replace the import in index.js with this file, or add to the top of index.js:
 *   require('./instrumentation/tracing').startTracing();
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

// Routes
const authRoutes = require('./routes/auth');
const contractsRoutes = require('./routes/contracts');
const paymentsRoutes = require('./routes/payments');
const devPortalRoutes = require('./routes/devPortal');
const twoFaRoutes = require('./routes/2fa');
const opsDashboardRoutes = require('./routes/opsDashboard');

// Middleware
const { requireAuth } = require('./middleware/auth');
const { sanitizeBody } = require('./middleware/security');
const { loggerMiddleware } = require('./services/logger');

// Tracing
const { startTracing, tracingMiddleware } = require('./instrumentation/tracing');

const app = express();
const PORT = process.env.PORT || 4000;

/**
 * Initialize Application with Tracing
 */
async function initializeApp() {
  try {
    // Start OpenTelemetry tracing
    await startTracing();

    // ==========================================================================
    // Middleware Configuration
    // ==========================================================================

    // Security headers
    app.use(helmet());

    // CORS
    app.use(
      cors({
        origin: process.env.CORS_ORIGINS?.split(',') || 'http://localhost:3000',
        credentials: true,
      })
    );

    // Request logging (Morgan)
    app.use(
      morgan('combined', {
        skip: (req: any, res: any) => req.path === '/health',
      })
    );

    // Tracing middleware - must come early to capture all requests
    app.use(tracingMiddleware);

    // Body parsing
    app.use(express.json({ limit: '5mb' }));
    app.use(express.urlencoded({ limit: '5mb', extended: true }));

    // Logger middleware
    app.use(loggerMiddleware);

    // ==========================================================================
    // Health Check Endpoints
    // ==========================================================================

    app.get('/health/live', (req: any, res: any) => {
      res.json({ status: 'alive' });
    });

    app.get('/health/ready', async (req: any, res: any) => {
      // Check database connectivity
      try {
        const pool = app.get('db');
        if (pool) {
          await pool.query('SELECT 1');
        }
        res.json({ status: 'ready', database: 'connected' });
      } catch (error) {
        res.status(503).json({ status: 'not_ready', error: 'Database unavailable' });
      }
    });

    // ==========================================================================
    // Metrics Endpoint (Prometheus)
    // ==========================================================================

    app.get('/metrics', (req: any, res: any) => {
      res.set('Content-Type', 'text/plain; version=0.0.4');
      // Implement Prometheus metrics collection here
      res.send('# HELP akig_backend_requests_total Total HTTP requests\n');
    });

    // ==========================================================================
    // API Routes
    // ==========================================================================

    // Authentication
    app.use('/api/auth', authRoutes);

    // 2FA
    app.use('/api', twoFaRoutes);

    // Developer Portal (requires authentication)
    app.use('/api/dev', requireAuth, devPortalRoutes);

    // Contracts (requires authentication)
    app.use('/api/contracts', requireAuth, contractsRoutes);

    // Payments (requires authentication)
    app.use('/api/payments', requireAuth, paymentsRoutes);

    // Operations Dashboard (requires admin)
    app.use('/api/ops', requireAuth, opsDashboardRoutes);

    // ==========================================================================
    // OpenAPI Documentation
    // ==========================================================================

    app.get('/api/docs/openapi.json', (req: any, res: any) => {
      try {
        const spec = require('./docs/openapi-spec');
        res.json(spec);
      } catch (error) {
        res.status(500).json({ error: 'OpenAPI spec not available' });
      }
    });

    // ==========================================================================
    // 404 Handler
    // ==========================================================================

    app.use((req: any, res: any) => {
      res.status(404).json({
        error: 'Not Found',
        path: req.path,
        method: req.method,
      });
    });

    // ==========================================================================
    // Error Handler (basic)
    // ==========================================================================

    app.use((err: any, req: any, res: any, next: any) => {
      console.error('[Error Handler]', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
      });
    });

    // ==========================================================================
    // Start Server
    // ==========================================================================

    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                  AKIG BACKEND STARTED                      ║
╚════════════════════════════════════════════════════════════╝

🚀 Server running on http://localhost:${PORT}
📊 Metrics available at http://localhost:${PORT}/metrics
📖 OpenAPI docs at http://localhost:${PORT}/api/docs/openapi.json
🏥 Health check at http://localhost:${PORT}/health/ready

Environment:
  NODE_ENV: ${process.env.NODE_ENV}
  DATABASE_URL: ${process.env.DATABASE_URL ? '✓ Configured' : '✗ Not configured'}
  JWT_SECRET: ${process.env.JWT_SECRET ? '✓ Configured' : '✗ Not configured'}
  OTEL_ENABLED: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? '✓ ' + process.env.OTEL_EXPORTER_OTLP_ENDPOINT : '✗ Disabled'}

Trace Context:
  Service: akig-backend
  Version: ${process.env.SERVICE_VERSION || '1.0.0'}
  Namespace: ${process.env.K8S_NAMESPACE || 'default'}
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[Shutdown] Received SIGTERM, gracefully shutting down...');
      server.close(() => {
        console.log('[Shutdown] HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('[Shutdown] Forced shutdown after 30s timeout');
        process.exit(1);
      }, 30000);
    });

    process.on('SIGINT', async () => {
      console.log('[Shutdown] Received SIGINT, gracefully shutting down...');
      server.close(() => {
        console.log('[Shutdown] HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start the application
initializeApp();

export default app;

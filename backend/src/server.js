/**
 * Server Entry Point with OpenTelemetry APM
 * 
 * IMPORTANT: This file MUST be the first require in your application
 * Node.js loads this before any other modules
 * 
 * Usage: node backend/src/server.js
 */

// =============================================================================
// CRITICAL: Initialize OpenTelemetry BEFORE any other modules
// =============================================================================
require('./instrumentation/otel');

// =============================================================================
// Core Dependencies
// =============================================================================
const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');

// =============================================================================
// Express Application
// =============================================================================
const app = require('./app');

// =============================================================================
// Configuration
// =============================================================================
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';
const SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';

// =============================================================================
// Server Setup
// =============================================================================
const server = http.createServer(app);

// Keep-alive socket configuration
server.keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT || '65000');
server.headersTimeout = parseInt(process.env.HEADERS_TIMEOUT || '66000');

// =============================================================================
// Startup Sequence
// =============================================================================
async function startServer() {
  try {
    // Log startup information
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                    🚀 AKIG BACKEND STARTING                       ║
╚════════════════════════════════════════════════════════════════════╝

📋 Configuration:
   Environment:        ${NODE_ENV}
   Service Version:    ${SERVICE_VERSION}
   Node Version:       ${process.version}
   Platform:           ${os.platform()} ${os.arch()}
   CPUs:               ${os.cpus().length}
   Memory:             ${Math.round(os.totalmem() / 1024 / 1024)}MB
   Uptime:             ${process.uptime().toFixed(2)}s

🔗 Connection Details:
   Host:               ${HOST}
   Port:               ${PORT}
   URL:                http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}

📦 Environment Variables:
   DATABASE_URL:       ${process.env.DATABASE_URL ? '✓ Configured' : '✗ NOT SET - Database connections will fail'}
   JWT_SECRET:         ${process.env.JWT_SECRET ? '✓ Configured' : '✗ NOT SET - Authentication will fail'}
   REDIS_URL:          ${process.env.REDIS_URL ? '✓ Configured' : '⊘ Optional (caching disabled)'}
   OTEL_ENABLED:       ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? '✓ ' + process.env.OTEL_EXPORTER_OTLP_ENDPOINT : '⊘ Disabled (local development)'}

📊 Endpoints:
   Health (Live):      GET  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/health/live
   Health (Ready):     GET  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/health/ready
   Metrics:            GET  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/metrics
   OpenAPI Spec:       GET  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/docs/openapi.json

🔐 API Routes:
   Authentication:     POST /api/auth/register
                       POST /api/auth/login
                       POST /api/auth/logout
   2FA:                POST /api/2fa/setup
                       POST /api/2fa/verify-setup
                       POST /api/2fa/disable
                       POST /api/2fa/verify-login
   Developer Portal:   GET  /api/dev/tokens
                       POST /api/dev/tokens
   Contracts:          GET  /api/contracts
                       POST /api/contracts
   Payments:           GET  /api/payments
                       POST /api/payments

⏳ Startup Sequence:
    `);

    // Initialize database connection pool
    console.log('   [1/5] Initializing database connection pool...');
    const pool = require('./db');
    const dbCheck = await pool.query('SELECT version()');
    console.log(`         ✓ Connected to PostgreSQL`);

    // Initialize Redis (if configured)
    if (process.env.REDIS_URL) {
      console.log('   [2/5] Initializing Redis cache...');
      try {
        const redis = require('./cache/redis');
        await redis.ping();
        console.log('         ✓ Connected to Redis');
      } catch (error) {
        console.warn('         ⚠ Redis connection failed (caching disabled):', error.message);
      }
    } else {
      console.log('   [2/5] Redis cache disabled (REDIS_URL not set)');
    }

    // Initialize logger
    console.log('   [3/5] Initializing logging service...');
    const { logger } = require('./services/logger');
    console.log('         ✓ Logger initialized');

    // Start HTTP server
    console.log('   [4/5] Starting HTTP server...');
    await new Promise((resolve, reject) => {
      server.listen(PORT, HOST, () => {
        console.log(`         ✓ Server listening on ${HOST}:${PORT}`);
        resolve();
      });

      server.on('error', reject);
    });

    // Initialize monitoring
    console.log('   [5/5] Initializing monitoring...');
    setupMonitoring();
    console.log('         ✓ Monitoring active');

    // Log successful startup
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║              ✅ SERVER STARTED SUCCESSFULLY                        ║
╚════════════════════════════════════════════════════════════════════╝

🎯 Ready to accept requests!
📚 API Documentation: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/docs/openapi.json
🏥 Health Status:     http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/health/ready

    `);

    // Log to logger service
    logger.info('Server started successfully', {
      version: SERVICE_VERSION,
      environment: NODE_ENV,
      port: PORT,
      host: HOST,
    });
  } catch (error) {
    console.error(`
╔════════════════════════════════════════════════════════════════════╗
║            ❌ FAILED TO START SERVER                              ║
╚════════════════════════════════════════════════════════════════════╝

Error: ${error.message}
Stack:
${error.stack}

Please check:
  1. DATABASE_URL is set and PostgreSQL is running
  2. JWT_SECRET is configured
  3. Port ${PORT} is not in use
  4. All environment variables are correct
    `);

    process.exit(1);
  }
}

// =============================================================================
// Monitoring & Metrics
// =============================================================================
function setupMonitoring() {
  // Memory usage tracking
  const memoryMetrics = {
    interval: parseInt(process.env.MEMORY_REPORT_INTERVAL || '60000'), // 60s
    threshold: parseFloat(process.env.MEMORY_WARNING_THRESHOLD || '0.8'), // 80%
  };

  if (memoryMetrics.interval > 0) {
    setInterval(() => {
      const usage = process.memoryUsage();
      const heapUsagePercent = usage.heapUsed / usage.heapTotal;

      if (heapUsagePercent > memoryMetrics.threshold) {
        console.warn(
          `⚠️  High memory usage: ${(heapUsagePercent * 100).toFixed(1)}% ` +
          `(${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB)`
        );
      }

      // Optional: Send metrics to monitoring system
      if (process.env.METRICS_ENABLED === 'true') {
        // Could send to Prometheus, DataDog, etc.
      }
    }, memoryMetrics.interval);
  }
}

// =============================================================================
// Graceful Shutdown
// =============================================================================
function setupGracefulShutdown() {
  const shutdownTimeout = parseInt(process.env.SHUTDOWN_TIMEOUT || '30000'); // 30s

  const gracefulShutdown = async (signal) => {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║          ⏹️  Received ${signal}, gracefully shutting down...       ║
╚════════════════════════════════════════════════════════════════════╝

Shutdown sequence:
  1. Stopping new requests...
  2. Waiting for in-flight requests...
  3. Closing database connections...
  4. Flushing logs...
  5. Exiting...
    `);

    let shutdownComplete = false;

    const shutdownTimer = setTimeout(() => {
      if (!shutdownComplete) {
        console.error('⚠️  Graceful shutdown timeout, forcing exit...');
        process.exit(1);
      }
    }, shutdownTimeout);

    try {
      // Stop accepting new connections
      server.close(async () => {
        console.log('✓ HTTP server closed');

        // Close database connections
        try {
          const pool = require('./db');
          await pool.end();
          console.log('✓ Database connections closed');
        } catch (error) {
          console.error('✗ Error closing database:', error.message);
        }

        // Close Redis connections
        try {
          if (process.env.REDIS_URL) {
            const redis = require('./cache/redis');
            await redis.disconnect();
            console.log('✓ Redis connections closed');
          }
        } catch (error) {
          console.error('✗ Error closing Redis:', error.message);
        }

        // Flush logs
        try {
          const { logger } = require('./services/logger');
          await logger.flush?.();
          console.log('✓ Logs flushed');
        } catch (error) {
          console.error('✗ Error flushing logs:', error.message);
        }

        shutdownComplete = true;
        clearTimeout(shutdownTimer);

        console.log(`
╔════════════════════════════════════════════════════════════════════╗
║            ✅ GRACEFUL SHUTDOWN COMPLETE                          ║
╚════════════════════════════════════════════════════════════════════╝

Goodbye! 👋
        `);

        process.exit(0);
      });

      // Force shutdown if still not complete after timeout
      server.closeAllConnections?.();
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// =============================================================================
// Start Application
// =============================================================================
if (require.main === module) {
  setupGracefulShutdown();
  startServer();
}

module.exports = server;

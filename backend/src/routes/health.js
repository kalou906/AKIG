/**
 * Health Check Endpoints - PRODUCTION READY (simplified, robust)
 * Provides: / (main), /status (quick), /config (non-prod only)
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const { healthCheck, getPoolStats } = require('../db-utils');

// Main health endpoint: lightweight but includes DB probe
router.get('/', async (req, res) => {
  const started = Date.now();

  const db = await healthCheck();
  const pool = getPoolStats();

  const payload = {
    status: db.healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    responseTimeMs: Date.now() - started,
    environment: process.env.NODE_ENV || 'development',
    version: (() => {
      try { return require('../../package.json').version; } catch { return '0.0.0'; }
    })(),
    db: {
      healthy: db.healthy,
      error: db.error || null,
      pool,
    },
    host: {
      hostname: os.hostname(),
      platform: process.platform,
      node: process.version,
    },
  };

  res.status(db.healthy ? 200 : 503).json(payload);
});

// Quick status (no DB)
router.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    memory: {
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    cpuLoad: os.loadavg ? os.loadavg() : [],
  });
});

// Config (hidden in production)
router.get('/config', (req, res) => {
  if ((process.env.NODE_ENV || 'development') === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  res.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT || '4000',
      DEBUG: process.env.DEBUG || 'false',
    },
    database: {
      configured: !!process.env.DATABASE_URL,
      pool: getPoolStats(),
    },
    process: {
      pid: process.pid,
      cwd: process.cwd(),
      execPath: process.execPath,
    },
  });
});

module.exports = router;

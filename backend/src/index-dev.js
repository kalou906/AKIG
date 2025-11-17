#!/usr/bin/env node

/**
 * 🚀 AKIG Backend - Lightweight Server for Development
 * Supports both PostgreSQL and in-memory mode
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.development' });

const { getEnvironmentConfig, getRequestId } = require('./config/environment');
const { MODULE_REGISTRY, serializeModules, getActiveModules } = require('./config/moduleRegistry');

const environment = getEnvironmentConfig();

// ============================================================
// Initialize Express App
// ============================================================

const app = express();
const PORT = environment.port;

// Middleware
app.use((req, res, next) => {
  const requestId = getRequestId(req);
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  req.headers['x-request-id'] = requestId;
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({ origin: environment.corsOrigin }));
app.use(morgan(':remote-addr :method :url :status :res[content-length] - :response-time ms :req[x-request-id]', {
  stream: {
    write: (message) => {
      process.stdout.write(`[HTTP] ${message}`);
    },
  },
}));

// ============================================================
// In-Memory Data Store (for development without DB)
// ============================================================

const inMemoryStore = {
  users: [],
  contracts: [],
  payments: [],
  tenants: [],
  roles: [
    { id: '1', name: 'admin', description: 'Administrator' },
    { id: '2', name: 'user', description: 'Regular User' },
    { id: '3', name: 'manager', description: 'Manager' }
  ]
};

// ============================================================
// Health Check Endpoints
// ============================================================

app.get('/api/health', (req, res) => {
  const modules = serializeModules(environment.featureFlags);
  const enabledModules = modules.filter((module) => module.enabled).length;

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: environment.appEnv,
    requestId: req.requestId,
    services: {
      database: 'in-memory',
      redis: 'disabled',
      smtp: 'not_configured'
    },
    featureFlags: environment.rawFeatureFlags,
    modules: {
      total: MODULE_REGISTRY.length,
      enabled: enabledModules,
    }
  });
});

app.get('/api/health/full', (req, res) => {
  const modules = serializeModules(environment.featureFlags);
  const enabledModules = modules.filter((module) => module.enabled).length;

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: environment.appEnv,
    node_version: process.version,
    memory_usage: process.memoryUsage(),
    services: {
      database: 'in-memory',
      redis: 'disabled',
      smtp: 'not_configured'
    },
    featureFlags: environment.rawFeatureFlags,
    endpoints: {
      auth: { method: 'POST', path: '/api/auth/register' },
      contracts: { method: 'GET', path: '/api/contracts' },
      payments: { method: 'GET', path: '/api/payments' },
      tenants: { method: 'GET', path: '/api/tenants' },
      health: { method: 'GET', path: '/api/health' }
    },
    modules: {
      total: MODULE_REGISTRY.length,
      enabled: enabledModules,
      registry: modules,
    }
  });
});

app.get('/api/health/ready', (req, res) => {
  res.status(200).json({ ready: true, timestamp: new Date().toISOString(), requestId: req.requestId });
});

app.get('/api/health/alive', (req, res) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString(), requestId: req.requestId });
});

function buildModulePayload() {
  const modules = getActiveModules(environment.featureFlags);
  const registry = serializeModules(environment.featureFlags);
  const moduleIds = modules.map((module) => module.id);

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: environment.appEnv,
    requestId: null,
    featureFlags: environment.rawFeatureFlags,
    modules,
    registry,
  };
}

app.get('/api/modules', (req, res) => {
  const modules = getActiveModules(environment.featureFlags);
  const moduleIds = modules.map((module) => module.id);
  console.log('[Modules] Active modules:', moduleIds.length > 0 ? moduleIds.join(', ') : 'none');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: environment.appEnv,
    requestId: req.requestId,
    featureFlags: environment.rawFeatureFlags,
    modules,
  });
});

app.get('/api/diagnostics/modules', (req, res) => {
  const payload = buildModulePayload();
  payload.requestId = req.requestId;
  res.status(200).json(payload);
});

// ============================================================
// Authentication Routes
// ============================================================

app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newUser = {
    id: Math.random().toString(36).substr(2, 9),
    username,
    email,
    password_hash: 'hashed_' + password,
    role: 'user',
    created_at: new Date()
  };

  inMemoryStore.users.push(newUser);

  res.status(201).json({
    message: 'User registered successfully',
    user: { id: newUser.id, username, email, role: newUser.role }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  const user = inMemoryStore.users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.status(200).json({
    message: 'Login successful',
    token: 'dev_token_' + Math.random().toString(36).substr(2, 9),
    user: { id: user.id, username: user.username, email, role: user.role }
  });
});

// ============================================================
// Contracts Routes
// ============================================================

app.get('/api/contracts', (req, res) => {
  res.status(200).json({
    success: true,
    data: inMemoryStore.contracts,
    count: inMemoryStore.contracts.length
  });
});

app.post('/api/contracts', (req, res) => {
  const { title, amount, status } = req.body;

  const contract = {
    id: Math.random().toString(36).substr(2, 9),
    title: title || 'Untitled Contract',
    amount: amount || 0,
    status: status || 'active',
    created_at: new Date()
  };

  inMemoryStore.contracts.push(contract);

  res.status(201).json({
    success: true,
    message: 'Contract created',
    data: contract
  });
});

// ============================================================
// Payments Routes
// ============================================================

app.get('/api/payments', (req, res) => {
  res.status(200).json({
    success: true,
    data: inMemoryStore.payments,
    count: inMemoryStore.payments.length
  });
});

app.post('/api/payments', (req, res) => {
  const { contract_id, amount, status } = req.body;

  const payment = {
    id: Math.random().toString(36).substr(2, 9),
    contract_id: contract_id || null,
    amount: amount || 0,
    status: status || 'pending',
    created_at: new Date()
  };

  inMemoryStore.payments.push(payment);

  res.status(201).json({
    success: true,
    message: 'Payment recorded',
    data: payment
  });
});

// ============================================================
// Tenants Routes
// ============================================================

app.get('/api/tenants', (req, res) => {
  res.status(200).json({
    success: true,
    data: inMemoryStore.tenants,
    count: inMemoryStore.tenants.length
  });
});

app.post('/api/tenants', (req, res) => {
  const { firstName, lastName, email, phone } = req.body;

  const tenant = {
    id: Math.random().toString(36).substr(2, 9),
    firstName: firstName || 'Unknown',
    lastName: lastName || 'Tenant',
    email: email || '',
    phone: phone || '',
    created_at: new Date()
  };

  inMemoryStore.tenants.push(tenant);

  res.status(201).json({
    success: true,
    message: 'Tenant added',
    data: tenant
  });
});

// ============================================================
// Users Routes
// ============================================================

app.get('/api/users', (req, res) => {
  res.status(200).json({
    success: true,
    data: inMemoryStore.users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      created_at: u.created_at
    }))
  });
});

// ============================================================
// Roles Routes
// ============================================================

app.get('/api/roles', (req, res) => {
  res.status(200).json({
    success: true,
    data: inMemoryStore.roles
  });
});

// ============================================================
// 404 Handler
// ============================================================

const SERVE_FRONTEND = process.env.SERVE_FRONTEND === 'true';
const FRONTEND_BUILD_PATH = process.env.FRONTEND_BUILD_PATH || path.resolve(__dirname, '../../frontend/build');

if (SERVE_FRONTEND && fs.existsSync(FRONTEND_BUILD_PATH)) {
  app.use(express.static(FRONTEND_BUILD_PATH));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(FRONTEND_BUILD_PATH, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// ============================================================
// Error Handler
// ============================================================

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// ============================================================
// Server Startup
// ============================================================

const server = app.listen(PORT, () => {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║                                                ║');
  console.log('║     🚀 AKIG Backend Server - RUNNING 🚀       ║');
  console.log('║                                                ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✓ Server: http://localhost:${PORT}`);
  console.log(`✓ Environment: ${environment.appEnv}`);
  console.log(`✓ Database: In-Memory (Development Mode)`);
  console.log('✓ Feature flags:', environment.rawFeatureFlags);
  console.log('');
  console.log('📍 API Endpoints:');
  console.log(`   • Health:    GET http://localhost:${PORT}/api/health`);
  console.log(`   • Contracts: GET http://localhost:${PORT}/api/contracts`);
  console.log(`   • Payments:  GET http://localhost:${PORT}/api/payments`);
  console.log(`   • Tenants:   GET http://localhost:${PORT}/api/tenants`);
  console.log(`   • Users:     GET http://localhost:${PORT}/api/users`);
  console.log(`   • Roles:     GET http://localhost:${PORT}/api/roles`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[SIGTERM] Shutting down gracefully...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n[SIGINT] Shutting down gracefully...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

module.exports = app;

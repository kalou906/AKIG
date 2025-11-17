// ============================================================
// 🚀 AKIG Backend API - Server Entry Point
// Express setup, Database connection, Service initialization
// ============================================================
// 🚀 Server Startup (disabled under test)
// ============================================================
let server = null;

if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║           🚀 AKIG Backend API Started                      ║
╚════════════════════════════════════════════════════════════╝

📊 Configuration:
    Node Env:       ${NODE_ENV}
    App Env:        ${APP_ENV}
  Port:           ${PORT}
  CORS Origin:    ${CORS_ORIGIN}
  Database:       ${DATABASE_URL ? '✓ Connected' : '✗ Not configured'}
  JWT Secret:     ${JWT_SECRET ? '✓ Configured' : '✗ Not configured'}
    Log Level:      ${LOG_LEVEL}
    Feature Flags:  ${Object.keys(RAW_FEATURE_FLAGS).filter((key) => RAW_FEATURE_FLAGS[key]).join(', ') || 'aucun'}

🛣️  API Endpoints:
  Health:         GET /api/health
  Documentation:  GET /api/docs
  Auth:           /api/auth/*
  Contracts:      /api/contracts/*
  Payments:       /api/payments/*
  Reminders:      /api/reminders/*
  Charges:        /api/charges/*
  Fiscal:         /api/fiscal/*
  SCI:            /api/sci/*
  Seasonal:       /api/seasonal/*
  Bank Sync:      /api/bank/*

📈 Services Loaded:
  ✓ ReminderService
  ✓ ChargesService
  ✓ FiscalReportService
  ✓ SCIService
  ✓ SeasonalService
  ✓ BankSyncService

🔗 URL: http://localhost:${PORT}/api
        `);
    });

    // ============================================================
    // �️  Graceful Shutdown
    // ============================================================
    process.on('SIGTERM', () => {
        console.log('\n⛔ SIGTERM received - shutting down gracefully...');
        if (!server) {
            return process.exit(0);
        }
        server.close(() => {
            console.log('✓ Server closed');
            pool.end(() => {
                console.log('✓ Database pool closed');
                process.exit(0);
            });
        });
    });
}

const governanceBlockchainRoutes = require('./routes/governance-blockchain');

// ============================================================
// 🎯 GENIUS FEATURES Routes
// ============================================================
const tenantPortalRoutes = require('./routes/tenant-portal');
const accountingGeniusRoutes = require('./routes/accounting-genius');

// ============================================================
// ⚙️  Environment Configuration
// ============================================================
const environment = getEnvironmentConfig();

const PORT = environment.port;
const NODE_ENV = environment.nodeEnv;
const DATABASE_URL = environment.databaseUrl;
const JWT_SECRET = environment.jwtSecret;
const CORS_ORIGIN = environment.corsOrigin;
const RAW_FEATURE_FLAGS = environment.rawFeatureFlags;
const APP_ENV = environment.appEnv;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// ============================================================
// 🗄️  Database Pool Setup
// ============================================================
const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('❌ Pool error:', err);
    process.exit(1);
});

// ============================================================
// 🎯 Express App Setup
// ============================================================
const app = express();

app.use((req, res, next) => {
    const requestId = getRequestId(req);
    req.requestId = requestId;
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);
    req.headers['x-request-id'] = requestId;
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// ============================================================
// 🔐 CORS Configuration
// ============================================================
app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600
}));

// ============================================================
// 🔐 Security Headers Middleware
// ============================================================
securityHeaders(app);

// ============================================================
// ⚙️ Compression Middleware (gzip responses)
// ============================================================
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Balance entre speed et compression ratio
}));

// ============================================================
//  Body Parsers
// ============================================================
app.use(limitPayloadSize('50mb')); // Prevent payload attacks
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================================
// 🧹 Sanitization Middleware
// ============================================================
app.use(sanitize);

// ============================================================
// 📊 Logging Middleware
// ============================================================
const morganFormat = NODE_ENV === 'production'
    ? ':remote-addr :method :url :status :res[content-length] :response-time ms :req[x-request-id]'
    : ':method :url :status :response-time ms :req[x-request-id]';

app.use(morgan(morganFormat, {
    skip: (req) => ['/health', '/nginx-health', '/api/health', '/api/health/ready', '/api/health/alive'].includes(req.url)
}));

// ============================================================
// 🔍 Audit Trail Middleware (GENIUS FEATURES)
// ============================================================
app.use(auditTrail);

// ============================================================
// ⚡ Rate Limiting Middleware
// ============================================================
app.use(globalLimiter); // Global rate limit
app.post('/api/auth/login', authLimiter); // Strict login limit
app.post('/api/auth/register', authLimiter); // Strict registration limit
app.use('/api/', apiLimiter); // API general limit

// ============================================================
// � Audit Logging Middleware
// ============================================================
app.use(auditLog);

// ============================================================
// �🔐 JWT Authentication Middleware
// ============================================================
const authMiddleware = (req, res, next) => {
    const publicPaths = [
        '/api/auth/register',
        '/api/auth/login',
        '/api/health',
        '/api/health/ready',
        '/api/health/alive',
        '/api/docs',
        '/api/diagnostics/modules'
    ];

    if (publicPaths.includes(req.path) || req.path.startsWith('/api/diagnostics')) {
        return next();
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized - Missing token' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
};

// ============================================================
// 🎯 Service Initialization
// ============================================================
const services = {
    reminder: new ReminderService(pool),
    charges: new ChargesService(pool),
    fiscal: new FiscalReportService(pool),
    sci: new SCIService(pool),
    seasonal: new SeasonalService(pool),
    bankSync: new BankSyncService(pool)
};

console.log('✅ Services initialized:', Object.keys(services).join(', '));

// ============================================================
// 🛣️  Routes Registration
// ============================================================

// Health check
app.get('/api/health', async (req, res) => {
    const uptime = process.uptime();
    const modules = serializeModules(environment.featureFlags);
    const enabledModules = modules.filter((module) => module.enabled);

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        uptime: Math.round(uptime),
        environment: {
            node: NODE_ENV,
            app: APP_ENV
        },
        services: {
            database: 'connected',
            redis: 'optional',
            smtp: process.env.SMTP_HOST ? 'configured' : 'not_configured'
        },
        featureFlags: RAW_FEATURE_FLAGS,
        modules: {
            total: modules.length,
            enabled: enabledModules.length,
            activeIds: enabledModules.map((module) => module.id)
        }
    });
});

app.get('/api/health/alive', (req, res) => {
    res.status(200).json({
        alive: true,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
    });
});

app.get('/api/health/ready', async (req, res) => {
    try {
        await pool.query('SELECT 1 AS ok');
        res.status(200).json({
            ready: true,
            timestamp: new Date().toISOString(),
            requestId: req.requestId
        });
    } catch (error) {
        res.status(503).json({
            ready: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            requestId: req.requestId
        });
    }
});

app.get('/api/diagnostics/modules', (req, res) => {
    const modules = serializeModules(environment.featureFlags);
    const enabledModules = modules.filter((module) => module.enabled);

    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        environment: APP_ENV,
        featureFlags: RAW_FEATURE_FLAGS,
        modules,
        enabledModuleIds: enabledModules.map((module) => module.id)
    });
});

// Apply auth middleware to protected routes
app.use('/api/contracts', authMiddleware, contractRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/roles', authMiddleware, rolesRoutes);
app.use('/api/leads', authMiddleware, leadsRoutes);

// 📤 Export routes (with auth)
app.use('/api/exports', authMiddleware, exportsRoutes);
app.use('/api/roles', authMiddleware, rolesRoutes);

// Auth routes (no middleware)
app.use('/api/auth', authRoutes);

// 🇬🇳 Guinea-specific routes (NO AUTH - PUBLIC API)
app.use('/api/guinea', guineaRoutes);

// 🌍 Internationalisation routes (NO AUTH - PUBLIC API)
app.use('/api/i18n', i18nRoutes);

// ImmobilierLoyer routes (with services)
const immobilierRoutes = immobilierLoyerRoutes(services);
app.use('/api/reminders', authMiddleware, immobilierRoutes);
app.use('/api/charges', authMiddleware, immobilierRoutes);
app.use('/api/fiscal', authMiddleware, immobilierRoutes);
app.use('/api/sci', authMiddleware, immobilierRoutes);
app.use('/api/seasonal', authMiddleware, immobilierRoutes);
app.use('/api/bank', authMiddleware, immobilierRoutes);

// Phase 4-5 Routes (with auth middleware)
app.use('/api/tenants', authMiddleware, phase4TenantsRoutes);
app.use('/api/maintenance', authMiddleware, phase5MaintenanceRoutes);

// Notice/Préavis Routes (with auth middleware)
app.use('/api/preavis', authMiddleware, preavisRoutes);

// Validation & Testing Routes (protected)
app.use('/api/validation', authMiddleware, validationRoutes);

// ============ ADVANCED FEATURES ROUTES (PHASE 7 - ENTERPRISE) ============
app.use('/api/advanced', authMiddleware, advancedFeaturesRoutes);

// ============ ULTRA-ADVANCED ROUTES (PHASE 11 - JUPITER) ============
app.use('/api/hyperscalability', authMiddleware, hyperscalabilityRoutes);
app.use('/api/proactive-ai', authMiddleware, proactiveAIRoutes);
app.use('/api/governance-blockchain', authMiddleware, governanceBlockchainRoutes);

// ============ GENIUS FEATURES ROUTES ============
app.use('/api/tenant-portal', authMiddleware, tenantPortalRoutes);
app.use('/api/accounting-genius', authMiddleware, accountingGeniusRoutes);

// ============================================================
// 📚 API Documentation (Swagger)
// ============================================================
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'AKIG Immobilier Premium API',
        version: '1.0.0',
        description: 'API REST pour gestion immobilière Guinée',
        baseUrl: `http://localhost:${PORT}/api`,
        endpoints: {
            auth: '/api/auth',
            contracts: '/api/contracts',
            payments: '/api/payments',
            reminders: '/api/reminders',
            charges: '/api/charges',
            fiscal: '/api/fiscal',
            sci: '/api/sci',
            seasonal: '/api/seasonal',
            bank: '/api/bank'
        },
        documentation: 'See swagger.yaml for full OpenAPI 3.0 specification'
    });
});

// ============================================================
// 🚫 404 Error Handler
// ============================================================
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        method: req.method,
        path: req.path,
        requestId: req.id || req.requestId,
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// ⚠️  Global Error Handler
// ============================================================
app.use(notFoundHandler); // 404 handler

app.use(errorHandler); // Global error handler (MUST be last!)

// ============================================================
// 🚀 Server Startup
// ============================================================
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║           🚀 AKIG Backend API Started                      ║
╚════════════════════════════════════════════════════════════╝

📊 Configuration:
    Node Env:       ${NODE_ENV}
    App Env:        ${APP_ENV}
  Port:           ${PORT}
  CORS Origin:    ${CORS_ORIGIN}
  Database:       ${DATABASE_URL ? '✓ Connected' : '✗ Not configured'}
  JWT Secret:     ${JWT_SECRET ? '✓ Configured' : '✗ Not configured'}
    Log Level:      ${LOG_LEVEL}
    Feature Flags:  ${Object.keys(RAW_FEATURE_FLAGS).filter((key) => RAW_FEATURE_FLAGS[key]).join(', ') || 'aucun'}

🛣️  API Endpoints:
  Health:         GET /api/health
  Documentation:  GET /api/docs
  Auth:           /api/auth/*
  Contracts:      /api/contracts/*
  Payments:       /api/payments/*
  Reminders:      /api/reminders/*
  Charges:        /api/charges/*
  Fiscal:         /api/fiscal/*
  SCI:            /api/sci/*
  Seasonal:       /api/seasonal/*
  Bank Sync:      /api/bank/*

📈 Services Loaded:
  ✓ ReminderService
  ✓ ChargesService
  ✓ FiscalReportService
  ✓ SCIService
  ✓ SeasonalService
  ✓ BankSyncService

🔗 URL: http://localhost:${PORT}/api
        `);
    });

    // ============================================================
    // 🛡️  Graceful Shutdown
    // ============================================================
    process.on('SIGTERM', () => {
        console.log('\n⛔ SIGTERM received - shutting down gracefully...');
        if (!server) {
            return process.exit(0);
        }
        server.close(() => {
            console.log('✓ Server closed');
            pool.end(() => {
                console.log('✓ Database pool closed');
                process.exit(0);
            });
        });
    });
}
process.on('SIGTERM', () => {
    console.log('\n⛔ SIGTERM received - shutting down gracefully...');
    server.close(() => {
        console.log('✓ Server closed');
        pool.end(() => {
            console.log('✓ Database pool closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('\n⛔ SIGINT received - shutting down gracefully...');
    server.close(() => {
        console.log('✓ Server closed');
        pool.end(() => {
            console.log('✓ Database pool closed');
            process.exit(0);
        });
    });
});

// ============================================================
// 🚨 Unhandled Rejection Handler
// ============================================================
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

module.exports = app;
module.exports.app = app;
module.exports.server = server;
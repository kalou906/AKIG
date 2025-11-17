import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createClient } from 'redis';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { OpenTelemetryInterceptor } from './common/interceptors/otel.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // 1. Application NestJS avec logger Pino
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    cors: false, // Configuré manuellement après
  });

  // 2. Configuration service
  const configService = app.get(ConfigService);
  const isProduction = configService.get('NODE_ENV') === 'production';
  const port = configService.get<number>('PORT', 4000);

  // 3. Security Headers (Helmet v8.0) - OWASP Compliant
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Pour Next.js inline scripts
        styleSrc: ["'self'", "'unsafe-inline'"], // Pour Tailwind
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://*.sentry.io", "wss://"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Pour Next.js compatibility
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 63072000, // 2 ans
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
    frameguard: { action: 'deny' },
    dnsPrefetchControl: { allow: false },
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  }));

  // 4. Compression Gzip/Brotli (niveau optimisé)
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    level: 6, // Compromis vitesse/taux compression
    threshold: 1000, // Seulement si > 1ko
    memLevel: 8,
  }));

  // 5. Rate Limiting Global (300 req/min par IP)
  const redisClient = createClient({
    url: configService.get<string>('REDIS_URL'),
    socket: { 
      keepAlive: 30000,
      reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    },
  });
  
  await redisClient.connect();
  logger.log('✅ Redis connected for rate limiting');

  app.use(
    rateLimit({
      windowMs: parseInt(configService.get('RATE_LIMIT_GLOBAL_WINDOW_MS', '60000')),
      limit: parseInt(configService.get('RATE_LIMIT_GLOBAL_MAX', '300')),
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      }),
      handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'You have exceeded the rate limit. Please try again later.',
          retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
        });
      },
      skip: (req) => {
        // Pas de rate limit sur health/metrics
        return req.path === '/health' || req.path === '/metrics';
      },
    }),
  );

  // 6. Rate Limiting Authentification (5 tentatives/15min)
  app.use(
    '/api/v1/auth/login',
    rateLimit({
      windowMs: parseInt(configService.get('RATE_LIMIT_AUTH_WINDOW_MS', '900000')),
      limit: parseInt(configService.get('RATE_LIMIT_AUTH_MAX', '5')),
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Par IP + email pour éviter bruteforce
        const email = req.body?.email || 'unknown';
        return `login:${req.ip}:${email}`;
      },
      store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      }),
      handler: (req, res) => {
        logger.error(`Login bruteforce attempt from ${req.ip}`);
        res.status(429).json({
          statusCode: 429,
          error: 'Too Many Login Attempts',
          message: 'Your account is temporarily locked due to too many failed login attempts. Try again in 15 minutes.',
        });
      },
    }),
  );

  // 7. Validation Pipe Globale (Zod-like via class-validator)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Supprime propriétés non-décorées
    forbidNonWhitelisted: true, // Lance erreur si propriété inconnue
    transform: true, // Transforme payloads en DTOs
    transformOptions: { 
      enableImplicitConversion: false,
      exposeDefaultValues: true,
    },
    disableErrorMessages: isProduction, // Cache détails validation en prod
    validationError: { 
      target: false, 
      value: false,
    },
    stopAtFirstError: false, // Renvoie toutes les erreurs
  }));

  // 8. Versioning API (/api/v1, /api/v2)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // 9. Intercepteurs Globaux
  app.useGlobalInterceptors(
    new TimeoutInterceptor(30000), // Timeout 30s par défaut
    new LoggingInterceptor(),
    new OpenTelemetryInterceptor(),
  );

  // 10. Filters Globaux (Gestion erreurs centralisée)
  app.useGlobalFilters(new AllExceptionsFilter());

  // 11. CORS avec origines dynamiques sécurisées
  const allowedOrigins = configService
    .get<string>('CORS_ORIGIN', 'http://localhost:3000')
    .split(',')
    .map(o => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser requêtes sans origin (mobile apps, Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || !isProduction) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-CSRF-Token', 
      'X-Request-ID',
      'X-API-Key',
    ],
    exposedHeaders: [
      'X-Total-Count', 
      'X-Rate-Limit-Limit', 
      'X-Rate-Limit-Remaining',
      'X-Request-ID',
    ],
    maxAge: 86400, // 24h
  });

  // 12. Swagger/OpenAPI (accessible à /api/docs)
  if (!isProduction || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('AKIG API v3.0')
      .setDescription('API de gestion immobilière ultra-moderne avec IA prédictive, blockchain-ready et hyperscalable')
      .setVersion('3.0.0')
      .setContact(
        'AKIG Support',
        'https://akig.gn',
        'support@akig.gn'
      )
      .setLicense('Proprietary', 'https://akig.gn/license')
      .addTag('auth', 'Authentification JWT + 2FA + OAuth2')
      .addTag('users', 'Gestion utilisateurs & RBAC')
      .addTag('tenants', 'Gestion locataires avec IA prédictive')
      .addTag('payments', 'Paiements avec intégration Orange Money/MTN/Stripe')
      .addTag('contracts', 'Contrats intelligents avec génération PDF')
      .addTag('properties', 'Gestion biens immobiliers')
      .addTag('reports', 'Rapports financiers & analytics')
      .addTag('notifications', 'Notifications temps réel (SSE + WebSocket)')
      .addTag('ai', 'Prédictions ML (risques, revenus, anomalies)')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Token (24h expiry, EdDSA signature)',
        name: 'Authorization',
        in: 'header',
      }, 'jwt')
      .addApiKey({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key pour services ML et intégrations externes',
      }, 'api-key')
      .addSecurityRequirements('jwt')
      .addServer('https://api.akig.gn', 'Production')
      .addServer('https://staging-api.akig.gn', 'Staging')
      .addServer('http://localhost:4000', 'Development')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
      ignoreGlobalPrefix: false,
      deepScanRoutes: true,
    });

    // Custom CSS AKIG branding
    const customCss = `
      .swagger-ui .topbar { 
        background: linear-gradient(135deg, #4F46E5 0%, #9333EA 100%); 
      }
      .swagger-ui .info { 
        background: linear-gradient(135deg, #4F46E5 0%, #9333EA 100%); 
        color: white; 
        padding: 24px; 
        border-radius: 12px;
        margin-bottom: 24px;
      }
      .swagger-ui .info .title { color: white; }
      .swagger-ui .btn.authorize { 
        background-color: #22C55E; 
        border-color: #22C55E;
      }
      .swagger-ui .btn.authorize:hover {
        background-color: #16A34A;
      }
      .swagger-ui .scheme-container {
        background: #F9FAFB;
        border: 1px solid #E5E7EB;
        padding: 16px;
        border-radius: 8px;
      }
    `;

    SwaggerModule.setup('api/docs', app, document, {
      customCss,
      customSiteTitle: 'AKIG API Documentation v3.0',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        filter: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'list',
        defaultModelsExpandDepth: 3,
        defaultModelExpandDepth: 3,
        displayOperationId: true,
      },
    });

    logger.log(`📚 Swagger documentation available at: http://localhost:${port}/api/docs`);
  }

  // 13. Graceful Shutdown
  app.enableShutdownHooks();

  // 14. Démarrage serveur
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 AKIG API v3.0 running on port ${port} in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV')}`);
  logger.log(`🔐 Security: Helmet + CORS + Rate Limiting enabled`);
  logger.log(`⚡ Performance: Compression + Redis cache active`);
  logger.log(`📊 Monitoring: Prometheus metrics at /metrics`);
  logger.log(`❤️  Health check at /health`);
}

bootstrap().catch((error) => {
  console.error('💥 Failed to start AKIG API:', error);
  process.exit(1);
});

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { redisStore } from 'cache-manager-redis-yet';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Configuration
import databaseConfig from './config/database.config';
import securityConfig from './config/security.config';
import cacheConfig from './config/cache.config';
import redisConfig from './config/redis.config';
import storageConfig from './config/storage.config';

// Modules Feature
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { PaymentsModule } from './payments/payments.module';
import { ContractsModule } from './contracts/contracts.module';
import { PropertiesModule } from './properties/properties.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AIModule } from './ai/ai.module';
import { FileStorageModule } from './file-storage/file-storage.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';

// Guards
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

// Prisma
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // 1. Configuration centralisée avec validation Zod
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [
        databaseConfig,
        securityConfig,
        cacheConfig,
        redisConfig,
        storageConfig,
      ],
      validationOptions: {
        allowUnknown: false,
        abortEarly: false,
      },
    }),

    // 2. Prisma ORM
    PrismaModule,

    // 3. Event Emitter (pour patterns CQRS/Event Sourcing)
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),

    // 4. Rate Limiting Global (ThrottlerGuard appliqué automatiquement)
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [{
        ttl: config.get('RATE_LIMIT_GLOBAL_WINDOW_MS', 60000),
        limit: config.get('RATE_LIMIT_GLOBAL_MAX', 300),
        skipIf: (context) => {
          const request = context.switchToHttp().getRequest();
          return request.url === '/health' || request.url === '/metrics';
        },
      }],
    }),

    // 5. BullMQ Queues (Jobs asynchrones: PDF, emails, AI predictions)
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
          db: 1, // DB séparée pour queues
          tls: config.get('REDIS_TLS') === 'true' ? {} : undefined,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          enableOfflineQueue: true,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: {
            age: 3600, // 1h
            count: 1000,
          },
          removeOnFail: {
            age: 24 * 3600, // 24h
          },
        },
      }),
    }),

    // 6. Cache Manager (Redis) - Cache applicatif
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: config.get('REDIS_HOST'),
            port: config.get<number>('REDIS_PORT', 6379),
          },
          password: config.get('REDIS_PASSWORD'),
          database: config.get<number>('REDIS_DB', 0),
          ttl: config.get<number>('REDIS_TTL', 300) * 1000, // ms
        }),
        max: 1000, // Max items in cache
      }),
    }),

    // 7. Prometheus Metrics
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'akig_api_',
        },
      },
      defaultLabels: {
        app: 'akig-api',
        version: '3.0.0',
      },
    }),

    // 8. Health Checks (DB, Redis, ML API)
    HealthModule,

    // 9. Modules Feature (ordre d'importance)
    AuthModule,
    UsersModule,
    TenantsModule,
    PaymentsModule,
    ContractsModule,
    PropertiesModule,
    ReportsModule,
    NotificationsModule,
    AIModule,
    FileStorageModule,
    AuditModule,
  ],
  providers: [
    // 10. Guards Globaux (appliqués à toutes les routes sauf @Public())
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

import { Injectable, Logger } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { TenantRepository } from './repositories/tenant.repository';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';

@Module({
  imports: [PrismaModule, RedisModule, EventEmitterModule.forRoot()],
  controllers: [TenantsController],
  providers: [TenantsService, TenantRepository],
  exports: [TenantsService, TenantRepository],
})
export class TenantsModule {
  private readonly logger = new Logger(TenantsModule.name);

  constructor() {
    this.logger.log('TenantsModule initialized with CQRS + Event Sourcing');
  }
}

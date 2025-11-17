import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateTenantCommand, UpdateTenantCommand, DeleteTenantCommand } from '../commands';
import { TenantCreatedEvent, TenantUpdatedEvent, TenantDeletedEvent } from '../events';
import { TenantFiltersDto } from '../dto';
import { Tenant, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Repository Pattern interface for Tenant aggregate
 */
export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findByEmail(email: string): Promise<Tenant | null>;
  findByPhone(phone: string): Promise<Tenant | null>;
  search(filters: TenantFiltersDto): Promise<{ items: Tenant[]; total: number }>;
  create(command: CreateTenantCommand): Promise<Tenant>;
  update(id: string, command: UpdateTenantCommand): Promise<Tenant>;
  delete(id: string, command: DeleteTenantCommand): Promise<void>;
  exists(id: string): Promise<boolean>;
}

/**
 * Tenant Repository with CQRS, Event Sourcing, and Cache-Aside Pattern
 */
@Injectable()
export class TenantRepository implements ITenantRepository {
  private readonly logger = new Logger(TenantRepository.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_KEY_PREFIX = 'tenant:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Find tenant by ID with multi-level caching
   */
  async findById(id: string): Promise<Tenant | null> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}id:${id}`;

    // L1: Redis cache
    try {
      const cached = await this.redis.cacheGet<Tenant>(cacheKey);
      if (cached) {
        // Verify cache freshness
        if (Date.now() - new Date(cached.updatedAt).getTime() < this.CACHE_TTL * 1000) {
          this.logger.debug(`Cache HIT for tenant ${id}`);
          return cached;
        }
        this.logger.debug(`Cache STALE for tenant ${id}, fetching fresh data`);
      }
    } catch (error) {
      this.logger.warn(`Cache read failed for ${cacheKey}:`, error);
    }

    // L2: Database
    const tenant = await this.prisma.tenant.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { contracts: true, payments: true },
        },
      },
    });

    // Async cache population (non-blocking)
    if (tenant) {
      this.redis.cacheSet(cacheKey, tenant, this.CACHE_TTL).catch((err) => {
        this.logger.error(`Cache write failed for ${cacheKey}:`, err);
      });
    }

    return tenant;
  }

  /**
   * Find by email with cache
   */
  async findByEmail(email: string): Promise<Tenant | null> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}email:${email.toLowerCase()}`;

    const cached = await this.redis.cacheGet<Tenant>(cacheKey);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
    });

    if (tenant) {
      await this.redis.cacheSet(cacheKey, tenant, this.CACHE_TTL);
    }

    return tenant;
  }

  /**
   * Find by phone with cache
   */
  async findByPhone(phone: string): Promise<Tenant | null> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}phone:${phone}`;

    const cached = await this.redis.cacheGet<Tenant>(cacheKey);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findFirst({
      where: { phone, deletedAt: null },
    });

    if (tenant) {
      await this.redis.cacheSet(cacheKey, tenant, this.CACHE_TTL);
    }

    return tenant;
  }

  /**
   * Advanced search with dynamic filters and cursor pagination
   */
  async search(filters: TenantFiltersDto): Promise<{ items: Tenant[]; total: number }> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}search:${JSON.stringify(filters)}`;

    // Cache only if no temporal filter
    if (!filters.updatedSince) {
      const cached = await this.redis.cacheGet<{ items: Tenant[]; total: number }>(cacheKey);
      if (cached) return cached;
    }

    // Build WHERE clause with security
    const where = this.buildWhereClause(filters);

    // Cursor pagination for large datasets
    const cursor = filters.cursor ? { id: filters.cursor } : undefined;
    const limit = Math.min(filters.limit || 20, 100);

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: cursor ? 1 : undefined,
        take: limit,
        cursor,
        orderBy: this.buildOrderBy(filters),
        include: {
          _count: { select: { contracts: true, payments: true } },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    // Cache if no temporal filter
    if (!filters.updatedSince) {
      await this.redis.cacheSet(cacheKey, { items, total }, this.CACHE_TTL);
    }

    return { items, total };
  }

  /**
   * Create tenant with Transaction Script + Domain Events
   */
  async create(command: CreateTenantCommand): Promise<Tenant> {
    const { data, createdBy } = command;

    // Validate business rules
    await this.validateBusinessRules(data);

    // Distributed lock for uniqueness check
    const lockKey = `lock:tenant:create:${data.email || data.phone}`;
    const lockAcquired = await this.redis.acquireLock(lockKey, 5000);

    if (!lockAcquired) {
      throw new ConflictException('Another tenant creation is in progress');
    }

    try {
      // Double-check after lock acquisition
      if (data.email) {
        const existing = await this.findByEmail(data.email);
        if (existing) {
          throw new ConflictException(`Email ${data.email} already registered`);
        }
      }

      if (data.phone) {
        const existingPhone = await this.findByPhone(data.phone);
        if (existingPhone) {
          throw new ConflictException(`Phone ${data.phone} already registered`);
        }
      }

      // Transaction with SERIALIZABLE isolation
      const tenant = await this.prisma.$transaction(
        async (tx) => {
          // Create tenant
          const newTenant = await tx.tenant.create({
            data: {
              ...data,
              createdById: createdBy,
              riskScore: null, // Will be calculated by AI
              lastRiskUpdate: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            include: {
              _count: { select: { contracts: true, payments: true } },
            },
          });

          // Event sourcing: Store creation event
          await tx.auditLog.create({
            data: {
              action: 'CREATE',
              resourceType: 'TENANT',
              resourceId: newTenant.id,
              userId: createdBy,
              newValues: newTenant,
              metadata: {
                timestamp: new Date().toISOString(),
                version: 1,
              },
            },
          });

          return newTenant;
        },
        { isolationLevel: 'Serializable' },
      );

      // Async: Publish domain event
      this.eventEmitter.emit('tenant.created', new TenantCreatedEvent(tenant, createdBy));

      // Async: Invalidate search caches
      await this.invalidateSearchCaches();

      return tenant;
    } finally {
      await this.redis.releaseLock(lockKey);
    }
  }

  /**
   * Update with Optimistic Concurrency Control
   */
  async update(id: string, command: UpdateTenantCommand): Promise<Tenant> {
    const { data, updatedBy, expectedVersion } = command;

    // Fetch current version
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Tenant ${id} not found`);
    }

    // OCC: Verify no concurrent modification
    if (expectedVersion && existing.updatedAt.getTime() !== expectedVersion) {
      throw new ConflictException(
        `Tenant ${id} was modified by another user. Expected version ${expectedVersion}, got ${existing.updatedAt.getTime()}. Please refresh.`,
      );
    }

    // Calculate diff for audit
    const changes = this.calculateDiff(existing, data);

    // Transaction with update and audit
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update with version check
      const tenant = await tx.tenant.update({
        where: {
          id,
          updatedAt: existing.updatedAt, // OCC condition
          deletedAt: null,
        },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          _count: { select: { contracts: true, payments: true } },
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          resourceType: 'TENANT',
          resourceId: id,
          userId: updatedBy,
          oldValues: existing,
          newValues: { changes, after: tenant },
          metadata: {
            timestamp: new Date().toISOString(),
          },
        },
      });

      return tenant;
    });

    // Async: Publish event
    this.eventEmitter.emit('tenant.updated', new TenantUpdatedEvent(updated, existing, updatedBy));

    // Async: Invalidate caches
    await this.redis.del(`${this.CACHE_KEY_PREFIX}id:${id}`);
    if (existing.email) {
      await this.redis.del(`${this.CACHE_KEY_PREFIX}email:${existing.email.toLowerCase()}`);
    }
    if (existing.phone) {
      await this.redis.del(`${this.CACHE_KEY_PREFIX}phone:${existing.phone}`);
    }
    await this.invalidateSearchCaches();

    return updated;
  }

  /**
   * Soft delete with audit trail
   */
  async delete(id: string, command: DeleteTenantCommand): Promise<void> {
    const { deletedBy, reason } = command;

    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Tenant ${id} not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      // Soft delete
      await tx.tenant.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          resourceType: 'TENANT',
          resourceId: id,
          userId: deletedBy,
          oldValues: existing,
          metadata: {
            reason,
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    // Async: Publish event
    this.eventEmitter.emit('tenant.deleted', new TenantDeletedEvent(id, deletedBy, reason));

    // Async: Invalidate caches
    await this.redis.del(`${this.CACHE_KEY_PREFIX}id:${id}`);
    if (existing.email) {
      await this.redis.del(`${this.CACHE_KEY_PREFIX}email:${existing.email.toLowerCase()}`);
    }
    if (existing.phone) {
      await this.redis.del(`${this.CACHE_KEY_PREFIX}phone:${existing.phone}`);
    }
    await this.invalidateSearchCaches();
  }

  /**
   * Check existence (lightweight)
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.tenant.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  // ==================== PRIVATE UTILITIES ====================

  private async validateBusinessRules(data: any): Promise<void> {
    if (data.phone && !this.validateGuineanPhone(data.phone)) {
      throw new BadRequestException('Invalid Guinean phone format. Expected: +224 6xx xx xx xx');
    }

    if (data.idNumber && !this.validateGuineanNationalId(data.idNumber)) {
      throw new BadRequestException('Invalid Guinean national ID format. Expected: XX XXX XXX XX');
    }

    if (data.creditScore && (data.creditScore < 300 || data.creditScore > 850)) {
      throw new BadRequestException('Credit score must be between 300 and 850');
    }
  }

  private validateGuineanPhone(phone: string): boolean {
    return /^\+224\s?6\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/.test(phone);
  }

  private validateGuineanNationalId(id: string): boolean {
    return /^\d{2}\s?\d{3}\s?\d{3}\s?\d{2}$/.test(id);
  }

  private buildWhereClause(filters: TenantFiltersDto): Prisma.TenantWhereInput {
    const where: Prisma.TenantWhereInput = { deletedAt: null };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { idNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.minCreditScore) {
      where.creditScore = { gte: filters.minCreditScore };
    }

    if (filters.hasContract !== undefined) {
      where.contracts = filters.hasContract ? { some: {} } : { none: {} };
    }

    if (filters.updatedSince) {
      where.updatedAt = { gte: new Date(filters.updatedSince) };
    }

    return where;
  }

  private buildOrderBy(filters: TenantFiltersDto): Prisma.TenantOrderByWithRelationInput {
    const sortBy = filters.sortBy || 'createdAt';
    const order = filters.sortOrder || 'desc';

    switch (sortBy) {
      case 'paymentCount':
        return { payments: { _count: order } };
      case 'contractCount':
        return { contracts: { _count: order } };
      case 'riskScore':
        return { riskScore: order };
      case 'creditScore':
        return { creditScore: order };
      default:
        return { [sortBy]: order };
    }
  }

  private async invalidateSearchCaches(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.CACHE_KEY_PREFIX}search:*`);
      if (keys && keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Invalidated ${keys.length} search cache entries`);
      }
    } catch (error) {
      this.logger.error('Failed to invalidate search caches:', error);
    }
  }

  private calculateDiff(before: any, after: any): Record<string, { before: any; after: any }> {
    const diff: Record<string, { before: any; after: any }> = {};
    for (const key in after) {
      if (after[key] !== undefined && before[key] !== after[key]) {
        diff[key] = { before: before[key], after: after[key] };
      }
    }
    return diff;
  }
}

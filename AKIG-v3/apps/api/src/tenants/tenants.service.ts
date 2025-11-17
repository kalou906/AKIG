import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateTenantDto, UpdateTenantDto, TenantFiltersDto } from './dto';
import { Tenant, Prisma, RiskCategory } from '@prisma/client';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Create a new tenant with risk calculation
   */
  async create(dto: CreateTenantDto, createdBy: string): Promise<Tenant> {
    // Check email uniqueness
    if (dto.email) {
      const existing = await this.prisma.tenant.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException(`Tenant with email ${dto.email} already exists`);
      }
    }

    // Calculate initial risk score
    const riskScore = this.calculateRiskScore({
      creditScore: dto.creditScore,
      incomeVerified: dto.incomeVerified || false,
    });

    const riskCategory = this.getRiskCategory(riskScore);

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        ...dto,
        riskScore,
        riskCategory,
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    this.logger.log(`Tenant created: ${tenant.id} with risk score ${riskScore}`);

    return tenant;
  }

  /**
   * Find all tenants with filtering and pagination
   */
  async findAll(filters: TenantFiltersDto): Promise<{ items: Tenant[]; total: number; page: number; pageSize: number }> {
    const cacheKey = `tenants:list:${JSON.stringify(filters)}`;
    
    // Try cache first
    const cached = await this.redis.cacheGet<{ items: Tenant[]; total: number }>(cacheKey);
    if (cached) {
      return { ...cached, page: filters.page, pageSize: filters.pageSize };
    }

    // Build where clause
    const where: Prisma.TenantWhereInput = {
      deletedAt: null,
      AND: [
        filters.search ? {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
            { phone: { contains: filters.search } },
          ],
        } : {},
        filters.riskCategory ? { riskCategory: filters.riskCategory } : {},
        filters.minCreditScore ? { creditScore: { gte: filters.minCreditScore } } : {},
      ],
    };

    // Execute query
    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        include: {
          _count: {
            select: {
              contracts: true,
              payments: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    // Cache result
    await this.redis.cacheSet(cacheKey, { items, total }, this.CACHE_TTL);

    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  /**
   * Find one tenant by ID
   */
  async findOne(id: string): Promise<Tenant> {
    const cacheKey = `tenant:${id}`;
    
    // Try cache
    const cached = await this.redis.cacheGet<Tenant>(cacheKey);
    if (cached) {
      return cached;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        contracts: {
          include: {
            property: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            contracts: true,
            payments: true,
            documents: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Cache result
    await this.redis.cacheSet(cacheKey, tenant, this.CACHE_TTL);

    return tenant;
  }

  /**
   * Update tenant
   */
  async update(id: string, dto: UpdateTenantDto, updatedBy: string): Promise<Tenant> {
    const existing = await this.prisma.tenant.findUnique({ where: { id } });
    
    if (!existing) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Recalculate risk if credit score or income verification changed
    let riskScore = existing.riskScore;
    let riskCategory = existing.riskCategory;

    if (dto.creditScore !== undefined || dto.incomeVerified !== undefined) {
      riskScore = this.calculateRiskScore({
        creditScore: dto.creditScore ?? existing.creditScore,
        incomeVerified: dto.incomeVerified ?? existing.incomeVerified,
      });
      riskCategory = this.getRiskCategory(riskScore);
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...dto,
        riskScore,
        riskCategory,
      },
    });

    // Invalidate cache
    await this.invalidateCache();
    await this.redis.del(`tenant:${id}`);

    this.logger.log(`Tenant updated: ${id}`);

    return updated;
  }

  /**
   * Soft delete tenant
   */
  async remove(id: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    await this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache
    await this.invalidateCache();
    await this.redis.del(`tenant:${id}`);

    this.logger.log(`Tenant soft deleted: ${id}`);
  }

  /**
   * Calculate risk score based on credit score and income verification
   */
  private calculateRiskScore(data: {
    creditScore?: number;
    incomeVerified: boolean;
  }): number {
    let score = 0.5; // Default medium risk

    // Credit score factor (40% weight)
    if (data.creditScore) {
      if (data.creditScore >= 750) {
        score -= 0.2;
      } else if (data.creditScore >= 650) {
        score -= 0.1;
      } else if (data.creditScore < 500) {
        score += 0.2;
      } else {
        score += 0.1;
      }
    }

    // Income verification factor (20% weight)
    if (data.incomeVerified) {
      score -= 0.1;
    } else {
      score += 0.1;
    }

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get risk category from score
   */
  private getRiskCategory(score: number): RiskCategory {
    if (score < 0.25) return RiskCategory.LOW;
    if (score < 0.5) return RiskCategory.MEDIUM;
    if (score < 0.75) return RiskCategory.HIGH;
    return RiskCategory.CRITICAL;
  }

  /**
   * Invalidate all list caches
   */
  private async invalidateCache(): Promise<void> {
    const keys = await this.redis.keys('tenants:list:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Get tenant statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byRisk: Record<RiskCategory, number>;
    averageCreditScore: number;
  }> {
    const cacheKey = 'tenants:statistics';
    const cached = await this.redis.cacheGet<any>(cacheKey);
    if (cached) return cached;

    const [total, byRisk, avgCredit] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.tenant.groupBy({
        by: ['riskCategory'],
        where: { deletedAt: null },
        _count: true,
      }),
      this.prisma.tenant.aggregate({
        where: { deletedAt: null, creditScore: { not: null } },
        _avg: { creditScore: true },
      }),
    ]);

    const stats = {
      total,
      byRisk: byRisk.reduce((acc, item) => {
        acc[item.riskCategory] = item._count;
        return acc;
      }, {} as Record<RiskCategory, number>),
      averageCreditScore: avgCredit._avg.creditScore || 0,
    };

    await this.redis.cacheSet(cacheKey, stats, this.CACHE_TTL);

    return stats;
  }
}

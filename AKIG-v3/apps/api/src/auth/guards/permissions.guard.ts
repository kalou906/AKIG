import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Permission Matrix: resource:action:scope
 * Scope: own (user's own resources) | agency (all resources in agency) | * (all)
 */
const PERMISSION_MATRIX: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'tenant:*:*',
    'contract:*:*',
    'payment:*:*',
    'property:*:*',
    'user:*:*',
    'report:*:*',
    'settings:*:*',
  ],
  [UserRole.MANAGER]: [
    'tenant:create:agency',
    'tenant:read:agency',
    'tenant:update:agency',
    'contract:*:agency',
    'payment:*:agency',
    'property:*:agency',
    'report:read:agency',
    'user:read:agency',
  ],
  [UserRole.COMPTABLE]: [
    'tenant:read:agency',
    'payment:create:agency',
    'payment:read:agency',
    'payment:update:agency',
    'contract:read:agency',
    'report:read:agency',
  ],
  [UserRole.AGENT]: [
    'tenant:read:own',
    'tenant:create:own',
    'contract:read:own',
    'payment:read:own',
    'property:read:own',
  ],
  [UserRole.VIEWER]: [
    'tenant:read:agency',
    'contract:read:agency',
    'payment:read:agency',
    'property:read:agency',
    'report:read:agency',
  ],
};

/**
 * Custom decorator to specify required permissions
 */
export const RequirePermissions = (...permissions: string[]) =>
  Reflector.createDecorator<string[]>({ key: 'permissions', value: permissions });

/**
 * RBAC Guard with Dynamic Permission Matrix
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);
  private readonly CACHE_TTL = 600; // 10 minutes

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator
    const requiredPermissions =
      this.reflector.get<string[]>('permissions', context.getHandler()) ||
      this.reflector.get<string[]>('permissions', context.getClass());

    // No restrictions = public access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get user from request (set by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user role with cache
    const userRole = await this.getUserRole(user.id);

    // Get resource ID from request (for scope checking)
    const resourceId = this.extractResourceId(request);

    // Check each required permission
    for (const permission of requiredPermissions) {
      const [resource, action, scope] = permission.split(':');

      const hasPermission = await this.checkPermission(
        userRole,
        resource,
        action,
        scope,
        user.id,
        resourceId,
      );

      if (!hasPermission) {
        this.logger.warn(
          `Access DENIED for user ${user.id} (${userRole}) on ${permission}`,
        );

        // Audit the denial
        await this.auditAccessDenial(user.id, permission, request);

        throw new ForbiddenException(
          `User ${user.email} lacks permission: ${permission}`,
        );
      }
    }

    this.logger.debug(
      `Access GRANTED for user ${user.id} (${userRole}) on ${requiredPermissions.join(', ')}`,
    );

    return true;
  }

  /**
   * Get user role with multi-level caching
   */
  private async getUserRole(userId: string): Promise<UserRole> {
    const cacheKey = `user:role:${userId}`;

    // L1: Redis cache
    try {
      const cached = await this.redis.cacheGet<UserRole>(cacheKey);
      if (cached) return cached;
    } catch (error) {
      this.logger.warn(`Redis cache read failed: ${error.message}`);
    }

    // L2: Database
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Populate cache
    await this.redis.cacheSet(cacheKey, user.role, this.CACHE_TTL).catch((err) => {
      this.logger.error(`Cache write failed: ${err.message}`);
    });

    return user.role;
  }

  /**
   * Check permission with wildcards and scope validation
   */
  private async checkPermission(
    role: UserRole,
    resource: string,
    action: string,
    requiredScope: string,
    userId: string,
    resourceId?: string,
  ): Promise<boolean> {
    const permissions = PERMISSION_MATRIX[role] || [];

    // Check each permission in user's role
    for (const perm of permissions) {
      const [permResource, permAction, permScope] = perm.split(':');

      // Match resource and action (with wildcards)
      const resourceMatch = permResource === '*' || permResource === resource;
      const actionMatch = permAction === '*' || permAction === action;

      if (!resourceMatch || !actionMatch) {
        continue;
      }

      // Match scope
      const scopeMatch = await this.checkScope(
        permScope,
        requiredScope,
        resource,
        userId,
        resourceId,
      );

      if (scopeMatch) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validate scope: own vs agency vs *
   */
  private async checkScope(
    permScope: string,
    requiredScope: string,
    resource: string,
    userId: string,
    resourceId?: string,
  ): Promise<boolean> {
    // Wildcard always matches
    if (permScope === '*') {
      return true;
    }

    // Exact match
    if (permScope === requiredScope) {
      // For "own" scope, verify ownership
      if (requiredScope === 'own' && resourceId) {
        return this.verifyOwnership(resource, resourceId, userId);
      }

      // For "agency" scope, verify same agency (in production)
      if (requiredScope === 'agency') {
        return this.verifyAgencyAccess(userId);
      }

      return true;
    }

    // Hierarchy: agency > own
    if (permScope === 'agency' && requiredScope === 'own') {
      return true;
    }

    return false;
  }

  /**
   * Verify user owns the resource
   */
  private async verifyOwnership(
    resource: string,
    resourceId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      switch (resource) {
        case 'tenant': {
          const tenant = await this.prisma.tenant.findFirst({
            where: { id: resourceId, createdById: userId, deletedAt: null },
          });
          return !!tenant;
        }

        case 'contract': {
          const contract = await this.prisma.contract.findFirst({
            where: { id: resourceId, createdById: userId, deletedAt: null },
          });
          return !!contract;
        }

        case 'payment': {
          const payment = await this.prisma.payment.findFirst({
            where: { id: resourceId, createdById: userId },
          });
          return !!payment;
        }

        case 'property': {
          const property = await this.prisma.property.findFirst({
            where: { id: resourceId, ownerId: userId, deletedAt: null },
          });
          return !!property;
        }

        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Ownership check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify user has agency access (placeholder)
   * In production: implement real agency logic with User.agencyId
   */
  private async verifyAgencyAccess(userId: string): Promise<boolean> {
    // TODO: Implement real agency logic
    // For now, all non-AGENT users have agency access
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role !== UserRole.AGENT;
  }

  /**
   * Extract resource ID from request params
   */
  private extractResourceId(request: any): string | undefined {
    // Try params.id first (e.g., /tenants/:id)
    if (request.params?.id) {
      return request.params.id;
    }

    // Try body.tenantId, contractId, etc.
    const idFields = ['tenantId', 'contractId', 'paymentId', 'propertyId'];
    for (const field of idFields) {
      if (request.body?.[field]) {
        return request.body[field];
      }
    }

    return undefined;
  }

  /**
   * Audit access denial for security monitoring
   */
  private async auditAccessDenial(
    userId: string,
    permission: string,
    request: any,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'ACCESS_DENIED',
          resourceType: 'PERMISSION',
          resourceId: permission,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          metadata: {
            url: request.url,
            method: request.method,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      this.logger.error(`Audit logging failed: ${error.message}`);
    }
  }
}

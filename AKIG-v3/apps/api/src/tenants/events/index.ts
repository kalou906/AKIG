import { Tenant } from '@prisma/client';

export class TenantCreatedEvent {
  constructor(
    public readonly tenant: Tenant,
    public readonly createdBy: string,
  ) {}
}

export class TenantUpdatedEvent {
  constructor(
    public readonly tenant: Tenant,
    public readonly previousTenant: Tenant,
    public readonly updatedBy: string,
  ) {}
}

export class TenantRiskScoreUpdatedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly oldScore: number,
    public readonly newScore: number,
    public readonly category: string,
  ) {}
}

export class TenantDeletedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly deletedBy: string,
    public readonly reason?: string,
  ) {}
}

export class TenantCriticalRiskEvent {
  constructor(
    public readonly tenantId: string,
    public readonly riskScore: number,
    public readonly factors: Record<string, number>,
  ) {}
}

// ============================================================================
// Scopes Middleware (scopes.ts)
// File: src/middlewares/scopes.ts
// Purpose: Restrict data access based on user role and resource ownership
// ============================================================================

/**
 * Extended Request type with scope information
 */
export interface ScopedRequest {
  scope?: {
    ownerId?: string | number;
    tenantId?: string | number;
    agentId?: string | number;
    [key: string]: any;
  };
  user?: {
    id: string | number;
    owner_id?: string | number;
    tenant_id?: string | number;
    agent_id?: string | number;
    roles?: string[];
    [key: string]: any;
  };
}

/**
 * Restrict data access for PROPRIETAIRE (Owner) role
 * Owners can only see their own sites and contracts
 *
 * @example
 * router.get('/sites', restrictOwnerScope, handler);
 */
export function restrictOwnerScope(
  req: ScopedRequest,
  res: any,
  next: any
): void {
  if (req.user?.roles?.includes('PROPRIETAIRE')) {
    req.scope = {
      ...req.scope,
      ownerId: req.user.owner_id
    };
  }
  next();
}

/**
 * Restrict data access for LOCATAIRE (Tenant) role
 * Tenants can only see their own contracts and payments
 *
 * @example
 * router.get('/contracts', restrictTenantScope, handler);
 */
export function restrictTenantScope(
  req: ScopedRequest,
  res: any,
  next: any
): void {
  if (req.user?.roles?.includes('LOCATAIRE')) {
    req.scope = {
      ...req.scope,
      tenantId: req.user.tenant_id
    };
  }
  next();
}

/**
 * Restrict data access for AGENT role
 * Agents can only see sites they are assigned to
 *
 * @example
 * router.get('/sites', restrictAgentScope, handler);
 */
export function restrictAgentScope(
  req: ScopedRequest,
  res: any,
  next: any
): void {
  if (req.user?.roles?.includes('AGENT')) {
    req.scope = {
      ...req.scope,
      agentId: req.user.agent_id
    };
  }
  next();
}

/**
 * Apply all role-based scopes
 * Convenience middleware that applies all scope restrictions
 *
 * @example
 * router.get('/data', applyScopes, handler);
 */
export function applyScopes(
  req: ScopedRequest,
  res: any,
  next: any
): void {
  restrictOwnerScope(req, res, () => {
    restrictTenantScope(req, res, () => {
      restrictAgentScope(req, res, next);
    });
  });
}

/**
 * Build WHERE clause for database queries based on scope
 * Handles SQL parameter injection safely
 *
 * @example
 * const { whereClause, params } = buildScopeWhere(req, 'tenant', 't');
 * const query = `SELECT * FROM tenants t ${whereClause}`;
 * const result = await pool.query(query, params);
 */
export function buildScopeWhere(
  req: ScopedRequest,
  resourceType: 'tenant' | 'owner' | 'site' | 'contract' | 'payment',
  tableAlias: string = 't'
): { whereClause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];

  if (!req.scope) {
    return { whereClause: '', params: [] };
  }

  // Owner scope
  if (req.scope.ownerId !== undefined) {
    params.push(req.scope.ownerId);
    conditions.push(`${tableAlias}.owner_id = $${params.length}`);
  }

  // Tenant scope
  if (req.scope.tenantId !== undefined) {
    params.push(req.scope.tenantId);
    conditions.push(`${tableAlias}.tenant_id = $${params.length}`);
  }

  // Agent scope
  if (req.scope.agentId !== undefined) {
    params.push(req.scope.agentId);
    conditions.push(`${tableAlias}.agent_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return { whereClause, params };
}

/**
 * Verify that a resource belongs to the user's scope
 * Prevents unauthorized access to resources
 *
 * @example
 * const isOwner = verifyResourceScope(req, { owner_id: resource.owner_id });
 * if (!isOwner) return res.status(403).json({ error: 'FORBIDDEN' });
 */
export function verifyResourceScope(
  req: ScopedRequest,
  resource: {
    owner_id?: string | number;
    tenant_id?: string | number;
    agent_id?: string | number;
    [key: string]: any;
  }
): boolean {
  if (!req.scope) {
    return true; // No scope restriction (PDG, COMPTA can access everything)
  }

  // Check if resource belongs to user's scope
  if (req.scope.ownerId !== undefined) {
    return resource.owner_id === req.scope.ownerId;
  }

  if (req.scope.tenantId !== undefined) {
    return resource.tenant_id === req.scope.tenantId;
  }

  if (req.scope.agentId !== undefined) {
    return resource.agent_id === req.scope.agentId;
  }

  return true;
}

export default {
  restrictOwnerScope,
  restrictTenantScope,
  restrictAgentScope,
  applyScopes,
  buildScopeWhere,
  verifyResourceScope
};

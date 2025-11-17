/**
 * Authorization middleware and helpers.
 * Provides role/permission checks, caching utilities, and audit hooks.
 */

const pool = require('../db');
const auditService = require('../services/auditService');

// -----------------------------------------------------------------------------
// Core permission helpers
// -----------------------------------------------------------------------------

async function checkPermission(userId, permCode, context = {}) {
	if (!userId || !permCode) {
		return false;
	}

	try {
		const { rows } = await pool.query(
			`SELECT 1
			 FROM user_roles ur
			 JOIN role_permissions rp ON ur.role_id = rp.role_id
			 JOIN permissions p ON rp.permission_id = p.id
			 WHERE ur.user_id = $1 AND p.code = $2
			 LIMIT 1`,
			[userId, permCode]
		);

		const hasAccess = rows.length > 0;

		if (!hasAccess && context.logFailure !== false) {
			try {
				await auditService.logAccess({
					userId,
					action: 'permission_denied',
					entityType: 'authorization',
					description: `Permission denied: ${permCode}`,
					ipAddress: context.ipAddress,
					userAgent: context.userAgent,
					requestId: context.requestId,
					status: 'denied',
					errorMessage: `Missing permission: ${permCode}`,
				});
			} catch (auditError) {
				console.error('Error logging failed authorization:', auditError);
			}
		}

		return hasAccess;
	} catch (error) {
		console.error('Authorization check failed:', error);
		throw error;
	}
}

async function authorizeAny(userId, permCodes) {
	if (!userId || !Array.isArray(permCodes) || permCodes.length === 0) {
		return false;
	}

	const placeholders = permCodes.map((_, idx) => `$${idx + 2}`).join(',');

	try {
		const { rows } = await pool.query(
			`SELECT 1
			 FROM user_roles ur
			 JOIN role_permissions rp ON ur.role_id = rp.role_id
			 JOIN permissions p ON rp.permission_id = p.id
			 WHERE ur.user_id = $1 AND p.code IN (${placeholders})
			 LIMIT 1`,
			[userId, ...permCodes]
		);

		return rows.length > 0;
	} catch (error) {
		console.error('Authorization check (ANY) failed:', error);
		throw error;
	}
}

async function authorizeAll(userId, permCodes) {
	if (!userId || !Array.isArray(permCodes) || permCodes.length === 0) {
		return false;
	}

	const placeholders = permCodes.map((_, idx) => `$${idx + 2}`).join(',');

	try {
		const { rows } = await pool.query(
			`SELECT COUNT(DISTINCT p.code) AS perm_count
			 FROM user_roles ur
			 JOIN role_permissions rp ON ur.role_id = rp.role_id
			 JOIN permissions p ON rp.permission_id = p.id
			 WHERE ur.user_id = $1 AND p.code IN (${placeholders})`,
			[userId, ...permCodes]
		);

		return rows.length > 0 && rows[0].perm_count === permCodes.length;
	} catch (error) {
		console.error('Authorization check (ALL) failed:', error);
		throw error;
	}
}

async function authorizeRole(userId, roleName) {
	if (!userId || !roleName) {
		return false;
	}

	try {
		const { rows } = await pool.query(
			`SELECT 1
			 FROM user_roles ur
			 JOIN roles r ON ur.role_id = r.id
			 WHERE ur.user_id = $1 AND r.name = $2
			 LIMIT 1`,
			[userId, roleName]
		);

		return rows.length > 0;
	} catch (error) {
		console.error('Role authorization check failed:', error);
		throw error;
	}
}

async function authorizeAnyRole(userId, roleNames) {
	if (!userId || !Array.isArray(roleNames) || roleNames.length === 0) {
		return false;
	}

	const placeholders = roleNames.map((_, idx) => `$${idx + 2}`).join(',');

	try {
		const { rows } = await pool.query(
			`SELECT 1
			 FROM user_roles ur
			 JOIN roles r ON ur.role_id = r.id
			 WHERE ur.user_id = $1 AND r.name IN (${placeholders})
			 LIMIT 1`,
			[userId, ...roleNames]
		);

		return rows.length > 0;
	} catch (error) {
		console.error('Role authorization check (ANY) failed:', error);
		throw error;
	}
}

function normalizeRoleInput(requiredRoles) {
	if (!requiredRoles) {
		return [];
	}

	if (typeof requiredRoles === 'string') {
		return [requiredRoles.trim()].filter(Boolean).map((role) => role.toUpperCase());
	}

	if (Array.isArray(requiredRoles)) {
		return requiredRoles.filter(Boolean).map((role) => String(role).trim().toUpperCase());
	}

	return [];
}

function extractUserRoles(user) {
	if (!user) {
		return [];
	}

	if (Array.isArray(user.roles)) {
		return user.roles.filter(Boolean).map((role) => String(role).toUpperCase());
	}

	if (user.role) {
		return [String(user.role).toUpperCase()];
	}

	return [];
}

function isAuthorized(user, requiredRoles = []) {
	const normalizedRequired = normalizeRoleInput(requiredRoles);
	if (normalizedRequired.length === 0) {
		return false;
	}

	const userRoles = extractUserRoles(user);
	if (userRoles.length === 0) {
		return false;
	}

	return normalizedRequired.some((role) => userRoles.includes(role));
}

function buildRoleMiddleware(requiredRoles = []) {
	const normalizedRequired = normalizeRoleInput(requiredRoles);

	return (req, res, next) => {
		const authHeader = req.headers?.authorization;

		if (!req.user) {
			return res.status(401).json({ erreur: "Utilisateur non authentifié" });
		}

		if (authHeader && !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ erreur: 'Token invalide' });
		}

		if (normalizedRequired.length > 0 && !isAuthorized(req.user, normalizedRequired)) {
			return res.status(403).json({ erreur: 'Accès refusé' });
		}

		return next();
	};
}

async function getUserPermissions(userId) {
	if (!userId) {
		return [];
	}

	try {
		const { rows } = await pool.query(
			`SELECT DISTINCT p.code
			 FROM user_roles ur
			 JOIN role_permissions rp ON ur.role_id = rp.role_id
			 JOIN permissions p ON rp.permission_id = p.id
			 WHERE ur.user_id = $1
			 ORDER BY p.code`,
			[userId]
		);

		return rows.map((row) => row.code);
	} catch (error) {
		console.error('Failed to get user permissions:', error);
		return [];
	}
}

async function getUserRoles(userId) {
	if (!userId) {
		return [];
	}

	try {
		const { rows } = await pool.query(
			`SELECT DISTINCT r.name
			 FROM user_roles ur
			 JOIN roles r ON ur.role_id = r.id
			 WHERE ur.user_id = $1
			 ORDER BY r.name`,
			[userId]
		);

		return rows.map((row) => row.name);
	} catch (error) {
		console.error('Failed to get user roles:', error);
		return [];
	}
}

function authorize(userOrRoles, permCode, context = {}) {
	const isRoleInvocation = typeof permCode === 'undefined' && (Array.isArray(userOrRoles) || typeof userOrRoles === 'string');

	if (isRoleInvocation) {
		return buildRoleMiddleware(userOrRoles);
	}

	return checkPermission(userOrRoles, permCode, context);
}

// -----------------------------------------------------------------------------
// Express middleware
// -----------------------------------------------------------------------------

function requirePermission(permCode) {
	return async (req, res, next) => {
		try {
			const userId = req.user?.id;

			if (!userId) {
				await logUnauthorizedAttempt(req, 'User not authenticated');
				return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
			}

			const hasAccess = await checkPermission(userId, permCode, {
				ipAddress: req.auditInfo?.ipAddress,
				userAgent: req.auditInfo?.userAgent,
				requestId: req.requestId,
				logFailure: true,
			});

			if (!hasAccess) {
				return res.status(403).json({
					error: 'Forbidden',
					message: `Permission '${permCode}' is required to access this resource`,
					requiredPermission: permCode,
				});
			}

			next();
		} catch (error) {
			console.error('Authorization middleware error:', error);
			res.status(500).json({ error: 'Internal server error', message: 'Authorization check failed' });
		}
	};
}

function requireAnyPermission(permCodes) {
	return async (req, res, next) => {
		try {
			const userId = req.user?.id;

			if (!userId) {
				await logUnauthorizedAttempt(req, 'User not authenticated');
				return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
			}

			const hasAccess = await authorizeAny(userId, permCodes);

			if (!hasAccess) {
				return res.status(403).json({
					error: 'Forbidden',
					message: `One of these permissions is required: ${permCodes.join(', ')}`,
					requiredPermissions: permCodes,
				});
			}

			next();
		} catch (error) {
			console.error('Authorization middleware error:', error);
			res.status(500).json({ error: 'Internal server error', message: 'Authorization check failed' });
		}
	};
}

function requireAllPermissions(permCodes) {
	return async (req, res, next) => {
		try {
			const userId = req.user?.id;

			if (!userId) {
				await logUnauthorizedAttempt(req, 'User not authenticated');
				return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
			}

			const hasAccess = await authorizeAll(userId, permCodes);

			if (!hasAccess) {
				return res.status(403).json({
					error: 'Forbidden',
					message: `All of these permissions are required: ${permCodes.join(', ')}`,
					requiredPermissions: permCodes,
				});
			}

			next();
		} catch (error) {
			console.error('Authorization middleware error:', error);
			res.status(500).json({ error: 'Internal server error', message: 'Authorization check failed' });
		}
	};
}

function requireRole(roleName) {
	return async (req, res, next) => {
		try {
			const userId = req.user?.id;

			if (!userId) {
				await logUnauthorizedAttempt(req, 'User not authenticated');
				return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
			}

			const hasAccess = await authorizeRole(userId, roleName);

			if (!hasAccess) {
				return res.status(403).json({
					error: 'Forbidden',
					message: `Role '${roleName}' is required to access this resource`,
					requiredRole: roleName,
				});
			}

			next();
		} catch (error) {
			console.error('Authorization middleware error:', error);
			res.status(500).json({ error: 'Internal server error', message: 'Authorization check failed' });
		}
	};
}

function requireAnyRole(roleNames) {
	return async (req, res, next) => {
		try {
			const userId = req.user?.id;

			if (!userId) {
				await logUnauthorizedAttempt(req, 'User not authenticated');
				return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
			}

			const hasAccess = await authorizeAnyRole(userId, roleNames);

			if (!hasAccess) {
				return res.status(403).json({
					error: 'Forbidden',
					message: `One of these roles is required: ${roleNames.join(', ')}`,
					requiredRoles: roleNames,
				});
			}

			next();
		} catch (error) {
			console.error('Authorization middleware error:', error);
			res.status(500).json({ error: 'Internal server error', message: 'Authorization check failed' });
		}
	};
}

async function canAccessResource(userId, resourceType, resourceId) {
	if (!userId || !resourceType || !resourceId) {
		return false;
	}

	try {
		let query;

		switch (resourceType) {
			case 'invoice':
				query = `
					SELECT 1 FROM invoices i
					WHERE i.id = $1 AND (
						i.created_by = $2 OR
						i.tenant_id = (SELECT user_id FROM users WHERE id = $2) OR
						EXISTS (
							SELECT 1 FROM user_roles ur
							JOIN roles r ON ur.role_id = r.id
							WHERE ur.user_id = $2 AND r.name IN ('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT')
						)
					)
				`;
				break;
			case 'payment':
				query = `
					SELECT 1 FROM payments p
					WHERE p.id = $1 AND (
						p.processed_by = $2 OR
						EXISTS (
							SELECT 1 FROM user_roles ur
							JOIN roles r ON ur.role_id = r.id
							WHERE ur.user_id = $2 AND r.name IN ('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT')
						)
					)
				`;
				break;
			case 'contract':
				query = `
					SELECT 1 FROM contracts c
					WHERE c.id = $1 AND (
						c.created_by = $2 OR
						c.tenant_id = (SELECT user_id FROM users WHERE id = $2) OR
						EXISTS (
							SELECT 1 FROM user_roles ur
							JOIN roles r ON ur.role_id = r.id
							WHERE ur.user_id = $2 AND r.name IN ('SUPER_ADMIN', 'OWNER', 'AGENCY')
						)
					)
				`;
				break;
			default:
				return false;
		}

		const { rows } = await pool.query(query, [resourceId, userId]);
		return rows.length > 0;
	} catch (error) {
		console.error('Resource access check failed:', error);
		return false;
	}
}

function requireResourceAccess(resourceType, resourceIdParam = 'id') {
	return async (req, res, next) => {
		try {
			const userId = req.user?.id;
			const resourceId = req.params[resourceIdParam];

			if (!userId) {
				await logUnauthorizedAttempt(req, 'User not authenticated', resourceType, resourceId);
				return res.status(401).json({ error: 'Unauthorized' });
			}

			if (!resourceId) {
				return res.status(400).json({ error: 'Resource ID is required' });
			}

			const hasAccess = await canAccessResource(userId, resourceType, resourceId);

			if (!hasAccess) {
				try {
					await auditService.logAccess({
						userId,
						action: 'forbidden_resource_access',
						entityType: resourceType,
						entityId: Number.parseInt(resourceId, 10) || null,
						ipAddress: req.auditInfo?.ipAddress,
						userAgent: req.auditInfo?.userAgent,
						requestId: req.requestId,
						status: 'denied',
						errorMessage: `Access denied to ${resourceType} ${resourceId}`,
					});
				} catch (auditError) {
					console.error('Error logging forbidden resource access:', auditError);
				}

				return res.status(403).json({
					error: 'Forbidden',
					message: `You don't have access to this ${resourceType}`,
				});
			}

			next();
		} catch (error) {
			console.error('Resource access middleware error:', error);
			res.status(500).json({ error: 'Internal server error' });
		}
	};
}

async function logUnauthorizedAttempt(req, reason, entityType = 'authorization', entityId = null) {
	try {
		await auditService.logAccess({
			userId: 0,
			action: 'unauthorized_access',
			entityType,
			entityId: entityId ? Number.parseInt(entityId, 10) || null : null,
			description: reason,
			ipAddress: req.auditInfo?.ipAddress,
			userAgent: req.auditInfo?.userAgent,
			requestId: req.requestId,
			status: 'denied',
			errorMessage: reason,
		});
	} catch (error) {
		console.error('Failed to log unauthorized attempt:', error);
	}
}

// -----------------------------------------------------------------------------
// Request-scoped caching utilities
// -----------------------------------------------------------------------------

const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // five minutes

function getCachedPermissions(userId) {
	const cacheKey = `user_${userId}_perms`;
	const cached = permissionCache.get(cacheKey);

	if (cached && cached.expires > Date.now()) {
		return cached.data;
	}

	permissionCache.delete(cacheKey);
	return null;
}

function cachePermissions(userId, permissions) {
	permissionCache.set(`user_${userId}_perms`, {
		data: permissions,
		expires: Date.now() + CACHE_TTL,
	});
}

function clearPermissionCache(userId) {
	permissionCache.delete(`user_${userId}_perms`);
}

async function attachUserContext(req, res, next) {
	try {
		if (req.user?.id) {
			let permissions = getCachedPermissions(req.user.id);

			if (!permissions) {
				permissions = await getUserPermissions(req.user.id);
				cachePermissions(req.user.id, permissions);
			}

			const roles = await getUserRoles(req.user.id);

			req.user.permissions = permissions;
			req.user.roles = roles;

			req.user.hasPermission = (permCode) => permissions.includes(permCode);
			req.user.hasAnyPermission = (permCodes) => permCodes.some((code) => permissions.includes(code));
			req.user.hasAllPermissions = (permCodes) => permCodes.every((code) => permissions.includes(code));
			req.user.hasRole = (roleName) => roles.includes(roleName);
		}

		next();
	} catch (error) {
		console.error('Error attaching user context:', error);
		res.status(500).json({ error: 'Internal server error', message: 'Failed to load user context' });
	}
}

// -----------------------------------------------------------------------------
// Rate limiting & audit logging helpers
// -----------------------------------------------------------------------------

function rateLimitAuthAttempts(maxAttempts = 100, windowSeconds = 60) {
	const attempts = new Map();

	return (req, res, next) => {
		const userId = req.user?.id;
		if (!userId) {
			return next();
		}

		const key = `auth_${userId}`;
		const now = Date.now();
		const windowStart = now - windowSeconds * 1000;

		let record = attempts.get(key) || { timestamps: [] };
		record.timestamps = record.timestamps.filter((timestamp) => timestamp > windowStart);

		if (record.timestamps.length >= maxAttempts) {
			return res.status(429).json({
				error: 'Too Many Requests',
				message: 'Too many authorization attempts. Please try again later.',
				retryAfter: windowSeconds,
			});
		}

		record.timestamps.push(now);
		attempts.set(key, record);

		if (attempts.size > 10000) {
			for (const [attemptKey, value] of attempts.entries()) {
				if ((value.timestamps[0] || 0) < windowStart) {
					attempts.delete(attemptKey);
				}
			}
		}

		next();
	};
}

function logAuthorizationDecisions(req, res, next) {
	const originalSend = res.send;

	res.send = function patchedSend(payload) {
		if ([401, 403].includes(res.statusCode) && req.user) {
			auditService
				.logAccess({
					userId: req.user.id,
					action: 'authorization_failure',
					entityType: 'authorization',
					description: `${res.statusCode} on ${req.method} ${req.path}`,
					ipAddress: req.auditInfo?.ipAddress,
					userAgent: req.auditInfo?.userAgent,
					requestId: req.requestId,
					status: 'denied',
				})
				.catch((error) => console.error('Error logging auth decision:', error));
		}

		return originalSend.call(this, payload);
	};

	next();
}

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

const exportedAuthorize = Object.assign(authorize, {
	authorize,
	checkPermission,
	authorizeAny,
	authorizeAll,
	authorizeRole,
	authorizeAnyRole,
	getUserPermissions,
	getUserRoles,
	canAccessResource,
	requirePermission,
	requireAnyPermission,
	requireAllPermissions,
	requireRole,
	requireAnyRole,
	requireResourceAccess,
	attachUserContext,
	rateLimitAuthAttempts,
	logAuthorizationDecisions,
	getCachedPermissions,
	cachePermissions,
	clearPermissionCache,
	isAuthorized,
});

module.exports = exportedAuthorize;

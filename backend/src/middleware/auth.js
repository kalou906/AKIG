const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-min-32-chars-required';
const JWT_EXPIRY = '24h';

function extractToken(authHeader) {
  if (!authHeader) return null;
  if (typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }
    return authHeader.trim();
  }
  return null;
}

function normalizeRolesFromPayload(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.roles)) {
    return payload.roles.map((role) => String(role).toUpperCase());
  }
  if (payload.role) {
    return [String(payload.role).toUpperCase()];
  }
  if (Array.isArray(payload.userRoles)) {
    return payload.userRoles.map((role) => String(role).toUpperCase());
  }
  return [];
}

function attachUserToRequest(req, payload) {
  const roles = normalizeRolesFromPayload(payload);
  req.user = {
    ...payload,
    roles,
    role: payload.role || roles[0] || null
  };
}

function verifyToken(token, options = {}) {
  if (!token) {
    throw new Error('Token missing');
  }
  return jwt.verify(token, JWT_SECRET, options);
}

function handleAuthFailure(res, status, message) {
  return res.status(status).json({ success: false, error: message });
}

function authenticateRequest(req, res, next, { optional = false, roles = [] } = {}) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = extractToken(authHeader) || req.cookies?.token || req.query?.token;

  if (!token) {
    if (optional) {
      return next();
    }
    return handleAuthFailure(res, 401, 'Missing authorization token');
  }

  try {
    const payload = verifyToken(token);
    attachUserToRequest(req, payload);

    const requiredRoles = normalizeRolesInput(roles);
    if (requiredRoles.length > 0 && !userHasAnyRole(req.user, requiredRoles)) {
      return handleAuthFailure(res, 403, 'Access denied');
    }

    return next();
  } catch (error) {
    return handleAuthFailure(res, 401, 'Invalid or expired token');
  }
}

function normalizeRolesInput(roles) {
  if (!roles) return [];
  if (!Array.isArray(roles)) {
    return [roles].filter(Boolean).map((role) => String(role).toUpperCase());
  }
  return roles.filter(Boolean).map((role) => String(role).toUpperCase());
}

function userHasAnyRole(user, requiredRoles = []) {
  if (!user || !Array.isArray(user.roles)) return false;
  if (requiredRoles.length === 0) return true;
  return requiredRoles.some((role) => user.roles.includes(role));
}

function requireAuth(req, res, next) {
  return authenticateRequest(req, res, next, { optional: false });
}

function optionalAuth(req, res, next) {
  return authenticateRequest(req, res, next, { optional: true });
}

function authorize(roles) {
  const requiredRoles = normalizeRolesInput(roles);
  return (req, res, next) => {
    if (!req.user) {
      return handleAuthFailure(res, 401, 'Authentication required');
    }
    if (!userHasAnyRole(req.user, requiredRoles)) {
      return handleAuthFailure(res, 403, 'Access denied');
    }
    return next();
  };
}

function requireRole(...roles) {
  return authorize(roles.length === 1 ? roles[0] : roles);
}

function auth(roles) {
  const requiredRoles = normalizeRolesInput(roles);
  return (req, res, next) => authenticateRequest(req, res, next, { optional: false, roles: requiredRoles });
}

function createToken(user, expiresIn = JWT_EXPIRY) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    roles: user.roles || (user.role ? [user.role] : undefined)
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

const baseAuthMiddleware = (req, res, next) => requireAuth(req, res, next);

const exported = Object.assign(baseAuthMiddleware, {
  authenticate: requireAuth,
  authenticateJWT: requireAuth,
  authenticateToken: requireAuth,
  authMiddleware: baseAuthMiddleware,
  requireAuth,
  optionalAuth,
  authenticateOptional: optionalAuth,
  authorize,
  requireRole,
  auth,
  extractToken,
  createToken,
  verifyToken,
  default: baseAuthMiddleware
});

module.exports = exported;

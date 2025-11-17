/**
 * 🔐 Middleware: Authentification JWT & RBAC
 */

const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware d'authentification
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token manquant' });
  }

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token invalide' });
  }
};

// Middleware d'autorisation par rôle
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Non authentifié' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Accès refusé - permissions insuffisantes' });
    }

    next();
  };
};

// Rôles disponibles
const ROLES = {
  ADMIN: 'admin',
  AGENT: 'agent',
  LANDLORD: 'landlord',
  TENANT: 'tenant',
};

// Permissions par rôle
const PERMISSIONS = {
  admin: ['read:all', 'create:all', 'update:all', 'delete:all', 'export:all', 'generate:reports'],
  agent: ['read:properties', 'read:clients', 'create:properties', 'update:properties', 'create:contracts', 'read:contracts', 'create:payments'],
  landlord: ['read:own_properties', 'read:own_contracts', 'read:own_payments', 'update:own_properties'],
  tenant: ['read:own_contracts', 'read:own_payments', 'submit:maintenance_request'],
};

// Middleware de permission granulaire
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Non authentifié' });
    }

    const userPermissions = PERMISSIONS[req.user.role] || [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ success: false, error: 'Permission refusée' });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  authorize,
  hasPermission,
  ROLES,
  PERMISSIONS
};

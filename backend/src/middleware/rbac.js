/**
 * RBAC (Role-Based Access Control) Middleware & Utils
 * Provides authorization checks based on roles and permissions
 */

const pool = require('../db');

/**
 * Get user roles and permissions
 */
async function getUserPermissions(userId) {
  try {
    const result = await pool.query(
      `SELECT DISTINCT p.code, p.category 
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       JOIN role_permissions rp ON r.id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows.map(row => row.code);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    throw error;
  }
}

/**
 * Get user roles
 */
async function getUserRoles(userId) {
  try {
    const result = await pool.query(
      `SELECT DISTINCT r.name, r.id
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows.map(row => row.name);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    throw error;
  }
}

/**
 * Check if user has a specific permission
 */
async function hasPermission(userId, permissionCode) {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permissionCode);
}

/**
 * Check if user has any of the specified permissions
 */
async function hasAnyPermission(userId, permissionCodes) {
  const permissions = await getUserPermissions(userId);
  return permissionCodes.some(code => permissions.includes(code));
}

/**
 * Check if user has all specified permissions
 */
async function hasAllPermissions(userId, permissionCodes) {
  const permissions = await getUserPermissions(userId);
  return permissionCodes.every(code => permissions.includes(code));
}

/**
 * Check if user has a specific role
 */
async function hasRole(userId, roleName) {
  const roles = await getUserRoles(userId);
  return roles.includes(roleName);
}

/**
 * Assign role to user
 */
async function assignRoleToUser(userId, roleName, assignedBy) {
  try {
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [roleName]
    );
    
    if (roleResult.rows.length === 0) {
      throw new Error(`Role "${roleName}" not found`);
    }
    
    const roleId = roleResult.rows[0].id;
    
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId, assignedBy]
    );
    
    return { userId, roleName, assignedAt: new Date() };
  } catch (error) {
    console.error('Error assigning role:', error);
    throw error;
  }
}

/**
 * Remove role from user
 */
async function removeRoleFromUser(userId, roleName) {
  try {
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [roleName]
    );
    
    if (roleResult.rows.length === 0) {
      throw new Error(`Role "${roleName}" not found`);
    }
    
    const roleId = roleResult.rows[0].id;
    
    await pool.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );
    
    return { userId, roleName, removedAt: new Date() };
  } catch (error) {
    console.error('Error removing role:', error);
    throw error;
  }
}

/**
 * Express middleware for permission-based authorization
 * Usage: app.get('/protected', requirePermission('INVOICE_VIEW'), handler)
 */
function requirePermission(permissionCode) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const hasAccess = await hasPermission(userId, permissionCode);
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: `Permission "${permissionCode}" required`
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Express middleware for role-based authorization
 * Usage: app.get('/admin', requireRole('SUPER_ADMIN'), handler)
 */
function requireRole(roleName) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const hasAccess = await hasRole(userId, roleName);
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: `Role "${roleName}" required`
        });
      }
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Express middleware for multiple permission checks
 */
function requireAnyPermission(permissionCodes) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const hasAccess = await hasAnyPermission(userId, permissionCodes);
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: `One of these permissions required: ${permissionCodes.join(', ')}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Express middleware to attach user permissions to request object
 */
async function attachUserPermissions(req, res, next) {
  try {
    if (req.user?.id) {
      req.user.permissions = await getUserPermissions(req.user.id);
      req.user.roles = await getUserRoles(req.user.id);
    }
    next();
  } catch (error) {
    console.error('Error attaching permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getUserPermissions,
  getUserRoles,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  assignRoleToUser,
  removeRoleFromUser,
  requirePermission,
  requireRole,
  requireAnyPermission,
  attachUserPermissions,
};

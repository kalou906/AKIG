/**
 * ============================================================
 * backend/src/middlewares/audit-trail.js - Audit Trail Middleware
 * Enregistre toutes les actions utilisateur pour conformité/traçabilité
 * ============================================================
 */

const { pool } = require("../db");

/**
 * Middleware pour capturer toutes les actions
 */
const auditTrail = (req, res, next) => {
  // Sauvegarder la méthode send originale
  const originalSend = res.send;

  // Intercepter la réponse
  res.send = function (data) {
    // Enregistrer l'audit après la réponse
    logAuditEvent(req, res, data).catch((err) =>
      console.error("Audit logging error:", err)
    );

    // Appeler la méthode originale
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Logger un événement d'audit
 */
async function logAuditEvent(req, res, responseData) {
  try {
    // Skip certaines routes non critiques
    const skipPaths = [
      "/api/health",
      "/api/auth/validate",
      "/api/static",
      "/api/file",
      ".css",
      ".js",
      ".png",
      ".jpg",
    ];

    if (skipPaths.some((path) => req.path.includes(path))) {
      return;
    }

    // Déterminer le type d'action et d'entité
    const { action, entityType, entityId } = parseActionFromRequest(req, res);

    // Récupérer les valeurs avant/après si modification
    let oldValues = null;
    let newValues = null;

    if (action === "UPDATE" || action === "CREATE") {
      newValues = req.body;
      if (action === "UPDATE" && req.previousData) {
        oldValues = req.previousData;
      }
    } else if (action === "DELETE") {
      oldValues = req.deletedData;
    }

    // Déterminer le niveau de criticité
    const severity = determineSeverity(req, action, entityType);

    // Insérer dans audit_events
    await pool.query(
      `INSERT INTO audit_events (
        action, entity_type, entity_id,
        user_id, old_values, new_values,
        status_code, method, path,
        ip_address, user_agent,
        severity, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [
        action,
        entityType,
        entityId,
        req.user?.id || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        res.statusCode,
        req.method,
        req.path,
        getClientIp(req),
        req.get("user-agent") || "unknown",
        severity,
      ]
    );

    // Log console pour actions critiques
    if (severity === "CRITICAL" || severity === "HIGH") {
      console.log(
        `[AUDIT] ${severity}: ${action} ${entityType} ${entityId || ""} by ${
          req.user?.email || "anonymous"
        }`
      );
    }
  } catch (error) {
    console.error("Error logging audit event:", error);
  }
}

/**
 * Parser l'action et l'entité depuis la requête
 */
function parseActionFromRequest(req, res) {
  const method = req.method;
  const path = req.path;
  let action = "UNKNOWN";
  let entityType = "UNKNOWN";
  let entityId = null;

  // Mapper les routes aux actions
  if (path.includes("/payments")) {
    entityType = "payment";
    entityId = req.params.paymentId || req.body.id;
    if (method === "GET") action = "READ";
    else if (method === "POST") action = "CREATE";
    else if (method === "PUT" || method === "PATCH") action = "UPDATE";
    else if (method === "DELETE") action = "DELETE";
  } else if (path.includes("/contracts")) {
    entityType = "contract";
    entityId = req.params.contractId || req.body.id;
    if (method === "GET") action = "READ";
    else if (method === "POST") action = "CREATE";
    else if (method === "PUT" || method === "PATCH") action = "UPDATE";
    else if (method === "DELETE") action = "DELETE";
  } else if (path.includes("/tenants")) {
    entityType = "tenant";
    entityId = req.params.tenantId || req.body.id;
    if (method === "GET") action = "READ";
    else if (method === "POST") action = "CREATE";
    else if (method === "PUT" || method === "PATCH") action = "UPDATE";
    else if (method === "DELETE") action = "DELETE";
  } else if (path.includes("/auth/login")) {
    entityType = "authentication";
    action = "LOGIN";
    entityId = req.body.email;
  } else if (path.includes("/auth/logout")) {
    entityType = "authentication";
    action = "LOGOUT";
    entityId = req.user?.id;
  } else if (path.includes("/users")) {
    entityType = "user";
    entityId = req.params.userId || req.body.id;
    if (method === "GET") action = "READ";
    else if (method === "POST") action = "CREATE";
    else if (method === "PUT" || method === "PATCH") action = "UPDATE";
    else if (method === "DELETE") action = "DELETE";
  } else if (path.includes("/properties")) {
    entityType = "property";
    entityId = req.params.propertyId || req.body.id;
    if (method === "GET") action = "READ";
    else if (method === "POST") action = "CREATE";
    else if (method === "PUT" || method === "PATCH") action = "UPDATE";
    else if (method === "DELETE") action = "DELETE";
  } else if (path.includes("/verify")) {
    entityType = "payment_verification";
    action = "VERIFY";
  } else if (path.includes("/export")) {
    entityType = "data_export";
    action = "EXPORT";
  }

  return { action, entityType, entityId };
}

/**
 * Déterminer le niveau de sévérité
 */
function determineSeverity(req, action, entityType) {
  const userRole = req.user?.role;

  // Actions toujours critiques
  if (
    action === "DELETE" ||
    action === "UPDATE" ||
    (action === "VERIFY" && userRole !== "AGENT")
  ) {
    return "CRITICAL";
  }

  // Accès non autorisé
  if (req.statusCode === 403) {
    return "HIGH";
  }

  // Création de paiements = critique
  if (action === "CREATE" && entityType === "payment") {
    return "HIGH";
  }

  // Création d'utilisateurs
  if (action === "CREATE" && entityType === "user") {
    return "HIGH";
  }

  // Lecture par admin/manager
  if (action === "READ" && (userRole === "ADMIN" || userRole === "MANAGER")) {
    return "MEDIUM";
  }

  // Défaut
  return "LOW";
}

/**
 * Middleware pour capturer les données avant modification
 */
const captureBeforeData = (req, res, next) => {
  if (req.method === "PUT" || req.method === "PATCH" || req.method === "DELETE") {
    // Récupérer les données actuelles avant modification
    (async () => {
      try {
        // À implémenter selon les routes
        // req.previousData = await fetchCurrentData(req);
      } catch (error) {
        console.error("Error capturing before data:", error);
      }
    })();
  }
  next();
};

/**
 * Endpoint pour consulter l'audit trail
 */
const getAuditTrail = async (req, res) => {
  try {
    const {
      action,
      entity_type,
      user_id,
      days = 30,
      limit = 100,
      offset = 0,
    } = req.query;

    let query = `
      SELECT ae.*, u.email as user_email
      FROM audit_events ae
      LEFT JOIN users u ON ae.user_id = u.id
      WHERE ae.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
    `;

    const params = [];

    if (action) {
      query += ` AND ae.action = $${params.length + 1}`;
      params.push(action.toUpperCase());
    }

    if (entity_type) {
      query += ` AND ae.entity_type = $${params.length + 1}`;
      params.push(entity_type);
    }

    if (user_id) {
      query += ` AND ae.user_id = $${params.length + 1}`;
      params.push(user_id);
    }

    query += ` ORDER BY ae.created_at DESC
               LIMIT $${params.length + 1}
               OFFSET $${params.length + 2}`;

    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Endpoint pour exporter audit trail en CSV
 */
const exportAuditTrail = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const result = await pool.query(
      `SELECT
         ae.created_at, ae.action, ae.entity_type, ae.entity_id,
         ae.status_code, ae.method, ae.path,
         ae.ip_address, ae.severity,
         u.email as user_email
       FROM audit_events ae
       LEFT JOIN users u ON ae.user_id = u.id
       WHERE ae.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
       ORDER BY ae.created_at DESC`
    );

    // Générer CSV
    const headers = [
      "Date/Heure",
      "Action",
      "Type",
      "ID",
      "Code",
      "Méthode",
      "Chemin",
      "IP",
      "Sévérité",
      "Utilisateur",
    ];

    let csv = headers.join(",") + "\n";

    result.rows.forEach((row) => {
      csv += [
        row.created_at,
        row.action,
        row.entity_type,
        row.entity_id || "",
        row.status_code,
        row.method,
        row.path,
        row.ip_address,
        row.severity,
        row.user_email || "",
      ]
        .map((v) => `"${v || ""}"`)
        .join(",");
      csv += "\n";
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="audit_trail_${new Date().getTime()}.csv"`
    );
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Utilitaires
 */
function getClientIp(req) {
  return (
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

module.exports = {
  auditTrail,
  captureBeforeData,
  getAuditTrail,
  exportAuditTrail,
  logAuditEvent,
  parseActionFromRequest,
  determineSeverity,
};

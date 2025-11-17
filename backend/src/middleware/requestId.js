const crypto = require('crypto');

/**
 * Middleware pour générer et tracker les IDs de requête
 */
module.exports = (req, res, next) => {
  // Générer ou récupérer l'ID de requête
  req.reqId = req.headers['x-request-id'] || crypto.randomUUID();
  
  // Envoyer l'ID de requête dans la réponse
  res.setHeader('X-Request-Id', req.reqId);

  // Logger structuré pour les événements
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    type: 'request_start',
    requestId: req.reqId,
    userId: req.user?.id || null,
    userRole: req.user?.role || null,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
  };

  console.log('[REQUEST]', JSON.stringify(logEntry));

  // Tracker la fin de la requête
  const startTime = Date.now();
  
  // Intercepter la fin de la réponse
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;

    // Logger la fin de la requête
    const responseLog = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 400 ? 'warn' : 'info',
      type: 'request_complete',
      requestId: req.reqId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: duration,
      userId: req.user?.id || null,
    };

    console.log('[RESPONSE]', JSON.stringify(responseLog));

    // Appeler la méthode originale
    return originalSend.call(this, data);
  };

  // Passer au middleware suivant
  next();
};

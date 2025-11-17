// Simple audit-trail middleware (written inside container)
module.exports = function auditTrail(req, res, next) {
  try {
    req.audit = req.audit || { requestId: req.requestId || null, userId: req.user ? req.user.id : null, startAt: Date.now() };
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      if (req.path && req.path.startsWith('/api/')) {
        console.debug('[audit-trail] ' + req.method + ' ' + req.path + ' id=' + (req.audit.requestId || '-'));
      }
    }
  } catch (err) {
    console.warn('audit-trail middleware error:', err && err.message);
  }
  return next();
};

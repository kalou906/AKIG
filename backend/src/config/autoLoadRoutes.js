/**
 * Auto-loading des routes
 * Remplace les 60+ require() hardcodés
 * Charge automatiquement tous les fichiers route .js dans src/routes/
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, '../routes');

/**
 * Charger automatiquement toutes les routes
 * Convention de nommage: {moduleName}.routes.js ou {moduleName}.js
 * @param {Express.Application} app - L'application Express
 * @param {Object} options - Options (prefix, authMiddleware, etc.)
 */
function autoLoadRoutes(app, options = {}) {
  const { prefix = '/api', authMiddleware = null, logger = console } = options;

  if (!fs.existsSync(ROUTES_DIR)) {
    logger.error(`❌ Routes directory not found: ${ROUTES_DIR}`);
    return [];
  }

  const loadedRoutes = [];
  let errorCount = 0;

  // Lire tous les fichiers .js dans src/routes/
  fs.readdirSync(ROUTES_DIR)
    .filter((file) => file.endsWith('.js') && file !== 'index.js' && !file.startsWith('_'))
    .forEach((file) => {
      try {
        const routePath = path.join(ROUTES_DIR, file);
        const moduleName = file.replace('.js', '').replace('.routes', '');

        // Charger le module
        const routeModule = require(routePath);

        // Déterminer le type de route (fonction, objet Router, etc.)
        let router;
        let needsAuth = false;

        if (typeof routeModule === 'function') {
          // Si c'est une fonction (factory pattern), l'appeler
          router = routeModule();
          needsAuth = routeModule.protected === true; // Convention
        } else if (routeModule && typeof routeModule === 'object') {
          // Si c'est déjà un router
          router = routeModule;
          needsAuth = routeModule.protected === true;
        } else {
          throw new Error(`Module ${file} n'exporte pas un router valide`);
        }

        // Enregistrer la route
        const routePath_final = `${prefix}/${moduleName}`;
        const middleware = needsAuth && authMiddleware ? [authMiddleware] : [];

        if (middleware.length > 0) {
          app.use(routePath_final, middleware, router);
        } else {
          app.use(routePath_final, router);
        }

        loadedRoutes.push({
          module: moduleName,
          path: routePath_final,
          protected: needsAuth,
          file: file,
        });

        logger.log(`✅ Route chargée : ${moduleName} → ${routePath_final}${needsAuth ? ' [Protected]' : ''}`);
      } catch (error) {
        logger.error(`❌ Erreur chargement route ${file}: ${error.message}`);
        errorCount++;
      }
    });

  if (errorCount > 0) {
    logger.warn(`⚠️  ${errorCount} route(s) n'ont pas pu être chargées`);
  }

  logger.log(`\n📊 Routes chargées : ${loadedRoutes.length} modules`);
  return loadedRoutes;
}

module.exports = {
  autoLoadRoutes,
};

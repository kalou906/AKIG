/**
 * Exemple d'utilisation de la validation Joi
 * À ajouter dans les routes
 * 
 * EXEMPLE 1: Auth
 */

// backend/src/routes/auth.js
const { validateBody } = require('../middleware/validate.middleware');
const { authSchemas } = require('../schemas/validation.schemas');

// router.post('/login', validateBody(authSchemas.login), controller.login);
// router.post('/register', validateBody(authSchemas.register), controller.register);

/**
 * EXEMPLE 2: Locataires
 */

// backend/src/routes/tenants.js
const { tenantSchemas } = require('../schemas/validation.schemas');

// router.post('/locataires', 
//   validateBody(tenantSchemas.create),
//   controller.create
// );

// router.put('/locataires/:id', 
//   validateBody(tenantSchemas.update),
//   controller.update
// );

/**
 * EXEMPLE 3: Contrats
 */

// backend/src/routes/contracts.js
const { contractSchemas } = require('../schemas/validation.schemas');

// router.post('/contrats',
//   validateBody(contractSchemas.create),
//   controller.create
// );

// router.put('/contrats/:id',
//   validateBody(contractSchemas.update),
//   controller.update
// );

/**
 * EXEMPLE 4: Paiements
 */

// backend/src/routes/payments.js
const { paymentSchemas } = require('../schemas/validation.schemas');

// router.post('/paiements',
//   validateBody(paymentSchemas.create),
//   controller.create
// );

/**
 * EXEMPLE 5: Query params
 */

// router.get('/impayes',
//   validateQuery(arrearsSchemas.query),
//   controller.list
// );

module.exports = {
  examples: {
    auth: `router.post('/login', validateBody(authSchemas.login), controller.login)`,
    tenant: `router.post('/locataires', validateBody(tenantSchemas.create), controller.create)`,
    contract: `router.post('/contrats', validateBody(contractSchemas.create), controller.create)`,
    payment: `router.post('/paiements', validateBody(paymentSchemas.create), controller.create)`
  }
};

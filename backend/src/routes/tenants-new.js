/**
 * Nouveau point d'entrée pour la gestion des locataires.
 * Actuellement, il réutilise la logique consolidée de tenants.js
 * pour éviter la duplication de code. Les évolutions futures
 * pourront spécialiser ce module si nécessaire.
 */

const express = require('express');
const legacyTenantsRouter = require('./tenants');

const router = express.Router();

router.use('/', legacyTenantsRouter);

module.exports = router;

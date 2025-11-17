// Aggregated API Router (v1 contract)
// Only stable, normalized resources mounted here.

const express = require('express');
const router = express.Router();

// Core domain
router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/roles', require('./roles'));
router.use('/tenants', require('./tenants'));
// Extensions spécifiques (solvabilité)
try { router.use('/tenants', require('./tenants-extra')); } catch (_) {}
router.use('/properties', require('./properties'));
router.use('/contracts', require('./contracts'));
router.use('/payments', require('./payments'));
router.use('/mobile-money', require('./mobileMoney'));

// Reporting
try { router.use('/reports', require('./reports')); } catch (_) {}
try { router.use('/exports', require('./exports')); } catch (_) {}

// Ops essentials
try { router.use('/alerts', require('./alerts')); } catch (_) {}
try { router.use('/maintenance', require('./maintenance')); } catch (_) {}

// Health
router.use('/health', require('./health'));

module.exports = router;

/**
 * 🚀 AKIG Advanced Features Routes
 * Integrates: Security, AI, Offline, Strategic, Gamification, UX, Scalability, Advanced-AI, Public-API
 */

const express = require('express');
const router = express.Router();

// Service imports
const securityService = require('../services/security.service');
const aiPrescriptiveService = require('../services/ai-prescriptive.service');
// const offlineService = require('../services/offline.service'); // Replaced by ux-offline-accessibility.service
const strategicService = require('../services/strategic-piloting.service');
const gamificationService = require('../services/gamification-training.service');
const uxOfflineService = require('../services/ux-offline-accessibility.service');
const scalabilityService = require('../services/scalability-multicountry.service');
const advancedAIService = require('../services/advanced-ai.service');
const publicAPIService = require('../services/public-api.service');

// ==================== SECURITY ROUTES ====================

// 2FA/MFA
router.post('/security/2fa/generate', async (req, res) => {
  try {
    const { userId, method } = req.body;
    const result = await securityService.generateMFACode(userId, method || 'email');
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/security/2fa/verify', async (req, res) => {
  try {
    const { userId, code } = req.body;
    const result = await securityService.verifyMFACode(userId, code);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Anomaly Detection
router.post('/security/anomalies/detect', async (req, res) => {
  try {
    const { userId, context } = req.body;
    const result = await securityService.detectLoginAnomalies(userId, context);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Audit Trail
router.get('/security/audit-trail/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit || 100;
    const result = await securityService.getAuditTrail(userId, limit);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== AI PRESCRIPTIVE ROUTES ====================

router.get('/recommendations/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const recommendations = await aiPrescriptiveService.generateRecommendations(agentId);
    res.json(recommendations);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/tasks/distribute', async (req, res) => {
  try {
    const { agentIds, tasks } = req.body;
    const distribution = await aiPrescriptiveService.distributeTasksIntelligently(agentIds, tasks);
    res.json(distribution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Predictions
router.get('/predictions/churn/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const predictions = await aiPrescriptiveService.predictTenantDepartures(agentId);
    res.json(predictions);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/predictions/payments/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const risks = await aiPrescriptiveService.identifyPaymentRisks(agentId);
    res.json(risks);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== STRATEGIC PILOTING ROUTES ====================

router.get('/kpi/strategic/:agencyId', async (req, res) => {
  try {
    const { agencyId } = req.params;
    const kpis = await strategicService.calculateStrategicKPIs(agencyId);
    res.json(kpis);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/benchmark/:agencyId', async (req, res) => {
  try {
    const { agencyId } = req.params;
    const limit = req.query.limit || 10;
    const benchmark = await strategicService.benchmarkAgency(agencyId, limit);
    res.json(benchmark);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/forecast/cashflow/:agencyId', async (req, res) => {
  try {
    const { agencyId } = req.params;
    const months = req.query.months || 12;
    const forecast = await strategicService.forecastCashFlow(agencyId, months);
    res.json(forecast);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== GAMIFICATION ROUTES ====================

router.post('/gamification/badges/award', async (req, res) => {
  try {
    const { agentId, badgeType } = req.body;
    const result = await gamificationService.awardBadge(agentId, badgeType);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/gamification/leaderboard/:agencyId', async (req, res) => {
  try {
    const { agencyId } = req.params;
    const period = req.query.period || 'month';
    const limit = req.query.limit || 10;
    const leaderboard = await gamificationService.getLeaderboard(agencyId, period, limit);
    res.json(leaderboard);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/gamification/performance/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const months = req.query.months || 12;
    const history = await gamificationService.getPerformanceHistory(agentId, months);
    res.json(history);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/gamification/training', (req, res) => {
  try {
    const modules = gamificationService.getTrainingModules();
    res.json(modules);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/gamification/training/complete', async (req, res) => {
  try {
    const { agentId, moduleId, quizScore } = req.body;
    const result = await gamificationService.completeTraining(agentId, moduleId, quizScore);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/gamification/incidents', (req, res) => {
  try {
    const runbooks = gamificationService.getIncidentRunbooks();
    res.json(runbooks);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== UX & ACCESSIBILITY ROUTES ====================

router.get('/ux/accessibility/:component', (req, res) => {
  try {
    const { component } = req.params;
    const checklist = uxService.getAccessibilityChecklist(component);
    res.json(checklist);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/ux/theme', (req, res) => {
  try {
    const themes = uxService.getThemeConfig();
    res.json(themes);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/ux/preferences', async (req, res) => {
  try {
    const { userId } = req.user;
    const preferences = req.body;
    const result = await uxService.savePreferences(userId, preferences);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/ux/onboarding/:userRole', (req, res) => {
  try {
    const { userRole } = req.params;
    const tutorial = uxService.getOnboardingTutorial(userRole);
    res.json(tutorial);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/ux/tutorial/complete', async (req, res) => {
  try {
    const { userId } = req.user;
    const { tutorialKey } = req.body;
    await uxService.completeTutorial(userId, tutorialKey);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/ux/performance', (req, res) => {
  try {
    const metrics = uxService.getPerformanceMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/ux/localization/:language', (req, res) => {
  try {
    const { language } = req.params;
    const strings = uxService.getLocalizationStrings(language);
    res.json(strings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== SCALABILITY & MULTI-COUNTRY ROUTES ====================

router.get('/scalability/country/:countryCode', (req, res) => {
  try {
    const { countryCode } = req.params;
    const config = scalabilityService.getCountryConfig(countryCode);
    res.json(config);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/scalability/currency/convert', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    const result = await scalabilityService.convertCurrency(amount, fromCurrency, toCurrency);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/scalability/taxes/calculate', (req, res) => {
  try {
    const { countryCode, grossAmount } = req.body;
    const result = scalabilityService.calculateTaxes(countryCode, grossAmount);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/scalability/compliance/deposit', (req, res) => {
  try {
    const { countryCode, monthlyRent, depositAmount } = req.body;
    const result = scalabilityService.validateDepositCompliance(countryCode, monthlyRent, depositAmount);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/scalability/endpoints', (req, res) => {
  try {
    const endpoints = scalabilityService.getDataResidencyEndpoints();
    res.json(endpoints);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/scalability/dr-plan', (req, res) => {
  try {
    const plan = scalabilityService.getDisasterRecoveryPlan();
    res.json(plan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/scalability/architecture', (req, res) => {
  try {
    const arch = scalabilityService.getMultiRegionArchitecture();
    res.json(arch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/scalability/compliance/:countryCode', (req, res) => {
  try {
    const { countryCode } = req.params;
    const checklist = scalabilityService.getComplianceChecklist(countryCode);
    res.json(checklist);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== ADVANCED AI/ML ROUTES ====================

router.get('/ai/tensorflow-config', (req, res) => {
  try {
    const config = advancedAIService.getTensorFlowConfig();
    res.json(config);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/ai/churn/:leaseId', async (req, res) => {
  try {
    const { leaseId } = req.params;
    const prediction = await advancedAIService.predictTenantChurn(leaseId);
    res.json(prediction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/ai/payment-risk/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const risk = await advancedAIService.scorePaymentRisk(tenantId);
    res.json(risk);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/ai/demand-forecast/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const months = req.query.months || 12;
    const forecast = await advancedAIService.forecastRentalDemand(locationId, months);
    res.json(forecast);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/ai/property-valuation/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const valuation = await advancedAIService.valuateProperty(propertyId);
    res.json(valuation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/ai/anomalies/detect', async (req, res) => {
  try {
    const { entityType, data } = req.body;
    const anomalies = await advancedAIService.detectAnomalies(entityType, data);
    res.json(anomalies);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== PUBLIC API ROUTES ====================

router.post('/api/keys/generate', async (req, res) => {
  try {
    const { partnerId, name } = req.body;
    const key = await publicAPIService.generateAPIKey(partnerId, name);
    res.json(key);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/api/oauth/config', (req, res) => {
  try {
    const config = publicAPIService.getOAuth2Config();
    res.json(config);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/api/rest/spec', (req, res) => {
  try {
    const spec = publicAPIService.getRESTAPISpec();
    res.json(spec);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/api/graphql/spec', (req, res) => {
  try {
    const spec = publicAPIService.getGraphQLSpec();
    res.json(spec);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/api/webhooks/:partnerId', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const webhooks = await publicAPIService.manageWebhooks('list', { partnerId });
    res.json(webhooks);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/api/webhooks', async (req, res) => {
  try {
    const webhook = await publicAPIService.manageWebhooks('create', req.body);
    res.json(webhook);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/api/rate-limit', (req, res) => {
  try {
    const config = publicAPIService.getRateLimitConfig();
    res.json(config);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/api/marketplace', (req, res) => {
  try {
    const marketplace = publicAPIService.getIntegrationMarketplace();
    res.json(marketplace);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== GAMIFICATION & TRAINING ROUTES ====================

// Badge system
router.get('/gamification/badges', (req, res) => {
  try {
    const system = gamificationService.getBadgeSystem();
    res.json({ success: true, system });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Award badge
router.post('/gamification/badges/award', async (req, res) => {
  try {
    const { userId, badgeId, reason } = req.body;
    const result = await gamificationService.awardBadge(req.pool, userId, badgeId, reason);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get leaderboard
router.get('/gamification/leaderboard/:agencyId', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const result = await gamificationService.getLeaderboard(
      req.pool,
      req.params.agencyId,
      period
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Training modules
router.get('/training/modules', (req, res) => {
  try {
    const modules = gamificationService.getTrainingModules();
    res.json({ success: true, modules });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Track training progress
router.post('/training/progress', async (req, res) => {
  try {
    const { userId, moduleId, sectionId, score } = req.body;
    const result = await gamificationService.trackTrainingProgress(
      req.pool,
      userId,
      moduleId,
      sectionId,
      score
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Incident runbooks
router.get('/training/runbooks', (req, res) => {
  try {
    const runbooks = gamificationService.getIncidentRunbooks();
    res.json({ success: true, runbooks });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// User gamification profile
router.get('/gamification/profile/:userId', async (req, res) => {
  try {
    const result = await gamificationService.getUserGamificationProfile(
      req.pool,
      req.params.userId
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== SCALABILITY & MULTI-COUNTRY ROUTES ====================

// Country configurations
router.get('/scalability/countries', (req, res) => {
  try {
    const config = scalabilityService.getCountryConfigurations();
    res.json({ success: true, config });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Currency rates
router.get('/scalability/currencies', async (req, res) => {
  try {
    const rates = await scalabilityService.getCurrencyRates(req.pool);
    res.json({ success: true, rates });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Convert currency
router.post('/scalability/convert-currency', (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    const result = scalabilityService.convertCurrency(amount, fromCurrency, toCurrency);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Calculate taxes
router.post('/scalability/calculate-taxes', (req, res) => {
  try {
    const { amount, countryCode, entityType } = req.body;
    const result = scalabilityService.calculateTaxes(amount, countryCode, entityType);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Validate deposit compliance
router.post('/scalability/validate-deposit', (req, res) => {
  try {
    const { amount, countryCode, propertyType } = req.body;
    const result = scalabilityService.validateDepositCompliance(
      amount,
      countryCode,
      propertyType
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Disaster recovery plan
router.get('/scalability/disaster-recovery', (req, res) => {
  try {
    const plan = scalabilityService.getDisasterRecoveryPlan();
    res.json({ success: true, plan });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Multi-region architecture
router.get('/scalability/architecture', (req, res) => {
  try {
    const architecture = scalabilityService.getMultiRegionArchitecture();
    res.json({ success: true, architecture });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Compliance checklist
router.get('/scalability/compliance/:countryCode', (req, res) => {
  try {
    const checklist = scalabilityService.getComplianceChecklist(req.params.countryCode);
    res.json({ success: true, checklist });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Scalability roadmap
router.get('/scalability/roadmap', (req, res) => {
  try {
    const roadmap = scalabilityService.getScalabilityRoadmap();
    res.json({ success: true, roadmap });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== UX OFFLINE & ACCESSIBILITY ROUTES ====================

// IndexedDB client module
router.get('/ux/offline/client', (req, res) => {
  try {
    const clientModule = uxOfflineService.getIndexedDBClientModule();
    res.header('Content-Type', 'application/javascript');
    res.send(clientModule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// WCAG compliance checklist
router.get('/ux/accessibility/wcag', (req, res) => {
  try {
    const checklist = uxOfflineService.getWCAGComplianceChecklist();
    res.json({ success: true, checklist });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Accessibility themes
router.get('/ux/accessibility/themes', (req, res) => {
  try {
    const themes = uxOfflineService.getAccessibilityThemes();
    res.json({ success: true, themes });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Localization config
router.get('/ux/localization/:language', (req, res) => {
  try {
    const config = uxOfflineService.getLocalizationConfig();
    const langConfig = config[req.params.language];

    if (!langConfig) {
      return res.status(400).json({ error: 'Language not supported' });
    }

    res.json({ success: true, config: langConfig });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Onboarding tutorials
router.get('/ux/onboarding/:role', (req, res) => {
  try {
    const tutorials = uxOfflineService.getOnboardingTutorials();
    const roleTutorial = tutorials[req.params.role];

    if (!roleTutorial) {
      return res.status(400).json({ error: 'Role not found' });
    }

    res.json({ success: true, tutorial: roleTutorial });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/api/docs', (req, res) => {
  try {
    const docs = publicAPIService.generateAPIDocumentation();
    res.json(docs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

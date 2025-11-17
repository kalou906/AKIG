/**
 * 🔗 Routes ImmobilierLoyer - Endpoints complets
 * Intégration: Relances, Charges, Fiscalité, SCI, Saisonnier, Bancaire
 */

const express = require('express');
const router = express.Router();

// Imports services (à initialiser dans index.js)
let ReminderService, ChargesService, FiscalReportService, SCIService, 
    SeasonalService, BankSyncService;

// Middleware RBAC (à adapter selon votre config)
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  // Validation JWT...
  next();
};

// ============================================================
// 📧 ROUTES RELANCES - /api/reminders
// ============================================================

router.post('/reminders/send-overdue', authMiddleware, async (req, res) => {
  try {
    const { contractId, method } = req.body;
    const result = await ReminderService.sendOverdueReminder(contractId, method);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/reminders/send-indexation', authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.body;
    const result = await ReminderService.sendIndexationReminder(contractId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/reminders/send-receipt', authMiddleware, async (req, res) => {
  try {
    const { contractId, paymentId } = req.body;
    const result = await ReminderService.sendReceiptReminder(contractId, paymentId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/reminders/send-expiring-contract', authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.body;
    const result = await ReminderService.sendExpiringContractReminder(contractId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/reminders/run-scheduled', authMiddleware, async (req, res) => {
  try {
    const result = await ReminderService.runScheduledReminders();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/reminders/stats', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await ReminderService.getReminderStats(startDate, endDate);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================
// 💰 ROUTES CHARGES - /api/charges
// ============================================================

router.post('/charges', authMiddleware, async (req, res) => {
  try {
    const { contractId, ...chargesData } = req.body;
    const result = await ChargesService.addCharges(contractId, chargesData);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/charges/:contractId', authMiddleware, async (req, res) => {
  try {
    const result = await ChargesService.getContractCharges(req.params.contractId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/charges/:contractId/calculate', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const result = await ChargesService.calculateChargesForPeriod(
      req.params.contractId, startDate, endDate
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/charges/:contractId/regularize', authMiddleware, async (req, res) => {
  try {
    const { year } = req.body;
    const result = await ChargesService.regularizeCharges(req.params.contractId, year);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/charges/:contractId/deposit', authMiddleware, async (req, res) => {
  try {
    const { action, amount } = req.body;
    const result = await ChargesService.handleSecurityDeposit(
      req.params.contractId, action, amount
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/charges/:contractId/statement/:year', authMiddleware, async (req, res) => {
  try {
    const result = await ChargesService.getChargesStatement(
      req.params.contractId, parseInt(req.params.year)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/charges/:contractId/alerts', authMiddleware, async (req, res) => {
  try {
    const result = await ChargesService.checkChargeAlerts(req.params.contractId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================
// 📊 ROUTES FISCALES - /api/fiscal
// ============================================================

router.get('/fiscal/report/:landlordId/:year', authMiddleware, async (req, res) => {
  try {
    const result = await FiscalReportService.generateFiscalReport(
      parseInt(req.params.landlordId), parseInt(req.params.year)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/fiscal/export-pdf/:landlordId/:year', authMiddleware, async (req, res) => {
  try {
    const result = await FiscalReportService.exportFiscalReportPDF(
      parseInt(req.params.landlordId), parseInt(req.params.year)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/fiscal/export-excel/:landlordId/:year', authMiddleware, async (req, res) => {
  try {
    const result = await FiscalReportService.exportFiscalReportExcel(
      parseInt(req.params.landlordId), parseInt(req.params.year)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/fiscal/multi-year/:landlordId/:startYear/:endYear', authMiddleware, async (req, res) => {
  try {
    const result = await FiscalReportService.getMultiYearReport(
      parseInt(req.params.landlordId), 
      parseInt(req.params.startYear),
      parseInt(req.params.endYear)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/fiscal/audit/:landlordId/:year', authMiddleware, async (req, res) => {
  try {
    const result = await FiscalReportService.getFiscalAudit(
      parseInt(req.params.landlordId), parseInt(req.params.year)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================
// 🏢 ROUTES SCI - /api/sci
// ============================================================

router.post('/sci', authMiddleware, async (req, res) => {
  try {
    const result = await SCIService.createSCI(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sci', authMiddleware, async (req, res) => {
  try {
    const result = await SCIService.listSCIs(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sci/:sciId', authMiddleware, async (req, res) => {
  try {
    const result = await SCIService.getSCIDetails(req.params.sciId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sci/:sciId/members', authMiddleware, async (req, res) => {
  try {
    const result = await SCIService.addMemberToSCI(req.params.sciId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sci/:sciId/assign-property/:propertyId', authMiddleware, async (req, res) => {
  try {
    const result = await SCIService.assignPropertyToSCI(req.params.propertyId, req.params.sciId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sci/:sciId/distribute/:month/:year', authMiddleware, async (req, res) => {
  try {
    const result = await SCIService.distributeRevenue(
      req.params.sciId, parseInt(req.params.month), parseInt(req.params.year)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sci/:sciId/financial-report/:year', authMiddleware, async (req, res) => {
  try {
    const result = await SCIService.getSCIFinancialReport(
      req.params.sciId, parseInt(req.params.year)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sci/:sciId/assembly-resolution/:month/:year', authMiddleware, async (req, res) => {
  try {
    const result = await SCIService.generateAssemblyResolution(
      req.params.sciId, parseInt(req.params.month), parseInt(req.params.year)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================
// 🏖️ ROUTES SAISONNIER - /api/seasonal
// ============================================================

router.post('/seasonal/config', authMiddleware, async (req, res) => {
  try {
    const { propertyId, ...config } = req.body;
    const result = await SeasonalService.configureSeasonalProperty(propertyId, config);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/seasonal/reservations', authMiddleware, async (req, res) => {
  try {
    const result = await SeasonalService.createReservation(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/seasonal/reservations/:propertyId', authMiddleware, async (req, res) => {
  try {
    const result = await SeasonalService.listReservations(req.params.propertyId, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/seasonal/reservations/:reservationId/deposit', authMiddleware, async (req, res) => {
  try {
    const result = await SeasonalService.recordDepositPayment(req.params.reservationId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/seasonal/reservations/:reservationId/balance', authMiddleware, async (req, res) => {
  try {
    const result = await SeasonalService.recordBalancePayment(req.params.reservationId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/seasonal/occupancy/:propertyId/:month/:year', authMiddleware, async (req, res) => {
  try {
    const result = await SeasonalService.getOccupancyRate(
      req.params.propertyId, parseInt(req.params.month), parseInt(req.params.year)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/seasonal/pricing-calendar', authMiddleware, async (req, res) => {
  try {
    const { propertyId, pricingRules } = req.body;
    const result = await SeasonalService.setPricingCalendar(propertyId, pricingRules);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/seasonal/price-for-period', authMiddleware, async (req, res) => {
  try {
    const { propertyId, checkInDate, checkOutDate } = req.body;
    const result = await SeasonalService.getPriceForPeriod(propertyId, checkInDate, checkOutDate);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/seasonal/revenue-report/:propertyId/:year', authMiddleware, async (req, res) => {
  try {
    const result = await SeasonalService.getSeasonalRevenueReport(
      req.params.propertyId, parseInt(req.params.year)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================
// 🏦 ROUTES BANCAIRES - /api/bank
// ============================================================

router.post('/bank/import', authMiddleware, async (req, res) => {
  try {
    const { transactions } = req.body;
    const result = await BankSyncService.importBankTransactions(transactions);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/bank/auto-reconcile', authMiddleware, async (req, res) => {
  try {
    const result = await BankSyncService.autoReconcile();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/bank/manual-reconcile', authMiddleware, async (req, res) => {
  try {
    const { bankTransactionId, paymentId } = req.body;
    const result = await BankSyncService.manualReconcile(bankTransactionId, paymentId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/bank/anomalies', authMiddleware, async (req, res) => {
  try {
    const result = await BankSyncService.detectAnomalies();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/bank/reconciliation-report', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await BankSyncService.getReconciliationReport(startDate, endDate);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/bank/validate-integrity', authMiddleware, async (req, res) => {
  try {
    const result = await BankSyncService.validateIntegrity();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = (services) => {
  ReminderService = services.ReminderService;
  ChargesService = services.ChargesService;
  FiscalReportService = services.FiscalReportService;
  SCIService = services.SCIService;
  SeasonalService = services.SeasonalService;
  BankSyncService = services.BankSyncService;
  return router;
};

/**
 * 📊 PHASE 3 - Reports Routes
 * File: backend/src/routes/phase3_reports.js
 * 20 endpoints for comprehensive financial reporting
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');
const ReportingService = require('../services/ReportingService');

// ==================== REPORTING ENDPOINTS ====================

/**
 * 1️⃣ GET /api/phase3/reports/financial-summary
 * Get overall financial summary
 */
router.get('/financial-summary', authMiddleware, async (req, res) => {
  try {
    const { from_date, to_date, property_id, tenant_id } = req.query;
    
    const report = await ReportingService.generateFinancialSummary({
      from_date,
      to_date,
      property_id,
      tenant_id
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error fetching financial summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2️⃣ GET /api/phase3/reports/property/:propertyId
 * Get property performance report
 */
router.get('/property/:propertyId', authMiddleware, async (req, res) => {
  try {
    const report = await ReportingService.generatePropertyReport(req.params.propertyId);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error fetching property report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 3️⃣ GET /api/phase3/reports/tenant/:tenantId/payment-history
 * Get tenant payment history and statistics
 */
router.get('/tenant/:tenantId/payment-history', authMiddleware, async (req, res) => {
  try {
    const report = await ReportingService.generateTenantPaymentHistory(req.params.tenantId);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error fetching tenant payment history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 4️⃣ GET /api/phase3/reports/occupancy
 * Get occupancy and vacancy statistics
 */
router.get('/occupancy', authMiddleware, async (req, res) => {
  try {
    const report = await ReportingService.generateOccupancyReport();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error fetching occupancy report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 5️⃣ GET /api/phase3/reports/arrears
 * Get arrears analysis and outstanding payments
 */
router.get('/arrears', authMiddleware, async (req, res) => {
  try {
    const report = await ReportingService.generateArrearsAnalysis();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error fetching arrears report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 6️⃣ GET /api/phase3/reports/deposits
 * Get deposit status and reconciliation report
 */
router.get('/deposits', authMiddleware, async (req, res) => {
  try {
    const report = await ReportingService.generateDepositStatusReport();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error fetching deposit report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 7️⃣ GET /api/phase3/reports/settlements
 * Get settlement reconciliation report
 */
router.get('/settlements', authMiddleware, async (req, res) => {
  try {
    const { year, property_id } = req.query;
    
    const report = await ReportingService.generateSettlementReconciliationReport({
      year,
      property_id
    });
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error fetching settlements report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 8️⃣ GET /api/phase3/reports/cash-flow
 * Get cash flow analysis
 */
router.get('/cash-flow', authMiddleware, async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    
    const report = await ReportingService.generateCashFlowReport({
      from_date,
      to_date
    });
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error fetching cash flow report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 9️⃣ GET /api/phase3/reports/expenses
 * Get expense breakdown report
 */
router.get('/expenses', authMiddleware, async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    
    const report = await ReportingService.generateExpenseBreakdownReport({
      from_date,
      to_date
    });
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error fetching expense report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 🔟 GET /api/phase3/reports/contract-renewals
 * Get contract renewal analysis
 */
router.get('/contract-renewals', authMiddleware, async (req, res) => {
  try {
    const report = await ReportingService.generateContractRenewalReport();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error fetching contract renewal report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

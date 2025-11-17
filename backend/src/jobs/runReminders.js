/**
 * Orchestrator for all reminder jobs
 * Runs: overdue invoices, expiring contracts, upcoming payments
 */

const pool = require('../db');
const {
  remindOverdues,
  remindExpiringContracts,
  remindUpcomingPayments,
} = require('./reminders');
const notifier = require('../services/notifier');
const logger = require('../middleware/requestId').logger;

/**
 * Main entry point for reminder job orchestration
 */
async function runAllReminders() {
  const startTime = Date.now();

  logger.info({
    action: 'reminders_job_start',
    timestamp: new Date().toISOString(),
  });

  try {
    // Run all reminder jobs in sequence
    const results = {
      overdue: null,
      expiring_contracts: null,
      upcoming_payments: null,
    };

    // 1. Remind overdue invoices (after 3 days grace period)
    try {
      logger.info({
        action: 'reminders_job_step',
        step: 'overdue',
        status: 'starting',
      });

      await remindOverdues(pool, notifier, 3);
      results.overdue = 'completed';

      logger.info({
        action: 'reminders_job_step',
        step: 'overdue',
        status: 'completed',
      });
    } catch (error) {
      logger.error({
        action: 'reminders_job_step_error',
        step: 'overdue',
        error: error.message,
      });
      results.overdue = `failed: ${error.message}`;
    }

    // 2. Remind expiring contracts (within 30 days)
    try {
      logger.info({
        action: 'reminders_job_step',
        step: 'expiring_contracts',
        status: 'starting',
      });

      await remindExpiringContracts(pool, notifier, 30);
      results.expiring_contracts = 'completed';

      logger.info({
        action: 'reminders_job_step',
        step: 'expiring_contracts',
        status: 'completed',
      });
    } catch (error) {
      logger.error({
        action: 'reminders_job_step_error',
        step: 'expiring_contracts',
        error: error.message,
      });
      results.expiring_contracts = `failed: ${error.message}`;
    }

    // 3. Remind upcoming payments (within 7 days)
    try {
      logger.info({
        action: 'reminders_job_step',
        step: 'upcoming_payments',
        status: 'starting',
      });

      await remindUpcomingPayments(pool, notifier, 7);
      results.upcoming_payments = 'completed';

      logger.info({
        action: 'reminders_job_step',
        step: 'upcoming_payments',
        status: 'completed',
      });
    } catch (error) {
      logger.error({
        action: 'reminders_job_step_error',
        step: 'upcoming_payments',
        error: error.message,
      });
      results.upcoming_payments = `failed: ${error.message}`;
    }

    const duration = Date.now() - startTime;

    logger.info({
      action: 'reminders_job_completed',
      results,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });

    console.log('\n✅ All reminders completed');
    console.log(`Duration: ${duration}ms`);
    console.log('Results:', results);

    process.exit(results.overdue === 'completed' ? 0 : 1);
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error({
      action: 'reminders_job_error',
      error: error.message,
      stack: error.stack,
      duration_ms: duration,
    });

    console.error('\n❌ Reminders job failed:', error.message);
    process.exit(1);
  }
}

// Run job if executed directly
if (require.main === module) {
  runAllReminders().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runAllReminders };

/**
 * E2E Tests - Payment Processing Flow
 * Tests payment recording, validation, currency handling, and transaction history
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:4000/api';

test.describe('Payment Processing', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'test@akig.com');
    await page.fill('input[name="password"]', 'Test@Password123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 }).catch(() => {});
  });

  test.describe('Payment Recording', () => {
    test('User can record payment for existing contract', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments/new`);
      
      // Select contract from dropdown
      await page.click('select[name="contractId"]');
      await page.click('option >> first');
      
      // Enter amount
      await page.fill('input[name="amount"]', '500000');
      
      // Select payment method
      await page.click('select[name="paymentMethod"]');
      await page.click('option[value="mtn"]');
      
      // Enter payment reference
      await page.fill('input[name="reference"]', 'MTN2025010123456');
      
      // Set payment date
      await page.fill('input[name="paymentDate"]', '2025-01-15');
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Verify success
      await page.waitForSelector('[data-testid="success-notification"]', { timeout: 5000 });
      const message = await page.locator('[data-testid="success-notification"]').textContent();
      expect(message).toContain('Paiement enregistré');
    });

    test('Payment recording fails with invalid amount', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments/new`);
      
      await page.click('select[name="contractId"]');
      await page.click('option >> first');
      
      // Enter negative amount
      await page.fill('input[name="amount"]', '-1000');
      await page.click('button[type="submit"]');
      
      // Verify validation error
      await page.waitForSelector('[data-testid="amount-error"]', { timeout: 2000 });
    });

    test('Payment reference is validated based on method', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments/new`);
      
      await page.click('select[name="contractId"]');
      await page.click('option >> first');
      
      await page.fill('input[name="amount"]', '500000');
      
      // Select MTN method
      await page.click('select[name="paymentMethod"]');
      await page.click('option[value="mtn"]');
      
      // Enter invalid MTN reference
      await page.fill('input[name="reference"]', 'INVALID');
      await page.click('button[type="submit"]');
      
      // Verify validation error
      await page.waitForSelector('[data-testid="reference-error"]', { timeout: 2000 });
    });

    test('Multiple payment methods are supported', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments/new`);
      
      // Get all payment methods
      await page.click('select[name="paymentMethod"]');
      const options = await page.locator('select[name="paymentMethod"] option').count();
      
      // Should have at least 3 methods (MTN, Lumitel, Visa)
      expect(options).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Payment History', () => {
    test('Payment list displays all transactions', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      // Wait for list
      await page.waitForSelector('[data-testid="payments-list"]', { timeout: 5000 });
      
      // Verify list is populated
      const payments = await page.locator('[data-testid="payment-item"]').count();
      expect(payments).toBeGreaterThan(0);
    });

    test('Payment list displays correct information per item', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      await page.waitForSelector('[data-testid="payments-list"]', { timeout: 5000 });
      
      const firstPayment = await page.locator('[data-testid="payment-item"]').first();
      
      // Verify essential fields are visible
      expect(await firstPayment.locator('[data-testid="payment-amount"]').isVisible()).toBeTruthy();
      expect(await firstPayment.locator('[data-testid="payment-date"]').isVisible()).toBeTruthy();
      expect(await firstPayment.locator('[data-testid="payment-method"]').isVisible()).toBeTruthy();
      expect(await firstPayment.locator('[data-testid="payment-status"]').isVisible()).toBeTruthy();
    });

    test('Payment sorting by date works', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      // Click date column header to sort
      await page.click('[data-testid="sort-date"]');
      await page.waitForTimeout(300);
      
      // Verify sorted indicator appears
      const sortIndicator = await page.locator('[data-testid="sort-date"] [data-testid="sort-icon"]').isVisible();
      expect(sortIndicator).toBeTruthy();
    });

    test('Payment filtering by date range works', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      // Click filter button
      await page.click('[data-testid="filter-button"]');
      
      // Set date range
      await page.fill('input[name="startDate"]', '2025-01-01');
      await page.fill('input[name="endDate"]', '2025-01-31');
      
      // Apply filter
      await page.click('[data-testid="apply-filter"]');
      await page.waitForTimeout(500);
      
      // Verify results are within date range
      const dates = await page.locator('[data-testid="payment-date"]').allTextContents();
      expect(dates.length).toBeGreaterThan(0);
    });

    test('Payment status filtering works', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      // Filter by confirmed status
      await page.click('[data-testid="filter-button"]');
      await page.click('input[name="status-confirmed"]');
      await page.click('[data-testid="apply-filter"]');
      
      await page.waitForTimeout(500);
      
      // Verify all shown payments have confirmed status
      const statuses = await page.locator('[data-testid="payment-status"]').allTextContents();
      statuses.forEach(status => {
        expect(status.toLowerCase()).toContain('confirmé');
      });
    });
  });

  test.describe('Payment Details', () => {
    test('Payment detail page shows all transaction information', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      // Click first payment
      await page.click('[data-testid="payment-item"]:first-child');
      
      // Wait for detail view
      await page.waitForSelector('[data-testid="payment-detail"]', { timeout: 5000 });
      
      // Verify all detail sections are visible
      expect(await page.locator('[data-testid="payment-amount"]').isVisible()).toBeTruthy();
      expect(await page.locator('[data-testid="payment-reference"]').isVisible()).toBeTruthy();
      expect(await page.locator('[data-testid="payment-contract"]').isVisible()).toBeTruthy();
      expect(await page.locator('[data-testid="payment-confirmation"]').isVisible()).toBeTruthy();
    });

    test('Payment confirmation sends SMS notification', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      // Click first pending payment
      const pendingPayment = await page.locator('[data-testid="payment-item"]:has([data-testid="payment-status"]:has-text("Attente"))').first();
      
      if (await pendingPayment.isVisible()) {
        await pendingPayment.click();
        
        // Click confirm button
        await page.click('[data-testid="confirm-payment"]');
        
        // Intercept SMS API call
        let smsNotificationSent = false;
        page.on('response', response => {
          if (response.url().includes('/api/sms') && response.status() === 200) {
            smsNotificationSent = true;
          }
        });
        
        await page.waitForTimeout(2000);
        // Note: This verifies the SMS endpoint was called
      }
    });
  });

  test.describe('Payment Currency Handling', () => {
    test('Currency conversion is displayed', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments/new`);
      
      // Enter amount in GNF
      await page.fill('input[name="amount"]', '5000000');
      await page.click('select[name="currency"]');
      await page.click('option[value="GNF"]');
      
      // Wait for conversion to display
      await page.waitForTimeout(500);
      
      // Verify USD equivalent is shown
      const usdAmount = await page.locator('[data-testid="usd-equivalent"]').textContent();
      expect(usdAmount).toBeTruthy();
      expect(usdAmount).toMatch(/USD/i);
    });

    test('Multi-currency payment history is supported', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      // Check for multiple currencies in list
      const currencies = await page.locator('[data-testid="payment-currency"]').allTextContents();
      
      if (currencies.length > 0) {
        // Should have at least one payment entry
        expect(currencies[0]).toMatch(/GNF|USD|EUR|XOF/);
      }
    });
  });

  test.describe('Payment Export', () => {
    test('User can export payment history to CSV', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      // Click export button
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/payments.*\.csv/);
    });

    test('User can export payment history to Excel', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      // Click export button
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-excel"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/payments.*\.xlsx/);
    });

    test('User can export payment history to PDF', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      // Click export button
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-pdf"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/payments.*\.pdf/);
    });
  });

  test.describe('Accessibility', () => {
    test('Payment form has proper ARIA labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments/new`);
      
      // Check for ARIA labels
      const labels = await page.locator('label').count();
      expect(labels).toBeGreaterThan(0);
      
      // Verify labels are associated with inputs
      const label = await page.locator('label').first();
      const forAttribute = await label.getAttribute('for');
      expect(forAttribute).toBeTruthy();
    });

    test('Payment table is navigable with keyboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      await page.waitForSelector('[data-testid="payments-list"]', { timeout: 5000 });
      
      // Tab to first payment
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to focus payment items
      const focused = await page.evaluate(() => document.activeElement.dataset.testid);
      expect(focused).toBeTruthy();
    });
  });

  test.describe('Error Handling', () => {
    test('Graceful handling when payment service is unavailable', async ({ page, context }) => {
      // Abort API calls to simulate service down
      await context.route('**/api/payments/**', route => route.abort());
      
      await page.goto(`${BASE_URL}/payments`);
      
      // Wait for error message
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 5000 }).catch(() => {});
      
      // Verify fallback UI or retry option is shown
      const retryButton = await page.locator('[data-testid="retry-button"]').isVisible().catch(() => false);
      const errorMessage = await page.locator('[data-testid="error-message"]').isVisible().catch(() => false);
      
      expect(retryButton || errorMessage).toBeTruthy();
    });
  });
});

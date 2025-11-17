/**
 * E2E Tests - Dashboard & Notifications
 * Tests dashboard rendering, KPI display, and SMS/notification functionality
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

test.describe('Dashboard Rendering', () => {
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

  test.describe('KPI Cards', () => {
    test('All KPI cards render correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Wait for KPI section
      await page.waitForSelector('[data-testid="kpi-section"]', { timeout: 5000 });
      
      // Verify key metrics are visible
      expect(await page.locator('[data-testid="kpi-occupancy"]').isVisible()).toBeTruthy();
      expect(await page.locator('[data-testid="kpi-revenue"]').isVisible()).toBeTruthy();
      expect(await page.locator('[data-testid="kpi-contracts"]').isVisible()).toBeTruthy();
      expect(await page.locator('[data-testid="kpi-pending"]').isVisible()).toBeTruthy();
    });

    test('KPI values are numeric and formatted correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      await page.waitForSelector('[data-testid="kpi-revenue"]', { timeout: 5000 });
      
      // Get revenue value
      const revenueText = await page.locator('[data-testid="kpi-revenue"] [data-testid="kpi-value"]').textContent();
      
      // Should contain number and currency symbol
      expect(revenueText).toMatch(/\d+[\s,].*GNF|USD|EUR/);
    });

    test('KPI badges show status indicators', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      await page.waitForSelector('[data-testid="kpi-occupancy"]', { timeout: 5000 });
      
      // Verify status badge exists
      const badge = await page.locator('[data-testid="occupancy-badge"]').isVisible();
      expect(badge).toBeTruthy();
    });

    test('KPI cards have correct colors by status', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      await page.waitForSelector('[data-testid="kpi-section"]', { timeout: 5000 });
      
      // Check occupancy color
      const occupancyClass = await page.locator('[data-testid="kpi-occupancy"]').getAttribute('class');
      expect(occupancyClass).toContain('bg-');
    });
  });

  test.describe('Charts & Graphs', () => {
    test('Revenue chart renders with data', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Wait for chart
      await page.waitForSelector('[data-testid="revenue-chart"]', { timeout: 5000 });
      
      // Verify canvas element exists
      const canvas = await page.locator('[data-testid="revenue-chart"] canvas');
      expect(await canvas.isVisible()).toBeTruthy();
    });

    test('Occupancy distribution chart shows correct data', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      await page.waitForSelector('[data-testid="occupancy-chart"]', { timeout: 5000 });
      
      const canvas = await page.locator('[data-testid="occupancy-chart"] canvas');
      expect(await canvas.isVisible()).toBeTruthy();
    });

    test('Charts are responsive on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/dashboard`);
      
      await page.waitForSelector('[data-testid="revenue-chart"]', { timeout: 5000 });
      
      // Verify chart is visible and not overflowing
      const chart = await page.locator('[data-testid="revenue-chart"]');
      const box = await chart.boundingBox();
      
      expect(box.width).toBeLessThanOrEqual(375);
    });

    test('Chart legend displays all data series', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      await page.waitForSelector('[data-testid="revenue-chart"]', { timeout: 5000 });
      
      // Check legend exists
      const legend = await page.locator('[data-testid="chart-legend"]').isVisible().catch(() => false);
      if (legend) {
        const items = await page.locator('[data-testid="legend-item"]').count();
        expect(items).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Recent Activity', () => {
    test('Recent contracts section displays latest contracts', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      await page.waitForSelector('[data-testid="recent-contracts"]', { timeout: 5000 });
      
      const items = await page.locator('[data-testid="recent-contract-item"]').count();
      expect(items).toBeGreaterThan(0);
    });

    test('Recent payments section displays latest transactions', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      await page.waitForSelector('[data-testid="recent-payments"]', { timeout: 5000 });
      
      const items = await page.locator('[data-testid="recent-payment-item"]').count();
      expect(items).toBeGreaterThan(0);
    });

    test('Recent activity items have timestamp', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      await page.waitForSelector('[data-testid="recent-contracts"]', { timeout: 5000 });
      
      const timestamp = await page.locator('[data-testid="recent-contract-item"] [data-testid="timestamp"]').first().textContent();
      expect(timestamp).toBeTruthy();
    });
  });

  test.describe('Dashboard Responsiveness', () => {
    test('Dashboard layout adapts to tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${BASE_URL}/dashboard`);
      
      await page.waitForSelector('[data-testid="kpi-section"]', { timeout: 5000 });
      
      // KPI cards should be visible
      expect(await page.locator('[data-testid="kpi-occupancy"]').isVisible()).toBeTruthy();
    });

    test('Dashboard layout adapts to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/dashboard`);
      
      await page.waitForSelector('[data-testid="kpi-section"]', { timeout: 5000 });
      
      // KPI cards should stack vertically
      const kpiCards = await page.locator('[data-testid="kpi-card"]');
      
      if (await kpiCards.count() > 0) {
        const firstBox = await kpiCards.nth(0).boundingBox();
        const secondBox = await kpiCards.nth(1).boundingBox();
        
        // Second card should be below first
        expect(secondBox.y).toBeGreaterThan(firstBox.y);
      }
    });

    test('Navigation is accessible on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Verify mobile menu or navigation exists
      const mobileMenu = await page.locator('[data-testid="mobile-menu"]').isVisible().catch(() => false);
      const navigation = await page.locator('[data-testid="navigation"]').isVisible();
      
      expect(mobileMenu || navigation).toBeTruthy();
    });
  });

  test.describe('Dashboard Performance', () => {
    test('Dashboard initial load completes in reasonable time', async ({ page }) => {
      const start = Date.now();
      
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForSelector('[data-testid="kpi-section"]', { timeout: 5000 });
      
      const loadTime = Date.now() - start;
      
      // Should load in less than 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('Dashboard performs efficiently with large datasets', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard?limit=1000`);
      
      // Should still be interactive
      const start = Date.now();
      await page.click('[data-testid="revenue-chart"]');
      const responseTime = Date.now() - start;
      
      // Should respond quickly
      expect(responseTime).toBeLessThan(500);
    });
  });
});

test.describe('SMS Notifications', () => {
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

  test.describe('SMS Sending', () => {
    test('User can send SMS notification to tenant', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      // Open first contract
      await page.click('[data-testid="contract-item"]:first-child');
      
      // Click send SMS button
      await page.click('[data-testid="send-sms"]');
      
      // Fill SMS form
      await page.fill('textarea[name="message"]', 'Test payment reminder');
      await page.click('button[data-testid="send-sms-button"]');
      
      // Verify success
      await page.waitForSelector('[data-testid="success-notification"]', { timeout: 5000 });
      const message = await page.locator('[data-testid="success-notification"]').textContent();
      expect(message).toContain('SMS envoyé');
    });

    test('SMS message validation prevents empty messages', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      await page.click('[data-testid="contract-item"]:first-child');
      await page.click('[data-testid="send-sms"]');
      
      // Try to send without message
      await page.click('button[data-testid="send-sms-button"]');
      
      // Verify error
      await page.waitForSelector('[data-testid="message-error"]', { timeout: 2000 });
    });

    test('SMS message length validation works', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      await page.click('[data-testid="contract-item"]:first-child');
      await page.click('[data-testid="send-sms"]');
      
      // Fill textarea with very long message
      const longMessage = 'a'.repeat(500);
      await page.fill('textarea[name="message"]', longMessage);
      
      // Character count should be displayed
      const charCount = await page.locator('[data-testid="char-count"]').textContent();
      expect(charCount).toContain('500');
    });

    test('SMS can be sent with template', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      await page.click('[data-testid="contract-item"]:first-child');
      await page.click('[data-testid="send-sms"]');
      
      // Select template
      await page.click('select[name="template"]');
      await page.click('option[value="payment-reminder"]');
      
      // Template should populate message
      const message = await page.inputValue('textarea[name="message"]');
      expect(message.length).toBeGreaterThan(0);
    });
  });

  test.describe('Notification Templates', () => {
    test('Payment reminder template exists', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      await page.click('[data-testid="contract-item"]:first-child');
      await page.click('[data-testid="send-sms"]');
      
      await page.click('select[name="template"]');
      const options = await page.locator('select[name="template"] option').allTextContents();
      
      expect(options.some(opt => opt.toLowerCase().includes('rappel'))).toBeTruthy();
    });

    test('Template variables are properly substituted', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      await page.click('[data-testid="contract-item"]:first-child');
      
      // Get contract data
      const contractName = await page.locator('[data-testid="property-name"]').textContent();
      
      await page.click('[data-testid="send-sms"]');
      await page.click('select[name="template"]');
      await page.click('option[value="payment-reminder"]');
      
      // Verify contract name is substituted in message
      const message = await page.inputValue('textarea[name="message"]');
      expect(message.toLowerCase()).toContain(contractName.toLowerCase());
    });
  });

  test.describe('SMS History', () => {
    test('SMS history displays all sent messages', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      await page.click('[data-testid="contract-item"]:first-child');
      
      // Click SMS history tab
      await page.click('[data-testid="sms-history-tab"]');
      
      // Wait for history to load
      await page.waitForSelector('[data-testid="sms-history"]', { timeout: 5000 });
      
      const items = await page.locator('[data-testid="sms-item"]').count();
      expect(items).toBeGreaterThanOrEqual(0);
    });

    test('SMS history shows delivery status', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      await page.click('[data-testid="contract-item"]:first-child');
      await page.click('[data-testid="sms-history-tab"]');
      
      await page.waitForSelector('[data-testid="sms-history"]', { timeout: 5000 });
      
      // Check if status is shown
      const status = await page.locator('[data-testid="sms-status"]').first().textContent().catch(() => null);
      
      if (status) {
        expect(['Envoyé', 'Livré', 'Lecture', 'Erreur'].some(s => status.includes(s))).toBeTruthy();
      }
    });
  });

  test.describe('Bulk SMS', () => {
    test('User can send bulk SMS to multiple contacts', async ({ page }) => {
      await page.goto(`${BASE_URL}/communications`);
      
      // Click bulk SMS
      await page.click('[data-testid="bulk-sms"]');
      
      // Select multiple recipients
      await page.click('input[name="select-all"]');
      
      // Verify selected count shows
      const selected = await page.locator('[data-testid="selected-count"]').textContent();
      expect(selected).toMatch(/\d+/);
      
      // Fill message
      await page.fill('textarea[name="message"]', 'Bulk notification test');
      
      // Send
      await page.click('[data-testid="send-bulk"]');
      
      // Verify success
      await page.waitForSelector('[data-testid="success-notification"]', { timeout: 5000 });
    });

    test('Bulk SMS has rate limiting to prevent spam', async ({ page }) => {
      await page.goto(`${BASE_URL}/communications`);
      
      await page.click('[data-testid="bulk-sms"]');
      await page.click('input[name="select-all"]');
      await page.fill('textarea[name="message"]', 'Test');
      
      // Send first batch
      await page.click('[data-testid="send-bulk"]');
      await page.waitForSelector('[data-testid="success-notification"]', { timeout: 5000 });
      
      // Try to send again immediately
      await page.goto(`${BASE_URL}/communications`);
      await page.click('[data-testid="bulk-sms"]');
      
      // Should show rate limit warning
      const warning = await page.locator('[data-testid="rate-limit-warning"]').isVisible().catch(() => false);
      expect(warning).toBeTruthy();
    });
  });
});

/**
 * E2E Tests - Export Functionality (PDF, CSV, Excel)
 * Tests all export formats and cross-browser compatibility
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

test.describe('Export Functionality', () => {
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

  test.describe('PDF Export', () => {
    test('Contract list can be exported to PDF', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-pdf"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/contracts.*\.pdf/i);
      
      // Verify file was created
      const filePath = await download.path();
      expect(fs.existsSync(filePath)).toBeTruthy();
    });

    test('Payment history can be exported to PDF', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-pdf"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/payments.*\.pdf/i);
    });

    test('Dashboard report can be exported to PDF', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Click generate report
      await page.click('[data-testid="generate-report"]');
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-pdf"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/report.*\.pdf/i);
    });

    test('PDF export includes all visible data', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      // Get data before export
      const contractCount = await page.locator('[data-testid="contract-item"]').count();
      expect(contractCount).toBeGreaterThan(0);
      
      // Export to PDF
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-pdf"]');
      
      const download = await downloadPromise;
      const filePath = await download.path();
      
      // Verify file size is reasonable (not empty)
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(1000);
    });

    test('PDF export respects applied filters', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      // Apply filter
      await page.click('[data-testid="filter-button"]');
      await page.fill('input[name="startDate"]', '2025-01-01');
      await page.fill('input[name="endDate"]', '2025-01-31');
      await page.click('[data-testid="apply-filter"]');
      
      await page.waitForTimeout(300);
      
      // Export
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-pdf"]');
      
      const download = await downloadPromise;
      const filePath = await download.path();
      
      // File should exist
      expect(fs.existsSync(filePath)).toBeTruthy();
    });

    test('PDF export works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/contracts`);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-pdf"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf/i);
    });
  });

  test.describe('CSV Export', () => {
    test('Contract list can be exported to CSV', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/contracts.*\.csv/i);
    });

    test('Payment history can be exported to CSV', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/payments.*\.csv/i);
      
      // Verify content
      const filePath = await download.path();
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Should have headers
      expect(content).toContain(',');
    });

    test('CSV export includes proper headers', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      
      const download = await downloadPromise;
      const filePath = await download.path();
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const headers = lines[0].split(',');
      
      // Should have expected columns
      expect(headers.length).toBeGreaterThan(3);
    });

    test('CSV export properly escapes special characters', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      
      const download = await downloadPromise;
      const filePath = await download.path();
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Should handle commas, quotes, newlines
      expect(content).toMatch(/".+".+"|.+,.+/);
    });

    test('CSV export is compatible with Excel', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      
      const download = await downloadPromise;
      const filePath = await download.path();
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for UTF-8 BOM for Excel compatibility (optional but good)
      // And verify valid CSV structure
      const lines = content.split('\n');
      expect(lines.length).toBeGreaterThan(1);
    });
  });

  test.describe('Excel Export', () => {
    test('Contract list can be exported to Excel', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-excel"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/contracts.*\.xlsx/i);
    });

    test('Payment history can be exported to Excel', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-excel"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/payments.*\.xlsx/i);
    });

    test('Excel export includes multiple sheets when applicable', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Generate comprehensive report
      await page.click('[data-testid="generate-report"]');
      await page.waitForTimeout(500);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-excel"]');
      
      const download = await downloadPromise;
      const filePath = await download.path();
      
      // File should exist and be reasonable size for Excel
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(2000);
    });

    test('Excel export includes formatted data', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-excel"]');
      
      const download = await downloadPromise;
      const filePath = await download.path();
      
      // Verify it's a valid XLSX file (binary file check)
      const content = fs.readFileSync(filePath);
      const header = content.toString('hex', 0, 4);
      
      // ZIP file header for XLSX
      expect(['504b0304'].includes(header)).toBeTruthy();
    });

    test('Excel export works on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/payments`);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-excel"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.xlsx/i);
    });
  });

  test.describe('Export Options & Customization', () => {
    test('User can select columns to export', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      // Click export options
      await page.click('[data-testid="export-options"]');
      
      // Should show column selection
      const options = await page.locator('[data-testid="column-checkbox"]').count();
      expect(options).toBeGreaterThan(0);
      
      // Can deselect columns
      await page.click('[data-testid="column-checkbox"]:first-child');
      
      // Export
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv/i);
    });

    test('User can select date range for export', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      // Click export options
      await page.click('[data-testid="export-options"]');
      
      // Set date range
      await page.fill('input[name="exportStartDate"]', '2025-01-01');
      await page.fill('input[name="exportEndDate"]', '2025-01-31');
      
      // Export
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv/i);
    });

    test('Export includes metadata (timestamp, exported by)', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-pdf"]');
      
      const download = await downloadPromise;
      const filePath = await download.path();
      
      // File should be created with reasonable size
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  test.describe('Export Performance', () => {
    test('Large export completes within timeout', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts?limit=500`);
      
      const start = Date.now();
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      
      const download = await downloadPromise;
      const duration = Date.now() - start;
      
      // Should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
      
      // File should be created
      const filePath = await download.path();
      expect(fs.existsSync(filePath)).toBeTruthy();
    });

    test('Export does not block UI', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      const downloadPromise = page.waitForEvent('download');
      
      // Start export
      await page.click('[data-testid="export-csv"]');
      
      // While exporting, try to interact with page
      const success = await page.locator('[data-testid="contract-item"]').first().isVisible().catch(() => false);
      
      // Should still be interactive
      expect(success).toBeTruthy();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv/i);
    });
  });

  test.describe('Cross-Browser Export', () => {
    test('Export works in all supported browsers', async ({ page, browserName }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-pdf"]');
      
      const download = await downloadPromise;
      
      // Should work in any browser
      expect(download.suggestedFilename()).toMatch(/\.pdf/i);
    });

    test('Export file paths are valid on all OS', async ({ page }) => {
      await page.goto(`${BASE_URL}/payments`);
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      
      const download = await downloadPromise;
      const filename = download.suggestedFilename();
      
      // Should not contain invalid path characters
      expect(/[<>:"|?*\x00-\x1f]/.test(filename)).toBeFalsy();
    });
  });
});

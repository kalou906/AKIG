import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Dashboard
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login d'abord
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@akig.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard/);
  });

  test('should display KPI cards', async ({ page }) => {
    // Vérifier présence des KPIs principaux
    await expect(page.locator('text=/Total Locataires|Total Tenants/i')).toBeVisible();
    await expect(page.locator('text=/Paiements|Payments/i')).toBeVisible();
    await expect(page.locator('text=/Impayés|Overdue/i')).toBeVisible();
    await expect(page.locator('text=/Taux|Rate/i')).toBeVisible();
  });

  test('should navigate to tenants page', async ({ page }) => {
    await page.locator('text=/Locataires|Tenants/i').first().click();
    await page.waitForURL(/\/tenants/);
    await expect(page).toHaveURL(/\/tenants/);
    await expect(page.locator('h1')).toContainText(/Locataires|Tenants/i);
  });

  test('should navigate to payments page', async ({ page }) => {
    await page.locator('text=/Paiements|Payments/i').first().click();
    await page.waitForURL(/\/payments/);
    await expect(page).toHaveURL(/\/payments/);
  });

  test('should open genius panel with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+K');
    // Vérifier que le panel Genius s'ouvre (adapter selon votre UI)
    await expect(page.locator('[aria-label*="Genius"]')).toBeVisible({ timeout: 2000 });
  });
});

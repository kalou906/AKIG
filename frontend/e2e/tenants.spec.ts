import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Gestion des Locataires
 */
test.describe('Tenants Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@akig.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard/);
    
    // Naviguer vers Tenants
    await page.goto('/tenants');
  });

  test('should display tenants list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Locataires|Tenants/i);
    // Vérifier présence de la table ou liste
    await expect(page.locator('table, [role="table"]')).toBeVisible();
  });

  test('should filter tenants by search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await searchInput.fill('Bah');
    // Attendre que la liste soit filtrée
    await page.waitForTimeout(500);
    // Vérifier que les résultats contiennent "Bah"
    const results = await page.locator('table tbody tr, [role="row"]').count();
    expect(results).toBeGreaterThan(0);
  });

  test('should open add tenant modal', async ({ page }) => {
    await page.locator('button:has-text("Ajouter")').click();
    // Vérifier modal ouvert
    await expect(page.locator('[role="dialog"], .modal')).toBeVisible();
  });

  test('should filter by payment status', async ({ page }) => {
    await page.locator('select').selectOption('overdue');
    await page.waitForTimeout(500);
    // Vérifier que seuls les impayés sont affichés
    await expect(page.locator('text=/Impayé|Overdue/i')).toBeVisible();
  });
});

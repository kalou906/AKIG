import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Page de Login
 */
test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/connexion|login/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.locator('button[type="submit"]').click();
    // Vérifier les messages d'erreur (adapter selon votre UI)
    await expect(page.locator('text=/email|required/i')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Remplir le formulaire
    await page.locator('input[type="email"]').fill('admin@akig.com');
    await page.locator('input[type="password"]').fill('password123');
    
    // Soumettre
    await page.locator('button[type="submit"]').click();
    
    // Attendre redirection vers dashboard
    await page.waitForURL(/\/dashboard/);
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Vérifier présence du header avec nom utilisateur
    await expect(page.locator('text=/Dashboard|AKIG/i')).toBeVisible();
  });
});

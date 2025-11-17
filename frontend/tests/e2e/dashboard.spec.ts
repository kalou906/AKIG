import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('affiche le titre et les KPIs', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await expect(page.locator('h2')).toHaveText(/Dashboard/);
    await expect(page.locator('.stat')).toHaveCount(4);
  });

  test('navigation sidebar', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.click('text=Locataires');
    await expect(page.locator('h1')).toHaveText(/Locataires/);
    await page.click('text=Paiements');
    await expect(page.locator('h1')).toHaveText(/Paiements/);
  });
});

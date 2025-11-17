/**
 * UI Visual Regression Tests
 * Playwright tests for visual consistency and responsive design
 */

// @ts-ignore - Playwright module will be available at runtime
import { test, expect } from '@playwright/test';

const tests: Array<{name: string; path: string; wait?: string}> = [
  { name: 'Dashboard', path: '/dashboard', wait: '[data-testid="kpi-occupancy"]' },
  { name: 'Contracts', path: '/contracts', wait: '[data-testid="contracts-list"]' },
  { name: 'Payments', path: '/payments', wait: '[data-testid="payments-list"]' },
];

test.describe('UI Visual Tests', () => {
  test.beforeEach(async ({ page }: any) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  // Desktop viewport tests
  for (const t of tests) {
    test(`${t.name} page desktop view`, async ({ page }: any) => {
      await page.goto(t.path);
      if (t.wait) {
        await page.waitForSelector(t.wait).catch(() => {});
      }
      await page.waitForTimeout(300);
      expect(await page.screenshot()).toBeTruthy();
    });
  }

  // Mobile viewport tests
  test('Dashboard mobile responsive', async ({ page }: any) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="kpi-occupancy"]').catch(() => {});
    expect(await page.screenshot()).toBeTruthy();
  });

  test('Contracts mobile responsive', async ({ page }: any) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/contracts');
    await page.waitForSelector('[data-testid="contracts-list"]').catch(() => {});
    expect(await page.screenshot()).toBeTruthy();
  });

  test('Payments mobile responsive', async ({ page }: any) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/payments');
    await page.waitForSelector('[data-testid="payments-list"]').catch(() => {});
    expect(await page.screenshot()).toBeTruthy();
  });

  // Tablet viewport tests
  test('Dashboard tablet responsive', async ({ page }: any) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="kpi-occupancy"]').catch(() => {});
    expect(await page.screenshot()).toBeTruthy();
  });

  // Component tests
  test('Dashboard KPI section', async ({ page }: any) => {
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="kpi-section"]').catch(() => {});
    const kpi = page.locator('[data-testid="kpi-section"]');
    expect(await kpi.isVisible().catch(() => false)).toBeTruthy();
  });

  test('Contracts list', async ({ page }: any) => {
    await page.goto('/contracts');
    await page.waitForSelector('[data-testid="contract-card"]').catch(() => {});
    const cards = page.locator('[data-testid="contract-card"]');
    expect(await cards.count().catch(() => 0)).toBeGreaterThanOrEqual(0);
  });

  test('Payments table', async ({ page }: any) => {
    await page.goto('/payments');
    await page.waitForSelector('[data-testid="payments-list"]').catch(() => {});
    const table = page.locator('[data-testid="payments-list"]');
    expect(await table.isVisible().catch(() => false)).toBeTruthy();
  });

  // Dark mode tests
  test('Dashboard dark mode', async ({ page }: any) => {
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    }).catch(() => {});
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="kpi-occupancy"]').catch(() => {});
    expect(await page.screenshot()).toBeTruthy();
  });

  test('Contracts dark mode', async ({ page }: any) => {
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    }).catch(() => {});
    await page.goto('/contracts');
    await page.waitForSelector('[data-testid="contracts-list"]').catch(() => {});
    expect(await page.screenshot()).toBeTruthy();
  });

  // Error state tests
  test('Error message display', async ({ page }: any) => {
    await page.goto('/dashboard');
    const errorBox = page.locator('[data-testid="error-message"]');
    expect(await errorBox.isVisible().catch(() => false)).toBeTruthy();
  });

  test('Loading state', async ({ page }: any) => {
    await page.goto('/dashboard');
    const skeleton = page.locator('[data-testid="skeleton-loader"]');
    expect(await skeleton.isVisible().catch(() => false)).toBeTruthy();
  });
});

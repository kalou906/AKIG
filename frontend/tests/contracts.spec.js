/**
 * E2E Tests - Contract Management Flow
 * Tests contract creation, validation, editing, and deletion across all browsers
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:4000/api';

test.describe('Contract Management', () => {
  let contractId = null;
  let authToken = null;

  test.beforeEach(async ({ page }) => {
    // Clear storage and login
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'test@akig.com');
    await page.fill('input[name="password"]', 'Test@Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 }).catch(() => {});
  });

  test.describe('Contract Creation', () => {
    test('User can create contract with valid data', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts/new`);
      
      // Fill form with valid data
      await page.fill('input[name="propertyName"]', 'Apartement Test');
      await page.fill('input[name="address"]', '123 Rue de Test, Conakry');
      await page.fill('input[name="amount"]', '5000000');
      await page.fill('input[name="startDate"]', '2025-01-01');
      await page.fill('input[name="endDate"]', '2026-01-01');
      
      // Select contract type
      await page.click('select[name="contractType"]');
      await page.click('option[value="lease"]');
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Verify success message
      await page.waitForSelector('[data-testid="success-notification"]', { timeout: 5000 });
      const message = await page.locator('[data-testid="success-notification"]').textContent();
      expect(message).toContain('Contrat créé');
      
      // Verify redirect to contracts list
      await page.waitForURL(`${BASE_URL}/contracts`, { timeout: 5000 });
    });

    test('Contract creation fails with missing required fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts/new`);
      
      // Try to submit without filling required fields
      await page.click('button[type="submit"]');
      
      // Verify validation errors appear
      const errors = await page.locator('[data-testid="field-error"]').count();
      expect(errors).toBeGreaterThan(0);
    });

    test('Contract amount validation works correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts/new`);
      
      // Enter invalid amount (negative)
      await page.fill('input[name="amount"]', '-1000');
      await page.click('button[type="submit"]');
      
      // Verify error message
      await page.waitForSelector('[data-testid="amount-error"]', { timeout: 2000 });
      const error = await page.locator('[data-testid="amount-error"]').textContent();
      expect(error).toContain('positif');
    });

    test('Date validation prevents end date before start date', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts/new`);
      
      await page.fill('input[name="startDate"]', '2025-12-31');
      await page.fill('input[name="endDate"]', '2025-01-01');
      await page.click('button[type="submit"]');
      
      // Verify validation error
      await page.waitForSelector('[data-testid="date-error"]', { timeout: 2000 });
    });
  });

  test.describe('Contract Listing & Filtering', () => {
    test('Contracts list displays all user contracts', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      // Wait for list to load
      await page.waitForSelector('[data-testid="contracts-list"]', { timeout: 5000 });
      
      // Verify list is populated
      const contracts = await page.locator('[data-testid="contract-item"]').count();
      expect(contracts).toBeGreaterThan(0);
    });

    test('Filter by contract status works', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      // Click filter button
      await page.click('[data-testid="filter-button"]');
      
      // Select active contracts
      await page.click('input[value="active"]');
      
      // Verify filtered results
      const contracts = await page.locator('[data-testid="contract-item"]').count();
      expect(contracts).toBeGreaterThan(0);
      
      // Verify all shown contracts have "active" status
      const statuses = await page.locator('[data-testid="contract-status"]').allTextContents();
      statuses.forEach(status => {
        expect(status.toLowerCase()).toContain('actif');
      });
    });

    test('Search functionality filters contracts by property name', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      // Fill search field
      await page.fill('input[placeholder="Rechercher"]', 'Apartment');
      
      // Wait for results to update
      await page.waitForTimeout(500);
      
      // Verify results contain search term
      const names = await page.locator('[data-testid="contract-name"]').allTextContents();
      names.forEach(name => {
        expect(name.toLowerCase()).toContain('apartment');
      });
    });

    test('Pagination works correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      // Check if pagination exists
      const paginationExists = await page.locator('[data-testid="pagination"]').isVisible().catch(() => false);
      
      if (paginationExists) {
        const pageInfo = await page.locator('[data-testid="page-info"]').textContent();
        expect(pageInfo).toMatch(/\d+\s*\/\s*\d+/);
        
        // Click next page
        const nextButton = await page.locator('[data-testid="next-page"]');
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Contract Editing', () => {
    test('User can edit existing contract', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      // Open first contract
      await page.click('[data-testid="contract-item"]:first-child');
      
      // Wait for contract detail page
      await page.waitForSelector('[data-testid="contract-detail"]', { timeout: 5000 });
      
      // Click edit button
      await page.click('[data-testid="edit-button"]');
      
      // Modify property name
      await page.fill('input[name="propertyName"]', 'Updated Property Name');
      await page.click('button[type="submit"]');
      
      // Verify update success
      await page.waitForSelector('[data-testid="success-notification"]', { timeout: 5000 });
      const message = await page.locator('[data-testid="success-notification"]').textContent();
      expect(message).toContain('mis à jour');
    });
  });

  test.describe('Contract Details', () => {
    test('Contract details page displays all information correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      // Open first contract
      await page.click('[data-testid="contract-item"]:first-child');
      
      // Wait for details to load
      await page.waitForSelector('[data-testid="contract-detail"]', { timeout: 5000 });
      
      // Verify all detail fields are visible
      expect(await page.locator('[data-testid="property-name"]').isVisible()).toBeTruthy();
      expect(await page.locator('[data-testid="contract-address"]').isVisible()).toBeTruthy();
      expect(await page.locator('[data-testid="contract-amount"]').isVisible()).toBeTruthy();
      expect(await page.locator('[data-testid="contract-status"]').isVisible()).toBeTruthy();
    });

    test('Contract history timeline displays all events', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      // Open first contract
      await page.click('[data-testid="contract-item"]:first-child');
      
      // Verify history section exists
      await page.waitForSelector('[data-testid="contract-history"]', { timeout: 5000 });
      
      const events = await page.locator('[data-testid="history-event"]').count();
      expect(events).toBeGreaterThan(0);
    });
  });

  test.describe('Contract Deletion', () => {
    test('User can delete contract with confirmation', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      // Store initial count
      let initialCount = await page.locator('[data-testid="contract-item"]').count();
      
      // Open first contract
      await page.click('[data-testid="contract-item"]:first-child');
      
      // Click delete button
      await page.click('[data-testid="delete-button"]');
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete"]');
      
      // Verify success message
      await page.waitForSelector('[data-testid="success-notification"]', { timeout: 5000 });
      
      // Return to list and verify count decreased
      await page.goto(`${BASE_URL}/contracts`);
      const finalCount = await page.locator('[data-testid="contract-item"]').count();
      expect(finalCount).toBeLessThan(initialCount);
    });

    test('Deletion can be cancelled', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      const initialCount = await page.locator('[data-testid="contract-item"]').count();
      
      // Open first contract
      await page.click('[data-testid="contract-item"]:first-child');
      
      // Click delete button
      await page.click('[data-testid="delete-button"]');
      
      // Cancel deletion
      await page.click('[data-testid="cancel-delete"]');
      
      // Verify we're still on detail page
      expect(await page.locator('[data-testid="contract-detail"]').isVisible()).toBeTruthy();
    });
  });

  test.describe('Accessibility', () => {
    test('Contract form is keyboard navigable', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts/new`);
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      let focused = await page.evaluate(() => document.activeElement.name);
      expect(focused).toBeTruthy();
      
      // Tab through all form fields
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Should be able to reach submit button
      focused = await page.evaluate(() => document.activeElement.type);
      expect(focused).toBe('submit');
    });

    test('Contract list has proper ARIA labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/contracts`);
      
      // Check for ARIA roles
      const list = await page.locator('[role="list"]').isVisible();
      expect(list).toBeTruthy();
      
      // Check list items have proper role
      const itemRole = await page.locator('[role="listitem"]').first().getAttribute('role');
      expect(itemRole).toBe('listitem');
    });
  });
});

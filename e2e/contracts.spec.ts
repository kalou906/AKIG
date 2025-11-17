/**
 * E2E Tests - Contracts Management
 * Tests CRUD operations, filtering, search, and pagination
 */

import { test, expect, Page } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:4000/api';
const UI_URL = process.env.UI_URL || 'http://localhost:3000';

test.describe('Contracts Management', () => {
  let page: Page;
  let authToken: string;

  test.beforeAll(async ({ browser }) => {
    // Login once for all tests
    page = await browser.newPage();
    
    const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'Test@123456'
      }
    });
    
    const { token } = await loginResponse.json();
    authToken = token;
    
    // Set auth cookie/header
    await page.context().addCookies([{
      name: 'token',
      value: authToken,
      url: UI_URL
    }]);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Display contracts list', async () => {
    await page.goto(`${UI_URL}/contracts`);
    
    // Wait for contracts to load
    const contractsList = page.locator('[data-test="contracts-list"]');
    await expect(contractsList).toBeVisible({ timeout: 5000 });
    
    // Should have contract items
    const contractItems = page.locator('[data-test="contract-item"]');
    const count = await contractItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Create new contract', async () => {
    await page.goto(`${UI_URL}/contracts`);
    
    // Click create button
    const createBtn = page.locator('button:has-text("New Contract")');
    await createBtn.click();
    
    // Should open form modal
    const formModal = page.locator('[data-test="contract-form-modal"]');
    await expect(formModal).toBeVisible();
    
    // Fill form
    await page.fill('input[name="title"]', 'Test Contract');
    await page.fill('textarea[name="description"]', 'Test contract description');
    await page.selectOption('select[name="type"]', 'lease');
    
    // Submit
    await page.click('button:has-text("Create")');
    
    // Should close modal and refresh list
    await expect(formModal).not.toBeVisible({ timeout: 5000 });
    
    // New contract should appear in list
    const newContract = page.locator('text=Test Contract');
    await expect(newContract).toBeVisible();
  });

  test('View contract details', async () => {
    await page.goto(`${UI_URL}/contracts`);
    
    // Click on first contract
    const firstContract = page.locator('[data-test="contract-item"]').first();
    await firstContract.click();
    
    // Should navigate to detail page
    await page.waitForNavigation({ url: /.*contracts\/\w+.*/ });
    
    // Should display contract details
    const detailPanel = page.locator('[data-test="contract-detail"]');
    await expect(detailPanel).toBeVisible();
    
    // Should have contract info
    const title = page.locator('[data-test="contract-title"]');
    await expect(title).toBeVisible();
  });

  test('Edit contract', async () => {
    await page.goto(`${UI_URL}/contracts`);
    
    // Click edit on first contract
    const editBtn = page.locator('[data-test="contract-item"]').first().locator('[data-test="edit-btn"]');
    await editBtn.click();
    
    // Should open edit modal
    const editModal = page.locator('[data-test="contract-form-modal"]');
    await expect(editModal).toBeVisible();
    
    // Update field
    const titleInput = page.locator('input[name="title"]');
    await titleInput.clear();
    await titleInput.fill('Updated Contract Title');
    
    // Submit
    await page.click('button:has-text("Save")');
    
    // Modal should close
    await expect(editModal).not.toBeVisible({ timeout: 5000 });
    
    // Updated title should show
    const updatedTitle = page.locator('text=Updated Contract Title');
    await expect(updatedTitle).toBeVisible();
  });

  test('Delete contract', async () => {
    await page.goto(`${UI_URL}/contracts`);
    
    // Get initial count
    const initialCount = await page.locator('[data-test="contract-item"]').count();
    
    // Click delete on first contract
    const deleteBtn = page.locator('[data-test="contract-item"]').first().locator('[data-test="delete-btn"]');
    await deleteBtn.click();
    
    // Should show confirmation
    const confirmModal = page.locator('[data-test="confirm-modal"]');
    await expect(confirmModal).toBeVisible();
    
    // Confirm delete
    await page.click('button:has-text("Confirm")');
    
    // Modal should close
    await expect(confirmModal).not.toBeVisible({ timeout: 5000 });
    
    // Count should decrease
    const newCount = await page.locator('[data-test="contract-item"]').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('Search contracts', async () => {
    await page.goto(`${UI_URL}/contracts`);
    
    // Enter search query
    const searchInput = page.locator('input[data-test="search-input"]');
    await searchInput.fill('lease');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Results should only contain "lease"
    const contractItems = page.locator('[data-test="contract-item"]');
    const count = await contractItems.count();
    
    // Each item should contain search term
    for (let i = 0; i < Math.min(count, 3); i++) {
      const item = contractItems.nth(i);
      const text = await item.textContent();
      expect(text).toContain('lease');
    }
  });

  test('Filter contracts by status', async () => {
    await page.goto(`${UI_URL}/contracts`);
    
    // Click filter button
    const filterBtn = page.locator('[data-test="filter-btn"]');
    await filterBtn.click();
    
    // Should show filter panel
    const filterPanel = page.locator('[data-test="filter-panel"]');
    await expect(filterPanel).toBeVisible();
    
    // Select status filter
    await page.selectOption('select[name="status"]', 'active');
    
    // Should apply filter
    await page.click('button:has-text("Apply")');
    
    // Results should only show active contracts
    const contractItems = page.locator('[data-test="contract-item"]');
    for (let i = 0; i < await contractItems.count(); i++) {
      const badge = contractItems.nth(i).locator('[data-test="status-badge"]');
      const statusText = await badge.textContent();
      expect(statusText).toContain('Active');
    }
  });

  test('Pagination', async () => {
    await page.goto(`${UI_URL}/contracts?limit=5`);
    
    // Should show pagination controls
    const pagination = page.locator('[data-test="pagination"]');
    await expect(pagination).toBeVisible();
    
    // Get page 1 contracts
    const page1Items = await page.locator('[data-test="contract-item"]').count();
    expect(page1Items).toBeLessThanOrEqual(5);
    
    // Click next page
    const nextBtn = page.locator('button[data-test="next-page"]');
    await nextBtn.click();
    
    // Should navigate to page 2
    await expect(page).toHaveURL(/.*page=2.*/);
  });

  test('Sort contracts', async () => {
    await page.goto(`${UI_URL}/contracts`);
    
    // Click sort button
    const sortBtn = page.locator('[data-test="sort-btn"]');
    await sortBtn.click();
    
    // Select sort option
    await page.selectOption('select[name="sort"]', 'title:asc');
    
    // Should apply sort
    const contractItems = page.locator('[data-test="contract-item"]');
    const titles = [];
    for (let i = 0; i < await contractItems.count(); i++) {
      const title = await contractItems.nth(i).locator('[data-test="contract-title"]').textContent();
      titles.push(title);
    }
    
    // Should be sorted
    const sorted = [...titles].sort();
    expect(titles).toEqual(sorted);
  });

  test('Bulk actions on contracts', async () => {
    await page.goto(`${UI_URL}/contracts`);
    
    // Select multiple contracts
    const checkboxes = page.locator('input[type="checkbox"][data-test="contract-checkbox"]');
    for (let i = 0; i < 3; i++) {
      await checkboxes.nth(i).check();
    }
    
    // Should show bulk action menu
    const bulkMenu = page.locator('[data-test="bulk-actions"]');
    await expect(bulkMenu).toBeVisible();
    
    // Select bulk action
    await page.selectOption('select[data-test="bulk-action-select"]', 'archive');
    
    // Should show confirmation
    const confirmModal = page.locator('[data-test="confirm-modal"]');
    await expect(confirmModal).toBeVisible();
    
    // Confirm action
    await page.click('button:has-text("Confirm")');
    
    // Action should complete
    await expect(confirmModal).not.toBeVisible({ timeout: 5000 });
  });

  test('Export contracts', async () => {
    await page.goto(`${UI_URL}/contracts`);
    
    // Click export button
    const exportBtn = page.locator('[data-test="export-btn"]');
    await exportBtn.click();
    
    // Should show export options
    const exportMenu = page.locator('[data-test="export-menu"]');
    await expect(exportMenu).toBeVisible();
    
    // Select CSV export
    const csvOption = exportMenu.locator('button:has-text("CSV")');
    await csvOption.click();
    
    // Should download file
    const downloadPromise = page.waitForEvent('download');
    await downloadPromise;
  });
});

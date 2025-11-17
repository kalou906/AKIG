/**
 * E2E Tests - Authentication Flow
 * Tests login, logout, permissions, and user flow
 */

import { test, expect, Page } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:4000/api';
const UI_URL = process.env.UI_URL || 'http://localhost:3000';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'Test@123456',
  firstName: 'Test',
  lastName: 'User'
};

test.describe('Authentication Flow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    // Clear localStorage and cookies
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('User registration flow', async () => {
    await page.goto(`${UI_URL}/register`);
    
    // Fill registration form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="firstName"]', testUser.firstName);
    await page.fill('input[name="lastName"]', testUser.lastName);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    
    // Accept terms
    await page.check('input[type="checkbox"]');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to login or success
    await page.waitForNavigation({ url: /.*login|dashboard.*/ });
    
    // Should show success message
    const successMsg = page.locator('text=successfully created');
    await expect(successMsg).toBeVisible({ timeout: 5000 });
  });

  test('User login flow', async () => {
    await page.goto(`${UI_URL}/login`);
    
    // Fill login form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForNavigation({ url: /.*dashboard.*/ });
    
    // Should be on dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);
    
    // Should show user menu
    const userMenu = page.locator('[data-test="user-menu"]');
    await expect(userMenu).toBeVisible();
  });

  test('User logout flow', async () => {
    // Login first
    await page.goto(`${UI_URL}/login`);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ url: /.*dashboard.*/ });
    
    // Logout
    const userMenu = page.locator('[data-test="user-menu"]');
    await userMenu.click();
    
    const logoutBtn = page.locator('text=Déconnexion');
    await logoutBtn.click();
    
    // Should redirect to login
    await page.waitForNavigation({ url: /.*login.*/ });
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('Password reset flow', async () => {
    await page.goto(`${UI_URL}/forgot-password`);
    
    // Enter email
    await page.fill('input[name="email"]', testUser.email);
    await page.click('button[type="submit"]');
    
    // Should show success message
    const successMsg = page.locator('text=Check your email');
    await expect(successMsg).toBeVisible({ timeout: 5000 });
  });

  test('2FA setup flow', async () => {
    // Login first
    await page.goto(`${UI_URL}/login`);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ url: /.*dashboard.*/ });
    
    // Go to security settings
    await page.goto(`${UI_URL}/settings/security`);
    
    // Click enable 2FA
    const enable2FA = page.locator('button:has-text("Enable 2FA")');
    await enable2FA.click();
    
    // Should show QR code
    const qrCode = page.locator('[data-test="qr-code"]');
    await expect(qrCode).toBeVisible();
    
    // Get backup codes
    const backupCodes = page.locator('[data-test="backup-codes"]');
    await expect(backupCodes).toBeVisible();
  });

  test('Permission-based UI rendering', async () => {
    // Login as user
    await page.goto(`${UI_URL}/login`);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ url: /.*dashboard.*/ });
    
    // Check if user-level actions are visible
    const userActions = page.locator('[data-permission="user"]');
    await expect(userActions).toBeVisible();
    
    // Admin-only sections should NOT be visible
    const adminPanel = page.locator('[data-permission="admin"]');
    await expect(adminPanel).not.toBeVisible();
  });

  test('Session timeout handling', async () => {
    // Login
    await page.goto(`${UI_URL}/login`);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ url: /.*dashboard.*/ });
    
    // Simulate token expiration by removing it
    await page.evaluate(() => {
      localStorage.removeItem('token');
    });
    
    // Try to navigate to protected page
    await page.goto(`${UI_URL}/contracts`);
    
    // Should redirect to login
    await page.waitForNavigation({ url: /.*login.*/ });
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('Invalid credentials error', async () => {
    await page.goto(`${UI_URL}/login`);
    
    // Fill with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    const errorMsg = page.locator('text=Invalid credentials');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

  test('Rate limiting on login attempts', async () => {
    await page.goto(`${UI_URL}/login`);
    
    // Try multiple failed logins
    for (let i = 0; i < 6; i++) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'wrong');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(100);
    }
    
    // Should show rate limit error
    const rateLimitMsg = page.locator('text=Too many attempts');
    await expect(rateLimitMsg).toBeVisible({ timeout: 5000 });
  });
});

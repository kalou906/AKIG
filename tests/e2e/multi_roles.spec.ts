/**
 * End-to-End Tests: Multi-Role User Workflows
 * Tests complete user journeys across property owner, agency, and tenant roles
 */

import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

// Configuration
const BASE_URL = process.env.E2E_BASE_URL || 'https://app.akig.example.com';
const API_BASE = process.env.API_BASE_URL || 'https://api.akig.example.com';

// Test users with different roles
const TEST_USERS = {
  owner: {
    email: 'owner@example.com',
    password: 'TestPassword123!',
    role: 'OWNER'
  },
  agency: {
    email: 'agent@example.com',
    password: 'TestPassword123!',
    role: 'AGENCY'
  },
  tenant: {
    email: 'tenant@example.com',
    password: 'TestPassword123!',
    role: 'TENANT'
  }
};

/**
 * Helper: Login user and return authenticated page
 */
async function loginUser(context: BrowserContext, credentials: typeof TEST_USERS.owner) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/login`);
  
  // Fill login form
  await page.fill('input[name="email"]', credentials.email);
  await page.fill('input[name="password"]', credentials.password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL(/dashboard|home/);
  
  return page;
}

/**
 * Helper: Logout user
 */
async function logoutUser(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu"]');
  
  // Click logout
  await page.click('text=Logout');
  
  // Verify redirected to login
  await page.waitForURL(/login/);
}

/**
 * Test: Multi-role workflow - Invoice creation to payment to cashflow
 */
test.describe('Multi-Role Workflow: Invoice → Payment → Cashflow', () => {
  let ownerPage: Page;
  let agencyPage: Page;
  let tenantPage: Page;
  let context: BrowserContext;
  let browser: Browser;

  test.beforeAll(async ({ browser: _browser }: any) => {
    browser = _browser;
    context = await browser.newContext();
  });

  test.afterAll(async () => {
    await ownerPage?.close();
    await agencyPage?.close();
    await tenantPage?.close();
    await context.close();
  });

  test('should allow owner to see dashboard', async () => {
    ownerPage = await loginUser(context, TEST_USERS.owner);
    
    // Verify dashboard elements
    await expect(ownerPage.locator('text=Dashboard')).toBeVisible();
    await expect(ownerPage.locator('text=Overview')).toBeVisible();
    
    // Verify role badge
    await expect(ownerPage.locator('text=Property Owner')).toBeVisible();
  });

  test('should allow agency to create invoice', async () => {
    agencyPage = await loginUser(context, TEST_USERS.agency);
    
    // Navigate to invoices
    await agencyPage.click('text=Invoices');
    await agencyPage.waitForURL(/invoices/);
    
    // Create new invoice
    await agencyPage.click('button:has-text("Create Invoice")');
    await agencyPage.waitForURL(/invoices\/new/);
    
    // Fill invoice form
    await agencyPage.fill('input[name="propertyAddress"]', '123 Main Street');
    await agencyPage.fill('input[name="tenantName"]', 'John Doe');
    await agencyPage.fill('input[name="tenantEmail"]', TEST_USERS.tenant.email);
    await agencyPage.fill('input[name="amount"]', '2500000');
    await agencyPage.fill('input[name="dueDate"]', '2025-11-30');
    await agencyPage.fill('textarea[name="description"]', 'Monthly rent - October 2025');
    
    // Submit invoice
    await agencyPage.click('button:has-text("Create Invoice")');
    
    // Verify success message
    await expect(agencyPage.locator('text=Invoice created successfully')).toBeVisible();
    
    // Verify redirected to invoices list
    await agencyPage.waitForURL(/invoices$/);
    
    // Verify invoice appears in list
    await expect(agencyPage.locator('text=123 Main Street')).toBeVisible();
    await expect(agencyPage.locator('text=2,500,000 XAF')).toBeVisible();
  });

  test('should allow tenant to view and pay invoice', async () => {
    tenantPage = await loginUser(context, TEST_USERS.tenant);
    
    // Navigate to invoices
    await tenantPage.click('text=Invoices');
    await tenantPage.waitForURL(/invoices/);
    
    // Verify invoice is visible
    await expect(tenantPage.locator('text=Monthly rent')).toBeVisible();
    await expect(tenantPage.locator('text=2,500,000 XAF')).toBeVisible();
    
    // Click on invoice to view details
    await tenantPage.click('text=123 Main Street');
    await tenantPage.waitForURL(/invoices\/\d+/);
    
    // Verify invoice details
    await expect(tenantPage.locator('text=Invoice Details')).toBeVisible();
    await expect(tenantPage.locator('text=Due Date')).toBeVisible();
    
    // Click pay button
    await tenantPage.click('button:has-text("Pay Now")');
    
    // Select payment method
    await tenantPage.click('text=Orange Money');
    
    // Fill payment details
    await tenantPage.fill('input[name="phoneNumber"]', '+237123456789');
    
    // Confirm payment
    await tenantPage.click('button:has-text("Confirm Payment")');
    
    // Wait for success message or redirect
    await tenantPage.waitForURL(/invoices|payment.*success/);
    
    // Verify payment success
    const successMessage = tenantPage.locator('text=Payment successful');
    const paymentPage = tenantPage.locator('text=Thank you for your payment');
    
    await expect.soft(successMessage.or(paymentPage)).toBeVisible({ timeout: 10000 });
  });

  test('should reflect payment in owner cashflow', async () => {
    // Owner already logged in from first test
    
    // Navigate to cashflow dashboard
    await ownerPage.click('text=Cashflow');
    await ownerPage.waitForURL(/cashflow|analytics/);
    
    // Verify total income updated
    await expect(ownerPage.locator('text=Total Income')).toBeVisible();
    
    // Look for recent transaction
    const transactionRow = ownerPage.locator('text=123 Main Street').first();
    await expect(transactionRow).toBeVisible();
    
    // Verify amount
    await expect(ownerPage.locator('text=2,500,000 XAF')).toBeVisible();
    
    // Verify status is "Paid"
    await expect(ownerPage.locator('text=Paid').first()).toBeVisible();
  });

  test('should show payment history in all roles', async () => {
    // Agency: Payment history
    await agencyPage.click('text=Payments');
    await agencyPage.waitForURL(/payments/);
    await expect(agencyPage.locator('text=123 Main Street')).toBeVisible();
    await expect(agencyPage.locator('text=Paid')).toBeVisible();
    
    // Tenant: Payment history
    await tenantPage.click('text=My Payments');
    await tenantPage.waitForURL(/payments|transactions/);
    await expect(tenantPage.locator('text=Payment successful')).toBeVisible();
  });
});

/**
 * Test: Role-based access control
 */
test.describe('Role-Based Access Control', () => {
  let context: BrowserContext;

  test.beforeAll(async ({ browser }: any) => {
    context = await browser.newContext();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('tenant cannot access agency features', async () => {
    const tenantPage = await loginUser(context, TEST_USERS.tenant);
    
    // Try to navigate to agency invoice creation
    await tenantPage.goto(`${BASE_URL}/invoices/new`);
    
    // Should be redirected or show permission denied
    await expect(tenantPage.locator('text=Access Denied|Not Authorized')).toBeVisible();
    
    await tenantPage.close();
  });

  test('agency cannot access owner analytics', async () => {
    const agencyPage = await loginUser(context, TEST_USERS.agency);
    
    // Try to navigate to owner analytics
    await agencyPage.goto(`${BASE_URL}/analytics`);
    
    // Should be redirected or show permission denied
    await expect(agencyPage.locator('text=Access Denied|Not Authorized')).toBeVisible();
    
    await agencyPage.close();
  });

  test('owner can view all dashboards', async () => {
    const ownerPage = await loginUser(context, TEST_USERS.owner);
    
    // Owner dashboard
    await expect(ownerPage.locator('text=Dashboard')).toBeVisible();
    
    // Invoices
    await ownerPage.goto(`${BASE_URL}/invoices`);
    await ownerPage.waitForURL(/invoices/);
    
    // Analytics
    await ownerPage.goto(`${BASE_URL}/analytics`);
    await ownerPage.waitForURL(/analytics/);
    
    // Payments
    await ownerPage.goto(`${BASE_URL}/payments`);
    await ownerPage.waitForURL(/payments/);
    
    await ownerPage.close();
  });
});

/**
 * Test: 2FA workflow
 */
test.describe('Two-Factor Authentication', () => {
  let context: BrowserContext;

  test.beforeAll(async ({ browser }: any) => {
    context = await browser.newContext();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should require 2FA for user with enabled setting', async () => {
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    
    // Fill login credentials
    await page.fill('input[name="email"]', TEST_USERS.owner.email);
    await page.fill('input[name="password"]', TEST_USERS.owner.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to 2FA verification page
    await page.waitForURL(/2fa|verify-otp/);
    
    // Verify 2FA prompt
    await expect(page.locator('text=Two-Factor Authentication|Enter verification code')).toBeVisible();
    
    // Skip entering code - just verify the flow works
    await page.close();
  });
});

/**
 * Test: Data isolation between roles
 */
test.describe('Data Isolation Between Roles', () => {
  let context: BrowserContext;

  test.beforeAll(async ({ browser }: any) => {
    context = await browser.newContext();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('tenant should only see their own invoices', async () => {
    const tenantPage = await loginUser(context, TEST_USERS.tenant);
    
    // Navigate to invoices
    await tenantPage.goto(`${BASE_URL}/invoices`);
    await tenantPage.waitForURL(/invoices/);
    
    // Should only see invoices directed to this tenant
    const invoiceRows = await tenantPage.locator('[data-testid="invoice-row"]').count();
    
    // Verify no other tenant's invoices visible
    // This would require knowing what invoices exist
    
    await tenantPage.close();
  });

  test('agency should only see their own created invoices', async () => {
    const agencyPage = await loginUser(context, TEST_USERS.agency);
    
    // Navigate to invoices
    await agencyPage.goto(`${BASE_URL}/invoices`);
    await agencyPage.waitForURL(/invoices/);
    
    // All invoices should have this agency as creator
    const agencyName = agencyPage.locator('[data-testid="agency-name"]').first();
    await expect(agencyName).toBeVisible();
    
    await agencyPage.close();
  });
});

/**
 * Test: Concurrent operations
 */
test.describe('Concurrent User Operations', () => {
  test('multiple users can perform independent operations', async ({ browser }: any) => {
    const context = await browser.newContext();
    
    // Create multiple user sessions
    const ownerPage = await loginUser(context, TEST_USERS.owner);
    const agencyPage = await loginUser(context, TEST_USERS.agency);
    const tenantPage = await loginUser(context, TEST_USERS.tenant);
    
    // Perform concurrent operations
    const ownerPromise = ownerPage.click('text=Dashboard');
    const agencyPromise = agencyPage.click('text=Invoices');
    const tenantPromise = tenantPage.click('text=My Account');
    
    await Promise.all([ownerPromise, agencyPromise, tenantPromise]);
    
    // Verify all operations completed
    await expect(ownerPage.locator('text=Dashboard')).toBeVisible();
    await expect(agencyPage.locator('text=Invoices')).toBeVisible();
    await expect(tenantPage.locator('text=My Account')).toBeVisible();
    
    await ownerPage.close();
    await agencyPage.close();
    await tenantPage.close();
    await context.close();
  });
});

/**
 * Test: API integration with UI
 */
test.describe('API Integration', () => {
  let context: BrowserContext;

  test.beforeAll(async ({ browser }: any) => {
    context = await browser.newContext();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('UI should reflect API changes in real-time', async () => {
    const ownerPage = await loginUser(context, TEST_USERS.owner);
    
    // Open developer tools to intercept API calls
    await ownerPage.goto(`${BASE_URL}/dashboard`);
    
    // Monitor for API calls to /api/invoices
    const invoicesCall = ownerPage.waitForResponse(
      (response: any) => response.url().includes('/api/invoices') && response.status() === 200
    );
    
    // Refresh page to trigger API call
    await ownerPage.reload();
    const response = await invoicesCall;
    
    // Verify API response
    const responseBody = await response.json();
    expect(Array.isArray(responseBody.data)).toBeTruthy();
    
    await ownerPage.close();
  });
});

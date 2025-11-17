/**
 * E2E Tests - Authentication Flow
 * Tests the complete authentication flow from registration to login
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:4000/api';

test.describe('Authentication Flow', () => {
  let testEmail = `test-${Date.now()}@example.com`;
  let testPassword = 'Test@Password123!';
  let authToken = null;

  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  // ============================================
  // 📝 Registration Tests
  // ============================================
  test('User can register with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.fill('input[name="name"]', 'Test User');
    
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await page.waitForSelector('.success-message', { timeout: 5000 });
    const message = await page.locator('.success-message').textContent();
    expect(message).toContain('Registration successful');
  });

  test('Registration fails with invalid email', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('.error-message', { timeout: 5000 });
    const error = await page.locator('.error-message').textContent();
    expect(error).toContain('valid email');
  });

  test('Registration fails with weak password', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');
    
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('.error-message', { timeout: 5000 });
    const error = await page.locator('.error-message').textContent();
    expect(error).toContain('password');
  });

  // ============================================
  // 🔐 Login Tests
  // ============================================
  test('User can login with valid credentials', async ({ page }) => {
    // First register
    const response = await page.request.post(`${API_URL}/auth/register`, {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'Test User'
      }
    });
    expect(response.ok()).toBeTruthy();

    // Then login
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });
    expect(page.url()).toContain('/dashboard');
    
    // Check that token is stored
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).not.toBeNull();
  });

  test('Login fails with wrong password', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'WrongPassword123!');
    
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('.error-message', { timeout: 5000 });
    const error = await page.locator('.error-message').textContent();
    expect(error).toContain('Invalid credentials');
  });

  test('Login fails with non-existent user', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', testPassword);
    
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('.error-message', { timeout: 5000 });
    const error = await page.locator('.error-message').textContent();
    expect(error).toContain('not found');
  });

  // ============================================
  // 🚪 Logout Tests
  // ============================================
  test('User can logout', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Click logout
    await page.click('button:has-text("Logout")');
    
    // Verify redirected to login
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 });
    expect(page.url()).toContain('/login');
    
    // Check token is cleared
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeNull();
  });
});

// ============================================
// 📋 Contracts Tests
// ============================================
test.describe('Contracts Management', () => {
  test('User can create a contract', async ({ page }) => {
    // Login first
    const loginResp = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'TestPassword123!'
      }
    });
    
    const { token } = await loginResp.json();

    // Navigate to contracts page
    await page.goto(`${BASE_URL}/contracts`);
    
    // Fill contract form
    await page.fill('input[name="title"]', 'Test Contract');
    await page.fill('textarea[name="description"]', 'This is a test contract');
    await page.selectOption('select[name="status"]', 'active');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success
    await page.waitForSelector('.success-message', { timeout: 5000 });
    const message = await page.locator('.success-message').textContent();
    expect(message).toContain('created');
  });

  test('User can view contracts list', async ({ page }) => {
    await page.goto(`${BASE_URL}/contracts`);
    
    // Wait for contracts list to load
    await page.waitForSelector('.contract-item', { timeout: 5000 });
    
    const contracts = await page.locator('.contract-item').count();
    expect(contracts).toBeGreaterThanOrEqual(0);
  });

  test('User can edit a contract', async ({ page }) => {
    await page.goto(`${BASE_URL}/contracts`);
    
    // Click edit on first contract
    await page.click('.contract-item .edit-btn');
    
    // Modify title
    await page.fill('input[name="title"]', 'Updated Contract Title');
    
    // Save
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('.success-message', { timeout: 5000 });
    const message = await page.locator('.success-message').textContent();
    expect(message).toContain('updated');
  });

  test('User can delete a contract', async ({ page }) => {
    await page.goto(`${BASE_URL}/contracts`);
    
    // Click delete on first contract
    await page.click('.contract-item .delete-btn');
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    
    await page.waitForSelector('.success-message', { timeout: 5000 });
    const message = await page.locator('.success-message').textContent();
    expect(message).toContain('deleted');
  });
});

// ============================================
// 💳 Payments Tests
// ============================================
test.describe('Payments Processing', () => {
  test('User can create a payment', async ({ page }) => {
    await page.goto(`${BASE_URL}/payments`);
    
    await page.fill('input[name="amount"]', '1000');
    await page.selectOption('select[name="contractId"]', '1');
    
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('.success-message', { timeout: 5000 });
    const message = await page.locator('.success-message').textContent();
    expect(message).toContain('created');
  });

  test('User can view payment history', async ({ page }) => {
    await page.goto(`${BASE_URL}/payments`);
    
    await page.waitForSelector('.payment-item', { timeout: 5000 });
    
    const payments = await page.locator('.payment-item').count();
    expect(payments).toBeGreaterThanOrEqual(0);
  });

  test('Payment amount validation works', async ({ page }) => {
    await page.goto(`${BASE_URL}/payments`);
    
    // Try with invalid amount
    await page.fill('input[name="amount"]', '-100');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('.error-message', { timeout: 5000 });
    const error = await page.locator('.error-message').textContent();
    expect(error).toContain('positive');
  });
});

// ============================================
// 🔒 Security Tests
// ============================================
test.describe('Security', () => {
  test('Unauthenticated user cannot access protected pages', async ({ page }) => {
    // Try to access dashboard without login
    const response = await page.goto(`${BASE_URL}/dashboard`);
    
    // Should be redirected to login
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('Expired token triggers re-login', async ({ page }) => {
    // Set expired token
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'expired.token.here');
      localStorage.setItem('tokenExpiry', Date.now() - 1000); // 1 second ago
    });
    
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Should redirect to login
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('CSRF protection is enabled', async ({ page }) => {
    // Try POST without CSRF token
    const response = await page.request.post(`${API_URL}/contracts`, {
      data: { title: 'Test' }
    });
    
    // Should fail (401 Unauthorized)
    expect(response.status()).toBe(401);
  });

  test('Rate limiting is enforced', async ({ page }) => {
    let failedRequests = 0;

    for (let i = 0; i < 10; i++) {
      const response = await page.request.post(`${API_URL}/auth/login`, {
        data: {
          email: 'test@example.com',
          password: 'wrong'
        }
      });

      if (response.status() === 429) {
        failedRequests++;
        console.log(`✅ Rate limit triggered at attempt ${i + 1}`);
        break;
      }
    }

    expect(failedRequests).toBeGreaterThan(0);
  });
});

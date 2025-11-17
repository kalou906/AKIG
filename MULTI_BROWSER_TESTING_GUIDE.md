# Multi-Browser Testing Implementation Guide

## Quick Start

This guide helps you implement comprehensive multi-browser testing across your AKIG deployment.

---

## 1. Installation & Setup (15 minutes)

### Step 1: Install Test Dependencies

```bash
cd frontend
npm install --save-dev @playwright/test @playwright/chromium playwright-core
npm install --save-dev axe-playwright  # For accessibility testing
```

### Step 2: Verify Playwright Configuration

The `playwright.config.js` is already configured with:
- ✅ 8 browser projects (Chrome, Firefox, Safari, Edge, iPad, Mobile Chrome, Mobile Safari, Legacy)
- ✅ HTML, JSON, JUnit reporters
- ✅ Video and screenshot capture on failure
- ✅ 30-second test timeout
- ✅ Retry logic for CI/CD

### Step 3: Initialize Test Directories

```bash
# Already created test files:
frontend/tests/e2e.spec.js          # Authentication tests
frontend/tests/contracts.spec.js    # Contract management tests
frontend/tests/payments.spec.js     # Payment processing tests
frontend/tests/dashboard-sms.spec.js # Dashboard & SMS tests
frontend/tests/exports.spec.js      # Export functionality tests
```

---

## 2. Running Tests Locally

### Run All Tests

```bash
cd frontend
npm test  # Runs Playwright tests
```

### Run Tests for Specific Browser

```bash
# Chromium (Chrome/Edge engine)
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# WebKit (Safari)
npx playwright test --project=webkit

# Mobile Chrome (Pixel 5)
npx playwright test --project="Mobile Chrome"

# Mobile Safari (iPhone 12)
npx playwright test --project="Mobile Safari"
```

### Run Tests in UI Mode (Recommended for Development)

```bash
npx playwright test --ui
```

Features:
- Visual test runner with time travel debugging
- Step-by-step execution
- Inspector for element selection
- Network activity tracking

### Watch Mode

```bash
npx playwright test --watch
```

Re-runs tests on file changes.

### Run Single Test File

```bash
npx playwright test tests/contracts.spec.js
```

### Run Tests Matching Pattern

```bash
npx playwright test -g "User can create contract"
```

---

## 3. Viewing Test Reports

### HTML Report

```bash
npx playwright show-report
```

Opens interactive HTML report in browser with:
- Test results and duration
- Failed test details
- Screenshots/videos
- Step-by-step execution

### Console Report

Tests automatically print results to console:
```
✓ tests/e2e.spec.js > Authentication Flow > User can register with valid credentials (2.3s)
✓ tests/e2e.spec.js > Authentication Flow > Registration fails with invalid email (1.8s)
✗ tests/contracts.spec.js > Contract Creation > User can create contract with valid data (3.1s)
  Error: Timeout waiting for selector '[data-testid="success-notification"]'
```

---

## 4. GitHub Actions CI/CD Setup

### Automated Testing on Every Push

The workflow `.github/workflows/playwright-tests.yml` is already configured to:

**On Push/Pull Request**:
- Run tests on 3 OS (Ubuntu, Windows, macOS)
- Test on 3 browsers (Chrome, Firefox, Safari)
- Run mobile tests (Android, iOS)
- Check accessibility
- Check performance
- Generate reports

**View Results**:
1. Go to your GitHub repository
2. Click "Actions" tab
3. Click latest workflow run
4. View test results
5. Download artifacts (screenshots, videos, reports)

### Setup Secrets for CI/CD

In GitHub Settings > Secrets and variables > Actions, add:

```
DATABASE_URL=postgresql://user:password@localhost:5432/akig_test
JWT_SECRET=your-test-secret-key
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

---

## 5. Error Tracking Setup

### Sentry Integration

**Step 1: Create Sentry Account**
1. Visit https://sentry.io
2. Sign up for free account
3. Create new project for AKIG
4. Select "React" platform
5. Copy DSN

**Step 2: Configure in Frontend**

Create `.env.production` (or update):
```
REACT_APP_SENTRY_DSN=https://your-dsn@sentry.io/project-id
REACT_APP_VERSION=1.0.0
```

**Step 3: Enable in App.jsx**

```javascript
import { initializeSentry, setupBrowserSpecificTracking } from './utils/monitoring';

// Before rendering
if (process.env.NODE_ENV === 'production') {
  initializeSentry();
  setupBrowserSpecificTracking();
}
```

**Step 4: Verify**

Open production app in browser, trigger error (F12 console):
```javascript
throw new Error("Test error");
```

Error should appear in Sentry dashboard immediately.

---

## 6. Analytics Setup

### Google Analytics 4

**Step 1: Create GA4 Account**
1. Visit https://analytics.google.com
2. Create new property
3. Get Measurement ID (G-XXXXXXXXXX)

**Step 2: Configure**

```
REACT_APP_GA_ID=G-YOUR-MEASUREMENT-ID
```

**Step 3: Enable in App.jsx**

```javascript
import { initializeGoogleAnalytics, setupCrossBrowserAnalytics } from './utils/analytics';

useEffect(() => {
  initializeGoogleAnalytics();
  setupCrossBrowserAnalytics();
}, []);
```

**Step 4: View Reports**

In Google Analytics:
- Real-time dashboard shows visitors
- Custom events tracked by browser
- Device reports show mobile/desktop split
- Custom dimensions track browser version

---

## 7. Browser Compatibility Checking

### Check Browser Capabilities

```bash
# Build application with browser targeting
npm run build

# Test build with different browsers
npx playwright test tests/exports.spec.js --project=firefox
```

### View Compatibility Report

After running tests, check:
1. `test-results/junit.xml` - JUnit format
2. `test-results/results.json` - Detailed results
3. `test-results/html/index.html` - Visual report

### Common Failures & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `selector not found` | Element not visible yet | Add `waitForSelector()` with timeout |
| `element not clickable` | Element covered or hidden | Wait for element to be visible |
| `network error` | Backend not running | Start backend before tests |
| `timeout` | Test taking too long | Increase timeout or optimize test |

---

## 8. Writing New Tests

### Test Template

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to app, login, etc.
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
  });

  test('Should do something', async ({ page }) => {
    // Act: Perform action
    await page.goto('http://localhost:3000/feature');
    await page.click('[data-testid="button"]');
    
    // Assert: Verify result
    const text = await page.locator('[data-testid="result"]').textContent();
    expect(text).toContain('Expected text');
  });

  test('Should handle errors', async ({ page }) => {
    // Test error scenarios
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    
    const errorMsg = await page.locator('[data-testid="error"]').textContent();
    expect(errorMsg).toContain('Invalid email');
  });
});
```

### Best Practices

1. **Use data-testid Attributes**
   ```jsx
   <button data-testid="submit-button">Submit</button>
   ```
   In test:
   ```javascript
   await page.click('[data-testid="submit-button"]');
   ```

2. **Wait for Elements Properly**
   ```javascript
   // Good - waits up to 5 seconds
   await page.waitForSelector('[data-testid="result"]', { timeout: 5000 });
   
   // Avoid - fails immediately if not visible
   await page.click('[data-testid="result"]');
   ```

3. **Test Realistic User Flows**
   ```javascript
   // Good - full workflow
   await page.fill('input[name="email"]', 'user@example.com');
   await page.fill('input[name="password"]', 'password');
   await page.click('button[type="submit"]');
   await page.waitForURL('/dashboard');
   
   // Avoid - isolated DOM manipulation
   await page.evaluate(() => { localStorage.setItem('token', 'xxx'); });
   ```

4. **Handle Async Operations**
   ```javascript
   // Good - wait for network response
   const downloadPromise = page.waitForEvent('download');
   await page.click('[data-testid="export-button"]');
   const download = await downloadPromise;
   
   // Avoid - race conditions
   await page.click('[data-testid="export-button"]');
   ```

---

## 9. Debugging Failed Tests

### Enable Debug Mode

```bash
# Run single test with debugging
npx playwright test tests/contracts.spec.js -g "specific test" --debug
```

Opens Playwright Inspector with:
- Step through execution
- Inspect elements
- Execute JavaScript in console
- View network requests

### Check Screenshots

Failed tests automatically capture screenshots:
```
test-results/failed-screenshot.png
```

View in HTML report or directly in file explorer.

### View Test Video

WebKit tests automatically record on failure:
```
test-results/test-failed-1.webm
```

Use any video player to watch test execution frame-by-frame.

### Check Server Logs

If tests fail, check if servers are running:

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
cd frontend
npm start

# Terminal 3: Run tests
npm test
```

---

## 10. Performance Benchmarking

### Run Performance Tests

```bash
npx playwright test tests/performance.spec.js
```

Measures:
- Page load time
- Network latency
- Memory usage
- CPU usage

### Optimization Tips

**Frontend**:
- Code splitting (React.lazy)
- Image optimization
- CSS/JS minification
- Service Worker for caching

**Backend**:
- Database query optimization
- Response compression
- API pagination
- Caching headers

---

## 11. Integration with Development Workflow

### Pre-commit Testing

Install husky:
```bash
npm install husky --save-dev
npx husky install
npx husky add .husky/pre-commit "npm test"
```

Runs tests before each commit.

### Continuous Integration

GitHub Actions automatically runs:
- On every push to main/develop/staging
- On every pull request
- Daily schedule (2 AM UTC)

View results in GitHub Actions tab.

---

## 12. Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests timeout | Increase timeout or check if servers running |
| Selector not found | Check data-testid exists in app code |
| Flaky tests | Add explicit waits for async operations |
| Different results per run | Check for random data/timing issues |
| Mobile tests fail on desktop | Use correct device in config |
| Screenshot differences | Update baseline if intentional change |

---

## 13. Next Steps

1. **Run local tests**: `npm test`
2. **Push to GitHub**: Tests run automatically
3. **Setup Sentry**: Add error tracking
4. **Setup Analytics**: Track browser usage
5. **Add more tests**: Use templates above
6. **Review compatibility**: Check guide in appendix
7. **Monitor production**: Watch Sentry dashboard

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests |
| `npx playwright test --ui` | UI test runner |
| `npx playwright show-report` | View HTML report |
| `npx playwright test --debug` | Debug mode |
| `npm run build` | Build for production |
| `npm start` | Start dev server |

---

**Support**: Check `.github/workflows/playwright-tests.yml` for CI/CD examples

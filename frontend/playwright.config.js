// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * See https://playwright.dev/docs/test-configuration.
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Test timeout - 30s for slow network conditions */
  timeout: 30000,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'test-results/html', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    /* Video on failure for debugging */
    video: 'retain-on-failure'
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },

    {
      name: 'chromium-edge',
      use: { ...devices['Desktop Edge'] }
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    },

    {
      name: 'iPad',
      use: { ...devices['iPad (gen 7)'] }
    },

    /* Legacy browser support via Chromium */
    {
      name: 'chromium-legacy',
      use: {
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko'
        }
      }
    }
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'npm start',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      cwd: './frontend'
    },
    {
      command: 'npm start',
      port: 4000,
      reuseExistingServer: !process.env.CI,
      cwd: './backend'
    }
  ]
});

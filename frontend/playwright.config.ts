/**
 * ============================================================
 * playwright.config.ts - Configuration multi-navigateur
 * Teste sur: Chrome (Chromium), Firefox, Safari (WebKit)
 * ============================================================
 */

// @ts-ignore - Playwright types are available at runtime
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  // Répertoire des tests
  testDir: './tests',

  // Exécution parallèle
  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  // Retries et workers
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 3,

  // Timeout global
  timeout: 30000,
  expect: { timeout: 5000 },

  // Reporters (HTML + JSON)
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // Configuration globale du navigateur
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Projets (navigateurs)
  projects: [
    {
      name: 'Chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchArgs: ['--disable-blink-features=AutomationControlled'],
      },
    },

    {
      name: 'Firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    {
      name: 'WebKit (Safari)',
      use: {
        ...devices['Desktop Safari'],
      },
    },

    // Mobile testing
    {
      name: 'Mobile Chrome (Android)',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari (iOS)',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Démarrage du serveur web
  webServer: {
    command: 'npm start',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

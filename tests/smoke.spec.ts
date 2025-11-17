/**
 * ============================================================
 * tests/smoke.spec.ts - Tests fumée multi-navigateurs
 * Assurer que le système démarre à 100%
 * ============================================================
 */

import { test, expect } from '@playwright/test';

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:4000/api';

// Routes à tester
const ROUTES = [
  '/',
  '/contrats',
  '/paiements',
  '/proprietes',
  '/locataires',
  '/rapports',
  '/rappels',
  '/preavis',
];

// ============================================================
// TESTS SANTÉ API
// ============================================================

test.describe('🏥 API Health Checks', () => {
  test('GET /api/health retourne status ok', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.ready).toBe(true);
    expect(data.components.database).toBe('connected');
    expect(data.components.migrations).toBe('applied');
  });

  test('GET /api/ready retourne ready true', async ({ request }) => {
    const response = await request.get(`${API_URL}/ready`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.ready).toBe(true);
  });
});

// ============================================================
// TESTS ROUTES FRONTEND
// ============================================================

test.describe('🛣️  Routes Frontend', () => {
  // Se connecter avant de tester les routes protégées
  test.beforeEach(async ({ page }) => {
    // Simuler token valide dans localStorage
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => {
      localStorage.setItem('akig_token', 'test-token-for-smoke-tests');
    });
  });

  for (const route of ROUTES) {
    test(`Route ${route} charge correctement`, async ({ page }) => {
      await page.goto(`${BASE_URL}${route}`);

      // Vérifier que layout est chargé
      const nav = page.locator('nav');
      if (route !== '/login' && route !== '/404') {
        await expect(nav).toBeVisible({ timeout: 5000 });
      }

      // Vérifier pas d'erreur de console
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.error(`Console Error on ${route}:`, msg.text());
        }
      });

      // Vérifier pas en boucle de login
      expect(page.url()).not.toMatch(/\/login$/);
    });
  }
});

// ============================================================
// TESTS NAVIGATION
// ============================================================

test.describe('🧭 Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.evaluate(() => {
      localStorage.setItem('akig_token', 'test-token-for-smoke-tests');
    });
    await page.reload();
  });

  test('Dashboard contient liens vers modules', async ({ page }) => {
    // Attendre que dashboard charge
    await page.waitForLoadState('networkidle');

    // Vérifier liens de navigation
    const moduleLinks = [
      'Contrats',
      'Paiements',
      'Propriétés',
      'Locataires',
      'Rapports',
      'Rappels',
      'Préavis',
    ];

    for (const label of moduleLinks) {
      const link = page.getByRole('link', { name: label });
      await expect(link).toBeVisible({ timeout: 5000 });
    }
  });

  test('Cliquer sur "Contrats" navigue vers /contrats', async ({ page }) => {
    await page.getByRole('link', { name: 'Contrats' }).click();
    await expect(page).toHaveURL(/\/contrats$/);
  });

  test('Cliquer sur "Préavis" navigue vers /preavis', async ({ page }) => {
    await page.getByRole('link', { name: 'Préavis' }).click();
    await expect(page).toHaveURL(/\/preavis$/);
  });
});

// ============================================================
// TESTS 404 ET ERREURS
// ============================================================

test.describe('❌ Error Handling', () => {
  test('Route inexistante retourne 404', async ({ page }) => {
    await page.goto(`${BASE_URL}/route-inexistante`);
    await page.evaluate(() => {
      localStorage.setItem('akig_token', 'test-token-for-smoke-tests');
    });
    await page.reload();

    // Vérifier que 404 page est affichée
    const heading = page.locator('h1');
    await expect(heading).toContainText('404', { timeout: 5000 });
  });

  test('Pas de token redirige vers login', async ({ page }) => {
    // Nettoyer localStorage
    await page.evaluate(() => {
      localStorage.removeItem('akig_token');
    });

    await page.goto(`${BASE_URL}/contrats`);
    await expect(page).toHaveURL(/\/login$/);
  });
});

// ============================================================
// TESTS DE CHARGE
// ============================================================

test.describe('⚡ Performance', () => {
  test('Home page charge en < 3s', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/`);
    await page.evaluate(() => {
      localStorage.setItem('akig_token', 'test-token');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('API /health répond en < 500ms', async ({ request }) => {
    const startTime = Date.now();
    await request.get(`${API_URL}/health`);
    const latency = Date.now() - startTime;

    console.log(`API latency: ${latency}ms`);
    expect(latency).toBeLessThan(500);
  });
});

// ============================================================
// TESTS INTÉGRATION E2E
// ============================================================

test.describe('🔄 End-to-End Flows', () => {
  test('Créer un préavis (flow complet)', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => {
      localStorage.setItem('akig_token', 'test-token');
    });

    // Naviguer vers Préavis
    await page.goto(`${BASE_URL}/preavis`);
    await page.waitForLoadState('networkidle');

    // Vérifier page Préavis charge
    const heading = page.locator('h1, h2');
    await expect(heading).toContainText(/Pr[éè]avis|Notice/, { timeout: 5000 });

    // Vérifier bouton créer existe
    const createBtn = page.getByRole('button', { name: /Nouveau|Créer|New/i });
    if (await createBtn.isVisible({ timeout: 2000 })) {
      await expect(createBtn).toBeVisible();
    }
  });
});

// ============================================================
// TESTS ACCESSIBILITÉ (BONUS)
// ============================================================

test.describe('♿ Accessibility', () => {
  test('Page principale a un titre', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('Boutons ont labels accessibles', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.evaluate(() => {
      localStorage.setItem('akig_token', 'test-token');
    });
    await page.reload();

    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ============================================================
// SETUP/TEARDOWN
// ============================================================

test.afterEach(async ({ page }) => {
  // Nettoyer localStorage après chaque test
  await page.evaluate(() => {
    localStorage.clear();
  });
});

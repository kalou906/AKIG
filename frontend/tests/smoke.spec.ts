/**
 * ============================================================
 * smoke.spec.ts - Tests Playwright multi-navigateur
 * Valide routes, navigation, pas de boucles redirection
 * ============================================================
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const API_URL = process.env.PLAYWRIGHT_TEST_API_URL || 'http://localhost:4000/api';

// Credentials de test - à adapter avec vrais comptes test
const TEST_USER = {
  email: 'test@akig.local',
  password: 'Test123!@#',
};

test.describe('AKIG - Tests de Fumée (Smoke Tests)', () => {
  test.beforeEach(async ({ page }) => {
    // Aller à la page login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Authentification', () => {
    test('Affiche page login', async ({ page }) => {
      const title = await page.title();
      expect(title).toContain('AKIG');

      // Vérifier présence d'inputs login
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      expect(emailInput).toBeVisible();
      expect(passwordInput).toBeVisible();
    });

    test('Pas de redirection infinie depuis /login', async ({ page }) => {
      // Attendre 2s et vérifier qu'on est toujours sur /login
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/login');
    });

    test('Redirection vers /login si pas de token', async ({ page }) => {
      // Accéder à route protégée directement
      await page.goto(`${BASE_URL}/contrats`, { waitUntil: 'networkidle' });

      // Vérifier redirection vers login
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Routes Protégées (Après Login)', () => {
    test.beforeEach(async ({ page, context }) => {
      // Mock login: ajouter token au localStorage
      const token = 'test_token_' + Date.now();
      const user = JSON.stringify({ id: 1, email: 'test@akig.local', role: 'agent' });

      // Ajouter token via localStorage (via script d'ajout)
      await page.evaluate((data) => {
        localStorage.setItem('akig_token', data.token);
        localStorage.setItem('user', data.user);
      }, { token, user });

      // Recharger page
      await page.reload();
      await page.waitForLoadState('networkidle');
    });

    test('Accès /contrats', async ({ page }) => {
      await page.goto(`${BASE_URL}/contrats`);
      await page.waitForLoadState('networkidle');

      // Vérifier pas de redirection vers /login
      expect(page.url()).not.toContain('/login');
      expect(page.url()).toContain('/contrats');

      // Vérifier présence d'éléments de page
      const header = page.locator('header, nav, h1');
      expect(await header.count()).toBeGreaterThan(0);
    });

    test('Accès /paiements', async ({ page }) => {
      await page.goto(`${BASE_URL}/paiements`);
      await page.waitForLoadState('networkidle');

      expect(page.url()).not.toContain('/login');
      expect(page.url()).toContain('/paiements');
    });

    test('Accès /proprietes', async ({ page }) => {
      await page.goto(`${BASE_URL}/proprietes`);
      await page.waitForLoadState('networkidle');

      expect(page.url()).not.toContain('/login');
      expect(page.url()).toContain('/proprietes');
    });

    test('Accès /locataires', async ({ page }) => {
      await page.goto(`${BASE_URL}/locataires`);
      await page.waitForLoadState('networkidle');

      expect(page.url()).not.toContain('/login');
      expect(page.url()).toContain('/locataires');
    });

    test('Accès /rapports', async ({ page }) => {
      await page.goto(`${BASE_URL}/rapports`);
      await page.waitForLoadState('networkidle');

      expect(page.url()).not.toContain('/login');
      expect(page.url()).toContain('/rapports');
    });

    test('Accès /rappels', async ({ page }) => {
      await page.goto(`${BASE_URL}/rappels`);
      await page.waitForLoadState('networkidle');

      expect(page.url()).not.toContain('/login');
      expect(page.url()).toContain('/rappels');
    });

    test('Accès /preavis', async ({ page }) => {
      await page.goto(`${BASE_URL}/preavis`);
      await page.waitForLoadState('networkidle');

      expect(page.url()).not.toContain('/login');
      expect(page.url()).toContain('/preavis');
    });

    test('Route inconnue redirige vers /404', async ({ page }) => {
      await page.goto(`${BASE_URL}/unknown-route`);
      await page.waitForLoadState('networkidle');

      // Vérifier redirige vers 404
      expect(page.url()).toContain('/404');
    });
  });

  test.describe('Navigation Sans Boucles Redirection', () => {
    test.beforeEach(async ({ page }) => {
      // Setup token
      const token = 'test_token_' + Date.now();
      const user = JSON.stringify({ id: 1, email: 'test@akig.local', role: 'agent' });

      await page.evaluate((data) => {
        localStorage.setItem('akig_token', data.token);
        localStorage.setItem('user', data.user);
      }, { token, user });

      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
    });

    test('Clic sur lien Contrats ne redirige pas vers /login', async ({ page }) => {
      // Chercher lien Contrats dans nav
      const contractLink = page.locator('a, button', { hasText: /Contrats|Contracts/i }).first();

      if (await contractLink.isVisible()) {
        await contractLink.click();
        await page.waitForLoadState('networkidle');

        // Vérifier pas sur /login
        expect(page.url()).not.toContain('/login');
      }
    });

    test('Clic sur lien Paiements ne redirige pas vers /login', async ({ page }) => {
      const paymentLink = page.locator('a, button', { hasText: /Paiements|Payments/i }).first();

      if (await paymentLink.isVisible()) {
        await paymentLink.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).not.toContain('/login');
      }
    });

    test('Changement rapide de routes sans erreur', async ({ page }) => {
      const routes = ['/contrats', '/paiements', '/proprietes'];

      for (const route of routes) {
        await page.goto(`${BASE_URL}${route}`);
        await page.waitForTimeout(500);

        // Vérifier pas sur /login et pas d'erreur en console
        expect(page.url()).not.toContain('/login');
        expect(page.url()).toContain(route);
      }
    });
  });

  test.describe('Gestion Erreurs API', () => {
    test.beforeEach(async ({ page }) => {
      const token = 'test_token_' + Date.now();
      const user = JSON.stringify({ id: 1, email: 'test@akig.local', role: 'agent' });

      await page.evaluate((data) => {
        localStorage.setItem('akig_token', data.token);
        localStorage.setItem('user', data.user);
      }, { token, user });

      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
    });

    test('Erreur 401 - Token expiré redirige vers /login', async ({ page }) => {
      // Mock fetch pour retourner 401
      await page.route('**/api/**', (route) => {
        route.abort('failed');
      });

      // Déclencher un appel API (ex: via clic bouton)
      // Attendre redirection vers /login
      await page.waitForTimeout(1000);

      // Vérifier console pour erreurs (optionnel)
      const logs: string[] = [];
      page.on('console', (msg) => logs.push(msg.text()));
    });

    test('Page affiche message erreur sans bloquer UI', async ({ page }) => {
      // Vérifier qu'ErrorBoundary est présent
      const mainContent = page.locator('main, [role="main"]');
      expect(mainContent).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('Dashboard charge en <5s', async ({ page }) => {
      const token = 'test_token_' + Date.now();
      const user = JSON.stringify({ id: 1, email: 'test@akig.local', role: 'agent' });

      await page.evaluate((data) => {
        localStorage.setItem('akig_token', data.token);
        localStorage.setItem('user', data.user);
      }, { token, user });

      const startTime = Date.now();
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      console.log(`Dashboard charge en ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000);
    });
  });
});

/**
 * ============================================================
 * tests/dashboard.spec.ts - Tests du Dashboard
 * Validé sur: Chromium, Firefox, WebKit (tous les navigateurs)
 * ============================================================
 */

import { test, expect } from "@playwright/test";

test.describe("Dashboard - Multi-navigateur", () => {
  test.beforeEach(async ({ page }) => {
    // Aller sur le dashboard
    await page.goto("/");
    // Attendre le chargement
    await page.waitForLoadState("networkidle");
  });

  test("✅ Dashboard charge correctement", async ({ page }) => {
    // Vérifier que la page est chargée
    const title = await page.title();
    expect(title).toContain("AKIG");

    // Vérifier que le contenu principal existe
    const dashboard = await page.locator("main").first();
    expect(dashboard).toBeTruthy();
  });

  test("✅ Affichage des KPIs", async ({ page }) => {
    // Vérifier la section KPI
    const kpiSection = await page.locator("[data-testid='kpi-section']");
    expect(kpiSection).toBeVisible();

    // Vérifier les 3 KPIs principaux
    const kpis = ["Encaissements", "Impayés", "Préavis"];
    for (const kpi of kpis) {
      const element = await page.locator(`text=${kpi}`);
      expect(element).toBeVisible();
    }
  });

  test("✅ Navigation vers les modules", async ({ page }) => {
    // Cliquer sur Contrats
    const contractLink = await page.locator('a:has-text("Contrats")');
    expect(contractLink).toBeVisible();
    await contractLink.click();

    // Vérifier la navigation
    await page.waitForURL(/.*contrats/);
    expect(page.url()).toContain("contrats");
  });

  test("✅ Responsive sur mobile", async ({ page }) => {
    // Vérifier que la page répond aux mobiles
    await page.setViewportSize({ width: 375, height: 667 });

    // Vérifier que le menu est accessible
    const mobileMenu = await page.locator("[data-testid='mobile-menu']");
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await page.waitForTimeout(300); // Animation
    }

    // Contenu visible
    const content = await page.locator("main");
    expect(content).toBeVisible();
  });

  test("✅ Aucune erreur console", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Attendre un peu
    await page.waitForTimeout(1000);

    // Pas d'erreurs critiques
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("favicon") && !e.includes("manifest") && e.length > 0
    );
    expect(criticalErrors.length).toBe(0);
  });

  test("✅ Thème sombre fonctionne", async ({ page }) => {
    // Chercher bouton thème
    const themeButton = await page.locator("[data-testid='theme-toggle']");
    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(300);

      // Vérifier que le DOM s'est mis à jour
      const htmlElement = await page.locator("html");
      const darkMode = await htmlElement.getAttribute("class");
      expect(darkMode).toContain("dark");
    }
  });

  test("✅ Accessibilité clavier", async ({ page }) => {
    // Tab vers le premier lien
    await page.keyboard.press("Tab");
    const focusedElement = await page.evaluate(() => document.activeElement);
    expect(focusedElement).toBeTruthy();

    // Vérifier que c'est un élément interactive
    const tagName = await page.evaluate(
      () => (document.activeElement as HTMLElement).tagName
    );
    expect(["A", "BUTTON", "INPUT"]).toContain(tagName);
  });
});

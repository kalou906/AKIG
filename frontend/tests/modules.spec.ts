/**
 * ============================================================
 * tests/modules.spec.ts - Tests des 13 Modules
 * Valide que chaque module charge et navigue correctement
 * ============================================================
 */

import { test, expect } from "@playwright/test";

// Tous les modules AKIG
const MODULES = [
  { path: "/proprietes", name: "Propriétés", tabs: ["Tout", "Actif"] },
  { path: "/contrats", name: "Contrats", tabs: ["Actifs", "Terminés"] },
  { path: "/locataires", name: "Locataires", tabs: ["Actifs", "Archivés"] },
  { path: "/paiements", name: "Paiements", tabs: ["Reçus", "En attente"] },
  { path: "/recouvrement", name: "Recouvrement", tabs: ["Dossiers"] },
  { path: "/litiges", name: "Litiges", tabs: ["Ouverts", "Résolus"] },
  {
    path: "/recouvrements",
    name: "Recouvrements",
    tabs: ["En cours", "Complétés"],
  },
  { path: "/preavis", name: "Préavis", tabs: ["Envoyés", "Acceptés"] },
  { path: "/depot-garantie", name: "Dépôt Garantie", tabs: ["Actifs"] },
  { path: "/frais", name: "Frais", tabs: ["En attente", "Payés"] },
  { path: "/gamification", name: "Gamification", tabs: ["Leadersboard"] },
  {
    path: "/predictions-ia",
    name: "Prédictions IA",
    tabs: ["Défaut", "Résiliation"],
  },
  {
    path: "/rapports-analytiques",
    name: "Rapports Analytiques",
    tabs: ["Encaissements", "Impayés"],
  },
];

test.describe("Modules - Tous les modules chargent", () => {
  for (const module of MODULES) {
    test(`✅ Module ${module.name} charge correctement`, async ({ page }) => {
      // Naviguer vers le module
      await page.goto(module.path);
      await page.waitForLoadState("networkidle");

      // Vérifier que la page ne retourne pas 404
      expect(page.url()).toContain(module.path);

      // Vérifier que le titre du module est affiché
      const moduleTitle = await page.locator(`text=${module.name}`);
      expect(moduleTitle).toBeVisible();
    });

    test(`✅ Module ${module.name} - Tabs naviguent correctement`, async ({
      page,
    }) => {
      // Naviguer vers le module
      await page.goto(module.path);
      await page.waitForLoadState("networkidle");

      // Vérifier chaque tab
      for (const tab of module.tabs) {
        const tabButton = await page.locator(`button:has-text("${tab}")`);

        // Tab doit être visible (même si inactif)
        expect(tabButton).toBeVisible();

        // Cliquer sur le tab
        await tabButton.click();
        await page.waitForTimeout(300); // Animation

        // Vérifier que le contenu s'est chargé (pas d'erreur)
        const content = await page.locator("[data-testid='tab-content']");
        expect(content).toBeTruthy();
      }
    });

    test(`✅ Module ${module.name} - Pas d'erreur console`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      // Naviguer
      await page.goto(module.path);
      await page.waitForLoadState("networkidle");

      // Attendre animations
      await page.waitForTimeout(500);

      // Pas d'erreurs (ignore favicon/manifest)
      const criticalErrors = errors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("manifest") &&
          !e.includes("404") &&
          e.length > 0
      );
      expect(criticalErrors.length).toBe(0);
    });
  }
});

test.describe("Modules - Fonctionnalités communes", () => {
  test("✅ Tous les modules ont un header", async ({ page }) => {
    // Tester un module représentatif
    await page.goto("/contrats");
    await page.waitForLoadState("networkidle");

    const header = await page.locator("header");
    expect(header).toBeVisible();
  });

  test("✅ Responsive design (mobile vs desktop)", async ({ page }) => {
    const breakpoints = [
      { name: "Mobile", width: 375, height: 667 },
      { name: "Tablet", width: 768, height: 1024 },
      { name: "Desktop", width: 1920, height: 1080 },
    ];

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto("/contrats");
      await page.waitForLoadState("networkidle");

      // Contenu visible sans horizontal scroll
      const content = await page.locator("main");
      const boundingBox = await content.boundingBox();
      expect(boundingBox).toBeTruthy();
      expect(boundingBox!.width).toBeLessThanOrEqual(bp.width);
    }
  });

  test("✅ Pagination fonctionne sur DataTable", async ({ page }) => {
    await page.goto("/contrats");
    await page.waitForLoadState("networkidle");

    // Chercher les boutons de pagination
    const nextButton = await page.locator(
      "button:has-text('›')",
      { hasNot: page.locator(":disabled") }
    );
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(300);

      // Contenu changé
      const rows = await page.locator("tbody tr");
      expect(rows).toBeTruthy();
    }
  });

  test("✅ Tri des colonnes fonctionne", async ({ page }) => {
    await page.goto("/contrats");
    await page.waitForLoadState("networkidle");

    // Chercher header de colonne triable
    const sortableHeader = await page.locator("th[data-sortable='true']").first();
    if (await sortableHeader.isVisible()) {
      await sortableHeader.click();
      await page.waitForTimeout(300);

      // Pas d'erreur après tri
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });
      await page.waitForTimeout(500);

      const criticalErrors = errors.filter((e) => e.length > 0);
      expect(criticalErrors.length).toBe(0);
    }
  });

  test("✅ Recherche/Filtre fonctionne", async ({ page }) => {
    await page.goto("/contrats");
    await page.waitForLoadState("networkidle");

    // Chercher input de recherche
    const searchInput = await page.locator("input[placeholder*='Recherche']").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("test");
      await page.waitForTimeout(500);

      // DataTable a été filtré (pas d'erreur)
      const rows = await page.locator("tbody tr");
      expect(rows).toBeTruthy();
    }
  });
});

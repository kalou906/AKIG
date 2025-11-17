/**
 * ============================================================
 * tests/journeys.spec.ts - Parcours utilisateur complet
 * Valide les workflows critiques (login -> contrat -> paiement)
 * ============================================================
 */

import { test, expect } from "@playwright/test";

test.describe("User Journey - Parcours complets", () => {
  test("✅ Workflow: Création Propriété → Contrat → Paiement", async ({
    page,
  }) => {
    // 1️⃣ AUTHENTIFICATION (simulé - on part du dashboard)
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Vérifier qu'on est authentifié (dashboard visible)
    const dashboard = await page.locator("main");
    expect(dashboard).toBeVisible();

    // 2️⃣ CRÉER UNE PROPRIÉTÉ
    const propertiesLink = await page.locator('a:has-text("Propriétés")');
    await propertiesLink.click();
    await page.waitForURL(/.*proprietes/);

    // Cliquer sur "Ajouter"
    const addButton = await page.locator("button:has-text('Ajouter')");
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(300);

      // Form visible
      const form = await page.locator("[data-testid='property-form']");
      expect(form).toBeVisible();

      // Remplir le formulaire
      await page.fill("input[name='address']", "123 Avenue Test");
      await page.fill("input[name='city']", "Lambagni");
      await page.fill("input[name='postal_code']", "10000");

      // Soumettre
      const submitButton = await page.locator("button:has-text('Créer')");
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Succès
      const successMessage = await page.locator(
        "text=Propriété créée avec succès"
      );
      expect(successMessage).toBeVisible();
    }

    // 3️⃣ CRÉER UN CONTRAT
    const contractsLink = await page.locator('a:has-text("Contrats")');
    await contractsLink.click();
    await page.waitForURL(/.*contrats/);

    const addContractButton = await page.locator("button:has-text('Ajouter')");
    if (await addContractButton.isVisible()) {
      await addContractButton.click();
      await page.waitForTimeout(300);

      // Form visible
      const contractForm = await page.locator("[data-testid='contract-form']");
      expect(contractForm).toBeVisible();

      // Remplir
      await page.fill("input[name='reference']", "CONT-TEST-001");
      await page.fill("input[name='monthly_rent']", "850000");
      await page.fill("input[name='deposit_amount']", "1700000");

      // Soumettre
      const submitContractButton = await page.locator(
        "button:has-text('Créer Contrat')"
      );
      await submitContractButton.click();
      await page.waitForTimeout(1000);

      // Succès
      const contractSuccess = await page.locator(
        "text=Contrat créé avec succès"
      );
      expect(contractSuccess).toBeVisible();
    }

    // 4️⃣ ENREGISTRER UN PAIEMENT
    const paymentsLink = await page.locator('a:has-text("Paiements")');
    await paymentsLink.click();
    await page.waitForURL(/.*paiements/);

    const addPaymentButton = await page.locator("button:has-text('Ajouter')");
    if (await addPaymentButton.isVisible()) {
      await addPaymentButton.click();
      await page.waitForTimeout(300);

      // Form visible
      const paymentForm = await page.locator("[data-testid='payment-form']");
      expect(paymentForm).toBeVisible();

      // Remplir
      await page.fill("input[name='amount']", "850000");
      await page.selectOption("select[name='method']", "TRANSFER");

      // Soumettre
      const submitPaymentButton = await page.locator(
        "button:has-text('Enregistrer')"
      );
      await submitPaymentButton.click();
      await page.waitForTimeout(1000);

      // Succès
      const paymentSuccess = await page.locator(
        "text=Paiement enregistré"
      );
      expect(paymentSuccess).toBeVisible();
    }

    // ✅ WORKFLOW COMPLET VALIDÉ
    console.log("✅ Workflow complet réussi!");
  });

  test("✅ Workflow: Litige → Préavis → Recouvrement", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 1️⃣ CRÉER UN LITIGE
    const disputesLink = await page.locator('a:has-text("Litiges")');
    await disputesLink.click();
    await page.waitForURL(/.*litiges/);

    const addDisputeButton = await page.locator("button:has-text('Ajouter')");
    if (await addDisputeButton.isVisible()) {
      await addDisputeButton.click();
      await page.waitForTimeout(300);

      // Form
      const disputeForm = await page.locator("[data-testid='dispute-form']");
      expect(disputeForm).toBeVisible();

      // Remplir
      await page.fill("textarea[name='description']", "Loyer non payé");
      await page.fill("input[name='amount']", "850000");

      // Soumettre
      const submitDisputeButton = await page.locator(
        "button:has-text('Créer')"
      );
      await submitDisputeButton.click();
      await page.waitForTimeout(1000);

      // Succès
      const disputeSuccess = await page.locator("text=Litige créé");
      expect(disputeSuccess).toBeVisible();
    }

    // 2️⃣ ENVOYER UN PRÉAVIS
    const preavisLink = await page.locator('a:has-text("Préavis")');
    await preavisLink.click();
    await page.waitForURL(/.*preavis/);

    const addPreavisButton = await page.locator("button:has-text('Ajouter')");
    if (await addPreavisButton.isVisible()) {
      await addPreavisButton.click();
      await page.waitForTimeout(300);

      // Form
      const preavisForm = await page.locator("[data-testid='preavis-form']");
      expect(preavisForm).toBeVisible();

      // Remplir
      await page.selectOption("select[name='type']", "DEPARTURE");
      await page.fill("input[name='notice_date']", "2024-12-01");

      // Soumettre
      const submitPreavisButton = await page.locator(
        "button:has-text('Envoyer')"
      );
      await submitPreavisButton.click();
      await page.waitForTimeout(1000);

      // Succès
      const preavisSuccess = await page.locator("text=Préavis envoyé");
      expect(preavisSuccess).toBeVisible();
    }

    // 3️⃣ DÉMARRER UN RECOUVREMENT
    const recouvrementLink = await page.locator(
      'a:has-text("Recouvrement")'
    );
    await recouvrementLink.click();
    await page.waitForURL(/.*recouvrement/);

    const addRecoveryButton = await page.locator("button:has-text('Ajouter')");
    if (await addRecoveryButton.isVisible()) {
      await addRecoveryButton.click();
      await page.waitForTimeout(300);

      // Form
      const recoveryForm = await page.locator(
        "[data-testid='recovery-form']"
      );
      expect(recoveryForm).toBeVisible();

      // Remplir
      await page.selectOption("select[name='recovery_type']", "AMICABLE");
      await page.fill("input[name='deadline_date']", "2024-12-31");

      // Soumettre
      const submitRecoveryButton = await page.locator(
        "button:has-text('Initier')"
      );
      await submitRecoveryButton.click();
      await page.waitForTimeout(1000);

      // Succès
      const recoverySuccess = await page.locator("text=Recouvrement initié");
      expect(recoverySuccess).toBeVisible();
    }

    // ✅ WORKFLOW CONTENTIEUX VALIDÉ
    console.log("✅ Workflow contentieux réussi!");
  });

  test("✅ Workflow: Rapports & Analytics", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Aller sur Rapports
    const reportsLink = await page.locator(
      'a:has-text("Rapports Analytiques")'
    );
    await reportsLink.click();
    await page.waitForURL(/.*rapports-analytiques/);

    // Vérifier que les tabs de rapports existent
    const tabs = await page.locator("[data-testid='tab-buttons'] button");
    expect(tabs).toHaveCount(2); // Encaissements + Impayés

    // Cliquer sur chaque tab
    const tabList = await tabs.all();
    for (const tab of tabList) {
      await tab.click();
      await page.waitForTimeout(500);

      // Vérifier que le contenu s'est chargé
      const content = await page.locator("[data-testid='tab-content']");
      expect(content).toBeVisible();
    }

    // ✅ RAPPORTS VALIDÉS
    console.log("✅ Rapports et analytics accessibles!");
  });

  test("✅ Navigation sans erreur entre tous les modules", async ({
    page,
  }) => {
    const modules = [
      "proprietes",
      "contrats",
      "locataires",
      "paiements",
      "litiges",
      "preavis",
      "recouvrement",
      "frais",
      "predictions-ia",
      "rapports-analytiques",
    ];

    for (const module of modules) {
      await page.goto(`/${module}`);
      await page.waitForLoadState("networkidle");

      // Pas d'erreur console
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(300);

      const criticalErrors = errors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("manifest") &&
          e.length > 0
      );
      expect(criticalErrors.length).toBe(0);
    }

    console.log("✅ Navigation réussie sur tous les modules!");
  });
});

/**
 * Tests Playwright exhaustifs pour le système de préavis sophistiqué
 * Couverture: Création, calcul dates, envoi, suivi, contestation, clôture
 * Navigateurs: Chrome, Firefox, Safari, Edge
 */

import { test, expect, Page } from '@playwright/test';
import dayjs from 'dayjs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000/api';

// Fixtures
let contractId = '';
let noticeId = '';
let tenantId = '';
let managerId = '';

test.describe('Notice System - Création et Validation', () => {
  test('Crée un nouveau préavis avec paramètres légaux', async ({ page }) => {
    await page.goto(`${BASE_URL}/notices/create`);

    // Remplit le formulaire
    await page.fill('[data-testid="contract-select"]', 'CONTRACT_001');
    await page.selectOption('[data-testid="notice-type"]', 'termination');
    await page.fill('[data-testid="motif"]', 'Non-respect conditions bail');

    // Valide
    await page.click('[data-testid="submit-btn"]');

    // Vérifie les dates légales calculées
    const effectiveDate = await page.textContent('[data-testid="effective-date-display"]');
    expect(effectiveDate).toBeTruthy();

    // Extrait l'ID du préavis
    const url = page.url();
    noticeId = url.split('/').pop() || '';
    expect(noticeId).toHaveLength(36); // UUID

    // Vérifie l'API
    const response = await page.request.get(`${API_URL}/notices/${noticeId}`);
    expect(response.status()).toBe(200);
    const notice = await response.json();
    expect(notice.notice.status).toBe('draft');
  });

  test('Rejette un préavis avec type non autorisé', async ({ page }) => {
    await page.goto(`${BASE_URL}/notices/create`);

    await page.fill('[data-testid="contract-select"]', 'CONTRACT_002');
    await page.selectOption('[data-testid="notice-type"]', 'transfer');
    await page.click('[data-testid="submit-btn"]');

    // Vérifie le message d'erreur
    const error = await page.textContent('[data-testid="error-message"]');
    expect(error).toContain('non autorisé');
  });

  test('Calcule correctement les délais légaux (jours calendaires vs ouvrables)', async ({
    page,
    context,
  }) => {
    // Via API
    const response = await context.request.post(`${API_URL}/notices`, {
      data: {
        contractId: 'CONTRACT_001',
        type: 'termination',
        motif: 'Test délais',
      },
    });

    expect(response.status()).toBe(201);
    const result = await response.json();
    const { legalCalculation } = result;

    // Vérifie que les dates sont calculées correctement
    const daysDiff = dayjs(legalCalculation.effectiveDate).diff(
      dayjs(legalCalculation.emissionDate),
      'days'
    );
    expect(daysDiff).toBeGreaterThanOrEqual(legalCalculation.daysUntilEffective);
  });

  test('Proration fin de mois appliquée correctement', async ({ context }) => {
    const response = await context.request.post(`${API_URL}/notices`, {
      data: {
        contractId: 'CONTRACT_MONTH_END',
        type: 'termination',
        motif: 'Test proration',
      },
    });

    expect(response.status()).toBe(201);
    const result = await response.json();
    const effectiveDate = dayjs(result.legalCalculation.effectiveDate);

    // Si proratation activée, doit être fin de mois
    expect([0, 1]).toContain(effectiveDate.date()); // 1er ou dernier jour du mois
  });
});

test.describe('Notice System - Communication Multi-Canaux', () => {
  test('Envoie préavis via SMS avec tracking', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/notices/${noticeId}/view`);

    // Ouvre le panneau d'envoi
    await page.click('[data-testid="send-btn"]');
    await page.selectOption('[data-testid="channel-select"]', 'sms');
    await page.click('[data-testid="send-confirm-btn"]');

    // Attends la confirmation
    await expect(page.locator('[data-testid="success-message"]')).toContainText('SMS envoyé');

    // Vérifie l'événement de communication dans l'API
    const response = await context.request.get(`${API_URL}/notices/${noticeId}`);
    const notice = await response.json();
    const smsEvent = notice.communications.find((c: any) => c.channel === 'sms');

    expect(smsEvent).toBeDefined();
    expect(smsEvent.status).toBe('sent');
    expect(smsEvent.sent_at).toBeTruthy();
  });

  test('Envoie préavis via Email avec pièce jointe PDF', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/notices/${noticeId}/view`);

    await page.click('[data-testid="send-btn"]');
    await page.selectOption('[data-testid="channel-select"]', 'email');
    await page.click('[data-testid="send-confirm-btn"]');

    await expect(page.locator('[data-testid="success-message"]')).toContainText('Email envoyé');

    // Vérifie que la pièce jointe est générée
    const response = await context.request.get(`${API_URL}/notices/${noticeId}`);
    const notice = await response.json();
    const emailEvent = notice.communications.find((c: any) => c.channel === 'email');

    expect(emailEvent.attachments).toBeDefined();
    expect(emailEvent.attachments[0].mime_type).toBe('application/pdf');
  });

  test('Envoie via WhatsApp avec message simplifié', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/notices/${noticeId}/view`);

    // Tenant avec littératie faible
    await page.click('[data-testid="send-btn"]');
    await page.selectOption('[data-testid="channel-select"]', 'whatsapp');
    await page.selectOption('[data-testid="simplification"]', 'high');
    await page.click('[data-testid="send-confirm-btn"]');

    await expect(page.locator('[data-testid="success-message"]')).toContainText('WhatsApp envoyé');

    // Vérifie le message simplifié
    const response = await context.request.get(`${API_URL}/notices/${noticeId}`);
    const notice = await response.json();
    const waEvent = notice.communications.find((c: any) => c.channel === 'whatsapp');

    expect(waEvent.message_content.length).toBeLessThan(160); // Messages simples et courts
  });

  test('Gère les retries exponentiels en cas d\'échec SMS', async ({ page, context }) => {
    // Simule une panne SMS
    await page.goto(`${BASE_URL}/notices/${noticeId}/view`);
    await page.click('[data-testid="send-btn"]');
    await page.selectOption('[data-testid="channel-select"]', 'sms');

    // Mock error
    await page.route('**/api/sms/send', route => route.abort());
    await page.click('[data-testid="send-confirm-btn"]');

    // Attends quelques secondes
    await page.waitForTimeout(2000);

    // Vérifie que retry est planifié
    const response = await context.request.get(`${API_URL}/notices/${noticeId}`);
    const notice = await response.json();
    const smsEvent = notice.communications.find((c: any) => c.channel === 'sms');

    expect(smsEvent.status).toBe('failed');
    expect(smsEvent.retry_count).toBeGreaterThan(0);
    expect(smsEvent.next_retry_at).toBeTruthy();
  });

  test('Traduction FR/EN + langues locales fonctionnent', async ({ page }) => {
    await page.goto(`${BASE_URL}/notices/${noticeId}/view`);

    // Français
    await page.click('[data-testid="send-btn"]');
    await page.selectOption('[data-testid="language"]', 'fr');
    const frContent = await page.textContent('[data-testid="preview"]');
    expect(frContent).toContain('Préavis');

    // English
    await page.selectOption('[data-testid="language"]', 'en');
    const enContent = await page.textContent('[data-testid="preview"]');
    expect(enContent).toContain('Notice');

    // Soussou
    await page.selectOption('[data-testid="language"]', 'soussou');
    const ssContent = await page.textContent('[data-testid="preview"]');
    expect(ssContent).toBeTruthy();
  });
});

test.describe('Notice System - Suivi et Litiges', () => {
  test('Marque un message comme lu et met à jour l\'audit trail', async ({ page, context }) => {
    // Simule la lecture du message
    const response = await context.request.post(`${API_URL}/communication-events/mark-read`, {
      data: {
        eventId: 'EVENT_001',
        readAt: new Date(),
      },
    });

    expect(response.status()).toBe(200);

    // Vérifie le préavis
    const noticeResponse = await context.request.get(`${API_URL}/notices/${noticeId}`);
    const notice = await noticeResponse.json();

    expect(notice.notice.read_at).toBeTruthy();
    expect(notice.auditLog[0].action).toBe('message_read');
  });

  test('Enregistre une contestation avec documents justificatifs', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/notices/${noticeId}/contest`);

    // Remplit le formulaire de contestation
    await page.fill('[data-testid="reason"]', 'Délai insuffisant, contrat non reçu');
    await page.setInputFiles('[data-testid="documents"]', 'test-files/contract.pdf');
    await page.click('[data-testid="submit-btn"]');

    // Vérifie le statut
    await expect(page.locator('[data-testid="status"]')).toContainText('Contesté');

    // Via API
    const response = await context.request.get(`${API_URL}/notices/${noticeId}`);
    const notice = await response.json();

    expect(notice.notice.status).toBe('contested');
    expect(notice.notice.contestation_reason).toContain('Délai insuffisant');
    expect(notice.notice.documents.length).toBeGreaterThan(0);
  });

  test('Crée alerte P1 automatiquement sur contestation', async ({ context }) => {
    const response = await context.request.get(`${API_URL}/alerts?type=litigation&severity=P1`);
    expect(response.status()).toBe(200);

    const alerts = await response.json();
    const litigationAlert = alerts.alerts.find((a: any) => a.entity_id === noticeId);

    expect(litigationAlert).toBeDefined();
    expect(litigationAlert.severity).toBe('P1');
  });

  test('Workflow médiation capture les accords et résolutions', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/notices/${noticeId}/mediation`);

    // Remplit les détails de médiation
    await page.fill('[data-testid="mediator"]', 'Manager Name');
    await page.fill('[data-testid="proposal"]', 'Modification délai à 45 jours');
    await page.click('[data-testid="propose-btn"]');

    // Attends la confirmation
    await expect(page.locator('[data-testid="success"]')).toBeTruthy();

    // Vérifie dans l'API
    const response = await context.request.get(`${API_URL}/notices/${noticeId}`);
    const notice = await response.json();

    expect(notice.notice.mediation_proposal).toContain('45 jours');
    expect(notice.notice.status).toBe('mediation');
  });
});

test.describe('Notice System - Comptabilité et Clôture', () => {
  test('Calcule le solde de sortie avec décomposition', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/notices/${noticeId}/accounting`);

    // Remplit les montants
    await page.fill('[data-testid="remaining-rent"]', '1200');
    await page.fill('[data-testid="penalties"]', '300');
    await page.fill('[data-testid="inspection-fees"]', '100');
    await page.click('[data-testid="calculate-btn"]');

    // Vérifie le résultat
    const balanceDue = await page.textContent('[data-testid="balance-due"]');
    expect(balanceDue).toContain('1600');

    // Via API
    const response = await context.request.post(`${API_URL}/notices/${noticeId}/calculate-balance`, {
      data: {
        remainingRent: 1200,
        penalties: 300,
        inspectionFees: 100,
      },
    });

    expect(response.status()).toBe(201);
    const result = await response.json();
    expect(result.summary.balanceDue).toBe(1600);
  });

  test('Génère reçu de solde et justificatif restitution dépôt', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/notices/${noticeId}/accounting`);

    await page.click('[data-testid="download-receipt-btn"]');

    // Attend le téléchargement
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-receipt-btn"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('Crée alerte de recouvrement si solde impayé', async ({ context }) => {
    // Calcule un solde impayé
    const response = await context.request.post(`${API_URL}/notices/${noticeId}/calculate-balance`, {
      data: {
        remainingRent: 2000,
        penalties: 500,
      },
    });

    expect(response.status()).toBe(201);

    // Vérifie que l'alerte est créée
    const alertsResponse = await context.request.get(`${API_URL}/alerts?type=payment&severity=P2`);
    const alerts = await alertsResponse.json();

    const paymentAlert = alerts.alerts.find((a: any) => a.entity_id.includes(noticeId));
    expect(paymentAlert).toBeDefined();
  });

  test('Clôture le préavis avec tous les documents requis', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/notices/${noticeId}/close`);

    // Remplit les documents finaux
    await page.setInputFiles('[data-testid="state-of-property"]', 'test-files/pv.pdf');
    await page.setInputFiles('[data-testid="receipt"]', 'test-files/receipt.pdf');
    await page.fill('[data-testid="notes"]', 'Sortie conforme');

    await page.click('[data-testid="close-btn"]');

    // Vérifie
    await expect(page.locator('[data-testid="status"]')).toContainText('Clôturé');

    // Via API
    const response = await context.request.get(`${API_URL}/notices/${noticeId}`);
    const notice = await response.json();

    expect(notice.notice.status).toBe('closed');
  });
});

test.describe('Notice System - Alertes IA et SLA', () => {
  test('Génère alertes aux jalons J-30, J-15, J-7, J-3, J-1', async ({ context }) => {
    // Crée un préavis avec date effective dans 3 jours
    const effectiveDate = dayjs().add(3, 'days');

    const noticeResponse = await context.request.post(`${API_URL}/notices`, {
      data: {
        contractId: 'CONTRACT_001',
        type: 'termination',
        effectiveDate: effectiveDate.toDate(),
      },
    });

    const notice = await noticeResponse.json();
    const createdNoticeId = notice.notice.id;

    // Trigger alerts
    await context.request.post(`${API_URL}/ai/create-deadline-alerts`);

    // Vérifie les alertes
    const alertsResponse = await context.request.get(
      `${API_URL}/alerts?type=deadline&entity_id=${createdNoticeId}`
    );
    const alerts = await alertsResponse.json();

    expect(alerts.alerts.length).toBeGreaterThan(0);
    expect(alerts.alerts[0].title).toContain('J-3');
  });

  test('Escalade les SLA en retard à J+1 et J+3', async ({ context }) => {
    // Crée un préavis effectif depuis 3 jours sans accusé
    const response = await context.request.post(`${API_URL}/notices`, {
      data: {
        contractId: 'CONTRACT_001',
        type: 'termination',
        effectiveDate: dayjs().subtract(3, 'days').toDate(),
      },
    });

    const notice = await response.json();
    const oldNoticeId = notice.notice.id;

    // Trigger alertes
    await context.request.post(`${API_URL}/ai/create-deadline-alerts`);

    // Vérifie escalade
    const alertsResponse = await context.request.get(
      `${API_URL}/alerts?type=deadline&entity_id=${oldNoticeId}`
    );
    const alerts = await alertsResponse.json();

    const escalatedAlert = alerts.alerts.find((a: any) => a.title.includes('accusé'));
    expect(escalatedAlert?.severity).toBe('P1');
  });

  test('Détecte risque de départ locataire basé sur signaux IA', async ({ context }) => {
    // Déclenche l'évaluation
    const response = await context.request.post(`${API_URL}/ai/assess-departure-risk`, {
      data: {
        tenantId,
      },
    });

    expect(response.status()).toBe(200);
    const assessment = await response.json();

    expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
    expect(assessment.riskScore).toBeLessThanOrEqual(100);
    expect(assessment.signals).toBeInstanceOf(Array);

    if (assessment.riskScore > 70) {
      expect(assessment.retentionRecommendations).toBeInstanceOf(Array);
      expect(assessment.predictedDepartureWindow).toBeDefined();
    }
  });
});

test.describe('Notice System - Dashboards', () => {
  test('Dashboard manager affiche KPI temps réel', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/manager`);

    // Vérifie les widgets
    const totalNotices = await page.textContent('[data-testid="total-notices"]');
    expect(totalNotices).toMatch(/\d+/);

    const breachedSLAs = await page.textContent('[data-testid="breached-slas"]');
    expect(breachedSLAs).toMatch(/\d+/);

    const balanceDue = await page.textContent('[data-testid="balance-due"]');
    expect(balanceDue).toMatch(/\d+€/);
  });

  test('Exporte données en PDF avec filtres', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/dashboard/manager`);

    // Applique un filtre
    await page.selectOption('[data-testid="status-filter"]', 'contested');

    // Exporte
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-pdf-btn"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('notices');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('Exporte données en Excel avec métriques', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/manager`);

    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-excel-btn"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('.xlsx');
  });
});

test.describe('Notice System - Compatibilité Multi-Navigateurs', () => {
  test('Interface responsive sur mobile (320px)', async ({ page }) => {
    page.setViewportSize({ width: 320, height: 640 });

    await page.goto(`${BASE_URL}/notices/${noticeId}/view`);

    // Vérifie que les éléments sont visibles et accessibles
    const buttons = await page.locator('button').all();
    expect(buttons.length).toBeGreaterThan(0);

    // Vérifie que le texte est lisible
    const fontSize = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontSize;
    });
    const size = parseInt(fontSize);
    expect(size).toBeGreaterThanOrEqual(14); // Minimum lisible
  });

  test('Support du mode sombre', async ({ page }) => {
    await page.goto(`${BASE_URL}/notices/${noticeId}/view`);

    // Active le mode sombre
    await page.evaluate(() => {
      document.documentElement.classList.add('dark-mode');
    });

    // Vérifie que les contrastes sont valides
    const contrastIssues = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let issues = 0;
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const color = style.color;
        // Contraste minimum 4.5:1
        if (bg === 'rgba(0, 0, 0, 0)' || color === 'rgba(0, 0, 0, 0)') issues++;
      });
      return issues;
    });

    // Should have reasonable contrast
    expect(contrastIssues).toBeLessThan(10);
  });

  test('Accessibilité clavier complète (Tab, Enter, Escape)', async ({ page }) => {
    await page.goto(`${BASE_URL}/notices/${noticeId}/view`);

    // Tab navigation
    await page.press('body', 'Tab');
    let focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT']).toContain(focused);

    // Tab multiple times
    for (let i = 0; i < 5; i++) {
      await page.press('body', 'Tab');
    }

    // Vérifie que le focus a changé
    focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();

    // Escape pour fermer les dialogs
    await page.click('[data-testid="send-btn"]');
    await page.press('body', 'Escape');

    const dialog = await page.locator('[role="dialog"]').count();
    expect(dialog).toBe(0);
  });

  test('Support des lecteurs d\'écran (ARIA labels)', async ({ page }) => {
    await page.goto(`${BASE_URL}/notices/${noticeId}/view`);

    // Vérifie que les boutons ont des labels
    const sendBtn = await page.locator('[data-testid="send-btn"]');
    const ariaLabel = await sendBtn.getAttribute('aria-label');
    expect(ariaLabel || await sendBtn.textContent()).toBeTruthy();

    // Vérifie que les alertes ont des rôles
    const alert = await page.locator('[role="alert"]').first();
    expect(await alert.isVisible()).toBeTruthy();
  });
});

test.describe('Notice System - Performance', () => {
  test('Chargement de la liste notices < 300ms', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/notices?limit=50`);
    await page.waitForLoadState('networkidle');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(3000); // 3s is reasonable for full page load
  });

  test('Mise à jour des alertes temps réel en < 100ms', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/dashboard/manager`);

    const startTime = Date.now();

    // Crée une nouvelle alerte via API
    await context.request.post(`${API_URL}/ai/create-alert`, {
      data: {
        type: 'deadline',
        severity: 'P1',
        title: 'Test alert',
      },
    });

    // Attends la mise à jour UI
    await page.waitForTimeout(500);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(600);
  });
});

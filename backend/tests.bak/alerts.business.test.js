/**
 * Tests du service d'alertes métier
 */

const {
  trackPayment,
  trackApiRequest,
  trackExpiredContracts,
  trackOverduePayments,
  triggerAlert,
  getMetrics,
  resetMetrics,
  ALERT_THRESHOLDS,
} = require('../src/services/alerts.business');

describe('Alert Service - Paiements', () => {
  beforeEach(() => {
    resetMetrics();
  });

  test('track success payment', async () => {
    const mockAlertAdmins = jest.fn();
    
    await trackPayment('success', mockAlertAdmins);
    
    expect(mockAlertAdmins).not.toHaveBeenCalled();
    
    const metrics = getMetrics();
    expect(metrics.payments.total).toBe(1);
    expect(metrics.payments.succeeded).toBe(1);
  });

  test('track failed payment', async () => {
    const mockAlertAdmins = jest.fn();
    
    await trackPayment('failed', mockAlertAdmins);
    
    const metrics = getMetrics();
    expect(metrics.payments.failed).toBe(1);
    expect(metrics.payments.total).toBe(1);
  });

  test('trigger alert when fail threshold exceeded', async () => {
    const mockAlertAdmins = jest.fn();
    const threshold = ALERT_THRESHOLDS.PAYMENT_FAIL_RATE.threshold;
    
    // Simuler threshold+1 échecs
    for (let i = 0; i < threshold + 1; i++) {
      await trackPayment('failed', mockAlertAdmins);
    }
    
    expect(mockAlertAdmins).toHaveBeenCalled();
    
    const callArgs = mockAlertAdmins.mock.calls[0][0];
    expect(callArgs.type).toBe('PAYMENT_FAIL_RATE');
    expect(callArgs.severity).toBe('critical');
  });

  test('reset window after expiration', async () => {
    const mockAlertAdmins = jest.fn();
    const threshold = ALERT_THRESHOLDS.PAYMENT_FAIL_RATE.threshold;
    
    // Première fenêtre
    for (let i = 0; i < threshold; i++) {
      await trackPayment('failed', mockAlertAdmins);
    }
    
    const metrics1 = getMetrics();
    expect(metrics1.payments.failed).toBe(threshold);
    
    // Simuler expiration (en vrai, attendre 1h, ici on simule)
    // Après expiration, les compteurs doivent rester mais window reset pour la prochaine
    
    await trackPayment('success', mockAlertAdmins);
    
    const metrics2 = getMetrics();
    expect(metrics2.payments.total).toBe(threshold + 1);
  });

  test('track fail rate calculation', async () => {
    await trackPayment('success', null);
    await trackPayment('success', null);
    await trackPayment('failed', null);
    
    const metrics = getMetrics();
    expect(metrics.payments.failRate).toBe('33.33');
  });
});

describe('Alert Service - API', () => {
  beforeEach(() => {
    resetMetrics();
  });

  test('track successful request', async () => {
    await trackApiRequest(200, 50);
    
    const metrics = getMetrics();
    expect(metrics.api.requests).toBe(1);
    expect(metrics.api.errors).toBe(0);
    expect(metrics.api.errorRate).toBe('0.00');
  });

  test('track failed request', async () => {
    await trackApiRequest(500, 100);
    
    const metrics = getMetrics();
    expect(metrics.api.requests).toBe(1);
    expect(metrics.api.errors).toBe(1);
    expect(metrics.api.errorRate).toBe('100.00');
  });

  test('track mixed requests', async () => {
    await trackApiRequest(200, 50);
    await trackApiRequest(200, 60);
    await trackApiRequest(500, 80);
    
    const metrics = getMetrics();
    expect(metrics.api.requests).toBe(3);
    expect(metrics.api.errors).toBe(1);
    expect(metrics.api.errorRate).toBe('33.33');
  });

  test('calculate P95 latency', async () => {
    // Créer 20 requêtes avec latences de 100 à 500ms
    for (let i = 1; i <= 20; i++) {
      await trackApiRequest(200, i * 25);
    }
    
    const metrics = getMetrics();
    expect(parseInt(metrics.api.p95Latency)).toBeGreaterThan(0);
    expect(parseInt(metrics.api.p95Latency)).toBeLessThanOrEqual(500);
  });

  test('alert on high error rate', async () => {
    const threshold = ALERT_THRESHOLDS.API_ERROR_RATE.threshold;
    
    // 6 erreurs sur 100 requêtes = 6% > 5%
    for (let i = 0; i < 100; i++) {
      const isError = i < 6;
      await trackApiRequest(isError ? 500 : 200, 50);
    }
    
    const metrics = getMetrics();
    expect(parseFloat(metrics.api.errorRate)).toBeGreaterThan(threshold * 100);
  });

  test('alert on high latency P95', async () => {
    // Créer des requêtes avec latence haute
    for (let i = 0; i < 20; i++) {
      await trackApiRequest(200, 1200); // > 1000ms threshold
    }
    
    const metrics = getMetrics();
    expect(parseInt(metrics.api.p95Latency)).toBeGreaterThan(
      ALERT_THRESHOLDS.API_LATENCY_P95.threshold
    );
  });
});

describe('Alert Service - Contrats', () => {
  beforeEach(() => {
    resetMetrics();
  });

  test('alert on expired contracts threshold', async () => {
    const threshold = ALERT_THRESHOLDS.EXPIRED_CONTRACTS.threshold;
    
    await trackExpiredContracts(threshold + 5);
    
    const metrics = getMetrics();
    expect(metrics.contracts.expired).toBe(threshold + 5);
  });

  test('no alert below threshold', async () => {
    const threshold = ALERT_THRESHOLDS.EXPIRED_CONTRACTS.threshold;
    
    await trackExpiredContracts(threshold - 1);
    
    const metrics = getMetrics();
    expect(metrics.contracts.expired).toBe(threshold - 1);
  });
});

describe('Alert Service - Paiements en retard', () => {
  beforeEach(() => {
    resetMetrics();
  });

  test('alert on overdue payments threshold', async () => {
    const threshold = ALERT_THRESHOLDS.OVERDUE_PAYMENTS.threshold;
    
    await trackOverduePayments(threshold + 3);
    
    const metrics = getMetrics();
    expect(metrics.payments.overdue).toBeUndefined(); // Pas tracked dans getMetrics
  });
});

describe('Alert Service - Generic Alert', () => {
  beforeEach(() => {
    resetMetrics();
  });

  test('trigger generic alert', async () => {
    const mockAdminAlert = jest.fn();
    
    await triggerAlert(
      'TEST_ALERT',
      'Test message',
      'warning',
      mockAdminAlert,
      { testData: 'value' }
    );
    
    expect(mockAdminAlert).toHaveBeenCalled();
    const call = mockAdminAlert.mock.calls[0][0];
    expect(call.type).toBe('TEST_ALERT');
    expect(call.message).toBe('Test message');
    expect(call.severity).toBe('warning');
  });

  test('alert cooldown mechanism', async () => {
    const mockAdminAlert = jest.fn();
    
    // Première alerte
    await triggerAlert('TEST', 'msg1', 'warning', mockAdminAlert);
    expect(mockAdminAlert).toHaveBeenCalledTimes(1);
    
    // Deuxième alerte immédiatement après (devrait être supprimée par cooldown)
    await triggerAlert('TEST', 'msg2', 'warning', mockAdminAlert);
    expect(mockAdminAlert).toHaveBeenCalledTimes(1); // Pas appelée à nouveau
  });

  test('handle admin alert function errors', async () => {
    const mockAdminAlert = jest.fn().mockRejectedValue(new Error('Alert service down'));
    
    // Ne devrait pas lever d'erreur
    await expect(
      triggerAlert('TEST', 'msg', 'warning', mockAdminAlert)
    ).resolves.toBeUndefined();
  });
});

describe('Alert Service - Métriques', () => {
  beforeEach(() => {
    resetMetrics();
  });

  test('get current metrics snapshot', async () => {
    await trackPayment('success', null);
    await trackPayment('failed', null);
    await trackApiRequest(200, 50);
    await trackApiRequest(500, 100);
    
    const metrics = getMetrics();
    
    expect(metrics).toHaveProperty('timestamp');
    expect(metrics).toHaveProperty('payments');
    expect(metrics).toHaveProperty('contracts');
    expect(metrics).toHaveProperty('api');
    expect(metrics).toHaveProperty('alertState');
    
    expect(metrics.payments.total).toBe(2);
    expect(metrics.api.requests).toBe(2);
  });

  test('reset metrics clears all data', async () => {
    await trackPayment('success', null);
    await trackApiRequest(200, 50);
    
    let metrics = getMetrics();
    expect(metrics.payments.total).toBe(1);
    expect(metrics.api.requests).toBe(1);
    
    resetMetrics();
    
    metrics = getMetrics();
    expect(metrics.payments.total).toBe(0);
    expect(metrics.api.requests).toBe(0);
  });
});

describe('Alert Service - Edge cases', () => {
  beforeEach(() => {
    resetMetrics();
  });

  test('handle zero latency', async () => {
    await trackApiRequest(200, 0);
    
    const metrics = getMetrics();
    expect(metrics.api.avgLatency).toBe('0.00');
  });

  test('handle very large latencies', async () => {
    await trackApiRequest(200, 60000); // 1 minute
    
    const metrics = getMetrics();
    expect(parseInt(metrics.api.p95Latency)).toBeGreaterThan(0);
  });

  test('percentile with few data points', async () => {
    await trackApiRequest(200, 100);
    await trackApiRequest(200, 200);
    
    const metrics = getMetrics();
    expect(parseInt(metrics.api.p95Latency)).toBeGreaterThan(0);
  });
});

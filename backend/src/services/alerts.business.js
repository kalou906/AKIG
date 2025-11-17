/**
 * Business alert service - keeps lightweight metrics and triggers mock alerts.
 * This implementation is intentionally framework-free to make automated tests stable.
 */

const tracer = {
	startSpan: () => ({
		setAttributes: () => {},
		addEvent: () => {},
		recordException: () => {},
		end: () => {},
	}),
};

const ALERT_THRESHOLDS = {
	PAYMENT_FAIL_RATE: {
		threshold: Number(process.env.PAYMENT_FAIL_THRESHOLD || 5),
		window: 60 * 60 * 1000,
		description: "Taux d'échecs paiements dépasse le seuil",
	},
	LOW_DAILY_REVENUE: {
		threshold: Number(process.env.LOW_REVENUE_THRESHOLD || 100000),
		window: 24 * 60 * 60 * 1000,
		description: 'Revenu quotidien inférieur au seuil',
	},
	API_ERROR_RATE: {
		threshold: 0.05,
		window: 10 * 60 * 1000,
		description: "Taux d'erreur API supérieur à 5%",
	},
	API_LATENCY_P95: {
		threshold: 1000,
		window: 10 * 60 * 1000,
		description: 'Latence API P95 supérieure à 1 seconde',
	},
	EXPIRED_CONTRACTS: {
		threshold: 10,
		description: 'Plus de 10 contrats expirés non traités',
	},
	OVERDUE_PAYMENTS: {
		threshold: 20,
		description: 'Plus de 20 paiements en retard',
	},
};

const metrics = {
	payments: {
		total: 0,
		failed: 0,
		succeeded: 0,
	},
	api: {
		requests: 0,
		errors: 0,
		latencies: [],
		totalLatency: 0,
	},
	contracts: {
		expired: 0,
	},
	alertState: {
		lastAlertTime: 0,
		failCount: 0,
		windowStart: Date.now(),
	},
};

function resetMetrics() {
	metrics.payments = { total: 0, failed: 0, succeeded: 0 };
	metrics.api = { requests: 0, errors: 0, latencies: [], totalLatency: 0 };
	metrics.contracts = { expired: 0 };
	metrics.alertState = {
		lastAlertTime: 0,
		failCount: 0,
		windowStart: Date.now(),
	};
}

function calculatePercentile(values, percentile) {
	if (!values.length) {
		return 0;
	}
	const sorted = [...values].sort((a, b) => a - b);
	const index = Math.ceil((percentile / 100) * sorted.length) - 1;
	return sorted[Math.max(0, index)];
}

async function trackPayment(status, alertAdmins) {
	const span = tracer.startSpan('trackPayment');
	try {
		const now = Date.now();
		const windowDuration = now - metrics.alertState.windowStart;

		if (windowDuration > ALERT_THRESHOLDS.PAYMENT_FAIL_RATE.window) {
			metrics.alertState.failCount = 0;
			metrics.alertState.windowStart = now;
		}

		if (status === 'failed') {
			metrics.payments.failed += 1;
			metrics.alertState.failCount += 1;

			if (metrics.alertState.failCount >= ALERT_THRESHOLDS.PAYMENT_FAIL_RATE.threshold) {
				await triggerAlert(
					'PAYMENT_FAIL_RATE',
					`Taux d'échecs paiements critique: ${metrics.alertState.failCount}`,
					'critical',
					alertAdmins,
					{ failCount: metrics.alertState.failCount }
				);
			}
		} else if (status === 'success') {
			metrics.payments.succeeded += 1;
		}

		metrics.payments.total += 1;
	} catch (error) {
		span.recordException(error);
	} finally {
		span.end();
	}
}

async function trackApiRequest(statusCode, latency) {
	const span = tracer.startSpan('trackApiRequest');
	try {
		metrics.api.requests += 1;
		metrics.api.totalLatency += latency;
		metrics.api.latencies.push(latency);
		if (metrics.api.latencies.length > 100) {
			metrics.api.latencies.shift();
		}

		if (statusCode >= 400) {
			metrics.api.errors += 1;
		}

		const errorRate = metrics.api.errors / metrics.api.requests;
		const p95 = calculatePercentile(metrics.api.latencies, 95);

		if (p95 > ALERT_THRESHOLDS.API_LATENCY_P95.threshold) {
			await triggerAlert(
				'API_LATENCY_P95',
				`Latence API P95 élevée: ${p95.toFixed(0)}ms`,
				'warning'
			);
		}

		if (errorRate > ALERT_THRESHOLDS.API_ERROR_RATE.threshold) {
			await triggerAlert(
				'API_ERROR_RATE',
				`Taux d'erreur API élevé: ${(errorRate * 100).toFixed(1)}%`,
				'warning'
			);
		}
	} catch (error) {
		span.recordException(error);
	} finally {
		span.end();
	}
}

async function trackExpiredContracts(expiredCount) {
	const span = tracer.startSpan('trackExpiredContracts');
	try {
		metrics.contracts.expired = expiredCount;

		if (expiredCount >= ALERT_THRESHOLDS.EXPIRED_CONTRACTS.threshold) {
			await triggerAlert(
				'EXPIRED_CONTRACTS',
				`${expiredCount} contrats expirés détectés`,
				'warning'
			);
		}
	} catch (error) {
		span.recordException(error);
	} finally {
		span.end();
	}
}

async function trackOverduePayments(overdueCount) {
	const span = tracer.startSpan('trackOverduePayments');
	try {
		if (overdueCount >= ALERT_THRESHOLDS.OVERDUE_PAYMENTS.threshold) {
			await triggerAlert(
				'OVERDUE_PAYMENTS',
				`${overdueCount} paiements en retard détectés`,
				'warning'
			);
		}
	} catch (error) {
		span.recordException(error);
	} finally {
		span.end();
	}
}

async function triggerAlert(alertType, message, severity = 'warning', alertAdmins, metadata = {}) {
	const span = tracer.startSpan('triggerAlert');
	try {
		const now = Date.now();
		const cooldown = 5 * 60 * 1000;

		if (metrics.alertState.lastAlertTime && now - metrics.alertState.lastAlertTime < cooldown) {
			span.addEvent('alert_suppressed', { reason: 'cooldown' });
			return;
		}

		metrics.alertState.lastAlertTime = now;

		console.log(JSON.stringify({
			type: alertType,
			message,
			severity,
			metadata,
			timestamp: new Date(now).toISOString(),
		}));

		if (typeof alertAdmins === 'function') {
			try {
				await alertAdmins({ type: alertType, message, severity, timestamp: new Date(now).toISOString(), metadata });
			} catch (fnError) {
				span.recordException(fnError);
				console.error('Erreur envoi alerte admins:', fnError);
			}
		}
	} catch (error) {
		span.recordException(error);
	} finally {
		span.end();
	}
}

function getMetrics() {
	const span = tracer.startSpan('getMetrics');
	try {
		const failRate = metrics.payments.total
			? ((metrics.payments.failed / metrics.payments.total) * 100).toFixed(2)
			: '0.00';

		const errorRate = metrics.api.requests
			? ((metrics.api.errors / metrics.api.requests) * 100).toFixed(2)
			: '0.00';

		const avgLatency = metrics.api.requests
			? (metrics.api.totalLatency / metrics.api.requests).toFixed(2)
			: '0.00';

		const p95Latency = calculatePercentile(metrics.api.latencies, 95).toFixed(2);

		return {
			timestamp: new Date().toISOString(),
			payments: {
				total: metrics.payments.total,
				succeeded: metrics.payments.succeeded,
				failed: metrics.payments.failed,
				failRate,
			},
			contracts: {
				expired: metrics.contracts.expired,
			},
			api: {
				requests: metrics.api.requests,
				errors: metrics.api.errors,
				errorRate,
				avgLatency,
				p95Latency,
			},
			alertState: {
				lastAlertTime: metrics.alertState.lastAlertTime,
				failCount: metrics.alertState.failCount,
			},
		};
	} finally {
		span.end();
	}
}

module.exports = {
	trackPayment,
	trackApiRequest,
	trackExpiredContracts,
	trackOverduePayments,
	triggerAlert,
	getMetrics,
	resetMetrics,
	ALERT_THRESHOLDS,
};

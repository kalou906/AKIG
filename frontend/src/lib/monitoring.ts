import * as Sentry from '@sentry/react';
import { onCLS, onLCP, onFCP, onTTFB } from 'web-vitals';

/**
 * Initialize Sentry for error tracking
 */
export function initializeMonitoring() {
  const dsn = typeof window !== 'undefined' 
    ? (window as any).__SENTRY_DSN__ || 'https://example@sentry.io/0'
    : 'https://example@sentry.io/0';

  Sentry.init({
    dsn,
    integrations: [],
    tracesSampleRate: 0.2,
  });
}

/**
 * Send web vital metrics to Sentry
 */
const send = (name: string, value: number) =>
  Sentry.captureMessage('web-vital', {
    level: 'info',
    tags: { vital: name },
    extra: { value },
  });

/**
 * Report Core Web Vitals to Sentry
 */
export function reportWebVitals() {
  onCLS((m) => send('CLS', m.value));
  onLCP((m) => send('LCP', m.value));
  onFCP((m) => send('FCP', m.value));
  onTTFB((m) => send('TTFB', m.value));

  // TTFB - Time to First Byte
  onTTFB((metric) => {
    Sentry.captureMessage(`TTFB: ${metric.value.toFixed(0)}ms`, 'info');
    console.log(`TTFB: ${metric.value.toFixed(0)}ms`);
  });
}

/**
/**
 * Utility to capture errors with context
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context || {},
    },
  });
}

/**
 * Utility to capture info messages
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

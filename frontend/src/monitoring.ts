/**
 * Frontend Monitoring - TypeScript Version
 * 
 * Comprehensive error tracking, performance monitoring, and Web Vitals
 * using Sentry and web-vitals library.
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import {
  onCLS,
  onLCP,
  onFCP,
  onTTFB,
  onINP,
  Metric,
} from 'web-vitals';

/**
 * Web Vital metric interface
 */
interface WebVitalMetric {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
}

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initializeSentry(): void {
  if (!process.env.REACT_APP_SENTRY_DSN) {
    console.warn(
      '⚠️ Sentry DSN not configured. Error tracking disabled.'
    );
    return;
  }

  Sentry.init({
    // Data Source Name for Sentry project
    dsn: process.env.REACT_APP_SENTRY_DSN,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Release version
    release: process.env.REACT_APP_VERSION || '1.0.0',

    // Integrations for additional functionality
    integrations: [
      new BrowserTracing({
        // Set sampling rate for performance monitoring
        tracingOrigins: [
          'localhost',
          /^\//,
          process.env.REACT_APP_API_URL || 'http://localhost:4000',
        ],

        // Capture user interactions as spans
        // @ts-ignore - Sentry API variations across versions
        routingInstrumentation: (Sentry as any).reactRouterV6Instrumentation?.(
          window.history
        ),

        // Don't trace health checks
        shouldCreateSpanForRequest: (url: string) => {
          return !url.includes('/health');
        },
      }),

      // Session replays for debugging errors
      // @ts-ignore - Sentry Replay API variations
      ...(( Sentry as any).Replay ? [new ((Sentry as any).Replay)({
        maskAllText: true,
        blockAllMedia: true,
      })] : []),
    ],

    // Sample rate for error events
    sampleRate: 1.0,

    // Sample rate for performance monitoring
    // In development: 1.0 (100%), in production: 0.1-0.2 (10-20%)
    tracesSampleRate:
      process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Sample rate for session replays
    replaysSessionSampleRate:
      process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Always record replays on errors
    replaysOnErrorSampleRate: 1.0,

    // Debug mode (verbose logging)
    debug: process.env.NODE_ENV === 'development',

    // Attach stack traces to messages
    attachStacktrace: true,

    // Maximum breadcrumbs to store
    maxBreadcrumbs: 100,

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',

      // Network errors
      'NetworkError',
      'Network request failed',

      // Common browser errors
      'ResizeObserver loop limit exceeded',
      'AbortError',

      // Third-party errors
      'Script error',
    ],

    // Before sending events to Sentry
    beforeSend(event, hint) {
      const error = hint.originalException as Error | null;

      // Filter out aborted requests
      if (error?.name === 'AbortError') {
        return null;
      }

      // Filter out timeout errors in development
      if (
        process.env.NODE_ENV === 'development' &&
        error?.message?.includes('timeout')
      ) {
        return null;
      }

      // Always send in production
      return event;
    },

    // Set initial scope/context
    initialScope: {
      tags: {
        app: 'akig-frontend',
        version: process.env.REACT_APP_VERSION,
      },
      level: 'info',
    },
  });

  // Set user context if available
  try {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    }
  } catch {
    // User not yet logged in
  }

  console.log(
    '✅ Sentry initialized for error tracking and performance monitoring'
  );
}

/**
 * Send Web Vital metric to Sentry
 */
function sendWebVital(metric: WebVitalMetric): void {
  const { name, value, rating, delta } = metric;

  // Log to Sentry
  Sentry.captureMessage(`Web Vital: ${name}`, {
    level: 'info' as const,
    tags: {
      vital: name,
      rating: rating || 'unknown',
    },
    extra: {
      value: value.toFixed(2),
      delta: delta?.toFixed(2) || 'N/A',
    },
  });

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const emoji =
      rating === 'good'
        ? '✅'
        : rating === 'needs-improvement'
          ? '⚠️'
          : '❌';

    console.log(`${emoji} ${name}: ${value.toFixed(2)}ms (${rating})`, {
      delta: delta?.toFixed(2),
    });
  }
}

/**
 * Initialize Web Vitals monitoring
 */
export function initializeWebVitals(): void {
  if (!window.performance) {
    console.warn('Performance API not available');
    return;
  }

  // Cumulative Layout Shift - Visual stability
  // Good: < 0.1, Needs Improvement: 0.1-0.25, Poor: > 0.25
  onCLS((metric: Metric) => {
    sendWebVital({
      name: 'CLS',
      value: metric.value,
      rating: metric.rating as any,
      delta: metric.delta,
    });
  });

  // Interaction to Next Paint - Responsiveness
  // Good: < 200ms, Needs Improvement: 200-500ms, Poor: > 500ms
  onINP((metric: Metric) => {
    sendWebVital({
      name: 'INP',
      value: metric.value,
      rating: metric.rating as any,
      delta: metric.delta,
    });
  });

  // Largest Contentful Paint - Load speed
  // Good: < 2.5s, Needs Improvement: 2.5-4s, Poor: > 4s
  onLCP((metric: Metric) => {
    sendWebVital({
      name: 'LCP',
      value: metric.value,
      rating: metric.rating as any,
      delta: metric.delta,
    });
  });

  // First Contentful Paint - Content appearance
  // Good: < 1.8s, Needs Improvement: 1.8-3s, Poor: > 3s
  onFCP((metric: Metric) => {
    sendWebVital({
      name: 'FCP',
      value: metric.value,
      rating: metric.rating as any,
      delta: metric.delta,
    });
  });

  // Time to First Byte - Server response
  // Good: < 600ms, Needs Improvement: 600-1800ms, Poor: > 1800ms
  onTTFB((metric: Metric) => {
    sendWebVital({
      name: 'TTFB',
      value: metric.value,
      rating: metric.rating as any,
      delta: metric.delta,
    });
  });

  console.log('📊 Web Vitals monitoring initialized');
}

/**
 * Initialize all monitoring systems
 */
export function initializeMonitoring(): void {
  console.log('🔍 Initializing frontend monitoring...');

  // Initialize Sentry
  initializeSentry();

  // Initialize Web Vitals
  initializeWebVitals();

  // Setup API monitoring
  setupApiMonitoring();

  // Setup console monitoring
  setupConsoleMonitoring();

  // Setup before unload
  setupBeforeUnload();

  console.log('✅ All monitoring systems initialized');
}

/**
 * Monitor API calls using fetch interceptor
 */
function setupApiMonitoring(): void {
  const originalFetch = window.fetch;

  window.fetch = function(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const startTime = performance.now();
    const method = init?.method || 'GET';
    const url = typeof input === 'string' ? input : input.toString();

    // Add breadcrumb for request
    Sentry.addBreadcrumb({
      category: 'http',
      message: `${method} ${url}`,
      level: 'info',
      data: {
        method,
        url,
      },
    });

    return originalFetch
      .call(this, input, init)
      .then((response) => {
        const duration = performance.now() - startTime;

        // Log slow requests
        if (duration > 3000) {
          console.warn(
            `⚠️ Slow API request: ${method} ${url} (${duration.toFixed(0)}ms)`
          );

          Sentry.captureMessage(
            `Slow API: ${method} ${url}`,
            'warning'
          );
        }

        // Log errors
        if (!response.ok) {
          Sentry.addBreadcrumb({
            category: 'http-error',
            message: `${method} ${url} [${response.status}]`,
            level: 'error',
            data: {
              status: response.status,
              statusText: response.statusText,
              duration: `${duration.toFixed(2)}ms`,
            },
          });
        }

        return response;
      })
      .catch((error) => {
        const duration = performance.now() - startTime;

        Sentry.captureException(error, {
          level: 'error',
          tags: {
            api_error: 'true',
          },
          contexts: {
            api: {
              method,
              url,
              duration: `${duration.toFixed(2)}ms`,
            },
          },
        });

        throw error;
      });
  };

  console.log('✅ API monitoring configured');
}

/**
 * Monitor console output
 */
function setupConsoleMonitoring(): void {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = function(...args: any[]): void {
    const message = String(args[0]);

    // Skip React warnings
    if (!message.includes('Warning:')) {
      Sentry.captureException(new Error(message), {
        level: 'error',
        tags: {
          source: 'console.error',
        },
      });
    }

    originalError.apply(console, args);
  };

  console.warn = function(...args: any[]): void {
    const message = String(args[0]);

    // Skip React warnings
    if (!message.includes('Warning:')) {
      Sentry.captureMessage(message, {
        level: 'warning' as const,
        tags: {
          source: 'console.warn',
        },
      });
    }

    originalWarn.apply(console, args);
  };

  console.log('✅ Console monitoring configured');
}

/**
 * Ensure pending events are sent before page unload
 */
function setupBeforeUnload(): void {
  window.addEventListener('beforeunload', () => {
    // Give Sentry 2 seconds to send pending events
    Sentry.close(2000);
  });
}

/**
 * Capture exception manually
 */
export function captureException(
  error: Error,
  context?: Record<string, any>
): void {
  Sentry.captureException(error, {
    contexts: {
      react: context,
    },
  });
}

/**
 * Capture message manually
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info'
): void {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context
 */
export function setUser(userId: string, email?: string, username?: string): void {
  Sentry.setUser({
    id: userId,
    email: email,
    username: username,
  });
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}
/**
 * Start performance transaction
 */
export function startTransaction(name: string, op: string = 'custom'): any {
  return (Sentry as any).startTransaction?.({
    name,
    op,
  });
}

/**
 * Get Sentry instance
 */
export { Sentry };

export default {
  initializeMonitoring,
  initializeSentry,
  initializeWebVitals,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  startTransaction,
};

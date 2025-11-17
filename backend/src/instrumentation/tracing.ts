/**
 * OpenTelemetry Tracing Configuration
 * Initializes distributed tracing with automatic instrumentation
 * Exports spans to OTLP collector (Jaeger, Tempo, or other compatible backends)
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
// @ts-ignore - Resource export issue in types
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { CompositePropagator } from '@opentelemetry/core';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { B3Propagator } from '@opentelemetry/propagator-b3';

/**
 * Create OpenTelemetry Resource
 */
// @ts-ignore - Dynamic require for Resource constructor
const ResourceClass = require('@opentelemetry/resources').Resource;
const resource = new ResourceClass({
  [SemanticResourceAttributes.SERVICE_NAME]: 'akig-backend',
  [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  'service.region': process.env.AWS_REGION || 'unknown',
  'service.namespace': process.env.K8S_NAMESPACE || 'default',
  'host.name': process.env.HOSTNAME || 'unknown',
});

/**
 * Create OTLP Exporter
 */
const otlpExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  headers: process.env.OTEL_EXPORTER_OTLP_HEADERS ? 
    JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS) : 
    {},
  concurrencyLimit: parseInt(process.env.OTEL_EXPORTER_BATCH_SIZE || '512'),
  timeoutMillis: parseInt(process.env.OTEL_EXPORTER_TIMEOUT || '30000'),
});

/**
 * Create Propagator (supports W3C Trace Context, Jaeger, and B3)
 */
const propagator = new CompositePropagator({
  propagators: [
    new W3CTraceContextPropagator(),
    new JaegerPropagator(),
    new B3Propagator(),
  ],
});

/**
 * Auto Instrumentations Configuration
 */
const autoInstrumentations = getNodeAutoInstrumentations({
  '@opentelemetry/instrumentation-fs': {
    enabled: false, // Disable filesystem instrumentation (too verbose)
  },
  '@opentelemetry/instrumentation-express': {
    enabled: true,
    requestHook: (span: any, info: any) => {
      // Add custom attributes to Express spans
      span.setAttribute('http.route', info.layerName || 'unknown');
      
      // Mask sensitive data in request body
      if (info.args?.[0]?.body) {
        const sanitized = sanitizeRequestBody(info.args[0].body);
        span.setAttribute('http.request.body', JSON.stringify(sanitized));
      }
    },
  },
  '@opentelemetry/instrumentation-http': {
    enabled: true,
    requestHook: (span: any, request: any) => {
      // Skip tracing for health checks
      if ((request as any).url?.includes('/health')) {
        span.setAttribute('span.skipRecording', true);
      }
    },
    responseHook: (span: any, response: any) => {
      // Track response headers
      span.setAttribute('http.response.content_length', (response as any).headers?.['content-length'] || 0);
    },
  },
  '@opentelemetry/instrumentation-pg': {
    enabled: true,
    responseHook: (span: any, result: any) => {
      if (result?.rows) {
        span.setAttribute('db.result_rows', result.rows.length);
      }
      // Query response processing
      if (result?.query) {
        const sanitizedQuery = sanitizeQuery(result.query);
        span.setAttribute('db.statement', sanitizedQuery);
      }
    },
  },
  '@opentelemetry/instrumentation-redis': {
    enabled: true,
    responseHook: (span: any, cmdArgs: any) => {
      span.setAttribute('redis.command', cmdArgs?.[0]);
    },
  },
  '@opentelemetry/instrumentation-mysql': {
    enabled: true,
  },
  '@opentelemetry/instrumentation-mongodb': {
    enabled: true,
  },
});

/**
 * Initialize Node SDK
 */
export const sdk = new NodeSDK({
  resource,
  traceExporter: otlpExporter,
  instrumentations: autoInstrumentations,
  spanProcessor: new BatchSpanProcessor(otlpExporter, {
    maxQueueSize: parseInt(process.env.OTEL_BATCH_QUEUE_SIZE || '2048'),
    maxExportBatchSize: parseInt(process.env.OTEL_BATCH_SIZE || '512'),
    scheduledDelayMillis: parseInt(process.env.OTEL_BATCH_DELAY || '5000'),
    exportTimeoutMillis: parseInt(process.env.OTEL_BATCH_TIMEOUT || '30000'),
  }),
  textMapPropagator: propagator,
} as any);

/**
 * Start SDK (should be called at application startup)
 */
export async function startTracing() {
  try {
    await sdk.start();
    console.log('[Tracing] OpenTelemetry SDK initialized successfully');
    console.log(`[Tracing] Exporting to: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318'}`);
    
    // Register shutdown hook
    process.on('SIGTERM', async () => {
      try {
        await sdk.shutdown();
        console.log('[Tracing] OpenTelemetry SDK shut down successfully');
      } catch (error) {
        console.error('[Tracing] Error shutting down SDK:', error);
      }
    });
  } catch (error) {
    console.error('[Tracing] Failed to initialize OpenTelemetry:', error);
    throw error;
  }
}

/**
 * Get active tracer
 */
export function getTracer() {
  return (sdk as any).getTracer?.('akig-backend') || (sdk as any).trace?.getTracer('akig-backend');
}

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'api_key', 'credit_card', 'ssn', 'pin'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}

/**
 * Sanitize database query
 */
function sanitizeQuery(query: string): string {
  // Mask string literals and numbers that might contain sensitive data
  return query
    .replace(/'[^']*'/g, "'***'") // String literals
    .replace(/\$\d+/g, '$?') // Parameterized placeholders
    .substring(0, 500); // Truncate very long queries
}

/**
 * Custom Span Context Utilities
 */
import { context, trace } from '@opentelemetry/api';

export interface SpanOptions {
  name: string;
  attributes?: Record<string, any>;
  events?: Array<{ name: string; attributes?: Record<string, any> }>;
}

/**
 * Create a span and run a callback within it
 */
export async function withSpan<T>(
  options: SpanOptions,
  callback: () => Promise<T> | T
): Promise<T> {
  const tracer = trace.getTracer('akig-backend');
  const span = tracer.startSpan(options.name, {
    attributes: options.attributes,
  });

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await callback();
      span.setStatus({ code: 0 }); // OK
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message }); // ERROR
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Add event to current span
 */
export function addSpanEvent(name: string, attributes?: Record<string, any>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Set attribute on current span
 */
export function setSpanAttribute(key: string, value: any) {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute(key, value);
  }
}

/**
 * Express Middleware for Tracing
 */
// @ts-ignore - Import types from express
import type { Request, Response, NextFunction } from 'express';

export function tracingMiddleware(req: any, res: any, next: NextFunction) {
  const tracer = trace.getTracer('akig-backend');
  
  // Extract trace context from request headers
  const span = tracer.startSpan(`${req.method} ${req.path}`, {
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'http.target': req.path,
      'http.scheme': req.protocol,
      'http.host': req.hostname,
      'http.client_ip': req.ip,
      'http.user_agent': req.get('user-agent'),
    },
  });

  // Store span in request for later access
  (req as any).span = span;

  // Run middleware in span context
  context.with(trace.setSpan(context.active(), span), () => {
    // Record response information when response is sent
    const originalSend = res.send;
    res.send = function(data: any) {
      span.setAttributes({
        'http.status_code': res.statusCode,
        'http.response_content_length': JSON.stringify(data).length,
      });
      span.end();
      return originalSend.call(this, data);
    };

    next();
  });
}

/**
 * Database Query Tracing Helper
 */
export async function traceQuery<T>(
  name: string,
  query: string,
  callback: () => Promise<T>
): Promise<T> {
  return withSpan(
    {
      name: `db.query.${name}`,
      attributes: {
        'db.system': 'postgresql',
        'db.operation': extractOperation(query),
        'db.statement': query.substring(0, 500),
      },
    },
    callback
  );
}

function extractOperation(query: string): string {
  const match = query.match(/^\s*(\w+)/i);
  return match ? match[1].toUpperCase() : 'UNKNOWN';
}

/**
 * HTTP Client Tracing Helper
 */
export async function traceHttpCall<T>(
  method: string,
  url: string,
  callback: () => Promise<T>
): Promise<T> {
  return withSpan(
    {
      name: `http.client.${method.toLowerCase()}`,
      attributes: {
        'http.method': method,
        'http.url': url,
        'component': 'http',
      },
    },
    callback
  );
}

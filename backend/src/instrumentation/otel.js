/**
 * OpenTelemetry (OTEL) Initialization
 * 
 * MUST be required FIRST before any other modules
 * This sets up automatic instrumentation for the entire application
 * 
 * Usage: require('./instrumentation/otel') at the TOP of server.js
 */

const os = require('os');

// Only initialize if explicitly enabled or if exporter endpoint is configured
const OTEL_ENABLED = process.env.OTEL_ENABLED === 'true' || 
                     !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (!OTEL_ENABLED) {
  console.log('[OTEL] Disabled (set OTEL_EXPORTER_OTLP_ENDPOINT to enable)');
  module.exports = { enabled: false };
} else {
  try {
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
    const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-node');
    const { Resource } = require('@opentelemetry/resources');
    const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
    const { CompositePropagator, W3CTraceContextPropagator } = require('@opentelemetry/core');

    // Resource metadata
    const resource = Resource.default().merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'akig-backend',
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
        [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: os.hostname(),
      })
    );

    // OTLP Exporter
    const otlpExporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
      headers: process.env.OTEL_EXPORTER_OTLP_HEADERS ?
        JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS) :
        {},
      concurrencyLimit: 10,
      timeoutMillis: 30000,
    });

    // Propagator
    const propagator = new CompositePropagator({
      propagators: [
        new W3CTraceContextPropagator(),
      ],
    });

    // Auto-instrumentation config
    const autoInstrumentations = getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Too verbose
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-redis': {
        enabled: true,
      },
    });

    // SDK
    const sdk = new NodeSDK({
      resource,
      traceExporter: otlpExporter,
      instrumentations: autoInstrumentations,
      spanProcessor: new BatchSpanProcessor(otlpExporter, {
        maxQueueSize: 2048,
        maxExportBatchSize: 512,
        scheduledDelayMillis: 5000,
      }),
      textMapPropagator: propagator,
    });

    // Start SDK
    sdk.start();
    console.log(`[OTEL] ✓ Initialized (exporting to ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318'})`);

    // Register shutdown hook
    process.on('SIGTERM', async () => {
      console.log('[OTEL] Shutting down...');
      await sdk.shutdown();
      console.log('[OTEL] ✓ Shutdown complete');
    });

    process.on('SIGINT', async () => {
      console.log('[OTEL] Shutting down...');
      await sdk.shutdown();
      console.log('[OTEL] ✓ Shutdown complete');
    });

    module.exports = { enabled: true, sdk };
  } catch (error) {
    console.warn(`[OTEL] Failed to initialize: ${error.message}`);
    module.exports = { enabled: false, error };
  }
}

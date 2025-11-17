// Simplification pour développement - désactiver OTel en dev
if (process.env.NODE_ENV !== 'production') {
  // OpenTelemetry est optionnel en développement
  module.exports = {
    start: () => console.log('⚠️  OpenTelemetry désactivé en développement'),
    shutdown: () => Promise.resolve(),
  };
} else {
  const { NodeSDK } = require('@opentelemetry/sdk-node');
  const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
  const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
  const { Resource } = require('@opentelemetry/resources');
  const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
  const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-node');
  const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');

  // Configuration de la ressource
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'akig-api',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    hostname: require('os').hostname(),
  });

  // Exportateur OTLP (vers Jaeger, Tempo, etc.)
  const otlpExporter = new OTLPTraceExporter({
    url: process.env.OTLP_URL || 'http://localhost:4318/v1/traces',
  });

  // Exportateur console (pour développement)
  const consoleExporter = new ConsoleSpanExporter();

  // Configuration du SDK Node
  const sdk = new NodeSDK({
    resource,
    traceExporter: otlpExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
        '@opentelemetry/instrumentation-dns': {
          enabled: false,
        },
      }),
    ],
  });

  // Démarrer le SDK
  sdk.start();

  console.log('🔍 OpenTelemetry initialisé');
  console.log(`📡 Exportateur: OTLP`);

  // Gérer l'arrêt gracieux
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('✅ OpenTelemetry arrêté'))
      .catch((err) => console.log('❌ Erreur arrêt OTel:', err));
  });

  module.exports = sdk;
}

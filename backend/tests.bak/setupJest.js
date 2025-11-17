// Mock OpenTelemetry SDK for tests to avoid requiring native exporters and to provide a simple tracer
// This file is loaded via --setupFiles to ensure the mock is in place before modules are required.

jest.mock('../src/otel', () => {
  const span = {
    setAttributes: () => {},
    addEvent: () => {},
    recordException: () => {},
    end: () => {},
  };

  const tracer = {
    startSpan: () => span,
  };

  return {
    tracer,
    // also provide start/shutdown for modules that call them
    start: () => {},
    shutdown: () => Promise.resolve(),
  };
});

// Optional: increase default test timeout for slow CI environments
jest.setTimeout(20000);

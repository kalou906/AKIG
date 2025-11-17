import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

/**
 * K6 Load Testing - Multi-Scenario Suite
 * Tests different user behaviors and API endpoints under load
 */

// =====================================================================
// CUSTOM METRICS
// =====================================================================

const paymentFailureRate = new Rate('payment_failures');
const paymentDuration = new Trend('payment_duration');
const dashboardDuration = new Trend('dashboard_duration');
const exportDuration = new Trend('export_duration');
const notificationDuration = new Trend('notification_duration');
const successfulPayments = new Counter('successful_payments');
const failedPayments = new Counter('failed_payments');
const apiErrors = new Counter('api_errors');

// =====================================================================
// CONFIGURATION
// =====================================================================

export const options = {
  scenarios: {
    // Payments: Ramp up from 20 to 200 VUs over 2 minutes
    payments: {
      executor: 'ramping-vus',
      startVUs: 20,
      stages: [
        { duration: '2m', target: 200 },   // Ramp up to 200
        { duration: '2m', target: 200 },   // Hold at 200
        { duration: '1m', target: 50 },    // Ramp down to 50
      ],
      gracefulRampDown: '30s',
    },

    // Dashboard: Constant 50 VUs for 3 minutes
    dashboard: {
      executor: 'constant-vus',
      vus: 50,
      duration: '3m',
      gracefulStop: '30s',
    },

    // Exports: Shared iterations (300 total requests across VUs)
    exports: {
      executor: 'shared-iterations',
      vus: 30,
      iterations: 300,
      gracefulStop: '30s',
    },

    // Notifications: Per-VU iterations (10 requests per VU)
    notifications: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 10,
      gracefulStop: '30s',
    },

    // Spike test: Sudden traffic spike
    spike: {
      executor: 'constant-vus',
      vus: 500,
      duration: '30s',
      startTime: '6m',
      gracefulStop: '10s',
    },
  },

  // Performance thresholds - tests fail if exceeded
  thresholds: {
    // Overall failure rate: < 3%
    http_req_failed: ['rate<0.03'],

    // Overall response time: 95th percentile < 1000ms
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],

    // Scenario-specific thresholds
    'http_req_duration{scenario:payments}': [
      'p(95)<900',
      'p(99)<1500',
      'avg<500',
    ],
    'http_req_duration{scenario:dashboard}': [
      'p(95)<700',
      'p(99)<1200',
      'avg<400',
    ],
    'http_req_duration{scenario:exports}': [
      'p(95)<2000',
      'p(99)<4000',
    ],
    'http_req_duration{scenario:notifications}': [
      'p(95)<800',
      'p(99)<1500',
    ],

    // Custom metrics
    payment_failures: ['rate<0.05'],
    successful_payments: ['count>100'],
  },

  // Additional options
  ext: {
    loadimpact: {
      projectID: 3356643,
      name: 'AKIG Multi-Scenario Load Test',
    },
  },
};

// =====================================================================
// SETUP
// =====================================================================

export function setup() {
  console.log('🚀 Starting multi-scenario load test');
  return {
    baseUrl: __ENV.BASE_URL || 'http://localhost:4002',
    token: __ENV.TOKEN || '',
    startTime: new Date().toISOString(),
  };
}

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

/**
 * Create authorization headers
 */
function getHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'k6-load-test/1.0',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

/**
 * Log detailed response information
 */
function logResponse(name, res, expectedStatus) {
  const success = res.status === expectedStatus;
  const icon = success ? '✓' : '✗';
  console.log(
    `${icon} ${name}: ${res.status} (${res.timings.duration.toFixed(0)}ms)`
  );
  return success;
}

/**
 * Make HTTP request with error handling
 */
function makeRequest(method, url, headers, payload = null, timeout = 30000) {
  const params = {
    headers,
    timeout: `${timeout}ms`,
  };

  let res;
  try {
    switch (method.toUpperCase()) {
      case 'GET':
        res = http.get(url, params);
        break;
      case 'POST':
        res = http.post(url, payload ? JSON.stringify(payload) : null, params);
        break;
      case 'PUT':
        res = http.put(url, payload ? JSON.stringify(payload) : null, params);
        break;
      case 'DELETE':
        res = http.del(url, params);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  } catch (err) {
    console.error(`Error making ${method} request to ${url}: ${err.message}`);
    apiErrors.add(1);
    return null;
  }

  return res;
}

// =====================================================================
// SCENARIO: PAYMENTS
// =====================================================================

export function payments(data) {
  group('Payment Processing', () => {
    const url = `${data.baseUrl}/api/payments`;
    const headers = getHeaders(data.token);

    const payload = {
      invoice_id: Math.floor(Math.random() * 1000) + 1,
      amount: Math.floor(Math.random() * 500000) + 100000, // 100k to 600k
      method: ['orange_money', 'bank_transfer', 'card'][
        Math.floor(Math.random() * 3)
      ],
      currency: 'XOF',
    };

    const startTime = new Date();
    const res = makeRequest('POST', url, headers, payload);

    if (!res) {
      failedPayments.add(1);
      paymentFailureRate.add(1);
      return;
    }

    const duration = new Date() - startTime;
    paymentDuration.add(duration);

    // Accept both 200 (success) and 400 (validation error)
    const isSuccess = [200, 201].includes(res.status);
    const isError = [400, 401, 403, 500].includes(res.status);

    check(res, {
      'payment status valid': (r) => isSuccess || isError || r.status === 202,
      'payment response time < 900ms': (r) => r.timings.duration < 900,
      'payment has response body': (r) => r.body && r.body.length > 0,
    });

    if (isSuccess) {
      successfulPayments.add(1);
    } else if (isError) {
      failedPayments.add(1);
      paymentFailureRate.add(1);
      apiErrors.add(1);
    }

    sleep(Math.random() * 2 + 0.5); // 0.5-2.5 seconds
  });
}

// =====================================================================
// SCENARIO: DASHBOARD
// =====================================================================

export function dashboard(data) {
  group('Dashboard Access', () => {
    const url = `${data.baseUrl}/api/dashboard`;
    const headers = getHeaders(data.token);

    const startTime = new Date();
    const res = makeRequest('GET', url, headers);

    if (!res) {
      apiErrors.add(1);
      return;
    }

    const duration = new Date() - startTime;
    dashboardDuration.add(duration);

    check(res, {
      'dashboard returns 200': (r) => r.status === 200,
      'dashboard response time < 700ms': (r) => r.timings.duration < 700,
      'dashboard has data': (r) => r.body && r.body.length > 0,
      'dashboard content-type is json': (r) =>
        r.headers['Content-Type']?.includes('application/json'),
    });

    if (res.status !== 200) {
      apiErrors.add(1);
    }

    sleep(0.5); // 500ms between requests
  });
}

// =====================================================================
// SCENARIO: EXPORTS
// =====================================================================

export function exports(data) {
  group('Data Export', () => {
    const exportType = ['invoices', 'contracts', 'payments'][
      Math.floor(Math.random() * 3)
    ];
    const format = ['csv', 'pdf'][Math.floor(Math.random() * 2)];
    const url = `${data.baseUrl}/api/exports/${exportType}.${format}`;
    const headers = getHeaders(data.token);

    const startTime = new Date();
    const res = makeRequest('GET', url, headers, null, 60000); // 60s timeout for exports

    if (!res) {
      apiErrors.add(1);
      return;
    }

    const duration = new Date() - startTime;
    exportDuration.add(duration);

    check(res, {
      'export returns 200': (r) => r.status === 200,
      'export response time < 2000ms': (r) => r.timings.duration < 2000,
      'export has content': (r) => r.body && r.body.length > 0,
      'export content-type is correct': (r) => {
        const ct = r.headers['Content-Type'] || '';
        if (format === 'csv') {
          return ct.includes('text/csv') || ct.includes('application/csv');
        }
        return ct.includes('pdf') || ct.includes('application/pdf');
      },
    });

    if (res.status !== 200) {
      apiErrors.add(1);
    }

    sleep(0.5);
  });
}

// =====================================================================
// SCENARIO: NOTIFICATIONS
// =====================================================================

export function notifications(data) {
  group('Notification System', () => {
    const url = `${data.baseUrl}/api/notify/test`;
    const headers = getHeaders(data.token);

    const payload = {
      target: ['tenant', 'user', 'admin'][Math.floor(Math.random() * 3)],
      message: `Test notification ${Math.random()}`,
      priority: ['low', 'normal', 'high'][Math.floor(Math.random() * 3)],
    };

    const startTime = new Date();
    const res = makeRequest('POST', url, headers, payload);

    if (!res) {
      apiErrors.add(1);
      return;
    }

    const duration = new Date() - startTime;
    notificationDuration.add(duration);

    check(res, {
      'notification accepted': (r) => [200, 201, 202].includes(r.status),
      'notification response time < 800ms': (r) => r.timings.duration < 800,
      'notification has response': (r) => r.body && r.body.length > 0,
    });

    if (![200, 201, 202].includes(res.status)) {
      apiErrors.add(1);
    }

    sleep(0.5);
  });
}

// =====================================================================
// DEFAULT FUNCTION (runs if no scenarios specify functions)
// =====================================================================

export default function (data) {
  // If running without scenarios, this is a basic smoke test
  group('Smoke Test', () => {
    const healthUrl = `${data.baseUrl}/api/health`;
    const res = http.get(healthUrl);

    check(res, {
      'health check 200': (r) => r.status === 200,
      'health check is fast': (r) => r.timings.duration < 100,
    });

    sleep(1);
  });
}

// =====================================================================
// TEARDOWN
// =====================================================================

export function teardown(data) {
  console.log('📊 Load test completed');
  console.log(`Duration: ${data.startTime} to ${new Date().toISOString()}`);
}

// =====================================================================
// CUSTOM SUMMARY (runs after test completes)
// =====================================================================

export function handleSummary(data) {
  return {
    'stdout': formatSummary(data),
    'summary.json': data,
    'summary.html': htmlReport(data),
  };
}

function formatSummary(data) {
  const summary = data.metrics;
  let output = '\n=== LOAD TEST SUMMARY ===\n\n';

  Object.keys(summary).forEach(metric => {
    const values = summary[metric].values;
    if (values) {
      output += `${metric}:\n`;
      Object.keys(values).forEach(key => {
        output += `  ${key}: ${values[key]}\n`;
      });
    }
  });

  return output;
}

function htmlReport(data) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>K6 Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .pass { color: green; }
    .fail { color: red; }
  </style>
</head>
<body>
  <h1>K6 Load Test Report</h1>
  <pre>${JSON.stringify(data, null, 2)}</pre>
</body>
</html>`;
}

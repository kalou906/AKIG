// ops/k6/api_soak.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5m', target: 50 },    // Montée rapide
    { duration: '30m', target: 50 },   // Soak test: maintenir 50 utilisateurs
    { duration: '5m', target: 0 },     // Descente
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'], // 99% < 2s
    http_req_failed: ['rate<0.01'],    // < 1% d'erreurs
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:4002';
  const token = __ENV.TOKEN || 'test-token';

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  // Test d'endpoints multiples
  const endpoints = [
    { name: 'health', url: `${baseUrl}/api/health`, method: 'GET' },
    { name: 'contracts', url: `${baseUrl}/api/contracts`, method: 'GET' },
    { name: 'payments', url: `${baseUrl}/api/payments`, method: 'GET' },
    { name: 'dashboard', url: `${baseUrl}/api/dashboard`, method: 'GET' },
  ];

  endpoints.forEach((endpoint) => {
    let res;
    if (endpoint.method === 'GET') {
      res = http.get(endpoint.url, params);
    } else if (endpoint.method === 'POST') {
      res = http.post(endpoint.url, '{}', params);
    }

    check(res, {
      [`${endpoint.name} réussi`]: (r) => r.status === 200,
      [`${endpoint.name} pas de timeout`]: (r) => r.status !== 0,
    });

    sleep(1);
  });
}

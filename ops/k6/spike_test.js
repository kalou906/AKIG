// ops/k6/spike_test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Normal load
    { duration: '0s', target: 1000 },  // Spike instantané
    { duration: '2m', target: 1000 },  // Maintenir spike
    { duration: '0s', target: 100 },   // Retour à normal
    { duration: '1m', target: 0 },     // Arrêt
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% < 1.5s sous spike
    http_req_failed: ['rate<0.05'],    // Accepter 5% d'erreurs pendant spike
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

  // Test de payment simple
  const payload = JSON.stringify({
    invoice_id: Math.floor(Math.random() * 1000) + 1,
    amount: Math.floor(Math.random() * 5000000) + 100000,
    method: 'cash',
  });

  const res = http.post(`${baseUrl}/api/payments`, payload, params);

  check(res, {
    'Sous spike: OK': (r) => r.status === 200 || r.status === 201 || r.status === 400,
    'Pas de 5xx': (r) => r.status < 500,
    'Réponse reçue': (r) => r.status !== 0,
  });

  sleep(0.5);
}

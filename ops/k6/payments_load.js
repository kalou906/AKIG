// ops/k6/payments_load.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 200 },   // Montée en charge: 0 → 200 utilisateurs
    { duration: '3m', target: 500 },   // Pic: 200 → 500 utilisateurs
    { duration: '1m', target: 0 },     // Descente: 500 → 0 utilisateurs
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],  // 95% des requêtes < 800ms
    http_req_failed: ['rate<0.05'],    // < 5% d'erreurs
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:4002';
  const token = __ENV.TOKEN || 'test-token';

  const payload = JSON.stringify({
    invoice_id: Math.floor(Math.random() * 1000) + 1,
    amount: Math.floor(Math.random() * 5000000) + 100000,
    method: 'orange_money',
    paid_at: new Date().toISOString().split('T')[0],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  const res = http.post(`${baseUrl}/api/payments`, payload, params);

  check(res, {
    'Status 200 ou 201': (r) => r.status === 200 || r.status === 201,
    'Réponse JSON valide': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
    'Pas de timeout': (r) => r.status !== 0,
    'Durée < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}

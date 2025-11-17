// ops/k6/contracts_stress.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Warm-up
    { duration: '2m', target: 300 },   // Ramp-up
    { duration: '2m', target: 300 },   // Sustain
    { duration: '1m', target: 0 },     // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(99)<1000'],  // 99% < 1s
    http_req_failed: ['rate<0.1'],      // < 10% d'erreurs
  },
};

const contractIds = [];

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:4002';
  const token = __ENV.TOKEN || 'test-token';

  const contractData = {
    property_name: `Property-${Math.random().toString(36).substring(7)}`,
    tenant_name: `Tenant-${Math.random().toString(36).substring(7)}`,
    start_date: '2025-01-01',
    end_date: '2026-01-01',
    monthly_rent: Math.floor(Math.random() * 5000000) + 100000,
    status: 'actif',
  };

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  // Créer un contrat
  const createRes = http.post(
    `${baseUrl}/api/contracts`,
    JSON.stringify(contractData),
    params
  );

  check(createRes, {
    'Contrat créé (201)': (r) => r.status === 201,
    'ID retourné': (r) => {
      try {
        const body = JSON.parse(r.body);
        if (body.id) {
          contractIds.push(body.id);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);

  // Lire les contrats
  const getRes = http.get(
    `${baseUrl}/api/contracts`,
    params
  );

  check(getRes, {
    'Lecture contrats (200)': (r) => r.status === 200,
    'Est un tableau': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);
}

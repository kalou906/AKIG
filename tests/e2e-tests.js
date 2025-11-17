/**
 * 🧪 Tests E2E - Validation Complète du Système
 */

const tests = {
  // ✅ Tests d'authentification
  auth: [
    {
      name: 'Register new user',
      method: 'POST',
      url: '/api/auth/register',
      body: { firstName: 'Test', lastName: 'User', email: 'test@example.com', password: 'Password123', role: 'agent' },
      expectedStatus: 201
    },
    {
      name: 'Login user',
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'test@example.com', password: 'Password123' },
      expectedStatus: 200
    },
    {
      name: 'Get current user',
      method: 'GET',
      url: '/api/auth/me',
      expectedStatus: 200
    }
  ],

  // ✅ Tests propriétés
  properties: [
    {
      name: 'Create property',
      method: 'POST',
      url: '/api/properties',
      body: {
        title: 'Maison à Kaloum',
        description: 'Belle maison 3 chambres',
        type: 'house',
        address: 'Rue de la Paix, Kaloum',
        district: 'Kaloum',
        city: 'Conakry',
        bedrooms: 3,
        bathrooms: 2,
        total_area: 250,
        rental_price: 5000000,
        status: 'available'
      },
      expectedStatus: 201
    },
    {
      name: 'List properties',
      method: 'GET',
      url: '/api/properties?city=Conakry&limit=10',
      expectedStatus: 200
    },
    {
      name: 'Search properties',
      method: 'GET',
      url: '/api/properties/search?q=Kaloum',
      expectedStatus: 200
    },
    {
      name: 'Get property stats',
      method: 'GET',
      url: '/api/properties/stats',
      expectedStatus: 200
    }
  ],

  // ✅ Tests clients
  clients: [
    {
      name: 'Create client',
      method: 'POST',
      url: '/api/clients',
      body: {
        firstName: 'Jean',
        lastName: 'Dupont',
        type: 'tenant',
        email: 'jean.dupont@example.com',
        phone: '624123456',
        nationality: 'Guinéenne',
        salary: 2000000,
        verified: false
      },
      expectedStatus: 201
    },
    {
      name: 'List clients',
      method: 'GET',
      url: '/api/clients?type=tenant&limit=10',
      expectedStatus: 200
    },
    {
      name: 'Get client details',
      method: 'GET',
      url: '/api/clients/1',
      expectedStatus: 200
    }
  ],

  // ✅ Tests contrats
  contracts: [
    {
      name: 'Create contract',
      method: 'POST',
      url: '/api/contracts',
      body: {
        startDate: '2025-01-01',
        endDate: '2026-01-01',
        tenantId: 1,
        landlordId: 2,
        propertyId: 1,
        monthlyRent: 5000000,
        securityDeposit: 10000000,
        duration: 12
      },
      expectedStatus: 201
    },
    {
      name: 'List active contracts',
      method: 'GET',
      url: '/api/contracts/active',
      expectedStatus: 200
    },
    {
      name: 'Get contracts with arrears',
      method: 'GET',
      url: '/api/contracts/arrears',
      expectedStatus: 200
    }
  ],

  // ✅ Tests paiements & PDF
  payments: [
    {
      name: 'Record payment',
      method: 'POST',
      url: '/api/payments',
      body: {
        contractId: 1,
        amount: 5000000,
        dueDate: '2025-02-01',
        paymentMethod: 'bank_transfer',
        tenantId: 1
      },
      expectedStatus: 201
    },
    {
      name: 'Get overdue payments',
      method: 'GET',
      url: '/api/payments/overdue',
      expectedStatus: 200
    },
    {
      name: 'Generate receipt PDF',
      method: 'POST',
      url: '/api/payments/1/receipt',
      expectedStatus: 200
    },
    {
      name: 'Get payment stats',
      method: 'GET',
      url: '/api/payments/stats',
      expectedStatus: 200
    }
  ]
};

// Export pour utilisation dans test runner
module.exports = tests;

// Fonction helper pour exécuter les tests
async function runTests(baseURL = 'http://localhost:4000/api', token = '') {
  console.log('🚀 Démarrage des tests E2E...\n');
  
  let passed = 0, failed = 0;

  for (const [category, testList] of Object.entries(tests)) {
    console.log(`\n📝 ${category.toUpperCase()}`);
    console.log('='.repeat(50));

    for (const test of testList) {
      try {
        const options = {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        };

        if (test.body) options.body = JSON.stringify(test.body);

        const response = await fetch(`${baseURL}${test.url}`, options);
        const success = response.status === test.expectedStatus;

        if (success) {
          console.log(`✅ ${test.name}`);
          passed++;
        } else {
          console.log(`❌ ${test.name} (Expected ${test.expectedStatus}, got ${response.status})`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ ${test.name} (Error: ${error.message})`);
        failed++;
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Réussis: ${passed}`);
  console.log(`❌ Échoués: ${failed}`);
  console.log(`📊 Taux de réussite: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);
}

// Exécuter si appelé directement
if (require.main === module) {
  runTests();
}

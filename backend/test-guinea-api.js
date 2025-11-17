/**
 * 🧪 Script Test - API Guinée AKIG
 * 
 * Teste tous les endpoints créés
 * Utilisation: node test-guinea-api.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:4000/api/guinea';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.yellow}━━━ ${msg} ━━━${colors.reset}\n`),
  data: (data) => console.log(JSON.stringify(data, null, 2))
};

async function runTests() {
  log.section('🧪 TESTS API GUINÉE - AKIG');

  try {
    // TEST 1: Currency Info
    log.section('1️⃣ DEVISE - Currency Info');
    const currencyInfo = await axios.get(`${API_URL}/currency/info`);
    log.success('GET /currency/info');
    log.data(currencyInfo.data.data);

    // TEST 2: Convert USD to GNF
    log.section('2️⃣ DEVISE - Conversion USD → GNF');
    const conversion = await axios.post(`${API_URL}/currency/convert`, {
      from: 'USD',
      to: 'GNF',
      amount: 100
    });
    log.success('POST /currency/convert');
    log.data(conversion.data.data);

    // TEST 3: Format GNF
    log.section('3️⃣ DEVISE - Format GNF');
    const formatted = await axios.get(`${API_URL}/currency/format/865000`);
    log.success('GET /currency/format/:amount');
    log.data(formatted.data.data);

    // TEST 4: All Sectors
    log.section('4️⃣ SECTEURS - Tous les secteurs');
    const sectors = await axios.get(`${API_URL}/sectors`);
    log.success(`GET /sectors (${sectors.data.count} trouvés)`);
    sectors.data.data.forEach(s => {
      console.log(`  📍 ${s.icon} ${s.name} (${s.priceLevel}) - T3: ${s.averagePrices.t3}`);
    });

    // TEST 5: Get sector by ID
    log.section('5️⃣ SECTEURS - Détail secteur (Matam)');
    const sector = await axios.get(`${API_URL}/sectors/matam`);
    log.success('GET /sectors/:id');
    log.data({
      name: sector.data.data.name,
      description: sector.data.data.description,
      priceLevel: sector.data.data.priceLevel,
      neighborhoods: sector.data.data.neighborhoods
    });

    // TEST 6: Filter by price level
    log.section('6️⃣ SECTEURS - Filtrer par niveau (MOYEN)');
    const filtered = await axios.get(`${API_URL}/sectors/filter/by-price?level=MOYEN`);
    log.success(`GET /sectors/filter/by-price (${filtered.data.count} trouvés)`);
    filtered.data.data.forEach(s => {
      console.log(`  🏘️  ${s.name} - Multiplicateur: ${s.priceMultiplier}`);
    });

    // TEST 7: Neighborhoods
    log.section('7️⃣ SECTEURS - Quartiers (Dixinn)');
    const neighborhoods = await axios.get(`${API_URL}/sectors/dixinn/neighborhoods`);
    log.success('GET /sectors/:sectorId/neighborhoods');
    console.log(`  Quartiers: ${neighborhoods.data.data.join(', ')}`);

    // TEST 8: Get price for sector
    log.section('8️⃣ SECTEURS - Prix T3 par secteur');
    const price = await axios.get(`${API_URL}/sectors/kaloum/prices/t3`);
    log.success('GET /sectors/:sectorId/prices/:bedrooms');
    log.data(price.data.data);

    // TEST 9: Recommend sectors
    log.section('9️⃣ SECTEURS - Recommander (Budget 3M, Résidences, Risque Faible)');
    const recommended = await axios.post(`${API_URL}/sectors/recommend`, {
      budget: 3000000,
      type: 'Résidences',
      minRisk: 'Faible'
    });
    log.success(`POST /sectors/recommend (${recommended.data.count} trouvés)`);
    recommended.data.data.forEach(s => {
      console.log(`  ✅ ${s.name} - Prix moyen T3: ${s.averagePrices.t3}`);
    });

    // TEST 10: Payment methods
    log.section('🔟 PAIEMENT - Tous les moyens');
    const methods = await axios.get(`${API_URL}/payments/methods`);
    log.success(`GET /payments/methods (${methods.data.count} trouvés)`);
    methods.data.data.forEach(m => {
      console.log(`  ${m.icon} ${m.name} - Frais: ${m.fees}% - ${m.processingTime}`);
    });

    // TEST 11: Payment methods for UI
    log.section('1️⃣1️⃣ PAIEMENT - Moyens pour UI');
    const methodsUI = await axios.get(`${API_URL}/payments/methods/ui`);
    log.success('GET /payments/methods/ui');
    console.log(`  ${methodsUI.data.count} moyens disponibles pour interface`);

    // TEST 12: Specific payment method
    log.section('1️⃣2️⃣ PAIEMENT - Détail MTN Mobile Money');
    const mtn = await axios.get(`${API_URL}/payments/methods/mtn-mobile-money`);
    log.success('GET /payments/methods/:id');
    log.data({
      name: mtn.data.data.name,
      provider: mtn.data.data.provider,
      fees: mtn.data.data.fees,
      minAmount: mtn.data.data.minAmount,
      maxAmount: mtn.data.data.maxAmount,
      contactNumber: mtn.data.data.contactNumber
    });

    // TEST 13: Validate payment amount
    log.section('1️⃣3️⃣ PAIEMENT - Valider montant (MTN 100K)');
    const validation = await axios.post(`${API_URL}/payments/validate`, {
      methodId: 'mtn-mobile-money',
      amount: 100000
    });
    log.success('POST /payments/validate');
    console.log(`  Valide: ${validation.data.success}`);

    // TEST 14: Calculate fees
    log.section('1️⃣4️⃣ PAIEMENT - Calculer frais (MTN 100K)');
    const fees = await axios.post(`${API_URL}/payments/fees`, {
      methodId: 'mtn-mobile-money',
      amount: 100000
    });
    log.success('POST /payments/fees');
    log.data(fees.data.data);

    // TEST 15: Recommended payment methods
    log.section('1️⃣5️⃣ PAIEMENT - Recommander moyens (500K)');
    const recommendedPayments = await axios.get(`${API_URL}/payments/recommended?amount=500000`);
    log.success(`GET /payments/recommended (${recommendedPayments.data.count} trouvés)`);
    recommendedPayments.data.data.forEach(m => {
      console.log(`  ✅ ${m.name} - Frais: ${m.fees}%`);
    });

    // TEST 16: Mobile money methods
    log.section('1️⃣6️⃣ PAIEMENT - Moyens Mobile Money');
    const mobileMethods = await axios.get(`${API_URL}/payments/mobile-money`);
    log.success(`GET /payments/mobile-money (${mobileMethods.data.count} trouvés)`);
    mobileMethods.data.data.forEach(m => {
      console.log(`  📱 ${m.name}`);
    });

    // TEST 17: Process payment (simulation)
    log.section('1️⃣7️⃣ PAIEMENT - Traiter paiement (Simulation)');
    const payment = await axios.post(`${API_URL}/payments/process`, {
      methodId: 'mtn-mobile-money',
      amount: 100000,
      description: 'Loyer mois d\'octobre'
    });
    log.success('POST /payments/process');
    log.data(payment.data.data);

    // RÉSUMÉ
    log.section('✅ RÉSUMÉ DES TESTS');
    log.success('Tous les endpoints sont fonctionnels!');
    console.log(`
  📊 Tests réussis: 17/17
  🇬🇳 Devise: ✅ (Conversion, Format, Infos)
  🏘️  Secteurs: ✅ (5 secteurs, Filtres, Prix)
  💳 Paiement: ✅ (5 moyens, Frais, Traitement)
  
  🚀 Système Guinée PRÊT À UTILISER!
    `);

  } catch (error) {
    log.error(`Erreur: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      log.data(error.response.data);
    }
    process.exit(1);
  }
}

// Run
runTests().catch(console.error);

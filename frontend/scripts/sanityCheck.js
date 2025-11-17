// Script de vérification rapide AKIG (Node.js)
// Usage : node scripts/sanityCheck.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
const endpoints = [
  '/health',
  '/reports/summary?year=2025',
  '/payments',
];

(async () => {
  let ok = 0, fail = 0;
  for (const ep of endpoints) {
    try {
      const res = await fetch(API + ep, { credentials: 'include' });
      const txt = await res.text();
      let json;
      try { json = JSON.parse(txt); } catch { json = txt; }
      if (res.ok) {
        console.log(`✅ ${ep} [${res.status}]`, typeof json === 'object' ? JSON.stringify(json).slice(0, 120) : json);
        ok++;
      } else {
        console.error(`❌ ${ep} [${res.status}]`, json);
        fail++;
      }
    } catch (e) {
      console.error(`❌ ${ep} [EXCEPTION]`, e.message);
      fail++;
    }
  }
  if (fail === 0) {
    console.log('\n🎉 Tous les endpoints critiques sont OK. AKIG est opérationnel.');
    process.exit(0);
  } else {
    console.error(`\n⚠️ ${fail} échec(s) sur ${endpoints.length} endpoints.`);
    process.exit(1);
  }
})();

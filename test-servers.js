const http = require('http');

// Test du backend
console.log('🧪 Test du backend...');
const backendReq = http.get('http://localhost:4002/api/health', (res) => {
  console.log('✅ Backend fonctionne - Status:', res.statusCode);
  res.on('data', (chunk) => {
    console.log('📄 Réponse backend:', chunk.toString());
  });
}).on('error', (err) => {
  console.log('❌ Backend ne fonctionne pas:', err.message);
});

// Test du frontend
console.log('🧪 Test du frontend...');
const frontendReq = http.get('http://localhost:3000', (res) => {
  console.log('✅ Frontend fonctionne - Status:', res.statusCode);
  res.on('data', (chunk) => {
    console.log('📄 Réponse frontend (premiers 100 caractères):', chunk.toString().substring(0, 100));
  });
}).on('error', (err) => {
  console.log('❌ Frontend ne fonctionne pas:', err.message);
});

setTimeout(() => {
  console.log('🏁 Tests terminés');
  process.exit(0);
}, 3000);


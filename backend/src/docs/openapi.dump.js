const fs = require('fs');
const specs = require('./openapi-spec'); // votre objet OpenAPI 3.0 complet
fs.writeFileSync('backend/openapi.json', JSON.stringify(specs, null, 2));
console.log('OpenAPI dumped to backend/openapi.json');

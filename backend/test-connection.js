const { Pool } = require('pg');

new Pool({
  connectionString: 'postgres://postgres:akig2025@localhost:5432/postgres'
}).connect()
  .then(client => {
    console.log('✅ PostgreSQL connected');
    client.release();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection failed:', err.message);
    process.exit(1);
  });

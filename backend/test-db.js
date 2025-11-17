const pg = require('pg');

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/akig'
});

console.log('Connexion à la base de données...');

pool.query('SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = $1', ['public'], (err, res) => {
  if (err) {
    console.error('❌ Erreur DB:', err.message);
    process.exit(1);
  } else {
    console.log('✓ Tables publiques:', res.rows[0].count);
    
    // Lister les tables
    pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `, (err, res) => {
      if (err) {
        console.error('❌ Erreur listing:', err.message);
      } else {
        console.log('\n📋 Tables trouvées:');
        res.rows.forEach(row => console.log('  -', row.table_name));
      }
      pool.end();
    });
  }
});

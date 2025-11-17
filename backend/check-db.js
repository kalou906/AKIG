require('dotenv').config();
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});
(async () => {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    console.log('Tables in database:');
    res.rows.forEach(r => console.log(' -', r.table_name));
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();

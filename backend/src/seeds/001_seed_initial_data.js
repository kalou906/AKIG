/**
 * Database Seeder
 * Initializes database with sample data for development and testing
 */

const initializeDatabase = async (pool) => {
  try {
    console.log('🌱 Starting database seeding...');

    // ==================== AGENCIES ====================
    console.log('Seeding agencies...');
    await pool.query(`
      INSERT INTO agencies (name, country, email, phone, status) VALUES
      ('AKIG Guinea', 'GN', 'info@akig-gn.com', '+224-XXX-XXXX', 'active'),
      ('AKIG USA', 'US', 'info@akig-us.com', '+1-XXX-XXXX', 'active'),
      ('AKIG France', 'FR', 'info@akig-fr.com', '+33-XXX-XXXX', 'active'),
      ('AKIG Senegal', 'SN', 'info@akig-sn.com', '+221-XXX-XXXX', 'active')
      ON CONFLICT DO NOTHING
    `);

    // ==================== USERS ====================
    console.log('Seeding users...');
    const agencies = await pool.query('SELECT id, country FROM agencies LIMIT 4');
    
    for (const agency of agencies.rows) {
      await pool.query(`
        INSERT INTO users (agency_id, email, password_hash, name, role, status) VALUES
        ($1, $2, $3, $4, 'admin', 'active'),
        ($1, $5, $6, $7, 'agent', 'active'),
        ($1, $8, $9, $10, 'agent', 'active')
        ON CONFLICT DO NOTHING
      `, [
        agency.id,
        `admin-${agency.country.toLowerCase()}@akig.com`,
        'hash_placeholder',
        `Admin ${agency.country}`,
        `agent1-${agency.country.toLowerCase()}@akig.com`,
        'hash_placeholder',
        `Agent 1 ${agency.country}`,
        `agent2-${agency.country.toLowerCase()}@akig.com`,
        'hash_placeholder',
        `Agent 2 ${agency.country}`
      ]);
    }

    // ==================== PROPERTIES ====================
    console.log('Seeding properties...');
    const users = await pool.query('SELECT id, agency_id FROM users WHERE role = \'admin\' LIMIT 4');
    
    for (const user of users.rows) {
      await pool.query(`
        INSERT INTO properties (agency_id, address, city, country, postal_code, property_type, bedrooms, bathrooms, area, rent_amount, status) VALUES
        ($1, '123 Main Street', 'Conakry', 'GN', '1000', 'apartment', 2, 1, 85.5, 1500000, 'available'),
        ($1, '456 Oak Avenue', 'Conakry', 'GN', '1001', 'house', 3, 2, 120.0, 2000000, 'available'),
        ($1, '789 Pine Road', 'Kindia', 'GN', '1002', 'apartment', 1, 1, 50.0, 1000000, 'available')
        ON CONFLICT DO NOTHING
      `, [user.agency_id]);
    }

    // ==================== TENANTS ====================
    console.log('Seeding tenants...');
    const agencies2 = await pool.query('SELECT id FROM agencies LIMIT 2');
    
    for (const agency of agencies2.rows) {
      await pool.query(`
        INSERT INTO tenants (agency_id, name, email, phone, id_number, country, employment_status, income, credit_score, status) VALUES
        ($1, 'Jean Sow', 'jean@example.gn', '+224-XXXXXXX', 'ID-001', 'GN', 'employed', 3000000, 750, 'active'),
        ($1, 'Marie Fall', 'marie@example.gn', '+224-XXXXXXX', 'ID-002', 'GN', 'employed', 2500000, 720, 'active'),
        ($1, 'Ahmed Diallo', 'ahmed@example.gn', '+224-XXXXXXX', 'ID-003', 'GN', 'self-employed', 2000000, 680, 'active')
        ON CONFLICT DO NOTHING
      `, [agency.id]);
    }

    // ==================== LEASES ====================
    console.log('Seeding leases...');
    const properties = await pool.query('SELECT id, agency_id FROM properties LIMIT 3');
    const tenants = await pool.query('SELECT id FROM tenants LIMIT 3');
    const agents = await pool.query('SELECT id FROM users WHERE role = \'agent\' LIMIT 3');
    
    for (let i = 0; i < Math.min(properties.rows.length, tenants.rows.length); i++) {
      const prop = properties.rows[i];
      const tenant = tenants.rows[i];
      const agent = agents.rows[i];
      
      await pool.query(`
        INSERT INTO leases (property_id, tenant_id, agent_id, start_date, end_date, rent_amount, deposit_amount, status, country) VALUES
        ($1, $2, $3, NOW(), NOW() + INTERVAL '12 months', 1500000, 3000000, 'active', 'GN')
        ON CONFLICT DO NOTHING
      `, [prop.id, tenant.id, agent?.id || null]);
    }

    // ==================== PAYMENTS ====================
    console.log('Seeding payments...');
    const leases = await pool.query('SELECT id, tenant_id FROM leases LIMIT 5');
    
    for (const lease of leases.rows) {
      await pool.query(`
        INSERT INTO payments (lease_id, tenant_id, amount, currency, payment_date, due_date, status, payment_method) VALUES
        ($1, $2, 1500000, 'GNF', NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days', 'completed', 'bank_transfer'),
        ($1, $2, 1500000, 'GNF', NOW() - INTERVAL '35 days', NOW() - INTERVAL '40 days', 'completed', 'bank_transfer')
        ON CONFLICT DO NOTHING
      `, [lease.id, lease.tenant_id]);
    }

    // ==================== MAINTENANCE ====================
    console.log('Seeding maintenance requests...');
    const properties2 = await pool.query('SELECT id FROM properties LIMIT 3');
    const tenants2 = await pool.query('SELECT id FROM tenants LIMIT 3');
    
    for (let i = 0; i < Math.min(properties2.rows.length, 2); i++) {
      const prop = properties2.rows[i];
      const tenant = tenants2.rows[i % tenants2.rows.length];
      
      await pool.query(`
        INSERT INTO maintenance_requests (property_id, tenant_id, title, description, priority, status) VALUES
        ($1, $2, 'Fix leaky faucet', 'Kitchen faucet is leaking', 'medium', 'open'),
        ($1, $2, 'Paint bedroom', 'Bedroom walls need fresh paint', 'low', 'open')
        ON CONFLICT DO NOTHING
      `, [prop.id, tenant.id]);
    }

    // ==================== CURRENCY RATES ====================
    console.log('Seeding currency rates...');
    await pool.query(`
      INSERT INTO currency_rates (from_currency, to_currency, rate) VALUES
      ('USD', 'USD', 1.0),
      ('USD', 'EUR', 0.92),
      ('USD', 'GNF', 8650),
      ('USD', 'XOF', 607),
      ('EUR', 'USD', 1.087),
      ('EUR', 'EUR', 1.0),
      ('EUR', 'GNF', 9385),
      ('EUR', 'XOF', 659),
      ('GNF', 'USD', 0.00011565),
      ('GNF', 'EUR', 0.0001065),
      ('GNF', 'GNF', 1.0),
      ('GNF', 'XOF', 0.0702),
      ('XOF', 'USD', 0.001648),
      ('XOF', 'EUR', 0.001516),
      ('XOF', 'GNF', 14.25),
      ('XOF', 'XOF', 1.0)
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Database seeding completed successfully!');
    return { success: true, message: 'Database initialized with sample data' };
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
};

module.exports = { initializeDatabase };

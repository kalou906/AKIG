/**
 * RBAC System - Seed Script
 * Initializes default users with roles for AKIG platform
 * 
 * Usage: node db/seeders/rbac-seed.js
 */

const pool = require('../db'); // Assuming db connection pool is exported from db.js
const bcrypt = require('bcryptjs');

async function seedRBACSystem() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Seeding RBAC System...\n');
    
    // =========================================================================
    // 1. SEED TEST USERS
    // =========================================================================
    console.log('📝 Creating test users...');
    
    const users = [
      {
        full_name: 'Ahmed Diallo',
        email: 'pdg@akig.test',
        phone: '+224611111111',
        password: 'PDG@Akig2025',
        role_code: 'PDG'
      },
      {
        full_name: 'Fatou Bah',
        email: 'compta@akig.test',
        phone: '+224622222222',
        password: 'Compta@Akig2025',
        role_code: 'COMPTA'
      },
      {
        full_name: 'Mamadou Sow',
        email: 'agent@akig.test',
        phone: '+224633333333',
        password: 'Agent@Akig2025',
        role_code: 'AGENT'
      },
      {
        full_name: 'Aïssatou Kane',
        email: 'locataire@akig.test',
        phone: '+224644444444',
        password: 'Locataire@Akig2025',
        role_code: 'LOCATAIRE'
      },
      {
        full_name: 'Ousmane Traoré',
        email: 'proprietaire@akig.test',
        phone: '+224655555555',
        password: 'Proprio@Akig2025',
        role_code: 'PROPRIETAIRE'
      }
    ];
    
    const userMap = {};
    
    for (const userData of users) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const userResult = await client.query(
          `INSERT INTO users (full_name, email, phone, hashed_password, active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (email) DO UPDATE SET hashed_password = EXCLUDED.hashed_password
           RETURNING id, email`,
          [userData.full_name, userData.email, userData.phone, hashedPassword]
        );
        
        const userId = userResult.rows[0].id;
        userMap[userData.email] = userId;
        
        // Get role ID
        const roleResult = await client.query(
          'SELECT id FROM roles WHERE code = $1',
          [userData.role_code]
        );
        
        if (roleResult.rows.length > 0) {
          const roleId = roleResult.rows[0].id;
          
          // Assign role to user
          await client.query(
            `INSERT INTO user_roles (user_id, role_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, role_id) DO NOTHING`,
            [userId, roleId]
          );
          
          console.log(`  ✓ ${userData.full_name} (${userData.role_code})`);
          console.log(`    Email: ${userData.email}`);
          console.log(`    Password: ${userData.password}\n`);
        }
      } catch (err) {
        console.warn(`  ⚠ User ${userData.email} already exists or error: ${err.message}`);
      }
    }
    
    // =========================================================================
    // 2. LOG SEED OPERATION
    // =========================================================================
    console.log('📋 Logging seed operation...\n');
    
    await client.query(
      `INSERT INTO audit_log (action, action_type, target, status, description, meta)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'RBAC_SEEDING',
        'CREATE',
        'system:rbac',
        'SUCCESS',
        'RBAC system seeded with default users',
        JSON.stringify({
          users_created: Object.keys(userMap).length,
          timestamp: new Date().toISOString(),
          roles: ['PDG', 'COMPTA', 'AGENT', 'LOCATAIRE', 'PROPRIETAIRE']
        })
      ]
    );
    
    await client.query('COMMIT');
    
    console.log('✅ RBAC System seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • Users created: ${Object.keys(userMap).length}`);
    console.log(`   • Default roles assigned`);
    console.log(`   • Audit logged\n`);
    
    console.log('🔐 Test Credentials:');
    users.forEach(u => {
      console.log(`   ${u.role_code}: ${u.email} / ${u.password}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

// Run seeder
seedRBACSystem();

/**
 * Tests pour le module de profil utilisateur (Phase 7)
 * user_profile.test.js
 */

const request = require('supertest');
const app = require('../index');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Variables globales pour les tests
let token;
let userId;
let testUser = {
  email: 'profile.test@example.com',
  password: 'TestPassword123!',
  nom: 'Dupont',
  prenom: 'Jean'
};

/**
 * Setup: Créer l'utilisateur de test
 */
beforeAll(async () => {
  // Créer l'utilisateur de test
  const hashedPassword = await bcrypt.hash(testUser.password, 10);
  
  const result = await pool.query(
    `INSERT INTO users (email, nom, prenom, mot_de_passe, actif)
     VALUES ($1, $2, $3, $4, true)
     RETURNING id`,
    [testUser.email, testUser.nom, testUser.prenom, hashedPassword]
  );

  userId = result.rows[0].id;

  // Générer JWT
  token = jwt.sign(
    { id: userId, email: testUser.email },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '24h' }
  );
});

/**
 * Cleanup: Supprimer les données de test
 */
afterAll(async () => {
  try {
    await pool.query('DELETE FROM user_profiles WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM user_statistics WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  } catch (err) {
    console.error('Erreur cleanup:', err);
  }
  await pool.end();
});

// ============================================================================
// TESTS: GET /api/users/profile
// ============================================================================

describe('GET /api/users/profile - Récupérer le profil courant', () => {
  
  test('200 - Récupère le profil de l\'utilisateur authentifié', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('email', testUser.email);
  });

  test('401 - Rejette sans token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  test('401 - Rejette avec token invalide', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer invalid_token')
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

// ============================================================================
// TESTS: PATCH /api/users/profile
// ============================================================================

describe('PATCH /api/users/profile - Mettre à jour le profil', () => {
  
  test('200 - Met à jour les données du profil', async () => {
    const updateData = {
      nom: 'Martin',
      prenom: 'Pierre',
      telephone: '0612345678',
      adresse: '123 Rue de la Paix',
      code_postal: '75001',
      ville: 'Paris',
      profession: 'Ingénieur',
      entreprise: 'Tech Corp'
    };

    const res = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.nom).toBe('Martin');
    expect(res.body.data.telephone).toBe('0612345678');
  });

  test('400 - Rejette email invalide', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'invalid-email' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('400 - Rejette numéro de téléphone invalide', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ telephone: 'invalid-phone' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('400 - Rejette code postal invalide', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ code_postal: '123' }) // Too short
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('401 - Nécessite token', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .send({ nom: 'Test' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

// ============================================================================
// TESTS: POST /api/users/password/change
// ============================================================================

describe('POST /api/users/password/change - Changer le mot de passe', () => {
  
  test('200 - Change le mot de passe avec succès', async () => {
    const res = await request(app)
      .post('/api/users/password/change')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: testUser.password,
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!'
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('succès');
  });

  test('400 - Rejet: mot de passe actuel incorrect', async () => {
    const res = await request(app)
      .post('/api/users/password/change')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!'
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('400 - Rejet: confirmation ne correspond pas', async () => {
    const res = await request(app)
      .post('/api/users/password/change')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: testUser.password,
        newPassword: 'NewPassword456!',
        confirmPassword: 'DifferentPassword456!'
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('400 - Rejet: mot de passe trop court', async () => {
    const res = await request(app)
      .post('/api/users/password/change')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: testUser.password,
        newPassword: 'Short1!',
        confirmPassword: 'Short1!'
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('400 - Rejet: pas de majuscule', async () => {
    const res = await request(app)
      .post('/api/users/password/change')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: testUser.password,
        newPassword: 'newpassword123!',
        confirmPassword: 'newpassword123!'
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('400 - Rejet: pas de chiffre', async () => {
    const res = await request(app)
      .post('/api/users/password/change')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: testUser.password,
        newPassword: 'NewPasswordAbcd!',
        confirmPassword: 'NewPasswordAbcd!'
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('400 - Rejet: pas de caractère spécial', async () => {
    const res = await request(app)
      .post('/api/users/password/change')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: testUser.password,
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('401 - Nécessite token', async () => {
    const res = await request(app)
      .post('/api/users/password/change')
      .send({
        currentPassword: testUser.password,
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!'
      })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

// ============================================================================
// TESTS: PATCH /api/users/preferences
// ============================================================================

describe('PATCH /api/users/preferences - Mettre à jour les préférences', () => {
  
  test('200 - Met à jour les préférences utilisateur', async () => {
    const prefs = {
      langue: 'en',
      timezone: 'America/New_York',
      notifications_actives: false,
      theme: 'dark'
    };

    const res = await request(app)
      .patch('/api/users/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send(prefs)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.preferences.langue).toBe('en');
    expect(res.body.data.preferences.theme).toBe('dark');
  });

  test('400 - Rejette langue invalide', async () => {
    const res = await request(app)
      .patch('/api/users/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ langue: 'invalid-lang' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('401 - Nécessite token', async () => {
    const res = await request(app)
      .patch('/api/users/preferences')
      .send({ langue: 'en' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

// ============================================================================
// TESTS: GET /api/users/stats
// ============================================================================

describe('GET /api/users/stats - Obtenir les statistiques utilisateur', () => {
  
  test('200 - Récupère les statistiques', async () => {
    const res = await request(app)
      .get('/api/users/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('total_logins');
    expect(res.body.data).toHaveProperty('total_logouts');
    expect(res.body.data).toHaveProperty('total_sessions');
  });

  test('401 - Nécessite token', async () => {
    const res = await request(app)
      .get('/api/users/stats')
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

// ============================================================================
// TESTS: DELETE /api/users/account
// ============================================================================

describe('DELETE /api/users/account - Supprimer le compte', () => {
  
  test('400 - Rejette sans mot de passe', async () => {
    const res = await request(app)
      .delete('/api/users/account')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('400 - Rejette mot de passe incorrect', async () => {
    const res = await request(app)
      .delete('/api/users/account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'WrongPassword123!' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('401 - Nécessite token', async () => {
    const res = await request(app)
      .delete('/api/users/account')
      .send({ password: testUser.password })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

// ============================================================================
// TESTS: GET /api/users/:id (Admin)
// ============================================================================

describe('GET /api/users/:id - Récupérer profil utilisateur (Admin)', () => {
  
  test('200 - Récupère profil d\'autre utilisateur (admin)', async () => {
    // Note: À adapter selon la logique d'admin
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  test('404 - Utilisateur non trouvé', async () => {
    const res = await request(app)
      .get('/api/users/99999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  test('401 - Nécessite token', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

// ============================================================================
// TESTS: GET /api/users (Admin - Liste avec pagination)
// ============================================================================

describe('GET /api/users - Lister utilisateurs avec pagination (Admin)', () => {
  
  test('200 - Récupère liste des utilisateurs', async () => {
    const res = await request(app)
      .get('/api/users?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.data).toHaveProperty('pagination');
  });

  test('200 - Filtre par email', async () => {
    const res = await request(app)
      .get(`/api/users?email=${testUser.email}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.users.some(u => u.email === testUser.email)).toBe(true);
  });

  test('200 - Filtre par statut', async () => {
    const res = await request(app)
      .get('/api/users?statut=actif')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  test('400 - Page invalide', async () => {
    const res = await request(app)
      .get('/api/users?page=invalid')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('401 - Nécessite token', async () => {
    const res = await request(app)
      .get('/api/users')
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

// ============================================================================
// TESTS D'INTÉGRATION
// ============================================================================

describe('Tests d\'intégration - Flux complet', () => {
  
  test('Flux complet: créer → mettre à jour → changer mot de passe', async () => {
    // 1. Récupérer le profil
    let res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);

    // 2. Mettre à jour le profil
    res = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        telephone: '0625252525',
        ville: 'Lyon'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.data.telephone).toBe('0625252525');

    // 3. Vérifier la mise à jour
    res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.body.data.telephone).toBe('0625252525');
  });

  test('Flux: mettre à jour préférences → obtenir statistiques', async () => {
    // 1. Mettre à jour les préférences
    let res = await request(app)
      .patch('/api/users/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({
        langue: 'en',
        timezone: 'UTC'
      });
    
    expect(res.status).toBe(200);

    // 2. Obtenir les statistiques
    res = await request(app)
      .get('/api/users/stats')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ============================================================================
// TESTS DE SÉCURITÉ
// ============================================================================

describe('Tests de sécurité', () => {
  
  test('Injection SQL: protection contre le vol de données', async () => {
    const res = await request(app)
      .get('/api/users?email=test@test.com\' OR \'1\'=\'1')
      .set('Authorization', `Bearer ${token}`)
      .expect(400); // Doit rejeter

    expect(res.body.success).toBe(false);
  });

  test('XSS: validation des entrées HTML', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nom: '<script>alert("xss")</script>'
      })
      .expect(400); // Doit rejeter ou nettoyer

    // Le système doit rejeter ou nettoyer le XSS
  });

  test('CSRF: token JWT requis pour les mutations', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .send({ nom: 'Test' });

    expect(res.status).toBe(401);
  });

  test('Rate limiting: pas de test ici (à implémenter dans middleware)', async () => {
    // À implémenter selon la stratégie de rate limiting
    expect(true).toBe(true);
  });
});

// ============================================================================
// TESTS DE PERFORMANCE
// ============================================================================

describe('Tests de performance', () => {
  
  test('Récupérer le profil: < 100ms', async () => {
    const start = Date.now();
    
    await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  test('Lister 1000 utilisateurs: < 500ms', async () => {
    const start = Date.now();
    
    await request(app)
      .get('/api/users?page=1&limit=1000')
      .set('Authorization', `Bearer ${token}`);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
});

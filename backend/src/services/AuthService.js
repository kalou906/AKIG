/**
 * 🔑 Service Authentification
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AuthService {
  constructor(pool) {
    this.pool = pool;
    this.SECRET = process.env.JWT_SECRET || 'your-secret-key';
    this.TOKEN_EXPIRY = '24h';
  }

  /**
   * Register nouveau utilisateur
   */
  async register(data) {
    try {
      // Vérifier si email existe
      const existing = await this.pool.query('SELECT id FROM users WHERE email = $1', [data.email]);
      if (existing.rows.length > 0) {
        return { success: false, error: 'Email déjà utilisé' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Créer l'utilisateur
      const query = `
        INSERT INTO users (first_name, last_name, email, password, phone, role, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id, email, first_name, last_name, role
      `;

      const result = await this.pool.query(query, [
        data.firstName,
        data.lastName,
        data.email,
        hashedPassword,
        data.phone,
        data.role || 'tenant',
        'active'
      ]);

      const user = result.rows[0];
      const token = this.generateToken(user);

      return { success: true, user, token };
    } catch (error) {
      console.error('❌ Erreur registration:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Login utilisateur
   */
  async login(email, password) {
    try {
      const result = await this.pool.query('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
      
      if (result.rows.length === 0) {
        return { success: false, error: 'Email ou mot de passe incorrect' };
      }

      const user = result.rows[0];

      // Vérifier password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return { success: false, error: 'Email ou mot de passe incorrect' };
      }

      // Vérifier si actif
      if (user.status !== 'active') {
        return { success: false, error: 'Compte désactivé' };
      }

      const token = this.generateToken(user);

      return { 
        success: true, 
        user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
        token 
      };
    } catch (error) {
      console.error('❌ Erreur login:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Générer JWT token
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      },
      this.SECRET,
      { expiresIn: this.TOKEN_EXPIRY }
    );
  }

  /**
   * Verify token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.SECRET);
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh token
   */
  refreshToken(token) {
    const decoded = this.verifyToken(token);
    if (!decoded) {
      return null;
    }

    // Créer nouveau token
    return this.generateToken(decoded);
  }

  /**
   * Logout (invalider token côté serveur)
   */
  async logout(userId) {
    try {
      // Optionnellement, ajouter token à blacklist
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      const result = await this.pool.query('SELECT password FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) {
        return { success: false, error: 'Utilisateur non trouvé' };
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(oldPassword, user.password);
      
      if (!isValid) {
        return { success: false, error: 'Mot de passe actuel incorrect' };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

      return { success: true, message: 'Mot de passe changé avec succès' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = AuthService;

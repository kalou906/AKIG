/**
 * Service de Gestion des Profils Utilisateurs
 * 
 * Responsabilités:
 * - Gestion des informations de profil
 * - Changement de mot de passe sécurisé
 * - Gestion des préférences
 * - Vérification des permissions
 * - Audit des modifications
 */

const pool = require('../db');
const bcrypt = require('bcryptjs');
const validator = require('validator');

class UserService {
  /**
   * Récupérer profil utilisateur complet
   * 
   * @param {number} userId - ID utilisateur
   * @returns {Promise<object>} - Données profil
   */
  static async getUserProfile(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          u.id, u.email, u.nom, u.prenom, u.statut, u.created_at,
          up.telephone, up.adresse, up.code_postal, up.ville, up.pays,
          up.profession, up.entreprise, up.date_naissance,
          up.photo_url, up.bio, up.preferences,
          up.langue, up.timezone, up.notifications_actives,
          up.updated_at
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      return result.rows[0];
    } catch (error) {
      console.error('[UserService] Erreur récupération profil:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour informations profil
   * 
   * @param {number} userId - ID utilisateur
   * @param {object} updateData - Données à mettre à jour
   * @returns {Promise<object>} - Profil mis à jour
   */
  static async updateUserProfile(userId, updateData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validation des données
      if (updateData.email && !validator.isEmail(updateData.email)) {
        throw new Error('Email invalide');
      }

      if (updateData.telephone && !validator.isMobilePhone(updateData.telephone, 'fr-FR')) {
        throw new Error('Numéro de téléphone invalide');
      }

      if (updateData.code_postal && !validator.isPostalCode(updateData.code_postal, 'FR')) {
        throw new Error('Code postal invalide');
      }

      // Vérifier que l'email n'existe pas déjà
      if (updateData.email) {
        const emailCheck = await client.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [updateData.email, userId]
        );
        if (emailCheck.rows.length > 0) {
          throw new Error('Cet email est déjà utilisé');
        }
      }

      // 1. Mettre à jour infos utilisateur basiques
      const userUpdateFields = [];
      const userUpdateValues = [];
      let userPlaceholder = 1;

      if (updateData.email) {
        userUpdateFields.push(`email = $${userPlaceholder}`);
        userUpdateValues.push(updateData.email);
        userPlaceholder++;
      }

      if (updateData.nom) {
        userUpdateFields.push(`nom = $${userPlaceholder}`);
        userUpdateValues.push(updateData.nom);
        userPlaceholder++;
      }

      if (updateData.prenom) {
        userUpdateFields.push(`prenom = $${userPlaceholder}`);
        userUpdateValues.push(updateData.prenom);
        userPlaceholder++;
      }

      if (userUpdateFields.length > 0) {
        userUpdateValues.push(userId);
        await client.query(
          `UPDATE users SET ${userUpdateFields.join(', ')}, updated_at = NOW() WHERE id = $${userPlaceholder}`,
          userUpdateValues
        );
      }

      // 2. Mettre à jour profil détaillé (user_profiles)
      const profileData = {
        telephone: updateData.telephone,
        adresse: updateData.adresse,
        code_postal: updateData.code_postal,
        ville: updateData.ville,
        pays: updateData.pays || 'France',
        profession: updateData.profession,
        entreprise: updateData.entreprise,
        date_naissance: updateData.date_naissance,
        bio: updateData.bio,
        langue: updateData.langue || 'fr',
        timezone: updateData.timezone || 'Europe/Paris'
      };

      // Vérifier si le profil existe
      const profileCheck = await client.query(
        'SELECT id FROM user_profiles WHERE user_id = $1',
        [userId]
      );

      if (profileCheck.rows.length === 0) {
        // Créer nouveau profil
        await client.query(
          `INSERT INTO user_profiles (user_id, telephone, adresse, code_postal, ville, pays, 
           profession, entreprise, date_naissance, bio, langue, timezone, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
          [userId, profileData.telephone, profileData.adresse, profileData.code_postal,
           profileData.ville, profileData.pays, profileData.profession, profileData.entreprise,
           profileData.date_naissance, profileData.bio, profileData.langue, profileData.timezone]
        );
      } else {
        // Mettre à jour profil existant
        const profileUpdateFields = [];
        const profileUpdateValues = [];
        let profilePlaceholder = 1;

        Object.entries(profileData).forEach(([key, value]) => {
          if (value !== undefined) {
            profileUpdateFields.push(`${key} = $${profilePlaceholder}`);
            profileUpdateValues.push(value);
            profilePlaceholder++;
          }
        });

        if (profileUpdateFields.length > 0) {
          profileUpdateValues.push(userId);
          await client.query(
            `UPDATE user_profiles SET ${profileUpdateFields.join(', ')}, updated_at = NOW() 
             WHERE user_id = $${profilePlaceholder}`,
            profileUpdateValues
          );
        }
      }

      // 3. Créer audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'update_profile', 'user_profile', userId, JSON.stringify(updateData)]
      );

      await client.query('COMMIT');

      // Récupérer le profil mis à jour
      return await this.getUserProfile(userId);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[UserService] Erreur mise à jour profil:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Changer le mot de passe de l'utilisateur
   * 
   * @param {number} userId - ID utilisateur
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise<object>} - Résultat du changement
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validation du nouveau mot de passe
      if (newPassword.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }

      if (!/[A-Z]/.test(newPassword)) {
        throw new Error('Le mot de passe doit contenir au moins une majuscule');
      }

      if (!/[0-9]/.test(newPassword)) {
        throw new Error('Le mot de passe doit contenir au moins un chiffre');
      }

      if (!/[!@#$%^&*]/.test(newPassword)) {
        throw new Error('Le mot de passe doit contenir au moins un caractère spécial');
      }

      // Récupérer l'utilisateur avec son mot de passe
      const userResult = await client.query(
        'SELECT id, password_hash, email FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      const user = userResult.rows[0];

      // Vérifier le mot de passe actuel
      const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!passwordMatch) {
        // Log tentative échouée
        await client.query(
          `INSERT INTO security_logs (user_id, event_type, event_details, severity)
           VALUES ($1, $2, $3, $4)`,
          [userId, 'failed_password_change', JSON.stringify({ reason: 'invalid_current_password' }), 'warning']
        );

        throw new Error('Mot de passe actuel incorrect');
      }

      // Vérifier que le nouveau mot de passe est différent
      const newPasswordMatch = await bcrypt.compare(newPassword, user.password_hash);
      if (newPasswordMatch) {
        throw new Error('Le nouveau mot de passe doit être différent de l\'ancien');
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Mettre à jour le mot de passe
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, userId]
      );

      // Log changement réussi
      await client.query(
        `INSERT INTO security_logs (user_id, event_type, event_details, severity)
         VALUES ($1, $2, $3, $4)`,
        [userId, 'password_changed', JSON.stringify({ timestamp: new Date().toISOString() }), 'info']
      );

      // Log audit
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'change_password', 'user_password', userId, JSON.stringify({ changed_at: new Date().toISOString() })]
      );

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Mot de passe changé avec succès',
        data: {
          user_id: userId,
          changed_at: new Date().toISOString()
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[UserService] Erreur changement mot de passe:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mettre à jour les préférences utilisateur
   * 
   * @param {number} userId - ID utilisateur
   * @param {object} preferences - Préférences à mettre à jour
   * @returns {Promise<object>} - Préférences mises à jour
   */
  static async updatePreferences(userId, preferences) {
    try {
      const preferenceData = {
        langue: preferences.langue || 'fr',
        timezone: preferences.timezone || 'Europe/Paris',
        notifications_actives: preferences.notifications_actives !== false,
        theme: preferences.theme || 'light',
        email_notifications: preferences.email_notifications !== false,
        sms_notifications: preferences.sms_notifications === true
      };

      // Stocker en JSON dans la table user_profiles
      const result = await pool.query(
        `UPDATE user_profiles 
         SET preferences = $1, langue = $2, timezone = $3, notifications_actives = $4, updated_at = NOW()
         WHERE user_id = $5
         RETURNING preferences, langue, timezone, notifications_actives`,
        [
          JSON.stringify(preferenceData),
          preferenceData.langue,
          preferenceData.timezone,
          preferenceData.notifications_actives,
          userId
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Profil utilisateur non trouvé');
      }

      // Log audit
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'update_preferences', 'user_preferences', userId, JSON.stringify(preferences)]
      );

      return result.rows[0];
    } catch (error) {
      console.error('[UserService] Erreur mise à jour préférences:', error);
      throw error;
    }
  }

  /**
   * Récupérer statistiques utilisateur
   * 
   * @param {number} userId - ID utilisateur
   * @returns {Promise<object>} - Statistiques
   */
  static async getUserStats(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(CASE WHEN action = 'login' THEN 1 END) as total_logins,
          COUNT(CASE WHEN action = 'logout' THEN 1 END) as total_logouts,
          COUNT(CASE WHEN event_type = 'password_changed' THEN 1 END) as password_changes,
          MAX(al.created_at) as last_activity,
          COUNT(DISTINCT DATE(al.created_at)) as active_days,
          COUNT(us.id) as total_sessions
        FROM audit_logs al
        LEFT JOIN user_sessions us ON al.user_id = us.user_id
        WHERE al.user_id = $1
        GROUP BY al.user_id`,
        [userId]
      );

      return result.rows.length > 0 ? result.rows[0] : {
        total_logins: 0,
        total_logouts: 0,
        password_changes: 0,
        last_activity: null,
        active_days: 0,
        total_sessions: 0
      };
    } catch (error) {
      console.error('[UserService] Erreur statistiques:', error);
      throw error;
    }
  }

  /**
   * Supprimer un compte utilisateur (soft delete)
   * 
   * @param {number} userId - ID utilisateur
   * @param {string} password - Mot de passe de confirmation
   * @returns {Promise<object>} - Résultat suppression
   */
  static async deleteUserAccount(userId, password) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Récupérer l'utilisateur
      const userResult = await client.query(
        'SELECT id, password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier le mot de passe
      const passwordMatch = await bcrypt.compare(password, userResult.rows[0].password_hash);
      if (!passwordMatch) {
        throw new Error('Mot de passe incorrect');
      }

      // Soft delete - marquer comme supprimé
      await client.query(
        'UPDATE users SET statut = $1, updated_at = NOW() WHERE id = $2',
        ['supprime', userId]
      );

      // Archiver le profil
      await client.query(
        'UPDATE user_profiles SET actif = false, updated_at = NOW() WHERE user_id = $1',
        [userId]
      );

      // Invalider toutes les sessions
      await client.query(
        'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
        [userId]
      );

      // Invalider tous les tokens
      await client.query(
        'INSERT INTO token_blacklist (user_id, revoked_at, reason) VALUES ($1, NOW(), $2)',
        [userId, 'account_deleted']
      );

      // Log audit
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'delete_account', 'user', userId, JSON.stringify({ deleted_at: new Date().toISOString() })]
      );

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Compte supprimé avec succès',
        data: {
          user_id: userId,
          deleted_at: new Date().toISOString()
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[UserService] Erreur suppression compte:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Lister les utilisateurs (admin)
   * 
   * @param {object} filters - Filtres (page, limit, statut, etc)
   * @returns {Promise<object>} - Liste utilisateurs
   */
  static async listUsers(filters = {}) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      let query = `
        SELECT u.id, u.email, u.nom, u.prenom, u.statut, u.created_at,
               up.profession, up.entreprise, COUNT(us.id) as sessions_actives
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN user_sessions us ON u.id = us.user_id AND us.is_active = true
        WHERE 1=1
      `;

      const params = [];

      if (filters.statut) {
        query += ` AND u.statut = $${params.length + 1}`;
        params.push(filters.statut);
      }

      if (filters.search) {
        query += ` AND (u.email ILIKE $${params.length + 1} OR u.nom ILIKE $${params.length + 1} OR u.prenom ILIKE $${params.length + 1})`;
        params.push(`%${filters.search}%`);
      }

      query += ` GROUP BY u.id, up.id ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Compter total
      let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
      const countParams = [];

      if (filters.statut) {
        countQuery += ` AND statut = $${countParams.length + 1}`;
        countParams.push(filters.statut);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      return {
        users: result.rows,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('[UserService] Erreur listage utilisateurs:', error);
      throw error;
    }
  }
}

module.exports = UserService;

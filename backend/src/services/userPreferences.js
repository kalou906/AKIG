/**
 * Service de gestion des préférences utilisateur
 */

const { trace } = require('@opentelemetry/api');

const tracer = trace.getTracer('akig-user-preferences');

/**
 * Récupère les préférences d'un utilisateur
 * @param {Object} pool - Pool de connexion PostgreSQL
 * @param {number} userId - ID de l'utilisateur
 * @returns {Object} Préférences utilisateur
 */
async function getPreferences(pool, userId) {
  const span = tracer.startSpan('getPreferences');
  try {
    span.setAttributes({
      'user.id': userId,
    });

    const result = await pool.query(
      `SELECT 
        user_id, locale, theme, notif_channel,
        notif_email, notif_sms, notif_push,
        notif_frequency, widgets, saved_filters,
        created_at, updated_at
      FROM user_preferences 
      WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Créer les préférences par défaut si elles n'existent pas
      return await createDefaultPreferences(pool, userId);
    }

    const preferences = result.rows[0];
    span.setAttributes({
      'preferences.theme': preferences.theme,
      'preferences.locale': preferences.locale,
    });

    return preferences;
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Crée les préférences par défaut pour un nouvel utilisateur
 * @param {Object} pool - Pool de connexion PostgreSQL
 * @param {number} userId - ID de l'utilisateur
 * @returns {Object} Préférences par défaut créées
 */
async function createDefaultPreferences(pool, userId) {
  const span = tracer.startSpan('createDefaultPreferences');
  try {
    span.setAttributes({ 'user.id': userId });

    const defaultPreferences = {
      user_id: userId,
      locale: 'fr',
      theme: 'light',
      notif_channel: 'email',
      notif_email: true,
      notif_sms: false,
      notif_push: false,
      notif_frequency: 'immediate',
      widgets: [],
      saved_filters: {},
    };

    const result = await pool.query(
      `INSERT INTO user_preferences 
        (user_id, locale, theme, notif_channel, notif_email, notif_sms, 
         notif_push, notif_frequency, widgets, saved_filters)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        userId,
        defaultPreferences.locale,
        defaultPreferences.theme,
        defaultPreferences.notif_channel,
        defaultPreferences.notif_email,
        defaultPreferences.notif_sms,
        defaultPreferences.notif_push,
        defaultPreferences.notif_frequency,
        JSON.stringify(defaultPreferences.widgets),
        JSON.stringify(defaultPreferences.saved_filters),
      ]
    );

    span.addEvent('default_preferences_created', {
      'user.id': userId,
    });

    return result.rows[0];
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Met à jour les préférences d'un utilisateur
 * @param {Object} pool - Pool de connexion PostgreSQL
 * @param {number} userId - ID de l'utilisateur
 * @param {Object} updates - Champs à mettre à jour
 * @returns {Object} Préférences mises à jour
 */
async function updatePreferences(pool, userId, updates) {
  const span = tracer.startSpan('updatePreferences');
  try {
    span.setAttributes({
      'user.id': userId,
      'update.fields': Object.keys(updates).length,
    });

    // Valider les updates
    validatePreferenceUpdates(updates);

    // Construire la requête dynamique
    const allowedFields = [
      'locale',
      'theme',
      'notif_channel',
      'notif_email',
      'notif_sms',
      'notif_push',
      'notif_frequency',
      'widgets',
      'saved_filters',
    ];

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        
        // Convertir en JSON si nécessaire
        if (['widgets', 'saved_filters'].includes(key)) {
          updateValues.push(JSON.stringify(value));
        } else {
          updateValues.push(value);
        }
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      span.addEvent('no_fields_to_update');
      return await getPreferences(pool, userId);
    }

    updateValues.push(userId);

    const query = `
      UPDATE user_preferences 
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, updateValues);

    if (result.rows.length === 0) {
      throw new Error(`Préférences non trouvées pour l'utilisateur ${userId}`);
    }

    span.setAttributes({
      'preferences.updated_fields': Object.keys(updates).join(','),
    });

    span.addEvent('preferences_updated', {
      'user.id': userId,
      'updated_fields': Object.keys(updates).length,
    });

    return result.rows[0];
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Met à jour les widgets du dashboard
 * @param {Object} pool - Pool de connexion PostgreSQL
 * @param {number} userId - ID de l'utilisateur
 * @param {Array} widgets - Configuration des widgets
 * @returns {Array} Widgets mis à jour
 */
async function updateWidgets(pool, userId, widgets) {
  const span = tracer.startSpan('updateWidgets');
  try {
    span.setAttributes({
      'user.id': userId,
      'widgets.count': widgets.length,
    });

    // Valider les widgets
    if (!Array.isArray(widgets)) {
      throw new Error('Les widgets doivent être un array');
    }

    widgets.forEach((widget, index) => {
      if (!widget.id || !widget.type) {
        throw new Error(`Widget ${index} invalide: id et type requis`);
      }
    });

    const result = await pool.query(
      `UPDATE user_preferences 
       SET widgets = $1
       WHERE user_id = $2
       RETURNING widgets`,
      [JSON.stringify(widgets), userId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Préférences non trouvées pour l'utilisateur ${userId}`);
    }

    span.addEvent('widgets_updated', {
      'widgets.count': widgets.length,
    });

    return result.rows[0].widgets;
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Ajoute ou met à jour un filtre sauvegardé
 * @param {Object} pool - Pool de connexion PostgreSQL
 * @param {number} userId - ID de l'utilisateur
 * @param {string} filterName - Nom du filtre
 * @param {Object} filterConfig - Configuration du filtre
 * @returns {Object} Filtres mis à jour
 */
async function saveFilter(pool, userId, filterName, filterConfig) {
  const span = tracer.startSpan('saveFilter');
  try {
    span.setAttributes({
      'user.id': userId,
      'filter.name': filterName,
    });

    // Récupérer les filtres actuels
    const result = await pool.query(
      'SELECT saved_filters FROM user_preferences WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Préférences non trouvées pour l'utilisateur ${userId}`);
    }

    const savedFilters = result.rows[0].saved_filters || {};

    // Ajouter/mettre à jour le filtre
    savedFilters[filterName] = {
      config: filterConfig,
      created_at: savedFilters[filterName]?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updateResult = await pool.query(
      `UPDATE user_preferences 
       SET saved_filters = $1
       WHERE user_id = $2
       RETURNING saved_filters`,
      [JSON.stringify(savedFilters), userId]
    );

    span.addEvent('filter_saved', {
      'filter.name': filterName,
    });

    return updateResult.rows[0].saved_filters;
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Supprime un filtre sauvegardé
 * @param {Object} pool - Pool de connexion PostgreSQL
 * @param {number} userId - ID de l'utilisateur
 * @param {string} filterName - Nom du filtre
 * @returns {Object} Filtres restants
 */
async function deleteFilter(pool, userId, filterName) {
  const span = tracer.startSpan('deleteFilter');
  try {
    span.setAttributes({
      'user.id': userId,
      'filter.name': filterName,
    });

    const result = await pool.query(
      'SELECT saved_filters FROM user_preferences WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Préférences non trouvées pour l'utilisateur ${userId}`);
    }

    const savedFilters = result.rows[0].saved_filters || {};

    if (!savedFilters[filterName]) {
      throw new Error(`Filtre "${filterName}" non trouvé`);
    }

    delete savedFilters[filterName];

    const updateResult = await pool.query(
      `UPDATE user_preferences 
       SET saved_filters = $1
       WHERE user_id = $2
       RETURNING saved_filters`,
      [JSON.stringify(savedFilters), userId]
    );

    span.addEvent('filter_deleted', {
      'filter.name': filterName,
    });

    return updateResult.rows[0].saved_filters;
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Valide les updates de préférences
 * @param {Object} updates - Updates à valider
 * @throws {Error} Si validation échoue
 */
function validatePreferenceUpdates(updates) {
  const span = tracer.startSpan('validatePreferenceUpdates');
  try {
    // Valider locale
    if (updates.locale !== undefined) {
      const validLocales = ['fr', 'en', 'es'];
      if (!validLocales.includes(updates.locale)) {
        throw new Error(`Locale invalide: ${updates.locale}. Valeurs: ${validLocales.join(', ')}`);
      }
    }

    // Valider theme
    if (updates.theme !== undefined) {
      const validThemes = ['light', 'dark', 'auto'];
      if (!validThemes.includes(updates.theme)) {
        throw new Error(`Thème invalide: ${updates.theme}. Valeurs: ${validThemes.join(', ')}`);
      }
    }

    // Valider notif_channel
    if (updates.notif_channel !== undefined) {
      const validChannels = ['email', 'sms', 'push', 'none'];
      if (!validChannels.includes(updates.notif_channel)) {
        throw new Error(`Canal invalide: ${updates.notif_channel}. Valeurs: ${validChannels.join(', ')}`);
      }
    }

    // Valider notif_frequency
    if (updates.notif_frequency !== undefined) {
      const validFrequencies = ['immediate', 'daily', 'weekly', 'never'];
      if (!validFrequencies.includes(updates.notif_frequency)) {
        throw new Error(`Fréquence invalide: ${updates.notif_frequency}. Valeurs: ${validFrequencies.join(', ')}`);
      }
    }

    // Valider booléens
    ['notif_email', 'notif_sms', 'notif_push'].forEach(field => {
      if (updates[field] !== undefined && typeof updates[field] !== 'boolean') {
        throw new Error(`${field} doit être un booléen`);
      }
    });

    span.setStatus({ code: 0 });
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

module.exports = {
  getPreferences,
  createDefaultPreferences,
  updatePreferences,
  updateWidgets,
  saveFilter,
  deleteFilter,
};

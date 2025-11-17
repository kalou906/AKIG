/**
 * Key Rotation Job
 * Effectue la rotation des clés de chiffrement avec zéro downtime
 * Supporte le déchiffrement avec l'ancienne clé et le rechiffrement avec la nouvelle
 */

const { trace } = require('@opentelemetry/api');
const logger = require('../services/logger');
const crypto = require('../services/crypto.multi');

const tracer = trace.getTracer('key-rotation');

// Configuration des colonnes chiffrées par table
const ENCRYPTED_COLUMNS = {
  users: ['phone_number', 'ssn', 'tax_id'],
  contracts: ['lease_terms', 'notes'],
  payments: ['payment_method', 'bank_details'],
  invoices: ['notes'],
};

const BATCH_SIZE = 100; // Traiter par lots pour éviter surcharge mémoire
const RETRY_ATTEMPTS = 3;

/**
 * Rotationne les clés pour une table spécifique
 * @param {Pool} pool - Connection PostgreSQL
 * @param {string} tableName - Nom de la table
 * @param {Array<string>} columnNames - Colonnes à rotation
 * @param {string} oldKeyHex - Ancienne clé en hex
 * @param {string} newKeyHex - Nouvelle clé en hex
 * @param {Object} options - Options {dryRun, batchSize}
 * @returns {Promise<Object>} Résultats de la rotation
 */
async function rotateTable(
  pool,
  tableName,
  columnNames,
  oldKeyHex,
  newKeyHex,
  options = {}
) {
  const span = tracer.startSpan('rotation.rotateTable', {
    attributes: {
      'rotation.table': tableName,
      'rotation.columns': columnNames.length,
      'rotation.dry_run': options.dryRun || false,
    },
  });

  const results = {
    table: tableName,
    columns: columnNames,
    total_rows: 0,
    successful_rows: 0,
    failed_rows: 0,
    errors: [],
    duration_ms: 0,
  };

  const startTime = Date.now();

  try {
    // Valider les entrées
    if (!tableName || !columnNames.length) {
      throw new Error('tableName et columnNames sont requis');
    }

    if (!oldKeyHex || !newKeyHex) {
      throw new Error('oldKeyHex et newKeyHex sont requis');
    }

    // Vérifier que les colonnes existent
    const { rows: tableInfo } = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [tableName]
    );

    const validColumns = tableInfo.map((r) => r.column_name);
    const invalidColumns = columnNames.filter((col) => !validColumns.includes(col));

    if (invalidColumns.length > 0) {
      throw new Error(`Colonnes invalides: ${invalidColumns.join(', ')}`);
    }

    // Compter les lignes
    const { rows: countResult } = await pool.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const totalRows = parseInt(countResult[0].count);
    results.total_rows = totalRows;

    logger.info('Starting key rotation', {
      table: tableName,
      columns: columnNames,
      total_rows: totalRows,
      batch_size: options.batchSize || BATCH_SIZE,
    });

    span.addEvent('rotation_started', {
      'rotation.total_rows': totalRows,
    });

    // Traiter par lots
    const batchSize = options.batchSize || BATCH_SIZE;
    const batches = Math.ceil(totalRows / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const offset = batch * batchSize;

      // Récupérer les lignes du lot
      const { rows } = await pool.query(
        `SELECT id, ${columnNames.join(', ')} FROM ${tableName} ORDER BY id LIMIT $1 OFFSET $2`,
        [batchSize, offset]
      );

      logger.debug(`Processing batch ${batch + 1}/${batches}`, {
        table: tableName,
        batch_offset: offset,
        batch_size: rows.length,
      });

      // Traiter chaque ligne
      for (const row of rows) {
        try {
          const updateValues = [];
          let hasChanges = false;

          // Déchiffrer/Rechiffrer chaque colonne
          for (const col of columnNames) {
            const value = row[col];

            if (!value) {
              updateValues.push(null);
              continue;
            }

            try {
              // Déchiffrer avec l'ancienne clé
              const plaintext = crypto.decryptWithKey(value, oldKeyHex);

              // Rechiffrer avec la nouvelle clé
              const reencrypted = crypto.encryptWithKey(plaintext, newKeyHex);

              updateValues.push(reencrypted);
              hasChanges = true;
            } catch (colError) {
              logger.error('Error rotating column', {
                table: tableName,
                row_id: row.id,
                column: col,
                error: colError.message,
              });

              results.errors.push({
                row_id: row.id,
                column: col,
                error: colError.message,
              });

              results.failed_rows++;
              throw colError;
            }
          }

          // Mettre à jour si dry-run désactivé et si des changements
          if (!options.dryRun && hasChanges) {
            const setClauses = columnNames
              .map((col, idx) => `${col} = $${idx + 1}`)
              .join(', ');

            await pool.query(
              `UPDATE ${tableName} SET ${setClauses} WHERE id = $${columnNames.length + 1}`,
              [...updateValues, row.id]
            );
          }

          results.successful_rows++;
        } catch (rowError) {
          logger.error('Error processing row', {
            table: tableName,
            row_id: row.id,
            error: rowError.message,
          });

          results.failed_rows++;

          // Continuer sur les autres lignes
        }
      }
    }

    results.duration_ms = Date.now() - startTime;

    span.addEvent('rotation_completed', {
      'rotation.successful_rows': results.successful_rows,
      'rotation.failed_rows': results.failed_rows,
      'rotation.duration_ms': results.duration_ms,
    });

    logger.info('Key rotation completed', {
      table: tableName,
      successful: results.successful_rows,
      failed: results.failed_rows,
      duration_ms: results.duration_ms,
    });

    return results;
  } catch (error) {
    results.duration_ms = Date.now() - startTime;

    logger.error('Key rotation failed', {
      table: tableName,
      error: error.message,
      duration_ms: results.duration_ms,
    });

    span.recordException(error);
    results.errors.push({
      phase: 'initialization',
      error: error.message,
    });

    throw error;
  } finally {
    span.end();
  }
}

/**
 * Rotationne toutes les clés pour toutes les tables
 * @param {Pool} pool - Connection PostgreSQL
 * @param {string} oldKeyHex - Ancienne clé
 * @param {string} newKeyHex - Nouvelle clé
 * @param {Object} options - Options {tables, dryRun, parallel}
 * @returns {Promise<Object>} Résultats consolidés
 */
async function rotateAllKeys(
  pool,
  oldKeyHex,
  newKeyHex,
  options = {}
) {
  const span = tracer.startSpan('rotation.rotateAllKeys', {
    attributes: {
      'rotation.dry_run': options.dryRun || false,
      'rotation.parallel': options.parallel || false,
    },
  });

  const results = {
    started_at: new Date().toISOString(),
    tables: [],
    total_rows_processed: 0,
    total_rows_failed: 0,
    duration_ms: 0,
  };

  const startTime = Date.now();

  try {
    // Déterminer les tables à rotationner
    const tablesToRotate = options.tables || Object.keys(ENCRYPTED_COLUMNS);

    logger.info('Starting comprehensive key rotation', {
      tables: tablesToRotate,
      dry_run: options.dryRun,
      parallel: options.parallel,
    });

    // Vérifier que la nouvelle clé est différente
    if (oldKeyHex === newKeyHex) {
      throw new Error('Les clés ancienne et nouvelle doivent être différentes');
    }

    // Créer une transaction pour chaque table ou tout ensemble si atomic
    if (options.atomic) {
      await pool.query('BEGIN');
    }

    // Rotationner chaque table
    const rotationPromises = tablesToRotate.map((table) => {
      const columns = options.columnsOverride?.[table] || ENCRYPTED_COLUMNS[table] || [];

      if (!columns.length) {
        logger.warn(`No encrypted columns defined for table: ${table}`);
        return Promise.resolve({
          table,
          total_rows: 0,
          successful_rows: 0,
          failed_rows: 0,
        });
      }

      return rotateTable(
        pool,
        table,
        columns,
        oldKeyHex,
        newKeyHex,
        {
          ...options,
          skipTransaction: true, // Transactions gérées ici
        }
      );
    });

    const tableResults = options.parallel
      ? await Promise.allSettled(rotationPromises)
      : await Promise.all(rotationPromises.map((p) => p.catch((e) => ({ error: e }))));

    // Traiter les résultats
    for (const result of tableResults) {
      if (result.status === 'rejected' || result.error) {
        results.tables.push({
          table: result.value?.table,
          error: result.reason?.message || result.error?.message,
          status: 'failed',
        });
      } else {
        results.tables.push({
          table: result.value.table,
          total_rows: result.value.total_rows,
          successful_rows: result.value.successful_rows,
          failed_rows: result.value.failed_rows,
          status: result.value.failed_rows === 0 ? 'success' : 'partial',
        });

        results.total_rows_processed += result.value.successful_rows;
        results.total_rows_failed += result.value.failed_rows;
      }
    }

    // Commit si atomique et pas d'erreur
    if (options.atomic && results.total_rows_failed === 0) {
      await pool.query('COMMIT');
      logger.info('Key rotation committed');
    } else if (options.atomic) {
      await pool.query('ROLLBACK');
      logger.warn('Key rotation rolled back due to errors');
    }

    results.duration_ms = Date.now() - startTime;
    results.completed_at = new Date().toISOString();
    results.status =
      results.total_rows_failed === 0 ? 'success' : 'partial_failure';

    span.addEvent('rotation_all_completed', {
      'rotation.status': results.status,
      'rotation.total_processed': results.total_rows_processed,
      'rotation.total_failed': results.total_rows_failed,
    });

    logger.info('Comprehensive key rotation completed', {
      status: results.status,
      processed: results.total_rows_processed,
      failed: results.total_rows_failed,
      duration_ms: results.duration_ms,
    });

    return results;
  } catch (error) {
    results.duration_ms = Date.now() - startTime;
    results.status = 'failed';
    results.error = error.message;
    results.completed_at = new Date().toISOString();

    logger.error('Comprehensive key rotation failed', {
      error: error.message,
      duration_ms: results.duration_ms,
    });

    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Planifie une rotation de clés
 * @param {Pool} pool - Connection PostgreSQL
 * @param {Object} rotation - Infos rotation
 * @returns {Promise<Object>} Rotation planifiée
 */
async function scheduleKeyRotation(pool, rotation) {
  const span = tracer.startSpan('rotation.scheduleKeyRotation');

  try {
    // Créer enregistrement de rotation
    const { rows } = await pool.query(
      `INSERT INTO key_rotations (
        old_key_fingerprint,
        new_key_fingerprint,
        rotation_type,
        status,
        scheduled_at,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        rotation.oldKeyFingerprint,
        rotation.newKeyFingerprint,
        rotation.type || 'scheduled',
        'pending',
        rotation.scheduledAt || new Date(),
        rotation.createdBy,
      ]
    );

    logger.info('Key rotation scheduled', {
      rotation_id: rows[0].id,
      scheduled_at: rows[0].scheduled_at,
    });

    span.addEvent('rotation_scheduled', {
      'rotation.id': rows[0].id,
    });

    return rows[0];
  } catch (error) {
    logger.error('Error scheduling key rotation', { error: error.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Récupère l'historique des rotations
 * @param {Pool} pool - Connection PostgreSQL
 * @param {number} limit - Limite de résultats
 * @returns {Promise<Array>} Historique des rotations
 */
async function getRotationHistory(pool, limit = 100) {
  const span = tracer.startSpan('rotation.getRotationHistory');

  try {
    const { rows } = await pool.query(
      `SELECT * FROM key_rotations ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );

    span.addEvent('history_retrieved', {
      'history.count': rows.length,
    });

    return rows;
  } catch (error) {
    logger.error('Error fetching rotation history', { error: error.message });
    span.recordException(error);
    return [];
  } finally {
    span.end();
  }
}

/**
 * Valide une rotation avant de l'exécuter
 * @param {Pool} pool - Connection PostgreSQL
 * @param {string} oldKeyHex - Ancienne clé
 * @param {string} newKeyHex - Nouvelle clé
 * @returns {Promise<Object>} Rapport de validation
 */
async function validateRotation(pool, oldKeyHex, newKeyHex) {
  const span = tracer.startSpan('rotation.validateRotation');

  const validation = {
    old_key_valid: false,
    new_key_valid: false,
    can_decrypt_sample: false,
    can_encrypt_new_key: false,
    checks_passed: 0,
    checks_failed: 0,
    errors: [],
  };

  try {
    // Vérifier la format des clés
    if (!oldKeyHex || oldKeyHex.length !== 64) {
      validation.errors.push('Old key must be 64 hex characters (256 bits)');
      validation.checks_failed++;
    } else {
      validation.old_key_valid = true;
      validation.checks_passed++;
    }

    if (!newKeyHex || newKeyHex.length !== 64) {
      validation.errors.push('New key must be 64 hex characters (256 bits)');
      validation.checks_failed++;
    } else {
      validation.new_key_valid = true;
      validation.checks_passed++;
    }

    // Test déchiffrement/chiffrement
    if (validation.old_key_valid && validation.new_key_valid) {
      try {
        const testData = 'test-data-' + Date.now();
        const encrypted = crypto.encryptWithKey(testData, oldKeyHex);
        const decrypted = crypto.decryptWithKey(encrypted, oldKeyHex);

        if (decrypted === testData) {
          validation.can_decrypt_sample = true;
          validation.checks_passed++;
        }
      } catch (e) {
        validation.errors.push(`Cannot decrypt with old key: ${e.message}`);
        validation.checks_failed++;
      }

      try {
        const testData = 'test-data-new-' + Date.now();
        const encrypted = crypto.encryptWithKey(testData, newKeyHex);
        const decrypted = crypto.decryptWithKey(encrypted, newKeyHex);

        if (decrypted === testData) {
          validation.can_encrypt_new_key = true;
          validation.checks_passed++;
        }
      } catch (e) {
        validation.errors.push(`Cannot encrypt with new key: ${e.message}`);
        validation.checks_failed++;
      }
    }

    validation.ready = validation.checks_failed === 0;

    logger.info('Key rotation validation completed', {
      ready: validation.ready,
      checks_passed: validation.checks_passed,
      checks_failed: validation.checks_failed,
    });

    span.setAttributes({
      'validation.ready': validation.ready,
      'validation.passed': validation.checks_passed,
      'validation.failed': validation.checks_failed,
    });

    return validation;
  } catch (error) {
    logger.error('Error validating rotation', { error: error.message });
    span.recordException(error);
    validation.errors.push(`Validation error: ${error.message}`);
    validation.checks_failed++;
    return validation;
  } finally {
    span.end();
  }
}

module.exports = {
  rotateTable,
  rotateAllKeys,
  scheduleKeyRotation,
  getRotationHistory,
  validateRotation,
  ENCRYPTED_COLUMNS,
  BATCH_SIZE,
};

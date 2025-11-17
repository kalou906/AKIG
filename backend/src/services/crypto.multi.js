/**
 * Cryptographic Service - Multi-key Management
 * Gère le chiffrement/déchiffrement avec rotation de clés
 * Supporte AES-256-GCM avec authentification
 */

const crypto = require('crypto');
const { trace } = require('@opentelemetry/api');
const logger = require('./logger');

const tracer = trace.getTracer('crypto-service');

// Configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_SIZE = 32; // 256 bits
const IV_SIZE = 16;  // 128 bits
const TAG_SIZE = 16; // 128 bits
const SALT_SIZE = 16;

/**
 * Génère une clé cryptographique aléatoire
 * @param {number} size - Taille de la clé (défaut: 32 bytes = 256 bits)
 * @returns {string} Clé en hex
 */
function generateKey(size = KEY_SIZE) {
  const span = tracer.startSpan('crypto.generateKey');

  try {
    const key = crypto.randomBytes(size);
    span.setAttributes({
      'crypto.key_size': size,
      'crypto.algorithm': ALGORITHM,
    });
    return key.toString('hex');
  } catch (error) {
    logger.error('Error generating key', { error: error.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Dérive une clé à partir d'un mot de passe
 * @param {string} password - Mot de passe
 * @param {string} salt - Salt (optionnel, généré si absent)
 * @returns {Object} {key, salt}
 */
function deriveKeyFromPassword(password, salt = null) {
  const span = tracer.startSpan('crypto.deriveKeyFromPassword');

  try {
    // Générer ou utiliser le salt fourni
    const saltBuffer = salt 
      ? Buffer.from(salt, 'hex')
      : crypto.randomBytes(SALT_SIZE);

    // Dériver la clé avec PBKDF2
    const key = crypto.pbkdf2Sync(
      password,
      saltBuffer,
      100000, // iterations
      KEY_SIZE,
      'sha256'
    );

    span.setAttributes({
      'crypto.key_derivation': 'pbkdf2',
      'crypto.iterations': 100000,
    });

    return {
      key: key.toString('hex'),
      salt: saltBuffer.toString('hex'),
    };
  } catch (error) {
    logger.error('Error deriving key from password', { error: error.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Chiffre du texte avec une clé spécifique
 * @param {string} plaintext - Texte à chiffrer
 * @param {string} keyHex - Clé en hexadécimal
 * @param {Object} options - Options {aad, metadata}
 * @returns {string} Données chiffrées en base64 (IV|TAG|CIPHERTEXT)
 */
function encryptWithKey(plaintext, keyHex, options = {}) {
  const span = tracer.startSpan('crypto.encryptWithKey');

  try {
    // Validation
    if (!plaintext || typeof plaintext !== 'string') {
      throw new Error('plaintext doit être une chaîne non-vide');
    }
    if (!keyHex || typeof keyHex !== 'string') {
      throw new Error('keyHex doit être une chaîne non-vide');
    }

    // Convertir la clé
    const key = Buffer.from(keyHex, 'hex');
    if (key.length !== KEY_SIZE) {
      throw new Error(`La clé doit faire exactement ${KEY_SIZE} bytes`);
    }

    // Générer IV aléatoire
    const iv = crypto.randomBytes(IV_SIZE);

    // Créer le cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Ajouter des données authentifiées additionnelles si présentes
    if (options.aad) {
      cipher.setAAD(Buffer.from(options.aad, 'utf8'), { plaintextLength: plaintext.length });
    }

    // Chiffrer
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    // Obtenir le tag d'authentification
    const tag = cipher.getAuthTag();

    // Combiner: IV | TAG | CIPHERTEXT
    const result = Buffer.concat([iv, tag, encrypted]);

    span.setAttributes({
      'crypto.algorithm': ALGORITHM,
      'crypto.plaintext_length': plaintext.length,
      'crypto.ciphertext_length': result.length,
      'crypto.with_aad': !!options.aad,
    });

    logger.debug('Encryption successful', {
      plaintext_length: plaintext.length,
      ciphertext_length: result.length,
    });

    return result.toString('base64');
  } catch (error) {
    logger.error('Error encrypting data', { error: error.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Déchiffre du texte avec une clé spécifique
 * @param {string} ciphertextBase64 - Données chiffrées en base64
 * @param {string} keyHex - Clé en hexadécimal
 * @param {Object} options - Options {aad}
 * @returns {string} Texte déchiffré
 */
function decryptWithKey(ciphertextBase64, keyHex, options = {}) {
  const span = tracer.startSpan('crypto.decryptWithKey');

  try {
    // Validation
    if (!ciphertextBase64 || typeof ciphertextBase64 !== 'string') {
      throw new Error('ciphertextBase64 doit être une chaîne non-vide');
    }
    if (!keyHex || typeof keyHex !== 'string') {
      throw new Error('keyHex doit être une chaîne non-vide');
    }

    // Convertir la clé
    const key = Buffer.from(keyHex, 'hex');
    if (key.length !== KEY_SIZE) {
      throw new Error(`La clé doit faire exactement ${KEY_SIZE} bytes`);
    }

    // Décoder le base64
    const ciphertext = Buffer.from(ciphertextBase64, 'base64');

    // Vérifier la longueur minimale
    const minLength = IV_SIZE + TAG_SIZE;
    if (ciphertext.length < minLength) {
      throw new Error(`Ciphertext trop court (min: ${minLength} bytes)`);
    }

    // Extraire: IV | TAG | ENCRYPTED
    const iv = ciphertext.slice(0, IV_SIZE);
    const tag = ciphertext.slice(IV_SIZE, IV_SIZE + TAG_SIZE);
    const encrypted = ciphertext.slice(IV_SIZE + TAG_SIZE);

    // Créer le decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // Ajouter les données authentifiées additionnelles si présentes
    if (options.aad) {
      decipher.setAAD(Buffer.from(options.aad, 'utf8'));
    }

    // Définir le tag d'authentification
    decipher.setAuthTag(tag);

    // Déchiffrer
    const plaintext = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');

    span.setAttributes({
      'crypto.algorithm': ALGORITHM,
      'crypto.ciphertext_length': ciphertext.length,
      'crypto.plaintext_length': plaintext.length,
      'crypto.with_aad': !!options.aad,
    });

    logger.debug('Decryption successful', {
      ciphertext_length: ciphertext.length,
      plaintext_length: plaintext.length,
    });

    return plaintext;
  } catch (error) {
    logger.error('Error decrypting data', { error: error.message });
    span.recordException(error);
    throw new Error('Déchiffrement échoué - données corrompues ou clé invalide');
  } finally {
    span.end();
  }
}

/**
 * Chiffre un objet JSON
 * @param {Object} obj - Objet à chiffrer
 * @param {string} keyHex - Clé en hexadécimal
 * @returns {string} Objet chiffré en base64
 */
function encryptObject(obj, keyHex) {
  const span = tracer.startSpan('crypto.encryptObject');

  try {
    const json = JSON.stringify(obj);
    const encrypted = encryptWithKey(json, keyHex, {
      aad: 'json-object',
    });
    span.addEvent('object_encrypted');
    return encrypted;
  } catch (error) {
    logger.error('Error encrypting object', { error: error.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Déchiffre un objet JSON
 * @param {string} encryptedBase64 - Objet chiffré en base64
 * @param {string} keyHex - Clé en hexadécimal
 * @returns {Object} Objet déchiffré
 */
function decryptObject(encryptedBase64, keyHex) {
  const span = tracer.startSpan('crypto.decryptObject');

  try {
    const json = decryptWithKey(encryptedBase64, keyHex, {
      aad: 'json-object',
    });
    const obj = JSON.parse(json);
    span.addEvent('object_decrypted');
    return obj;
  } catch (error) {
    logger.error('Error decrypting object', { error: error.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Génère une signature HMAC-SHA256
 * @param {string} data - Données à signer
 * @param {string} keyHex - Clé en hexadécimal
 * @returns {string} Signature en hex
 */
function generateSignature(data, keyHex) {
  const span = tracer.startSpan('crypto.generateSignature');

  try {
    const key = Buffer.from(keyHex, 'hex');
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(data);
    const signature = hmac.digest('hex');

    span.setAttributes({
      'crypto.signature_algorithm': 'hmac-sha256',
      'crypto.data_length': data.length,
    });

    return signature;
  } catch (error) {
    logger.error('Error generating signature', { error: error.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Vérifie une signature HMAC-SHA256
 * @param {string} data - Données
 * @param {string} signature - Signature en hex
 * @param {string} keyHex - Clé en hexadécimal
 * @returns {boolean} Signature valide
 */
function verifySignature(data, signature, keyHex) {
  const span = tracer.startSpan('crypto.verifySignature');

  try {
    const expected = generateSignature(data, keyHex);
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );

    span.setAttributes({
      'crypto.signature_valid': isValid,
    });

    return isValid;
  } catch (error) {
    logger.debug('Signature verification failed', { error: error.message });
    span.recordException(error);
    return false;
  } finally {
    span.end();
  }
}

/**
 * Hache du texte avec SHA256
 * @param {string} text - Texte à hacher
 * @returns {string} Hash en hex
 */
function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Hache avec salt (bcrypt-like)
 * @param {string} text - Texte à hacher
 * @param {string} salt - Salt (optionnel, généré si absent)
 * @returns {Object} {hash, salt}
 */
function hashWithSalt(text, salt = null) {
  const span = tracer.startSpan('crypto.hashWithSalt');

  try {
    const saltBuffer = salt 
      ? Buffer.from(salt, 'hex')
      : crypto.randomBytes(SALT_SIZE);

    const combined = Buffer.concat([
      Buffer.from(text, 'utf8'),
      saltBuffer,
    ]);

    const hashed = crypto.createHash('sha256').update(combined).digest('hex');

    span.addEvent('hash_with_salt_computed');

    return {
      hash: hashed,
      salt: saltBuffer.toString('hex'),
    };
  } catch (error) {
    logger.error('Error hashing with salt', { error: error.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Vérifie un hash avec salt
 * @param {string} text - Texte à vérifier
 * @param {string} hash - Hash attendu
 * @param {string} salt - Salt utilisé
 * @returns {boolean} Hash valide
 */
function verifyHashWithSalt(text, hash, salt) {
  try {
    const { hash: computed } = hashWithSalt(text, salt);
    return crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(hash, 'hex')
    );
  } catch (error) {
    logger.debug('Hash verification failed', { error: error.message });
    return false;
  }
}

/**
 * Génère un token aléatoire sécurisé
 * @param {number} length - Longueur en bytes (défaut: 32)
 * @returns {string} Token en hex
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Génère une clé de session temporaire
 * @param {number} ttlSeconds - TTL en secondes (défaut: 3600)
 * @returns {Object} {key, token, expiresAt}
 */
function generateSessionKey(ttlSeconds = 3600) {
  const span = tracer.startSpan('crypto.generateSessionKey');

  try {
    const key = generateKey();
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    span.setAttributes({
      'session.ttl_seconds': ttlSeconds,
    });

    return {
      key,
      token,
      expiresAt,
    };
  } catch (error) {
    logger.error('Error generating session key', { error: error.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Génère une paire de clés RSA 4096-bit
 * @returns {Object} {publicKey, privateKey}
 */
function generateKeyPair() {
  const span = tracer.startSpan('crypto.generateKeyPair');

  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    span.addEvent('rsa_keypair_generated');

    return { publicKey, privateKey };
  } catch (error) {
    logger.error('Error generating key pair', { error: error.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

module.exports = {
  // Key generation
  generateKey,
  deriveKeyFromPassword,
  generateKeyPair,
  generateSecureToken,
  generateSessionKey,

  // Encryption/Decryption
  encryptWithKey,
  decryptWithKey,
  encryptObject,
  decryptObject,

  // Signatures
  generateSignature,
  verifySignature,

  // Hashing
  hash,
  hashWithSalt,
  verifyHashWithSalt,

  // Constants
  ALGORITHM,
  KEY_SIZE,
  IV_SIZE,
  TAG_SIZE,
  SALT_SIZE,
};

/**
 * Système de cache en mémoire simple
 * backend/src/utils/cache.js
 */

class Cache {
  constructor() {
    this.store = new Map();
  }

  /**
   * Récupère une valeur du cache
   */
  get(key) {
    const item = this.store.get(key);

    if (!item) return null;

    // Vérifie l'expiration
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Stocke une valeur dans le cache
   */
  set(key, value, ttlSeconds = 300) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;

    this.store.set(key, {
      value,
      expiresAt,
    });
  }

  /**
   * Vérifie l'existence d'une clé
   */
  has(key) {
    const item = this.store.get(key);
    if (!item) return false;

    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Supprime une clé
   */
  delete(key) {
    this.store.delete(key);
  }

  /**
   * Vide le cache
   */
  clear() {
    this.store.clear();
  }

  /**
   * Récupère ou définit une valeur (pattern get-or-set)
   */
  async getOrSet(key, fn, ttlSeconds = 300) {
    const cached = this.get(key);
    if (cached !== null) return cached;

    const value = await fn();
    this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Invalide un groupe de clés (pattern avec wildcards)
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Retourne des stats sur le cache
   */
  getStats() {
    let totalSize = 0;
    let expiredCount = 0;

    for (const item of this.store.values()) {
      totalSize += JSON.stringify(item.value).length;

      if (item.expiresAt && item.expiresAt < Date.now()) {
        expiredCount++;
      }
    }

    return {
      itemCount: this.store.size,
      expiredCount,
      approximateSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    };
  }
}

// Instance globale du cache
const cache = new Cache();

/**
 * Middleware pour cacher les réponses GET
 */
function cacheMiddleware(ttlSeconds = 300) {
  return (req, res, next) => {
    // Ne cache que les GET
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `route:${req.path}:${JSON.stringify(req.query)}`;

    // Vérifie le cache
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Intercepte res.json pour cacher la réponse
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      res.set('X-Cache', 'MISS');
      cache.set(cacheKey, body, ttlSeconds);
      return originalJson(body);
    };

    next();
  };
}

/**
 * Décorateur pour cacher les résultats de fonction
 */
function cacheable(ttlSeconds = 300) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      // Génère une clé unique basée sur la fonction et les arguments
      const cacheKey = `fn:${propertyKey}:${JSON.stringify(args)}`;

      return cache.getOrSet(cacheKey, () => originalMethod.apply(this, args), ttlSeconds);
    };

    return descriptor;
  };
}

module.exports = {
  Cache,
  cache,
  cacheMiddleware,
  cacheable,
};

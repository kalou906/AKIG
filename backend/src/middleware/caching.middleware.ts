/**
 * Middleware de Caching HTTP - AKIG
 * Cache automatique pour réduire les appels BD
 * 
 * Utilisation:
 * app.get('/api/impayes', cacheMiddleware(10 * 60), controller)
 */

import { Request, Response, NextFunction } from 'express';
import CacheService, { CACHE_KEYS } from '../services/cache.service';

/**
 * Middleware de cache générique
 * @param ttl Durée de vie du cache en secondes
 */
export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Ne cacher que les GET
    if (req.method !== 'GET') {
      return next();
    }

    // Créer une clé de cache unique basée sur URL + params
    const cacheKey = `http:${req.user?.id || 'anon'}:${req.originalUrl}`;

    try {
      // Vérifier le cache
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }
    } catch (error) {
      console.error('Cache lookup error:', error);
      // Continuer même si erreur cache
    }

    // Intercepter res.json() pour cacher la réponse
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      if (res.statusCode === 200) {
        CacheService.set(cacheKey, data, ttl).catch((err) => {
          console.error('Cache set error:', err);
        });
        res.set('X-Cache', 'MISS');
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Middleware pour invalider le cache après modifications
 * Utilisation: app.post('/api/impaye', invalidateCacheMiddleware(), controller)
 */
export const invalidateCacheMiddleware = (...patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Invalider après la réponse
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach((pattern) => {
          CacheService.invalidatePattern(pattern).catch((err) => {
            console.error('Cache invalidation error:', err);
          });
        });
      }
    });

    next();
  };
};

/**
 * Middleware pour invalider cache spécifique
 * Utilisation: app.put('/api/site/:id', invalidateSpecificCache(['site_stats:*', 'impayes:site:*']), controller)
 */
export const invalidateSpecificCache = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach((pattern) => {
          const expandedPattern = pattern.replace(':id', req.params.id || '*');
          CacheService.invalidatePattern(expandedPattern).catch(console.error);
        });
      }
    });
    next();
  };
};

/**
 * Middleware pour cache avec validation d'authentification
 */
export const cacheWithAuth = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' || !req.user) {
      return next();
    }

    const cacheKey = `auth:${req.user.id}:${req.originalUrl}`;

    try {
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }
    } catch (error) {
      console.error('Cache lookup error:', error);
    }

    const originalJson = res.json.bind(res);
    res.json = function (data) {
      if (res.statusCode === 200) {
        CacheService.set(cacheKey, data, ttl).catch(console.error);
        res.set('X-Cache', 'MISS');
      }
      return originalJson(data);
    };

    next();
  };
};

export default cacheMiddleware;

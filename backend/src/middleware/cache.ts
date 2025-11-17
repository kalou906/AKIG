import { Request, Response, NextFunction } from 'express';
const cache = require('../utils/redisCache');

export const cacheMiddleware = (options: { ttl: number }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    const key = `cache:${req.originalUrl}`;
    const cached = await cache.get(key);
    if (cached) {
      res.locals.cached = true;
      return res.status(200).json(JSON.parse(cached));
    }
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      cache.set(key, body, options.ttl);
      return originalJson(body);
    };
    next();
  };
};

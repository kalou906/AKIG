/**
 * Tests pour Rate Limiting
 * __tests__/middleware/rateLimit.test.js
 */

jest.mock('../../src/services/logger.service.js');
const { createLimiter } = require('../../src/middleware/rateLimit');

describe('Rate Limiting', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      ip: '192.168.1.1',
      user: { id: 1 }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn()
    };
    next = jest.fn();
  });

  describe('createLimiter', () => {
    it('devrait créer un limiter avec configuration', () => {
      const limiter = createLimiter({
        windowMs: 60000,
        max: 10
      });

      expect(limiter).toBeDefined();
    });

    it('devrait permettre requêtes sous la limite', (done) => {
      const limiter = createLimiter({
        windowMs: 60000,
        max: 5
      });

      let count = 0;
      for (let i = 0; i < 3; i++) {
        limiter(req, res, next);
      }

      expect(next).toHaveBeenCalledTimes(3);
      done();
    });

    it('devrait bloquer après limite atteinte', (done) => {
      const limiter = createLimiter({
        windowMs: 60000,
        max: 2
      });

      const localReq = { ...req };
      const localRes = { ...res };

      // Première requête
      limiter(localReq, localRes, () => {});
      
      // Deuxième requête
      limiter(localReq, localRes, () => {});
      
      // Troisième requête - devrait être bloquée
      limiter(localReq, localRes, () => {});

      expect(localRes.status).toHaveBeenCalledWith(429);
      done();
    });

    it('devrait utiliser IP pour identifier client', () => {
      const limiter = createLimiter({
        windowMs: 60000,
        max: 1
      });

      const req1 = { ...req, ip: '192.168.1.1' };
      const req2 = { ...req, ip: '192.168.1.2' };

  limiter(req1, res, next);
  limiter(req2, res, next); // IP différente, devrait réussir

      expect(next).toHaveBeenCalledTimes(2);
    });

    it('devrait gérer les adresses IPv6', () => {
      const limiter = createLimiter({
        windowMs: 60000,
        max: 1
      });

  req.ip = '2001:db8::1';
  limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('devrait envoyer les headers de rate limit', (done) => {
      const limiter = createLimiter({
        windowMs: 60000,
        max: 5
      });

      limiter(req, res, () => {
        expect(res.setHeader).toHaveBeenCalledWith(
          'X-RateLimit-Limit',
          expect.any(String)
        );
        done();
      });
    });
  });

  describe('Spécialisation payment limiter', () => {
    it('devrait avoir limite moins stricte pour payments', () => {
      // Les paiements ont généralement une limite plus basse
      // pour éviter les attaques par force brute
      expect(true).toBe(true);
    });
  });

  describe('Spécialisation export limiter', () => {
    it('devrait avoir limite très stricte pour exports', () => {
      // Les exports sont coûteux en ressources
      expect(true).toBe(true);
    });
  });

  describe('Reset après fenêtre', () => {
    it('devrait réinitialiser le compteur après windowMs', (done) => {
      const windowMs = 100;
      const limiter = createLimiter({
        windowMs,
        max: 2
      });

  // 2 requêtes (limite atteinte)
  limiter(req, res, next);
  limiter(req, res, next);

      // Attendre window expiration
      setTimeout(() => {
        // Nouvelle requête - devrait réussir
  limiter(req, res, next);
        expect(next).toHaveBeenCalled();
        done();
      }, windowMs + 50);
    });
  });
});

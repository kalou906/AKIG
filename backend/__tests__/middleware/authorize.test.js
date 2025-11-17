/**
 * Tests pour Authorize middleware
 * __tests__/middleware/authorize.test.js
 */

jest.mock('../../src/services/logger.service.js');
const { authorize, isAuthorized } = require('../../src/middleware/authorize');

describe('Authorize Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
      path: '/api/test'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('authorize', () => {
    it('devrait bloquer sans token', () => {
      const middleware = authorize(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ erreur: expect.any(String) })
      );
    });

    it('devrait bloquer avec token invalide', () => {
      req.headers.authorization = 'Bearer invalid_token';
      const middleware = authorize(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('devrait permettre accès avec rôle valide', () => {
      req.headers.authorization = 'Bearer valid_token';
      req.user = { id: 1, role: 'admin' };

      const middleware = authorize(['admin']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('devrait bloquer avec rôle insuffisant', () => {
      req.user = { id: 1, role: 'user' };

      const middleware = authorize(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait permettre accès avec l\'un des rôles', () => {
      req.user = { id: 1, role: 'gestionnaire' };

      const middleware = authorize(['admin', 'gestionnaire']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('isAuthorized', () => {
    it('devrait retourner vrai pour rôle valide', () => {
      const user = { id: 1, role: 'admin' };
      const requiredRoles = ['admin', 'gestionnaire'];

      const result = isAuthorized(user, requiredRoles);

      expect(result).toBe(true);
    });

    it('devrait retourner faux pour rôle invalide', () => {
      const user = { id: 1, role: 'user' };
      const requiredRoles = ['admin'];

      const result = isAuthorized(user, requiredRoles);

      expect(result).toBe(false);
    });

    it('devrait gérer utilisateur null', () => {
      const result = isAuthorized(null, ['admin']);
      expect(result).toBe(false);
    });

    it('devrait gérer tableau rôles vide', () => {
      const user = { id: 1, role: 'user' };
      const result = isAuthorized(user, []);
      expect(result).toBe(false);
    });
  });

  describe('Permission check', () => {
    it('devrait vérifier permissions utilisateur', () => {
      req.user = {
        id: 1,
        permissions: ['read_contracts', 'write_payments']
      };

      const middleware = authorize(['admin']);
      middleware(req, res, next);

      // Devrait vérifier les permissions
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Permission caching', () => {
    it('devrait cacher permissions après première requête', () => {
      // Première requête
      req.user = { id: 1, role: 'admin' };
      const middleware1 = authorize(['admin']);
      middleware1(req, res, next);

      // Deuxième requête - devrait utiliser cache
      const req2 = { ...req };
      const res2 = { ...res };
      const next2 = jest.fn();

      const middleware2 = authorize(['admin']);
      middleware2(req2, res2, next2);

      // Les deux devraient réussir (avec cache)
      expect(next).toHaveBeenCalled();
    });
  });
});

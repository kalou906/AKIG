/**
 * Tests pour CacheService
 * __tests__/services/cache.service.test.js
 */

jest.mock('../../src/services/logger.service.js');
const CacheService = require('../../src/services/cache.service');

describe('CacheService', () => {
  describe('get/set', () => {
    it('devrait stocker et récupérer une valeur', async () => {
      const key = 'test:key:1';
      const value = { id: 1, nom: 'Test' };

      await CacheService.set(key, value, 300);
      const result = await CacheService.get(key);

      expect(result).toEqual(value);
    });

    it('devrait retourner null pour clé inexistante', async () => {
      const result = await CacheService.get('nonexistent:key');
      expect(result).toBeNull();
    });

    it('devrait stocker avec TTL', async () => {
      const key = 'ttl:test:1';
      const value = 'expiring-value';

      await CacheService.set(key, value, 1);
      await new Promise(r => setTimeout(r, 1100));

      const result = await CacheService.get(key);
      expect(result).toBeNull();
    });

    it('devrait gérer différents types de données', async () => {
      const testCases = [
        { key: 'string:1', value: 'string value' },
        { key: 'number:1', value: 42 },
        { key: 'boolean:1', value: true },
        { key: 'array:1', value: [1, 2, 3] },
        { key: 'object:1', value: { nested: { data: 'test' } } }
      ];

      for (const { key, value } of testCases) {
        await CacheService.set(key, value, 300);
        const result = await CacheService.get(key);
        expect(result).toEqual(value);
      }
    });
  });

  describe('delete', () => {
    it('devrait supprimer une clé', async () => {
      const key = 'delete:test:1';
      await CacheService.set(key, 'value', 300);
      
      await CacheService.delete(key);
      const result = await CacheService.get(key);
      
      expect(result).toBeNull();
    });

    it('devrait ne pas lever d\'erreur si clé n\'existe pas', async () => {
      expect(async () => {
        await CacheService.delete('nonexistent:key');
      }).not.toThrow();
    });
  });

  describe('invalidatePattern', () => {
    it('devrait invalider toutes les clés matchant un pattern', async () => {
      // Sauvegarder plusieurs clés
      await CacheService.set('user:1:data', { id: 1 }, 300);
      await CacheService.set('user:2:data', { id: 2 }, 300);
      await CacheService.set('user:1:permissions', ['read'], 300);
      await CacheService.set('other:data', 'value', 300);

      // Invalider pattern
      await CacheService.invalidatePattern('user:*:data');

      // Vérifier
      expect(await CacheService.get('user:1:data')).toBeNull();
      expect(await CacheService.get('user:2:data')).toBeNull();
      expect(await CacheService.get('user:1:permissions')).toEqual(['read']);
      expect(await CacheService.get('other:data')).toEqual('value');
    });
  });

  describe('flush', () => {
    it('devrait vider tout le cache', async () => {
      await CacheService.set('key1', 'value1', 300);
      await CacheService.set('key2', 'value2', 300);
      
      await CacheService.flush();
      
      expect(await CacheService.get('key1')).toBeNull();
      expect(await CacheService.get('key2')).toBeNull();
    });
  });

  describe('Permission cache', () => {
    it('devrait cacher les permissions utilisateur', async () => {
      const userId = 123;
      const permissions = ['read_contracts', 'write_payments'];

      await CacheService.setPermissions(userId, permissions);
      const result = await CacheService.getPermissions(userId);

      expect(result).toEqual(permissions);
    });

    it('devrait invalider permissions après changement', async () => {
      const userId = 456;
      
      await CacheService.setPermissions(userId, ['read']);
      await CacheService.invalidatePermissions(userId);
      
      const result = await CacheService.getPermissions(userId);
      expect(result).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('devrait gérer les erreurs de connexion Redis', async () => {
      // Mock Redis error
      const originalGet = CacheService.get;
      CacheService.get = jest.fn().mockRejectedValue(new Error('Redis connection failed'));

      const result = await CacheService.get('any:key');
      
      expect(result).toBeNull();
      CacheService.get = originalGet;
    });
  });
});

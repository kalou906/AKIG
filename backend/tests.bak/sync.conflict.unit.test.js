// backend/tests/sync.conflict.unit.test.js
const { resolveConflict, detectChanges, mergeVersions, isClean } = require('../src/services/sync');

describe('resolveConflict', () => {
  test('signale conflit non résolu si champs critiques divergent', () => {
    const res = resolveConflict({ rent: 100 }, { rent: 120 }, ['rent']);
    expect(res.status).toBe('conflict');
  });

  test('inclut les champs en conflit dans la réponse', () => {
    const res = resolveConflict({ rent: 100, tenant: 'Alice' }, { rent: 120, tenant: 'Bob' }, ['rent', 'tenant']);
    expect(res.conflictingFields).toContain('rent');
    expect(res.conflictingFields).toContain('tenant');
  });

  test('résout les conflits si champs critiques sont identiques', () => {
    const res = resolveConflict({ rent: 100, address: 'Old' }, { rent: 100, address: 'New' }, ['rent']);
    expect(res.status).toBe('resolved');
    expect(res.data.address).toBe('New');
  });

  test('fusionne les objets correctement lors de résolution', () => {
    const local = { id: 1, name: 'Alice', email: 'alice@old.com' };
    const remote = { id: 1, name: 'Alice', email: 'alice@new.com', phone: '123456' };
    const res = resolveConflict(local, remote, ['id', 'name']);
    
    expect(res.status).toBe('resolved');
    expect(res.data.email).toBe('alice@new.com');
    expect(res.data.phone).toBe('123456');
  });

  test('retourne erreur si objets manquants', () => {
    const res = resolveConflict(null, { rent: 120 });
    expect(res.status).toBe('error');
  });
});

describe('detectChanges', () => {
  test('détecte les champs modifiés', () => {
    const changes = detectChanges({ a: 1, b: 2 }, { a: 1, b: 3 });
    expect(changes).toContain('b');
    expect(changes).not.toContain('a');
  });

  test('détecte les nouveaux champs ajoutés', () => {
    const changes = detectChanges({ a: 1 }, { a: 1, b: 2 });
    expect(changes).toContain('b');
  });

  test('détecte les champs supprimés', () => {
    const changes = detectChanges({ a: 1, b: 2 }, { a: 1 });
    expect(changes).toContain('b');
  });

  test('retourne tableau vide si pas de changements', () => {
    const changes = detectChanges({ a: 1, b: 2 }, { a: 1, b: 2 });
    expect(changes).toEqual([]);
  });
});

describe('mergeVersions', () => {
  test('stratégie latest retourne dernière version', () => {
    const versions = [{ id: 1, name: 'v1' }, { id: 1, name: 'v2' }];
    const result = mergeVersions(versions, 'latest');
    expect(result.name).toBe('v2');
  });

  test('stratégie merge fusionne tous les champs', () => {
    const versions = [
      { id: 1, name: 'Alice' },
      { id: 1, email: 'alice@example.com' },
      { id: 1, phone: '123' }
    ];
    const result = mergeVersions(versions, 'merge');
    expect(result.name).toBe('Alice');
    expect(result.email).toBe('alice@example.com');
    expect(result.phone).toBe('123');
  });

  test('fusion par défaut utilise stratégie merge', () => {
    const versions = [
      { a: 1 },
      { b: 2 }
    ];
    const result = mergeVersions(versions);
    expect(result.a).toBe(1);
    expect(result.b).toBe(2);
  });
});

describe('isClean', () => {
  test('détecte les champs sensibles (password)', () => {
    const obj = { name: 'Alice', password: 'secret123' };
    expect(isClean(obj)).toBe(false);
  });

  test('détecte les champs sensibles (token)', () => {
    const obj = { name: 'Alice', token: 'xyz123' };
    expect(isClean(obj)).toBe(false);
  });

  test('accepte objet sans données sensibles', () => {
    const obj = { name: 'Alice', email: 'alice@example.com' };
    expect(isClean(obj)).toBe(true);
  });

  test('accepte objet vide', () => {
    expect(isClean({})).toBe(true);
  });

  test('accepte null', () => {
    expect(isClean(null)).toBe(true);
  });

  test('utilise champs sensibles personnalisés', () => {
    const obj = { name: 'Alice', apiKey: 'secret' };
    expect(isClean(obj, ['apiKey'])).toBe(false);
  });
});

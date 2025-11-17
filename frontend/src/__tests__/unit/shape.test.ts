import { ensureItems, ensureNumber, ensureStats } from '../../utils/shape';

describe('shape utils', () => {
  test('ensureItems avec null', () => {
    expect(ensureItems(null)).toEqual({ items: [] });
  });
  test('ensureItems avec tableau direct', () => {
    expect(ensureItems([1,2])).toEqual({ items: [1,2] });
  });
  test('ensureItems avec objet items', () => {
    expect(ensureItems({ items: ['a'] })).toEqual({ items: ['a'] });
  });
  test('ensureNumber fallback', () => {
    expect(ensureNumber('abc', 5)).toBe(5);
  });
  test('ensureNumber valide', () => {
    expect(ensureNumber('42')).toBe(42);
  });
  test('ensureStats', () => {
    expect(ensureStats({ stats: [1] })).toEqual({ stats: [1] });
  });
});
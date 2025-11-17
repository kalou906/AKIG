import { withRetry } from '../../api/httpRetry';

describe('withRetry', () => {
  test('réussit sans retry', async () => {
    const res = await withRetry(async () => 7, 0);
    expect(res).toBe(7);
  });
  test('réessaie en cas d’erreur', async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2) throw new Error('fail');
      return 'ok';
    };
    const res = await withRetry(fn, 2, 10);
    expect(res).toBe('ok');
    expect(calls).toBe(2);
  });
});
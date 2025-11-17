import { ISolvencyCache } from './interfaces';
import { SolvencyScore } from '../../types/solvency';
const cache = require('../../utils/redisCache');

export class SolvencyCache implements ISolvencyCache {
  async get(key: string): Promise<SolvencyScore | null> {
    return (await cache.get(key)) as SolvencyScore | null;
  }
  async set(key: string, value: SolvencyScore, ttl: number): Promise<void> {
    await cache.set(key, value, ttl);
  }
  async invalidate(pattern: string): Promise<void> {
    await cache.delPattern(pattern);
  }
}

/**
 * Simple in-memory cache with TTL (time-to-live)
 * Useful for caching API responses and expensive computations
 */

interface CacheEntry<T> {
  ts: number;
  data: T;
}

const memory = new Map<string, CacheEntry<unknown>>();

/**
 * Fetch data with caching
 * @param key Cache key
 * @param fetcher Async function to fetch data
 * @param ttlMs Time-to-live in milliseconds (default: 30 seconds)
 * @returns Cached or fresh data
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 30000
): Promise<T> {
  const hit = memory.get(key);

  // Check if cache hit is valid
  if (hit && Date.now() - hit.ts < ttlMs) {
    return hit.data as T;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  memory.set(key, { ts: Date.now(), data });

  return data;
}

/**
 * Clear a specific cache entry
 */
export function clearCache(key: string): void {
  memory.delete(key);
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  memory.clear();
}

/**
 * Get cache size (for debugging)
 */
export function getCacheSize(): number {
  return memory.size;
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;
  private subscriber: Redis;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableReadyCheck: true,
      lazyConnect: false,
    });

    this.subscriber = new Redis(redisUrl);

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });
  }

  async onModuleInit() {
    await this.client.ping();
  }

  /**
   * Get value from Redis
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * Set value in Redis with optional TTL
   */
  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return this.client.setex(key, ttl, value);
    }
    return this.client.set(key, value);
  }

  /**
   * Set value with TTL (alias for set with TTL)
   */
  async setex(key: string, ttl: number, value: string): Promise<'OK'> {
    return this.client.setex(key, ttl, value);
  }

  /**
   * Delete key(s) from Redis
   */
  async del(...keys: string[]): Promise<number> {
    return this.client.del(...keys);
  }

  /**
   * Check if key exists
   */
  async exists(...keys: string[]): Promise<number> {
    return this.client.exists(...keys);
  }

  /**
   * Get keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  /**
   * Increment value
   */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * Increment by specific amount
   */
  async incrby(key: string, increment: number): Promise<number> {
    return this.client.incrby(key, increment);
  }

  /**
   * Set TTL on existing key
   */
  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Hash operations
   */
  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.client.hset(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return this.client.hdel(key, ...fields);
  }

  /**
   * List operations
   */
  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.client.lpush(key, ...values);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.client.rpush(key, ...values);
  }

  async lpop(key: string): Promise<string | null> {
    return this.client.lpop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return this.client.rpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  /**
   * Set operations
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.client.srem(key, ...members);
  }

  /**
   * Pub/Sub
   */
  async publish(channel: string, message: string): Promise<number> {
    return this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        callback(msg);
      }
    });
  }

  /**
   * Distributed lock
   */
  async acquireLock(
    resource: string,
    ttl: number,
    retries: number = 3,
  ): Promise<string | null> {
    const lockKey = `lock:${resource}`;
    const lockValue = Math.random().toString(36).substring(7);

    for (let i = 0; i < retries; i++) {
      const result = await this.client.set(lockKey, lockValue, 'EX', ttl, 'NX');
      if (result === 'OK') {
        return lockValue;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return null;
  }

  async releaseLock(resource: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:${resource}`;
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.client.eval(script, 1, lockKey, lockValue);
    return result === 1;
  }

  /**
   * Cache helper with JSON support
   */
  async cacheGet<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async cacheSet<T>(key: string, value: T, ttl?: number): Promise<'OK'> {
    return this.set(key, JSON.stringify(value), ttl);
  }

  /**
   * Rate limiting helper
   */
  async checkRateLimit(
    key: string,
    limit: number,
    window: number,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const current = await this.incr(key);
    
    if (current === 1) {
      await this.expire(key, window);
    }

    const ttl = await this.ttl(key);
    const resetAt = Date.now() + ttl * 1000;

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetAt,
    };
  }

  /**
   * Get native client for advanced operations
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Flush all data (DANGER - use only in tests)
   */
  async flushAll(): Promise<'OK'> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot flush Redis in production');
    }
    return this.client.flushall();
  }
}

/**
 * Cache Service - Redis based with in-memory fallback.
 * Provides a unified API used across the application and tests.
 */

const redis = require('redis');
const logger = require('./logger');

const fallbackConsole = {
	debug: (...args) => console.debug(...args),
	info: (...args) => console.info(...args),
	warn: (...args) => console.warn(...args),
	error: (...args) => console.error(...args),
};

const emitLog = (level, ...args) => {
	if (process.env.NODE_ENV !== 'test') {
		try {
			if (logger && typeof logger[level] === 'function') {
				logger[level](...args);
				return;
			}
		} catch (error) {
			// fall back to console
		}
	}
	fallbackConsole[level](...args);
};

class CacheService {
	constructor() {
		this.client = null;
		this.isConnected = false;
		this.memoryStore = new Map();
		this._getOverride = null;
	}

	useMemoryStore() {
		return !this.isConnected || !this.client;
	}

	async initialize() {
		try {
			const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

			if (process.env.DISABLE_REDIS === 'true' || process.env.NODE_ENV !== 'production') {
				logger.warn('Redis disabled or not production - using fallback cache');
				this.isConnected = false;
				return;
			}

			this.client = redis.createClient({
				url: redisUrl,
				socket: {
					reconnectStrategy: (retries) => {
						if (retries > 5) {
						emitLog('warn', 'Redis reconnect max retries, continuing without cache');
							return false;
						}
						return Math.min(retries * 50, 500);
					},
				},
			});

					this.client.on('error', (err) => {
						emitLog('warn', 'Redis client error (non-critical):', err.message);
				this.isConnected = false;
			});

			this.client.on('connect', () => {
						emitLog('info', 'Redis connected');
				this.isConnected = true;
			});

			this.client.on('reconnecting', () => {
						emitLog('warn', 'Redis reconnecting...');
			});

			await Promise.race([
				this.client.connect(),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 2000)),
			]);
			this.isConnected = true;

					emitLog('info', 'Cache service initialized successfully');
		} catch (error) {
					emitLog('error', 'Failed to initialize cache service:', error);
			this.isConnected = false;
			this.client = null;
		}
	}

		async _getInternal(key) {
		if (this.useMemoryStore()) {
			const entry = this.memoryStore.get(key);
			if (!entry) {
						emitLog('debug', `Cache MISS: ${key}`);
				return null;
			}

			if (entry.expires && entry.expires < Date.now()) {
				this.memoryStore.delete(key);
						emitLog('debug', `Cache EXPIRED: ${key}`);
				return null;
			}

					emitLog('debug', `Cache HIT: ${key}`);
			return entry.value;
		}

			try {
				const value = await this.client.get(key);
			if (value) {
						emitLog('debug', `Cache HIT: ${key}`);
				return JSON.parse(value);
			}
					emitLog('debug', `Cache MISS: ${key}`);
			return null;
		} catch (error) {
					emitLog('error', `Cache get error (${key}):`, error);
			return null;
		}
	}

	async set(key, value, ttlSeconds = 300) {
		if (this.useMemoryStore()) {
			const expires = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
			this.memoryStore.set(key, { value, expires });
					emitLog('debug', `Cache SET (memory): ${key} (TTL: ${ttlSeconds}s)`);
			return true;
		}

		try {
			await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
					emitLog('debug', `Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
			return true;
		} catch (error) {
					emitLog('error', `Cache set error (${key}):`, error);
			return false;
		}
	}

	async delete(key) {
		if (this.useMemoryStore()) {
			const deleted = this.memoryStore.delete(key);
			if (deleted) {
						emitLog('debug', `Cache DELETE (memory): ${key}`);
			}
			return deleted;
		}

		try {
			const result = await this.client.del(key);
			if (result > 0) {
						emitLog('debug', `Cache DELETE: ${key}`);
			}
			return result > 0;
		} catch (error) {
					emitLog('error', `Cache delete error (${key}):`, error);
			return false;
		}
	}

	async deleteMany(pattern) {
		if (this.useMemoryStore()) {
			const regex = this.patternToRegex(pattern);
			let deleted = 0;
			for (const key of Array.from(this.memoryStore.keys())) {
				if (regex.test(key)) {
					this.memoryStore.delete(key);
					deleted += 1;
				}
			}
			if (deleted > 0) {
						emitLog('debug', `Cache DELETE MANY (memory): ${deleted} keys matching ${pattern}`);
			}
			return true;
		}

		try {
			const keys = await this.client.keys(pattern);
			if (keys.length > 0) {
				await this.client.del(keys);
						emitLog('debug', `Cache DELETE MANY: ${keys.length} keys matching ${pattern}`);
			}
			return true;
		} catch (error) {
					emitLog('error', `Cache deleteMany error (${pattern}):`, error);
			return false;
		}
	}

	async clear() {
		if (this.useMemoryStore()) {
			this.memoryStore.clear();
					emitLog('info', 'Cache cleared (memory)');
			return true;
		}

		try {
			await this.client.flushDb();
					emitLog('info', 'Cache cleared');
			return true;
		} catch (error) {
					emitLog('error', 'Cache clear error:', error);
			return false;
		}
	}

	async getPermissions(userId) {
			return this.get(`permissions:${userId}`);
	}

	async setPermissions(userId, permissions) {
		return this.set(`permissions:${userId}`, permissions, 300);
	}

	async invalidatePermissions(userId) {
		return this.delete(`permissions:${userId}`);
	}

	async getContract(contractId) {
			return this.get(`contract:${contractId}`);
	}

	async setContract(contractId, data) {
		return this.set(`contract:${contractId}`, data, 600);
	}

	async invalidateContract(contractId) {
		return this.delete(`contract:${contractId}`);
	}

	async invalidateTenantContracts(tenantId) {
		return this.deleteMany(`contract:tenant:${tenantId}:*`);
	}

	async getPaymentStats(tenantId, period) {
			return this.get(`payment:stats:${tenantId}:${period}`);
	}

	async setPaymentStats(tenantId, period, stats) {
		return this.set(`payment:stats:${tenantId}:${period}`, stats, 3600);
	}

	async invalidatePaymentStats(tenantId) {
		return this.deleteMany(`payment:stats:${tenantId}:*`);
	}

	async getSearchResults(query, page) {
			return this.get(`search:${query}:${page}`);
	}

	async setSearchResults(query, page, results) {
		return this.set(`search:${query}:${page}`, results, 1800);
	}

	async invalidateSearch() {
		return this.deleteMany('search:*');
	}

	async getAuditLogs(filter, page) {
		const key = `audit:${JSON.stringify(filter)}:${page}`;
			return this.get(key);
	}

	async setAuditLogs(filter, page, logs) {
		const key = `audit:${JSON.stringify(filter)}:${page}`;
		return this.set(key, logs, 3600);
	}

	async invalidateAuditLogs() {
		return this.deleteMany('audit:*');
	}

	async getStats() {
		if (this.useMemoryStore()) {
			return {
				connected: false,
				totalKeys: this.memoryStore.size,
				info: null,
			};
		}

		try {
			const info = await this.client.info('stats');
			const keys = await this.client.keys('*');

			return {
				connected: this.isConnected,
				totalKeys: keys.length,
				info,
			};
		} catch (error) {
				emitLog('error', 'Failed to get cache stats:', error);
			return null;
		}
	}

	async disconnect() {
		if (this.client) {
			await this.client.disconnect();
		}
		this.client = null;
		this.isConnected = false;
		this.memoryStore.clear();
			emitLog('info', 'Cache service disconnected');
	}

	invalidatePattern(pattern) {
		return this.deleteMany(pattern);
	}

	flush() {
		return this.clear();
	}

	patternToRegex(pattern) {
		const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
		const asRegex = escaped.replace(/\*/g, '.*');
		return new RegExp(`^${asRegex}$`);
	}
}

	const cacheServiceInstance = new CacheService();

	Object.defineProperty(cacheServiceInstance, 'get', {
		configurable: true,
		enumerable: true,
		get() {
			const self = this;
			return async function wrappedGet(...args) {
				const fn = self._getOverride || self._getInternal.bind(self);
				try {
					const result = await fn(...args);
					return result ?? null;
				} catch (error) {
					emitLog('error', 'Cache get error (override):', error);
					return null;
				}
			};
		},
		set(fn) {
			if (typeof fn === 'function') {
				this._getOverride = fn;
			} else {
				this._getOverride = null;
			}
		},
	});

	module.exports = cacheServiceInstance;

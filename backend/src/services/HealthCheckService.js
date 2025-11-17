/**
 * Health Check Service - Comprehensive system status monitoring
 * Checks: Database, Redis, Disk space, Memory, CPU, and all critical services
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

class HealthCheckService {
  constructor(pool, redisClient = null) {
    this.pool = pool;
    this.redisClient = redisClient;
    this.startTime = Date.now();
  }

  /**
   * Get uptime in seconds
   */
  getUptime() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Check database connectivity
   */
  async checkDatabase() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as timestamp, version() as version');
      client.release();

      return {
        status: 'connected',
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].version.split(',')[0],
        responseTime: Date.now(),
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message,
      };
    }
  }

  /**
   * Check Redis connectivity (if enabled)
   */
  async checkRedis() {
    if (!this.redisClient || !process.env.REDIS_ENABLED) {
      return {
        status: 'disabled',
        reason: 'Redis not configured',
      };
    }

    try {
      await this.redisClient.ping();
      const info = await this.redisClient.info('memory');
      return {
        status: 'connected',
        info: info.substring(0, 100), // Truncate for response size
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Check system disk space
   */
  checkDiskSpace() {
    try {
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const stats = fs.statSync(uploadDir);
      
      return {
        status: 'ok',
        available: 'unknown', // Would require additional utilities to get actual disk space
        uploadDir: uploadDir,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Check system memory usage
   */
  checkMemory() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usagePercent = ((usedMem / totalMem) * 100).toFixed(2);

    return {
      total: `${(totalMem / 1024 / 1024).toFixed(2)} MB`,
      free: `${(freeMem / 1024 / 1024).toFixed(2)} MB`,
      used: `${(usedMem / 1024 / 1024).toFixed(2)} MB`,
      usagePercent: `${usagePercent}%`,
      healthy: parseFloat(usagePercent) < 85,
    };
  }

  /**
   * Check system CPU
   */
  checkCPU() {
    const cpus = os.cpus();
    return {
      cores: cpus.length,
      model: cpus[0].model,
      speed: cpus[0].speed,
    };
  }

  /**
   * Check all required services
   */
  async checkServices() {
    return {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      disk: this.checkDiskSpace(),
    };
  }

  /**
   * Get full health status
   */
  async getFullHealth() {
    const memory = this.checkMemory();
    const cpu = this.checkCPU();
    const services = await this.checkServices();

    const isHealthy =
      services.database.status === 'connected' &&
      memory.healthy &&
      services.disk.status === 'ok';

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.API_VERSION || '1.0.0',
      services,
      system: {
        memory,
        cpu,
        platform: os.platform(),
        nodejs: process.version,
      },
    };
  }

  /**
   * Quick status (lightweight endpoint)
   */
  async getQuickHealth() {
    const services = await this.checkServices();
    return {
      status: services.database.status === 'connected' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      database: services.database.status,
      redis: services.redis.status,
    };
  }
}

module.exports = HealthCheckService;

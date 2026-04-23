import redisClient from './RedisClient.js';
import logger from '../utils/logger.js';

export const CACHE_KEYS = {
  user: {
    profile: (userId: string) => `user:profile:${userId}`,
    progress: (userId: string) => `user:progress:${userId}`,
    certificates: (userId: string) => `user:certs:${userId}`,
  },
  courses: {
    list: () => 'courses:list',
    detail: (courseId: string) => `course:${courseId}`,
    curriculum: (courseId: string) => `course:curriculum:${courseId}`,
  },
  leaderboard: {
    global: () => 'leaderboard:global',
    weekly: () => 'leaderboard:weekly',
  },
};

class CacheService {
  private metrics = {
    hits: 0,
    misses: 0,
  };

  async get<T>(key: string): Promise<T | null> {
    const client = redisClient.getClient();
    if (!client) {
      this.metrics.misses++;
      return null;
    }

    try {
      const data = await client.get(key);
      if (data) {
        this.metrics.hits++;
        return JSON.parse(data) as T;
      }
      this.metrics.misses++;
      return null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      this.metrics.misses++;
      return null;
    }
  }

  async set(key: string, value: unknown, ttl: number): Promise<void> {
    const client = redisClient.getClient();
    if (!client) return;

    try {
      await client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string | string[]): Promise<void> {
    const client = redisClient.getClient();
    if (!client) return;

    try {
      await client.del(...(Array.isArray(key) ? key : [key]));
    } catch (error) {
      logger.error(`Cache delete error:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    const client = redisClient.getClient();
    if (!client) return;

    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }

  resetMetrics() {
    this.metrics.hits = 0;
    this.metrics.misses = 0;
  }
}

export default new CacheService();

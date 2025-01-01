import Redis from 'ioredis';

let redisInstance: Redis | null = null;

export const redis = (() => {
  if (!redisInstance) {
    redisInstance = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }
  return redisInstance;
})();
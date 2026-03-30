import Redis from 'ioredis';
import { logger } from '../server.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redisClient.on('connect', () => logger.info('Redis conectado'));
    redisClient.on('error', (err) => logger.error({ err }, 'Erro no Redis'));
    redisClient.on('close', () => logger.warn('Redis desconectado'));
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/** TTL padrão para cache de odds: 90 segundos */
export const ODDS_CACHE_TTL = Number(process.env.ODDS_CACHE_TTL_SECONDS ?? 90);

export async function setWithTTL(key: string, value: unknown, ttlSeconds = ODDS_CACHE_TTL): Promise<void> {
  const redis = getRedisClient();
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function getFromCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const raw = await redis.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function deleteFromCache(key: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(key);
}

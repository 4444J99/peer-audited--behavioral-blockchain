import { QueueOptions } from 'bullmq';

function parseRedisConfig() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || '6379', 10),
        password: parsed.password || undefined, // allow-secret
        tls: parsed.protocol === 'rediss:' ? {} : undefined,
      };
    } catch {
      // fall through to individual env vars
    }
  }
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined, // allow-secret
  };
}

export const REDIS_CONNECTION_CONFIG = parseRedisConfig();

export const FURY_ROUTER_QUEUE_NAME = 'FURY_ROUTER_QUEUE';
export const SETTLEMENT_QUEUE_NAME = 'SETTLEMENT_QUEUE';

export const getDefaultQueueOptions = (): QueueOptions => ({
  connection: REDIS_CONNECTION_CONFIG,
});

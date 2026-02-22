import { QueueOptions } from 'bullmq';

export const REDIS_CONNECTION_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined, // allow-secret
};

export const FURY_ROUTER_QUEUE_NAME = 'FURY_ROUTER_QUEUE';

export const getDefaultQueueOptions = (): QueueOptions => ({
  connection: REDIS_CONNECTION_CONFIG,
});

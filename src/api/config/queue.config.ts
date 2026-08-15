import { QueueOptions } from 'bullmq';
import { resolveBullmqRedisConfig } from '../src/config/runtime';

export const getRedisConnectionConfig = () => {
  const config = resolveBullmqRedisConfig();
  if (!config) {
    throw new Error(
      'Redis is not configured for the queue layer. Set REDIS_URL (or ' +
        'REDIS_BULLMQ_URL) so BullMQ has a broker to use.',
    );
  }
  return config;
};

export const FURY_ROUTER_QUEUE_NAME = 'FURY_ROUTER_QUEUE';
export const SETTLEMENT_QUEUE_NAME = 'SETTLEMENT_QUEUE';
export const VIDEO_PROCESSING_QUEUE_NAME = 'VIDEO_PROCESSING_QUEUE';
export const PUSH_DISPATCH_QUEUE_NAME = 'PUSH_DISPATCH_QUEUE';
export const ENTERPRISE_WEBHOOK_QUEUE_NAME = 'ENTERPRISE_WEBHOOK_QUEUE';

export const getDefaultQueueOptions = (): QueueOptions => ({
  connection: getRedisConnectionConfig(),
});

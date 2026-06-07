import { QueueOptions } from 'bullmq';
import { resolveRedisConnectionConfig } from '../src/config/runtime';

export const getRedisConnectionConfig = () => resolveRedisConnectionConfig();

export const FURY_ROUTER_QUEUE_NAME = 'FURY_ROUTER_QUEUE';
export const SETTLEMENT_QUEUE_NAME = 'SETTLEMENT_QUEUE';

export const getDefaultQueueOptions = (): QueueOptions => ({
  connection: getRedisConnectionConfig(),
});

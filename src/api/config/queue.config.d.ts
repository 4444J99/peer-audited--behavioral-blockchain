import { QueueOptions } from 'bullmq';
export declare const REDIS_CONNECTION_CONFIG: {
    host: string;
    port: number;
    password: string | undefined;
};
export declare const FURY_ROUTER_QUEUE_NAME = "FURY_ROUTER_QUEUE";
export declare const getDefaultQueueOptions: () => QueueOptions;

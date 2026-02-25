import Redis from 'ioredis';
export declare const ANOMALY_REDIS_CLIENT = "ANOMALY_REDIS_CLIENT";
export interface AnomalyResult {
    rejected: boolean;
    reason?: string;
    flags: string[];
}
export declare class AnomalyService {
    private readonly redis?;
    private readonly logger;
    private readonly memoryStore;
    private nextId;
    constructor(redis?: Redis | undefined);
    analyze(mediaUri: string, userId: string): Promise<AnomalyResult>;
    private runAnalysis;
    computePHash(mediaUri: string): string;
    hammingDistance(a: string, b: string): number;
    private checkDuplicate;
    private checkDuplicateRedis;
    private checkDuplicateMemory;
    private storeHash;
    checkExifTimestamp(mediaUri: string): Promise<boolean>;
    private timeout;
}

import { OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
export declare class FuryRouterService implements OnModuleInit {
    private queue;
    onModuleInit(): void;
    setQueue(mockQueue: Queue): void;
    routeProof(proofId: string, submitterUserId: string, requiredReviewers?: number): Promise<string>;
}

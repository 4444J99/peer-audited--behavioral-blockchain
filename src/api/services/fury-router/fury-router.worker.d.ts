import { OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
export interface FuryRouteJobData {
    proofId: string;
    submitterUserId: string;
    requiredReviewers: number;
    dispatchedAt: string;
}
export declare class FuryRouterWorker implements OnModuleInit {
    private readonly pool;
    private readonly logger;
    private worker;
    constructor(pool: Pool);
    onModuleInit(): void;
    private processJob;
}

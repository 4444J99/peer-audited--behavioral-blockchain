import { Pool } from 'pg';
export declare class ConsumptionBillingService {
    private readonly pool;
    private readonly logger;
    constructor(pool: Pool);
    trackEvent(enterpriseId: string, eventType: string, units?: number): Promise<void>;
    getCurrentUsage(enterpriseId: string): Promise<any>;
}

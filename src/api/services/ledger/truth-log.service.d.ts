import { Pool } from 'pg';
export declare class TruthLogService {
    private readonly pool;
    constructor(pool: Pool);
    verifyChain(): Promise<{
        valid: boolean;
        checked: number;
        corrupted: string[];
    }>;
    appendEvent(eventType: string, payload: Record<string, any>): Promise<string>;
}

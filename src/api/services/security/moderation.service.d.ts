import { Pool } from 'pg';
import { TruthLogService } from '../ledger/truth-log.service';
export declare class ModerationService {
    private readonly truthLog;
    private readonly pool;
    constructor(truthLog: TruthLogService, pool: Pool);
    banUser(adminId: string, targetUserId: string, reason: string): Promise<{
        status: string;
        eventId: string;
    }>;
}

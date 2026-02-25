import { Pool } from 'pg';
import { FuryRouterService } from '../fury-router/fury-router.service';
import { TruthLogService } from '../ledger/truth-log.service';
export declare class HoneypotService {
    private readonly pool;
    private readonly furyRouter;
    private readonly truthLog;
    private readonly logger;
    private static readonly HONEYPOT_CORRECT_BONUS;
    private static readonly HONEYPOT_MISS_PENALTY;
    private static readonly MIN_FURIES_FOR_INJECTION;
    constructor(pool: Pool, furyRouter: FuryRouterService, truthLog: TruthLogService);
    injectHoneypot(): Promise<void>;
    gradeHoneypotPerformance(proofId: string, flaggedFuries: string[]): Promise<void>;
}

import { Pool } from 'pg';
import { StripeFboService } from './stripe.service';
import { TruthLogService } from '../ledger/truth-log.service';
import { LedgerService } from '../ledger/ledger.service';
interface DisputeDetail {
    id: string;
    proofId: string;
    contractId: string;
    userId: string;
    userEmail: string;
    oathCategory: string;
    proofStatus: string;
    mediaUri: string | null;
    submittedAt: string;
    appealStatus: string;
    judgeUserId: string | null;
    judgeNotes: string | null;
    resolvedAt: string | null;
    furyVotes: Array<{
        furyUserId: string;
        verdict: string;
        reviewedAt: string;
    }>;
}
export declare class DisputeService {
    private readonly pool;
    private readonly stripeService;
    private readonly truthLog;
    private readonly ledger;
    private readonly logger;
    constructor(pool: Pool, stripeService: StripeFboService, truthLog: TruthLogService, ledger: LedgerService);
    initiateAppeal(userId: string, proofId: string, customerId: string): Promise<{
        appealStatus: string;
        paymentIntentId: string;
    }>;
    getDisputeQueue(): Promise<any[]>;
    getDisputeDetail(disputeId: string): Promise<DisputeDetail>;
    resolveDispute(disputeId: string, judgeUserId: string, outcome: 'UPHELD' | 'OVERTURNED' | 'ESCALATED', judgeNotes: string): Promise<{
        status: string;
    }>;
}
export {};

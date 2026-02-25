import { StripeFboService } from './escrow/stripe.service';
import { LedgerService } from './ledger/ledger.service';
import { TruthLogService } from './ledger/truth-log.service';
import { Pool } from 'pg';
export declare const MONTHLY_SUBSCRIPTION_PRICE = 14.99;
export declare const TICKET_PRICE_BASE = 4.99;
export declare const APPEAL_FEE_AMOUNT = 5;
export interface IAPResult {
    paymentIntentId: string;
    amount: number;
}
export declare function processIAP(pool: Pool, stripe: StripeFboService, ledger: LedgerService, truthLog: TruthLogService, userId: string, contractId: string): Promise<IAPResult>;

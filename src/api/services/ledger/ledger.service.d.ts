import { Pool } from 'pg';
export declare class LedgerService {
    private readonly pool;
    constructor(pool: Pool);
    recordTransaction(debitAccountId: string, creditAccountId: string, amount: number, contractId?: string, metadata?: Record<string, any>): Promise<string>;
    getAccountBalance(accountId: string): Promise<number>;
    getContractLedger(contractId: string): Promise<Array<{
        id: string;
        debitAccountId: string;
        creditAccountId: string;
        amount: number;
        metadata: Record<string, any> | null;
        createdAt: Date;
    }>>;
    verifyLedgerIntegrity(): Promise<{
        balanced: boolean;
        totalDebits: number;
        totalCredits: number;
    }>;
}

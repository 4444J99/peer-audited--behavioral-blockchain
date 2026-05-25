import { Test, TestingModule } from '@nestjs/testing';
import { ReconciliationService } from './reconciliation.service';
import { Pool } from 'pg';
import { LedgerService } from '../../../services/ledger/ledger.service';

describe('ReconciliationService', () => {
  let service: ReconciliationService;
  let pool: Pool;
  let ledger: LedgerService;

  const mockPool = {
    query: jest.fn(),
  };

  const mockLedger = {
    getContractLedger: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconciliationService,
        { provide: Pool, useValue: mockPool },
        { provide: LedgerService, useValue: mockLedger },
      ],
    }).compile();

    service = module.get<ReconciliationService>(ReconciliationService);
    pool = module.get<Pool>(Pool);
    ledger = module.get<LedgerService>(LedgerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reconcileContract', () => {
    it('should return isBalanced: true when ledger matches contract stake', async () => {
      const contractId = 'c1';
      mockPool.query.mockResolvedValueOnce({ rows: [{ stake_amount: '10.00', status: 'COMPLETED' }] }); // Contract
      mockPool.query.mockResolvedValueOnce({ rows: [{ status: 'SUCCESS' }] }); // Settlement Run
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'acct-escrow' }] }); // SYSTEM_ESCROW account

      mockLedger.getContractLedger.mockResolvedValue([
        { amount: 1000, debitAccountId: 'acct-escrow', creditAccountId: 'acct-user', metadata: { type: 'REAL_MONEY_SETTLEMENT_RELEASE' } }
      ]);

      const result = await service.reconcileContract(contractId);
      expect(result.isBalanced).toBe(true);
      expect(result.ledgerTotalCents).toBe(1000);
    });

    it('should detect discrepancies when ledger is unbalanced', async () => {
      const contractId = 'c2';
      mockPool.query.mockResolvedValueOnce({ rows: [{ stake_amount: '50.00', status: 'FAILED' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ status: 'SUCCESS' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'acct-escrow' }] }); // SYSTEM_ESCROW account

      mockLedger.getContractLedger.mockResolvedValue([
        { amount: 2500, debitAccountId: 'acct-escrow', creditAccountId: 'acct-revenue', metadata: { type: 'REAL_MONEY_SETTLEMENT_CAPTURE' } } // Only captured half!
      ]);

      const result = await service.reconcileContract(contractId);
      expect(result.isBalanced).toBe(false);
      expect(result.discrepancies).toContain('Ledger imbalance: Expected 5000 withdrew 2500');
    });

    it('should detect a wrong-direction settlement entry of equal magnitude', async () => {
      const contractId = 'c3';
      mockPool.query.mockResolvedValueOnce({ rows: [{ stake_amount: '10.00', status: 'FAILED' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ status: 'SUCCESS' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'acct-escrow' }] }); // SYSTEM_ESCROW account

      mockLedger.getContractLedger.mockResolvedValue([
        // Equal magnitude but CREDITS escrow instead of debiting it: must not balance.
        { amount: 1000, debitAccountId: 'acct-revenue', creditAccountId: 'acct-escrow', metadata: { type: 'REAL_MONEY_SETTLEMENT_CAPTURE' } }
      ]);

      const result = await service.reconcileContract(contractId);
      expect(result.isBalanced).toBe(false);
      expect(result.ledgerTotalCents).toBe(0);
      expect(result.discrepancies.some(d => d.includes('Wrong-direction'))).toBe(true);
    });
  });
});

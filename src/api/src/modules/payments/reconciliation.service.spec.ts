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
      
      mockLedger.getContractLedger.mockResolvedValue([
        { amount: 1000, metadata: { type: 'REAL_MONEY_SETTLEMENT_RELEASE' } }
      ]);

      const result = await service.reconcileContract(contractId);
      expect(result.isBalanced).toBe(true);
      expect(result.ledgerTotalCents).toBe(1000);
    });

    it('should detect discrepancies when ledger is unbalanced', async () => {
      const contractId = 'c2';
      mockPool.query.mockResolvedValueOnce({ rows: [{ stake_amount: '50.00', status: 'FAILED' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ status: 'SUCCESS' }] });
      
      mockLedger.getContractLedger.mockResolvedValue([
        { amount: 2500, metadata: { type: 'REAL_MONEY_SETTLEMENT_CAPTURE' } } // Only captured half!
      ]);

      const result = await service.reconcileContract(contractId);
      expect(result.isBalanced).toBe(false);
      expect(result.discrepancies).toContain('Ledger imbalance: Expected 5000 withdrew 2500');
    });
  });
});

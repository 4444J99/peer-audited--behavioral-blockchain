import { SettlementService, SettlementJob } from './settlement.service';
import { SETTLEMENT_QUEUE_NAME } from '../../../config/queue.config';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('bullmq');
import { Queue } from 'bullmq';
const MockQueue = Queue as jest.MockedClass<typeof Queue>;

describe('SettlementService', () => {
  let service: SettlementService;
  let mockAdd: jest.Mock;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdd = jest.fn().mockResolvedValue({ id: 'job-1' });
    MockQueue.prototype.add = mockAdd;
    mockPool = { query: jest.fn() };
    service = new SettlementService(mockPool as any);
  });

  describe('dispatchSettlement', () => {
    it('should add a job to the queue', async () => {
      const job: SettlementJob = {
        contractId: 'c-1',
        outcome: 'PASS',
        paymentIntentId: 'pi_1',
        amountCents: 1000,
      };

      await service.dispatchSettlement(job);
      expect(mockAdd).toHaveBeenCalled();
    });

    it('should enforce KYC for amounts > $20.00', async () => {
      const job: SettlementJob = {
        contractId: 'c-large',
        outcome: 'PASS',
        paymentIntentId: 'pi_2',
        amountCents: 2500, // $25.00
      };

      mockPool.query.mockResolvedValue({ rows: [{ age_verification_status: 'SELF_DECLARED' }] });

      await expect(service.dispatchSettlement(job)).rejects.toThrow(BadRequestException);
      await expect(service.dispatchSettlement(job)).rejects.toThrow(/KYC verification required/);
    });

    it('should allow large settlements if user is KYC verified', async () => {
      const job: SettlementJob = {
        contractId: 'c-large-verified',
        outcome: 'PASS',
        paymentIntentId: 'pi_3',
        amountCents: 2500,
      };

      mockPool.query.mockResolvedValueOnce({ rows: [{ age_verification_status: 'VERIFIED' }] });

      await service.dispatchSettlement(job);
      expect(mockAdd).toHaveBeenCalled();
    });
  });

  describe('getSettlementPreview', () => {
    it('should return a breakdown of fees and payouts', async () => {
      mockPool.query.mockResolvedValueOnce({ 
        rows: [{ user_id: 'u-1', stake_amount: 50, status: 'COMPLETED' }] 
      });

      const result = await service.getSettlementPreview('c-1');

      expect(result).toMatchObject({
        stakeAmountCents: 5000,
        platformFeeCents: 500,
        bountyPoolCents: 1000,
        userRefundCents: 5000,
      });
    });

    it('should throw NotFoundException if contract missing', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      await expect(service.getSettlementPreview('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSettlementStatus', () => {
    it('should return runs and ledger entries', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'run-1', status: 'SUCCESS' }] }) // runs
        .mockResolvedValueOnce({ rows: [{ id: 'entry-1', amount: 5000 }] }); // entries

      const result = await service.getSettlementStatus('c-1');

      expect(result.runs).toHaveLength(1);
      expect(result.ledgerEntries).toHaveLength(1);
    });
  });
});
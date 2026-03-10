import { SettlementService, SettlementJob } from './settlement.service';
import { SETTLEMENT_QUEUE_NAME } from '../../../config/queue.config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompliancePolicyService } from '../compliance/compliance-policy.service';

jest.mock('bullmq');
import { Queue } from 'bullmq';
const MockQueue = Queue as jest.MockedClass<typeof Queue>;

describe('SettlementService', () => {
  let service: SettlementService;
  let mockAdd: jest.Mock;
  let mockPool: { query: jest.Mock };
  let mockCompliancePolicy: { evaluateKycRequirement: jest.Mock; getJurisdictionPolicy: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdd = jest.fn().mockResolvedValue({ id: 'job-1' });
    MockQueue.prototype.add = mockAdd;
    mockPool = { query: jest.fn() };
    mockCompliancePolicy = {
      evaluateKycRequirement: jest.fn().mockResolvedValue({ allowed: true }),
      getJurisdictionPolicy: jest.fn(),
    };
    service = new SettlementService(
      mockPool as any,
      mockCompliancePolicy as unknown as CompliancePolicyService,
    );
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
      expect(mockCompliancePolicy.evaluateKycRequirement).not.toHaveBeenCalled();
    });

    it('should enforce KYC for amounts > $20.00 when compliance policy denies', async () => {
      const job: SettlementJob = {
        contractId: 'c-large',
        outcome: 'PASS',
        paymentIntentId: 'pi_2',
        amountCents: 2500, // $25.00
      };

      mockPool.query.mockResolvedValue({ rows: [{ user_id: 'user-1' }] });
      mockCompliancePolicy.evaluateKycRequirement.mockResolvedValue({
        allowed: false,
        reason: 'Identity verification required for stakes above $20. Complete KYC to continue.',
      });

      await expect(service.dispatchSettlement(job)).rejects.toThrow(BadRequestException);
      await expect(service.dispatchSettlement(job)).rejects.toThrow(/Identity verification required/);
      expect(mockCompliancePolicy.evaluateKycRequirement).toHaveBeenCalledWith('user-1', 25);
    });

    it('should allow large settlements if compliance policy allows them', async () => {
      const job: SettlementJob = {
        contractId: 'c-large-verified',
        outcome: 'PASS',
        paymentIntentId: 'pi_3',
        amountCents: 2500,
      };

      mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: 'user-2' }] });
      mockCompliancePolicy.evaluateKycRequirement.mockResolvedValueOnce({ allowed: true });

      await service.dispatchSettlement(job);
      expect(mockAdd).toHaveBeenCalled();
      expect(mockCompliancePolicy.evaluateKycRequirement).toHaveBeenCalledWith('user-2', 25);
    });

    it('should throw NotFoundException when settlement contract is missing', async () => {
      const job: SettlementJob = {
        contractId: 'missing',
        outcome: 'PASS',
        paymentIntentId: 'pi_missing',
        amountCents: 2500,
      };

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.dispatchSettlement(job)).rejects.toThrow(NotFoundException);
      expect(mockCompliancePolicy.evaluateKycRequirement).not.toHaveBeenCalled();
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
        platformFeeCents: 0,
        bountyPoolCents: 0,
        userRefundCents: 5000,
        dispositionMode: 'REFUND',
        actualAction: 'RELEASE',
      });
    });

    it('should return refund-only preview for failed contracts in restricted jurisdictions', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ user_id: 'u-2', stake_amount: 39, status: 'FAILED' }],
        })
        .mockResolvedValueOnce({
          rows: [{ last_known_state: 'NY' }],
        });
      mockCompliancePolicy.getJurisdictionPolicy.mockResolvedValueOnce({
        tier: 'REFUND_ONLY',
        dispositionMode: 'REFUND_ONLY',
      });

      const result = await service.getSettlementPreview('c-2');

      expect(result).toMatchObject({
        stakeAmountCents: 3900,
        platformFeeCents: 0,
        bountyPoolCents: 0,
        userRefundCents: 3900,
        dispositionMode: 'REFUND',
        actualAction: 'RELEASE',
      });
    });

    it('should return capture preview for failed contracts in capture-allowed jurisdictions', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ user_id: 'u-3', stake_amount: 50, status: 'FAILED' }],
        })
        .mockResolvedValueOnce({
          rows: [{ last_known_state: 'TX' }],
        });
      mockCompliancePolicy.getJurisdictionPolicy.mockResolvedValueOnce({
        tier: 'FULL_ACCESS',
      });

      const result = await service.getSettlementPreview('c-capture');

      expect(result).toMatchObject({
        stakeAmountCents: 5000,
        platformFeeCents: 4000,
        bountyPoolCents: 1000,
        userRefundCents: 0,
        dispositionMode: 'CAPTURE',
        actualAction: 'CAPTURE',
      });
    });

    it('should default failed preview to REFUND when jurisdiction is unknown', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ user_id: 'u-4', stake_amount: 25, status: 'FAILED' }],
        })
        .mockResolvedValueOnce({
          rows: [{ last_known_state: null }],
        });

      const result = await service.getSettlementPreview('c-unknown');

      expect(mockCompliancePolicy.getJurisdictionPolicy).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        stakeAmountCents: 2500,
        platformFeeCents: 0,
        bountyPoolCents: 0,
        userRefundCents: 2500,
        dispositionMode: 'REFUND',
        actualAction: 'RELEASE',
      });
    });

    it('should throw NotFoundException if contract missing', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      await expect(service.getSettlementPreview('missing')).rejects.toThrow(NotFoundException);
    });

    it('should reject preview for unresolved contracts', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ user_id: 'u-3', stake_amount: 25, status: 'ACTIVE' }],
      });

      const previewPromise = service.getSettlementPreview('c-active');
      await expect(previewPromise).rejects.toThrow(BadRequestException);
      await expect(previewPromise).rejects.toThrow(/resolved contracts/i);
      expect(mockCompliancePolicy.getJurisdictionPolicy).not.toHaveBeenCalled();
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

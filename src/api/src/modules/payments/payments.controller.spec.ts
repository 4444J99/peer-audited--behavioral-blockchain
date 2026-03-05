import { PaymentsController } from './payments.controller';
import { ContractsService } from '../contracts/contracts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CompliancePolicyService } from '../compliance/compliance-policy.service';
import { SettlementService } from './settlement.service';
import { Pool } from 'pg';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let mockPool: { query: jest.Mock };
  let mockContractsService: { resolveContract: jest.Mock; getContract: jest.Mock };
  let mockNotifications: { create: jest.Mock };
  let mockPolicy: { evaluateRequestPolicy: jest.Mock };
  let mockSettlement: { getSettlementPreview: jest.Mock; getSettlementStatus: jest.Mock; dispatchSettlement: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockContractsService = { 
      resolveContract: jest.fn().mockResolvedValue(undefined),
      getContract: jest.fn(),
    };
    mockNotifications = { create: jest.fn().mockResolvedValue({ id: 'notif-1' }) };
    mockPolicy = { evaluateRequestPolicy: jest.fn() };
    mockSettlement = {
      getSettlementPreview: jest.fn(),
      getSettlementStatus: jest.fn(),
      dispatchSettlement: jest.fn(),
    };

    controller = new PaymentsController(
      mockPool as unknown as Pool,
      mockContractsService as unknown as ContractsService,
      mockNotifications as unknown as NotificationsService,
      mockPolicy as unknown as CompliancePolicyService,
      mockSettlement as unknown as SettlementService,
    );
  });

  describe('previewSettlement', () => {
    it('should delegate to settlementService.getSettlementPreview', async () => {
      const expected = { stakeAmountCents: 5000 };
      mockSettlement.getSettlementPreview.mockResolvedValue(expected);

      const result = await controller.previewSettlement('c-1');
      expect(result).toBe(expected);
      expect(mockSettlement.getSettlementPreview).toHaveBeenCalledWith('c-1');
    });
  });

  describe('getSettlementStatus', () => {
    it('should delegate to settlementService.getSettlementStatus', async () => {
      const expected = { runs: [] };
      mockSettlement.getSettlementStatus.mockResolvedValue(expected);

      const result = await controller.getSettlementStatus('c-1');
      expect(result).toBe(expected);
      expect(mockSettlement.getSettlementStatus).toHaveBeenCalledWith('c-1');
    });
  });

  describe('executeSettlement', () => {
    it('should dispatch settlement job based on contract status', async () => {
      mockContractsService.getContract.mockResolvedValue({ 
        id: 'c-1', 
        status: 'COMPLETED', 
        payment_intent_id: 'pi_1', 
        stake_amount: 50 
      });

      await controller.executeSettlement('c-1', {});

      expect(mockSettlement.dispatchSettlement).toHaveBeenCalledWith(expect.objectContaining({
        contractId: 'c-1',
        outcome: 'PASS',
        amountCents: 5000,
      }));
    });
  });
});
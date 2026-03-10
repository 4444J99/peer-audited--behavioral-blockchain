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
  let mockPolicy: { evaluateRequestPolicy: jest.Mock; getJurisdictionPolicy: jest.Mock };
  let mockSettlement: { getSettlementPreview: jest.Mock; getSettlementStatus: jest.Mock; dispatchSettlement: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockContractsService = { 
      resolveContract: jest.fn().mockResolvedValue(undefined),
      getContract: jest.fn(),
    };
    mockNotifications = { create: jest.fn().mockResolvedValue({ id: 'notif-1' }) };
    mockPolicy = {
      evaluateRequestPolicy: jest.fn(),
      getJurisdictionPolicy: jest.fn(),
    };
    mockSettlement = {
      getSettlementPreview: jest.fn(),
      getSettlementStatus: jest.fn(),
      dispatchSettlement: jest.fn(),
    };

    const mockReconciliation = {
      reconcileContract: jest.fn(),
      generateCustodyReport: jest.fn(),
    };

    controller = new PaymentsController(
      mockPool as unknown as Pool,
      mockContractsService as unknown as ContractsService,
      mockNotifications as unknown as NotificationsService,
      mockPolicy as unknown as CompliancePolicyService,
      mockSettlement as unknown as SettlementService,
      mockReconciliation as unknown as import('./reconciliation.service').ReconciliationService,
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
        user_id: 'user-1',
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

    it('should force REFUND disposition for failed contracts in refund-only jurisdictions', async () => {
      mockContractsService.getContract.mockResolvedValue({
        id: 'c-2',
        status: 'FAILED',
        user_id: 'user-2',
        payment_intent_id: 'pi_2',
        stake_amount: 39,
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ last_known_state: 'NY' }] });
      mockPolicy.getJurisdictionPolicy.mockResolvedValueOnce({
        tier: 'REFUND_ONLY',
        dispositionMode: 'REFUND_ONLY',
      });

      await controller.executeSettlement('c-2', {});

      expect(mockSettlement.dispatchSettlement).toHaveBeenCalledWith(expect.objectContaining({
        contractId: 'c-2',
        outcome: 'FAIL',
        amountCents: 3900,
        dispositionMode: 'REFUND',
      }));
    });

    it('should require an explicit outcome when force-running settlement on unresolved contracts', async () => {
      mockContractsService.getContract.mockResolvedValue({
        id: 'c-3',
        status: 'ACTIVE',
        user_id: 'user-3',
        payment_intent_id: 'pi_3',
        stake_amount: 25,
      });

      await expect(controller.executeSettlement('c-3', { force: true })).rejects.toThrow(
        /requires an explicit outcome/i,
      );
      expect(mockSettlement.dispatchSettlement).not.toHaveBeenCalled();
    });

    it('should allow forced settlement on unresolved contracts when outcome is explicit', async () => {
      mockContractsService.getContract.mockResolvedValue({
        id: 'c-4',
        status: 'ACTIVE',
        user_id: 'user-4',
        payment_intent_id: 'pi_4',
        stake_amount: 25,
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ last_known_state: 'CA' }] });
      mockPolicy.getJurisdictionPolicy.mockResolvedValueOnce({
        tier: 'FULL_ACCESS',
        dispositionMode: 'HOUSE_RETAINED',
      });

      await controller.executeSettlement('c-4', { force: true, outcome: 'FAIL' });

      expect(mockSettlement.dispatchSettlement).toHaveBeenCalledWith(expect.objectContaining({
        contractId: 'c-4',
        outcome: 'FAIL',
        amountCents: 2500,
        dispositionMode: 'CAPTURE',
      }));
    });

    it('should default failed manual settlements to REFUND when jurisdiction is unknown', async () => {
      mockContractsService.getContract.mockResolvedValue({
        id: 'c-5',
        status: 'FAILED',
        user_id: 'user-5',
        payment_intent_id: 'pi_5',
        stake_amount: 25,
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ last_known_state: null }] });

      await controller.executeSettlement('c-5', {});

      expect(mockPolicy.getJurisdictionPolicy).not.toHaveBeenCalled();
      expect(mockSettlement.dispatchSettlement).toHaveBeenCalledWith(expect.objectContaining({
        contractId: 'c-5',
        outcome: 'FAIL',
        amountCents: 2500,
        dispositionMode: 'REFUND',
      }));
    });
  });
});

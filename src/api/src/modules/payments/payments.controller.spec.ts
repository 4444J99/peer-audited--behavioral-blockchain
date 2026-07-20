import { PaymentsController } from './payments.controller';
import { ContractsService } from '../contracts/contracts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CompliancePolicyService } from '../compliance/compliance-policy.service';
import { SettlementService } from './settlement.service';
import { Pool } from 'pg';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AuthGuard } from '../../../guards/auth.guard';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let mockPool: { query: jest.Mock };
  let mockContractsService: { resolveContract: jest.Mock; getContract: jest.Mock };
  let mockNotifications: { create: jest.Mock };
  let mockPolicy: { evaluateRequestPolicy: jest.Mock; getJurisdictionPolicy: jest.Mock };
  let mockSettlement: { getSettlementPreview: jest.Mock; getSettlementStatus: jest.Mock; dispatchSettlement: jest.Mock };
  let mockStripe: {
    subscriptions: { create: jest.Mock; retrieve: jest.Mock; update: jest.Mock; cancel: jest.Mock };
    customers: { create: jest.Mock; update: jest.Mock };
    paymentMethods: { attach: jest.Mock };
  };

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
    mockStripe = {
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn().mockResolvedValue({ id: 'sub_cancelled' }),
      },
      customers: { create: jest.fn(), update: jest.fn() },
      paymentMethods: { attach: jest.fn() },
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
    (controller as any).stripe = mockStripe;
  });

  describe('subscribe', () => {
    const activeUserRow = (overrides: Record<string, unknown> = {}) => ({
      id: 'user-1',
      email: 'user@example.com',
      stripe_customer_id: 'cus_1',
      subscription_id: null,
      status: 'ACTIVE',
      access_tier: 'free',
      ...overrides,
    });

    it('creates a 30-day $14.99/month Stripe subscription and stores subscription_id', async () => {
      const trialEnd = 1780000000;
      mockPool.query
        .mockResolvedValueOnce({
          rows: [activeUserRow()],
        })
        .mockResolvedValueOnce({ rows: [] });
      mockStripe.subscriptions.create.mockResolvedValue({
        id: 'sub_1',
        status: 'trialing',
        trial_end: trialEnd,
      });

      const result = await controller.subscribe({ id: 'user-1', email: 'auth@example.com' }, {});

      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_1',
          trial_period_days: 30,
          items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: 'usd',
                unit_amount: 1499,
                recurring: { interval: 'month' },
              }),
            }),
          ],
          metadata: expect.objectContaining({
            product: 'early_access',
            userId: 'user-1',
          }),
        }),
        { idempotencyKey: 'styx-subscribe-user-1' },
      );
      expect(mockPool.query).toHaveBeenLastCalledWith(
        expect.stringContaining('subscription_id = $2'),
        ['cus_1', 'sub_1', 'user-1'],
      );
      expect(mockPool.query.mock.calls[1][0]).toContain("WHEN access_tier = 'free'");
      expect(result).toEqual({
        subscriptionId: 'sub_1',
        customerId: 'cus_1',
        status: 'trialing',
        trialDays: 30,
        trialEndsAt: new Date(trialEnd * 1000).toISOString(),
        amountCents: 1499,
        currency: 'usd',
        interval: 'month',
        reused: false,
      });
    });

    it('creates and stores a Stripe customer before subscribing when the user has none', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [activeUserRow({
            id: 'user-2',
            email: 'new@example.com',
            stripe_customer_id: null,
          })],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_new' });
      mockStripe.subscriptions.create.mockResolvedValue({
        id: 'sub_new',
        status: 'trialing',
        trial_end: null,
      });

      const result = await controller.subscribe({ id: 'user-2' }, {});

      expect(mockStripe.customers.create).toHaveBeenCalledWith(
        {
          email: 'new@example.com',
          metadata: { userId: 'user-2' },
        },
        { idempotencyKey: 'styx-customer-user-2' },
      );
      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cus_new' }),
        { idempotencyKey: 'styx-subscribe-user-2' },
      );
      expect(result.subscriptionId).toBe('sub_new');
      expect(result.customerId).toBe('cus_new');
    });

    it('attaches an optional payment method as the customer and subscription default', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [activeUserRow({
            id: 'user-3',
            email: 'paid@example.com',
            stripe_customer_id: 'cus_paid',
          })],
        })
        .mockResolvedValueOnce({ rows: [] });
      mockStripe.subscriptions.create.mockResolvedValue({
        id: 'sub_paid',
        status: 'trialing',
        trial_end: null,
      });

      await controller.subscribe({ id: 'user-3' }, { paymentMethodId: 'pm_123' });

      expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith('pm_123', {
        customer: 'cus_paid',
      });
      expect(mockStripe.customers.update).toHaveBeenCalledWith('cus_paid', {
        invoice_settings: {
          default_payment_method: 'pm_123',
        },
      });
      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          default_payment_method: 'pm_123',
          payment_settings: {
            save_default_payment_method: 'on_subscription',
          },
        }),
        { idempotencyKey: 'styx-subscribe-user-3' },
      );
    });

    it('refreshes a stored subscription and updates its default payment method without duplicating it', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [activeUserRow({
          id: 'user-4',
          email: 'stored@example.com',
          stripe_customer_id: 'cus_stored',
          subscription_id: 'sub_stored',
        })],
      });
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_stored',
        status: 'active',
        trial_end: null,
      });
      mockStripe.subscriptions.update.mockResolvedValue({
        id: 'sub_stored',
        status: 'active',
        trial_end: null,
      });

      const result = await controller.subscribe({ id: 'user-4' }, { paymentMethodId: 'pm_later' });

      expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith('pm_later', {
        customer: 'cus_stored',
      });
      expect(mockStripe.customers.update).toHaveBeenCalledWith('cus_stored', {
        invoice_settings: {
          default_payment_method: 'pm_later',
        },
      });
      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_stored');
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_stored', {
        default_payment_method: 'pm_later',
      });
      expect(mockStripe.subscriptions.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        subscriptionId: 'sub_stored',
        customerId: 'cus_stored',
        status: 'active',
        trialDays: 30,
        trialEndsAt: null,
        amountCents: 1499,
        currency: 'usd',
        interval: 'month',
        reused: true,
      });
    });

    it('rejects blank payment method ids before calling Stripe', async () => {
      await expect(
        controller.subscribe({ id: 'user-5' }, { paymentMethodId: '   ' }),
      ).rejects.toThrow(/paymentMethodId/i);

      expect(mockPool.query).not.toHaveBeenCalled();
      expect(mockStripe.subscriptions.create).not.toHaveBeenCalled();
    });

    it('rejects inactive users before creating Stripe resources', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [activeUserRow({ status: 'PENDING_DELETION' })],
      });

      await expect(
        controller.subscribe({ id: 'user-6' }, {}),
      ).rejects.toThrow(/active account/i);

      expect(mockStripe.customers.create).not.toHaveBeenCalled();
      expect(mockStripe.subscriptions.create).not.toHaveBeenCalled();
    });

    it('clears canceled stored subscriptions and creates a replacement', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [activeUserRow({
            id: 'user-7',
            stripe_customer_id: 'cus_7',
            subscription_id: 'sub_old',
          })],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_old',
        status: 'canceled',
        trial_end: null,
      });
      mockStripe.subscriptions.create.mockResolvedValue({
        id: 'sub_new',
        status: 'trialing',
        trial_end: null,
      });

      const result = await controller.subscribe({ id: 'user-7' }, {});

      expect(mockPool.query.mock.calls[1][0]).toContain('SET subscription_id = NULL');
      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cus_7' }),
        { idempotencyKey: 'styx-subscribe-user-7' },
      );
      expect(result.subscriptionId).toBe('sub_new');
      expect(result.reused).toBe(false);
    });

    it('cancels a newly created subscription if local persistence fails', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [activeUserRow({
            id: 'user-8',
            stripe_customer_id: 'cus_8',
          })],
        })
        .mockRejectedValueOnce(new Error('db down'));
      mockStripe.subscriptions.create.mockResolvedValue({
        id: 'sub_orphan',
        status: 'trialing',
        trial_end: null,
      });

      await expect(
        controller.subscribe({ id: 'user-8' }, {}),
      ).rejects.toThrow('db down');

      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith(
        'sub_orphan',
        { prorate: true },
        { idempotencyKey: 'styx-subscribe-rollback-sub_orphan' },
      );
    });

    it('uses AuthGuard without the contract-creation tier guard', () => {
      const guards =
        Reflect.getMetadata(
          GUARDS_METADATA,
          PaymentsController.prototype.subscribe,
        ) ?? [];

      expect(guards).toEqual([AuthGuard]);
    });
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

    it('should refuse to settle an unfunded contract with no payment intent (PM11)', async () => {
      mockContractsService.getContract.mockResolvedValue({
        id: 'c-unfunded',
        status: 'COMPLETED',
        user_id: 'user-x',
        payment_intent_id: null,
        stake_amount: 50,
      });

      await expect(controller.executeSettlement('c-unfunded', {})).rejects.toThrow(/unfunded/i);
      expect(mockSettlement.dispatchSettlement).not.toHaveBeenCalled();
    });

    it('should fail closed to REFUND for a FAILED contract with no resolvable user_id (PM30)', async () => {
      mockContractsService.getContract.mockResolvedValue({
        id: 'c-no-user',
        status: 'FAILED',
        // no user_id / userId surfaced
        payment_intent_id: 'pi_no_user',
        stake_amount: 25,
      });

      await controller.executeSettlement('c-no-user', {});

      // No jurisdiction lookup should run with an undefined user id.
      expect(mockPolicy.getJurisdictionPolicy).not.toHaveBeenCalled();
      expect(mockSettlement.dispatchSettlement).toHaveBeenCalledWith(expect.objectContaining({
        contractId: 'c-no-user',
        outcome: 'FAIL',
        dispositionMode: 'REFUND',
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

import { Pool } from 'pg';
import { ForbiddenException } from '@nestjs/common';
import { PayService } from './pay.service';
import { BillingService } from '../b2b/billing.service';
import {
  MONTHLY_SUBSCRIPTION_PRICE,
  TICKET_PRICE_BASE,
} from '../../../services/billing';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';

describe('PayService', () => {
  let mockPool: { query: jest.Mock };
  let mockStripe: { holdStake: jest.Mock; captureStake: jest.Mock };
  let mockLedger: { recordTransaction: jest.Mock };
  let mockTruthLog: { appendEvent: jest.Mock };
  let mockBilling: { recordUsage: jest.Mock; getUsageSummary: jest.Mock };
  let service: PayService;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockStripe = {
      holdStake: jest.fn(),
      captureStake: jest.fn(),
    };
    mockLedger = { recordTransaction: jest.fn() };
    mockTruthLog = { appendEvent: jest.fn() };
    mockBilling = {
      recordUsage: jest.fn(),
      getUsageSummary: jest.fn(),
    };
    service = new PayService(
      mockPool as unknown as Pool,
      mockStripe as unknown as StripeFboService,
      mockLedger as unknown as LedgerService,
      mockTruthLog as unknown as TruthLogService,
      mockBilling as unknown as BillingService,
    );
  });

  it('returns configured prices in cents', () => {
    expect(service.getPrices()).toEqual({
      currency: 'USD',
      monthlySubscriptionCents: MONTHLY_SUBSCRIPTION_PRICE,
      ticketPriceCents: TICKET_PRICE_BASE,
    });
  });

  it('purchases a contract ticket through the idempotent IAP flow', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ stripe_customer_id: 'cus_test', account_id: 'acct-user' }],
    });
    mockStripe.holdStake.mockResolvedValueOnce({ id: 'pi_ticket' });
    mockStripe.captureStake.mockResolvedValueOnce({
      id: 'pi_ticket',
      status: 'succeeded',
    });
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'acct-revenue' }] });
    mockLedger.recordTransaction.mockResolvedValueOnce('entry-1');
    mockTruthLog.appendEvent.mockResolvedValueOnce('event-1');

    await expect(
      service.purchaseTicket('user-1', 'contract-1'),
    ).resolves.toEqual({
      paymentIntentId: 'pi_ticket',
      amount: TICKET_PRICE_BASE,
    });

    expect(mockStripe.holdStake).toHaveBeenCalledWith(
      'cus_test',
      TICKET_PRICE_BASE,
      'contract-1',
      'styx_iap_user-1_contract-1',
    );
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acct-user',
      'acct-revenue',
      TICKET_PRICE_BASE,
      'contract-1',
      { type: 'TICKET_PURCHASE', userId: 'user-1' },
      undefined,
      'styx_iap_user-1_contract-1',
    );
    expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('TICKET_PURCHASED', {
      userId: 'user-1',
      contractId: 'contract-1',
      amount: TICKET_PRICE_BASE,
      paymentIntentId: 'pi_ticket',
    });
  });

  it('records metered usage for the caller enterprise', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ enterprise_id: 'ent-001', role: 'ADMIN' }],
    });
    mockBilling.recordUsage.mockResolvedValueOnce(undefined);

    await expect(
      service.recordMeteredUsage('user-1', {
        enterpriseId: 'ent-001',
        metric: 'phash_scan',
        quantity: 3,
        eventId: 'evt-001',
      }),
    ).resolves.toEqual({
      status: 'recorded',
      enterpriseId: 'ent-001',
      metric: 'phash_scan',
      quantity: 3,
    });

    expect(mockBilling.recordUsage).toHaveBeenCalledWith(
      'ent-001',
      'phash_scan',
      3,
      'evt-001',
    );
  });

  it('rejects metered usage for another enterprise', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ enterprise_id: 'ent-001', role: 'ADMIN' }],
    });

    await expect(
      service.recordMeteredUsage('user-1', {
        enterpriseId: 'ent-002',
        metric: 'gemini_call',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockBilling.recordUsage).not.toHaveBeenCalled();
  });

  it('returns metered usage summary after enterprise authorization', async () => {
    const summary = {
      totalUsage: 7,
      currentPeriodStart: new Date('2026-06-01T00:00:00.000Z'),
      currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z'),
    };
    mockPool.query.mockResolvedValueOnce({
      rows: [{ enterprise_id: 'ent-001', role: 'ADMIN' }],
    });
    mockBilling.getUsageSummary.mockResolvedValueOnce(summary);

    await expect(
      service.getMeteredUsageSummary('user-1', 'ent-001'),
    ).resolves.toBe(summary);

    expect(mockBilling.getUsageSummary).toHaveBeenCalledWith('ent-001');
  });
});

import { PayController } from './pay.controller';
import { PayService } from './pay.service';

describe('PayController', () => {
  const payService = {
    getPrices: jest.fn(),
    purchaseTicket: jest.fn(),
    recordMeteredUsage: jest.fn(),
    getMeteredUsageSummary: jest.fn(),
  } as unknown as jest.Mocked<PayService>;

  let controller: PayController;

  beforeEach(() => {
    controller = new PayController(payService);
    jest.clearAllMocks();
  });

  it('returns pay prices from the service', () => {
    const prices = {
      currency: 'USD' as const,
      monthlySubscriptionCents: 1499,
      ticketPriceCents: 499,
    };
    payService.getPrices.mockReturnValue(prices);

    expect(controller.getPrices()).toBe(prices);
  });

  it('purchases a ticket for the authenticated user', async () => {
    const result = { paymentIntentId: 'pi_123', amount: 499 };
    payService.purchaseTicket.mockResolvedValue(result);

    await expect(
      controller.purchaseTicket({ id: 'user-1' }, 'contract-1'),
    ).resolves.toBe(result);

    expect(payService.purchaseTicket).toHaveBeenCalledWith(
      'user-1',
      'contract-1',
    );
  });

  it('records metered usage for the authenticated admin', async () => {
    const dto = {
      enterpriseId: 'ent-001',
      metric: 'phash_scan' as const,
      quantity: 2,
      eventId: 'evt-001',
    };
    const result = {
      status: 'recorded',
      enterpriseId: 'ent-001',
      metric: 'phash_scan' as const,
      quantity: 2,
    };
    payService.recordMeteredUsage.mockResolvedValue(result);

    await expect(
      controller.recordMeteredUsage({ id: 'admin-1' }, dto),
    ).resolves.toBe(result);

    expect(payService.recordMeteredUsage).toHaveBeenCalledWith(
      'admin-1',
      dto,
    );
  });

  it('gets metered usage summary for the authenticated admin', async () => {
    const summary = {
      totalUsage: 4,
      currentPeriodStart: new Date('2026-06-01T00:00:00.000Z'),
      currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z'),
    };
    payService.getMeteredUsageSummary.mockResolvedValue(summary);

    await expect(
      controller.getMeteredUsageSummary({ id: 'admin-1' }, 'ent-001'),
    ).resolves.toBe(summary);

    expect(payService.getMeteredUsageSummary).toHaveBeenCalledWith(
      'admin-1',
      'ent-001',
    );
  });
});

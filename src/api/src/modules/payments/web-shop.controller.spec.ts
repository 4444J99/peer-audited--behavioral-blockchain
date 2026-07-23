import { Test, TestingModule } from '@nestjs/testing';
import { WebShopController } from './web-shop.controller';
import { PaymentRouterService } from './payment-router.service';
import { CorepayPayoutProvider } from './corepay-payout.provider';
import { StripePayoutProvider } from './stripe-payout.provider';

describe('WebShopController', () => {
  let controller: WebShopController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebShopController],
      providers: [
        PaymentRouterService,
        {
          provide: StripePayoutProvider,
          useValue: { releaseFunds: jest.fn(), captureFunds: jest.fn(), getTransactionStatus: jest.fn() },
        },
        CorepayPayoutProvider,
      ],
    }).compile();

    controller = module.get(WebShopController);
  });

  afterEach(() => {
    delete process.env.COREPAY_API_KEY;
  });

  it('checkout returns mock client secret for low-risk via Stripe (dev)', async () => {
    const result = await controller.checkout({
      amount: 2999,
      currency: 'USD',
      userId: 'user_abc',
    });

    expect(result.processor).toBe('STRIPE');
    expect(result.clientSecret).toContain('pi_stripe_mock_');
  });

  it('checkout returns mock client secret for high-risk via Corepay dev fallback', async () => {
    const result = await controller.checkout({
      amount: 5000,
      currency: 'USD',
      userId: 'user_xyz',
      isHighRisk: true,
    });

    expect(result.processor).toBe('HIGH_RISK_COREPAY');
    expect(result.clientSecret).toContain('tok_corepay_mock_');
  });

  it('checkout throws when Corepay API is unreachable and key is set', async () => {
    process.env.COREPAY_API_KEY = 'test_key';
    process.env.COREPAY_API_URL = 'https://nonexistent.corepay.test';

    await expect(controller.checkout({
      amount: 5000,
      currency: 'USD',
      userId: 'user_fail',
      isHighRisk: true,
    })).rejects.toThrow(/Corepay checkout failed/);
  });
});

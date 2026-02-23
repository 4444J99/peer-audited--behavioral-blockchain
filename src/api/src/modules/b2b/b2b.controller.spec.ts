import { B2BController } from './b2b.controller';
import { BillingService } from './billing.service';
import { WebhookService } from './webhook.service';
import { MetricsService } from './metrics.service';

describe('B2BController', () => {
  let controller: B2BController;

  const mockBilling = {
    recordConsumptionEvent: jest.fn(),
  } as unknown as BillingService;

  const mockWebhook = {
    dispatchEnterpriseMetricEvent: jest.fn(),
  } as unknown as WebhookService;

  const mockMetrics = {
    getEnterpriseMetrics: jest.fn(),
  } as unknown as MetricsService;

  beforeEach(() => {
    controller = new B2BController(mockBilling, mockWebhook, mockMetrics);
    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('should return enterprise metrics for a given enterpriseId', async () => {
      const expected = {
        enterpriseId: 'ent-001',
        totalContracts: 100,
        completedContracts: 80,
        failedContracts: 10,
        activeContracts: 10,
        completionRate: 80,
        avgIntegrityScore: 72,
        totalEmployees: 50,
      };
      (mockMetrics.getEnterpriseMetrics as jest.Mock).mockResolvedValueOnce(expected);

      const result = await controller.getMetrics('ent-001');

      expect(result).toEqual(expected);
      expect(mockMetrics.getEnterpriseMetrics).toHaveBeenCalledWith('ent-001');
    });
  });

  describe('getBilling', () => {
    it('should return billing summary and record consumption event', async () => {
      const result = await controller.getBilling('ent-002');

      expect(result).toEqual({
        enterpriseId: 'ent-002',
        plan: 'CONSUMPTION',
        events: [],
        totalDue: 0,
        currency: 'USD',
      });
      expect(mockBilling.recordConsumptionEvent).toHaveBeenCalledWith('ent-002', 'BILLING_QUERY');
    });
  });

  describe('registerWebhook', () => {
    it('should register a webhook URL', async () => {
      const result = await controller.registerWebhook({
        enterpriseId: 'ent-003',
        url: 'https://example.com/webhook',
      });

      expect(result).toEqual({
        status: 'registered',
        enterpriseId: 'ent-003',
        url: 'https://example.com/webhook',
      });
    });
  });

  describe('testWebhook', () => {
    it('should dispatch a test payload and return sent status', async () => {
      (mockWebhook.dispatchEnterpriseMetricEvent as jest.Mock).mockResolvedValueOnce(true);

      const result = await controller.testWebhook({ url: 'https://example.com/hook' });

      expect(result).toEqual({ status: 'sent' });
      expect(mockWebhook.dispatchEnterpriseMetricEvent).toHaveBeenCalledWith(
        'https://example.com/hook',
        expect.objectContaining({ type: 'TEST' }),
      );
    });

    it('should return failed status when dispatch fails', async () => {
      (mockWebhook.dispatchEnterpriseMetricEvent as jest.Mock).mockResolvedValueOnce(false);

      const result = await controller.testWebhook({ url: 'https://bad.com/hook' });

      expect(result).toEqual({ status: 'failed' });
    });
  });
});

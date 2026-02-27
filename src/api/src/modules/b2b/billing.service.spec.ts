import { BillingService } from './billing.service';

// Mock Stripe at module level
const mockCreateUsageRecord = jest.fn();
const mockSearchSubscriptions = jest.fn();
const mockListUsageRecordSummaries = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    subscriptions: {
      search: mockSearchSubscriptions,
    },
    subscriptionItems: {
      createUsageRecord: mockCreateUsageRecord,
      listUsageRecordSummaries: mockListUsageRecordSummaries,
    },
  }));
});

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(() => {
    service = new BillingService();
    jest.clearAllMocks();
  });

  describe('recordConsumptionEvent', () => {
    it('should log and record a consumption event', async () => {
      mockSearchSubscriptions.mockResolvedValue({
        data: [{
          items: {
            data: [{ id: 'si_metered', price: { recurring: { usage_type: 'metered' } } }],
          },
        }],
      });
      mockCreateUsageRecord.mockResolvedValue({});

      await service.recordConsumptionEvent('ent-001', 'BILLING_QUERY');
      expect(mockCreateUsageRecord).toHaveBeenCalled();
    });
  });

  describe('recordUsage', () => {
    it('should record usage when metered subscription exists', async () => {
      mockSearchSubscriptions.mockResolvedValue({
        data: [{
          items: {
            data: [{ id: 'si_abc', price: { recurring: { usage_type: 'metered' } } }],
          },
        }],
      });
      mockCreateUsageRecord.mockResolvedValue({});

      await service.recordUsage('ent-001', 'phash_scan', 5);
      expect(mockCreateUsageRecord).toHaveBeenCalledWith('si_abc', expect.objectContaining({
        quantity: 5,
        action: 'increment',
      }));
    });

    it('should skip recording when no metered subscription found', async () => {
      mockSearchSubscriptions.mockResolvedValue({ data: [] });

      await service.recordUsage('ent-missing', 'gemini_call');
      expect(mockCreateUsageRecord).not.toHaveBeenCalled();
    });

    it('should default quantity to 1', async () => {
      mockSearchSubscriptions.mockResolvedValue({
        data: [{
          items: { data: [{ id: 'si_def', price: { recurring: { usage_type: 'metered' } } }] },
        }],
      });
      mockCreateUsageRecord.mockResolvedValue({});

      await service.recordUsage('ent-001', 'anomaly_detection');
      expect(mockCreateUsageRecord).toHaveBeenCalledWith('si_def', expect.objectContaining({
        quantity: 1,
      }));
    });

    it('should skip non-metered subscription items', async () => {
      mockSearchSubscriptions.mockResolvedValue({
        data: [{
          items: { data: [{ id: 'si_flat', price: { recurring: { usage_type: 'licensed' } } }] },
        }],
      });

      await service.recordUsage('ent-001', 'phash_scan');
      expect(mockCreateUsageRecord).not.toHaveBeenCalled();
    });
  });

  describe('getUsageSummary', () => {
    it('should return usage summary from Stripe', async () => {
      mockSearchSubscriptions.mockResolvedValue({
        data: [{
          items: { data: [{ id: 'si_sum', price: { recurring: { usage_type: 'metered' } } }] },
        }],
      });
      mockListUsageRecordSummaries.mockResolvedValue({
        data: [{
          total_usage: 42,
          period: { start: 1706745600, end: 1709424000 },
        }],
      });

      const result = await service.getUsageSummary('ent-001');
      expect(result.totalUsage).toBe(42);
      expect(result.currentPeriodStart).toBeInstanceOf(Date);
      expect(result.currentPeriodEnd).toBeInstanceOf(Date);
    });

    it('should return zero usage when no subscription found', async () => {
      mockSearchSubscriptions.mockResolvedValue({ data: [] });

      const result = await service.getUsageSummary('ent-missing');
      expect(result.totalUsage).toBe(0);
    });
  });
});

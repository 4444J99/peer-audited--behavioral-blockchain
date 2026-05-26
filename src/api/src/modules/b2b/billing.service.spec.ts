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

      await service.recordConsumptionEvent('ent-001', 'phash_scan');
      expect(mockCreateUsageRecord).toHaveBeenCalled();
    });
  });

  describe('recordUsage', () => {
    it('should record usage with an idempotent increment when a stable event id is supplied (PM21)', async () => {
      mockSearchSubscriptions.mockResolvedValue({
        data: [{
          items: {
            data: [{ id: 'si_abc', price: { recurring: { usage_type: 'metered' } } }],
          },
        }],
      });
      mockCreateUsageRecord.mockResolvedValue({});

      await service.recordUsage('ent-001', 'phash_scan', 5, 'evt-xyz');
      expect(mockCreateUsageRecord).toHaveBeenCalledWith(
        'si_abc',
        expect.objectContaining({ quantity: 5, action: 'increment' }),
        { idempotencyKey: 'styx_usage_si_abc_evt-xyz' },
      );
    });

    it('should fall back to an idempotent set + keyed idempotency when no event id is supplied (PM21)', async () => {
      mockSearchSubscriptions.mockResolvedValue({
        data: [{
          items: {
            data: [{ id: 'si_abc', price: { recurring: { usage_type: 'metered' } } }],
          },
        }],
      });
      mockCreateUsageRecord.mockResolvedValue({});

      await service.recordUsage('ent-001', 'phash_scan', 5);
      const call = mockCreateUsageRecord.mock.calls[0];
      expect(call[0]).toBe('si_abc');
      expect(call[1]).toEqual(expect.objectContaining({ quantity: 5, action: 'set' }));
      expect(call[2].idempotencyKey).toMatch(/^styx_usage_si_abc_phash_scan_\d+$/);
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
      expect(mockCreateUsageRecord).toHaveBeenCalledWith(
        'si_def',
        expect.objectContaining({ quantity: 1 }),
        expect.objectContaining({ idempotencyKey: expect.any(String) }),
      );
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

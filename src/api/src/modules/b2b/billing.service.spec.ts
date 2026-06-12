import { BillingService } from './billing.service';

// Mock Stripe at module level
const mockCreateMeterEvent = jest.fn();
const mockSearchSubscriptions = jest.fn();
const mockListMeters = jest.fn();
const mockListEventSummaries = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    subscriptions: {
      search: mockSearchSubscriptions,
    },
    billing: {
      meterEvents: {
        create: mockCreateMeterEvent,
      },
      meters: {
        list: mockListMeters,
        listEventSummaries: mockListEventSummaries,
      },
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
          customer: 'cus_ent_001',
          items: {
            data: [{
              id: 'si_metered',
              current_period_start: 1706745600,
              current_period_end: 1709424000,
              price: { recurring: { usage_type: 'metered' } },
            }],
          },
        }],
      });
      mockCreateMeterEvent.mockResolvedValue({});

      await service.recordConsumptionEvent('ent-001', 'phash_scan');
      expect(mockCreateMeterEvent).toHaveBeenCalled();
    });
  });

  describe('recordUsage', () => {
    it('should record usage with an idempotent increment when a stable event id is supplied (PM21)', async () => {
      mockSearchSubscriptions.mockResolvedValue({
        data: [{
          customer: 'cus_ent_001',
          items: {
            data: [{
              id: 'si_abc',
              current_period_start: 1706745600,
              current_period_end: 1709424000,
              price: { recurring: { usage_type: 'metered' } },
            }],
          },
        }],
      });
      mockCreateMeterEvent.mockResolvedValue({});

      await service.recordUsage('ent-001', 'phash_scan', 5, 'evt-xyz');
      expect(mockCreateMeterEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_name: 'phash_scan',
          identifier: 'styx_usage_si_abc_evt-xyz',
          payload: expect.objectContaining({
            stripe_customer_id: 'cus_ent_001',
            value: '5',
          }),
        }),
        { idempotencyKey: 'styx_usage_si_abc_evt-xyz' },
      );
    });

    it('should fall back to a deterministic daily event identifier when no event id is supplied (PM21)', async () => {
      mockSearchSubscriptions.mockResolvedValue({
        data: [{
          customer: 'cus_ent_001',
          items: {
            data: [{
              id: 'si_abc',
              current_period_start: 1706745600,
              current_period_end: 1709424000,
              price: { recurring: { usage_type: 'metered' } },
            }],
          },
        }],
      });
      mockCreateMeterEvent.mockResolvedValue({});

      await service.recordUsage('ent-001', 'phash_scan', 5);
      const call = mockCreateMeterEvent.mock.calls[0];
      expect(call[0]).toEqual(expect.objectContaining({
        event_name: 'phash_scan',
        payload: expect.objectContaining({ value: '5' }),
      }));
      expect(call[0].identifier).toMatch(/^styx_usage_si_abc_phash_scan_\d+$/);
      expect(call[1].idempotencyKey).toBe(call[0].identifier);
    });

    it('should skip recording when no metered subscription found', async () => {
      mockSearchSubscriptions.mockResolvedValue({ data: [] });

      await service.recordUsage('ent-missing', 'gemini_call');
      expect(mockCreateMeterEvent).not.toHaveBeenCalled();
    });

    it('should default quantity to 1', async () => {
      mockSearchSubscriptions.mockResolvedValue({
        data: [{
          customer: 'cus_ent_001',
          items: {
            data: [{
              id: 'si_def',
              current_period_start: 1706745600,
              current_period_end: 1709424000,
              price: { recurring: { usage_type: 'metered' } },
            }],
          },
        }],
      });
      mockCreateMeterEvent.mockResolvedValue({});

      await service.recordUsage('ent-001', 'anomaly_detection');
      expect(mockCreateMeterEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_name: 'anomaly_detection',
          payload: expect.objectContaining({ value: '1' }),
        }),
        expect.objectContaining({ idempotencyKey: expect.any(String) }),
      );
    });

    it('should skip non-metered subscription items', async () => {
      mockSearchSubscriptions.mockResolvedValue({
        data: [{
          customer: 'cus_ent_001',
          items: { data: [{ id: 'si_flat', price: { recurring: { usage_type: 'licensed' } } }] },
        }],
      });

      await service.recordUsage('ent-001', 'phash_scan');
      expect(mockCreateMeterEvent).not.toHaveBeenCalled();
    });
  });

  describe('getUsageSummary', () => {
    it('should return usage summary from Stripe', async () => {
      mockSearchSubscriptions.mockResolvedValue({
        data: [{
          customer: 'cus_ent_001',
          items: {
            data: [{
              id: 'si_sum',
              current_period_start: 1706745600,
              current_period_end: 1709424000,
              price: { recurring: { usage_type: 'metered' } },
            }],
          },
        }],
      });
      mockListMeters.mockResolvedValue({
        data: [
          { id: 'meter_phash', event_name: 'phash_scan' },
          { id: 'meter_other', event_name: 'other_metric' },
        ],
      });
      mockListEventSummaries.mockResolvedValue({ data: [{ aggregated_value: 42 }] });

      const result = await service.getUsageSummary('ent-001');
      expect(result.totalUsage).toBe(42);
      expect(mockListEventSummaries).toHaveBeenCalledWith(
        'meter_phash',
        expect.objectContaining({
          customer: 'cus_ent_001',
          start_time: 1706745600,
          end_time: 1709424000,
        }),
      );
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

import { ConsumptionBillingService } from './billing.service';

describe('ConsumptionBillingService', () => {
  let service: ConsumptionBillingService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new ConsumptionBillingService(mockPool as any);
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should insert a consumption log entry', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await service.trackEvent('ent-001', 'AI_INSIGHTS', 3);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO consumption_logs'),
        ['ent-001', 'AI_INSIGHTS', 3],
      );
    });

    it('should default units to 1', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await service.trackEvent('ent-001', 'API_CALLS');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO consumption_logs'),
        ['ent-001', 'API_CALLS', 1],
      );
    });

    it('should propagate database errors', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('connection refused'));

      await expect(service.trackEvent('ent-001', 'API_CALLS')).rejects.toThrow('connection refused');
    });
  });

  describe('getCurrentUsage', () => {
    it('should return aggregated usage for the current billing period', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { event_type: 'AI_INSIGHTS', total: 142 },
          { event_type: 'API_CALLS', total: 5430 },
        ],
      });

      const result = await service.getCurrentUsage('ent-001');

      expect(result.enterpriseId).toBe('ent-001');
      expect(result.usage).toEqual({ AI_INSIGHTS: 142, API_CALLS: 5430 });
      expect(result.billingPeriodStart).toBeDefined();
      expect(result.billingPeriodEnd).toBeDefined();
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT event_type'),
        expect.arrayContaining(['ent-001']),
      );
    });

    it('should return empty usage when no events recorded', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.getCurrentUsage('ent-new');

      expect(result.enterpriseId).toBe('ent-new');
      expect(result.usage).toEqual({});
    });

    it('should query within the current month boundaries', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.getCurrentUsage('ent-001');

      const [, params] = mockPool.query.mock.calls[0];
      const periodStart = new Date(params[1]);
      const periodEnd = new Date(params[2]);

      expect(periodStart.getDate()).toBe(1);
      expect(periodStart.getHours()).toBe(0);
      expect(periodEnd.getTime()).toBeGreaterThan(periodStart.getTime());
    });
  });

  describe('getUsageHistory', () => {
    it('should return usage grouped by month', async () => {
      const jan = new Date('2026-01-01T00:00:00Z');
      const feb = new Date('2026-02-01T00:00:00Z');

      mockPool.query.mockResolvedValueOnce({
        rows: [
          { event_type: 'API_CALLS', total: 100, period: feb },
          { event_type: 'AI_INSIGHTS', total: 50, period: feb },
          { event_type: 'API_CALLS', total: 200, period: jan },
        ],
      });

      const result = await service.getUsageHistory('ent-001', 3);

      expect(result).toHaveLength(2);
      expect(result[0].usage).toEqual({ API_CALLS: 100, AI_INSIGHTS: 50 });
      expect(result[1].usage).toEqual({ API_CALLS: 200 });
      expect(result[0].enterpriseId).toBe('ent-001');
    });

    it('should default to 6 months of history', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.getUsageHistory('ent-001');

      const [, params] = mockPool.query.mock.calls[0];
      expect(params[1]).toBe(6);
    });

    it('should return empty array when no historical data exists', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.getUsageHistory('ent-new');
      expect(result).toEqual([]);
    });
  });
});

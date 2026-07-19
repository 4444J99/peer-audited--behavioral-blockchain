import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new MetricsService(mockPool as any);
  });

  describe('getEnterpriseMetrics', () => {
    it('should return aggregated metrics for an enterprise', async () => {
      // Employee stats
      mockPool.query.mockResolvedValueOnce({
        rows: [{ total: '3', avg_integrity: '85.5' }],
      });

      // Contract stats
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          total_contracts: '10',
          completed: '7',
          failed: '2',
          active: '1',
        }],
      });

      const result = await service.getEnterpriseMetrics('ent-001');

      expect(result).toEqual({
        enterpriseId: 'ent-001',
        totalContracts: 10,
        completedContracts: 7,
        failedContracts: 2,
        activeContracts: 1,
        completionRate: 70,
        avgIntegrityScore: 86,
        totalEmployees: 3,
      });
    });

    it('should return zero completion rate when no contracts exist', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ total: '0', avg_integrity: null }],
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          total_contracts: '0',
          completed: '0',
          failed: '0',
          active: '0',
        }],
      });

      const result = await service.getEnterpriseMetrics('ent-empty');

      expect(result.completionRate).toBe(0);
      expect(result.avgIntegrityScore).toBe(0);
      expect(result.totalEmployees).toBe(0);
    });
  });
});

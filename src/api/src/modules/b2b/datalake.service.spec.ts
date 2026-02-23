import { DataLakeService } from './datalake.service';
import { AnonymizeService } from './anonymize.service';

describe('DataLakeService', () => {
  let service: DataLakeService;
  let mockPool: { query: jest.Mock };
  let anonymize: AnonymizeService;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    anonymize = new AnonymizeService();
    service = new DataLakeService(mockPool as any, anonymize);
  });

  describe('extractSnapshot', () => {
    it('should return a complete snapshot with all three sections', async () => {
      // Contract metrics query
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          oath_category: 'BIOLOGICAL',
          total_created: '5',
          total_completed: '3',
          total_failed: '1',
          avg_stake: '25.50',
          avg_duration: '30',
        }],
      });

      // Behavioral trends query
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          month: '2026-01',
          new_contracts: '5',
          completions: '3',
          failures: '1',
          avg_integrity_delta: '-1.7',
        }],
      });

      // Cohort analysis query
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          cohort_month: '2025-12',
          employee_count: '10',
          avg_integrity_score: '75',
          avg_completion_rate: '70',
          retention_rate: '80',
        }],
      });

      const result = await service.extractSnapshot('ent-001', '2026-01-01', '2026-02-01');

      expect(result.enterpriseId).toBe('ent-001');
      expect(result.period).toEqual({ start: '2026-01-01', end: '2026-02-01' });
      expect(result.contractMetrics).toHaveLength(1);
      expect(result.contractMetrics[0].oathCategory).toBe('BIOLOGICAL');
      expect(result.contractMetrics[0].completionRate).toBe(60);
      expect(result.behavioralTrends).toHaveLength(1);
      expect(result.behavioralTrends[0].month).toBe('2026-01');
      expect(result.behavioralTrends[0].avgIntegrityDelta).toBe(-1.7);
      expect(result.cohortAnalysis).toHaveLength(1);
      expect(result.cohortAnalysis[0].retentionRate).toBe(80);
    });

    it('should not contain any PII fields in output', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.extractSnapshot('ent-001', '2026-01-01', '2026-02-01');
      const json = JSON.stringify(result);

      expect(json).not.toContain('email');
      expect(json).not.toContain('password');
      expect(json).not.toContain('stripe');
    });
  });

  describe('extractSnapshot with empty data', () => {
    it('should handle enterprises with no data', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.extractSnapshot('ent-empty', '2026-01-01', '2026-02-01');

      expect(result.contractMetrics).toEqual([]);
      expect(result.behavioralTrends).toEqual([]);
      expect(result.cohortAnalysis).toEqual([]);
    });
  });

  describe('setupReplicationSlot', () => {
    it('should create a new replication slot', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.setupReplicationSlot('test_slot');
      expect(result.created).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('pg_create_logical_replication_slot'),
        ['test_slot'],
      );
    });

    it('should handle already-existing slot gracefully', async () => {
      const error: any = new Error('already exists');
      error.code = '42710';
      mockPool.query.mockRejectedValueOnce(error);

      const result = await service.setupReplicationSlot('existing_slot');
      expect(result.created).toBe(false);
    });

    it('should propagate unexpected errors', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('connection failed'));

      await expect(service.setupReplicationSlot()).rejects.toThrow('connection failed');
    });
  });
});

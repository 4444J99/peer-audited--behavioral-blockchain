import { OstrichDetectionService } from './ostrich-detection.service';

describe('OstrichDetectionService', () => {
  let service: OstrichDetectionService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new OstrichDetectionService(mockPool as any);
  });

  describe('detectAtRiskUsers', () => {
    it('returns users with low engagement', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            user_id: 'user-1',
            active_contracts: 2,
            days_since_last_active: 5,
            consecutive_missed_proofs: 2,
          },
          {
            user_id: 'user-2',
            active_contracts: 1,
            days_since_last_active: 10,
            consecutive_missed_proofs: 6,
          },
        ],
      });

      const users = await service.detectAtRiskUsers();

      expect(users).toHaveLength(2);
      expect(users[0].riskLevel).toBe('MEDIUM');
      expect(users[1].riskLevel).toBe('HIGH');
      expect(users[0].activeContracts).toBe(2);
    });

    it('returns empty array when no at-risk users', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const users = await service.detectAtRiskUsers();

      expect(users).toEqual([]);
    });

    it('classifies by days since last active correctly', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            user_id: 'user-med',
            active_contracts: 1,
            days_since_last_active: 3,
            consecutive_missed_proofs: 0,
          },
          {
            user_id: 'user-med2',
            active_contracts: 1,
            days_since_last_active: 5,
            consecutive_missed_proofs: 0,
          },
          {
            user_id: 'user-high',
            active_contracts: 1,
            days_since_last_active: 8,
            consecutive_missed_proofs: 0,
          },
        ],
      });

      const users = await service.detectAtRiskUsers();

      expect(users.find((u) => u.userId === 'user-med')?.riskLevel).toBe('MEDIUM');
      expect(users.find((u) => u.userId === 'user-med2')?.riskLevel).toBe('MEDIUM');
      expect(users.find((u) => u.userId === 'user-high')?.riskLevel).toBe('HIGH');
    });
  });

  describe('recordMissedProof', () => {
    it('increments consecutive_missed_proofs', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      await service.recordMissedProof('user-1');

      expect(mockPool.query.mock.calls[0][0]).toContain('consecutive_missed_proofs = consecutive_missed_proofs + 1');
      expect(mockPool.query.mock.calls[0][1]).toEqual(['user-1']);
    });
  });

  describe('resetMissedProofs', () => {
    it('resets counter to 0', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      await service.resetMissedProofs('user-1');

      expect(mockPool.query.mock.calls[0][0]).toContain('consecutive_missed_proofs = 0');
    });
  });
});

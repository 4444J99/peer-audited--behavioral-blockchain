import { OstrichScheduler } from './ostrich-scheduler';

describe('OstrichScheduler', () => {
  let scheduler: OstrichScheduler;
  let mockDetection: { detectAtRiskUsers: jest.Mock };
  let mockNotifications: { create: jest.Mock };

  beforeEach(() => {
    mockDetection = { detectAtRiskUsers: jest.fn() };
    mockNotifications = { create: jest.fn().mockResolvedValue({}) };
    scheduler = new OstrichScheduler(mockDetection as any, mockNotifications as any);
  });

  describe('detectAndIntervene', () => {
    it('sends intervention for at-risk users', async () => {
      mockDetection.detectAtRiskUsers.mockResolvedValueOnce([
        {
          userId: 'user-1',
          activeContracts: 2,
          daysSinceLastActive: 5,
          consecutiveMissedProofs: 2,
          riskLevel: 'MEDIUM',
        },
        {
          userId: 'user-2',
          activeContracts: 1,
          daysSinceLastActive: 10,
          consecutiveMissedProofs: 6,
          riskLevel: 'HIGH',
        },
      ]);

      await scheduler.detectAndIntervene();

      expect(mockNotifications.create).toHaveBeenCalledTimes(2);
      expect(mockNotifications.create.mock.calls[0][0].type).toBe('OSTRICH_MEDIUM');
      expect(mockNotifications.create.mock.calls[1][0].type).toBe('OSTRICH_HIGH');
    });

    it('skips if no at-risk users', async () => {
      mockDetection.detectAtRiskUsers.mockResolvedValueOnce([]);

      await scheduler.detectAndIntervene();

      expect(mockNotifications.create).not.toHaveBeenCalled();
    });

    it('handles missing notification service gracefully', async () => {
      const schedulerWithoutNotifications = new OstrichScheduler(mockDetection as any, undefined);
      mockDetection.detectAtRiskUsers.mockResolvedValueOnce([
        { userId: 'user-1', activeContracts: 1, daysSinceLastActive: 5, consecutiveMissedProofs: 2, riskLevel: 'MEDIUM' },
      ]);

      await schedulerWithoutNotifications.detectAndIntervene();

      // Should not throw
    });
  });
});

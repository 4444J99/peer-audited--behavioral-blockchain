import { RationalizationController } from './rationalization.controller';

describe('RationalizationController', () => {
  let controller: RationalizationController;
  let mockService: { classify: jest.Mock; getHistory: jest.Mock };

  beforeEach(() => {
    mockService = {
      classify: jest.fn(),
      getHistory: jest.fn(),
    };
    controller = new RationalizationController(mockService as any);
  });

  describe('classify', () => {
    it('returns classification result', async () => {
      mockService.classify.mockResolvedValueOnce({
        category: 'PURE_RATIONALIZATION',
        confidence: 0.85,
        reasoning: 'Typical avoidance',
        response: 'reframe message',
      });

      const result = await controller.classify(
        { id: 'user-1' },
        { text: 'I am too busy', contextType: 'GRACE_DAY' },
      );

      expect(result.category).toBe('PURE_RATIONALIZATION');
      expect(mockService.classify).toHaveBeenCalledWith('user-1', 'I am too busy', 'GRACE_DAY', undefined);
    });

    it('returns error for short text', async () => {
      const result = await controller.classify(
        { id: 'user-1' },
        { text: 'hi', contextType: 'GRACE_DAY' },
      );

      expect(result).toEqual({ error: 'Text must be at least 5 characters' });
    });
  });

  describe('history', () => {
    it('returns classification history', async () => {
      mockService.getHistory.mockResolvedValueOnce({
        totalLogs: 2,
        genuineEmergency: 0,
        legitimateButNotBlocking: 1,
        pureRationalization: 1,
        recentLogs: [],
      });

      const result = await controller.history({ id: 'user-1' });

      expect(result.totalLogs).toBe(2);
    });
  });
});

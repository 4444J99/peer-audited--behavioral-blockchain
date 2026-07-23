import { RationalizationService } from './rationalization.service';

jest.mock('../../../services/intelligence/GeminiClient', () => ({
  callGemini: jest.fn(),
}));

import { callGemini } from '../../../services/intelligence/GeminiClient';

describe('RationalizationService', () => {
  let service: RationalizationService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new RationalizationService(mockPool as any);
    jest.clearAllMocks();
  });

  describe('classify', () => {
    it('returns GENUINE_EMERGENCY when Gemini classifies as such', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ totalLogs: 0, genuineEmergency: 0, legitimateButNotBlocking: 0, pureRationalization: 0 }] });
      (callGemini as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({ category: 'GENUINE_EMERGENCY', confidence: 0.95, reasoning: 'Medical emergency described' }),
      );

      const result = await service.classify('user-1', 'I was in a car accident', 'GRACE_DAY');

      expect(result.category).toBe('GENUINE_EMERGENCY');
      expect(result.confidence).toBe(0.95);
      expect(result.response).toContain('waiving any penalties');
    });

    it('returns PURE_RATIONALIZATION with escalating response for repeat offenders', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ totalLogs: 5, genuineEmergency: 0, legitimateButNotBlocking: 1, pureRationalization: 4 }] });
      (callGemini as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({ category: 'PURE_RATIONALIZATION', confidence: 0.88, reasoning: 'Classic avoidance pattern' }),
      );

      const result = await service.classify('user-1', 'I am too tired to do this today', 'PROOF_FAILURE');

      expect(result.category).toBe('PURE_RATIONALIZATION');
      expect(result.response).toContain("You've used similar reasoning");
      expect(result.response).toContain('Pressfield');
    });

    it('falls back to LEGITIMATE_BUT_NOT_BLOCKING when Gemini fails', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ totalLogs: 0, genuineEmergency: 0, legitimateButNotBlocking: 0, pureRationalization: 0 }] });
      (callGemini as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      const result = await service.classify('user-1', 'I have a lot of work today', 'GRACE_DAY');

      expect(result.category).toBe('LEGITIMATE_BUT_NOT_BLOCKING');
      expect(result.confidence).toBe(0.5);
      expect(result.reasoning).toContain('Fallback');
    });

    it('logs the classification to the database', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ totalLogs: 0, genuineEmergency: 0, legitimateButNotBlocking: 0, pureRationalization: 0 }] });
      (callGemini as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({ category: 'PURE_RATIONALIZATION', confidence: 0.75, reasoning: 'Victimhood narrative' }),
      );

      await service.classify('user-1', 'Everyone else has it easier than me', 'DISPUTE_NARRATIVE', 'dispute-1');

      const insertCall = mockPool.query.mock.calls[1];
      expect(insertCall[0]).toContain('INSERT INTO rationalization_log');
      expect(insertCall[1]).toContain('user-1');
      expect(insertCall[1]).toContain('PURE_RATIONALIZATION');
    });
  });

  describe('getHistory', () => {
    it('returns aggregated history with recent logs', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ totalLogs: 3, genuineEmergency: 1, legitimateButNotBlocking: 1, pureRationalization: 1 }] })
        .mockResolvedValueOnce({
          rows: [
            { id: 'r1', context_type: 'GRACE_DAY', classification: 'PURE_RATIONALIZATION', raw_text: 'test', created_at: new Date() },
          ],
        });

      const history = await service.getHistory('user-1');

      expect(history.totalLogs).toBe(3);
      expect(history.pureRationalization).toBe(1);
      expect(history.recentLogs).toHaveLength(1);
    });
  });
});

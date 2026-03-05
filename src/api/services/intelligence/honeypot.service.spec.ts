import { HoneypotService } from './honeypot.service';
import { FuryRouterService } from '../fury-router/fury-router.service';

describe('HoneypotInjectorService', () => {
  let honeypotService: HoneypotService;

  const mockRouter = {
    routeProof: jest.fn(),
  } as unknown as FuryRouterService;

  const mockPool = { query: jest.fn(), connect: jest.fn() };
  const mockTruthLog = { appendEvent: jest.fn() };

  beforeEach(() => {
    honeypotService = new HoneypotService(mockPool as any, mockRouter, mockTruthLog as any);
    jest.clearAllMocks();
  });

  describe('injectHoneypot', () => {
    it('should query for furies and inject honeypot proof', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '10' }] });
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'contract-abc', user_id: 'user-xyz' }] });
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'proof-hp-123' }] });
      (mockRouter.routeProof as jest.Mock).mockResolvedValueOnce('mock-job-123');

      await honeypotService.injectHoneypot();

      expect(mockRouter.routeProof).toHaveBeenCalledWith('proof-hp-123', 'user-xyz', 3);
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('HONEYPOT_INJECTED', expect.any(Object));
    });

    it('should skip injection if not enough furies', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '1' }] });

      await honeypotService.injectHoneypot();

      expect(mockRouter.routeProof).not.toHaveBeenCalled();
    });

    it('should skip injection if no active contracts', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '5' }] }); // enough furies
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // no contracts

      await honeypotService.injectHoneypot();

      expect(mockRouter.routeProof).not.toHaveBeenCalled();
    });
  });

  describe('gradeHoneypotPerformance', () => {
    let gradeClient: { query: jest.Mock; release: jest.Mock };

    beforeEach(() => {
      gradeClient = { query: jest.fn(), release: jest.fn() };
      (mockPool.connect as jest.Mock).mockResolvedValue(gradeClient);
    });

    it('should boost furies who correctly voted FAIL on honeypot', async () => {
      gradeClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({
          rows: [
            { fury_user_id: 'fury-1', verdict: 'FAIL' },
            { fury_user_id: 'fury-2', verdict: 'FAIL' },
          ],
        }) // SELECT assignments
        .mockResolvedValueOnce({ rows: [] }) // UPDATE fury-1 (+5)
        .mockResolvedValueOnce({ rows: [] }) // UPDATE fury-2 (+5)
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      await honeypotService.gradeHoneypotPerformance('proof-hp-1', []);

      // Two correct furies → two UPDATE calls with +5
      const updateCalls = gradeClient.query.mock.calls.filter(
        ([sql]: [string]) => typeof sql === 'string' && sql.includes('UPDATE users'),
      );
      expect(updateCalls).toHaveLength(2);
      expect(updateCalls[0][1][0]).toBe(5); // +5 bonus
      expect(updateCalls[1][1][0]).toBe(5);
      expect(gradeClient.query).toHaveBeenCalledWith('COMMIT');
      expect(gradeClient.release).toHaveBeenCalled();
    });

    it('should penalize furies who incorrectly voted PASS on honeypot', async () => {
      gradeClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({
          rows: [
            { fury_user_id: 'fury-3', verdict: 'PASS' },
          ],
        }) // SELECT assignments
        .mockResolvedValueOnce({ rows: [] }) // UPDATE fury-3 (-5)
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      await honeypotService.gradeHoneypotPerformance('proof-hp-2', ['fury-3']);

      const updateCalls = gradeClient.query.mock.calls.filter(
        ([sql]: [string]) => typeof sql === 'string' && sql.includes('UPDATE users'),
      );
      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0][1][0]).toBe(-5); // -5 penalty
    });

    it('should handle mixed correct and incorrect verdicts', async () => {
      gradeClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({
          rows: [
            { fury_user_id: 'fury-a', verdict: 'FAIL' }, // correct
            { fury_user_id: 'fury-b', verdict: 'PASS' }, // incorrect
            { fury_user_id: 'fury-c', verdict: 'FAIL' }, // correct
          ],
        })
        .mockResolvedValueOnce({ rows: [] }) // UPDATE fury-a (+5)
        .mockResolvedValueOnce({ rows: [] }) // UPDATE fury-b (-5)
        .mockResolvedValueOnce({ rows: [] }) // UPDATE fury-c (+5)
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      await honeypotService.gradeHoneypotPerformance('proof-hp-3', ['fury-b']);

      const updateCalls = gradeClient.query.mock.calls.filter(
        ([sql]: [string]) => typeof sql === 'string' && sql.includes('UPDATE users'),
      );
      expect(updateCalls).toHaveLength(3);
      expect(updateCalls[0][1][0]).toBe(5);   // fury-a correct
      expect(updateCalls[1][1][0]).toBe(-5);  // fury-b incorrect
      expect(updateCalls[2][1][0]).toBe(5);   // fury-c correct

      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('HONEYPOT_GRADED', expect.objectContaining({
        proofId: 'proof-hp-3',
        totalReviewers: 3,
        correctCount: 2,
        incorrectCount: 1,
      }));
    });

    it('should ROLLBACK and re-throw on database error', async () => {
      gradeClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Connection lost')); // SELECT fails

      await expect(honeypotService.gradeHoneypotPerformance('proof-hp-4', []))
        .rejects
        .toThrow('Connection lost');

      expect(gradeClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(gradeClient.release).toHaveBeenCalled();
    });

    it('should handle no assignments gracefully', async () => {
      gradeClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // no assignments
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      await honeypotService.gradeHoneypotPerformance('proof-hp-5', []);

      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('HONEYPOT_GRADED', expect.objectContaining({
        totalReviewers: 0,
        correctCount: 0,
      }));
    });
  });
});

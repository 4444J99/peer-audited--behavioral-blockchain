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
    beforeEach(() => {
      jest.spyOn(Math, 'random').mockReturnValue(0); // Force probability to pass
    });

    afterEach(() => {
      jest.spyOn(Math, 'random').mockRestore();
    });

    it('should query for furies and inject honeypot proof', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // shouldInject volume
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // active furies
        .mockResolvedValueOnce({ rows: [{ id: 'contract-abc', user_id: 'user-xyz' }] }) // host contract
        .mockResolvedValueOnce({ rows: [{ id: 'proof-hp-123' }] }); // proof insert
      
      (mockRouter.routeProof as jest.Mock).mockResolvedValueOnce('mock-job-123');

      await honeypotService.injectHoneypot();

      expect(mockRouter.routeProof).toHaveBeenCalledWith('proof-hp-123', 'user-xyz', 3);
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('HONEYPOT_INJECTED', expect.any(Object));
    });

    it('should scale injection probability with volume (Theorem 7)', async () => {
      // With 50 recent audits, probability should be 0.1 + (50/100) = 0.6, capped at 0.5
      // With 5 recent audits, probability should be 0.1 + 0.05 = 0.15
      
      // Case A: Low volume (5 audits) -> 0.15 prob
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '5' }] });
      jest.spyOn(Math, 'random').mockReturnValue(0.14); // Passes
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '10' }] }); // active furies
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'c1', user_id: 'u1' }] });
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'p1' }] });
      await honeypotService.injectHoneypot();
      expect(mockRouter.routeProof).toHaveBeenCalledTimes(1);

      // Case B: High volume (100 audits) -> 0.5 prob cap
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '100' }] });
      jest.spyOn(Math, 'random').mockReturnValue(0.49); // Passes
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '10' }] }); // active furies
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'c2', user_id: 'u2' }] });
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'p2' }] });
      await honeypotService.injectHoneypot();
      expect(mockRouter.routeProof).toHaveBeenCalledTimes(2);

      // Case C: Just above cap
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '100' }] });
      jest.spyOn(Math, 'random').mockReturnValue(0.51); // Fails
      await honeypotService.injectHoneypot();
      expect(mockRouter.routeProof).toHaveBeenCalledTimes(2); // No increase
    });

    it('should skip injection if probability check fails', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.9); // Probability check fails
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '0' }] }); // low volume -> 10% prob

      await honeypotService.injectHoneypot();

      expect(mockRouter.routeProof).not.toHaveBeenCalled();
    });

    it('should skip injection if not enough furies', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      await honeypotService.injectHoneypot();

      expect(mockRouter.routeProof).not.toHaveBeenCalled();
    });

    it('should skip injection if no active contracts', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // enough furies
        .mockResolvedValueOnce({ rows: [] }); // no contracts

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
        .mockResolvedValueOnce({ rows: [{ integrity_score: 55 }] }) // UPDATE fury-1 (+5)
        .mockResolvedValueOnce({ rows: [{ integrity_score: 60 }] }) // UPDATE fury-2 (+5)
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      await honeypotService.gradeHoneypotPerformance('proof-hp-1', []);

      // Two correct furies → two UPDATE calls with +5
      const updateCalls = gradeClient.query.mock.calls.filter(
        ([sql]: [string]) => typeof sql === 'string' && sql.includes('UPDATE users') && sql.includes('integrity_score'),
      );
      expect(updateCalls).toHaveLength(2);
      expect(updateCalls[0][1][0]).toBe(5); // +5 bonus
      expect(updateCalls[1][1][0]).toBe(5);
      expect(gradeClient.query).toHaveBeenCalledWith('COMMIT');
      expect(gradeClient.release).toHaveBeenCalled();
    });

    it('should penalize furies who incorrectly voted PASS on honeypot and SHADOW_BAN if below threshold', async () => {
      gradeClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({
          rows: [
            { fury_user_id: 'fury-3', verdict: 'PASS' },
          ],
        }) // SELECT assignments
        .mockResolvedValueOnce({ rows: [{ integrity_score: 15 }] }) // UPDATE fury-3 (-5)
        .mockResolvedValueOnce({ rows: [] }) // UPDATE status SHADOW_BANNED
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      await honeypotService.gradeHoneypotPerformance('proof-hp-2', ['fury-3']);

      const scoreUpdateCalls = gradeClient.query.mock.calls.filter(
        ([sql]: [string]) => typeof sql === 'string' && sql.includes('UPDATE users') && sql.includes('integrity_score'),
      );
      expect(scoreUpdateCalls).toHaveLength(1);
      expect(scoreUpdateCalls[0][1][0]).toBe(-5); // -5 penalty

      const statusUpdateCalls = gradeClient.query.mock.calls.filter(
        ([sql]: [string]) => typeof sql === 'string' && sql.includes("status = 'SHADOW_BANNED'"),
      );
      expect(statusUpdateCalls).toHaveLength(1);
      expect(statusUpdateCalls[0][1][0]).toBe('fury-3');
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
        .mockResolvedValueOnce({ rows: [{ integrity_score: 55 }] }) // UPDATE fury-a (+5)
        .mockResolvedValueOnce({ rows: [{ integrity_score: 15 }] }) // UPDATE fury-b (-5)
        .mockResolvedValueOnce({ rows: [] }) // UPDATE status SHADOW_BANNED for fury-b
        .mockResolvedValueOnce({ rows: [{ integrity_score: 60 }] }) // UPDATE fury-c (+5)
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      await honeypotService.gradeHoneypotPerformance('proof-hp-3', ['fury-b']);

      const scoreUpdateCalls = gradeClient.query.mock.calls.filter(
        ([sql]: [string]) => typeof sql === 'string' && sql.includes('UPDATE users') && sql.includes('integrity_score'),
      );
      expect(scoreUpdateCalls).toHaveLength(3);
      expect(scoreUpdateCalls[0][1][0]).toBe(5);   // fury-a correct
      expect(scoreUpdateCalls[1][1][0]).toBe(-5);  // fury-b incorrect
      expect(scoreUpdateCalls[2][1][0]).toBe(5);   // fury-c correct

      const statusUpdateCalls = gradeClient.query.mock.calls.filter(
        ([sql]: [string]) => typeof sql === 'string' && sql.includes("status = 'SHADOW_BANNED'"),
      );
      expect(statusUpdateCalls).toHaveLength(1);
      expect(statusUpdateCalls[0][1][0]).toBe('fury-b');

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

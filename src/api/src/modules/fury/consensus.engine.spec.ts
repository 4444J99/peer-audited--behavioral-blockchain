import { ConsensusEngine, FuryVote } from './consensus.engine';
import { TruthLogService } from '../../../services/ledger/truth-log.service';

describe('ConsensusEngine', () => {
  let engine: ConsensusEngine;

  const mockTruthLog = {
    appendEvent: jest.fn().mockResolvedValue('log-id'),
  } as unknown as TruthLogService;

  beforeEach(() => {
    engine = new ConsensusEngine(mockTruthLog);
    jest.clearAllMocks();
  });

  describe('evaluate', () => {
    it('should return VERIFIED when all 3 Furies vote PASS', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'fury-1', verdict: 'PASS' },
        { furyUserId: 'fury-2', verdict: 'PASS' },
        { furyUserId: 'fury-3', verdict: 'PASS' },
      ];

      const result = await engine.evaluate('proof-1', votes, false);

      expect(result.outcome).toBe('VERIFIED');
      expect(result.flaggedFuries).toHaveLength(0);
    });

    it('should return VERIFIED when 2 of 3 Furies vote PASS', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'fury-1', verdict: 'PASS' },
        { furyUserId: 'fury-2', verdict: 'PASS' },
        { furyUserId: 'fury-3', verdict: 'FAIL' },
      ];

      const result = await engine.evaluate('proof-2', votes, false);

      expect(result.outcome).toBe('VERIFIED');
    });

    it('should return REJECTED when all 3 Furies vote FAIL', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'fury-1', verdict: 'FAIL' },
        { furyUserId: 'fury-2', verdict: 'FAIL' },
        { furyUserId: 'fury-3', verdict: 'FAIL' },
      ];

      const result = await engine.evaluate('proof-3', votes, false);

      expect(result.outcome).toBe('REJECTED');
      expect(result.flaggedFuries).toHaveLength(0);
    });

    it('should return REJECTED when 2 of 3 Furies vote FAIL', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'fury-1', verdict: 'FAIL' },
        { furyUserId: 'fury-2', verdict: 'FAIL' },
        { furyUserId: 'fury-3', verdict: 'PASS' },
      ];

      const result = await engine.evaluate('proof-4', votes, false);

      expect(result.outcome).toBe('REJECTED');
    });

    it('should return SPLIT when there is no 2/3 majority (1 PASS, 1 FAIL with 2 voters)', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'fury-1', verdict: 'PASS' },
        { furyUserId: 'fury-2', verdict: 'FAIL' },
      ];

      const result = await engine.evaluate('proof-5', votes, false);

      expect(result.outcome).toBe('SPLIT');
    });

    it('should flag Furies who voted PASS on a honeypot (known-fail)', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'fury-honest-1', verdict: 'FAIL' },
        { furyUserId: 'fury-honest-2', verdict: 'FAIL' },
        { furyUserId: 'fury-corrupt', verdict: 'PASS' },
      ];

      const result = await engine.evaluate('honeypot-proof-1', votes, true);

      expect(result.outcome).toBe('REJECTED');
      expect(result.flaggedFuries).toEqual(['fury-corrupt']);
    });

    it('should flag all Furies who voted PASS on a honeypot', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'fury-corrupt-1', verdict: 'PASS' },
        { furyUserId: 'fury-corrupt-2', verdict: 'PASS' },
        { furyUserId: 'fury-honest', verdict: 'FAIL' },
      ];

      const result = await engine.evaluate('honeypot-proof-2', votes, true);

      expect(result.flaggedFuries).toEqual(['fury-corrupt-1', 'fury-corrupt-2']);
    });

    it('should NOT flag any Furies on a non-honeypot proof even if they vote PASS', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'fury-1', verdict: 'PASS' },
        { furyUserId: 'fury-2', verdict: 'PASS' },
        { furyUserId: 'fury-3', verdict: 'PASS' },
      ];

      const result = await engine.evaluate('real-proof', votes, false);

      expect(result.flaggedFuries).toHaveLength(0);
    });

    it('should log the consensus event to TruthLog', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'fury-1', verdict: 'PASS' },
        { furyUserId: 'fury-2', verdict: 'PASS' },
        { furyUserId: 'fury-3', verdict: 'FAIL' },
      ];

      await engine.evaluate('proof-logged', votes, false);

      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('CONSENSUS_REACHED', {
        proofId: 'proof-logged',
        outcome: 'VERIFIED',
        passCount: 2,
        failCount: 1,
        total: 3,
        isHoneypot: false,
        flaggedFuries: [],
      });
    });

    it('should return the original votes array in the result', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'fury-1', verdict: 'FAIL' },
        { furyUserId: 'fury-2', verdict: 'FAIL' },
        { furyUserId: 'fury-3', verdict: 'FAIL' },
      ];

      const result = await engine.evaluate('proof-x', votes, false);

      expect(result.votes).toBe(votes);
    });

    it('should handle a single voter reaching 2/3 threshold', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'fury-solo', verdict: 'PASS' },
      ];

      const result = await engine.evaluate('proof-solo', votes, false);

      // ceil(1 * 2 / 3) = 1, so 1 PASS >= 1 → VERIFIED
      expect(result.outcome).toBe('VERIFIED');
    });
  });
});

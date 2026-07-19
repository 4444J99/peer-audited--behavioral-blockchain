import { ConsensusEngine, FuryVote } from './consensus.engine';
import { TruthLogService } from '../../../services/ledger/truth-log.service';

describe('ConsensusEngine', () => {
  let engine: ConsensusEngine;

  const mockTruthLog = {
    appendEvent: jest.fn().mockResolvedValue('log-id'),
  } as unknown as TruthLogService;

  const mockPool = {
    query: jest.fn(),
  };

  const mockLedger = {
    recordTransaction: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    engine = new ConsensusEngine(mockTruthLog, mockLedger as any, mockPool as any);
    jest.clearAllMocks();
  });

  describe('evaluate', () => {
    it('should return VERIFIED when a quorum of voters exceeds the 66% power threshold', async () => {
      // Quorum is FURY_CONSENSUS_SIZE (3). Three PASS voters → unanimous PASS.
      const votes: FuryVote[] = [
        { furyUserId: 'fury-1', verdict: 'PASS' },
        { furyUserId: 'fury-2', verdict: 'PASS' },
        { furyUserId: 'fury-3', verdict: 'PASS' },
      ];

      const noviceStats = { rows: [{ successful_audits: '0', false_accusations: '0', total_audits: '0' }] };
      mockPool.query
        .mockResolvedValueOnce(noviceStats)
        .mockResolvedValueOnce(noviceStats)
        .mockResolvedValueOnce(noviceStats);

      const result = await engine.evaluate('proof-1', votes, false);

      expect(result.outcome).toBe('VERIFIED');
      // The engine never moves funds itself — bounty disbursement is the worker's job.
      expect(result.bountyDistributed).toBe(false);
      expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
    });

    it('should return SPLIT below quorum even when one side has a majority', async () => {
      // Only 2 distinct voters → below quorum → SPLIT regardless of split.
      const votes: FuryVote[] = [
        { furyUserId: 'novice-1', verdict: 'PASS' },
        { furyUserId: 'novice-2', verdict: 'PASS' },
      ];

      const noviceStats = { rows: [{ successful_audits: '0', false_accusations: '0', total_audits: '0' }] };
      mockPool.query
        .mockResolvedValueOnce(noviceStats)
        .mockResolvedValueOnce(noviceStats);

      const result = await engine.evaluate('proof-2', votes, false);

      expect(result.outcome).toBe('SPLIT');
      expect(result.bountyDistributed).toBe(false);
      expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
    });

    it('should return SPLIT when no side exceeds the threshold at quorum', async () => {
      // 3 equal-weight novices, 1 PASS vs 2 FAIL... use 2 PASS / 1 FAIL but ensure
      // a balanced enough split. Here 1 PASS / 2 FAIL → failPower 2/3 = 0.667 > 0.66 → REJECTED.
      // To force SPLIT we need neither side > 0.66: not achievable with 3 equal votes,
      // so this test uses a weighted balance that lands inside the band.
      const votes: FuryVote[] = [
        { furyUserId: 'a', verdict: 'PASS' }, // master weight 2.0
        { furyUserId: 'b', verdict: 'FAIL' }, // novice 1.0
        { furyUserId: 'c', verdict: 'FAIL' }, // novice 1.0
      ];
      const masterStats = { rows: [{ successful_audits: '200', false_accusations: '0', total_audits: '200' }] };
      const noviceStats = { rows: [{ successful_audits: '0', false_accusations: '0', total_audits: '0' }] };
      mockPool.query
        .mockResolvedValueOnce(masterStats) // a → weight 2.0
        .mockResolvedValueOnce(noviceStats) // b → 1.0
        .mockResolvedValueOnce(noviceStats); // c → 1.0

      // passPower 2.0, failPower 2.0, total 4.0 → 0.5 each → neither > 0.66 → SPLIT.
      const result = await engine.evaluate('proof-3', votes, false);

      expect(result.outcome).toBe('SPLIT');
      expect(result.bountyDistributed).toBe(false);
    });

    it('should flag reviewers who disagreed with the honeypot expected verdict', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'corrupt', verdict: 'PASS' },
      ];

      const noviceStats = { rows: [{ successful_audits: '0', false_accusations: '0', total_audits: '0' }] };
      mockPool.query.mockResolvedValueOnce(noviceStats);

      // Honeypot expects FAIL (default) — a PASS vote is wrong and must be flagged.
      const result = await engine.evaluate('honeypot-1', votes, true);

      expect(result.flaggedFuries).toContain('corrupt');
    });

    it('should NOT flag reviewers who matched a CLEAN honeypot expected verdict', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'honest', verdict: 'PASS' },
      ];

      const noviceStats = { rows: [{ successful_audits: '0', false_accusations: '0', total_audits: '0' }] };
      mockPool.query.mockResolvedValueOnce(noviceStats);

      // CLEAN honeypot expects PASS — a PASS vote is correct and must NOT be flagged.
      const result = await engine.evaluate('honeypot-clean', votes, true, 'PASS');

      expect(result.flaggedFuries).not.toContain('honest');
    });
  });
});
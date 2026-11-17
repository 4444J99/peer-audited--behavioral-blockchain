import { ConsensusEngine, FuryVote } from './consensus.engine';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { ConsensusResolver } from '../../../../shared/fury-logic/consensus.resolver';

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

    it('should deduplicate identical duplicate reviewer votes so 3 distinct voters + 1 duplicate row matches the 3-voter outcome and flaggedFuries', async () => {
      // Master voter 'a' (weight 2.0) has a duplicate PASS row, while 'b' and 'c' (weight 1.0 each) vote FAIL.
      // Without deduplication, 'a' would get 4.0 PASS vs 2.0 FAIL (66.7% PASS -> VERIFIED).
      // With deduplication, 'a' gets 2.0 PASS vs 2.0 FAIL (50% each -> SPLIT), identical to 3 distinct voters.
      const deduplicatedVotes: FuryVote[] = [
        { furyUserId: 'a', verdict: 'PASS' },
        { furyUserId: 'b', verdict: 'FAIL' },
        { furyUserId: 'c', verdict: 'FAIL' },
      ];
      const duplicateVotes: FuryVote[] = [
        { furyUserId: 'a', verdict: 'PASS' },
        { furyUserId: 'a', verdict: 'PASS' },
        { furyUserId: 'b', verdict: 'FAIL' },
        { furyUserId: 'c', verdict: 'FAIL' },
      ];

      const masterStats = { rows: [{ successful_audits: '200', false_accusations: '0', total_audits: '200' }] };
      const noviceStats = { rows: [{ successful_audits: '0', false_accusations: '0', total_audits: '0' }] };

      mockPool.query
        .mockResolvedValueOnce(masterStats)
        .mockResolvedValueOnce(noviceStats)
        .mockResolvedValueOnce(noviceStats);
      const baseline = await engine.evaluate('proof-dedup-base', deduplicatedVotes, true, 'FAIL');

      mockPool.query
        .mockResolvedValueOnce(masterStats)
        .mockResolvedValueOnce(noviceStats)
        .mockResolvedValueOnce(noviceStats);
      const withDuplicate = await engine.evaluate('proof-dedup-dup', duplicateVotes, true, 'FAIL');

      expect(withDuplicate.outcome).toBe(baseline.outcome);
      expect(withDuplicate.outcome).toBe('SPLIT');
      expect(withDuplicate.votes).toEqual(baseline.votes);
      expect(withDuplicate.flaggedFuries).toEqual(baseline.flaggedFuries);
      expect(withDuplicate.flaggedFuries).toEqual(['a']);
    });

    it('should return SPLIT when fewer than FURY_CONSENSUS_SIZE distinct voters exist even if duplicate rows reach 3 total rows', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'fury-1', verdict: 'PASS' },
        { furyUserId: 'fury-1', verdict: 'PASS' },
        { furyUserId: 'fury-2', verdict: 'PASS' },
      ];

      const noviceStats = { rows: [{ successful_audits: '0', false_accusations: '0', total_audits: '0' }] };
      mockPool.query
        .mockResolvedValueOnce(noviceStats)
        .mockResolvedValueOnce(noviceStats);

      const result = await engine.evaluate('proof-dup-quorum', votes, false);

      expect(result.outcome).toBe('SPLIT');
      expect(result.votes).toHaveLength(2);
    });

    it('should fail closed to SPLIT when the same reviewer has conflicting duplicate verdicts', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'fury-conflict', verdict: 'PASS' },
        { furyUserId: 'fury-conflict', verdict: 'FAIL' },
        { furyUserId: 'fury-2', verdict: 'PASS' },
        { furyUserId: 'fury-3', verdict: 'PASS' },
      ];

      const noviceStats = { rows: [{ successful_audits: '0', false_accusations: '0', total_audits: '0' }] };
      mockPool.query
        .mockResolvedValueOnce(noviceStats)
        .mockResolvedValueOnce(noviceStats);

      const result = await engine.evaluate('proof-conflict', votes, false);

      expect(result.outcome).toBe('SPLIT');
      expect(result.votes.map((v) => v.furyUserId)).toEqual(['fury-2', 'fury-3']);
    });
  });

  describe('ConsensusResolver (shared/fury-logic)', () => {
    it('deduplicates duplicate auditorId entries with the same decision so a single auditor cannot double-weight', () => {
      const resolver = new ConsensusResolver();
      const decisions = [
        { auditorId: 'a', integrityScore: 1.0, decision: 'BREACH' as const },
        { auditorId: 'a', integrityScore: 1.0, decision: 'BREACH' as const },
        { auditorId: 'a', integrityScore: 1.0, decision: 'BREACH' as const },
        { auditorId: 'b', integrityScore: 1.5, decision: 'CLEAN' as const },
        { auditorId: 'c', integrityScore: 1.5, decision: 'CLEAN' as const },
      ];
      expect(resolver.resolve(decisions)).toBe('CLEAN');
    });

    it('fails closed to UNCERTAIN when the same auditorId submits conflicting decisions', () => {
      const resolver = new ConsensusResolver();
      const decisions = [
        { auditorId: 'a', integrityScore: 1.0, decision: 'BREACH' as const },
        { auditorId: 'a', integrityScore: 1.0, decision: 'CLEAN' as const },
        { auditorId: 'b', integrityScore: 1.0, decision: 'BREACH' as const },
        { auditorId: 'c', integrityScore: 1.0, decision: 'BREACH' as const },
      ];
      expect(resolver.resolve(decisions)).toBe('UNCERTAIN');
    });
  });
});

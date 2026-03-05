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
    it('should return VERIFIED when weights reach 66% threshold', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'master-fury', verdict: 'PASS' }, // weight 2.0
        { furyUserId: 'novice-fury', verdict: 'FAIL' }, // weight 1.0
      ];

      // Mock Master Fury stats
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ successful_passes: '190', successful_fails: '10', false_accusations: '0', total_audits: '200' }] })
        .mockResolvedValueOnce({ rows: [{ successful_passes: '0', successful_fails: '0', false_accusations: '0', total_audits: '0' }] });

      // Mock bounty distribution queries
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'bounty-pool-id' }] }) // FURY_BOUNTY_POOL account
        .mockResolvedValueOnce({ rows: [{ account_id: 'fury-account-id' }] }); // Master fury account

      const result = await engine.evaluate('proof-1', votes, false);

      expect(result.outcome).toBe('VERIFIED');
      expect(result.bountyDistributed).toBe(true);
      expect(mockLedger.recordTransaction).toHaveBeenCalled();
    });

    it('should return SPLIT and NOT distribute bounties', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'novice-1', verdict: 'PASS' },
        { furyUserId: 'novice-2', verdict: 'FAIL' },
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ successful_passes: '0', successful_fails: '0', false_accusations: '0', total_audits: '0' }] })
        .mockResolvedValueOnce({ rows: [{ successful_passes: '0', successful_fails: '0', false_accusations: '0', total_audits: '0' }] });

      const result = await engine.evaluate('proof-2', votes, false);

      expect(result.outcome).toBe('SPLIT');
      expect(result.bountyDistributed).toBe(false);
      expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
    });

    it('should flag corrupt reviewers on honeypots', async () => {
      const votes: FuryVote[] = [
        { furyUserId: 'corrupt', verdict: 'PASS' },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: [{ successful_passes: '0', successful_fails: '0', false_accusations: '0', total_audits: '0' }] });
      
      // Mock bounty distribution (fails silently in test due to no consensus, but honeypot outcome is REJECTED if votes are FAIL... wait)
      // Actually if only 1 vote and it is PASS, consensus is VERIFIED.
      // But if it's a honeypot, we EXPECT a FAIL.
      
      const result = await engine.evaluate('honeypot-1', votes, true);

      expect(result.flaggedFuries).toContain('corrupt');
    });
  });
});
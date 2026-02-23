import { FuryWorker } from './fury.worker';
import { ConsensusEngine } from './consensus.engine';
import { ContractsService } from '../contracts/contracts.service';
import { Pool } from 'pg';

describe('FuryWorker', () => {
  let worker: FuryWorker;
  let mockPool: { query: jest.Mock };

  const mockConsensus = {
    evaluate: jest.fn(),
  } as unknown as ConsensusEngine;

  const mockContractsService = {
    resolveContract: jest.fn().mockResolvedValue(undefined),
  } as unknown as ContractsService;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    worker = new FuryWorker(
      mockPool as unknown as Pool,
      mockConsensus,
      mockContractsService,
    );
    jest.clearAllMocks();
  });

  describe('checkConsensus', () => {
    it('should not trigger consensus if not all Furies have voted', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { fury_user_id: 'fury-1', verdict: 'PASS' },
          { fury_user_id: 'fury-2', verdict: null },
          { fury_user_id: 'fury-3', verdict: 'FAIL' },
        ],
      });

      await worker.checkConsensus('proof-1');

      expect(mockConsensus.evaluate).not.toHaveBeenCalled();
    });

    it('should trigger consensus when all Furies have voted', async () => {
      // fury_assignments query
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { fury_user_id: 'fury-1', verdict: 'PASS' },
          { fury_user_id: 'fury-2', verdict: 'PASS' },
          { fury_user_id: 'fury-3', verdict: 'FAIL' },
        ],
      });
      // proofs query
      mockPool.query.mockResolvedValueOnce({
        rows: [{ is_honeypot: false, contract_id: 'contract-1' }],
      });
      // ConsensusEngine result
      (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
        outcome: 'VERIFIED',
        votes: [],
        flaggedFuries: [],
      });
      // UPDATE proofs
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await worker.checkConsensus('proof-1');

      expect(mockConsensus.evaluate).toHaveBeenCalledWith(
        'proof-1',
        [
          { furyUserId: 'fury-1', verdict: 'PASS' },
          { furyUserId: 'fury-2', verdict: 'PASS' },
          { furyUserId: 'fury-3', verdict: 'FAIL' },
        ],
        false,
      );
    });

    it('should update proof status to VERIFIED on verified consensus', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { fury_user_id: 'fury-1', verdict: 'PASS' },
          { fury_user_id: 'fury-2', verdict: 'PASS' },
        ],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ is_honeypot: false, contract_id: 'c-1' }],
      });
      (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
        outcome: 'VERIFIED',
        votes: [],
        flaggedFuries: [],
      });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await worker.checkConsensus('proof-1');

      const updateCall = mockPool.query.mock.calls[2];
      expect(updateCall[0]).toMatch(/UPDATE proofs SET status/);
      expect(updateCall[1]).toEqual(['VERIFIED', 'proof-1']);
    });

    it('should update proof status to REJECTED on rejected consensus', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { fury_user_id: 'fury-1', verdict: 'FAIL' },
          { fury_user_id: 'fury-2', verdict: 'FAIL' },
          { fury_user_id: 'fury-3', verdict: 'FAIL' },
        ],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ is_honeypot: false, contract_id: 'c-1' }],
      });
      (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
        outcome: 'REJECTED',
        votes: [],
        flaggedFuries: [],
      });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await worker.checkConsensus('proof-1');

      const updateCall = mockPool.query.mock.calls[2];
      expect(updateCall[1]).toEqual(['REJECTED', 'proof-1']);
    });

    it('should update proof status to SPLIT when no majority', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { fury_user_id: 'fury-1', verdict: 'PASS' },
          { fury_user_id: 'fury-2', verdict: 'FAIL' },
        ],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ is_honeypot: false, contract_id: 'c-1' }],
      });
      (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
        outcome: 'SPLIT',
        votes: [],
        flaggedFuries: [],
      });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await worker.checkConsensus('proof-1');

      const updateCall = mockPool.query.mock.calls[2];
      expect(updateCall[1]).toEqual(['SPLIT', 'proof-1']);
    });

    it('should apply fraud penalty to flagged Furies on honeypot detection', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { fury_user_id: 'fury-honest', verdict: 'FAIL' },
          { fury_user_id: 'fury-corrupt-1', verdict: 'PASS' },
          { fury_user_id: 'fury-corrupt-2', verdict: 'PASS' },
        ],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ is_honeypot: true, contract_id: 'c-1' }],
      });
      (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
        outcome: 'VERIFIED',
        votes: [],
        flaggedFuries: ['fury-corrupt-1', 'fury-corrupt-2'],
      });
      // UPDATE proofs
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // UPDATE users for fury-corrupt-1
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // UPDATE users for fury-corrupt-2
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await worker.checkConsensus('proof-honeypot');

      // Two penalty updates should have been issued
      const penaltyCalls = mockPool.query.mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('integrity_score - 15'),
      );
      expect(penaltyCalls).toHaveLength(2);
      expect(penaltyCalls[0][1]).toEqual(['fury-corrupt-1']);
      expect(penaltyCalls[1][1]).toEqual(['fury-corrupt-2']);
    });

    it('should not apply penalties when no Furies are flagged', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { fury_user_id: 'fury-1', verdict: 'FAIL' },
          { fury_user_id: 'fury-2', verdict: 'FAIL' },
        ],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ is_honeypot: false, contract_id: 'c-1' }],
      });
      (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
        outcome: 'REJECTED',
        votes: [],
        flaggedFuries: [],
      });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await worker.checkConsensus('proof-clean');

      // 3 base queries + 2 accuracy tracking (both correct FAIL votes on REJECTED)
      expect(mockPool.query).toHaveBeenCalledTimes(5);
      // No fraud penalty queries (integrity_score - 15) should exist
      const penaltyCalls = mockPool.query.mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('integrity_score - 15'),
      );
      expect(penaltyCalls).toHaveLength(0);
    });

    it('should silently return if proof is not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ fury_user_id: 'fury-1', verdict: 'PASS' }],
      });
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no proof found

      await worker.checkConsensus('proof-missing');

      expect(mockConsensus.evaluate).not.toHaveBeenCalled();
    });

    it('should pass isHoneypot flag from DB to ConsensusEngine', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ fury_user_id: 'fury-1', verdict: 'FAIL' }],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ is_honeypot: true, contract_id: 'c-1' }],
      });
      (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
        outcome: 'REJECTED',
        votes: [],
        flaggedFuries: [],
      });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await worker.checkConsensus('proof-hp');

      expect(mockConsensus.evaluate).toHaveBeenCalledWith(
        'proof-hp',
        expect.any(Array),
        true, // isHoneypot passed through
      );
    });

    // ── Contract resolution via consensus ─────────────────────────

    it('should call resolveContract(COMPLETED) when consensus is VERIFIED and contract_id exists', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { fury_user_id: 'fury-1', verdict: 'PASS' },
          { fury_user_id: 'fury-2', verdict: 'PASS' },
          { fury_user_id: 'fury-3', verdict: 'PASS' },
        ],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ is_honeypot: false, contract_id: 'contract-99' }],
      });
      (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
        outcome: 'VERIFIED',
        votes: [
          { furyUserId: 'fury-1', verdict: 'PASS' },
          { furyUserId: 'fury-2', verdict: 'PASS' },
          { furyUserId: 'fury-3', verdict: 'PASS' },
        ],
        flaggedFuries: [],
      });
      // UPDATE proofs
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // Accuracy tracking: 3 correct votes (+2 each)
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await worker.checkConsensus('proof-resolve-complete');

      expect(mockContractsService.resolveContract).toHaveBeenCalledWith('contract-99', 'COMPLETED');
    });

    it('should call resolveContract(FAILED) when consensus is REJECTED and contract_id exists', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { fury_user_id: 'fury-1', verdict: 'FAIL' },
          { fury_user_id: 'fury-2', verdict: 'FAIL' },
          { fury_user_id: 'fury-3', verdict: 'FAIL' },
        ],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ is_honeypot: false, contract_id: 'contract-100' }],
      });
      (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
        outcome: 'REJECTED',
        votes: [
          { furyUserId: 'fury-1', verdict: 'FAIL' },
          { furyUserId: 'fury-2', verdict: 'FAIL' },
          { furyUserId: 'fury-3', verdict: 'FAIL' },
        ],
        flaggedFuries: [],
      });
      // UPDATE proofs
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // Accuracy tracking: 3 correct votes (+2 each)
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await worker.checkConsensus('proof-resolve-fail');

      expect(mockContractsService.resolveContract).toHaveBeenCalledWith('contract-100', 'FAILED');
    });

    it('should NOT call resolveContract when consensus is SPLIT', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { fury_user_id: 'fury-1', verdict: 'PASS' },
          { fury_user_id: 'fury-2', verdict: 'FAIL' },
        ],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ is_honeypot: false, contract_id: 'contract-split' }],
      });
      (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
        outcome: 'SPLIT',
        votes: [
          { furyUserId: 'fury-1', verdict: 'PASS' },
          { furyUserId: 'fury-2', verdict: 'FAIL' },
        ],
        flaggedFuries: [],
      });
      // UPDATE proofs
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await worker.checkConsensus('proof-split');

      expect(mockContractsService.resolveContract).not.toHaveBeenCalled();
    });

    // ── Accuracy tracking ─────────────────────────────────────────

    it('should reward correct Fury votes with +2 integrity score', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { fury_user_id: 'fury-correct-1', verdict: 'PASS' },
          { fury_user_id: 'fury-correct-2', verdict: 'PASS' },
        ],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ is_honeypot: false, contract_id: 'c-acc' }],
      });
      (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
        outcome: 'VERIFIED',
        votes: [
          { furyUserId: 'fury-correct-1', verdict: 'PASS' },
          { furyUserId: 'fury-correct-2', verdict: 'PASS' },
        ],
        flaggedFuries: [],
      });
      // UPDATE proofs
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // Accuracy rewards (+2 each)
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await worker.checkConsensus('proof-reward');

      const rewardCalls = mockPool.query.mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('integrity_score + 2'),
      );
      expect(rewardCalls).toHaveLength(2);
      expect(rewardCalls[0][1]).toEqual(['fury-correct-1']);
      expect(rewardCalls[1][1]).toEqual(['fury-correct-2']);
    });

    it('should penalize incorrect Fury votes with -5 integrity score', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { fury_user_id: 'fury-right', verdict: 'PASS' },
          { fury_user_id: 'fury-wrong', verdict: 'FAIL' },
          { fury_user_id: 'fury-right-2', verdict: 'PASS' },
        ],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ is_honeypot: false, contract_id: 'c-pen' }],
      });
      (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
        outcome: 'VERIFIED',
        votes: [
          { furyUserId: 'fury-right', verdict: 'PASS' },
          { furyUserId: 'fury-wrong', verdict: 'FAIL' },
          { furyUserId: 'fury-right-2', verdict: 'PASS' },
        ],
        flaggedFuries: [],
      });
      // UPDATE proofs
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // Accuracy: +2 for fury-right, -5 for fury-wrong, +2 for fury-right-2
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await worker.checkConsensus('proof-penalty');

      const penaltyCalls = mockPool.query.mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('integrity_score - 5'),
      );
      expect(penaltyCalls).toHaveLength(1);
      expect(penaltyCalls[0][1]).toEqual(['fury-wrong']);
    });

    it('should skip accuracy tracking for honeypot proofs', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { fury_user_id: 'fury-1', verdict: 'FAIL' },
          { fury_user_id: 'fury-2', verdict: 'FAIL' },
        ],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ is_honeypot: true, contract_id: 'c-hp' }],
      });
      (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
        outcome: 'REJECTED',
        votes: [
          { furyUserId: 'fury-1', verdict: 'FAIL' },
          { furyUserId: 'fury-2', verdict: 'FAIL' },
        ],
        flaggedFuries: [],
      });
      // UPDATE proofs
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await worker.checkConsensus('proof-hp-skip');

      // Only 3 calls: fury_assignments, proofs, UPDATE proofs
      // No accuracy tracking calls (no +2 or -5 queries)
      const rewardCalls = mockPool.query.mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('integrity_score + 2'),
      );
      const penaltyCalls = mockPool.query.mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('integrity_score - 5'),
      );
      expect(rewardCalls).toHaveLength(0);
      expect(penaltyCalls).toHaveLength(0);
    });
  });
});

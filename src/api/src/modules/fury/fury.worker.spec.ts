import { FuryWorker } from './fury.worker';
import { ConsensusEngine } from './consensus.engine';
import { Pool } from 'pg';

describe('FuryWorker', () => {
  let worker: FuryWorker;
  let mockPool: { query: jest.Mock };

  const mockConsensus = {
    evaluate: jest.fn(),
  } as unknown as ConsensusEngine;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    worker = new FuryWorker(
      mockPool as unknown as Pool,
      mockConsensus,
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

      // Only 3 queries: assignments, proofs, update status — no penalty queries
      expect(mockPool.query).toHaveBeenCalledTimes(3);
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
  });
});

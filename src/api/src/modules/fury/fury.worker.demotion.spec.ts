import { FuryWorker } from './fury.worker';
import { ConsensusEngine } from './consensus.engine';
import { ContractsService } from '../contracts/contracts.service';
import { Pool } from 'pg';

describe('FuryWorker — Demotion', () => {
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

  it('should demote a Fury with low accuracy after 10+ audits', async () => {
    // Setup: all votes in, non-honeypot, VERIFIED outcome
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { fury_user_id: 'fury-bad', verdict: 'FAIL' },
        { fury_user_id: 'fury-good', verdict: 'PASS' },
        { fury_user_id: 'fury-good-2', verdict: 'PASS' },
      ],
    });
    mockPool.query.mockResolvedValueOnce({
      rows: [{ is_honeypot: false, contract_id: 'c-1' }],
    });
    (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
      outcome: 'VERIFIED',
      votes: [
        { furyUserId: 'fury-bad', verdict: 'FAIL' },
        { furyUserId: 'fury-good', verdict: 'PASS' },
        { furyUserId: 'fury-good-2', verdict: 'PASS' },
      ],
      flaggedFuries: [],
    });
    // UPDATE proofs
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    // Accuracy tracking: +2 for good, -5 for bad, +2 for good-2
    mockPool.query.mockResolvedValueOnce({ rows: [] }); // fury-bad penalty
    mockPool.query.mockResolvedValueOnce({ rows: [] }); // fury-good reward
    mockPool.query.mockResolvedValueOnce({ rows: [] }); // fury-good-2 reward

    // Demotion check queries — 3 furies checked
    // fury-bad: 15 total, 3 successful, 5 false accusations → accuracy < 0.8
    mockPool.query.mockResolvedValueOnce({
      rows: [{ total_audits: '15', successful_audits: '3', false_accusations: '5' }],
    });
    // UPDATE users (demotion)
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    // fury-good: 20 total, 18 successful, 0 false → good
    mockPool.query.mockResolvedValueOnce({
      rows: [{ total_audits: '20', successful_audits: '18', false_accusations: '0' }],
    });
    // fury-good-2: 12 total, 10 successful, 0 false → good
    mockPool.query.mockResolvedValueOnce({
      rows: [{ total_audits: '12', successful_audits: '10', false_accusations: '0' }],
    });

    // Notification: contract user lookup
    mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: 'user-1' }] });

    await worker.checkConsensus('proof-demotion');

    // Should have issued a demotion UPDATE for fury-bad
    const demotionCalls = mockPool.query.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[0].includes("role = 'USER'") && c[0].includes("role = 'FURY'"),
    );
    expect(demotionCalls.length).toBeGreaterThanOrEqual(1);
    expect(demotionCalls[0][1]).toEqual(['fury-bad']);
  });

  it('should not demote a Fury with good accuracy', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { fury_user_id: 'fury-ace', verdict: 'PASS' },
        { fury_user_id: 'fury-ace-2', verdict: 'PASS' },
      ],
    });
    mockPool.query.mockResolvedValueOnce({
      rows: [{ is_honeypot: false, contract_id: 'c-2' }],
    });
    (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
      outcome: 'VERIFIED',
      votes: [
        { furyUserId: 'fury-ace', verdict: 'PASS' },
        { furyUserId: 'fury-ace-2', verdict: 'PASS' },
      ],
      flaggedFuries: [],
    });
    // UPDATE proofs
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    // Accuracy rewards
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    // Demotion checks: both have great accuracy
    mockPool.query.mockResolvedValueOnce({
      rows: [{ total_audits: '50', successful_audits: '48', false_accusations: '0' }],
    });
    mockPool.query.mockResolvedValueOnce({
      rows: [{ total_audits: '30', successful_audits: '28', false_accusations: '1' }],
    });

    // Notification: contract user lookup
    mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: 'user-2' }] });

    await worker.checkConsensus('proof-no-demotion');

    // No demotion calls
    const demotionCalls = mockPool.query.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[0].includes("role = 'USER'") && c[0].includes("role = 'FURY'"),
    );
    expect(demotionCalls).toHaveLength(0);
  });

  it('should not demote a Fury with fewer than 10 audits (burn-in)', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ fury_user_id: 'fury-new', verdict: 'FAIL' }],
    });
    mockPool.query.mockResolvedValueOnce({
      rows: [{ is_honeypot: false, contract_id: 'c-3' }],
    });
    (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
      outcome: 'REJECTED',
      votes: [{ furyUserId: 'fury-new', verdict: 'FAIL' }],
      flaggedFuries: [],
    });
    mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE proofs
    mockPool.query.mockResolvedValueOnce({ rows: [] }); // accuracy tracking

    // Demotion check: only 5 audits (under burn-in threshold)
    mockPool.query.mockResolvedValueOnce({
      rows: [{ total_audits: '5', successful_audits: '1', false_accusations: '3' }],
    });

    // Notification
    mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: 'user-3' }] });

    await worker.checkConsensus('proof-burn-in');

    const demotionCalls = mockPool.query.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[0].includes("role = 'USER'") && c[0].includes("role = 'FURY'"),
    );
    expect(demotionCalls).toHaveLength(0);
  });

  it('should filter eligible Furies by role in process()', async () => {
    // Access the private process method via prototype or test the query pattern
    // We verify the SQL includes role = 'FURY'
    const processMethod = (worker as any).process;
    // The test verifies the SQL was updated by checking it runs without error
    // and only selects FURY-role users
    const mockJob = {
      data: {
        proofId: 'proof-role-test',
        submitterUserId: 'user-submitter',
        requiredReviewers: 3,
        dispatchedAt: new Date().toISOString(),
      },
    };

    // Return eligible users
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'fury-1' }, { id: 'fury-2' }],
    });
    // INSERT fury_assignments x2
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    // UPDATE proofs
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await processMethod.call(worker, mockJob);

    // Verify the query includes role = 'FURY'
    const eligibleQuery = mockPool.query.mock.calls[0];
    expect(eligibleQuery[0]).toContain("role = 'FURY'");
  });
});

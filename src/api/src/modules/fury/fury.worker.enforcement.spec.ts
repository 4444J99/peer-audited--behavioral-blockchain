import { FuryWorker } from './fury.worker';
import { ConsensusEngine } from './consensus.engine';
import { ContractsService } from '../contracts/contracts.service';
import { EnforcementService } from './enforcement.service';
import { Pool } from 'pg';

/**
 * TKT-P1-008: before this wiring `EnforcementService.evaluateCollusion` was
 * reachable only from `POST /fury/enforcement/evaluate` (ADMIN), so a honeypot
 * miss opened a case only if a human noticed and typed the request. Consensus
 * resolution is the point where the flagged set exists, so it is the point that
 * files the case.
 */
describe('FuryWorker — honeypot enforcement auto-open', () => {
  let worker: FuryWorker;
  let mockPool: { query: jest.Mock };
  let mockEnforcement: { evaluateCollusion: jest.Mock };

  const mockConsensus = {
    evaluate: jest.fn(),
  } as unknown as ConsensusEngine;

  const mockContractsService = {
    resolveContract: jest.fn().mockResolvedValue(undefined),
  } as unknown as ContractsService;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockEnforcement = { evaluateCollusion: jest.fn().mockResolvedValue(undefined) };
    worker = new FuryWorker(
      mockPool as unknown as Pool,
      mockConsensus,
      mockContractsService,
      undefined,
      undefined,
      undefined,
      undefined,
      mockEnforcement as unknown as EnforcementService,
    );
    jest.clearAllMocks();
  });

  function primeHoneypotConsensus(
    proofId: string,
    flaggedFuries: string[],
    outcome: 'VERIFIED' | 'REJECTED' = 'REJECTED',
  ) {
    // fury_assignments
    mockPool.query.mockResolvedValueOnce({
      rows: [{ fury_user_id: 'fury-1', verdict: 'PASS' }],
    });
    // claim resolution
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: proofId }] });
    // proofs SELECT
    mockPool.query.mockResolvedValueOnce({
      rows: [{ is_honeypot: true, contract_id: 'c-1' }],
    });
    (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
      outcome,
      votes: [],
      flaggedFuries,
    });
    // UPDATE proofs
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    // Notification: contract user lookup
    mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: 'u-1' }] });
  }

  it('opens enforcement cases for the Furies a honeypot flagged', async () => {
    primeHoneypotConsensus('proof-hp-flagged', ['fury-1', 'fury-2']);

    await worker.checkConsensus('proof-hp-flagged');

    expect(mockEnforcement.evaluateCollusion).toHaveBeenCalledWith(
      'proof-hp-flagged',
      ['fury-1', 'fury-2'],
    );
  });

  it('does not open a case when the honeypot flagged nobody', async () => {
    primeHoneypotConsensus('proof-hp-clean', [], 'VERIFIED');

    await worker.checkConsensus('proof-hp-clean');

    expect(mockEnforcement.evaluateCollusion).not.toHaveBeenCalled();
  });

  it('does not open a case for a real (non-honeypot) proof', async () => {
    // fury_assignments
    mockPool.query.mockResolvedValueOnce({
      rows: [{ fury_user_id: 'fury-1', verdict: 'PASS' }],
    });
    // claim resolution
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'proof-real' }] });
    // proofs SELECT — not a honeypot
    mockPool.query.mockResolvedValueOnce({
      rows: [{ is_honeypot: false, contract_id: 'c-1' }],
    });
    (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
      outcome: 'VERIFIED',
      votes: [{ furyUserId: 'fury-1', verdict: 'PASS' }],
      flaggedFuries: ['fury-1'],
    });
    // UPDATE proofs, accuracy +2, demotion stats, notification lookup
    mockPool.query.mockResolvedValue({
      rows: [{ total_audits: '5', successful_audits: '4', false_accusations: '0' }],
    });

    await worker.checkConsensus('proof-real');

    expect(mockEnforcement.evaluateCollusion).not.toHaveBeenCalled();
  });

  it('does not strand the proof in RESOLVING when case filing throws', async () => {
    primeHoneypotConsensus('proof-hp-boom', ['fury-1']);
    mockEnforcement.evaluateCollusion.mockRejectedValueOnce(new Error('pg down'));
    const errorSpy = jest
      .spyOn((worker as any).logger, 'error')
      .mockImplementation();

    await expect(worker.checkConsensus('proof-hp-boom')).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('proof-hp-boom'),
    );
    // The revert path sets status back to UNDER_REVIEW; a swallowed filing error
    // must not trigger it.
    const revertCalls = mockPool.query.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[0].includes("SET status = 'UNDER_REVIEW'"),
    );
    expect(revertCalls).toHaveLength(0);
  });

  it('resolves consensus normally when no EnforcementService is wired', async () => {
    const bareWorker = new FuryWorker(
      mockPool as unknown as Pool,
      mockConsensus,
      mockContractsService,
    );
    primeHoneypotConsensus('proof-hp-bare', ['fury-1']);

    await expect(bareWorker.checkConsensus('proof-hp-bare')).resolves.toBeUndefined();
  });
});

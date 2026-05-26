import { FuryWorker } from './fury.worker';
import { ConsensusEngine } from './consensus.engine';
import { ContractsService } from '../contracts/contracts.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { Pool } from 'pg';
import { AUDITOR_STAKE_AMOUNT } from '../../../../shared/libs/integrity';

describe('FuryWorker — Bounty Economy', () => {
  let worker: FuryWorker;
  let mockPool: { query: jest.Mock };
  let mockLedger: { recordTransaction: jest.Mock };
  let mockTruthLog: { appendEvent: jest.Mock };

  const mockConsensus = {
    evaluate: jest.fn(),
  } as unknown as ConsensusEngine;

  const mockContractsService = {
    resolveContract: jest.fn().mockResolvedValue(undefined),
  } as unknown as ContractsService;

  // Helper: demotion stats mock (under 10-audit burn-in → no demotion)
  const demotionStatsMock = { rows: [{ total_audits: '5', successful_audits: '4', false_accusations: '0' }] };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockLedger = { recordTransaction: jest.fn().mockResolvedValue('entry-id') };
    mockTruthLog = { appendEvent: jest.fn().mockResolvedValue('log-id') };
    worker = new FuryWorker(
      mockPool as unknown as Pool,
      mockConsensus,
      mockContractsService,
      undefined, // notifications
      mockLedger as unknown as LedgerService,
      mockTruthLog as unknown as TruthLogService,
    );
    jest.clearAllMocks();
  });

  /**
   * Helper to set up mock pool queries for a standard consensus flow.
   * Returns after setting up: assignments, proof, UPDATE proofs,
   * accuracy tracking, bounty disbursement account lookups, demotion, notifications.
   */
  function setupConsensusFlow(opts: {
    votes: Array<{ id: string; verdict: string }>;
    isHoneypot: boolean;
    contractId: string;
    proofId?: string;
    outcome: 'VERIFIED' | 'REJECTED' | 'SPLIT';
    flaggedFuries?: string[];
    furyAccountIds?: Record<string, string | null>;
  }) {
    const { votes, isHoneypot, contractId, outcome, flaggedFuries = [], furyAccountIds = {} } = opts;

    // 1. fury_assignments query
    mockPool.query.mockResolvedValueOnce({
      rows: votes.map((v) => ({ fury_user_id: v.id, verdict: v.verdict })),
    });

    // 1b. claim resolution (UPDATE proofs ... RETURNING id)
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: opts.proofId ?? 'proof-1' }] });

    // 2. proofs query
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: opts.proofId ?? 'proof-1', user_id: 'host-user', total_furies: votes.length, is_honeypot: isHoneypot, contract_id: contractId }],
    });

    // 3. ConsensusEngine result
    (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
      outcome,
      votes: votes.map((v) => ({ furyUserId: v.id, verdict: v.verdict })),
      flaggedFuries,
    });

    // 4. UPDATE proofs
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    // 4b. LC5 idempotency guard: consensusSideEffectsAlreadyApplied (ledger present,
    //     non-SPLIT). Returns empty → not yet applied → side effects proceed.
    if (outcome !== 'SPLIT') {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
    }

    // 5. Removed: Fraud penalty logic moved to HoneypotService

    // 6. Accuracy tracking (non-honeypot, non-SPLIT only)
    if (!isHoneypot && outcome !== 'SPLIT') {
      for (const _vote of votes) {
        mockPool.query.mockResolvedValueOnce({ rows: [] }); // +2 or -5
      }
    }

    // 7. Bounty disbursement: system account lookups
    if (outcome !== 'SPLIT') {
      // SYSTEM_ESCROW lookup
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-account' }] });
      // SYSTEM_REVENUE lookup
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'revenue-account' }] });

      if (isHoneypot) {
        // For honeypot: look up each flagged Fury's account_id
        for (const furyId of flaggedFuries) {
          const accountId = furyAccountIds[furyId] ?? 'fury-acct-' + furyId;
          mockPool.query.mockResolvedValueOnce({
            rows: [{ account_id: accountId }],
          });
        }
      } else {
        // For regular: look up each voter's account_id
        for (const vote of votes) {
          const accountId = furyAccountIds[vote.id] ?? 'fury-acct-' + vote.id;
          mockPool.query.mockResolvedValueOnce({
            rows: [{ account_id: accountId }],
          });
        }
      }
    }

    // 8. Demotion check stats (non-honeypot only)
    if (!isHoneypot) {
      for (const _vote of votes) {
        mockPool.query.mockResolvedValueOnce(demotionStatsMock);
      }
    }

    // 9. Notification: contract user lookup
    mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: 'user-owner' }] });
  }

  it('should pay AUDITOR_STAKE_AMOUNT bounty to correct Fury voters', async () => {
    setupConsensusFlow({
      votes: [
        { id: 'fury-1', verdict: 'PASS' },
        { id: 'fury-2', verdict: 'PASS' },
      ],
      isHoneypot: false,
      contractId: 'contract-bounty',
      outcome: 'VERIFIED',
      furyAccountIds: { 'fury-1': 'acct-f1', 'fury-2': 'acct-f2' },
    });

    await worker.checkConsensus('proof-bounty');

    // Both correct → both get bounties from escrow. Each posting now carries the
    // LC5 idempotency key (consensus:<proof>:<fury>:bounty) and consensusProofId.
    expect(mockLedger.recordTransaction).toHaveBeenCalledTimes(2);
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'escrow-account', 'acct-f1', AUDITOR_STAKE_AMOUNT, 'contract-bounty',
      { type: 'FURY_BOUNTY', consensusProofId: 'proof-bounty' },
      undefined, 'consensus:proof-bounty:fury-1:bounty',
    );
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'escrow-account', 'acct-f2', AUDITOR_STAKE_AMOUNT, 'contract-bounty',
      { type: 'FURY_BOUNTY', consensusProofId: 'proof-bounty' },
      undefined, 'consensus:proof-bounty:fury-2:bounty',
    );

    // TruthLog events
    expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('FURY_BOUNTY_PAID', expect.objectContaining({
      furyUserId: 'fury-1',
      amount: AUDITOR_STAKE_AMOUNT,
    }));
    expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('FURY_BOUNTY_PAID', expect.objectContaining({
      furyUserId: 'fury-2',
      amount: AUDITOR_STAKE_AMOUNT,
    }));
  });

  it('should charge AUDITOR_STAKE_AMOUNT penalty for incorrect Fury votes', async () => {
    setupConsensusFlow({
      votes: [
        { id: 'fury-right', verdict: 'PASS' },
        { id: 'fury-wrong', verdict: 'FAIL' },
      ],
      isHoneypot: false,
      contractId: 'contract-pen',
      outcome: 'VERIFIED',
      furyAccountIds: { 'fury-right': 'acct-right', 'fury-wrong': 'acct-wrong' },
    });

    await worker.checkConsensus('proof-pen');

    expect(mockLedger.recordTransaction).toHaveBeenCalledTimes(2);

    // Correct vote → bounty
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'escrow-account', 'acct-right', AUDITOR_STAKE_AMOUNT, 'contract-pen',
      { type: 'FURY_BOUNTY', consensusProofId: 'proof-pen' },
      undefined, 'consensus:proof-pen:fury-right:bounty',
    );

    // Incorrect vote → penalty
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acct-wrong', 'revenue-account', AUDITOR_STAKE_AMOUNT, 'contract-pen',
      { type: 'FURY_PENALTY', consensusProofId: 'proof-pen' },
      undefined, 'consensus:proof-pen:fury-wrong:penalty',
    );

    expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('FURY_PENALTY_CHARGED', expect.objectContaining({
      furyUserId: 'fury-wrong',
    }));
  });

  it('should charge penalty for honeypot failures', async () => {
    setupConsensusFlow({
      votes: [
        { id: 'fury-honest', verdict: 'FAIL' },
        { id: 'fury-corrupt', verdict: 'PASS' },
      ],
      isHoneypot: true,
      contractId: 'contract-hp',
      outcome: 'VERIFIED',
      flaggedFuries: ['fury-corrupt'],
      furyAccountIds: { 'fury-corrupt': 'acct-corrupt' },
    });

    await worker.checkConsensus('proof-hp-bounty');

    // Only the flagged Fury gets a penalty
    expect(mockLedger.recordTransaction).toHaveBeenCalled();

    expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('FURY_PENALTY_CHARGED', expect.objectContaining({
      furyUserId: 'fury-corrupt',
      reason: 'honeypot_failure',
    }));
  });

  it('should skip financial bounty for Furies without account_id', async () => {
    // fury_assignments
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { fury_user_id: 'fury-no-acct', verdict: 'PASS' },
        { fury_user_id: 'fury-with-acct', verdict: 'PASS' },
      ],
    });
    // claim resolution
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'proof-skip' }] });
    // proofs
    mockPool.query.mockResolvedValueOnce({
      rows: [{ is_honeypot: false, contract_id: 'contract-skip' }],
    });
    // ConsensusEngine
    (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
      outcome: 'VERIFIED',
      votes: [
        { furyUserId: 'fury-no-acct', verdict: 'PASS' },
        { furyUserId: 'fury-with-acct', verdict: 'PASS' },
      ],
      flaggedFuries: [],
    });
    // UPDATE proofs
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    // LC5 idempotency guard: not yet applied
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    // Accuracy tracking: 2 correct votes
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    // Bounty system accounts
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-account' }] });
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'revenue-account' }] });
    // Fury account lookups: first has no account_id, second does
    mockPool.query.mockResolvedValueOnce({ rows: [{ account_id: null }] });
    mockPool.query.mockResolvedValueOnce({ rows: [{ account_id: 'acct-yes' }] });
    // Demotion check stats
    mockPool.query.mockResolvedValueOnce(demotionStatsMock);
    mockPool.query.mockResolvedValueOnce(demotionStatsMock);
    // Notification
    mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: 'user-skip' }] });

    await worker.checkConsensus('proof-skip');

    // Only 1 ledger transaction (for the Fury with account_id)
    expect(mockLedger.recordTransaction).toHaveBeenCalledTimes(1);
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'escrow-account', 'acct-yes', AUDITOR_STAKE_AMOUNT, 'contract-skip',
      { type: 'FURY_BOUNTY', consensusProofId: 'proof-skip' },
      undefined, 'consensus:proof-skip:fury-with-acct:bounty',
    );
  });

  it('should not disburse bounties on SPLIT decision', async () => {
    // fury_assignments
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { fury_user_id: 'fury-1', verdict: 'PASS' },
        { fury_user_id: 'fury-2', verdict: 'FAIL' },
      ],
    });
    // claim resolution
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'proof-split-bounty' }] });
    // proofs
    mockPool.query.mockResolvedValueOnce({
      rows: [{ is_honeypot: false, contract_id: 'contract-split' }],
    });
    // ConsensusEngine
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
    // No accuracy tracking (SPLIT)
    // No bounty disbursement (SPLIT)
    // Demotion check stats
    mockPool.query.mockResolvedValueOnce(demotionStatsMock);
    mockPool.query.mockResolvedValueOnce(demotionStatsMock);
    // Notification
    mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: 'user-split' }] });

    await worker.checkConsensus('proof-split-bounty');

    expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
  });

  it('LC5: should NOT re-apply scoring or re-disburse bounties when consensus side effects already exist (re-claim)', async () => {
    // fury_assignments
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { fury_user_id: 'fury-1', verdict: 'PASS' },
        { fury_user_id: 'fury-2', verdict: 'PASS' },
      ],
    });
    // claim resolution
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'proof-reclaim' }] });
    // proofs
    mockPool.query.mockResolvedValueOnce({
      rows: [{ is_honeypot: false, contract_id: 'contract-reclaim' }],
    });
    // ConsensusEngine
    (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
      outcome: 'VERIFIED',
      votes: [
        { furyUserId: 'fury-1', verdict: 'PASS' },
        { furyUserId: 'fury-2', verdict: 'PASS' },
      ],
      flaggedFuries: [],
    });
    // UPDATE proofs
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    // LC5 idempotency guard returns a row → already applied
    mockPool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
    // Demotion check stats still run (idempotent) for both furies
    mockPool.query.mockResolvedValueOnce(demotionStatsMock);
    mockPool.query.mockResolvedValueOnce(demotionStatsMock);
    // Notification
    mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: 'user-reclaim' }] });

    await worker.checkConsensus('proof-reclaim');

    // No bounty/penalty postings on a re-claim.
    expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
    // No integrity-score deltas re-applied.
    const scoreCalls = mockPool.query.mock.calls.filter(
      (c) => typeof c[0] === 'string' &&
        (c[0].includes('integrity_score + 2') || c[0].includes('integrity_score - 5')),
    );
    expect(scoreCalls).toHaveLength(0);
  });
});

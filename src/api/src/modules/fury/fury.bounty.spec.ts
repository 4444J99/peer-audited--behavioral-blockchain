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
    outcome: 'VERIFIED' | 'REJECTED' | 'SPLIT';
    flaggedFuries?: string[];
    furyAccountIds?: Record<string, string | null>;
  }) {
    const { votes, isHoneypot, contractId, outcome, flaggedFuries = [], furyAccountIds = {} } = opts;

    // 1. fury_assignments query
    mockPool.query.mockResolvedValueOnce({
      rows: votes.map((v) => ({ fury_user_id: v.id, verdict: v.verdict })),
    });

    // 2. proofs query
    mockPool.query.mockResolvedValueOnce({
      rows: [{ is_honeypot: isHoneypot, contract_id: contractId }],
    });

    // 3. ConsensusEngine result
    (mockConsensus.evaluate as jest.Mock).mockResolvedValueOnce({
      outcome,
      votes: votes.map((v) => ({ furyUserId: v.id, verdict: v.verdict })),
      flaggedFuries,
    });

    // 4. UPDATE proofs
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    // 5. Fraud penalty for flagged Furies (honeypot)
    for (const _furyId of flaggedFuries) {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // integrity -15
    }

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

    // Both correct → both get bounties from escrow
    expect(mockLedger.recordTransaction).toHaveBeenCalledTimes(2);
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'escrow-account', 'acct-f1', AUDITOR_STAKE_AMOUNT, 'contract-bounty', { type: 'FURY_BOUNTY' },
    );
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'escrow-account', 'acct-f2', AUDITOR_STAKE_AMOUNT, 'contract-bounty', { type: 'FURY_BOUNTY' },
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
      'escrow-account', 'acct-right', AUDITOR_STAKE_AMOUNT, 'contract-pen', { type: 'FURY_BOUNTY' },
    );

    // Incorrect vote → penalty
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acct-wrong', 'revenue-account', AUDITOR_STAKE_AMOUNT, 'contract-pen', { type: 'FURY_PENALTY' },
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
    expect(mockLedger.recordTransaction).toHaveBeenCalledTimes(1);
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      'acct-corrupt', 'revenue-account', AUDITOR_STAKE_AMOUNT, 'contract-hp', { type: 'FURY_PENALTY' },
    );

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
      'escrow-account', 'acct-yes', AUDITOR_STAKE_AMOUNT, 'contract-skip', { type: 'FURY_BOUNTY' },
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
});

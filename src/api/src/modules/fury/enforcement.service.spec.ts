import { EnforcementService } from './enforcement.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { Pool } from 'pg';

describe('EnforcementService', () => {
  let service: EnforcementService;
  let mockPool: { query: jest.Mock };
  let mockTruthLog: { appendEvent: jest.Mock };
  let mockLedger: { recordTransaction: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockTruthLog = { appendEvent: jest.fn().mockResolvedValue('log-id') };
    mockLedger = { recordTransaction: jest.fn().mockResolvedValue('txn-reversal-1') };
    service = new EnforcementService(
      mockPool as unknown as Pool,
      mockTruthLog as unknown as TruthLogService,
      mockLedger as unknown as LedgerService,
    );
    jest.clearAllMocks();
  });

  describe('applyPenalty (LC9 idempotency)', () => {
    it('applies the penalty and logs once when no prior penalty exists', async () => {
      // INSERT ... RETURNING id → one inserted row
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'penalty-1' }] });
      // UPDATE fury_enforcement_cases
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // SELECT reviewer_id
      mockPool.query.mockResolvedValueOnce({ rows: [{ reviewer_id: 'fury-1' }] });

      await service.applyPenalty('case-1', 'REP_BURN', 0);

      const insertCall = mockPool.query.mock.calls[0];
      expect(insertCall[0]).toMatch(/INSERT INTO fury_penalties/);
      expect(insertCall[0]).toMatch(/WHERE NOT EXISTS/);
      expect(mockTruthLog.appendEvent).toHaveBeenCalledTimes(1);
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        'FURY_PENALTY_APPLIED',
        expect.objectContaining({ caseId: 'case-1', reviewerId: 'fury-1' }),
      );
    });

    it('is a no-op (no duplicate penalty, no second TruthLog) when a penalty already exists', async () => {
      // INSERT ... RETURNING id → zero rows because WHERE NOT EXISTS matched
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.applyPenalty('case-1', 'REP_BURN', 0);

      // Only the guarded INSERT ran; no status UPDATE, no SELECT, no TruthLog append.
      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
    });
  });

  describe('confirmCase', () => {
    it('rejects when the pending case cannot be claimed', async () => {
      // claim UPDATE ... RETURNING id → zero rows (already applied / not pending)
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.confirmCase('case-x')).rejects.toThrow('Pending case not found');
    });

    // `dto.amountCents || 0` in the controller turned a missing amount into a
    // free STAKE_SLASH: the case read as punished while nothing was taken.
    it('derives a financial penalty amount instead of silently applying $0', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'case-1' }] })   // claim
        .mockResolvedValueOnce({ rows: [{ id: 'penalty-1' }] }) // insert penalty
        .mockResolvedValueOnce({ rows: [] })                    // update case
        .mockResolvedValueOnce({ rows: [{ reviewer_id: 'fury-1' }] });

      const result = await service.confirmCase('case-1', 'STAKE_SLASH');

      expect(result.amountCents).toBeGreaterThan(0);
    });

    it('refuses an explicit non-positive amount on a financial penalty', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'case-1' }] });

      await expect(service.confirmCase('case-1', 'STAKE_SLASH', 0)).rejects.toThrow(
        /requires a positive amountCents/,
      );
    });
  });

  describe('resolveAppeal', () => {
    it('resolves an appeal as UPHELD', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'case-1', reviewer_id: 'fury-1' }],
      });

      const result = await service.resolveAppeal('case-1', 'UPHELD', 'Penalty confirmed');

      expect(result.outcome).toBe('UPHELD');
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        'FURY_APPEAL_RESOLVED',
        expect.objectContaining({ outcome: 'UPHELD' }),
      );
    });

    // This test used to assert `DELETE FROM fury_penalties` and was named
    // "removes penalty" — it enshrined the defect. Deleting the bookkeeping row
    // was the whole reversal, while fury.worker.ts had already charged real money
    // through the ledger, so a Fury who WON an appeal stayed slashed.
    it('resolves an appeal as REVERSED and REFUNDS the slashed money', async () => {
      mockPool.query
        // claim UPDATE ... RETURNING id, reviewer_id
        .mockResolvedValueOnce({ rows: [{ id: 'case-1', reviewer_id: 'fury-1' }] })
        // SELECT the penalty row — carries the ledger leg written at slash time
        .mockResolvedValueOnce({
          rows: [{
            id: 'penalty-1',
            amount_cents: 500,
            ledger_transaction_id: 'txn-slash-1',
            ledger_debit_account_id: 'acct-fury-1',
            reversal_transaction_id: null,
          }],
        })
        // SELECT SYSTEM_REVENUE
        .mockResolvedValueOnce({ rows: [{ id: 'acct-revenue' }] })
        // UPDATE fury_penalties SET reversed_at, reversal_transaction_id
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.resolveAppeal('case-1', 'REVERSED');

      expect(result.outcome).toBe('REVERSED');
      expect(result.refundedCents).toBe(500);
      // Compensating entry: revenue pays the reviewer back, same amount.
      expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
        'acct-revenue',
        'acct-fury-1',
        500,
        undefined,
        expect.objectContaining({
          type: 'FURY_PENALTY_REVERSAL',
          reversesTransactionId: 'txn-slash-1',
        }),
        undefined,
        'fury-appeal-reversal:case-1',
      );
      // The original charge is NOT deleted — a ledger records what happened.
      const sqlIssued = mockPool.query.mock.calls.map((c: any[]) => String(c[0]));
      expect(sqlIssued.some((sql) => /DELETE FROM fury_penalties/.test(sql))).toBe(false);
      expect(sqlIssued.some((sql) => /reversal_transaction_id = \$2/.test(sql))).toBe(true);
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        'FURY_PENALTY_REVERSED',
        expect.objectContaining({ amountCents: 500, reversalTransactionId: 'txn-reversal-1' }),
      );
    });

    it('never refunds twice — an already-reversed penalty moves no money', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'case-1', reviewer_id: 'fury-1' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 'penalty-1',
            amount_cents: 500,
            ledger_transaction_id: 'txn-slash-1',
            ledger_debit_account_id: 'acct-fury-1',
            reversal_transaction_id: 'txn-reversal-earlier',
          }],
        });

      const result = await service.resolveAppeal('case-1', 'REVERSED');

      expect(result.refundedCents).toBe(500);
      expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
    });

    it('reverses a non-financial penalty without touching the ledger', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'case-1', reviewer_id: 'fury-1' }] })
        // REP_BURN: no ledger leg to undo
        .mockResolvedValueOnce({
          rows: [{
            id: 'penalty-1',
            amount_cents: 0,
            ledger_transaction_id: null,
            ledger_debit_account_id: null,
            reversal_transaction_id: null,
          }],
        })
        .mockResolvedValueOnce({ rows: [] }); // UPDATE reversed_at

      const result = await service.resolveAppeal('case-1', 'REVERSED');

      expect(result.refundedCents).toBe(0);
      expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
    });

    it('throws on invalid outcome', async () => {
      await expect(
        service.resolveAppeal('case-1', 'INVALID' as any),
      ).rejects.toThrow('Outcome must be UPHELD or REVERSED');
    });

    it('throws when case is not in APPEALED status', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.resolveAppeal('case-1', 'UPHELD'),
      ).rejects.toThrow('Appealed case not found');
    });
  });
  describe('evaluateCollusion (auto-open from consensus)', () => {
    it('opens a PENDING_REVIEW case and logs it for each flagged Fury', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'case-hp-1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'case-hp-2' }] });

      await service.evaluateCollusion('proof-9', ['fury-1', 'fury-2']);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockPool.query.mock.calls[0][0]).toMatch(/HONEYPOT_FAILURE/);
      expect(mockPool.query.mock.calls[0][0]).toMatch(/PENDING_REVIEW/);
      expect(mockTruthLog.appendEvent).toHaveBeenCalledTimes(2);
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        'FURY_ENFORCEMENT_CASE_OPENED',
        expect.objectContaining({ caseId: 'case-hp-1', proofId: 'proof-9' }),
      );
    });

    it('does not double-file when the consensus block re-runs on the LC5 retry path', async () => {
      // The guarded INSERT matches zero rows because a case for this
      // (reviewer, proof) already exists.
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.evaluateCollusion('proof-9', ['fury-1']);

      const insertSql = mockPool.query.mock.calls[0][0];
      expect(insertSql).toMatch(/WHERE NOT EXISTS/);
      expect(insertSql).toMatch(/evidence_json->>'proofId' = \$3/);
      expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
    });

    it('is a no-op when nothing was flagged', async () => {
      await service.evaluateCollusion('proof-9', []);

      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  describe('listCases (admin read API)', () => {
    it('returns cases joined to their penalty and reviewer standing', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'case-1',
            reviewer_id: 'fury-1',
            case_type: 'COLLUSION_RING',
            confidence: 0.9,
            status: 'PENDING_REVIEW',
            evidence_json: { ringId: 'ring-1' },
            created_at: '2026-08-15T00:00:00.000Z',
            integrity_score: 40,
            reviewer_status: 'ACTIVE',
            penalty_type: null,
            amount_cents: null,
            applied_at: null,
          },
        ],
      });

      const result = await service.listCases({ status: 'PENDING_REVIEW' });

      expect(result.cases).toHaveLength(1);
      expect(mockPool.query.mock.calls[0][1]).toEqual([
        'PENDING_REVIEW',
        null,
        50,
      ]);
    });

    it('never selects the reviewer email onto this list surface', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.listCases();

      expect(mockPool.query.mock.calls[0][0]).not.toMatch(/email/);
    });

    it('clamps an absent, junk, or oversized limit', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await service.listCases();
      await service.listCases({ limit: NaN });
      await service.listCases({ limit: 100000 });
      await service.listCases({ limit: 10 });

      expect(mockPool.query.mock.calls[0][1][2]).toBe(50);
      expect(mockPool.query.mock.calls[1][1][2]).toBe(50);
      expect(mockPool.query.mock.calls[2][1][2]).toBe(200);
      expect(mockPool.query.mock.calls[3][1][2]).toBe(10);
    });
  });

  describe('listCollusionRings (admin read API)', () => {
    it('groups member cases back into rings on evidence_json.ringId', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            ring_id: 'ring-1-1700000000000',
            detected_at: '2026-08-15T00:00:00.000Z',
            confidence: 0.91,
            member_count: 3,
            pending_count: 3,
            penalized_count: 0,
            appealed_count: 0,
            signal_count: 4,
            signal_types: ['COORDINATED_VOTE', 'VERDICT_SYNC'],
            members: [
              { caseId: 'case-1', reviewerId: 'fury-1', status: 'PENDING_REVIEW', integrityScore: 40 },
            ],
          },
        ],
      });

      const result = await service.listCollusionRings({ sinceHours: 48 });

      expect(result.rings).toHaveLength(1);
      expect(result.rings[0].ring_id).toBe('ring-1-1700000000000');

      const [sql, params] = mockPool.query.mock.calls[0];
      expect(sql).toMatch(/GROUP BY c\.evidence_json->>'ringId'/);
      expect(sql).toMatch(/c\.case_type = 'COLLUSION_RING'/);
      expect(params).toEqual([48, 50]);
    });

    it('clamps the lookback window rather than trusting the query string', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await service.listCollusionRings();
      await service.listCollusionRings({ sinceHours: NaN });
      await service.listCollusionRings({ sinceHours: 999999 });

      expect(mockPool.query.mock.calls[0][1][0]).toBe(24 * 30);
      expect(mockPool.query.mock.calls[1][1][0]).toBe(24 * 30);
      expect(mockPool.query.mock.calls[2][1][0]).toBe(24 * 365);
    });
  });
});

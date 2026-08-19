import { FuryController } from './fury.controller';
import { FuryWorker } from './fury.worker';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { Pool } from 'pg';
import { FuryViolationCode } from '../../../../shared/fury-logic/violation-codes';
describe('FuryController', () => {
  let controller: FuryController;
  let mockPool: { query: jest.Mock };
  // The R2 mock used to be `{}` — generateViewUrl always threw, every viewUrl
  // resolved to null through the catch, and the masked-vs-raw selection branch
  // was never exercised by any test. That is why the queue shipped serving raw
  // media to peer reviewers: the assertion could not fail.
  let mockR2: { generateViewUrl: jest.Mock };

  const mockFuryWorker = {
    checkConsensus: jest.fn().mockResolvedValue(undefined),
  } as unknown as FuryWorker;

  const mockTruthLog = {
    appendEvent: jest.fn().mockResolvedValue('log-id'),
  } as unknown as TruthLogService;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockR2 = {
      generateViewUrl: jest.fn(async (key: string) => `https://signed.example/${key}`),
    };
    controller = new FuryController(
      mockPool as unknown as Pool,
      mockFuryWorker,
      mockTruthLog,
      mockR2 as any
    );
    jest.clearAllMocks();
  });

  describe('getAssignments', () => {
    it('should return pending assignments for a Fury user', async () => {
      const assignments = [
        { assignment_id: 'a-1', proof_id: 'p-1', media_uri: 'https://r2.styx.app/video.mp4', oath_category: 'RECOVERY_NOCONTACT' },
        { assignment_id: 'a-2', proof_id: 'p-2', media_uri: 'https://r2.styx.app/video2.mp4', oath_category: 'BIOLOGICAL_WEIGHT' },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: assignments });

      const result = await controller.getAssignments({ id: 'fury-user-1' });

      expect(result).toEqual({
        assignments: [
          {
            id: 'a-1',
            assignmentId: 'a-1',
            proofId: 'p-1',
            assignedAt: undefined,
            contractId: undefined,
            submittedAt: undefined,
            category: 'RECOVERY_NOCONTACT',
            contentType: undefined,
            description: undefined,
            redactionStatus: undefined,
            viewUrl: null,
            subjectAlias: undefined,
          },
          {
            id: 'a-2',
            assignmentId: 'a-2',
            proofId: 'p-2',
            assignedAt: undefined,
            contractId: undefined,
            submittedAt: undefined,
            category: 'BIOLOGICAL_WEIGHT',
            contentType: undefined,
            description: undefined,
            redactionStatus: undefined,
            viewUrl: null,
            subjectAlias: undefined,
          },
        ],
      });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('fury_user_id = $1'),
        ['fury-user-1'],
      );

      // The queue projects every proofs column it maps into the response; each
      // must exist on the real `proofs` table or the audit queue 500s at runtime.
      const [sql] = mockPool.query.mock.calls[0] as [string];
      for (const column of [
        'p.media_uri',
        'p.masked_media_uri',
        'p.redaction_status',
        'p.content_type',
        'p.contract_id',
        'p.submitted_at',
        'p.description',
      ]) {
        expect(sql).toContain(column);
      }
    });

    // The invariant: a Fury auditor is NEVER served raw media, and the decision
    // keys on the PRESENCE of a masked asset — not on the redaction_status
    // string, which the production finalize path writes as 'MASKED' while the
    // dev-only worker fallback writes 'COMPLETED'. The old code compared against
    // 'COMPLETED' only and fell through to media_uri, so the production path
    // leaked the unredacted original to peer reviewers.
    it.each(['MASKED', 'COMPLETED', 'NOT_APPLICABLE', null])(
      'signs the MASKED asset and never the raw one (redaction_status=%s)',
      async (redactionStatus) => {
        mockPool.query.mockResolvedValueOnce({
          rows: [
            {
              assignment_id: 'a-1',
              proof_id: 'p-1',
              media_uri: 'raw/original.mp4',
              masked_media_uri: 'masked/redacted.mp4',
              redaction_status: redactionStatus,
              oath_category: 'RECOVERY_NOCONTACT',
            },
          ],
        });

        const result = await controller.getAssignments({ id: 'fury-user-1' });

        expect(result.assignments[0].viewUrl).toBe('https://signed.example/masked/redacted.mp4');
        expect(mockR2.generateViewUrl).toHaveBeenCalledWith('masked/redacted.mp4');
        expect(mockR2.generateViewUrl).not.toHaveBeenCalledWith('raw/original.mp4');
      },
    );

    it('fails CLOSED — no masked asset means no url, never the raw original', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            assignment_id: 'a-1',
            proof_id: 'p-1',
            media_uri: 'raw/original.mp4',
            masked_media_uri: null,
            // Even a status claiming redaction finished cannot conjure an asset.
            redaction_status: 'COMPLETED',
            oath_category: 'RECOVERY_NOCONTACT',
          },
        ],
      });

      const result = await controller.getAssignments({ id: 'fury-user-1' });

      expect(result.assignments[0].viewUrl).toBeNull();
      expect(mockR2.generateViewUrl).not.toHaveBeenCalled();
    });

    it('should return empty assignments when Fury has no pending reviews', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await controller.getAssignments({ id: 'fury-idle' });

      expect(result).toEqual({ assignments: [] });
    });
  });

  describe('submitVerdict', () => {
    it('should record the verdict, log to TruthLog, and check consensus', async () => {
      // UPDATE fury_assignments ... RETURNING proof_id (one row updated)
      mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ proof_id: 'proof-1' }] });

      const result = await controller.submitVerdict(
        { id: 'fury-1' },
        { assignmentId: 'assign-1', verdict: 'PASS' },
      );

      expect(result).toEqual({ status: 'verdict_recorded' });

      // Verify UPDATE was called with user ID from @CurrentUser and the no-revote guard
      const updateCall = mockPool.query.mock.calls[0];
      expect(updateCall[0]).toMatch(/UPDATE fury_assignments SET verdict/);
      expect(updateCall[0]).toMatch(/verdict IS NULL/);
      expect(updateCall[1]).toEqual(['PASS', null, 'assign-1', 'fury-1']);

      // Verify TruthLog
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('FURY_VERDICT', {
        assignmentId: 'assign-1',
        furyUserId: 'fury-1',
        verdict: 'PASS',
      });

      // Verify consensus check
      expect(mockFuryWorker.checkConsensus).toHaveBeenCalledWith('proof-1');
    });

    it('should handle FAIL verdict', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ proof_id: 'proof-2' }] });

      await controller.submitVerdict(
        { id: 'fury-2' },
        { assignmentId: 'assign-2', verdict: 'FAIL', rejectionCode: FuryViolationCode.MEDIA_TAMPERED },
      );

      const updateCall = mockPool.query.mock.calls[0];
      expect(updateCall[1]).toEqual(['FAIL', FuryViolationCode.MEDIA_TAMPERED, 'assign-2', 'fury-2']);
    });

    it('should reject and not check consensus when no row is updated (invalid assignment or re-vote)', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // UPDATE affected nothing

      await expect(
        controller.submitVerdict(
          { id: 'fury-1' },
          { assignmentId: 'assign-ghost', verdict: 'PASS' },
        ),
      ).rejects.toThrow();

      expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
      expect(mockFuryWorker.checkConsensus).not.toHaveBeenCalled();
    });
  });
});

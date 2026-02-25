import { FuryController } from './fury.controller';
import { FuryWorker } from './fury.worker';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { Pool } from 'pg';

describe('FuryController', () => {
  let controller: FuryController;
  let mockPool: { query: jest.Mock };

  const mockFuryWorker = {
    checkConsensus: jest.fn().mockResolvedValue(undefined),
  } as unknown as FuryWorker;

  const mockTruthLog = {
    appendEvent: jest.fn().mockResolvedValue('log-id'),
  } as unknown as TruthLogService;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    controller = new FuryController(
      mockPool as unknown as Pool,
      mockFuryWorker,
      mockTruthLog,
      {} as any
    );
    jest.clearAllMocks();
  });

  describe('getAssignments', () => {
    it('should return pending assignments for a Fury user', async () => {
      const assignments = [
        { assignment_id: 'a-1', proof_id: 'p-1', media_uri: 'https://r2.styx.app/video.mp4' },
        { assignment_id: 'a-2', proof_id: 'p-2', media_uri: 'https://r2.styx.app/video2.mp4' },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: assignments });

      const result = await controller.getAssignments({ id: 'fury-user-1' });

      expect(result).toEqual({ assignments });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('fury_user_id = $1'),
        ['fury-user-1'],
      );
    });

    it('should return empty assignments when Fury has no pending reviews', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await controller.getAssignments({ id: 'fury-idle' });

      expect(result).toEqual({ assignments: [] });
    });
  });

  describe('submitVerdict', () => {
    it('should record the verdict, log to TruthLog, and check consensus', async () => {
      // UPDATE fury_assignments
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // SELECT proof_id
      mockPool.query.mockResolvedValueOnce({ rows: [{ proof_id: 'proof-1' }] });

      const result = await controller.submitVerdict(
        { id: 'fury-1' },
        { assignmentId: 'assign-1', verdict: 'PASS' },
      );

      expect(result).toEqual({ status: 'verdict_recorded' });

      // Verify UPDATE was called with user ID from @CurrentUser
      const updateCall = mockPool.query.mock.calls[0];
      expect(updateCall[0]).toMatch(/UPDATE fury_assignments SET verdict/);
      expect(updateCall[1]).toEqual(['PASS', 'assign-1', 'fury-1']);

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
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ proof_id: 'proof-2' }] });

      await controller.submitVerdict(
        { id: 'fury-2' },
        { assignmentId: 'assign-2', verdict: 'FAIL' },
      );

      const updateCall = mockPool.query.mock.calls[0];
      expect(updateCall[1]).toEqual(['FAIL', 'assign-2', 'fury-2']);
    });

    it('should not check consensus if assignment is not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no assignment found

      await controller.submitVerdict(
        { id: 'fury-1' },
        { assignmentId: 'assign-ghost', verdict: 'PASS' },
      );

      expect(mockFuryWorker.checkConsensus).not.toHaveBeenCalled();
    });
  });
});

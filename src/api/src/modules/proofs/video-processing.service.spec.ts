import { VideoProcessingService } from './video-processing.service';

jest.mock('bullmq', () => {
  const mockAdd = jest.fn();
  const MockQueue = jest.fn(() => ({
    add: mockAdd,
  }));
  return {
    Queue: MockQueue,
  };
});

import { Pool } from 'pg';

describe('VideoProcessingService', () => {
  let service: VideoProcessingService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new VideoProcessingService(mockPool as unknown as Pool);
  });

  describe('dispatchForProcessing', () => {
    const proofId = '550e8400-e29b-41d4-a716-446655440000';

    it('issues a challenge token and updates processing_status to PROCESSING', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: proofId, user_id: 'user-1', media_uri: 's3://bucket/video.mp4' }],
      });

      await service.dispatchForProcessing(proofId);

      const updateCall = mockPool.query.mock.calls[0];
      expect(updateCall[0]).toContain("processing_status = 'PROCESSING'");
      expect(updateCall[0]).toContain('challenge_token = $1');
      expect(updateCall[1]).toHaveLength(2);
      expect(typeof updateCall[1][0]).toBe('string'); // challenge token
      expect(updateCall[1][1]).toBe(proofId);
    });

    it('skips if proof not eligible (already processing or no media)', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.dispatchForProcessing(proofId);

      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispatchPendingProofs', () => {
    it('picks up pending proofs and dispatches each', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { id: 'proof-1' },
          { id: 'proof-2' },
        ],
      });
      mockPool.query.mockResolvedValue({ rows: [{ id: 'x', user_id: 'u', media_uri: 'uri' }] });

      const count = await service.dispatchPendingProofs();

      expect(count).toBe(2);
    });

    it('returns 0 when no pending proofs', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const count = await service.dispatchPendingProofs();

      expect(count).toBe(0);
    });
  });
});

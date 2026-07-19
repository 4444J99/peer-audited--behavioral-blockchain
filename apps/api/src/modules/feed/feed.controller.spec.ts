import { FeedController } from './feed.controller';
import { Pool } from 'pg';

describe('FeedController', () => {
  let controller: FeedController;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    controller = new FeedController(mockPool as unknown as Pool);
    jest.clearAllMocks();
  });

  // ─── getFeed ───

  describe('getFeed', () => {
    it('should return events from the database', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          {
            event_type: 'PROOF_VERIFIED',
            payload: {},
            created_at: new Date('2026-02-27T10:00:00Z'),
            actor_id: 'user-abc123',
          },
        ],
      });

      const result = await controller.getFeed();
      expect(result.events).toHaveLength(1);
      expect(result.events[0].type).toBe('PROOF_VERIFIED');
      expect(result.events[0].message).toContain('styx_user');
    });

    it('should default limit to 20 when not provided', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await controller.getFeed();
      const params = mockPool.query.mock.calls[0][1];
      expect(params[0]).toBe(20);
    });

    it('should respect custom limit parameter', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await controller.getFeed('10');
      const params = mockPool.query.mock.calls[0][1];
      expect(params[0]).toBe(10);
    });

    it('should cap limit at 50', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await controller.getFeed('100');
      const params = mockPool.query.mock.calls[0][1];
      expect(params[0]).toBe(50);
    });

    it('should handle NaN limit gracefully', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await controller.getFeed('invalid');
      const params = mockPool.query.mock.calls[0][1];
      expect(params[0]).toBe(20);
    });

    it('should anonymize actor IDs in events', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          {
            event_type: 'CONTRACT_COMPLETED',
            payload: { oathCategory: 'Biological' },
            created_at: new Date('2026-02-27T10:00:00Z'),
            actor_id: 'user-1234-full-uuid',
          },
        ],
      });

      const result = await controller.getFeed();
      expect(result.events[0].message).toContain('styx_user');
      expect(result.events[0].message).not.toContain('user-1234-full-uuid');
    });

    it('should generate event IDs from timestamp', async () => {
      const ts = new Date('2026-02-27T10:00:00Z');
      mockPool.query.mockResolvedValue({
        rows: [{
          event_type: 'PROOF_VERIFIED',
          payload: {},
          created_at: ts,
          actor_id: 'u1',
        }],
      });

      const result = await controller.getFeed();
      expect(result.events[0].id).toBe(`evt_${ts.getTime()}`);
    });

    it('should return empty events array when no rows', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await controller.getFeed();
      expect(result.events).toEqual([]);
    });

    it('should use "System" for null actor_id', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{
          event_type: 'PROOF_VERIFIED',
          payload: {},
          created_at: new Date(),
          actor_id: null,
        }],
      });

      const result = await controller.getFeed();
      expect(result.events[0].message).toContain('System');
    });
  });

  // ─── formatEventMessage (tested via getFeed) ───

  describe('event message formatting', () => {
    const makeRow = (type: string, payload: any = {}, actorId = 'user-abcd') => ({
      event_type: type,
      payload,
      created_at: new Date(),
      actor_id: actorId,
    });

    it('should format PROOF_VERIFIED message', async () => {
      mockPool.query.mockResolvedValue({ rows: [makeRow('PROOF_VERIFIED')] });
      const result = await controller.getFeed();
      expect(result.events[0].message).toContain('peer review');
    });

    it('should format CONTRACT_COMPLETED with oath category', async () => {
      mockPool.query.mockResolvedValue({
        rows: [makeRow('CONTRACT_COMPLETED', { oathCategory: 'Cognitive' })],
      });
      const result = await controller.getFeed();
      expect(result.events[0].message).toContain('Cognitive');
    });

    it('should format CONTRACT_FAILED message', async () => {
      mockPool.query.mockResolvedValue({ rows: [makeRow('CONTRACT_FAILED')] });
      const result = await controller.getFeed();
      expect(result.events[0].message).toContain('forfeited');
    });

    it('should format FURY_BOUNTY_PAID message', async () => {
      mockPool.query.mockResolvedValue({ rows: [makeRow('FURY_BOUNTY_PAID')] });
      const result = await controller.getFeed();
      expect(result.events[0].message).toContain('Fury bounty');
    });

    it('should format APPEAL_INITIATED message', async () => {
      mockPool.query.mockResolvedValue({ rows: [makeRow('APPEAL_INITIATED')] });
      const result = await controller.getFeed();
      expect(result.events[0].message).toContain('appealed');
    });

    it('should format DISPUTE_RESOLVED with outcome', async () => {
      mockPool.query.mockResolvedValue({
        rows: [makeRow('DISPUTE_RESOLVED', { outcome: 'UPHELD' })],
      });
      const result = await controller.getFeed();
      expect(result.events[0].message).toContain('upheld');
    });

    it('should format HONEYPOT_CAUGHT message', async () => {
      mockPool.query.mockResolvedValue({ rows: [makeRow('HONEYPOT_CAUGHT')] });
      const result = await controller.getFeed();
      expect(result.events[0].message).toContain('calibration');
    });

    it('should format STREAK_MILESTONE with day count', async () => {
      mockPool.query.mockResolvedValue({
        rows: [makeRow('STREAK_MILESTONE', { days: 30 })],
      });
      const result = await controller.getFeed();
      expect(result.events[0].message).toContain('30');
    });

    it('should use fallback for unknown event types', async () => {
      mockPool.query.mockResolvedValue({
        rows: [makeRow('UNKNOWN_EVENT_TYPE')],
      });
      const result = await controller.getFeed();
      expect(result.events[0].message).toContain('triggered an event');
    });
  });
});

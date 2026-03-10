import { UsersService } from './users.service';
import { NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';

const mockPool = {
  query: jest.fn(),
} as unknown as Pool;

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService(mockPool);
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile for valid userId', async () => {
      const user = {
        id: 'user-1',
        email: 'demo@styx.protocol',
        integrity_score: 75,
        role: 'USER',
        status: 'ACTIVE',
        created_at: '2025-01-01',
        kyc_status: 'NOT_STARTED',
        age_verification_status: 'NOT_STARTED',
        identity_provider: null,
        identity_verification_id: null,
        identity_verified_at: null,
      };
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [user] })
        .mockResolvedValueOnce({ rows: [{ count: '2', total: '150.00' }] });

      const result = await service.getProfile('user-1');

      expect(result).toEqual(expect.objectContaining({
        id: 'user-1',
        email: 'demo@styx.protocol',
        integrity_score: 75,
        tier: 'STANDARD',
        contract_count: 2,
        total_staked: 150.00,
        role: 'USER',
        status: 'ACTIVE',
        compliance: expect.objectContaining({
          kyc_status: 'NOT_STARTED',
          age_verification_status: 'NOT_STARTED',
          is_kyc_verified: false,
          is_age_verified: false,
        }),
      }));
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, email'),
        ['user-1'],
      );
    });

    it('should throw NotFoundException for unknown userId', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(service.getProfile('unknown-id'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getPublicProfile', () => {
    it('should return limited public profile fields', async () => {
      const publicData = { id: 'user-1', integrity_score: 75, created_at: '2025-01-01' };
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [publicData] });

      const result = await service.getPublicProfile('user-1');

      expect(result).toEqual(publicData);
    });

    it('should throw NotFoundException for unknown userId', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(service.getPublicProfile('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getLeaderboard', () => {
    it('should return users sorted by integrity_score descending', async () => {
      const leaders = [
        { id: 'u3', email: 'admin@styx.protocol', integrity_score: 200, created_at: '2025-01-01' },
        { id: 'u2', email: 'fury@styx.protocol', integrity_score: 90, created_at: '2025-01-01' },
        { id: 'u1', email: 'demo@styx.protocol', integrity_score: 75, created_at: '2025-01-01' },
      ];
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: leaders });

      const result = await service.getLeaderboard(10);

      expect(result).toHaveLength(3);
      expect(result[0].integrity_score).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY integrity_score DESC'),
        [10],
      );
    });

    it('should default to 10 results', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await service.getLeaderboard();

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        [10],
      );
    });

    it('should cap limit at 100', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await service.getLeaderboard(500);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        [100],
      );
    });

    it('should filter by weekly activity when period is "weekly"', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await service.getLeaderboard(10, 'weekly');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INTERVAL '7 days'"),
        [10],
      );
    });

    it('should filter by monthly activity when period is "monthly"', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await service.getLeaderboard(10, 'monthly');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INTERVAL '30 days'"),
        [10],
      );
    });

    it('should not add interval filter for alltime period', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await service.getLeaderboard(10, 'alltime');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.not.stringContaining('INTERVAL'),
        [10],
      );
    });

    it('should not add interval filter when period is undefined', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await service.getLeaderboard(10);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.not.stringContaining('INTERVAL'),
        [10],
      );
    });
  });

  describe('requestDeletion', () => {
    it('should mark user as pending deletion and stamp deletion_requested_at', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 'user-1', status: 'ACTIVE' }] }) // SELECT
        .mockResolvedValueOnce({ rows: [] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }); // event log

      const result = await service.requestDeletion('user-1');

      expect(result).toEqual({ status: 'deletion_requested' });
      expect((mockPool.query as jest.Mock).mock.calls[1][0]).toContain(
        "UPDATE users SET status = 'PENDING_DELETION', deletion_requested_at = NOW() WHERE id = $1",
      );
      expect((mockPool.query as jest.Mock).mock.calls[1][1]).toEqual(['user-1']);
    });

    it('should throw NotFoundException when requesting deletion for unknown user', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(service.requestDeletion('missing-user')).rejects.toThrow(NotFoundException);
    });
  });
});

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
      const user = { id: 'user-1', email: 'demo@styx.protocol', integrity_score: 75, status: 'ACTIVE', created_at: '2025-01-01' };
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [user] });

      const result = await service.getProfile('user-1');

      expect(result).toEqual(user);
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
  });
});

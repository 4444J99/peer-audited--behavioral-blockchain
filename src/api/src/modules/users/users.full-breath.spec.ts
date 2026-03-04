import { BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Pool } from 'pg';

describe('UsersService (Full Breath Features)', () => {
  let service: UsersService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new UsersService(mockPool as unknown as Pool);
  });

  describe('setSelfExclusion', () => {
    it('should set self_exclusion_expires_at and log event', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // INSERT log

      const result = await service.setSelfExclusion('user-1', 30);

      expect(result.status).toBe('self_exclusion_activated');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET self_exclusion_expires_at = $1'),
        [expect.any(String), 'user-1'],
      );
    });

    it('should throw BadRequestException for invalid duration', async () => {
      await expect(service.setSelfExclusion('u1', 0)).rejects.toThrow(BadRequestException);
      await expect(service.setSelfExclusion('u1', 400)).rejects.toThrow(BadRequestException);
    });
  });
});

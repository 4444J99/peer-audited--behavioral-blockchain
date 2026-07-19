import { BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Pool } from 'pg';

describe('UsersService (Full Breath Features)', () => {
  let service: UsersService;
  let mockPool: { query: jest.Mock; connect: jest.Mock };
  let mockClient: { query: jest.Mock; release: jest.Mock };

  beforeEach(() => {
    // The audit event is appended to the tamper-evident chain via a pooled
    // client transaction, so the pool now needs a connect() returning a client.
    mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    };
    mockPool = {
      query: jest.fn(),
      connect: jest.fn().mockResolvedValue(mockClient),
    };
    service = new UsersService(mockPool as unknown as Pool);
  });

  describe('setSelfExclusion', () => {
    it('should set self_exclusion_expires_at and log event', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE

      const result = await service.setSelfExclusion('user-1', 30);

      expect(result.status).toBe('self_exclusion_activated');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET self_exclusion_expires_at = $1'),
        [expect.any(String), 'user-1'],
      );

      // The event is logged to the tamper-evident chain via a client transaction.
      expect(mockPool.connect).toHaveBeenCalled();
      const clientSql = mockClient.query.mock.calls.map((c) => String(c[0]));
      expect(clientSql).toContain('BEGIN');
      expect(clientSql.some((sql) => sql.includes('INSERT INTO event_log'))).toBe(true);
      expect(clientSql).toContain('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid duration', async () => {
      await expect(service.setSelfExclusion('u1', 0)).rejects.toThrow(BadRequestException);
      await expect(service.setSelfExclusion('u1', 400)).rejects.toThrow(BadRequestException);
    });
  });
});

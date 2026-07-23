import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { ChurnDetectionService } from './churn-detection.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('ChurnDetectionService', () => {
  let service: ChurnDetectionService;
  let pool: { query: jest.Mock };
  let notifications: jest.Mocked<NotificationsService>;

  beforeEach(async () => {
    const createNotification = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChurnDetectionService,
        { provide: Pool, useValue: { query: jest.fn() } },
        {
          provide: NotificationsService,
          useValue: { create: createNotification },
        },
      ],
    }).compile();

    service = module.get(ChurnDetectionService);
    pool = module.get(Pool);
    notifications = module.get(NotificationsService);
  });

  describe('scan', () => {
    it('returns empty array when no users are at risk', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await service.scan();
      expect(result).toEqual([]);
    });

    it('classifies user as HIGH when inactive for 14+ days', async () => {
      const fourteenDaysAgo = new Date(Date.now() - 15 * 86400000);
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'user-1',
            email: 'test@test.com',
            integrity_score: 80,
            last_active_at: fourteenDaysAgo,
            consecutive_missed_proofs: 0,
          }],
        })
        .mockResolvedValueOnce({ rows: [{ count: 1 }] }) // checkActiveContracts
        .mockResolvedValueOnce({ rows: [{ has_enough_data: false }] }); // checkDecliningAttestationRate

      const result = await service.scan();
      expect(result).toHaveLength(1);
      expect(result[0].risk).toBe('HIGH');
      expect(result[0].signals).toContain('No activity in 14+ days');
    });

    it('classifies user as CRITICAL when inactive for 30+ days', async () => {
      const thirtyDaysAgo = new Date(Date.now() - 31 * 86400000);
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'user-2',
            email: 'churned@test.com',
            integrity_score: 40,
            last_active_at: thirtyDaysAgo,
            consecutive_missed_proofs: 0,
          }],
        })
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // checkActiveContracts
        .mockResolvedValueOnce({ rows: [{ has_enough_data: false }] }); // checkDecliningAttestationRate

      const result = await service.scan();
      expect(result).toHaveLength(1);
      expect(result[0].risk).toBe('CRITICAL');
      expect(result[0].signals).toContain('No activity in 30+ days');
      expect(result[0].signals).toContain('No active contracts');
    });

    it('includes missed proofs signal', async () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 86400000);
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'user-3',
            email: 'struggling@test.com',
            integrity_score: 60,
            last_active_at: fiveDaysAgo,
            consecutive_missed_proofs: 5,
          }],
        })
        .mockResolvedValueOnce({ rows: [{ count: 1 }] }) // checkActiveContracts
        .mockResolvedValueOnce({ rows: [{ has_enough_data: false }] }); // checkDecliningAttestationRate

      const result = await service.scan();
      expect(result).toHaveLength(1);
      expect(result[0].signals).toContain('5 consecutive missed proofs');
    });

    it('skips users active within 3 days (SQL WHERE clause filters them)', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const result = await service.scan();
      expect(result).toHaveLength(0);
    });
  });
});

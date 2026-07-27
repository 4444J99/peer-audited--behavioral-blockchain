import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { AccountabilityPartnerService } from './accountability-partner.service';

describe('AccountabilityPartnerService', () => {
  let service: AccountabilityPartnerService;
  let pool: { query: jest.Mock };

  beforeEach(async () => {
    pool = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountabilityPartnerService,
        { provide: 'DATABASE_POOL', useValue: pool },
      ],
    }).compile();

    service = module.get(AccountabilityPartnerService);
  });

  describe('requestPartnerMatch', () => {
    it('returns a valid match when a compatible partner exists', async () => {
      pool.query.mockResolvedValue({
        rows: [
          {
            id: 'user-abc',
            alias: 'alpha',
            oath_categories: ['BIOLOGICAL_WEIGHT', 'SUBSTANCE_USE'],
          },
        ],
      });

      const result = await service.requestPartnerMatch('user-xyz', [
        'BIOLOGICAL_WEIGHT',
        'SUBSTANCE_USE',
      ]);

      expect(result.partnerId).toBe('user-abc');
      expect(result.alias).toBe('alpha');
      expect(result.sharedCategories).toEqual([
        'BIOLOGICAL_WEIGHT',
        'SUBSTANCE_USE',
      ]);
      expect(result.mutualInterestScore).toBe(1);
    });

    it('returns placeholder when no compatible partner found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await service.requestPartnerMatch('user-xyz', [
        'BIOLOGICAL_WEIGHT',
      ]);

      expect(result.partnerId).toBe('partner-user-xyz');
      expect(result.sharedCategories).toEqual(['BIOLOGICAL_WEIGHT']);
      expect(result.mutualInterestScore).toBe(0);
    });
  });

  describe('scheduleCheckIn', () => {
    it('creates a check-in record', async () => {
      pool.query.mockResolvedValue({
        rows: [
          {
            id: 'chk-1',
            contract_id: 'c1',
            partner_id: 'p1',
            type: 'SCHEDULED',
            status: 'PENDING',
            scheduled_at: new Date('2026-07-23T10:00:00Z'),
            completed_at: null,
            message: null,
          },
        ],
      });

      const result = await service.scheduleCheckIn('c1', 'p1', 'SCHEDULED');

      expect(result.id).toBe('chk-1');
      expect(result.contractId).toBe('c1');
      expect(result.partnerId).toBe('p1');
      expect(result.type).toBe('SCHEDULED');
      expect(result.status).toBe('PENDING');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO partner_checkins'),
        expect.arrayContaining(['c1', 'p1', 'SCHEDULED']),
      );
    });
  });

  describe('completeCheckIn', () => {
    it('updates status to COMPLETED', async () => {
      pool.query.mockResolvedValue({
        rows: [
          {
            id: 'chk-1',
            contract_id: 'c1',
            partner_id: 'p1',
            type: 'SCHEDULED',
            status: 'COMPLETED',
            scheduled_at: new Date('2026-07-23T10:00:00Z'),
            completed_at: new Date(),
            message: 'Checked in on time',
          },
        ],
      });

      const result = await service.completeCheckIn('chk-1', 'Checked in on time');

      expect(result.status).toBe('COMPLETED');
      expect(result.completedAt).toBeDefined();
      expect(result.message).toBe('Checked in on time');
    });

    it('throws when check-in not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await expect(
        service.completeCheckIn('nonexistent', 'msg'),
      ).rejects.toThrow('Check-in nonexistent not found');
    });
  });

  describe('escalateMissedCheckIn', () => {
    const baseCheckIn = {
      contract_id: 'c1',
      partner_id: 'p1',
    };

    it('returns NOTIFY for 1st consecutive miss', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [baseCheckIn] })
        .mockResolvedValueOnce({ rows: [{ consecutive_misses: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.escalateMissedCheckIn('chk-1');

      expect(result.level).toBe('NOTIFY');
      expect(result.message).toContain('Soft reminder');
    });

    it('returns STAKE_WARNING for 2nd consecutive miss', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [baseCheckIn] })
        .mockResolvedValueOnce({ rows: [{ consecutive_misses: 2 }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.escalateMissedCheckIn('chk-2');

      expect(result.level).toBe('STAKE_WARNING');
      expect(result.message).toContain('Stake warning');
    });

    it('returns CRISIS_TEAM for 3rd+ consecutive miss', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [baseCheckIn] })
        .mockResolvedValueOnce({ rows: [{ consecutive_misses: 3 }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.escalateMissedCheckIn('chk-3');

      expect(result.level).toBe('CRISIS_TEAM');
      expect(result.message).toContain('Safety team alerted');
    });

    it('throws when check-in not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.escalateMissedCheckIn('nonexistent'),
      ).rejects.toThrow('Check-in nonexistent not found');
    });
  });

  describe('getCheckInHistory', () => {
    it('returns array of check-ins with default limit 20', async () => {
      const rows = Array.from({ length: 5 }, (_, i) => ({
        id: `chk-${i}`,
        contract_id: 'c1',
        partner_id: 'p1',
        type: 'SCHEDULED',
        status: 'COMPLETED',
        scheduled_at: new Date(),
        completed_at: new Date(),
        message: null,
      }));

      pool.query.mockResolvedValue({ rows });

      const result = await service.getCheckInHistory('c1');

      expect(result).toHaveLength(5);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        ['c1', 20],
      );
    });

    it('respects custom limit', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await service.getCheckInHistory('c1', 5);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        ['c1', 5],
      );
    });
  });

  describe('getActivePartnerships', () => {
    it('returns partner matches for a user', async () => {
      pool.query.mockResolvedValue({
        rows: [
          {
            partner_id: 'p1',
            alias: 'buddy',
            oath_categories: ['BIOLOGICAL_WEIGHT'],
          },
        ],
      });

      const result = await service.getActivePartnerships('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].partnerId).toBe('p1');
      expect(result[0].alias).toBe('buddy');
    });
  });
});

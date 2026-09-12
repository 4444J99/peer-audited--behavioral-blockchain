import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { UnitEconomicsService } from './unit-economics.service';

describe('UnitEconomicsService', () => {
  let service: UnitEconomicsService;
  let pool: Pool;

  const mockPool = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitEconomicsService,
        { provide: Pool, useValue: mockPool },
      ],
    }).compile();

    service = module.get<UnitEconomicsService>(UnitEconomicsService);
    pool = module.get<Pool>(Pool);
    mockPool.query.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCACByChannel', () => {
    it('should calculate CAC per channel correctly with referral rewards included', async () => {
      // 1. Signups
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { channel: 'creator', count: 100 },
          { channel: 'referral', count: 50 },
          { channel: 'organic', count: 200 },
        ],
      });
      // 2. Activations
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { channel: 'creator', activations: 30 },
          { channel: 'referral', activations: 25 },
          { channel: 'organic', activations: 80 },
        ],
      });
      // 3. Referral paid reward cost
      mockPool.query.mockResolvedValueOnce({
        rows: [{ referral_cost: 12500 }], // $125.00
      });

      const cacResults = await service.getCACByChannel();

      const organic = cacResults.find((c) => c.channel === 'organic');
      expect(organic).toBeDefined();
      expect(organic?.cacCents).toBe(0); // organic has $0 budget

      const referral = cacResults.find((c) => c.channel === 'referral');
      expect(referral).toBeDefined();
      expect(referral?.totalCostCents).toBe(12500);
      expect(referral?.activations).toBe(25);
      expect(referral?.cacCents).toBe(500); // 12500 / 25 = 500 cents ($5.00)

      const creator = cacResults.find((c) => c.channel === 'creator');
      expect(creator).toBeDefined();
      expect(creator?.activations).toBe(30);
      expect(creator?.cacCents).toBe(Math.round(150000 / 30)); // 5000 cents ($50.00)
    });
  });

  describe('getCohortLTV', () => {
    it('should calculate cohort retention and LTV from captured stakes and user activity', async () => {
      // 1. Cohorts user counts
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { cohort_month: '2026-07', users_count: 50, active_users_count: 35 },
          { cohort_month: '2026-08', users_count: 100, active_users_count: 85 },
        ],
      });
      // 2. Cohort revenue
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { cohort_month: '2026-07', captured_stakes_cents: 25000 },
          { cohort_month: '2026-08', captured_stakes_cents: 80000 },
        ],
      });

      const cohorts = await service.getCohortLTV();
      expect(cohorts).toHaveLength(2);

      const july = cohorts[0];
      expect(july.cohortMonth).toBe('2026-07');
      expect(july.usersCount).toBe(50);
      expect(july.activeUsersCount).toBe(35);
      expect(july.retentionRate).toBe(0.7);
      expect(july.totalRevenueCents).toBe(25000);
      expect(july.ltvCents).toBe(500); // 25000 / 50 = 500 cents ($5.00)

      const aug = cohorts[1];
      expect(aug.cohortMonth).toBe('2026-08');
      expect(aug.usersCount).toBe(100);
      expect(aug.retentionRate).toBe(0.85);
      expect(aug.ltvCents).toBe(800); // 80000 / 100 = 800 cents ($8.00)
    });
  });

  describe('getUnitEconomicsSummary', () => {
    it('should aggregate CAC, LTV, LTV:CAC ratio and payback period', async () => {
      jest.spyOn(service, 'getCACByChannel').mockResolvedValue([
        { channel: 'referral', signups: 50, activations: 20, totalCostCents: 10000, cacCents: 500 },
        { channel: 'organic', signups: 100, activations: 30, totalCostCents: 0, cacCents: 0 },
      ]);

      jest.spyOn(service, 'getCohortLTV').mockResolvedValue([
        {
          cohortMonth: '2026-08',
          usersCount: 50,
          activeUsersCount: 45,
          retentionRate: 0.9,
          totalRevenueCents: 50000,
          ltvCents: 1000,
        },
      ]);

      const summary = await service.getUnitEconomicsSummary();

      // Total cost = 10000, total activations = 50 -> blended CAC = 200 cents ($2.00)
      expect(summary.blendedCacCents).toBe(200);
      // Total revenue = 50000, total users = 50 -> blended LTV = 1000 cents ($10.00)
      expect(summary.blendedLtvCents).toBe(1000);
      // LTV:CAC = 1000 / 200 = 5.0x
      expect(summary.ltvToCacRatio).toBe(5);
      expect(summary.paybackPeriodMonths).toBeGreaterThan(0);
      expect(summary.monthlyChurnRate).toBe(0.1);
      expect(summary.netRevenueRetentionPct).toBe(95);
    });
  });
});

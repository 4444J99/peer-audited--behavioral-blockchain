import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { Pool } from 'pg';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockPool = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: Pool, useValue: mockPool },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMetrics', () => {
    it('aggregates escrow balance, active users, fraud rate, and payout volume', async () => {
      // Promise.all preserves call order: staked, active users, settlements.
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total_staked: '150000' }] })
        .mockResolvedValueOnce({ rows: [{ active_users: '42' }] })
        .mockResolvedValueOnce({
          rows: [{ payout_volume: '90000', settled_count: '10', fraud_count: '3' }],
        });

      const metrics = await service.getMetrics();

      expect(metrics).toEqual({
        total_staked: 150000,
        active_users: 42,
        fraud_rate: 0.3,
        payout_volume: 90000,
      });
    });

    it('returns a zero fraud_rate when no settlements have completed', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total_staked: '0' }] })
        .mockResolvedValueOnce({ rows: [{ active_users: '0' }] })
        .mockResolvedValueOnce({
          rows: [{ payout_volume: '0', settled_count: '0', fraud_count: '0' }],
        });

      const metrics = await service.getMetrics();

      expect(metrics.fraud_rate).toBe(0);
      expect(metrics.payout_volume).toBe(0);
      expect(metrics.total_staked).toBe(0);
    });

    it('reads the escrow balance from the SYSTEM_ESCROW account', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total_staked: '500' }] })
        .mockResolvedValueOnce({ rows: [{ active_users: '1' }] })
        .mockResolvedValueOnce({
          rows: [{ payout_volume: '0', settled_count: '0', fraud_count: '0' }],
        });

      await service.getMetrics();

      expect(mockPool.query.mock.calls[0][0]).toContain('SYSTEM_ESCROW');
      expect(mockPool.query.mock.calls[1][0]).toContain("status = 'ACTIVE'");
      expect(mockPool.query.mock.calls[2][0]).toContain("status = 'SUCCESS'");
    });
  });
});

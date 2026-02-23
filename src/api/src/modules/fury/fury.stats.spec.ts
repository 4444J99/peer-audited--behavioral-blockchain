import { FuryController } from './fury.controller';
import { FuryWorker } from './fury.worker';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { Pool } from 'pg';

describe('FuryController — GET /fury/stats', () => {
  let controller: FuryController;
  let mockPool: { query: jest.Mock };

  const mockFuryWorker = {
    checkConsensus: jest.fn().mockResolvedValue(undefined),
  } as unknown as FuryWorker;

  const mockTruthLog = {
    appendEvent: jest.fn().mockResolvedValue('log-id'),
  } as unknown as TruthLogService;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    controller = new FuryController(
      mockPool as unknown as Pool,
      mockFuryWorker,
      mockTruthLog,
    );
    jest.clearAllMocks();
  });

  it('should return complete Fury stats with earnings', async () => {
    // Audit stats query
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        total_audits: '47',
        successful_audits: '42',
        false_accusations: '1',
        honeypots_caught: '3',
        honeypots_failed: '0',
      }],
    });

    // User account_id lookup
    mockPool.query.mockResolvedValueOnce({
      rows: [{ account_id: 'acct-fury-1' }],
    });

    // Bounties earned
    mockPool.query.mockResolvedValueOnce({
      rows: [{ total: '84.00' }],
    });

    // Penalties paid
    mockPool.query.mockResolvedValueOnce({
      rows: [{ total: '4.00' }],
    });

    const result = await controller.getStats({ id: 'fury-1' });

    expect(result).toEqual({
      totalAudits: 47,
      successfulAudits: 42,
      falseAccusations: 1,
      accuracy: expect.any(Number),
      totalBountiesEarned: 84,
      totalPenaltiesPaid: 4,
      netEarnings: 80,
      honeypotsCaught: 3,
      honeypotsFailedOn: 0,
    });

    // Accuracy should be calculated using the integrity formula
    expect(result.accuracy).toBeGreaterThan(0);
    expect(result.accuracy).toBeLessThanOrEqual(1);
  });

  it('should return zero earnings when Fury has no account_id', async () => {
    // Audit stats query
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        total_audits: '10',
        successful_audits: '8',
        false_accusations: '0',
        honeypots_caught: '1',
        honeypots_failed: '0',
      }],
    });

    // User without account_id
    mockPool.query.mockResolvedValueOnce({
      rows: [{ account_id: null }],
    });

    const result = await controller.getStats({ id: 'fury-no-wallet' });

    expect(result.totalAudits).toBe(10);
    expect(result.successfulAudits).toBe(8);
    expect(result.totalBountiesEarned).toBe(0);
    expect(result.totalPenaltiesPaid).toBe(0);
    expect(result.netEarnings).toBe(0);
  });

  it('should return perfect accuracy for new Fury with zero audits', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        total_audits: '0',
        successful_audits: '0',
        false_accusations: '0',
        honeypots_caught: '0',
        honeypots_failed: '0',
      }],
    });

    mockPool.query.mockResolvedValueOnce({
      rows: [{ account_id: 'acct-new' }],
    });

    mockPool.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });
    mockPool.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await controller.getStats({ id: 'fury-new' });

    expect(result.totalAudits).toBe(0);
    expect(result.accuracy).toBe(1); // Benefit of doubt
    expect(result.netEarnings).toBe(0);
  });

  it('should handle Fury with only penalties (all wrong votes)', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        total_audits: '5',
        successful_audits: '0',
        false_accusations: '5',
        honeypots_caught: '0',
        honeypots_failed: '2',
      }],
    });

    mockPool.query.mockResolvedValueOnce({
      rows: [{ account_id: 'acct-bad' }],
    });

    mockPool.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });
    mockPool.query.mockResolvedValueOnce({ rows: [{ total: '10.00' }] });

    const result = await controller.getStats({ id: 'fury-terrible' });

    expect(result.totalBountiesEarned).toBe(0);
    expect(result.totalPenaltiesPaid).toBe(10);
    expect(result.netEarnings).toBe(-10);
    expect(result.accuracy).toBe(0); // Clamped at 0
    expect(result.honeypotsFailedOn).toBe(2);
  });
});

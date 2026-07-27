import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { PractitionerIntelligenceService } from './practitioner-intelligence.service';

describe('PractitionerIntelligenceService', () => {
  let service: PractitionerIntelligenceService;
  let pool: { query: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PractitionerIntelligenceService,
        { provide: 'DATABASE_POOL', useValue: { query: jest.fn() } },
      ],
    }).compile();

    service = module.get(PractitionerIntelligenceService);
    pool = module.get('DATABASE_POOL');
  });

  describe('getClientRiskProfile', () => {
    it('returns GREEN risk for a healthy user', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ missed: 0 }] })
        .mockResolvedValueOnce({ rows: [{ ratio: '0.1' }] })
        .mockResolvedValueOnce({ rows: [{ total: 5, used: 1 }] })
        .mockResolvedValueOnce({ rows: [{ latest: '10', oldest: '8' }] })
        .mockResolvedValueOnce({ rows: [{ ratio: '0.95' }] })
        .mockResolvedValueOnce({ rows: [{ violations: 0 }] })
        .mockResolvedValueOnce({ rows: [] });

      const profile = await service.getClientRiskProfile('user-1');

      expect(profile.riskLevel).toBe('GREEN');
      expect(profile.riskScore).toBeLessThanOrEqual(30);
      expect(profile.factors).toHaveLength(6);
      expect(profile.userId).toBe('user-1');
      expect(profile.lastUpdated).toBeInstanceOf(Date);
    });

    it('returns RED risk for a high-risk user', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ missed: 10 }] })
        .mockResolvedValueOnce({ rows: [{ ratio: '0.7' }] })
        .mockResolvedValueOnce({ rows: [{ total: 5, used: 5 }] })
        .mockResolvedValueOnce({ rows: [{ latest: '2', oldest: '10' }] })
        .mockResolvedValueOnce({ rows: [{ ratio: '0.3' }] })
        .mockResolvedValueOnce({ rows: [{ violations: 8 }] })
        .mockResolvedValueOnce({ rows: [] });

      const profile = await service.getClientRiskProfile('user-2');

      expect(profile.riskLevel).toBe('RED');
      expect(profile.riskScore).toBeGreaterThanOrEqual(61);
    });

    it('returns YELLOW risk for moderate-risk user', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ missed: 3 }] })
        .mockResolvedValueOnce({ rows: [{ ratio: '0.2' }] })
        .mockResolvedValueOnce({ rows: [{ total: 5, used: 2 }] })
        .mockResolvedValueOnce({ rows: [{ latest: '6', oldest: '8' }] })
        .mockResolvedValueOnce({ rows: [{ ratio: '0.8' }] })
        .mockResolvedValueOnce({ rows: [{ violations: 2 }] })
        .mockResolvedValueOnce({ rows: [] });

      const profile = await service.getClientRiskProfile('user-3');

      expect(profile.riskLevel).toBe('YELLOW');
      expect(profile.riskScore).toBeGreaterThanOrEqual(31);
      expect(profile.riskScore).toBeLessThanOrEqual(60);
    });

    it('derives DECLINING trend from historical data', async () => {
      const trendRows = Array.from({ length: 14 }, (_, i) => ({
        day: `2026-07-${String(i + 1).padStart(2, '0')}`,
        compliance_rate: i < 7 ? '0.9' : '0.5',
      }));

      pool.query
        .mockResolvedValueOnce({ rows: [{ missed: 0 }] })
        .mockResolvedValueOnce({ rows: [{ ratio: '0.1' }] })
        .mockResolvedValueOnce({ rows: [{ total: 5, used: 1 }] })
        .mockResolvedValueOnce({ rows: [{ latest: '10', oldest: '8' }] })
        .mockResolvedValueOnce({ rows: [{ ratio: '0.95' }] })
        .mockResolvedValueOnce({ rows: [{ violations: 0 }] })
        .mockResolvedValueOnce({ rows: trendRows });

      const profile = await service.getClientRiskProfile('user-4');
      expect(profile.trend).toBe('DECLINING');
    });

    it('derives IMPROVING trend when recent scores are lower', async () => {
      const trendRows = Array.from({ length: 14 }, (_, i) => ({
        day: `2026-07-${String(i + 1).padStart(2, '0')}`,
        compliance_rate: i < 7 ? '0.5' : '0.9',
      }));

      pool.query
        .mockResolvedValueOnce({ rows: [{ missed: 0 }] })
        .mockResolvedValueOnce({ rows: [{ ratio: '0.1' }] })
        .mockResolvedValueOnce({ rows: [{ total: 5, used: 1 }] })
        .mockResolvedValueOnce({ rows: [{ latest: '10', oldest: '8' }] })
        .mockResolvedValueOnce({ rows: [{ ratio: '0.95' }] })
        .mockResolvedValueOnce({ rows: [{ violations: 0 }] })
        .mockResolvedValueOnce({ rows: trendRows });

      const profile = await service.getClientRiskProfile('user-5');
      expect(profile.trend).toBe('IMPROVING');
    });
  });

  describe('analyzeJournalEntry', () => {
    it('detects rationalization markers', async () => {
      const alerts = await service.analyzeJournalEntry('user-1', 'I think just one more time wont hurt');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertType).toBe('RATIONALIZATION');
      expect(alerts[0].severity).toBe('MEDIUM');
      expect(alerts[0].userId).toBe('user-1');
      expect(alerts[0].excerpt).toBe('just one more time');
    });

    it('detects crisis language with HIGH severity', async () => {
      const alerts = await service.analyzeJournalEntry('user-2', 'I want to die tonight');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertType).toBe('CRISIS_LANGUAGE');
      expect(alerts[0].severity).toBe('HIGH');
      expect(alerts[0].excerpt).toBe('want to die');
    });

    it('detects distress escalation markers', async () => {
      const alerts = await service.analyzeJournalEntry('user-3', 'Im at my breaking point today');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertType).toBe('DISTRESS_ESCALATION');
      expect(alerts[0].severity).toBe('HIGH');
    });

    it('returns multiple alert types when text contains several markers', async () => {
      const alerts = await service.analyzeJournalEntry(
        'user-4',
        'i can handle it and im falling apart',
      );

      expect(alerts).toHaveLength(2);
      const types = alerts.map((a) => a.alertType);
      expect(types).toContain('RATIONALIZATION');
      expect(types).toContain('DISTRESS_ESCALATION');
    });

    it('returns empty array for clean text', async () => {
      const alerts = await service.analyzeJournalEntry('user-5', 'Had a great day today, feeling motivated and strong');

      expect(alerts).toEqual([]);
    });

    it('detects case-insensitive markers', async () => {
      const alerts = await service.analyzeJournalEntry('user-6', 'EVERYONE DOES IT so why not me');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertType).toBe('RATIONALIZATION');
    });

    it('generates unique alert IDs', async () => {
      const alerts1 = await service.analyzeJournalEntry('u1', 'just one more time');
      const alerts2 = await service.analyzeJournalEntry('u1', 'just one more time');

      expect(alerts1[0].id).not.toBe(alerts2[0].id);
    });
  });

  describe('sendPractitionerAlert', () => {
    it('inserts alert into practitioner_alerts table', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await service.sendPractitionerAlert('prac-1', 'client-1', {
        id: 'alert-1',
        userId: 'client-1',
        alertType: 'RATIONALIZATION',
        excerpt: 'just one more time',
        severity: 'MEDIUM',
        createdAt: new Date('2026-07-23T10:00:00Z'),
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO practitioner_alerts'),
        ['prac-1', 'client-1', 'RATIONALIZATION', 'just one more time', 'MEDIUM', expect.any(Date)],
      );
    });
  });

  describe('calculateAdherenceRate', () => {
    it('returns percentage of completed attestations', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ total: 20, completed: 15 }] });

      const rate = await service.calculateAdherenceRate('user-1', 'contract-1');
      expect(rate).toBe(75);
    });

    it('returns 0 when no attestations exist', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ total: 0, completed: 0 }] });

      const rate = await service.calculateAdherenceRate('user-1', 'contract-1');
      expect(rate).toBe(0);
    });

    it('returns 0 when contractId is empty', async () => {
      const rate = await service.calculateAdherenceRate('user-1', '');
      expect(rate).toBe(0);
    });

    it('returns 100 for perfect adherence', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ total: 10, completed: 10 }] });

      const rate = await service.calculateAdherenceRate('user-1', 'contract-1');
      expect(rate).toBe(100);
    });
  });

  describe('getRiskTrend', () => {
    it('returns daily risk scores as date-score pairs', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { day: '2026-07-20', compliance_rate: '0.8' },
          { day: '2026-07-21', compliance_rate: '0.6' },
          { day: '2026-07-22', compliance_rate: '0.9' },
        ],
      });

      const trend = await service.getRiskTrend('user-1', 30);

      expect(trend).toHaveLength(3);
      expect(trend[0]).toEqual({ date: '2026-07-20', score: 20 });
      expect(trend[1]).toEqual({ date: '2026-07-21', score: 40 });
      expect(trend[2]).toEqual({ date: '2026-07-22', score: 10 });
    });

    it('defaults to 30 days', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await service.getRiskTrend('user-1');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('interval'),
        ['user-1', '30'],
      );
    });

    it('handles empty result set', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const trend = await service.getRiskTrend('user-1');
      expect(trend).toEqual([]);
    });
  });

  describe('getPractitionerDashboard', () => {
    it('returns dashboard for each assigned client', async () => {
      const mockQuery = jest.fn();
      pool.query = mockQuery;

      const assignments = { rows: [{ client_id: 'c1', alias: 'Alice' }, { client_id: 'c2', alias: 'Bob' }] };
      const riskSignals = [
        { rows: [{ missed: 0 }] },
        { rows: [{ ratio: '0.1' }] },
        { rows: [{ total: 5, used: 1 }] },
        { rows: [{ latest: '10', oldest: '8' }] },
        { rows: [{ ratio: '0.95' }] },
        { rows: [{ violations: 0 }] },
        { rows: [] },
        { rows: [{ missed: 2 }] },
        { rows: [{ ratio: '0.3' }] },
        { rows: [{ total: 5, used: 2 }] },
        { rows: [{ latest: '6', oldest: '8' }] },
        { rows: [{ ratio: '0.8' }] },
        { rows: [{ violations: 1 }] },
        { rows: [] },
      ];

      let callIndex = 0;
      const allMocks = [
        assignments,
        ...riskSignals.slice(0, 7),
        { rows: [{ id: 'a1' }] },
        { rows: [] },
        { rows: [{ streak: 14 }] },
        { rows: [{ next_check: '2026-07-24T10:00:00Z' }] },
        ...riskSignals.slice(7),
        { rows: [{ id: 'a2' }] },
        { rows: [] },
        { rows: [{ streak: 7 }] },
        { rows: [] },
      ];

      mockQuery.mockImplementation(() => Promise.resolve(allMocks[callIndex++]));

      const dashboards = await service.getPractitionerDashboard('prac-1');

      expect(dashboards).toHaveLength(2);
      expect(dashboards[0].clientAlias).toBe('Alice');
      expect(dashboards[0].riskProfile).toBeDefined();
      expect(dashboards[1].clientAlias).toBe('Bob');
    });

    it('returns empty array when practitioner has no clients', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const dashboards = await service.getPractitionerDashboard('prac-none');
      expect(dashboards).toEqual([]);
    });
  });
});

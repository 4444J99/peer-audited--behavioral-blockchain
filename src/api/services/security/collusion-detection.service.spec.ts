import { Pool } from 'pg';
import { CollusionDetectionService } from './collusion-detection.service';

describe('CollusionDetectionService', () => {
  let service: CollusionDetectionService;
  let pool: jest.Mocked<Pool>;
  let truthLog: { appendEvent: jest.Mock };

  beforeEach(() => {
    pool = { query: jest.fn() } as any;
    truthLog = { appendEvent: jest.fn().mockResolvedValue(undefined) };
    service = new CollusionDetectionService(pool, truthLog as any);
  });

  describe('analyzeWindow', () => {
    it('returns empty rings when no pairs found', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)  // coordinated
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)  // verdict sync
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)  // temporal
        .mockResolvedValueOnce({ rows: [{ total_furies: 10 }], rowCount: 1 } as any)  // totalFuries
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);  // pairs

      const rings = await service.analyzeWindow(24, 2);

      expect(rings).toEqual([]);
    });

    it('clusters coordinated vote pairs into rings', async () => {
      const furyA = 'fury-a-1111';
      const furyB = 'fury-b-2222';
      const furyC = 'fury-c-3333';

      pool.query
        // findCoordinatedPairs
        .mockResolvedValueOnce({
          rows: [
            { fury_a: furyA, fury_b: furyB, shared_proofs: 5, agree_count: 5 },
            { fury_a: furyB, fury_b: furyC, shared_proofs: 4, agree_count: 4 },
          ],
          rowCount: 2,
        } as any)
        // findVerdictSyncPairs
        .mockResolvedValueOnce({
          rows: [
            { fury_a: furyA, fury_b: furyB, total_together: 5, sync_count: 5, both_pass: 3, both_fail: 2 },
          ],
          rowCount: 1,
        } as any)
        // findTemporalCorrelationPairs
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        // findSharedAssignmentBias - totalFuries query
        .mockResolvedValueOnce({
          rows: [{ total_furies: 10 }],
          rowCount: 1,
        } as any)
        // findSharedAssignmentBias - pairs query
        .mockResolvedValueOnce({
          rows: [{ fury_a: furyA, fury_b: furyB, shared_assignments: 5 }],
          rowCount: 1,
        } as any)
        // findSharedAssignmentBias - totalProofs query (called per pair)
        .mockResolvedValueOnce({
          rows: [{ total: 20 }],
          rowCount: 1,
        } as any);

      const rings = await service.analyzeWindow(24, 2);

      expect(rings.length).toBeGreaterThanOrEqual(1);
      // The ring should contain furyA, furyB, furyC
      const allFuries = rings.flatMap((r) => r.furyIds);
      expect(allFuries).toContain(furyA);
      expect(allFuries).toContain(furyB);
      expect(allFuries).toContain(furyC);
    });
  });

  describe('sanctionRing', () => {
    it('opens enforcement cases for each fury in the ring', async () => {
      pool.query
        // INSERT for fury A
        .mockResolvedValueOnce({ rows: [{ id: 'case-1' }], rowCount: 1 } as any)
        // INSERT for fury B
        .mockResolvedValueOnce({ rows: [{ id: 'case-2' }], rowCount: 1 } as any);

      const ring = {
        ringId: 'ring-test-1',
        furyIds: ['fury-a', 'fury-b'],
        confidence: 0.85,
        signals: [
          {
            pairKey: 'fury-a::fury-b',
            furyIds: ['fury-a', 'fury-b'] as [string, string],
            signalType: 'COORDINATED_VOTE' as const,
            score: 0.95,
            evidence: { sharedProofs: 5, agreeCount: 5, agreementRate: 1.0 },
          },
        ],
        recommendedAction: 'SANCTION' as const,
      };

      const caseIds = await service.sanctionRing(ring);

      expect(caseIds).toEqual(['case-1', 'case-2']);
      expect(truthLog.appendEvent).toHaveBeenCalledTimes(2);
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'COLLUSION_RING_CASE_OPENED',
        expect.objectContaining({
          ringId: 'ring-test-1',
          confidence: 0.85,
        }),
      );
    });

    it('skips a reviewer who already has an open collusion case', async () => {
      // The scheduler's 24h lookback re-detects an unreviewed ring on every 6h
      // sweep and mints a fresh ringId each time, so the guard — not the ringId —
      // is what keeps the queue from filling with duplicates.
      pool.query
        // fury-a: guarded INSERT matches nothing (case already open)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        // fury-b: newly filed
        .mockResolvedValueOnce({ rows: [{ id: 'case-2' }], rowCount: 1 } as any);

      const caseIds = await service.sanctionRing({
        ringId: 'ring-test-2',
        furyIds: ['fury-a', 'fury-b'],
        confidence: 0.9,
        signals: [],
        recommendedAction: 'SANCTION',
      });

      expect(caseIds).toEqual(['case-2']);
      expect(truthLog.appendEvent).toHaveBeenCalledTimes(1);
      expect(pool.query.mock.calls[0][0]).toMatch(/WHERE NOT EXISTS/);
      expect(pool.query.mock.calls[0][0]).toMatch(/status = 'PENDING_REVIEW'/);
    });
  });

  describe('signal detection', () => {
    it('filters out pairs below agreement threshold', async () => {
      pool.query
        // findCoordinatedPairs - pair with 60% agreement (below 90% threshold)
        .mockResolvedValueOnce({
          rows: [
            { fury_a: 'fury-x', fury_b: 'fury-y', shared_proofs: 10, agree_count: 6 },
          ],
          rowCount: 1,
        } as any)
        // findVerdictSyncPairs
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        // findTemporalCorrelationPairs
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        // findSharedAssignmentBias - totalFuries
        .mockResolvedValueOnce({ rows: [{ total_furies: 10 }], rowCount: 1 } as any)
        // findSharedAssignmentBias - pairs (none above threshold)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const rings = await service.analyzeWindow(24, 2);

      expect(rings).toEqual([]);
    });

    it('detects temporal correlation signals', async () => {
      pool.query
        // findCoordinatedPairs
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        // findVerdictSyncPairs
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        // findTemporalCorrelationPairs
        .mockResolvedValueOnce({
          rows: [
            {
              fury_a: 'fury-a',
              fury_b: 'fury-b',
              overlap_count: 5,
              avg_seconds_apart: 30,
            },
          ],
          rowCount: 1,
        } as any)
        // findSharedAssignmentBias - totalFuries
        .mockResolvedValueOnce({ rows: [{ total_furies: 10 }], rowCount: 1 } as any)
        // findSharedAssignmentBias - pairs (none)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const rings = await service.analyzeWindow(24, 1);

      // Should have at least 1 ring with the temporal signal
      expect(rings.length).toBe(1);
      expect(rings[0].signals[0].signalType).toBe('TEMPORAL_CORRELATION');
    });

    it('reads verdict timing from fury_assignments.reviewed_at and binds every parameter', async () => {
      pool.query
        // findCoordinatedPairs
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        // findVerdictSyncPairs
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        // findTemporalCorrelationPairs
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        // findSharedAssignmentBias - totalFuries
        .mockResolvedValueOnce({ rows: [{ total_furies: 10 }], rowCount: 1 } as any)
        // findSharedAssignmentBias - pairs
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await service.analyzeWindow(24, 2);

      const [temporalSql, temporalParams] = pool.query.mock.calls[2] as unknown as [
        string,
        unknown[],
      ];

      // fury_assignments timestamps the vote in reviewed_at; there is no verdict_at column.
      expect(temporalSql).toContain('fa1.reviewed_at - fa2.reviewed_at');
      expect(temporalSql).not.toContain('verdict_at');

      // Postgres rejects a bind message that supplies more parameters than the
      // statement references, so every placeholder must appear in the SQL.
      expect(temporalParams).toHaveLength(3);
      expect(temporalSql).toContain('p.created_at >= $1');
      expect(temporalSql).toContain('<= $2');
      expect(temporalSql).toContain('HAVING COUNT(*) >= $3');
    });
  });
});

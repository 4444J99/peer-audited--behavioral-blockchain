import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { TruthLogService } from '../ledger/truth-log.service';

export interface CollusionSignal {
  pairKey: string;
  furyIds: [string, string];
  signalType:
    | 'COORDINATED_VOTE'
    | 'SHARED_ASSIGNMENT_BIAS'
    | 'TEMPORAL_CORRELATION'
    | 'VERDICT_SYNC';
  score: number;
  evidence: Record<string, unknown>;
}

export interface CollusionRing {
  ringId: string;
  furyIds: string[];
  confidence: number;
  signals: CollusionSignal[];
  recommendedAction: 'MONITOR' | 'INVESTIGATE' | 'SANCTION';
}

const COORDINATION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MIN_SHARED_PROOFS = 3;
const MIN_VERDICT_AGREEMENT_RATE = 0.9;
const RING_CONFIDENCE_THRESHOLD = 0.7;
const SANCTION_CONFIDENCE_THRESHOLD = 0.85;

@Injectable()
export class CollusionDetectionService {
  private readonly logger = new Logger(CollusionDetectionService.name);

  constructor(
    private readonly pool: Pool,
    private readonly truthLog: TruthLogService,
  ) {}

  /**
   * Analyze recent Fury voting history for collusion ring signals.
   * Called periodically or after each consensus resolution.
   */
  async analyzeWindow(
    sinceHours: number = 24,
    minSignals: number = 2,
  ): Promise<CollusionRing[]> {
    const since = new Date(Date.now() - sinceHours * 3600 * 1000);

    const pairs = await this.findCoordinatedPairs(since);
    const verdictPairs = await this.findVerdictSyncPairs(since);
    const temporalPairs = await this.findTemporalCorrelationPairs(since);
    const assignmentPairs = await this.findSharedAssignmentBias(since);

    const allSignals = [
      ...pairs,
      ...verdictPairs,
      ...temporalPairs,
      ...assignmentPairs,
    ];

    const rings = this.clusterRings(allSignals);

    return rings.filter((r) => r.signals.length >= minSignals);
  }

  /**
   * Detect pairs of Furies that vote the same way on the same proofs
   * at an abnormally high rate.
   */
  private async findCoordinatedPairs(since: Date): Promise<CollusionSignal[]> {
    const result = await this.pool.query(
      `SELECT
        fa1.fury_user_id AS fury_a,
        fa2.fury_user_id AS fury_b,
        COUNT(DISTINCT fa1.proof_id) AS shared_proofs,
        COUNT(*) FILTER (
          WHERE fa1.verdict = fa2.verdict
        ) AS agree_count
       FROM fury_assignments fa1
       JOIN fury_assignments fa2
         ON fa1.proof_id = fa2.proof_id
         AND fa1.fury_user_id < fa2.fury_user_id
       JOIN proofs p ON fa1.proof_id = p.id
       WHERE fa1.verdict IS NOT NULL
         AND fa2.verdict IS NOT NULL
         AND p.created_at >= $1
       GROUP BY fa1.fury_user_id, fa2.fury_user_id
       HAVING COUNT(DISTINCT fa1.proof_id) >= $2
       ORDER BY agree_count::float / COUNT(DISTINCT fa1.proof_id) DESC`,
      [since.toISOString(), MIN_SHARED_PROOFS],
    );

    const signals: CollusionSignal[] = [];
    for (const row of result.rows) {
      const agreementRate = row.agree_count / row.shared_proofs;
      if (agreementRate >= MIN_VERDICT_AGREEMENT_RATE) {
        signals.push({
          pairKey: [row.fury_a, row.fury_b].sort().join('::'),
          furyIds: [row.fury_a, row.fury_b],
          signalType: 'COORDINATED_VOTE',
          score: agreementRate,
          evidence: {
            sharedProofs: row.shared_proofs,
            agreeCount: row.agree_count,
            agreementRate,
          },
        });
      }
    }

    return signals;
  }

  /**
   * Detect pairs that always cast identical verdicts (PASS/FAIL sync).
   */
  private async findVerdictSyncPairs(since: Date): Promise<CollusionSignal[]> {
    const result = await this.pool.query(
      `SELECT
        fa1.fury_user_id AS fury_a,
        fa2.fury_user_id AS fury_b,
        COUNT(*) AS total_together,
        COUNT(*) FILTER (WHERE fa1.verdict = fa2.verdict) AS sync_count,
        COUNT(*) FILTER (WHERE fa1.verdict = 'PASS' AND fa2.verdict = 'PASS') AS both_pass,
        COUNT(*) FILTER (WHERE fa1.verdict = 'FAIL' AND fa2.verdict = 'FAIL') AS both_fail
       FROM fury_assignments fa1
       JOIN fury_assignments fa2
         ON fa1.proof_id = fa2.proof_id
         AND fa1.fury_user_id < fa2.fury_user_id
       JOIN proofs p ON fa1.proof_id = p.id
       WHERE fa1.verdict IS NOT NULL
         AND fa2.verdict IS NOT NULL
         AND p.created_at >= $1
       GROUP BY fa1.fury_user_id, fa2.fury_user_id
       HAVING COUNT(*) >= $2
       ORDER BY COUNT(*) FILTER (WHERE fa1.verdict = fa2.verdict)::float / COUNT(*) DESC`,
      [since.toISOString(), MIN_SHARED_PROOFS],
    );

    const signals: CollusionSignal[] = [];
    for (const row of result.rows) {
      const syncRate = row.sync_count / row.total_together;
      if (syncRate >= MIN_VERDICT_AGREEMENT_RATE) {
        signals.push({
          pairKey: [row.fury_a, row.fury_b].sort().join('::'),
          furyIds: [row.fury_a, row.fury_b],
          signalType: 'VERDICT_SYNC',
          score: syncRate,
          evidence: {
            totalTogether: row.total_together,
            syncCount: row.sync_count,
            bothPass: row.both_pass,
            bothFail: row.both_fail,
            syncRate,
          },
        });
      }
    }

    return signals;
  }

  /**
   * Detect pairs that cast verdicts within an unusually tight time window.
   */
  private async findTemporalCorrelationPairs(since: Date): Promise<CollusionSignal[]> {
    const result = await this.pool.query(
      `SELECT
        fa1.fury_user_id AS fury_a,
        fa2.fury_user_id AS fury_b,
        COUNT(*) AS overlap_count,
        AVG(ABS(EXTRACT(EPOCH FROM (fa1.verdict_at - fa2.verdict_at)))) AS avg_seconds_apart
       FROM fury_assignments fa1
       JOIN fury_assignments fa2
         ON fa1.proof_id = fa2.proof_id
         AND fa1.fury_user_id < fa2.fury_user_id
       JOIN proofs p ON fa1.proof_id = p.id
       WHERE fa1.verdict IS NOT NULL
         AND fa2.verdict IS NOT NULL
         AND fa1.reviewed_at IS NOT NULL
         AND fa2.reviewed_at IS NOT NULL
         AND ABS(EXTRACT(EPOCH FROM (fa1.reviewed_at - fa2.reviewed_at))) <= $2
       GROUP BY fa1.fury_user_id, fa2.fury_user_id
       HAVING COUNT(*) >= $3`,
      [since.toISOString(), COORDINATION_WINDOW_MS / 1000, MIN_SHARED_PROOFS],
    );

    const signals: CollusionSignal[] = [];
    for (const row of result.rows) {
      const avgSeconds = parseFloat(row.avg_seconds_apart);
      const score = Math.max(0, 1 - avgSeconds / (COORDINATION_WINDOW_MS / 1000));

      signals.push({
        pairKey: [row.fury_a, row.fury_b].sort().join('::'),
        furyIds: [row.fury_a, row.fury_b],
        signalType: 'TEMPORAL_CORRELATION',
        score,
        evidence: {
          overlapCount: row.overlap_count,
          avgSecondsApart: avgSeconds,
          coordinationWindowMs: COORDINATION_WINDOW_MS,
        },
      });
    }

    return signals;
  }

  /**
   * Detect pairs that appear together on assignments far more than expected
   * given the total Fury pool size.
   */
  private async findSharedAssignmentBias(since: Date): Promise<CollusionSignal[]> {
    const poolSizeResult = await this.pool.query(
      `SELECT COUNT(*) AS total_furies FROM users WHERE role = 'FURY' AND status = 'ACTIVE'`,
    );
    const totalFuries = parseInt(poolSizeResult.rows[0].total_furies);
    if (totalFuries < 3) return [];

    const result = await this.pool.query(
      `SELECT
        fa1.fury_user_id AS fury_a,
        fa2.fury_user_id AS fury_b,
        COUNT(DISTINCT fa1.proof_id) AS shared_assignments
       FROM fury_assignments fa1
       JOIN fury_assignments fa2
         ON fa1.proof_id = fa2.proof_id
         AND fa1.fury_user_id < fa2.fury_user_id
       JOIN proofs p ON fa1.proof_id = p.id
       WHERE p.created_at >= $1
       GROUP BY fa1.fury_user_id, fa2.fury_user_id
       HAVING COUNT(DISTINCT fa1.proof_id) >= $2`,
      [since.toISOString(), MIN_SHARED_PROOFS],
    );

    const signals: CollusionSignal[] = [];
    for (const row of result.rows) {
      const totalProofsResult = await this.pool.query(
        `SELECT COUNT(*) AS total FROM proofs WHERE created_at >= $1`,
        [since.toISOString()],
      );
      const totalProofs = parseInt(totalProofsResult.rows[0].total);
      if (totalProofs === 0) continue;

      // Expected co-assignment probability: C(pool-2, reviewers-2)/C(pool, reviewers)
      // Simplified: (reviewers/pool) * ((reviewers-1)/(pool-1))
      const reviewersPerProof = 3; // typical required reviewers
      const expectedRate =
        (reviewersPerProof / totalFuries) *
        ((reviewersPerProof - 1) / (totalFuries - 1));
      const expectedAssignments = totalProofs * expectedRate;
      const actualRate = row.shared_assignments / totalProofs;
      const bias = expectedRate > 0 ? actualRate / expectedRate : 0;

      if (bias > 2.0) {
        // 2x more than expected
        signals.push({
          pairKey: [row.fury_a, row.fury_b].sort().join('::'),
          furyIds: [row.fury_a, row.fury_b],
          signalType: 'SHARED_ASSIGNMENT_BIAS',
          score: Math.min(bias / 5, 1.0), // normalize to [0, 1]
          evidence: {
            sharedAssignments: row.shared_assignments,
            expectedAssignments: Math.round(expectedAssignments * 100) / 100,
            biasFactor: Math.round(bias * 100) / 100,
            totalFuries,
            totalProofs,
          },
        });
      }
    }

    return signals;
  }

  /**
   * Cluster pairwise signals into rings using union-find.
   * A ring is a connected component where all members have signals with each other.
   */
  private clusterRings(signals: CollusionSignal[]): CollusionRing[] {
    const pairMap = new Map<string, CollusionSignal[]>();
    const allFuries = new Set<string>();

    for (const signal of signals) {
      const key = signal.pairKey;
      if (!pairMap.has(key)) pairMap.set(key, []);
      pairMap.get(key)!.push(signal);
      allFuries.add(signal.furyIds[0]);
      allFuries.add(signal.furyIds[1]);
    }

    // Union-Find
    const parent = new Map<string, string>();
    for (const f of allFuries) parent.set(f, f);

    const find = (x: string): string => {
      if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!));
      return parent.get(x)!;
    };
    const union = (a: string, b: string) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent.set(ra, rb);
    };

    for (const signal of signals) {
      union(signal.furyIds[0], signal.furyIds[1]);
    }

    // Group by root
    const groups = new Map<string, string[]>();
    for (const f of allFuries) {
      const root = find(f);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(f);
    }

    const rings: CollusionRing[] = [];
    let ringCounter = 0;

    for (const [, members] of groups) {
      if (members.length < 2) continue;

      const memberSet = new Set(members);
      const ringSignals = signals.filter(
        (s) =>
          memberSet.has(s.furyIds[0]) && memberSet.has(s.furyIds[1]),
      );

      const avgScore =
        ringSignals.reduce((sum, s) => sum + s.score, 0) /
        (ringSignals.length || 1);

      const confidence = Math.min(
        1,
        avgScore * (members.length / 2) * (ringSignals.length / members.length),
      );

      let recommendedAction: CollusionRing['recommendedAction'] = 'MONITOR';
      if (confidence >= SANCTION_CONFIDENCE_THRESHOLD) {
        recommendedAction = 'SANCTION';
      } else if (confidence >= RING_CONFIDENCE_THRESHOLD) {
        recommendedAction = 'INVESTIGATE';
      }

      rings.push({
        ringId: `ring-${++ringCounter}-${Date.now()}`,
        furyIds: members,
        confidence,
        signals: ringSignals,
        recommendedAction,
      });
    }

    return rings.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Open enforcement cases for confirmed collusion rings.
   * Only sanctions rings above the threshold.
   */
  async sanctionRing(ring: CollusionRing): Promise<string[]> {
    const caseIds: string[] = [];

    for (const furyId of ring.furyIds) {
      const result = await this.pool.query(
        `INSERT INTO fury_enforcement_cases
         (reviewer_id, case_type, confidence, status, evidence_json)
         VALUES ($1, 'COLLUSION_RING', $2, 'PENDING_REVIEW', $3)
         RETURNING id`,
        [
          furyId,
          ring.confidence,
          JSON.stringify({
            ringId: ring.ringId,
            coConspirators: ring.furyIds.filter((f) => f !== furyId),
            signalCount: ring.signals.length,
            signalTypes: [...new Set(ring.signals.map((s) => s.signalType))],
            avgScore:
              ring.signals.reduce((sum, s) => sum + s.score, 0) /
              (ring.signals.length || 1),
          }),
        ],
      );

      const caseId = result.rows[0].id;
      caseIds.push(caseId);

      await this.truthLog.appendEvent('COLLUSION_RING_CASE_OPENED', {
        caseId,
        reviewerId: furyId,
        ringId: ring.ringId,
        confidence: ring.confidence,
        coConspirators: ring.furyIds.filter((f) => f !== furyId),
      });
    }

    this.logger.warn(
      `Collusion ring ${ring.ringId}: opened ${caseIds.length} enforcement cases ` +
      `(confidence=${ring.confidence.toFixed(3)}, action=${ring.recommendedAction})`,
    );

    return caseIds;
  }
}

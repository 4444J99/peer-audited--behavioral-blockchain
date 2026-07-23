import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

export interface RiskFactor {
  type: string;
  weight: number;
  value: number;
  description: string;
}

export interface ClientRiskProfile {
  userId: string;
  riskScore: number;
  riskLevel: 'GREEN' | 'YELLOW' | 'RED';
  factors: RiskFactor[];
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  lastUpdated: Date;
}

export interface JournalAlert {
  id: string;
  userId: string;
  alertType: 'RATIONALIZATION' | 'DISTRESS_ESCALATION' | 'TRIGGER_MENTION' | 'CRISIS_LANGUAGE';
  excerpt: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: Date;
}

export interface PractitionerDashboard {
  clientId: string;
  clientAlias: string;
  riskProfile: ClientRiskProfile;
  recentAlerts: JournalAlert[];
  adherenceRate: number;
  streakDays: number;
  nextCheckIn: Date | null;
}

const RATIONALIZATION_MARKERS = [
  'just one more time',
  'i can handle it',
  'only a little',
  'deserve a break',
  'everyone does it',
  'not that bad',
  'starting tomorrow',
  'one last time',
  'just this once',
];

const DISTRESS_MARKERS = [
  'cant take it',
  'breaking point',
  'give up',
  'no point',
  'cant do this',
  'falling apart',
  'hopeless',
  'overwhelmed',
];

const CRISIS_MARKERS = [
  'want to die',
  'kill myself',
  'end it all',
  'no reason to live',
  'self harm',
  'hurting myself',
  'suicide',
  'overdose',
];

const RISK_WEIGHTS = {
  ATTESTATION_CONSISTENCY: 0.25,
  TIME_OF_DAY: 0.15,
  GRACE_DAY_BURN: 0.20,
  ENGAGEMENT_TRAJECTORY: 0.15,
  WEEKEND_COMPLIANCE: 0.10,
  PREVIOUS_VIOLATIONS: 0.15,
};

@Injectable()
export class PractitionerIntelligenceService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async getClientRiskProfile(userId: string): Promise<ClientRiskProfile> {
    const [missedCheckIns, lateNightActivity, graceBurnRate, engagementDecline, weekendDelta, violations, trendData] =
      await Promise.all([
        this.getMissedCheckIns(userId),
        this.getLateNightActivityRatio(userId),
        this.getGraceDayBurnRate(userId),
        this.getEngagementDecline(userId),
        this.getWeekendComplianceDelta(userId),
        this.getPreviousViolations(userId),
        this.getRiskTrend(userId, 14),
      ]);

    const factors: RiskFactor[] = [
      {
        type: 'ATTESTATION_CONSISTENCY',
        weight: RISK_WEIGHTS.ATTESTATION_CONSISTENCY,
        value: missedCheckIns,
        description: `${missedCheckIns} missed check-ins in the last 14 days`,
      },
      {
        type: 'TIME_OF_DAY',
        weight: RISK_WEIGHTS.TIME_OF_DAY,
        value: lateNightActivity,
        description: `${Math.round(lateNightActivity * 100)}% of activity between midnight and 4am`,
      },
      {
        type: 'GRACE_DAY_BURN',
        weight: RISK_WEIGHTS.GRACE_DAY_BURN,
        value: graceBurnRate,
        description: `${Math.round(graceBurnRate * 100)}% of grace days consumed`,
      },
      {
        type: 'ENGAGEMENT_TRAJECTORY',
        weight: RISK_WEIGHTS.ENGAGEMENT_TRAJECTORY,
        value: engagementDecline,
        description: `${Math.round(engagementDecline * 100)}% decline in app opens`,
      },
      {
        type: 'WEEKEND_COMPLIANCE',
        weight: RISK_WEIGHTS.WEEKEND_COMPLIANCE,
        value: weekendDelta,
        description: `${Math.round(weekendDelta * 100)}% lower compliance on weekends`,
      },
      {
        type: 'PREVIOUS_VIOLATIONS',
        weight: RISK_WEIGHTS.PREVIOUS_VIOLATIONS,
        value: violations,
        description: `${violations} previous contract violations`,
      },
    ];

    const riskScore = Math.min(
      100,
      Math.round(
        factors.reduce((sum, f) => {
          const normalized = Math.min(1, f.value);
          return sum + normalized * f.weight * 100;
        }, 0),
      ),
    );

    let riskLevel: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
    if (riskScore >= 61) riskLevel = 'RED';
    else if (riskScore >= 31) riskLevel = 'YELLOW';

    const trend = this.deriveTrend(trendData);

    return {
      userId,
      riskScore,
      riskLevel,
      factors,
      trend,
      lastUpdated: new Date(),
    };
  }

  async analyzeJournalEntry(userId: string, entryText: string): Promise<JournalAlert[]> {
    const lower = entryText.toLowerCase();
    const alerts: JournalAlert[] = [];
    const now = new Date();

    for (const marker of RATIONALIZATION_MARKERS) {
      if (lower.includes(marker)) {
        alerts.push({
          id: `ral-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId,
          alertType: 'RATIONALIZATION',
          excerpt: marker,
          severity: 'MEDIUM',
          createdAt: now,
        });
        break;
      }
    }

    for (const marker of DISTRESS_MARKERS) {
      if (lower.includes(marker)) {
        alerts.push({
          id: `dis-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId,
          alertType: 'DISTRESS_ESCALATION',
          excerpt: marker,
          severity: 'HIGH',
          createdAt: now,
        });
        break;
      }
    }

    for (const marker of CRISIS_MARKERS) {
      if (lower.includes(marker)) {
        alerts.push({
          id: `crs-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId,
          alertType: 'CRISIS_LANGUAGE',
          excerpt: marker,
          severity: 'HIGH',
          createdAt: now,
        });
        break;
      }
    }

    return alerts;
  }

  async getPractitionerDashboard(practitionerId: string): Promise<PractitionerDashboard[]> {
    const assignments = await this.pool.query(
      `SELECT pca.client_id, u.alias
       FROM practitioner_client_assignments pca
       JOIN users u ON u.id = pca.client_id
       WHERE pca.practitioner_id = $1 AND pca.active = true`,
      [practitionerId],
    );

    const dashboards: PractitionerDashboard[] = [];

    for (const row of assignments.rows) {
      const clientId = row.client_id;
      const [riskProfile, alerts, adherenceRate, streakDays] = await Promise.all([
        this.getClientRiskProfile(clientId),
        this.getClientRecentAlerts(clientId),
        this.calculateAdherenceRate(clientId, await this.getActiveContractId(clientId)),
        this.getStreakDays(clientId),
      ]);

      const nextCheckIn = await this.getNextCheckIn(clientId);

      dashboards.push({
        clientId,
        clientAlias: row.alias,
        riskProfile,
        recentAlerts: alerts,
        adherenceRate,
        streakDays,
        nextCheckIn,
      });
    }

    return dashboards;
  }

  async getRiskTrend(userId: string, days: number = 30): Promise<{ date: string; score: number }[]> {
    const result = await this.pool.query(
      `SELECT
         DATE(a.attestation_date) AS day,
         COUNT(*) FILTER (WHERE a.status IN ('ATTESTED', 'COSIGNED'))::numeric /
           NULLIF(COUNT(*), 0) AS compliance_rate
       FROM attestations a
       JOIN contracts c ON c.id = a.contract_id
       WHERE c.user_id = $1
         AND a.attestation_date >= NOW() - ($2 || ' days')::interval
       GROUP BY DATE(a.attestation_date)
       ORDER BY day ASC`,
      [userId, String(days)],
    );

    return result.rows.map((row) => ({
      date: typeof row.day === 'string' ? row.day : new Date(row.day).toISOString().split('T')[0],
      score: Math.round((1 - parseFloat(row.compliance_rate ?? '1')) * 100),
    }));
  }

  async sendPractitionerAlert(practitionerId: string, clientId: string, alert: JournalAlert): Promise<void> {
    await this.pool.query(
      `INSERT INTO practitioner_alerts (practitioner_id, client_id, alert_type, excerpt, severity, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [practitionerId, clientId, alert.alertType, alert.excerpt, alert.severity, alert.createdAt],
    );
  }

  async calculateAdherenceRate(userId: string, contractId: string): Promise<number> {
    if (!contractId) return 0;

    const result = await this.pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status IN ('ATTESTED', 'COSIGNED'))::int AS completed
       FROM attestations
       WHERE contract_id = $1`,
      [contractId],
    );

    const row = result.rows[0];
    if (!row || row.total === 0) return 0;

    return Math.round((row.completed / row.total) * 100);
  }

  private async getMissedCheckIns(userId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS missed
       FROM attestations a
       JOIN contracts c ON c.id = a.contract_id
       WHERE c.user_id = $1
         AND a.attestation_date >= NOW() - INTERVAL '14 days'
         AND a.status = 'MISSED'`,
      [userId],
    );
    return result.rows[0]?.missed ?? 0;
  }

  private async getLateNightActivityRatio(userId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM created_at) < 4)::numeric /
           NULLIF(COUNT(*), 0) AS ratio
       FROM activity_log
       WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '14 days'`,
      [userId],
    );
    return parseFloat(result.rows[0]?.ratio ?? '0');
  }

  private async getGraceDayBurnRate(userId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT
         COALESCE(c.grace_days_total, 0) AS total,
         COALESCE(c.grace_days_used, 0) AS used
       FROM contracts c
       WHERE c.user_id = $1 AND c.status = 'ACTIVE'
       LIMIT 1`,
      [userId],
    );
    const row = result.rows[0];
    if (!row || row.total === 0) return 0;
    return row.used / row.total;
  }

  private async getEngagementDecline(userId: string): Promise<number> {
    const result = await this.pool.query(
      `WITH weekly_opens AS (
         SELECT
           date_trunc('week', created_at) AS week,
           COUNT(*) AS opens
         FROM activity_log
         WHERE user_id = $1
           AND created_at >= NOW() - INTERVAL '28 days'
         GROUP BY date_trunc('week', created_at)
         ORDER BY week DESC
         LIMIT 4
       )
       SELECT
         (array_agg(opens ORDER BY week))[1] AS latest,
         (array_agg(opens ORDER BY week))[array_length(array_agg(opens ORDER BY week), 1)] AS oldest
       FROM weekly_opens`,
      [userId],
    );
    const row = result.rows[0];
    if (!row || !row.latest || !row.oldest) return 0;
    const latest = Number(row.latest);
    const oldest = Number(row.oldest);
    if (oldest === 0) return 0;
    return Math.max(0, (oldest - latest) / oldest);
  }

  private async getWeekendComplianceDelta(userId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE EXTRACT(DOW FROM attestation_date) IN (0, 6))::numeric /
           NULLIF(COUNT(*) FILTER (WHERE EXTRACT(DOW FROM attestation_date) NOT IN (0, 6)), 0) AS ratio
       FROM attestations a
       JOIN contracts c ON c.id = a.contract_id
       WHERE c.user_id = $1
         AND a.attestation_date >= NOW() - INTERVAL '14 days'
         AND a.status IN ('ATTESTED', 'COSIGNED')`,
      [userId],
    );
    const ratio = parseFloat(result.rows[0]?.ratio ?? '1');
    return Math.max(0, 1 - ratio);
  }

  private async getPreviousViolations(userId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS violations
       FROM contract_violations
       WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0]?.violations ?? 0;
  }

  private deriveTrend(data: { date: string; score: number }[]): 'IMPROVING' | 'STABLE' | 'DECLINING' {
    if (data.length < 2) return 'STABLE';
    const recent = data.slice(-7);
    const older = data.slice(0, Math.min(7, data.length));
    const recentAvg = recent.reduce((s, d) => s + d.score, 0) / recent.length;
    const olderAvg = older.reduce((s, d) => s + d.score, 0) / older.length;
    if (recentAvg < olderAvg - 3) return 'IMPROVING';
    if (recentAvg > olderAvg + 3) return 'DECLINING';
    return 'STABLE';
  }

  private async getClientRecentAlerts(userId: string): Promise<JournalAlert[]> {
    const result = await this.pool.query(
      `SELECT id, user_id, alert_type, excerpt, severity, created_at
       FROM practitioner_alerts
       WHERE client_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      alertType: row.alert_type,
      excerpt: row.excerpt,
      severity: row.severity,
      createdAt: new Date(row.created_at),
    }));
  }

  private async getActiveContractId(userId: string): Promise<string> {
    const result = await this.pool.query(
      `SELECT id FROM contracts WHERE user_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [userId],
    );
    return result.rows[0]?.id ?? '';
  }

  private async getStreakDays(userId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS streak
       FROM attestations a
       JOIN contracts c ON c.id = a.contract_id
       WHERE c.user_id = $1
         AND a.status IN ('ATTESTED', 'COSIGNED')
         AND a.attestation_date >= CURRENT_DATE - INTERVAL '30 days'`,
      [userId],
    );
    return result.rows[0]?.streak ?? 0;
  }

  private async getNextCheckIn(userId: string): Promise<Date | null> {
    const result = await this.pool.query(
      `SELECT attestation_date AS next_check
       FROM attestations a
       JOIN contracts c ON c.id = a.contract_id
       WHERE c.user_id = $1
         AND a.status = 'PENDING'
         AND a.attestation_date >= CURRENT_DATE
       ORDER BY a.attestation_date ASC
       LIMIT 1`,
      [userId],
    );
    return result.rows[0]?.next_check ? new Date(result.rows[0].next_check) : null;
  }
}

import { Injectable, Inject, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { evaluatePodBroadcast } from '../../../../shared/libs/behavioral-logic';

export interface PodMember {
  userId: string;
  alias: string;
  joinedAt: Date;
  contractId: string;
  status: 'ACTIVE' | 'PAUSED' | 'LEFT';
}

export interface PodState {
  podId: string;
  cohortId: string;
  members: PodMember[];
  activeCount: number;
  maxMembers: number;
  failureBroadcasts: number;
}

export interface PodIdentityReveal {
  userId: string;
  revealLevel: 'ANONYMOUS' | 'FIRST_NAME' | 'FULL_ALIAS';
  alias: string;
}

const MAX_POD_SIZE = 5;
const IDENTITY_REVEAL_THRESHOLDS = { FIRST_NAME: 7, FULL_ALIAS: 30 };

@Injectable()
export class PodOrchestrationService {
  private readonly logger = new Logger(PodOrchestrationService.name);

  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
  ) {}

  async getPodState(podId: string, cohortId: string): Promise<PodState> {
    const { rows } = await this.pool.query(
      `SELECT DISTINCT ON (c.user_id)
        c.id AS contract_id,
        c.user_id,
        c.status,
        c.created_at,
        c.metadata->'cohort'->>'joinedAt' AS cohort_joined_at,
        c.metadata->'cohort'->>'displayAlias' AS display_alias
       FROM contracts c
       WHERE c.metadata->'cohort'->>'cohortId' = $1
         AND c.metadata->'cohort'->>'podId' = $2
       ORDER BY c.user_id, c.created_at DESC`,
      [cohortId, podId],
    );

    const members: PodMember[] = rows.map((row: any) => ({
      userId: row.user_id,
      alias: row.display_alias || 'Participant',
      joinedAt: new Date(row.cohort_joined_at || row.created_at),
      contractId: row.contract_id,
      status: row.status === 'ACTIVE' ? 'ACTIVE' : row.status === 'PENDING_STAKE' ? 'ACTIVE' : 'LEFT',
    }));

    const activeCount = members.filter(m => m.status === 'ACTIVE').length;

    const broadcastResult = await this.pool.query(
      `SELECT COUNT(*)::int AS total
       FROM pod_broadcast_log
       WHERE pod_id = $1 AND cohort_id = $2`,
      [podId, cohortId],
    );

    return {
      podId,
      cohortId,
      members,
      activeCount,
      maxMembers: MAX_POD_SIZE,
      failureBroadcasts: broadcastResult.rows[0]?.total ?? 0,
    };
  }

  async enforceMaxPodSize(podId: string, cohortId: string): Promise<{ allowed: boolean; currentCount: number; maxMembers: number }> {
    const { rows } = await this.pool.query(
      `SELECT COUNT(DISTINCT user_id)::int AS count
       FROM contracts
       WHERE metadata->'cohort'->>'cohortId' = $1
         AND metadata->'cohort'->>'podId' = $2
         AND status IN ('PENDING_STAKE', 'ACTIVE')`,
      [cohortId, podId],
    );

    const currentCount = rows[0]?.count ?? 0;
    return {
      allowed: currentCount < MAX_POD_SIZE,
      currentCount,
      maxMembers: MAX_POD_SIZE,
    };
  }

  async addMemberToPod(
    userId: string,
    podId: string,
    cohortId: string,
    contractId: string,
    alias?: string,
  ): Promise<PodMember> {
    const { allowed, currentCount } = await this.enforceMaxPodSize(podId, cohortId);
    if (!allowed) {
      throw new BadRequestException(`Pod ${podId} is full (max ${MAX_POD_SIZE})`);
    }

    const displayAlias = alias || 'Participant';
    const now = new Date();

    await this.pool.query(
      `UPDATE contracts
       SET metadata = jsonb_set(
         jsonb_set(
           COALESCE(metadata, '{}'::jsonb),
           '{cohort}',
           COALESCE(metadata->'cohort', '{}'::jsonb) || $3::jsonb
         ),
         '{cohort,joinedAt}',
         to_jsonb($4::text)
       )
       WHERE id = $1 AND user_id = $2`,
      [contractId, userId, JSON.stringify({ cohortId, podId, displayAlias }), now.toISOString()],
    );

    return {
      userId,
      alias: displayAlias,
      joinedAt: now,
      contractId,
      status: 'ACTIVE',
    };
  }

  async removeMemberFromPod(userId: string, podId: string, cohortId: string): Promise<void> {
    const { rowCount } = await this.pool.query(
      `UPDATE contracts
       SET metadata = metadata - 'cohort'
       WHERE user_id = $1
         AND metadata->'cohort'->>'cohortId' = $2
         AND metadata->'cohort'->>'podId' = $3`,
      [userId, cohortId, podId],
    );

    if (rowCount === 0) {
      throw new NotFoundException(`User ${userId} not found in pod ${podId}`);
    }
  }

  async getPodMembers(podId: string, cohortId: string): Promise<PodMember[]> {
    const { rows } = await this.pool.query(
      `SELECT DISTINCT ON (c.user_id)
        c.id AS contract_id,
        c.user_id,
        c.status,
        c.created_at,
        c.metadata->'cohort'->>'joinedAt' AS cohort_joined_at,
        c.metadata->'cohort'->>'displayAlias' AS display_alias
       FROM contracts c
       WHERE c.metadata->'cohort'->>'cohortId' = $1
         AND c.metadata->'cohort'->>'podId' = $2
       ORDER BY c.user_id, c.created_at DESC`,
      [cohortId, podId],
    );

    return rows.map((row: any) => ({
      userId: row.user_id,
      alias: row.display_alias || 'Participant',
      joinedAt: new Date(row.cohort_joined_at || row.created_at),
      contractId: row.contract_id,
      status: row.status === 'ACTIVE' ? 'ACTIVE' : row.status === 'PENDING_STAKE' ? 'ACTIVE' : 'LEFT',
    }));
  }

  async broadcastPodFailure(
    podId: string,
    cohortId: string,
    failureEvent: { userId: string; type: string },
  ): Promise<{ broadcast: boolean; dampened: boolean; recipientsNotified: number }> {
    const { rows: broadcastRows } = await this.pool.query(
      `SELECT COUNT(*)::int AS failure_count,
              MAX(broadcasted_at) AS last_broadcast_at
       FROM pod_broadcast_log
       WHERE pod_id = $1 AND cohort_id = $2`,
      [podId, cohortId],
    );

    const memberResult = await this.pool.query(
      `SELECT COUNT(DISTINCT user_id)::int AS member_count
       FROM contracts
       WHERE metadata->'cohort'->>'cohortId' = $1
         AND metadata->'cohort'->>'podId' = $2
         AND status IN ('PENDING_STAKE', 'ACTIVE')`,
      [cohortId, podId],
    );

    const failureCount = (broadcastRows[0]?.failure_count ?? 0) + 1;
    const memberCount = memberResult.rows[0]?.member_count ?? 0;
    const lastBroadcastAt = broadcastRows[0]?.last_broadcast_at
      ? new Date(broadcastRows[0].last_broadcast_at)
      : null;

    const result = evaluatePodBroadcast({ podId, failureCount, memberCount, lastBroadcastAt });

    if (!result.dampened) {
      await this.pool.query(
        `INSERT INTO pod_broadcast_log (pod_id, cohort_id, user_id, failure_type, failure_count)
         VALUES ($1, $2, $3, $4, $5)`,
        [podId, cohortId, failureEvent.userId, failureEvent.type, failureCount],
      );
    }

    const recipientsNotified = result.dampened ? 0 : memberCount - 1;

    return {
      broadcast: !result.dampened,
      dampened: result.dampened,
      recipientsNotified,
    };
  }

  async getPeerIdentities(
    podId: string,
    cohortId: string,
    requestingUserId: string,
  ): Promise<PodIdentityReveal[]> {
    const { rows } = await this.pool.query(
      `SELECT DISTINCT ON (c.user_id)
        c.user_id,
        c.metadata->'cohort'->>'displayAlias' AS display_alias,
        c.metadata->'cohort'->>'joinedAt' AS cohort_joined_at,
        c.created_at
       FROM contracts c
       WHERE c.metadata->'cohort'->>'cohortId' = $1
         AND c.metadata->'cohort'->>'podId' = $2
       ORDER BY c.user_id, c.created_at DESC`,
      [cohortId, podId],
    );

    const now = new Date();

    return rows.map((row: any) => {
      const isSelf = row.user_id === requestingUserId;
      // Anonymity windows count from the actual pod join, not contract
      // creation — an old contract added to a pod starts ANONYMOUS.
      const joinedAt = row.cohort_joined_at
        ? new Date(row.cohort_joined_at)
        : new Date(row.created_at);
      const daysInPod = Math.floor((now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24));
      const displayAlias = row.display_alias || 'Participant';

      if (isSelf) {
        return {
          userId: row.user_id,
          revealLevel: 'FULL_ALIAS' as const,
          alias: displayAlias,
        };
      }

      let revealLevel: PodIdentityReveal['revealLevel'];
      if (daysInPod >= IDENTITY_REVEAL_THRESHOLDS.FULL_ALIAS) {
        revealLevel = 'FULL_ALIAS';
      } else if (daysInPod >= IDENTITY_REVEAL_THRESHOLDS.FIRST_NAME) {
        revealLevel = 'FIRST_NAME';
      } else {
        revealLevel = 'ANONYMOUS';
      }

      let alias: string;
      if (revealLevel === 'ANONYMOUS') {
        const memberIndex = rows.indexOf(row) + 1;
        alias = `Member ${memberIndex}`;
      } else if (revealLevel === 'FIRST_NAME') {
        alias = displayAlias.split(' ')[0] || 'Participant';
      } else {
        alias = displayAlias;
      }

      return {
        userId: row.user_id,
        revealLevel,
        alias,
      };
    });
  }

  async getPodStats(
    podId: string,
    cohortId: string,
  ): Promise<{ totalMembers: number; activeMembers: number; avgStreakDays: number; totalFailures: number }> {
    const { rows: memberRows } = await this.pool.query(
      `SELECT DISTINCT ON (c.user_id)
        c.user_id,
        c.status
       FROM contracts c
       WHERE c.metadata->'cohort'->>'cohortId' = $1
         AND c.metadata->'cohort'->>'podId' = $2
       ORDER BY c.user_id, c.created_at DESC`,
      [cohortId, podId],
    );

    const totalMembers = memberRows.length;
    const activeMembers = memberRows.filter(
      (r: any) => r.status === 'ACTIVE' || r.status === 'PENDING_STAKE',
    ).length;

    const userIds = memberRows.map((r: any) => r.user_id);

    let avgStreakDays = 0;
    if (userIds.length > 0) {
      const { rows: streakRows } = await this.pool.query(
        `SELECT COALESCE(AVG(streak_len), 0) AS avg_streak
         FROM (
           SELECT c.id, COUNT(a.id)::int AS streak_len
           FROM contracts c
           JOIN attestations a ON a.contract_id = c.id
             AND a.status IN ('ATTESTED', 'COSIGNED')
           WHERE c.user_id = ANY($1)
             AND c.metadata->'cohort'->>'cohortId' = $2
             AND c.metadata->'cohort'->>'podId' = $3
           GROUP BY c.id
         ) sub`,
        [userIds, cohortId, podId],
      );
      avgStreakDays = Number(streakRows[0]?.avg_streak ?? 0);
    }

    const { rows: failureRows } = await this.pool.query(
      `SELECT COUNT(*)::int AS total
       FROM pod_broadcast_log
       WHERE pod_id = $1 AND cohort_id = $2`,
      [podId, cohortId],
    );

    return {
      totalMembers,
      activeMembers,
      avgStreakDays,
      totalFailures: failureRows[0]?.total ?? 0,
    };
  }
}

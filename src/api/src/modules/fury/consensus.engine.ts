import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { calculateReviewerWeight, FuryHistory } from '../../../../shared/libs/integrity';
import { FURY_CONSENSUS_SIZE } from '../../../../shared/libs/behavioral-logic';

export type Verdict = 'PASS' | 'FAIL';

export interface FuryVote {
  furyUserId: string;
  verdict: Verdict;
}

export type ConsensusOutcome = 'VERIFIED' | 'REJECTED' | 'SPLIT';

export interface ConsensusResult {
  outcome: ConsensusOutcome;
  votes: FuryVote[];
  weightedStats?: {
    totalPower: number;
    passPower: number;
    failPower: number;
  };
  flaggedFuries: string[]; // Furies whose verdict disagreed with the honeypot's expected result
  bountyDistributed: boolean;
}

export interface NormalizedFuryVotes {
  votes: FuryVote[];
  hasConflictingVerdicts: boolean;
  conflictingFuryIds: string[];
}

/**
 * Deduplicates repeated reviewer votes for the same proof.
 * - Identical duplicate verdicts for a reviewer collapse to a single vote.
 * - Opposite duplicate verdicts ('PASS' vs 'FAIL') for the same reviewer are
 *   rejected from valid voting power and flagged so consensus fails closed (SPLIT).
 */
export function normalizeFuryVotes(votes: FuryVote[]): NormalizedFuryVotes {
  const verdictByReviewer = new Map<string, Verdict>();
  const conflictingReviewerSet = new Set<string>();
  const deduplicated: FuryVote[] = [];

  for (const vote of votes) {
    const existing = verdictByReviewer.get(vote.furyUserId);
    if (existing === undefined) {
      verdictByReviewer.set(vote.furyUserId, vote.verdict);
      deduplicated.push({ furyUserId: vote.furyUserId, verdict: vote.verdict });
    } else if (existing !== vote.verdict) {
      conflictingReviewerSet.add(vote.furyUserId);
    }
  }

  const filteredVotes =
    conflictingReviewerSet.size > 0
      ? deduplicated.filter((vote) => !conflictingReviewerSet.has(vote.furyUserId))
      : deduplicated;

  return {
    votes: filteredVotes,
    hasConflictingVerdicts: conflictingReviewerSet.size > 0,
    conflictingFuryIds: Array.from(conflictingReviewerSet),
  };
}

@Injectable()
export class ConsensusEngine {
  private readonly logger = new Logger(ConsensusEngine.name);

  constructor(
    private readonly truthLog: TruthLogService,
    private readonly ledger: LedgerService,
    private readonly pool: Pool,
  ) {}

  /**
   * Aggregates Fury verdicts for a proof using weighted majority (>66% power threshold).
   * Mirrors the symmetric band used by the shared ConsensusResolver: a verdict only
   * reaches VERIFIED/REJECTED when one side exceeds 66% of total power, otherwise SPLIT.
   * F-FURY-08: Reviewer voting power scales with experience and accuracy (1.0 - 2.0x).
   *
   * @param expectedVerdict For honeypot proofs, the known-correct verdict ('PASS' for a
   *   CLEAN honeypot, 'FAIL' for a BREACH/known-fail honeypot). Defaults to 'FAIL'.
   */
  async evaluate(
    proofId: string,
    votes: FuryVote[],
    isHoneypot: boolean,
    expectedVerdict: Verdict = 'FAIL',
  ): Promise<ConsensusResult> {
    const { votes: uniqueVotes, hasConflictingVerdicts } = normalizeFuryVotes(votes);

    let totalPower = 0;
    let passPower = 0;
    let failPower = 0;

    for (const vote of uniqueVotes) {
      // Fetch Fury history to calculate weight. fury_assignments has no `status`
      // column; an audit is "completed" once it has a verdict on a finalized proof,
      // and "successful" when the verdict matched the proof's final consensus.
      const statsResult = await this.pool.query(
        `SELECT
          COUNT(*) FILTER (WHERE fa.verdict IS NOT NULL AND p.status IN ('VERIFIED', 'REJECTED')) as total_audits,
          COUNT(*) FILTER (WHERE (fa.verdict = 'PASS' AND p.status = 'VERIFIED')
                              OR (fa.verdict = 'FAIL' AND p.status = 'REJECTED')) as successful_audits,
          COUNT(*) FILTER (WHERE fa.verdict = 'FAIL' AND p.status = 'VERIFIED') as false_accusations
         FROM fury_assignments fa
         JOIN proofs p ON fa.proof_id = p.id
         WHERE fa.fury_user_id = $1`,
        [vote.furyUserId]
      );

      const stats = statsResult.rows[0];
      const history: FuryHistory = {
        furyId: vote.furyUserId,
        successfulAudits: parseInt(stats.successful_audits),
        falseAccusations: parseInt(stats.false_accusations),
        totalAudits: parseInt(stats.total_audits),
      };

      const weight = calculateReviewerWeight(history);
      totalPower += weight;

      if (vote.verdict === 'PASS') {
        passPower += weight;
      } else {
        failPower += weight;
      }
    }

    // Distinct voters present a quorum requirement; without enough voters (or with no
    // weighted power at all, or conflicting duplicate verdicts for a reviewer) we
    // cannot make a confident call and must escalate.
    const distinctVoters = uniqueVotes.length;

    let outcome: ConsensusOutcome;
    const THRESHOLD = 0.66; // strictly more than 66% of total power required

    if (hasConflictingVerdicts || totalPower === 0 || distinctVoters < FURY_CONSENSUS_SIZE) {
      // Conflicting duplicate verdicts, empty/zero-weight votes, or sub-quorum → escalate to human judge.
      outcome = 'SPLIT';
    } else if (passPower / totalPower > THRESHOLD) {
      outcome = 'VERIFIED';
    } else if (failPower / totalPower > THRESHOLD) {
      outcome = 'REJECTED';
    } else {
      outcome = 'SPLIT'; // escalate to human judge
    }

    // Honeypot detection: flag Furies whose verdict disagreed with the honeypot's
    // known-correct (expected) verdict — not merely everyone who voted PASS.
    const flaggedFuries: string[] = [];
    if (isHoneypot) {
      for (const vote of uniqueVotes) {
        if (vote.verdict !== expectedVerdict) {
          flaggedFuries.push(vote.furyUserId);
        }
      }
    }

    // Log consensus to TruthLog
    await this.truthLog.appendEvent('CONSENSUS_REACHED', {
      proofId,
      outcome,
      weightedStats: {
        totalPower,
        passPower,
        failPower,
      },
      rawCounts: {
        pass: uniqueVotes.filter(v => v.verdict === 'PASS').length,
        fail: uniqueVotes.filter(v => v.verdict === 'FAIL').length,
      },
      isHoneypot,
      flaggedFuries,
    });

    // NOTE: Bounty/penalty disbursement is owned exclusively by FuryWorker
    // (disburseFuryBounties). The engine no longer pays bounties here — doing so
    // alongside the worker caused a double payout. `bountyDistributed` stays false
    // because this method does not move funds.
    return {
      outcome,
      votes: uniqueVotes,
      weightedStats: { totalPower, passPower, failPower },
      flaggedFuries,
      bountyDistributed: false,
    };
  }
}

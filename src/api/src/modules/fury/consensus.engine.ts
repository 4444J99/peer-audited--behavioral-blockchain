import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { AUDITOR_STAKE_AMOUNT, calculateReviewerWeight, FuryHistory } from '../../../../shared/libs/integrity';

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
  flaggedFuries: string[]; // Furies who passed a honeypot (known-fail)
  bountyDistributed: boolean;
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
   * Aggregates Fury verdicts for a proof using weighted majority (66% power threshold).
   * F-FURY-08: Reviewer voting power scales with experience and accuracy (1.0 - 2.0x).
   */
  async evaluate(
    proofId: string,
    votes: FuryVote[],
    isHoneypot: boolean,
  ): Promise<ConsensusResult> {
    let totalPower = 0;
    let passPower = 0;
    let failPower = 0;

    for (const vote of votes) {
      // Fetch Fury history to calculate weight
      const statsResult = await this.pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE verdict = 'PASS' AND status = 'COMPLETED') as successful_passes,
          COUNT(*) FILTER (WHERE verdict = 'FAIL' AND status = 'COMPLETED') as successful_fails,
          COUNT(*) FILTER (WHERE is_false_accusation = true) as false_accusations,
          COUNT(*) as total_audits
         FROM fury_assignments
         JOIN proofs ON fury_assignments.proof_id = proofs.id
         WHERE fury_user_id = $1`,
        [vote.furyUserId]
      );

      const stats = statsResult.rows[0];
      const history: FuryHistory = {
        furyId: vote.furyUserId,
        successfulAudits: parseInt(stats.successful_passes) + parseInt(stats.successful_fails),
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

    let outcome: ConsensusOutcome;
    const THRESHOLD = 0.66; // 66% of total power required

    if (passPower / totalPower >= THRESHOLD) {
      outcome = 'VERIFIED';
    } else if (failPower / totalPower >= THRESHOLD) {
      outcome = 'REJECTED';
    } else {
      outcome = 'SPLIT'; // escalate to human judge
    }

    // Honeypot detection: flag Furies who incorrectly voted PASS on a known-fail
    const flaggedFuries: string[] = [];
    if (isHoneypot) {
      for (const vote of votes) {
        if (vote.verdict === 'PASS') {
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
        pass: votes.filter(v => v.verdict === 'PASS').length,
        fail: votes.filter(v => v.verdict === 'FAIL').length,
      },
      isHoneypot,
      flaggedFuries,
    });

    let bountyDistributed = false;
    if (outcome !== 'SPLIT') {
      try {
        await this.distributeBounties(proofId, votes, outcome, isHoneypot);
        bountyDistributed = true;
      } catch (e: any) {
        this.logger.error(`Failed to distribute bounties for proof ${proofId}: ${e.message}`);
      }

    }

    return { 
      outcome, 
      votes, 
      weightedStats: { totalPower, passPower, failPower },
      flaggedFuries, 
      bountyDistributed 
    };
  }

  /**
   * Distributes bounties to Furies who voted with the consensus.
   * Correct voters receive AUDITOR_STAKE_AMOUNT from the platform bounty pool.
   * Incorrect voters (especially on honeypots) receive no payout.
   */
  private async distributeBounties(
    proofId: string,
    votes: FuryVote[],
    outcome: ConsensusOutcome,
    isHoneypot: boolean,
  ): Promise<void> {
    // Determine the "correct" vote based on outcome
    const correctVerdict: Verdict = outcome === 'VERIFIED' ? 'PASS' : 'FAIL';

    // Get the platform bounty pool account
    const bountyPoolResult = await this.pool.query(
      `SELECT id FROM accounts WHERE name = 'FURY_BOUNTY_POOL' LIMIT 1`,
    );
    if (bountyPoolResult.rows.length === 0) {
      this.logger.warn('FURY_BOUNTY_POOL account not found — skipping bounty distribution');
      return;
    }
    const bountyPoolAccountId = bountyPoolResult.rows[0].id;

    for (const vote of votes) {
      if (vote.verdict === correctVerdict) {
        // Get Fury's account ID
        const furyResult = await this.pool.query(
          `SELECT account_id FROM users WHERE id = $1`,
          [vote.furyUserId],
        );

        if (furyResult.rows.length > 0 && furyResult.rows[0].account_id) {
          await this.ledger.recordTransaction(
            bountyPoolAccountId,
            furyResult.rows[0].account_id,
            AUDITOR_STAKE_AMOUNT,
            undefined,
            {
              type: 'FURY_BOUNTY_PAYOUT',
              proofId,
              furyUserId: vote.furyUserId,
              verdict: vote.verdict,
              isHoneypot,
            },
          );
        }
      }
    }

    await this.truthLog.appendEvent('BOUNTY_DISTRIBUTED', {
      proofId,
      outcome,
      correctVerdict,
      paidFuries: votes.filter((v) => v.verdict === correctVerdict).map((v) => v.furyUserId),
      bountyPerFury: AUDITOR_STAKE_AMOUNT,
    });
  }
}

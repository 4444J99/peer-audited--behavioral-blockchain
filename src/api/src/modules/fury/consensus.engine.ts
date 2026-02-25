import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { AUDITOR_STAKE_AMOUNT } from '../../../../shared/libs/integrity';

export type Verdict = 'PASS' | 'FAIL';

export interface FuryVote {
  furyUserId: string;
  verdict: Verdict;
}

export type ConsensusOutcome = 'VERIFIED' | 'REJECTED' | 'SPLIT';

export interface ConsensusResult {
  outcome: ConsensusOutcome;
  votes: FuryVote[];
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
   * Aggregates Fury verdicts for a proof using simple majority (2/3 threshold).
   * If the proof is a honeypot, flags Furies who voted PASS on a known-fail.
   * After consensus, distributes bounties to correct voters via LedgerService.
   */
  async evaluate(
    proofId: string,
    votes: FuryVote[],
    isHoneypot: boolean,
  ): Promise<ConsensusResult> {
    const passCount = votes.filter((v) => v.verdict === 'PASS').length;
    const failCount = votes.filter((v) => v.verdict === 'FAIL').length;
    const total = votes.length;

    let outcome: ConsensusOutcome;
    if (passCount >= Math.ceil((total * 2) / 3)) {
      outcome = 'VERIFIED';
    } else if (failCount >= Math.ceil((total * 2) / 3)) {
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
      passCount,
      failCount,
      total,
      isHoneypot,
      flaggedFuries,
    });

    // Distribute bounties (skip for SPLIT — escalated to human judge)
    let bountyDistributed = false;
    if (outcome !== 'SPLIT') {
      try {
        await this.distributeBounties(proofId, votes, outcome, isHoneypot);
        bountyDistributed = true;
      } catch (err) {
        this.logger.error(`Bounty distribution failed for proof ${proofId}: ${(err as Error).message}`);
      }
    }

    return { outcome, votes, flaggedFuries, bountyDistributed };
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

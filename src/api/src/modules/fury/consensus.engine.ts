import { Injectable } from '@nestjs/common';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { FRAUD_PENALTY } from '../../../../shared/libs/integrity';

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
}

@Injectable()
export class ConsensusEngine {
  constructor(private readonly truthLog: TruthLogService) {}

  /**
   * Aggregates Fury verdicts for a proof using simple majority (2/3 threshold).
   * If the proof is a honeypot, flags Furies who voted PASS on a known-fail.
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

    return { outcome, votes, flaggedFuries };
  }
}

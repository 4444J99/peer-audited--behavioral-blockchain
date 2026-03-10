import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Pool } from 'pg';
import {
  MAX_NOCONTACT_DURATION_DAYS,
  MAX_NOCONTACT_TARGETS,
  ABSOLUTE_MAX_ISOLATION_TARGETS,
} from '../../../shared/libs/behavioral-logic';

export interface RecoveryMetadata {
  accountabilityPartnerEmail: string;
  noContactIdentifiers?: string[]; // one-way hashes — Styx never stores plaintext
  acknowledgments: {
    voluntary: boolean;
    noMinors: boolean;
    noDependents: boolean;
    noLegalObligations: boolean;
  };
}

@Injectable()
export class RecoveryProtocolService {
  constructor(private readonly pool: Pool) {}

  /**
   * Theorem 8: Anti-Isolation Guardrails.
   * Checks if the user is attempting to block too many people across all active contracts.
   */
  async checkIsolationRisk(userId: string, newTargetCount: number): Promise<void> {
    const activeContracts = await this.pool.query(
      `SELECT metadata, oath_category FROM contracts 
       WHERE user_id = $1 AND status = 'ACTIVE' 
       AND oath_category IN ('RECOVERY_NOCONTACT', 'RECOVERY_SUBSTANCE', 'RECOVERY_DETOX')`,
      [userId],
    );

    let totalTargets = newTargetCount;
    for (const contract of activeContracts.rows) {
      // No-contact identifiers count directly
      const targets = contract.metadata?.noContactIdentifiers || [];
      totalTargets += targets.length;

      // Substance/Detox oaths count as 1 virtual "isolation point" each
      if (contract.oath_category !== 'RECOVERY_NOCONTACT') {
        totalTargets += 1;
      }
    }

    if (totalTargets > ABSOLUTE_MAX_ISOLATION_TARGETS) {
      throw new HttpException(
        `Theorem 8 Violation: Total behavioral targets (${totalTargets}) exceeds safety limit. Excessive social isolation or psychological burden detected.`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
  }

  /**
   * Validates that a recovery contract meets all ethical guardrails.
   * Throws 406 Not Acceptable on violation (mirrors AegisProtocolService).
   */
  async validateRecoveryContract(
    userId: string,
    oathCategory: string,
    durationDays: number,
    metadata?: RecoveryMetadata,
  ): Promise<boolean> {
    // All RECOVERY_ oaths require metadata
    if (!metadata) {
      throw new HttpException(
        'Recovery contracts require accountability partner and safety acknowledgments.',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    // Mandatory accountability partner for all RECOVERY_ oaths
    if (!metadata.accountabilityPartnerEmail || metadata.accountabilityPartnerEmail.trim() === '') {
      throw new HttpException(
        'Recovery Protocol: An accountability partner email is required for all recovery contracts.',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    // Theorem 8: Validate accountability partner status (must be verified/active)
    const partner = await this.pool.query(
      `SELECT status FROM users WHERE email = $1`,
      [metadata.accountabilityPartnerEmail.toLowerCase()],
    );

    if (partner.rows.length === 0 || partner.rows[0].status !== 'ACTIVE') {
      throw new HttpException(
        'Recovery Protocol: Accountability partner must be an active, registered user. Please ensure they have verified their account.',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    // Duration cap: max 30 days (forces re-evaluation)
    if (durationDays > MAX_NOCONTACT_DURATION_DAYS) {
      throw new HttpException(
        `Recovery Protocol: Maximum contract duration is ${MAX_NOCONTACT_DURATION_DAYS} days. Longer commitments require renewal to ensure ongoing well-being.`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    // No-contact target count cap (RECOVERY_NOCONTACT specific)
    if (oathCategory === 'RECOVERY_NOCONTACT') {
      if (!metadata.noContactIdentifiers || metadata.noContactIdentifiers.length === 0) {
        throw new HttpException(
          'Recovery Protocol: At least one no-contact identifier is required.',
          HttpStatus.NOT_ACCEPTABLE,
        );
      }
      if (metadata.noContactIdentifiers.length > MAX_NOCONTACT_TARGETS) {
        throw new HttpException(
          `Recovery Protocol: Maximum ${MAX_NOCONTACT_TARGETS} no-contact targets per contract to prevent isolation.`,
          HttpStatus.NOT_ACCEPTABLE,
        );
      }

      // Theorem 8: Check global isolation risk across all contracts
      await this.checkIsolationRisk(userId, metadata.noContactIdentifiers.length);
    }

    // Safety acknowledgments — all must be true
    const acks = metadata.acknowledgments;
    if (!acks || !acks.voluntary || !acks.noMinors || !acks.noDependents || !acks.noLegalObligations) {
      throw new HttpException(
        'Recovery Protocol: All safety acknowledgments must be confirmed before contract creation.',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    return true;
  }
}


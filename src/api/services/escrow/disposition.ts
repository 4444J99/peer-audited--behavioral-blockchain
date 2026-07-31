import { JurisdictionTier } from '../geofencing';
import type { StakeDisposition } from '../../src/common/interfaces/payout-provider.interface';

export type { StakeDisposition };

/**
 * Phase Beta P0-011: Refund-only disposition engine.
 *
 * In TIER_2 (REFUND_ONLY) jurisdictions a forfeited stake MUST route back to the user as
 * a refund rather than being captured as platform revenue, which is what keeps the
 * product out of a gambling classification.
 *
 * For contract success: always REFUND (return stake to user).
 * For contract failure:
 *   TIER_1 → CAPTURE (platform revenue)
 *   TIER_2 → REFUND (mandatory user refund)
 *   TIER_3 → should not exist (hard-blocked), but defaults to REFUND for safety
 *
 * This is jurisdiction policy, not rail mechanics — it must produce the same answer
 * whether the stake sits on Stripe or on the internal ledger. It lives here, as one pure
 * function, so every `EscrowProvider` delegates to a single implementation instead of
 * each adapter re-deriving it and drifting.
 */
export function resolveStakeDisposition(
  outcome: 'COMPLETED' | 'FAILED',
  jurisdictionTier: JurisdictionTier,
): StakeDisposition {
  // Successful contracts always return stake to user
  if (outcome === 'COMPLETED') {
    return 'REFUND';
  }

  // Failed contracts: only TIER_1 captures as platform revenue
  if (jurisdictionTier === JurisdictionTier.TIER_1) {
    return 'CAPTURE';
  }

  // TIER_2 and TIER_3: refund-only (P0-011 compliance requirement)
  return 'REFUND';
}

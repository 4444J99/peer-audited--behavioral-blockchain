/**
 * Settlement Quote Logic
 * 
 * CANONICAL TRUTH: This is the single source of truth for payout arithmetic.
 * All settlement paths (worker, preview, audit) MUST use this logic.
 * 
 * POLICY (DR-002, decided 2026-03-10 — docs/planning/planning--founder-decisions-of-record.md):
 * - Success/Refund: 100% to User
 * - Capture: 100% to Platform (Revenue), 0% to Fury Pool (Bounty)
 */

export interface SettlementQuote {
  totalCents: number;
  platformFeeCents: number;
  bountyPoolCents: number;
  userRefundCents: number;
  actualAction: 'RELEASE' | 'CAPTURE';
}

// DR-002: forfeited deposits go entirely to the platform — not redistributed to
// other participants or to a pool. Phase 1 isolates the behavioral hypothesis
// (money at risk + pod visibility + reputation), and a bounty pool adds both
// build complexity and betting/prize ambiguity to a system that has to survive a
// jurisdiction review. Revisit only after completion rates and pod engagement are
// validated; until then this remains the ONLY failed-capture split allowed in
// code, so payout math cannot drift by path.
//
// Every consumer already guards on `bountyPoolCents > 0` (settlement.worker.ts,
// contracts.service.ts, stripe-fbo.service.ts), so a rate of 0 writes no bounty
// ledger entry and issues no zero-amount Stripe transfer.
export const FAILED_CAPTURE_BOUNTY_POOL_RATE = 0;

export function buildSettlementQuote(
  amountCents: number,
  outcome: 'PASS' | 'FAIL',
  dispositionMode?: 'CAPTURE' | 'REFUND',
): SettlementQuote {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error('Settlement amounts must be non-negative integer cents.');
  }

  const shouldRelease = outcome === 'PASS' || dispositionMode === 'REFUND';

  if (shouldRelease) {
    return {
      totalCents: amountCents,
      platformFeeCents: 0,
      bountyPoolCents: 0,
      userRefundCents: amountCents,
      actualAction: 'RELEASE',
    };
  }

  const bountyPoolCents = Math.round(amountCents * FAILED_CAPTURE_BOUNTY_POOL_RATE);
  return {
    totalCents: amountCents,
    platformFeeCents: amountCents - bountyPoolCents,
    bountyPoolCents,
    userRefundCents: 0,
    actualAction: 'CAPTURE',
  };
}

/**
 * Split a bounty pool across Furies so NO cents are lost to flooring: everyone gets
 * the base share, and the leftover remainder cents are handed out one each to the
 * first `remainder` Furies in the given (deterministic) order.
 *
 * Under DR-002 the pool is always 0 and every entry comes back 0, so callers skip
 * the payout entirely. This lives here — beside the arithmetic it belongs to, and
 * tested directly — so the distribution stays correct and covered while the rate is
 * zero, ready for the day a community pool is reintroduced.
 */
export function distributeBountyPool(poolCents: number, furyCount: number): number[] {
  if (!Number.isInteger(poolCents) || poolCents < 0) {
    throw new Error('Settlement amounts must be non-negative integer cents.');
  }
  if (!Number.isInteger(furyCount) || furyCount < 0) {
    throw new Error('Fury count must be a non-negative integer.');
  }
  if (furyCount === 0) return [];

  const base = Math.floor(poolCents / furyCount);
  const remainder = poolCents - base * furyCount;
  return Array.from({ length: furyCount }, (_, i) => base + (i < remainder ? 1 : 0));
}

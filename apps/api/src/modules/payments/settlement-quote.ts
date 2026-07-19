/**
 * Settlement Quote Logic
 * 
 * CANONICAL TRUTH: This is the single source of truth for payout arithmetic.
 * All settlement paths (worker, preview, audit) MUST use this logic.
 * 
 * PROVISIONAL POLICY (Pending Jessica decision):
 * - Success/Refund: 100% to User
 * - Capture: 80% to Platform (Revenue), 20% to Fury Pool (Bounty)
 */

export interface SettlementQuote {
  totalCents: number;
  platformFeeCents: number;
  bountyPoolCents: number;
  userRefundCents: number;
  actualAction: 'RELEASE' | 'CAPTURE';
}

// Provisional until Jessica locks the launch economics. This remains the only
// failed-capture split allowed in code so payout math cannot drift by path.
export const PROVISIONAL_FAILED_CAPTURE_BOUNTY_POOL_RATE = 0.2;

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

  const bountyPoolCents = Math.round(amountCents * PROVISIONAL_FAILED_CAPTURE_BOUNTY_POOL_RATE);
  return {
    totalCents: amountCents,
    platformFeeCents: amountCents - bountyPoolCents,
    bountyPoolCents,
    userRefundCents: 0,
    actualAction: 'CAPTURE',
  };
}

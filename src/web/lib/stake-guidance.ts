/**
 * Endowed-progress dynamic downscaling, surfaced as stake-selection guidance.
 *
 * `EndowedProgressService.applyDynamicDownscaling` derives a multiplier below 1
 * when a user carries prior violations, or is inside the weekend stretch of the
 * final 30% of a contract. It is returned by
 * GET /behavioral/retention/endowed-progress/:contractId.
 *
 * The multiplier is deliberately NOT applied to the stake. Doing so would change
 * what is actually held on a user's card, and this repo has no decision of record
 * covering stake pricing at all — five monetization models are live in shipped
 * code and pricing is a joint founder call under DR-007. So the signal is
 * rendered as advice next to the amount the user chooses, and the number they
 * submit is the number they picked.
 */

export interface DownscalingSignal {
  multiplier: number;
  reason: string;
}

export interface StakeGuidance {
  /** The downscale factor the behavioral engine derived, e.g. 0.9. */
  multiplier: number;
  /** Human-readable cause, straight from the service ("2 prior violation(s)"). */
  reason: string;
  /** What the selected stake would be if the multiplier were applied. */
  suggestedStakeUsd: number;
  /** Whole-percent reduction, for copy that reads as guidance rather than math. */
  reductionPercent: number;
}

/** A contract row as `api.getUserContracts()` returns it. */
export interface ContractSummary {
  id: string;
  status: string;
  created_at: string;
}

/**
 * The downscaling signal is contract-scoped, so guidance for a NEW contract is
 * read off the user's current one. Most recent by created_at, since a user may
 * hold several.
 */
export function findMostRecentActiveContract<T extends ContractSummary>(
  contracts: T[],
): T | null {
  const active = contracts.filter((contract) => contract.status === 'ACTIVE');
  if (active.length === 0) return null;

  return active.reduce((latest, contract) =>
    Date.parse(contract.created_at) > Date.parse(latest.created_at)
      ? contract
      : latest,
  );
}

/**
 * Returns null when there is nothing worth saying — no signal, a multiplier of
 * 1.0 ("no downscaling applied"), a non-finite or out-of-range value, or a stake
 * of zero. Callers render nothing rather than an empty advisory panel.
 */
export function deriveStakeGuidance(
  downscaling: DownscalingSignal | null | undefined,
  selectedStakeUsd: number,
): StakeGuidance | null {
  if (!downscaling) return null;

  const { multiplier, reason } = downscaling;
  if (!Number.isFinite(multiplier) || multiplier <= 0 || multiplier >= 1) {
    return null;
  }
  if (!Number.isFinite(selectedStakeUsd) || selectedStakeUsd <= 0) return null;

  return {
    multiplier,
    reason,
    suggestedStakeUsd: Math.round(selectedStakeUsd * multiplier * 100) / 100,
    reductionPercent: Math.round((1 - multiplier) * 100),
  };
}

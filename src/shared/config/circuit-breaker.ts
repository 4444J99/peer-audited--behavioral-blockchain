/**
 * Oracle Circuit Breaker Configuration
 *
 * Safety mechanism that pauses contract countdowns when oracle/verification
 * systems experience outages, preventing unfair user penalties.
 */

export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export enum OracleService {
  R2_STORAGE = "R2_STORAGE",
  BULLMQ_QUEUE = "BULLMQ_QUEUE",
  HEALTHKIT_API = "HEALTHKIT_API",
  FURY_NETWORK = "FURY_NETWORK",
  STRIPE_FBO = "STRIPE_FBO",
}

export interface CircuitBreakerConfig {
  service: OracleService;
  failureThreshold: number;
  recoveryTimeoutMs: number;
  halfOpenMaxRequests: number;
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIGS: Record<
  OracleService,
  CircuitBreakerConfig
> = {
  [OracleService.R2_STORAGE]: {
    service: OracleService.R2_STORAGE,
    failureThreshold: 3,
    recoveryTimeoutMs: 60_000,
    halfOpenMaxRequests: 5,
  },
  [OracleService.BULLMQ_QUEUE]: {
    service: OracleService.BULLMQ_QUEUE,
    failureThreshold: 5,
    recoveryTimeoutMs: 120_000,
    halfOpenMaxRequests: 3,
  },
  [OracleService.HEALTHKIT_API]: {
    service: OracleService.HEALTHKIT_API,
    failureThreshold: 3,
    recoveryTimeoutMs: 300_000,
    halfOpenMaxRequests: 2,
  },
  [OracleService.FURY_NETWORK]: {
    service: OracleService.FURY_NETWORK,
    failureThreshold: 10,
    recoveryTimeoutMs: 600_000,
    halfOpenMaxRequests: 3,
  },
  [OracleService.STRIPE_FBO]: {
    service: OracleService.STRIPE_FBO,
    failureThreshold: 3,
    recoveryTimeoutMs: 120_000,
    halfOpenMaxRequests: 2,
  },
};

export const CIRCUIT_BREAKER_PAUSABLE_COUNTDOWN_ENABLED = true;

export const MAX_CONTRACT_PAUSE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export enum OracleFallbackMode {
  INACTIVE = "INACTIVE",
  ARBITER_REVIEW = "ARBITER_REVIEW",
  STANDING_DOWN = "STANDING_DOWN",
}

export interface OracleFailureFallbackConfig {
  /** Extended outage duration before human arbiters become eligible. */
  activationThresholdMs: number;
  /** Minimum extra bond required for Master Furies to join the arbiter pool. */
  minimumArbiterBondUsd: number;
  /** Number of independent arbiters assigned to each proof during outage mode. */
  arbitersPerProof: number;
  /** Outage compensation multiplier relative to the standard Fury bounty. */
  outageBountyMultiplier: number;
  /** Required automated-oracle recovery streak before fallback mode stands down. */
  recoveryConfirmationsRequired: number;
}

export interface OracleFallbackStatusInput {
  circuitState: CircuitState;
  outageStartedAtMs?: number | null;
  nowMs: number;
  recoveryConfirmations?: number;
}

export interface OracleFallbackStatus {
  mode: OracleFallbackMode;
  active: boolean;
  reason: string;
}

export const DEFAULT_ORACLE_FAILURE_FALLBACK_CONFIG: OracleFailureFallbackConfig = {
  activationThresholdMs: 2 * 60 * 60 * 1000, // 2 hours
  minimumArbiterBondUsd: 50,
  arbitersPerProof: 3,
  outageBountyMultiplier: 3,
  recoveryConfirmationsRequired: 2,
};

export function resolveOracleFailureFallbackStatus(
  input: OracleFallbackStatusInput,
  config: OracleFailureFallbackConfig = DEFAULT_ORACLE_FAILURE_FALLBACK_CONFIG,
): OracleFallbackStatus {
  if (input.circuitState === CircuitState.CLOSED) {
    return {
      mode: OracleFallbackMode.INACTIVE,
      active: false,
      reason: "Automated oracle circuit is healthy",
    };
  }

  if (input.circuitState === CircuitState.HALF_OPEN) {
    const confirmations = input.recoveryConfirmations ?? 0;
    if (confirmations >= config.recoveryConfirmationsRequired) {
      return {
        mode: OracleFallbackMode.STANDING_DOWN,
        active: false,
        reason: "Automated oracle recovery confirmed; arbiter fallback standing down",
      };
    }
    return {
      mode: OracleFallbackMode.ARBITER_REVIEW,
      active: true,
      reason: "Automated oracle recovery is still being verified",
    };
  }

  if (!input.outageStartedAtMs) {
    return {
      mode: OracleFallbackMode.INACTIVE,
      active: false,
      reason: "Circuit is open but outage start time is unknown",
    };
  }

  const outageDurationMs = Math.max(0, input.nowMs - input.outageStartedAtMs);
  if (outageDurationMs < config.activationThresholdMs) {
    return {
      mode: OracleFallbackMode.INACTIVE,
      active: false,
      reason: "Circuit breaker pause has not exceeded arbiter fallback threshold",
    };
  }

  return {
    mode: OracleFallbackMode.ARBITER_REVIEW,
    active: true,
    reason: "Extended oracle outage requires staked arbiter fallback review",
  };
}

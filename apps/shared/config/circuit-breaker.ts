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

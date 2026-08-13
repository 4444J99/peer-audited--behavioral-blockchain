import {
  CircuitState,
  DEFAULT_ORACLE_FAILURE_FALLBACK_CONFIG,
  OracleFallbackMode,
  resolveOracleFailureFallbackStatus,
} from "./circuit-breaker";

describe("oracle failure fallback", () => {
  const nowMs = Date.parse("2026-07-19T00:00:00Z");

  it("keeps arbiter fallback inactive before the extended outage threshold", () => {
    const status = resolveOracleFailureFallbackStatus({
      circuitState: CircuitState.OPEN,
      outageStartedAtMs: nowMs - DEFAULT_ORACLE_FAILURE_FALLBACK_CONFIG.activationThresholdMs + 1,
      nowMs,
    });

    expect(status).toMatchObject({
      active: false,
      mode: OracleFallbackMode.INACTIVE,
    });
  });

  it("activates staked arbiter review after an extended oracle outage", () => {
    const status = resolveOracleFailureFallbackStatus({
      circuitState: CircuitState.OPEN,
      outageStartedAtMs: nowMs - DEFAULT_ORACLE_FAILURE_FALLBACK_CONFIG.activationThresholdMs,
      nowMs,
    });

    expect(status).toMatchObject({
      active: true,
      mode: OracleFallbackMode.ARBITER_REVIEW,
    });
    expect(DEFAULT_ORACLE_FAILURE_FALLBACK_CONFIG).toMatchObject({
      minimumArbiterBondUsd: 50,
      arbitersPerProof: 3,
      outageBountyMultiplier: 3,
    });
  });

  it("stands down after automated oracle recovery is confirmed", () => {
    const status = resolveOracleFailureFallbackStatus({
      circuitState: CircuitState.HALF_OPEN,
      nowMs,
      recoveryConfirmations: DEFAULT_ORACLE_FAILURE_FALLBACK_CONFIG.recoveryConfirmationsRequired,
    });

    expect(status).toMatchObject({
      active: false,
      mode: OracleFallbackMode.STANDING_DOWN,
    });
  });
});

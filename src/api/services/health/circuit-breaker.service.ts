import {
  CircuitState,
  OracleService,
  DEFAULT_CIRCUIT_BREAKER_CONFIGS,
  CircuitBreakerConfig,
  MAX_CONTRACT_PAUSE_DURATION_MS,
} from "../../../shared/config/circuit-breaker";

interface ServiceCircuitState {
  state: CircuitState;
  failureCount: number;
  lastFailureAt: number | null;
  lastSuccessAt: number | null;
  openedAt: number | null;
  halfOpenRequestCount: number;
}

export class CircuitBreakerService {
  private circuits: Map<OracleService, ServiceCircuitState> = new Map();
  private globalKillSwitch = false;
  private pausedContractIds: Set<string> = new Set();
  private pauseStartTimes: Map<string, number> = new Map();

  constructor() {
    for (const service of Object.values(OracleService)) {
      this.circuits.set(service, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        lastFailureAt: null,
        lastSuccessAt: null,
        openedAt: null,
        halfOpenRequestCount: 0,
      });
    }
  }

  getConfig(service: OracleService): CircuitBreakerConfig {
    return DEFAULT_CIRCUIT_BREAKER_CONFIGS[service];
  }

  getState(service: OracleService): CircuitState {
    return this.circuits.get(service)?.state ?? CircuitState.CLOSED;
  }

  isAvailable(service: OracleService): boolean {
    if (this.globalKillSwitch) return false;
    const circuit = this.circuits.get(service);
    if (!circuit) return true;

    if (circuit.state === CircuitState.OPEN) {
      const config = this.getConfig(service);
      if (
        circuit.openedAt &&
        Date.now() - circuit.openedAt > config.recoveryTimeoutMs
      ) {
        circuit.state = CircuitState.HALF_OPEN;
        circuit.halfOpenRequestCount = 0;
        return true;
      }
      return false;
    }

    return true;
  }

  recordSuccess(service: OracleService): void {
    const circuit = this.circuits.get(service);
    if (!circuit) return;

    circuit.lastSuccessAt = Date.now();

    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.halfOpenRequestCount++;
      const config = this.getConfig(service);
      if (circuit.halfOpenRequestCount >= config.halfOpenMaxRequests) {
        circuit.state = CircuitState.CLOSED;
        circuit.failureCount = 0;
      }
    }

    if (circuit.state === CircuitState.CLOSED) {
      circuit.failureCount = 0;
    }
  }

  recordFailure(service: OracleService): CircuitState {
    const circuit = this.circuits.get(service);
    if (!circuit) return CircuitState.CLOSED;

    circuit.failureCount++;
    circuit.lastFailureAt = Date.now();

    const config = this.getConfig(service);
    if (circuit.failureCount >= config.failureThreshold) {
      circuit.state = CircuitState.OPEN;
      circuit.openedAt = Date.now();
      circuit.halfOpenRequestCount = 0;
    }

    return circuit.state;
  }

  setGlobalKillSwitch(enabled: boolean): void {
    this.globalKillSwitch = enabled;
  }

  isGlobalKillSwitchActive(): boolean {
    return this.globalKillSwitch;
  }

  pauseContract(contractId: string): boolean {
    if (this.pausedContractIds.has(contractId)) return false;
    this.pausedContractIds.add(contractId);
    this.pauseStartTimes.set(contractId, Date.now());
    return true;
  }

  resumeContract(contractId: string): boolean {
    if (!this.pausedContractIds.has(contractId)) return false;
    this.pausedContractIds.delete(contractId);
    this.pauseStartTimes.delete(contractId);
    return true;
  }

  isContractPaused(contractId: string): boolean {
    if (!this.pausedContractIds.has(contractId)) return false;

    const startedAt = this.pauseStartTimes.get(contractId);
    if (startedAt && Date.now() - startedAt > MAX_CONTRACT_PAUSE_DURATION_MS) {
      this.resumeContract(contractId);
      return false;
    }

    return true;
  }

  getPausedContractIds(): string[] {
    return Array.from(this.pausedContractIds);
  }

  getCircuitSummary(): Record<
    OracleService,
    { state: CircuitState; failureCount: number }
  > {
    const summary: Record<string, any> = {};
    for (const [service, circuit] of this.circuits.entries()) {
      summary[service] = {
        state: circuit.state,
        failureCount: circuit.failureCount,
      };
    }
    return summary as Record<
      OracleService,
      { state: CircuitState; failureCount: number }
    >;
  }

  resetAll(): void {
    for (const service of Object.values(OracleService)) {
      this.circuits.set(service, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        lastFailureAt: null,
        lastSuccessAt: null,
        openedAt: null,
        halfOpenRequestCount: 0,
      });
    }
    this.globalKillSwitch = false;
    this.pausedContractIds.clear();
    this.pauseStartTimes.clear();
  }
}

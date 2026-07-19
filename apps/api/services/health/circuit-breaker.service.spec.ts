import { CircuitBreakerService } from "./circuit-breaker.service";
import {
  CircuitState,
  OracleService,
} from "../../../shared/config/circuit-breaker";

describe("CircuitBreakerService", () => {
  let cb: CircuitBreakerService;

  beforeEach(() => {
    cb = new CircuitBreakerService();
  });

  describe("initial state", () => {
    it("should start all circuits as CLOSED", () => {
      for (const service of Object.values(OracleService)) {
        expect(cb.getState(service)).toBe(CircuitState.CLOSED);
      }
    });

    it("should have global kill switch off", () => {
      expect(cb.isGlobalKillSwitchActive()).toBe(false);
    });
  });

  describe("isAvailable", () => {
    it("should return true for CLOSED circuits", () => {
      expect(cb.isAvailable(OracleService.R2_STORAGE)).toBe(true);
    });

    it("should return false when global kill switch is active", () => {
      cb.setGlobalKillSwitch(true);
      expect(cb.isAvailable(OracleService.R2_STORAGE)).toBe(false);
    });

    it("should open circuit after threshold failures", () => {
      const service = OracleService.R2_STORAGE;
      for (let i = 0; i < 3; i++) {
        cb.recordFailure(service);
      }
      expect(cb.getState(service)).toBe(CircuitState.OPEN);
      expect(cb.isAvailable(service)).toBe(false);
    });

    it("should transition to HALF_OPEN after recovery timeout", async () => {
      const service = OracleService.R2_STORAGE;
      for (let i = 0; i < 3; i++) {
        cb.recordFailure(service);
      }
      expect(cb.getState(service)).toBe(CircuitState.OPEN);

      // Mock time: advance past recovery timeout
      const circuit = (cb as any).circuits.get(service);
      circuit.openedAt = Date.now() - 61_000;

      expect(cb.isAvailable(service)).toBe(true);
      expect(cb.getState(service)).toBe(CircuitState.HALF_OPEN);
    });
  });

  describe("recordSuccess", () => {
    it("should reset failure count on success in CLOSED state", () => {
      const service = OracleService.STRIPE_FBO;
      cb.recordFailure(service);
      cb.recordFailure(service);
      expect((cb as any).circuits.get(service).failureCount).toBe(2);

      cb.recordSuccess(service);
      expect((cb as any).circuits.get(service).failureCount).toBe(0);
    });

    it("should transition HALF_OPEN to CLOSED after enough successes", () => {
      const service = OracleService.R2_STORAGE;
      for (let i = 0; i < 3; i++) {
        cb.recordFailure(service);
      }
      const circuit = (cb as any).circuits.get(service);
      circuit.openedAt = Date.now() - 61_000;
      cb.isAvailable(service);

      for (let i = 0; i < 5; i++) {
        cb.recordSuccess(service);
      }
      expect(cb.getState(service)).toBe(CircuitState.CLOSED);
    });
  });

  describe("contract pausing", () => {
    it("should pause and resume contracts", () => {
      expect(cb.pauseContract("contract-1")).toBe(true);
      expect(cb.isContractPaused("contract-1")).toBe(true);

      expect(cb.resumeContract("contract-1")).toBe(true);
      expect(cb.isContractPaused("contract-1")).toBe(false);
    });

    it("should not double-pause", () => {
      cb.pauseContract("contract-1");
      expect(cb.pauseContract("contract-1")).toBe(false);
    });

    it("should list paused contract IDs", () => {
      cb.pauseContract("a");
      cb.pauseContract("b");
      expect(cb.getPausedContractIds()).toContain("a");
      expect(cb.getPausedContractIds()).toContain("b");
    });

    it("should auto-expire paused contracts after max duration", () => {
      cb.pauseContract("contract-1");
      const startTimes = (cb as any).pauseStartTimes;
      startTimes.set("contract-1", Date.now() - 25 * 60 * 60 * 1000);

      expect(cb.isContractPaused("contract-1")).toBe(false);
    });
  });

  describe("getCircuitSummary", () => {
    it("should return all service states", () => {
      cb.recordFailure(OracleService.R2_STORAGE);
      const summary = cb.getCircuitSummary();
      expect(summary[OracleService.R2_STORAGE].failureCount).toBe(1);
      expect(summary[OracleService.R2_STORAGE].state).toBe(CircuitState.CLOSED);
    });
  });

  describe("resetAll", () => {
    it("should reset everything to initial state", () => {
      cb.recordFailure(OracleService.R2_STORAGE);
      cb.setGlobalKillSwitch(true);
      cb.pauseContract("abc");

      cb.resetAll();

      expect(cb.getState(OracleService.R2_STORAGE)).toBe(CircuitState.CLOSED);
      expect(cb.isGlobalKillSwitchActive()).toBe(false);
      expect(cb.getPausedContractIds()).toHaveLength(0);
    });
  });
});

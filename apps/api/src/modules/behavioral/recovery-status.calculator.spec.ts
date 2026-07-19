import { Test, TestingModule } from "@nestjs/testing";
import { RecoveryStatusCalculator } from "./recovery-status.calculator";

describe("RecoveryStatusCalculator", () => {
  let calculator: RecoveryStatusCalculator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecoveryStatusCalculator],
    }).compile();
    calculator = module.get<RecoveryStatusCalculator>(RecoveryStatusCalculator);
  });

  it("computes days remaining and a non-zero loss velocity for a mid-life contract", () => {
    const start = new Date(Date.now() - 5 * 86_400_000);
    const result = calculator.getStatus({
      id: "c-1",
      startDate: start,
      durationDays: 30,
      baseVolatility: 0.5,
    });
    expect(result.contractId).toBe("c-1");
    expect(result.daysRemaining).toBeGreaterThan(20);
    expect(result.daysRemaining).toBeLessThanOrEqual(25);
    expect(result.lossVelocity).toBeGreaterThan(0);
    expect(result.riskLevel).toMatch(/^(LOW|MEDIUM|HIGH)$/);
  });

  it("clamps daysRemaining to 0 for an expired contract", () => {
    const result = calculator.getStatus({
      id: "c-2",
      startDate: new Date(Date.now() - 60 * 86_400_000),
      durationDays: 30,
      baseVolatility: 0.5,
    });
    expect(result.daysRemaining).toBe(0);
  });

  it("scales the penalty multiplier with baseVolatility", () => {
    const low = calculator.getStatus({
      id: "c-3",
      startDate: new Date(),
      durationDays: 30,
      baseVolatility: 0.1,
    });
    const high = calculator.getStatus({
      id: "c-4",
      startDate: new Date(),
      durationDays: 30,
      baseVolatility: 5.0,
    });
    expect(high.currentMultiplier).toBeGreaterThan(low.currentMultiplier);
  });
});
